'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Tag, Calendar, MapPin, Euro, Percent, Type } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCouponsByCompany } from '@/app/actions/coupons';
import { CouponForm } from '@/app/admin/coupons/components/CouponForm';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ClientCouponManagerProps {
    companyId: string;
    companyName: string;
    category: string;
    clientLogoUrl?: string;
}

export function ClientCouponManager({ companyId, companyName, category, clientLogoUrl }: ClientCouponManagerProps) {
    const { toast } = useToast();
    const { t } = useTranslation(['admin', 'common']);
    const [coupons, setCoupons] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<any>(null);

    const fetchCoupons = async () => {
        setIsLoading(true);
        try {
            const res = await getCouponsByCompany(companyId);
            if (res.success && res.coupons) {
                setCoupons(res.coupons);
            } else {
                // If it's a 404 or empty, just set empty
                if (res.error?.includes('not found')) {
                    setCoupons([]);
                } else {
                    setCoupons([]); // Safe fallback
                    // toast({
                    //     title: 'Info',
                    //     description: res.error || 'Fehler beim Laden der Coupons.',
                    // });
                }
            }
        } catch (error) {
            console.error(error);
            setCoupons([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (companyId) {
            fetchCoupons();
        }
    }, [companyId]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-500">Aktiv</Badge>;
            case 'expired':
                return <Badge variant="destructive">Abgelaufen</Badge>;
            case 'scheduled':
                return <Badge variant="outline" className="text-blue-500 border-blue-500">Geplant</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    // Helper to render discount badge
    const renderDiscountBadge = (coupon: any) => {
        if (!coupon.discountType || coupon.discountType === 'text') {
            return <Badge variant="secondary" className="gap-1"><Type className="h-3 w-3" /> Angebot</Badge>;
        }
        if (coupon.discountType === 'percent') {
            return <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800"><Percent className="h-3 w-3" /> {coupon.discountValue}%</Badge>;
        }
        if (coupon.discountType === 'euro') {
            return <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800"><Euro className="h-3 w-3" /> {coupon.discountValue}€</Badge>;
        }
        return null;
    };

    // --- NEW HELPERS ---
    const handleDownloadJPG = async (coupon: any) => {
        try {
            const html2canvas = (await import('html2canvas')).default;
            const element = document.getElementById(`coupon-card-${coupon.id}`);
            if (!element) return;

            // Temporary style adjustment for capture
            const originalTransform = element.style.transform;
            element.style.transform = "none";

            const canvas = await html2canvas(element, { scale: 2, useCORS: true });

            // Restore
            element.style.transform = originalTransform;

            const link = document.createElement('a');
            link.download = `coupon-${coupon.code}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            link.click();
            toast({ title: 'Download gestartet', description: 'Das Bild wurde gespeichert.' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Fehler', description: 'Download fehlgeschlagen.', variant: 'destructive' });
        }
    };

    const handleDownloadPDF = async (coupon: any) => {
        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const element = document.getElementById(`coupon-card-${coupon.id}`);
            if (!element) return;

            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a6' // Postcard size approximately
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`coupon-${coupon.code}.pdf`);

            toast({ title: 'Download gestartet', description: 'Das PDF wurde gespeichert.' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Fehler', description: 'PDF Erstellung fehlgeschlagen.', variant: 'destructive' });
        }
    };

    const handleSendEmail = async (coupon: any) => {
        const email = prompt("An welche Email soll der Coupon gesendet werden?");
        if (!email) return;

        toast({ title: 'Sende Email...', description: 'Bitte warten.' });

        // Dynamic import to avoid server-side issues if any, though actions are safe
        const { shareCoupon } = await import('@/app/actions/coupons');

        const res = await shareCoupon(email, coupon);
        if (res.success) {
            toast({ title: 'Erfolg', description: `Email an ${email} gesendet.` });
        } else {
            toast({ title: 'Fehler', description: res.error || 'Email konnte nicht gesendet werden.', variant: 'destructive' });
        }
    };

    const handleEdit = (coupon: any) => {
        setEditingCoupon(coupon);
        setIsCreateOpen(true);
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Meine Coupons</h3>
                    <p className="text-sm text-muted-foreground">
                        Verwalten Sie hier Ihre Rabattaktionen und Angebote.
                    </p>
                </div>
                <Button type="button" onClick={() => { setEditingCoupon(null); setIsCreateOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Neuen Coupon erstellen
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : coupons.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <Tag className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Keine Coupons vorhanden</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                            Erstellen Sie Ihren ersten Coupon, um Kunden mit attraktiven Angeboten zu gewinnen.
                        </p>
                        <Button type="button" variant="outline" onClick={() => { setEditingCoupon(null); setIsCreateOpen(true); }}>
                            Jetzt erstellen
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {coupons.map((coupon) => (
                        <div key={coupon.id} className="flex flex-col gap-2 relative group">
                            {/* TARGET ELEMENT FOR CAPTURE */}
                            <Card id={`coupon-card-${coupon.id}`} className="overflow-hidden flex flex-col h-full border-2 hover:border-primary/20 transition-all bg-white text-slate-900 shadow-sm relative">

                                {/* Background Image Header */}
                                <div className="h-32 w-full bg-slate-100 relative overflow-hidden">
                                    {/* EDIT BUTTON OVERLAY - Visible only on hover or always if preferred, user interaction outside capture */}
                                    {/* We put it absolute but outside the capture area if possible, OR if it's inside, we hide it during capture via 'data-html2canvas-ignore' */}

                                    {coupon.backgroundImage ? (
                                        <img
                                            src={coupon.backgroundImage}
                                            alt={coupon.category}
                                            crossOrigin="anonymous" // Crucial for html2canvas
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-muted">
                                            <Tag className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                    )}

                                    {/* LOGO - Top Left or overlapping */}
                                    {clientLogoUrl && (
                                        <div className="absolute top-2 left-2 z-10 w-12 h-12 bg-white rounded-full p-1 shadow-md border overflow-hidden">
                                            <img src={clientLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                                        </div>
                                    )}

                                    <div className="absolute top-2 right-2 z-10 flex gap-1 items-center">
                                        {/* Status Badge */}
                                        {getStatusBadge(coupon.status)}
                                    </div>

                                    <div className="absolute bottom-2 left-2 z-10">
                                        {renderDiscountBadge(coupon)}
                                    </div>
                                </div>

                                <CardHeader className="pb-2 pt-4 relative">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="text-xs font-mono bg-slate-100">{coupon.code}</Badge>

                                        {/* EDIT BUTTON */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(coupon)}
                                            className="h-6 px-2 text-slate-400 hover:text-primary"
                                            data-html2canvas-ignore="true" // Ignore in screenshot
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                    <CardTitle className="text-lg mt-2 line-clamp-1" title={coupon.title}>{coupon.title}</CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-[40px]">{coupon.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2 mt-auto">
                                    <div className="flex items-center text-muted-foreground">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        <span>
                                            {coupon.startDate && !isNaN(new Date(coupon.startDate).getTime())
                                                ? format(new Date(coupon.startDate), 'dd.MM.yy', { locale: de })
                                                : 'N/A'}
                                            -
                                            {coupon.endDate && !isNaN(new Date(coupon.endDate).getTime())
                                                ? format(new Date(coupon.endDate), 'dd.MM.yy', { locale: de })
                                                : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-muted-foreground">
                                        <MapPin className="mr-2 h-4 w-4" />
                                        <span className="truncate">{coupon.city}, {coupon.country}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* ACTION BUTTONS */}
                            <div className="grid grid-cols-3 gap-1">
                                <Button variant="secondary" size="sm" onClick={() => handleDownloadJPG(coupon)} title="Als Bild speichern">
                                    JPG
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => handleDownloadPDF(coupon)} title="Als PDF speichern">
                                    PDF
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => handleSendEmail(coupon)} title="Per Email senden">
                                    Email
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CouponForm
                isOpen={isCreateOpen}
                onClose={() => { setIsCreateOpen(false); setEditingCoupon(null); }}
                onSuccess={() => {
                    fetchCoupons();
                    setIsCreateOpen(false);
                    setEditingCoupon(null);
                }}
                category={category}
                fixedCompanyId={companyId}
                fixedCompanyName={companyName}
                initialData={editingCoupon}
            />
        </div>
    );
}
