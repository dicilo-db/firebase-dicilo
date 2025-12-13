'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Tag, Calendar, MapPin } from 'lucide-react';
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
        setIsLoading(false);
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Meine Coupons</h3>
                    <p className="text-sm text-muted-foreground">
                        Verwalten Sie hier Ihre Rabattaktionen und Angebote.
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
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
                        <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                            Jetzt erstellen
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {coupons.map((coupon) => (
                        <Card key={coupon.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline">{coupon.code}</Badge>
                                    {getStatusBadge(coupon.status)}
                                </div>
                                <CardTitle className="text-lg mt-2">{coupon.title}</CardTitle>
                                <CardDescription className="line-clamp-2">{coupon.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <div className="flex items-center text-muted-foreground">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>
                                        {format(new Date(coupon.startDate), 'dd.MM.yy', { locale: de })} - {format(new Date(coupon.endDate), 'dd.MM.yy', { locale: de })}
                                    </span>
                                </div>
                                <div className="flex items-center text-muted-foreground">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    <span>{coupon.city}, {coupon.country}</span>
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
