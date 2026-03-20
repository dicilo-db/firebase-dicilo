'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getTemplates, EmailTemplate } from '@/actions/email-templates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Mail, LayoutTemplate, Sparkles, Languages, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EmailMarketingComposer } from '@/components/ads-manager/EmailMarketingComposer';
import { useToast } from '@/hooks/use-toast';
import { useDashboardData } from '@/hooks/useDashboardData';

export function MarketingTemplatesView() {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const { isAdmin } = useDashboardData();

    useEffect(() => {
        async function load() {
            setIsLoading(true);
            try {
                const data = await getTemplates();
                if (data && Array.isArray(data)) {
                    // Filter by marketing email category only
                    const filtered = data.filter(t => t.category === 'email_marketing');
                    setTemplates(filtered);
                } else {
                    console.warn('getTemplates returned no data or invalid format:', data);
                    setTemplates([]);
                }
            } catch (error) {
                console.error('Error loading marketing templates:', error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar las plantillas de marketing.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [toast]);

    const filteredTemplates = templates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Object.values(template.versions).some(v => v.subject.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (selectedTemplate) {
        return (
            <EmailMarketingComposer 
                template={selectedTemplate} 
                onBack={() => setSelectedTemplate(null)} 
                isAdmin={isAdmin}
            />
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-black/10 min-h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('freelancer_menu.email_marketing')}</h1>
                    <p className="text-muted-foreground">Selecciona una plantilla de marketing diseñada para enviar por email.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar plantillas..."
                        className="pl-9 h-10 rounded-xl bg-white border-slate-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden border-0 shadow-sm animate-pulse">
                            <div className="h-48 bg-slate-200" />
                            <CardContent className="p-4 space-y-2">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-3 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-24 bg-white/50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium text-slate-600">No se encontraron plantillas</h3>
                    <p className="text-muted-foreground">No hay plantillas de Email Marketing disponibles en este momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredTemplates.map((template) => (
                        <Card 
                            key={template.id} 
                            className="group cursor-pointer hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden border-0 shadow-lg ring-1 ring-slate-200 dark:ring-slate-800 bg-white"
                            onClick={() => setSelectedTemplate(template)}
                        >
                            <div className="relative h-48 bg-slate-100 overflow-hidden">
                                {template.imageUrl || (template.images && template.images[0]) ? (
                                    <img 
                                        src={template.imageUrl || template.images?.[0]} 
                                        alt={template.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-slate-50 text-slate-300">
                                        <Mail className="h-12 w-12 opacity-20" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
                                    <Badge className="w-fit mb-2 bg-purple-500/90 border-0">Email Marketing</Badge>
                                    <h3 className="text-xl font-bold text-white leading-tight">{template.name}</h3>
                                </div>
                            </div>
                            <CardContent className="p-5">
                                <p className="text-sm text-slate-600 line-clamp-2 mb-4 italic">
                                    {template.versions['es']?.subject || template.versions['en']?.subject || 'Sin asunto definido'}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex -space-x-1">
                                        {Object.keys(template.versions).map(lang => (
                                            <div key={lang} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold uppercase text-slate-600">
                                                {lang}
                                            </div>
                                        ))}
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-purple-600 font-bold hover:bg-purple-50 group-hover:px-4 transition-all">
                                        Usar ahora <Send className="ml-2 h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* AI Features Highlight */}
            {!isLoading && filteredTemplates.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-slate-200/60">
                    <div className="flex items-center gap-3 p-4 bg-white/40 rounded-xl border border-slate-100">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        <span className="text-xs font-semibold text-slate-600">Mejorado con Inteligencia Artificial</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white/40 rounded-xl border border-slate-100">
                        <Languages className="h-5 w-5 text-blue-500" />
                        <span className="text-xs font-semibold text-slate-600">Traducción Instantánea Multilenguaje</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white/40 rounded-xl border border-slate-100">
                        <LayoutTemplate className="h-5 w-5 text-green-500" />
                        <span className="text-xs font-semibold text-slate-600">Plantillas Profesionales Listas</span>
                    </div>
                </div>
            )}
        </div>
    );
}
