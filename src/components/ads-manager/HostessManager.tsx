'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Plus, Trash2, Edit2, Users, MapPin, Calendar, Upload, DollarSign } from 'lucide-react';
import { createAdCampaign, getAdCampaigns, updateAdCampaign, deleteAdCampaign } from '@/app/actions/ads-manager';
import { uploadAdBannerAction } from '@/app/actions/ad-actions';

interface HostessManagerProps {
    clientId?: string;
    onBack: () => void;
}

export function HostessManager({ clientId, onBack }: HostessManagerProps) {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        eventLocation: '',
        eventDate: '',
        hostessesCount: 2,
        budgetTotal: 120, // Budget for hostess booking
        startDate: '',
        endDate: '',
        image: ''
    });

    const loadCampaigns = async () => {
        setIsLoading(true);
        try {
            const res = await getAdCampaigns(clientId, 'hostess');
            if (res.success && res.campaigns) {
                setCampaigns(res.campaigns);
            } else {
                toast({ title: 'Error', description: 'No se pudieron cargar los eventos de Hostess.', variant: 'destructive' });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCampaigns();
    }, [clientId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const uploadForm = new FormData();
            uploadForm.append('file', file);
            const res = await uploadAdBannerAction(uploadForm);
            if (res.success && res.url) {
                setFormData(prev => ({ ...prev, image: res.url }));
                toast({ title: 'Banner subido', description: 'El cartel del evento se ha subido correctamente.' });
            } else {
                toast({ title: 'Error al subir', description: res.error || 'Inténtalo de nuevo.', variant: 'destructive' });
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleCreateOrUpdate = async () => {
        if (!formData.title || !formData.eventLocation || !formData.eventDate || !formData.startDate || !formData.endDate) {
            toast({ title: 'Campos incompletos', description: 'Por favor completa todos los campos obligatorios.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                const res = await updateAdCampaign(editingId, {
                    ...formData,
                    type: 'hostess'
                });
                if (res.success) {
                    toast({ title: 'Evento actualizado', description: 'La reserva de Hostess se ha actualizado.' });
                    setIsDialogOpen(false);
                    resetForm();
                    loadCampaigns();
                } else {
                    toast({ title: 'Error', description: res.error || 'No se pudo actualizar.', variant: 'destructive' });
                }
            } else {
                if (!clientId) {
                    toast({ title: 'Error', description: 'Client ID es necesario para crear eventos.', variant: 'destructive' });
                    setIsSubmitting(false);
                    return;
                }
                const res = await createAdCampaign({
                    ...formData,
                    clientId,
                    type: 'hostess'
                });
                if (res.success) {
                    toast({ title: 'Reserva creada', description: 'Tu solicitud de Hostess ha sido registrada con éxito.' });
                    setIsDialogOpen(false);
                    resetForm();
                    loadCampaigns();
                } else {
                    toast({ title: 'Error', description: res.error || 'No se pudo crear.', variant: 'destructive' });
                }
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (camp: any) => {
        setEditingId(camp.id);
        setFormData({
            title: camp.title || '',
            description: camp.description || '',
            eventLocation: camp.eventLocation || '',
            eventDate: camp.eventDate || '',
            hostessesCount: camp.hostessesCount || 2,
            budgetTotal: camp.budget_total || 120,
            startDate: camp.start_date || '',
            endDate: camp.end_date || '',
            image: camp.image || ''
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) return;
        try {
            const res = await deleteAdCampaign(id);
            if (res.success) {
                toast({ title: 'Evento eliminado', description: 'El evento ha sido cancelado.' });
                loadCampaigns();
            } else {
                toast({ title: 'Error', description: res.error, variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            eventLocation: '',
            eventDate: '',
            hostessesCount: 2,
            budgetTotal: 120,
            startDate: '',
            endDate: '',
            image: ''
        });
        setEditingId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <Button variant="ghost" size="sm" className="pl-0 hover:pl-2 transition-all mb-2" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                    </Button>
                    <h2 className="text-2xl font-bold tracking-tight">Hostessen (Eventos Locales)</h2>
                    <p className="text-muted-foreground">Conviértete en un Hostesen y contrata soporte de marketing presencial en mercados y ferias locales.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                            <Plus className="h-4 w-4" /> Solicitar Hostess
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Editar Reserva Hostess' : 'Solicitar Hostess'}</DialogTitle>
                            <DialogDescription>
                                Proporciona los detalles del evento presencial para coordinar el personal de marketing.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                            <div className="space-y-2">
                                <Label htmlFor="title">Nombre del Evento *</Label>
                                <Input id="title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ej: Feria Local del Agricultor" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc">Instrucciones y Tareas del Hostess</Label>
                                <Textarea id="desc" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Ej: Reparto de folletos con código QR y captación de correos..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Ubicación del Evento (Dirección) *</Label>
                                <Input id="location" value={formData.eventLocation} onChange={e => setFormData({ ...formData, eventLocation: e.target.value })} placeholder="Ej: Plaza Mayor, Madrid" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="eventDate">Fecha del Evento *</Label>
                                    <Input id="eventDate" type="date" value={formData.eventDate} onChange={e => setFormData({ ...formData, eventDate: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="count">Hostess Necesarios *</Label>
                                    <Input id="count" type="number" min={1} value={formData.hostessesCount} onChange={e => setFormData({ ...formData, hostessesCount: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="image">Imagen / Cartel del Evento (Opcional)</Label>
                                <div className="flex items-center gap-2">
                                    <input id="event-upload" type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                                    <Button type="button" variant="outline" className="w-full gap-2" onClick={() => document.getElementById('event-upload')?.click()}>
                                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                        Subir Cartel
                                    </Button>
                                </div>
                            </div>
                            {formData.image && (
                                <div className="relative w-full h-32 border rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                                    <img src={formData.image} alt="Event Preview" className="object-contain h-full w-full" />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="budget">Presupuesto Sugerido (€) *</Label>
                                    <Input id="budget" type="number" value={formData.budgetTotal} onChange={e => setFormData({ ...formData, budgetTotal: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="start">Inicio Planificación *</Label>
                                    <Input id="start" type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end">Fin Planificación *</Label>
                                <Input id="end" type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateOrUpdate} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingId ? 'Guardar Cambios' : 'Confirmar Reserva'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : campaigns.length === 0 ? (
                <div className="text-center border-2 border-dashed rounded-xl py-20 text-muted-foreground bg-slate-50 dark:bg-slate-900/50">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No tienes reservas de Hostess planificadas.</p>
                    <p className="text-sm">¡Comienza contratando soporte presencial en tus próximos eventos!</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {campaigns.map((camp) => (
                        <Card key={camp.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                            {camp.image && (
                                <div className="relative w-full h-40 bg-slate-100 border-b overflow-hidden">
                                    <img src={camp.image} alt={camp.title} className="object-cover w-full h-full" />
                                </div>
                            )}
                            <CardHeader className="p-4 flex-1">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                    <CardTitle className="text-lg line-clamp-1">{camp.title}</CardTitle>
                                    <Badge variant={camp.status === 'active' ? 'default' : 'secondary'}>
                                        {camp.status === 'active' ? 'Confirmado' : 'Pendiente'}
                                    </Badge>
                                </div>
                                <CardDescription className="line-clamp-2 text-xs mt-1">{camp.description || 'Sin instrucciones adicionales'}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-3 border-t">
                                <div className="grid grid-cols-2 gap-2 text-xs pt-3">
                                    <div className="bg-slate-50 p-2 rounded-lg flex flex-col justify-center">
                                        <p className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Ubicación</p>
                                        <p className="font-semibold line-clamp-1 mt-0.5">{camp.eventLocation}</p>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg flex flex-col justify-center">
                                        <p className="text-muted-foreground flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Personal</p>
                                        <p className="font-semibold mt-0.5">{camp.hostessesCount} Hostess</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                        Evento: {new Date(camp.eventDate).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-0.5 font-bold text-slate-800">
                                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> {camp.budget_total}€
                                    </span>
                                </div>
                            </CardContent>
                            <CardFooter className="p-3 bg-slate-50 border-t flex gap-2 justify-end">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(camp)}>
                                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(camp.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
