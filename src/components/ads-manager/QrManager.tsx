'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
    getQrCampaigns,
    createQrCampaign,
    deleteQrCampaign,
    QrCampaign
} from '@/app/actions/ads-manager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Download, Trash2, QrCode, ArrowLeft, ExternalLink, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Dynamic import to avoid SSR issues with Canvas (fix for blank page on localhost)
const QRCodeCanvas = dynamic(
    () => import('qrcode.react').then((mod) => mod.QRCodeCanvas),
    { ssr: false }
);

interface QrManagerProps {
    onBack: () => void;
}

export function QrManager({ onBack }: QrManagerProps) {
    const { toast } = useToast();
    const [campaigns, setCampaigns] = useState<QrCampaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Create/Edit Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', targetUrl: '', description: '' });

    // Fetch Data
    const loadCampaigns = async () => {
        setIsLoading(true);
        try {
            console.log("Fetching campaigns...");
            const res = await getQrCampaigns();
            console.log("Campaigns result:", res);

            if (res.success && res.campaigns) {
                setCampaigns(res.campaigns);
            } else {
                console.error("Failed to load campaigns:", res.error);
                toast({
                    title: "Error de Carga",
                    description: res.error || "No se pudieron cargar las campañas. Revisa la consola.",
                    variant: 'destructive'
                });
            }
        } catch (err: any) {
            console.error("Critical fetch error:", err);
            toast({
                title: "Error Crítico",
                description: `Error de conexión: ${err.message || 'Desconocido'}`,
                variant: 'destructive'
            });
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    // Create Handler
    const handleCreate = async () => {
        if (!formData.name || !formData.targetUrl) {
            toast({ title: "Faltan datos", description: "Nombre y URL son obligatorios.", variant: 'destructive' });
            return;
        }

        setIsCreating(true);
        try {
            const res = await createQrCampaign(formData);
            if (res.success) {
                toast({ title: "Creado", description: "Campaña QR creada exitosamente." });
                setFormData({ name: '', targetUrl: '', description: '' });
                setIsDialogOpen(false);
                loadCampaigns();
            } else {
                toast({ title: "Error", description: res.error || "No se pudo crear.", variant: 'destructive' });
            }
        } catch (err: any) {
            console.error(err);
            toast({ title: "Error Fatal", description: `Error inesperado: ${err.message}`, variant: 'destructive' });
        }
        setIsCreating(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este QR?")) return;

        try {
            const res = await deleteQrCampaign(id);
            if (res.success) {
                toast({ title: "Eliminado", description: "QR eliminado correctamente." });
                loadCampaigns();
            } else {
                toast({ title: "Error", description: res.error, variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: "Error", description: "Error al eliminar.", variant: 'destructive' });
        }
    };

    // Download QR Handler
    const downloadQR = (id: string, name: string) => {
        // Prevent execution on server just in case
        if (typeof document === 'undefined') return;

        const canvas = document.getElementById(`qr-canvas-${id}`) as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `qr-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dicilo.net';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <Button variant="ghost" size="sm" className="mb-2 pl-0 hover:pl-2 transition-all" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Manager
                    </Button>
                    <h2 className="text-2xl font-bold tracking-tight">Gestor de QRs Dinámicos</h2>
                    <p className="text-muted-foreground">Crea códigos QR una vez, cambia su destino cuando quieras.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Nuevo QR Dinámico
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo QR Dinámico</DialogTitle>
                            <DialogDescription>
                                Este QR apuntará a una dirección interna que redirigirá al usuario a donde tú digas.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre de Campaña</Label>
                                <Input
                                    id="name"
                                    placeholder="Ej: Menú Verano 2025"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="url">URL Destino (Target)</Label>
                                <Input
                                    id="url"
                                    placeholder="https://tunsitio.com/oferta-especial"
                                    value={formData.targetUrl}
                                    onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                                />
                                <p className="text-[10px] text-muted-foreground">Puedes cambiar esta URL más tarde sin reimprimir el QR.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Crear QR
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
                    <QrCode className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No tienes campañas de QR activas.</p>
                    <p className="text-sm">Crea la primera para empezar a rastrear.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {campaigns.map((camp) => {
                        const redirectUrl = `${baseUrl}/qr/${camp.id}`;
                        // Fallback dates if serialization fails or is missing
                        const dateStr = camp.createdAt ? new Date(camp.createdAt).toLocaleDateString() : 'N/A';

                        return (
                            <Card key={camp.id} className="overflow-hidden flex flex-col">
                                <CardHeader className="bg-muted/30 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{camp.name}</CardTitle>
                                            <CardDescription className="text-xs font-mono mt-1">ID: {camp.id}</CardDescription>
                                        </div>
                                        <Badge variant={camp.active ? "default" : "secondary"} className="text-[10px]">
                                            {camp.active ? 'Activo' : 'Pausado'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 p-6 flex flex-col items-center gap-6">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border">
                                        <QRCodeCanvas
                                            value={redirectUrl}
                                            size={180}
                                            id={`qr-canvas-${camp.id}`}
                                            level={"H"}
                                            includeMargin={true}
                                        />
                                    </div>

                                    <div className="w-full space-y-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground uppercase font-bold">Apunta a (Dinámico)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    defaultValue={camp.targetUrl}
                                                    className="h-8 text-xs font-mono bg-muted/50"
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                                            <span>Creado: {dateStr}</span>
                                            <div className="flex items-center gap-1 font-semibold text-foreground">
                                                <QrCode className="h-3 w-3" /> {camp.clicks || 0} Scans
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/30 p-3 flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 text-xs"
                                        onClick={() => downloadQR(camp.id, camp.name)}
                                    >
                                        <Download className="mr-2 h-3 w-3" /> PNG
                                    </Button>
                                    <Button variant="ghost" size="sm"
                                        onClick={() => handleDelete(camp.id)}
                                        className="w-8 px-0 text-red-500 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
