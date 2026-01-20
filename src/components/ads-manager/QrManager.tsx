'use client';

import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import {
    getQrCampaigns,
    createQrCampaign,
    deleteQrCampaign,
    updateQrTargetUrl,
    generateQrReportConfig,
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Download, Trash2, QrCode, ArrowLeft, ExternalLink, Edit2, Check, X, FileText } from 'lucide-react';

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
    const { t } = useTranslation('common');
    const [campaigns, setCampaigns] = useState<QrCampaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editUrl, setEditUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

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
                    title: t('adsManager.qrManager.toasts.loadError'),
                    description: res.error || t('adsManager.qrManager.toasts.loadErrorDesc'),
                    variant: 'destructive'
                });
            }
        } catch (err: any) {
            console.error("Critical fetch error:", err);
            toast({
                title: t('adsManager.qrManager.toasts.fetchError'),
                description: `Error: ${err.message || 'Desconocido'}`,
                variant: 'destructive'
            });
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    // REPORT DOWNLOAD HANDLER
    const handleDownloadReport = async () => {
        setIsDownloading(true);
        try {
            const res = await generateQrReportConfig();
            if (res.success && res.csv) {
                // Trigger download
                const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `qr_report_${new Date().toISOString().slice(0, 10)}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                toast({ title: t('adsManager.qrManager.toasts.reportError'), description: res.error || t('adsManager.qrManager.toasts.reportErrorDesc'), variant: 'destructive' });
            }
        } catch (err: any) {
            toast({ title: t('adsManager.qrManager.toasts.reportError'), description: t('adsManager.qrManager.toasts.downloadError'), variant: 'destructive' });
        }
        setIsDownloading(false);
    };

    // Create Handler
    const handleCreate = async () => {
        if (!formData.name || !formData.targetUrl) {
            toast({ title: t('adsManager.qrManager.toasts.missingData'), description: t('adsManager.qrManager.toasts.missingDataDesc'), variant: 'destructive' });
            return;
        }

        setIsCreating(true);
        try {
            const res = await createQrCampaign(formData);
            if (res.success) {
                toast({ title: t('adsManager.qrManager.toasts.created'), description: t('adsManager.qrManager.toasts.createdDesc') });
                setFormData({ name: '', targetUrl: '', description: '' });
                setIsDialogOpen(false);
                loadCampaigns();
            } else {
                toast({ title: t('adsManager.qrManager.toasts.createError'), description: res.error || t('adsManager.qrManager.toasts.createErrorDesc'), variant: 'destructive' });
            }
        } catch (err: any) {
            console.error(err);
            toast({ title: t('adsManager.qrManager.toasts.fatalError'), description: `Error inesperado: ${err.message}`, variant: 'destructive' });
        }
        setIsCreating(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('adsManager.qrManager.toasts.deleteConfirm'))) return;

        try {
            const res = await deleteQrCampaign(id);
            if (res.success) {
                toast({ title: t('adsManager.qrManager.toasts.deleted'), description: t('adsManager.qrManager.toasts.deletedDesc') });
                loadCampaigns();
            } else {
                toast({ title: t('adsManager.qrManager.toasts.error'), description: res.error, variant: 'destructive' });
            }
        } catch (err) {
            toast({ title: t('adsManager.qrManager.toasts.error'), description: t('adsManager.qrManager.toasts.deleteError'), variant: 'destructive' });
        }
    };

    // Edit Handlers
    const handleStartEdit = (id: string, currentUrl: string) => {
        setEditingId(id);
        setEditUrl(currentUrl);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditUrl('');
    };

    const handleSaveUrl = async (id: string) => {
        if (!editUrl.trim()) return;
        setIsSaving(true);
        try {
            const res = await updateQrTargetUrl(id, editUrl);
            if (res.success) {
                toast({ title: t('adsManager.qrManager.toasts.updated'), description: t('adsManager.qrManager.toasts.updatedDesc') });
                setEditingId(null);
                loadCampaigns();
            } else {
                toast({ title: t('adsManager.qrManager.toasts.error'), description: res.error || t('adsManager.qrManager.toasts.updateError'), variant: 'destructive' });
            }
        } catch (err: any) {
            toast({ title: t('adsManager.qrManager.toasts.error'), description: err.message, variant: 'destructive' });
        }
        setIsSaving(false);
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
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" className="pl-0 hover:pl-2 transition-all" onClick={onBack}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> {t('adsManager.qrManager.back')}
                        </Button>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">{t('adsManager.qrManager.title')}</h2>
                    <p className="text-muted-foreground">{t('adsManager.qrManager.subtitle')}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={handleDownloadReport} disabled={isDownloading} className="gap-2">
                        {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        {t('adsManager.qrManager.downloadHistory')}
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" /> {t('adsManager.qrManager.newQr')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('adsManager.qrManager.createDialog.title')}</DialogTitle>
                                <DialogDescription>
                                    {t('adsManager.qrManager.createDialog.description')}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t('adsManager.qrManager.createDialog.nameLabel')}</Label>
                                    <Input
                                        id="name"
                                        placeholder={t('adsManager.qrManager.createDialog.namePlaceholder')}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="url">{t('adsManager.qrManager.createDialog.targetUrlLabel')}</Label>
                                    <Input
                                        id="url"
                                        placeholder={t('adsManager.qrManager.createDialog.targetUrlPlaceholder')}
                                        value={formData.targetUrl}
                                        onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                                    />
                                    <p className="text-[10px] text-muted-foreground">{t('adsManager.qrManager.createDialog.targetUrlHelp')}</p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate} disabled={isCreating}>
                                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('adsManager.qrManager.createDialog.submit')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : campaigns.length === 0 ? (
                <div className="text-center border-2 border-dashed rounded-xl py-20 text-muted-foreground bg-slate-50 dark:bg-slate-900/50">
                    <QrCode className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>{t('adsManager.qrManager.noCampaigns')}</p>
                    <p className="text-sm">{t('adsManager.qrManager.noCampaignsSub')}</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {campaigns.map((camp) => {
                        const redirectUrl = `${baseUrl}/qr/${camp.id}`;
                        // Fallback dates if serialization fails or is missing
                        const dateStr = camp.createdAt ? new Date(camp.createdAt).toLocaleDateString() : 'N/A';
                        const isEditingCmp = editingId === camp.id;

                        return (
                            <Card key={camp.id} className="overflow-hidden flex flex-col">
                                <CardHeader className="bg-muted/30 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{camp.name}</CardTitle>
                                            <CardDescription className="text-xs font-mono mt-1">ID: {camp.id}</CardDescription>
                                        </div>
                                        <Badge variant={camp.active ? "default" : "secondary"} className="text-[10px]">
                                            {camp.active ? t('adsManager.qrManager.card.active') : t('adsManager.qrManager.card.paused')}
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
                                            <Label className="text-xs text-muted-foreground uppercase font-bold">{t('adsManager.qrManager.card.pointsTo')}</Label>
                                            <div className="flex gap-2">
                                                {isEditingCmp ? (
                                                    <>
                                                        <Input
                                                            value={editUrl}
                                                            onChange={(e) => setEditUrl(e.target.value)}
                                                            className="h-8 text-xs font-mono"
                                                            placeholder="https://..."
                                                        />
                                                        <Button size="icon" variant="default" className="h-8 w-8 shrink-0 bg-green-600 hover:bg-green-700" onClick={() => handleSaveUrl(camp.id)} disabled={isSaving}>
                                                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                                        </Button>
                                                        <Button size="icon" variant="secondary" className="h-8 w-8 shrink-0" onClick={handleCancelEdit} disabled={isSaving}>
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Input
                                                            defaultValue={camp.targetUrl}
                                                            className="h-8 text-xs font-mono bg-muted/50"
                                                            readOnly
                                                        />
                                                        <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={() => handleStartEdit(camp.id, camp.targetUrl)}>
                                                            <Edit2 className="h-3 w-3" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                                            <span>{t('adsManager.qrManager.card.created')} {dateStr}</span>
                                            <div className="flex items-center gap-1 font-semibold text-foreground">
                                                <QrCode className="h-3 w-3" /> {camp.clicks || 0} {t('adsManager.qrManager.card.scans')}
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
                                        <Download className="mr-2 h-3 w-3" /> {t('adsManager.qrManager.card.downloadPng')}
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
