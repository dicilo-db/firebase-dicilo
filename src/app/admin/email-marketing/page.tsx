'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    getAllMarketingLeads, 
    updateMarketingLead, 
    sendMarketingEmail, 
    convertLeadToClient,
    deleteMarketingLead,
    MarketingLead 
} from '@/app/actions/admin-marketing';
import { getTemplates, EmailTemplate } from '@/actions/email-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { 
    Loader2, Search, RefreshCw, Pen, UserPlus, 
    CheckCircle, Mail, LayoutDashboard, ExternalLink,
    Clock, Trash2, Send, Key
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function EmailMarketingPage() {
    useAuthGuard(['admin', 'superadmin']);
    const { t } = useTranslation('admin');
    const { toast } = useToast();
    
    const [leads, setLeads] = useState<MarketingLead[]>([]);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filters State
    const [sortOrder, setSortOrder] = useState<string>('newest');
    const [filterCountry, setFilterCountry] = useState<string>('all');
    const [filterCity, setFilterCity] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    
    // Edit/Tech Sheet State
    const [editingLead, setEditingLead] = useState<MarketingLead | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Email Send State
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [isSending, setIsSending] = useState(false);
    
    // Convert State
    const [isConvertOpen, setIsConvertOpen] = useState(false);
    const [targetType, setTargetType] = useState<string>('business');
    const [isConverting, setIsConverting] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [leadsRes, templatesRes] = await Promise.all([
                getAllMarketingLeads(),
                getTemplates(true)
            ]);
            
            if (leadsRes.success) setLeads(leadsRes.leads || []);
            setTemplates((templatesRes || []).filter(t => t.category === 'email_marketing' || t.category === 'marketing'));
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveLead = async () => {
        if (!editingLead) return;
        setIsSaving(true);
        try {
            const res = await updateMarketingLead(editingLead.id, editingLead);
            if (res.success) {
                toast({ title: 'Lead actualizado', description: 'Cambios guardados correctamente.' });
                setLeads(prev => prev.map(l => l.id === editingLead.id ? editingLead : l));
                setIsEditOpen(false);
            } else {
                throw new Error(res.error);
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateKey = () => {
        if (!editingLead) return;
        const array = new Uint8Array(4);
        window.crypto.getRandomValues(array);
        const key = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
        setEditingLead({ ...editingLead, securityKey: key });
        toast({ title: 'Clave generada', description: 'Se ha generado una clave única para este prospecto.' });
    };

    const handleSendEmail = async () => {
        if (!editingLead || !selectedTemplate) return;
        setIsSending(true);
        try {
            // IMPORTANT: Save the lead data to Firestore first so the backend email action
            // can read the newly generated securityKey and updated fields.
            await updateMarketingLead(editingLead.id, editingLead);

            const res = await sendMarketingEmail(editingLead.id, selectedTemplate);
            if (res.success) {
                toast({ title: 'Email enviado', description: 'La campaña se ha enviado al lead.' });
                setIsEmailOpen(false);
                fetchData(); // Refresh to show new status
            } else {
                throw new Error(res.error);
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
    };

    const handleConvert = async () => {
        if (!editingLead) return;
        setIsConverting(true);
        try {
            const res = await convertLeadToClient(editingLead.id, targetType);
            if (res.success) {
                toast({ title: 'Convertido con éxito', description: `Se ha creado el negocio/cliente (${targetType}).` });
                setIsConvertOpen(false);
                setIsEditOpen(false);
                fetchData();
            } else {
                throw new Error(res.error);
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsConverting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${name}" de la lista de marketing?`)) {
            return;
        }
        
        try {
            const res = await deleteMarketingLead(id);
            if (res.success) {
                toast({ title: 'Eliminado', description: 'El prospecto fue eliminado con éxito de la base de datos.' });
                setLeads(prev => prev.filter(l => l.id !== id));
            } else {
                throw new Error(res.error);
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const uniqueCities = useMemo(() => Array.from(new Set(leads.map(r => r.city).filter(Boolean))).sort(), [leads]);
    const uniqueCountries = useMemo(() => Array.from(new Set(leads.map(r => r.country).filter(Boolean))).sort(), [leads]);
    const uniqueCategories = useMemo(() => Array.from(new Set(leads.map(r => r.category).filter(Boolean))).sort(), [leads]);

    const filteredLeads = useMemo(() => {
        return leads.filter(l => {
            const matchesSearch = (
                (l.friendName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (l.friendEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (l.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
            const matchesCountry = filterCountry === 'all' || l.country === filterCountry;
            const matchesCity = filterCity === 'all' || l.city === filterCity;
            const matchesCategory = filterCategory === 'all' || l.category === filterCategory;
            return matchesSearch && matchesCountry && matchesCity && matchesCategory;
        }).sort((a, b) => {
            if (sortOrder === 'name-asc') return (a.companyName || a.friendName || '').localeCompare(b.companyName || b.friendName || '');
            if (sortOrder === 'name-desc') return (b.companyName || b.friendName || '').localeCompare(a.companyName || a.friendName || '');
            if (sortOrder === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            if (sortOrder === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            return 0;
        });
    }, [leads, searchTerm, sortOrder, filterCountry, filterCity, filterCategory]);

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
            <main className="container mx-auto p-4 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            Marketing Campaigns
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gestión de leads y envíos masivos de email marketing
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/dashboard">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Panel Admin
                            </Link>
                        </Button>
                        <Button onClick={fetchData} variant="outline" disabled={isLoading}>
                            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                            Actualizar
                        </Button>
                    </div>
                </div>

                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-white dark:bg-slate-800 border-b">
                        <div className="flex flex-col gap-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Mail className="h-5 w-5 text-blue-500" />
                                Leads de Campañas
                                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100">
                                    {filteredLeads.length} Total
                                </Badge>
                            </CardTitle>
                            
                            <div className="flex gap-4 flex-wrap">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar lead o correo..."
                                        className="pl-8 w-[250px]"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Select value={sortOrder} onValueChange={setSortOrder}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Ordenar por" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Más recientes</SelectItem>
                                        <SelectItem value="oldest">Más antiguos</SelectItem>
                                        <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                                        <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={filterCountry} onValueChange={setFilterCountry}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="País" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los Países</SelectItem>
                                        {uniqueCountries.map(c => <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filterCity} onValueChange={setFilterCity}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Ciudad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las Ciudades</SelectItem>
                                        {uniqueCities.map(c => <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las Categorías</SelectItem>
                                        {uniqueCategories.map(c => <SelectItem key={c as string} value={c as string}>{c as string}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button variant="ghost" onClick={() => {
                                    setSearchTerm('');
                                    setSortOrder('newest');
                                    setFilterCountry('all');
                                    setFilterCity('all');
                                    setFilterCategory('all');
                                }}>
                                    Resetear
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                                        <TableRow>
                                            <TableHead className="font-bold">Lead / Empresa</TableHead>
                                            <TableHead className="font-bold">Contacto</TableHead>
                                            <TableHead className="font-bold">Idioma / Ubicación</TableHead>
                                            <TableHead className="font-bold">Fecha</TableHead>
                                            <TableHead className="font-bold text-center">Estado</TableHead>
                                            <TableHead className="font-bold text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLeads.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                                                    No se encontraron leads para mostrar.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredLeads.map((lead) => (
                                                <TableRow key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 dark:text-slate-100">
                                                                {lead.companyName || lead.friendName}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {lead.category || 'Sin categoría'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col text-sm">
                                                            <span className="font-medium">{lead.friendName}</span>
                                                            <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                                                                {lead.friendEmail}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span title={`Idioma: ${lead.lang || 'No definido'}`} className="text-lg">
                                                                    {lead.lang === 'es' ? '🇪🇸' : lead.lang === 'en' ? '🇬🇧' : lead.lang === 'de' ? '🇩🇪' : lead.lang === 'fr' ? '🇫🇷' : lead.lang === 'pt' ? '🇵🇹' : lead.lang === 'it' ? '🇮🇹' : '🌐'}
                                                                </span>
                                                                <span className="font-medium uppercase text-xs">{lead.lang || 'ES'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <span>{lead.city || 'Sin ciudad'}</span>
                                                                {lead.country && <span>({lead.country})</span>}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {new Date(lead.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge className={cn(
                                                            "capitalize text-[10px] py-0",
                                                            lead.converted ? "bg-green-100 text-green-700 border-green-200" :
                                                            lead.status === 'email_sent' ? "bg-blue-100 text-blue-700 border-blue-200" :
                                                            "bg-slate-100 text-slate-600 border-slate-200"
                                                        )}>
                                                            {lead.converted ? <CheckCircle className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                                                            {lead.converted ? 'Convertido' : lead.status === 'email_sent' ? 'Email Enviado' : 'Nuevo'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2 items-center">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="h-8 text-blue-600 px-2"
                                                                onClick={() => {
                                                                    let leadToEdit = { ...lead };
                                                                    if (!leadToEdit.companyName || leadToEdit.companyName.trim() === '') {
                                                                        leadToEdit.companyName = leadToEdit.friendName;
                                                                    }
                                                                    setEditingLead(leadToEdit);
                                                                    setIsEditOpen(true);
                                                                }}
                                                            >
                                                                Ficha Técnica
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-red-500 border-red-200 hover:bg-red-50"
                                                                onClick={() => handleDelete(lead.id, lead.companyName || lead.friendName)}
                                                                title="Eliminar Prospecto"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* MODAL: FICHA TÉCNICA (EDIT) */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Pen className="h-5 w-5 text-blue-500" />
                            Ficha Técnica del Prospecto
                        </DialogTitle>
                    </DialogHeader>
                    {editingLead && (
                        <div className="grid gap-6 py-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-full text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                    <UserPlus className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col text-sm">
                                    <span className="text-muted-foreground">Registrado por:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">{editingLead.referrerName || 'Admin / Directo'}</span>
                                        {editingLead.referrerId && (
                                            <Badge variant="outline" className="font-mono text-[10px] py-0">{editingLead.referrerId}</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre del Lead</Label>
                                    <Input 
                                        value={editingLead.friendName} 
                                        onChange={e => setEditingLead({...editingLead, friendName: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input 
                                        value={editingLead.friendEmail} 
                                        onChange={e => setEditingLead({...editingLead, friendEmail: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Empresa</Label>
                                    <Input 
                                        value={editingLead.companyName || ''} 
                                        onChange={e => setEditingLead({...editingLead, companyName: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Teléfono</Label>
                                    <Input 
                                        value={editingLead.phone || ''} 
                                        onChange={e => setEditingLead({...editingLead, phone: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ciudad</Label>
                                    <Input 
                                        value={editingLead.city || ''} 
                                        onChange={e => setEditingLead({...editingLead, city: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>País</Label>
                                    <Input 
                                        value={editingLead.country || ''} 
                                        onChange={e => setEditingLead({...editingLead, country: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Idioma de Contacto</Label>
                                    <Select value={editingLead.lang || 'es'} onValueChange={v => setEditingLead({...editingLead, lang: v})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="es">🇪🇸 Español</SelectItem>
                                            <SelectItem value="en">🇬🇧 English</SelectItem>
                                            <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                                            <SelectItem value="fr">🇫🇷 Français</SelectItem>
                                            <SelectItem value="pt">🇵🇹 Português</SelectItem>
                                            <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Notas / Comentarios</Label>
                                <Textarea 
                                    className="h-24"
                                    value={editingLead.notes || ''}
                                    onChange={e => setEditingLead({...editingLead, notes: e.target.value})}
                                    placeholder="Agrega notas internas sobre este prospecto..."
                                />
                            </div>
                            
                            {/* Security Key & Validation */}
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-lg border border-blue-100 flex flex-col md:flex-row gap-6 items-center mt-2">
                                <div className="flex-1 space-y-2">
                                    <Label className="flex items-center gap-2"><Key className="h-4 w-4" /> Clave Única de Registro</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={editingLead.securityKey || ''} 
                                            onChange={(e) => setEditingLead({ ...editingLead, securityKey: e.target.value })}
                                            placeholder="SIN CLAVE..."
                                            className="font-mono bg-white uppercase"
                                        />
                                        {!editingLead.securityKey && (
                                            <Button variant="outline" onClick={handleGenerateKey}>Generar</Button>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Esta clave servirá para verificar la autenticidad al momento de que la empresa se registre.</p>
                                </div>

                                <div className="flex-1 space-y-2 text-center md:text-right">
                                    <Label className="block mb-2">Estado de Validación</Label>
                                    {editingLead.securityKey ? (
                                        <Badge className="bg-green-500 text-white hover:bg-green-600 px-4 py-1.5 text-sm uppercase">✅ CLAVE ASIGNADA</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50 px-4 py-1.5 text-sm uppercase">⚠️ PENDIENTE DE REVISIÓN</Badge>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pt-4 border-t">
                                <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => setIsEmailOpen(true)}
                                    disabled={editingLead.converted}
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    Enviar Campaña
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => setIsConvertOpen(true)}
                                    disabled={editingLead.converted}
                                >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Convertir a Cliente
                                </Button>
                                <Button 
                                    className="flex-1"
                                    onClick={handleSaveLead}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : 'Guardar Cambios'}
                                </Button>
                            </div>
                            
                            {editingLead.converted && (
                                <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2 text-green-700 text-sm font-medium">
                                    <CheckCircle className="h-4 w-4" />
                                    Este lead ya ha sido convertido en cliente con éxito.
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* MODAL: SELECCIONAR PLANTILLA */}
            <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Seleccionar Plantilla de Campaña</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Plantillas Disponibles (Email Marketing)</Label>
                            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una plantilla..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id as string}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                    {templates.length === 0 && (
                                        <SelectItem value="none" disabled>No hay plantillas de marketing</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            El email se enviará a <strong>{editingLead?.friendEmail}</strong> usando las variables de personalización disponibles.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEmailOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSendEmail} disabled={!selectedTemplate || isSending}>
                            {isSending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                            Enviar Ahora
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL: CONVERTIR A CLIENTE */}
            <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Convertir Prospecto a Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Tipo de Cliente Destino</Label>
                            <Select value={targetType} onValueChange={setTargetType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="business">Solo Negocio (Directorio)</SelectItem>
                                    <SelectItem value="starter">Plan Starter</SelectItem>
                                    <SelectItem value="retailer">Plan Retailer (Einzelhändler)</SelectItem>
                                    <SelectItem value="premium">Plan Premium</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Se creará una nueva entrada en <strong>businesses</strong> {targetType !== 'business' ? `y un perfil en **clients**` : ''} usando los datos actuales de la ficha técnica.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConvertOpen(false)}>Cancelar</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={handleConvert} disabled={isConverting}>
                            {isConverting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Confirmar Conversión
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
