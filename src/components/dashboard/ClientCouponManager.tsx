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
}

export function ClientCouponManager({ companyId, companyName, category }: ClientCouponManagerProps) {
    const { toast } = useToast();
    const { t } = useTranslation(['admin', 'common']);
    const [coupons, setCoupons] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchCoupons = async () => {
        setIsLoading(true);
        try {
            const res = await getCouponsByCompany(companyId);
            if (res.success && res.coupons) {
                setCoupons(res.coupons);
            } else {
                toast({
                    title: 'Fehler',
                    description: res.error || 'Fehler beim Laden der Coupons.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                title: 'Fehler',
                description: error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten.',
                variant: 'destructive',
            });
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Meine Coupons</h3>
                    <p className="text-sm text-muted-foreground">
                        Verwalten Sie hier Ihre Rabattaktionen und Angebote.
                    </p>
                </div>
                <Button type="button" onClick={() => setIsCreateOpen(true)}>
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
                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(true)}>
                            Jetzt erstellen
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {coupons.map((coupon) => (
                        <Card key={coupon.id} className="overflow-hidden flex flex-col h-full group">
                            {/* Background Image Header */}
                            <div className="h-32 w-full bg-slate-100 relative overflow-hidden">
                                {coupon.backgroundImage ? (
                                    <img
                                        src={coupon.backgroundImage}
                                        alt={coupon.category}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-muted">
                                        <Tag className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    {getStatusBadge(coupon.status)}
                                </div>
                                <div className="absolute top-2 left-2">
                                    {renderDiscountBadge(coupon)}
                                </div>
                            </div>

                            <CardHeader className="pb-2 pt-4">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="text-xs font-mono">{coupon.code}</Badge>
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
                    ))}
                </div>
            )}

            <CouponForm
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={() => {
                    fetchCoupons();
                    setIsCreateOpen(false);
                }}
                category={category}
                fixedCompanyId={companyId}
                fixedCompanyName={companyName}
            />
        </div>
    );
}
