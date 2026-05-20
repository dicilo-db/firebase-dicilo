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
import { Loader2, ArrowLeft, Plus, Trash2, Edit2, MonitorPlay, Calendar, ExternalLink, Upload, Eye } from 'lucide-react';
import { createAdCampaign, getAdCampaigns, updateAdCampaign, deleteAdCampaign } from '@/app/actions/ads-manager';
import { uploadAdBannerAction } from '@/app/actions/ad-actions';
import Image from 'next/image';

interface DisplayAdsManagerProps {
    clientId?: string;
    onBack: () => void;
}

export function DisplayAdsManager({ clientId, onBack }: DisplayAdsManagerProps) {
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
        targetUrl: '',
        budgetTotal: 100,
        startDate: '',
        endDate: '',
        image: ''
    });

    const loadCampaigns = async () => {
        setIsLoading(true);
        try {
            const res = await getAdCampaigns(clientId, 'display_ad');
            if (res.success && res.campaigns) {
                setCampaigns(res.campaigns);
            } else {
                toast({ title: 'Error', description: 'No se pudieron cargar los anuncios.', variant: 'destructive' });
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
                toast({ title: 'Imagen subida', description: 'El banner se ha subido correctamente.' });
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
        if (!formData.title || !formData.targetUrl || !formData.image || !formData.startDate || !formData.endDate) {
            toast({ title: 'Campos incompletos', description: 'Por favor completa todos los campos obligatorios.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                const res = await updateAdCampaign(editingId, {
                    ...formData,
                    type: 'display_ad'
                });
                if (res.success) {
                    toast({ title: 'Anuncio actualizado', description: 'La campaña de Display Ad se ha actualizado.' });
                    setIsDialogOpen(false);
                    resetForm();
                    loadCampaigns();
                } else {
                    toast({ title: 'Error', description: res.error || 'No se pudo actualizar.', variant: 'destructive' });
                }
            } else {
                if (!clientId) {
                    toast({ title: 'Error', description: 'Client ID es necesario para crear anuncios.', variant: 'destructive' });
                    setIsSubmitting(false);
                    return;
                }
                const res = await createAdCampaign({
                    ...formData,
                    clientId,
                    type: 'display_ad'
                });
                if (res.success) {
                    toast({ title: 'Anuncio creado', description: 'Tu campaña de Display Ad está activa.' });
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
            targetUrl: camp.targetUrl || '',
            budgetTotal: camp.budget_total || 100,
            startDate: camp.start_date || '',
            endDate: camp.end_date || '',
            image: camp.image || ''
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este anuncio?')) return;
        try {
            const res = await deleteAdCampaign(id);
            if (res.success) {
                toast({ title: 'Anuncio eliminado', description: 'El anuncio ha sido retirado.' });
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
            targetUrl: '',
            budgetTotal: 100,
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
                    <h2 className="text-2xl font-bold tracking-tight">Display Ads</h2>
                    <p className="text-muted-foreground">Gestiona banners publicitarios dentro de la red Dicilo y sitios asociados.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Nuevo Display Ad
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Editar Display Ad' : 'Crear Display Ad'}</DialogTitle>
                            <DialogDescription>
                                Completa la información para configurar tu banner publicitario.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título del Anuncio *</Label>
                                <Input id="title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ej: Especial Verano 20% de Descuento" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc">Descripción (Corto)</Label>
                                <Textarea id="desc" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Ej: Visita nuestra tienda y disfruta de increíbles descuentos..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="targetUrl">URL de Destino *</Label>
                                <Input id="targetUrl" value={formData.targetUrl} onChange={e => setFormData({ ...formData, targetUrl: e.target.value })} placeholder="https://miweb.com/oferta" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="budget">Presupuesto (€) *</Label>
                                    <Input id="budget" type="number" value={formData.budgetTotal} onChange={e => setFormData({ ...formData, budgetTotal: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="image">Banner Publicitario *</Label>
                                    <div className="flex items-center gap-2">
                                        <Input id="image-upload" type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                                        <Button type="button" variant="outline" className="w-full gap-2" onClick={() => document.getElementById('image-upload')?.click()}>
                                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                            Subir Banner
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            {formData.image && (
                                <div className="relative w-full h-32 border rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                                    <img src={formData.image} alt="Banner Preview" className="object-contain h-full w-full" />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start">Fecha de Inicio *</Label>
                                    <Input id="start" type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end">Fecha de Fin *</Label>
                                    <Input id="end" type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateOrUpdate} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingId ? 'Guardar Cambios' : 'Activar Campaña'}
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
                    <MonitorPlay className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No tienes campañas de Display Ads activas.</p>
                    <p className="text-sm">¡Comienza creando tu primer banner publicitario!</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {campaigns.map((camp) => (
                        <Card key={camp.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                            <div className="relative w-full h-40 bg-slate-100 border-b overflow-hidden">
                                {camp.image ? (
                                    <img src={camp.image} alt={camp.title} className="object-cover w-full h-full" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">Sin Imagen</div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <Badge variant={camp.status === 'active' ? 'default' : 'secondary'}>
                                        {camp.status === 'active' ? 'Activo' : 'Pausado'}
                                    </Badge>
                                </div>
                            </div>
                            <CardHeader className="p-4 flex-1">
                                <CardTitle className="text-lg line-clamp-1">{camp.title}</CardTitle>
                                <CardDescription className="line-clamp-2 text-xs mt-1">{camp.description || 'Sin descripción'}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-3 border-t">
                                <div className="grid grid-cols-2 gap-2 text-xs pt-3">
                                    <div className="bg-slate-50 p-2 rounded-lg">
                                        <p className="text-muted-foreground">Presupuesto</p>
                                        <p className="font-semibold">{camp.budget_total}€</p>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg">
                                        <p className="text-muted-foreground">Clicks</p>
                                        <p className="font-semibold flex items-center gap-1">
                                            <Eye className="w-3.5 h-3.5 text-blue-500" /> {camp.clicks || 0}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(camp.start_date).toLocaleDateString()} - {new Date(camp.end_date).toLocaleDateString()}
                                    </span>
                                    <a href={camp.targetUrl} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1 hover:underline">
                                        Destino <ExternalLink className="w-3 h-3" />
                                    </a>
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
