'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
    Loader2, 
    ArrowLeft, 
    Plus, 
    Trash2, 
    Edit2, 
    Mail, 
    Copy, 
    Send, 
    Sparkles, 
    Search, 
    Eye, 
    RefreshCw,
    Layers
} from 'lucide-react';
import { getTemplates, deleteTemplate, saveTemplate, EmailTemplate } from '@/actions/email-templates';
import { EmailMarketingComposer } from './EmailMarketingComposer';

interface EmailMarketingManagerProps {
    clientId?: string;
    onBack: () => void;
}

export function EmailMarketingManager({ clientId, onBack }: EmailMarketingManagerProps) {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'my-campaigns' | 'default-templates'>('my-campaigns');
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            // Fetch templates for this client (returns global templates + client-owned templates)
            const data = await getTemplates(false, clientId);
            if (data && Array.isArray(data)) {
                // Filter only email marketing templates
                const emailMktTemplates = data.filter(t => t.category === 'email_marketing' || t.category === 'marketing');
                setTemplates(emailMktTemplates);
            }
        } catch (error) {
            console.error('Error loading templates:', error);
            toast({
                title: "Error",
                description: "No se pudieron cargar las plantillas de Email Marketing.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, [clientId]);

    const handleCreateCampaign = async () => {
        if (!clientId) {
            toast({
                title: "Error",
                description: "No se puede crear una campaña sin un identificador de cliente.",
                variant: "destructive"
            });
            return;
        }

        setIsActionLoading('create');
        try {
            const newTemplate: EmailTemplate = {
                name: 'Nueva Campaña de Email',
                category: 'email_marketing',
                clientId: clientId,
                versions: {
                    es: {
                        subject: 'Nueva Campaña de Email',
                        body: 'Hola {{Nombre}},\n\nEscribe aquí el contenido de tu campaña...'
                    }
                },
                variables: ['Nombre', 'Empresa', 'Tu Nombre']
            };

            const saved = await saveTemplate(newTemplate);
            toast({
                title: "Campaña creada",
                description: "Tu nueva campaña ha sido creada con éxito.",
                className: "bg-green-600 text-white"
            });
            
            // Reload templates list and open composer
            await loadTemplates();
            setSelectedTemplate(saved);
        } catch (error) {
            console.error("Error creating campaign:", error);
            toast({
                title: "Error",
                description: "No se pudo crear la campaña.",
                variant: "destructive"
            });
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleCloneTemplate = async (original: EmailTemplate) => {
        if (!clientId) {
            toast({
                title: "Error",
                description: "No se puede clonar sin un identificador de cliente.",
                variant: "destructive"
            });
            return;
        }

        setIsActionLoading(original.id || 'clone');
        try {
            const cloned: EmailTemplate = {
                name: `[Copia] ${original.name}`,
                category: original.category,
                clientId: clientId,
                versions: JSON.parse(JSON.stringify(original.versions)), // Deep copy versions
                variables: [...(original.variables || [])],
                images: original.images ? [...original.images] : undefined,
                imageUrl: original.imageUrl,
                rewardAmount: original.rewardAmount || 10
            };

            const saved = await saveTemplate(cloned);
            toast({
                title: "Campaña personalizada",
                description: "Plantilla clonada con éxito en 'Mis Campañas'.",
                className: "bg-purple-600 text-white"
            });

            await loadTemplates();
            setActiveTab('my-campaigns');
            setSelectedTemplate(saved);
        } catch (error) {
            console.error("Error cloning template:", error);
            toast({
                title: "Error al clonar",
                description: "No se pudo personalizar la plantilla.",
                variant: "destructive"
            });
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar la campaña "${name}"?`)) return;

        setIsActionLoading(id);
        try {
            await deleteTemplate(id);
            toast({
                title: "Campaña eliminada",
                description: "La campaña se ha eliminado correctamente."
            });
            await loadTemplates();
        } catch (error) {
            console.error("Error deleting template:", error);
            toast({
                title: "Error",
                description: "No se pudo eliminar la campaña.",
                variant: "destructive"
            });
        } finally {
            setIsActionLoading(null);
        }
    };

    // Filter templates based on current tab and search query
    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            Object.values(template.versions).some(v => v.subject.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        if (activeTab === 'my-campaigns') {
            // Only templates owned by this client
            return template.clientId === clientId;
        } else {
            // Global default templates (clientId is null/undefined/empty)
            return !template.clientId;
        }
    });

    if (selectedTemplate) {
        return (
            <EmailMarketingComposer 
                template={selectedTemplate} 
                clientId={clientId}
                isAdmin={false}
                onBack={async () => {
                    setSelectedTemplate(null);
                    await loadTemplates();
                }}
            />
        );
    }

    return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <Button variant="ghost" size="sm" className="pl-0 hover:pl-2 transition-all mb-2" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio
                    </Button>
                    <h2 className="text-3xl font-bold tracking-tight">SaaS Email Marketing</h2>
                    <p className="text-muted-foreground mt-1">
                        Crea campañas personalizadas o utiliza nuestras plantillas predeterminadas de red.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={loadTemplates} disabled={isLoading} className="bg-white border-slate-200 shadow-sm h-10 w-10 rounded-xl">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button 
                        onClick={handleCreateCampaign} 
                        disabled={isActionLoading !== null}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 h-10 gap-2 px-5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isActionLoading === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Crear Campaña
                    </Button>
                </div>
            </div>

            {/* Main Tabs */}
            <Tabs 
                value={activeTab} 
                onValueChange={(v) => setActiveTab(v as 'my-campaigns' | 'default-templates')}
                className="w-full"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-1">
                    <TabsList className="bg-slate-100 p-1 rounded-xl h-12 w-full md:w-auto">
                        <TabsTrigger 
                            value="my-campaigns"
                            className="rounded-lg h-10 px-6 font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                        >
                            Mis Campañas ({templates.filter(t => t.clientId === clientId).length})
                        </TabsTrigger>
                        <TabsTrigger 
                            value="default-templates"
                            className="rounded-lg h-10 px-6 font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                        >
                            Plantillas Predeterminadas ({templates.filter(t => !t.clientId).length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por título o asunto..."
                            className="pl-10 h-11 bg-white border-slate-200 rounded-xl text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="pt-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                            <p className="text-sm text-muted-foreground font-medium animate-pulse">Cargando plantillas de marketing...</p>
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 border-dashed rounded-2xl p-8 max-w-lg mx-auto">
                            <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                {activeTab === 'my-campaigns' ? 'No tienes campañas creadas' : 'No hay plantillas predeterminadas'}
                            </h3>
                            <p className="text-sm text-slate-500 mt-2">
                                {activeTab === 'my-campaigns' 
                                    ? 'Crea una campaña nueva o dirígete a las Plantillas Predeterminadas para personalizar y empezar a enviar.' 
                                    : 'Las plantillas del sistema se cargarán en breve.'}
                            </p>
                            {activeTab === 'my-campaigns' && (
                                <Button 
                                    onClick={handleCreateCampaign}
                                    className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20"
                                >
                                    Crear mi Primera Campaña
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTemplates.map((template) => {
                                const defaultVersion = template.versions['es'] || template.versions['en'] || Object.values(template.versions)[0];
                                const hasImage = template.imageUrl || (template.images && template.images.length > 0);
                                const imageSrc = template.imageUrl || template.images?.[0] || 'https://placehold.co/600x400/png?text=No+Image';

                                return (
                                    <Card 
                                        key={template.id} 
                                        className="group overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-950 flex flex-col h-full rounded-2xl"
                                    >
                                        {/* Card Banner Image */}
                                        <div className="relative h-44 bg-slate-50 dark:bg-slate-900 border-b border-slate-50 overflow-hidden">
                                            {hasImage ? (
                                                <img 
                                                    src={imageSrc} 
                                                    alt={template.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2">
                                                    <Mail className="h-10 w-10 stroke-1 opacity-40" />
                                                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Sin Imagen</span>
                                                </div>
                                            )}

                                            {/* Badges Overlay */}
                                            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                                                {template.clientId ? (
                                                    <Badge className="bg-purple-500 text-white border-0 font-bold text-[10px] tracking-wide uppercase px-2 py-0.5 shadow-sm">
                                                        Personalizado
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-slate-600 text-white border-0 font-bold text-[10px] tracking-wide uppercase px-2 py-0.5 shadow-sm">
                                                        Plantilla Base
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="absolute top-3 right-3 z-10">
                                                <Badge className="bg-white/95 dark:bg-slate-900/90 text-purple-700 dark:text-purple-400 border border-purple-100 font-bold text-[10px] px-2 py-0.5 shadow-sm">
                                                    +{template.rewardAmount || 10} DP
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <CardHeader className="p-5 pb-3 flex-1">
                                            <CardTitle className="text-lg font-bold leading-snug line-clamp-1 group-hover:text-purple-600 transition-colors">
                                                {template.name}
                                            </CardTitle>
                                            <CardDescription className="line-clamp-2 text-xs mt-1 text-slate-600 dark:text-slate-400">
                                                {defaultVersion?.subject || 'Sin asunto'}
                                            </CardDescription>
                                        </CardHeader>

                                        {/* Languages Badge and Info */}
                                        <CardContent className="px-5 pb-4 pt-0">
                                            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-50 dark:border-slate-900 pt-3">
                                                <span className="font-semibold uppercase tracking-wider text-slate-500">Idiomas:</span>
                                                <div className="flex gap-1">
                                                    {Object.keys(template.versions).map(lang => (
                                                        <span 
                                                            key={lang} 
                                                            className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[9px] text-slate-600 dark:text-slate-300 uppercase"
                                                        >
                                                            {lang}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>

                                        {/* Footer Actions */}
                                        <CardFooter className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-2">
                                            {activeTab === 'my-campaigns' ? (
                                                <>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg h-9 w-9 p-0"
                                                        onClick={() => handleDelete(template.id!, template.name)}
                                                        disabled={isActionLoading === template.id}
                                                    >
                                                        {isActionLoading === template.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => setSelectedTemplate(template)}
                                                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg h-9 px-4 text-xs font-bold gap-1.5 shadow-sm"
                                                    >
                                                        <Edit2 className="h-3 w-3" /> Editar
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => setSelectedTemplate(template)}
                                                        className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg h-9 px-4 text-xs font-bold gap-1.5 bg-white hover:bg-slate-50 shadow-sm"
                                                    >
                                                        <Eye className="h-3 w-3 text-slate-400" /> Vista Previa
                                                    </Button>

                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => handleCloneTemplate(template)}
                                                        disabled={isActionLoading === template.id}
                                                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg h-9 px-4 text-xs font-bold gap-1.5 shadow-sm"
                                                    >
                                                        {isActionLoading === template.id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Sparkles className="h-3.5 w-3.5" />
                                                        )}
                                                        Personalizar
                                                    </Button>
                                                </>
                                            )}
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Tabs>
        </div>
    );
}
