'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, Calendar, MapPin, Euro, Percent, Type, Download, Mailbox, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAllCoupons } from '@/app/actions/coupons';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { de, es, enUS } from 'date-fns/locale';
import { getDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';

interface MiBoxProps {
    user: User;
}

export function MiBox({ user }: MiBoxProps) {
    const { toast } = useToast();
    const { t, i18n } = useTranslation(['common', 'dashboard']);
    const currentLang = i18n.language?.split('-')[0] || 'es';
    
    const [coupons, setCoupons] = useState<any[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const localeMap: any = { de, es, en: enUS };
    const dateLocale = localeMap[currentLang] || es;

    useEffect(() => {
        const fetchBoxData = async () => {
            if (!user?.uid) return;
            setIsLoading(true);

            try {
                // 1. Fetch User Profile
                const userDoc = await getDoc(doc(db, 'private_profiles', user.uid));
                let profileData: any = {};
                if (userDoc.exists()) {
                    profileData = userDoc.data();
                    setUserProfile(profileData);
                }

                const interests = profileData.interests || [];
                const favorites = profileData.favorites || [];
                const consumedCoupons = profileData.consumedCoupons || [];
                const userCity = profileData.city?.toLowerCase().trim() || '';
                const userCountry = profileData.country?.toLowerCase().trim() || '';

                // 2. Fetch Active Coupons
                const res = await getAllCoupons({ status: 'active' });
                if (res.success && res.coupons) {
                    const activeCoupons = res.coupons;

                    // 3. Filter "Mi Box" logic
                    const filteredCoupons = activeCoupons.filter((c: any) => {
                        // Skip if consumed
                        if (consumedCoupons.includes(c.id)) return false;

                        // Is Favorite Company?
                        const isFavorite = favorites.includes(c.companyId);

                        // Is Interest Match?
                        let isInterestMatch = false;
                        if (interests.includes(c.category) || (c.subcategory && interests.includes(c.subcategory))) {
                            isInterestMatch = true;
                        }

                        // Legacy check for English keys mapped to Firebase IDs in CategorySelector
                        // Assuming new interests use Firebase IDs, but just in case we also check c.category string loosely
                        // The user's interests array contains the exact IDs they checked.
                        const cCatLower = c.category?.toLowerCase();
                        if (interests.some((i: string) => i.toLowerCase() === cCatLower)) {
                            isInterestMatch = true;
                        }

                        // Is Location Match?
                        const cCity = c.city?.toLowerCase().trim() || '';
                        const cCountry = c.country?.toLowerCase().trim() || '';
                        const isLocationMatch = (userCountry && cCountry && userCountry === cCountry) && 
                                                (userCity && cCity && userCity === cCity);

                        // Box Filter rule
                        if (isFavorite || (isInterestMatch && isLocationMatch)) {
                            return true;
                        }

                        return false;
                    });

                    setCoupons(filteredCoupons);
                }
            } catch (error) {
                console.error("Error fetching Mi Box data", error);
                toast({ title: 'Error', description: 'No se pudo cargar el Buzón.', variant: 'destructive' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchBoxData();
    }, [user, toast]);

    const renderDiscountBadge = (coupon: any) => {
        if (!coupon.discountType || coupon.discountType === 'text') {
            return <Badge variant="secondary" className="gap-1"><Type className="h-3 w-3" /> Oferta</Badge>;
        }
        if (coupon.discountType === 'percent') {
            return <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800"><Percent className="h-3 w-3" /> {coupon.discountValue}%</Badge>;
        }
        if (coupon.discountType === 'euro') {
            return <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800"><Euro className="h-3 w-3" /> {coupon.discountValue}€</Badge>;
        }
        return null;
    };

    const handleConsumeAndDownload = async (coupon: any, type: 'jpg' | 'pdf') => {
        if (!user?.uid) return;

        try {
            // 1. Download Logic
            const html2canvas = (await import('html2canvas')).default;
            const element = document.getElementById(`box-coupon-card-${coupon.id}`);
            if (!element) return;

            const originalTransform = element.style.transform;
            element.style.transform = "none";
            const canvas = await html2canvas(element, { scale: 2, useCORS: true } as any);
            element.style.transform = originalTransform;

            if (type === 'jpg') {
                const link = document.createElement('a');
                link.download = `dicilo-cupon-${coupon.code}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.9);
                link.click();
            } else {
                const jsPDF = (await import('jspdf')).default;
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a6' });
                pdf.addImage(imgData, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
                pdf.save(`dicilo-cupon-${coupon.code}.pdf`);
            }

            // 2. Register as consumed
            const userRef = doc(db, 'private_profiles', user.uid);
            await updateDoc(userRef, {
                consumedCoupons: arrayUnion(coupon.id)
            });

            // 3. Remove from UI
            setCoupons(prev => prev.filter(c => c.id !== coupon.id));
            
            toast({ title: t('dashboard.couponObtained', '¡Cupón Obtenido!'), description: t('dashboard.couponObtainedDesc', 'Se ha guardado en tu dispositivo y removido del buzón.') });
        } catch (error) {
            console.error("Error consuming coupon", error);
            toast({ title: 'Error', description: t('dashboard.couponError', 'No se pudo procesar el cupón.'), variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                        <Mailbox className="h-6 w-6" />
                        {t('dashboard.miBoxTitle', 'Mi Box (Buzón)')}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('dashboard.miBoxDesc', 'Aquí recibes ofertas personalizadas de tus aliados favoritos y categorías de interés en tu ciudad.')}
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : coupons.length === 0 ? (
                <Card className="border-dashed bg-muted/30">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Archive className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-medium text-foreground">{t('dashboard.miBoxEmptyTitle', 'Tu buzón está vacío')}</h3>
                        <p className="text-sm text-muted-foreground max-w-md mt-2">
                            {t('dashboard.miBoxEmptyDesc', 'Aún no tienes nuevas ofertas. Asegúrate de actualizar tus intereses y seguir a tus negocios locales favoritos para recibir sus promociones exclusivas aquí.')}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {coupons.map((coupon) => (
                        <div key={coupon.id} className="flex flex-col gap-3 group relative perspective-1000 h-full justify-between">
                            {/* Card Wrapper for html2canvas */}
                            <Card id={`box-coupon-card-${coupon.id}`} className="flex-1 overflow-hidden flex flex-col border-2 hover:border-primary/50 transition-all bg-white relative shadow-md">
                                {/* Banner */}
                                <div className="h-36 w-full bg-slate-100 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    {coupon.backgroundImage ? (
                                        <img
                                            src={coupon.backgroundImage}
                                            alt={coupon.title}
                                            crossOrigin="anonymous"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
                                            <Tag className="h-10 w-10 text-primary/40" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                                        {renderDiscountBadge(coupon)}
                                    </div>
                                </div>

                                <CardHeader className="pb-2 pt-4 relative bg-white">
                                    <Badge variant="outline" className="w-max text-xs font-mono bg-slate-50 mb-2 border-primary/20 text-primary">
                                        {coupon.code}
                                    </Badge>
                                    <CardTitle className="text-lg line-clamp-2 leading-tight">{coupon.title}</CardTitle>
                                    <CardDescription className="line-clamp-3 min-h-[60px] mt-2 text-sm">
                                        {coupon.description}
                                    </CardDescription>
                                </CardHeader>
                                
                                <CardContent className="text-sm space-y-3 mt-auto bg-slate-50/50 pt-4">
                                    <div className="flex items-center text-muted-foreground bg-white p-2 rounded-md border shadow-sm">
                                        <Calendar className="mr-2 h-4 w-4 text-primary" />
                                        <span className="font-medium text-xs">
                                            {t('validUntil', 'Válido hasta:')} {coupon.endDate && !isNaN(new Date(coupon.endDate).getTime()) ? format(new Date(coupon.endDate), 'dd MMM yyyy', { locale: dateLocale }) : 'Pronto'}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-muted-foreground text-xs px-1">
                                        <MapPin className="mr-2 h-3 w-3" />
                                        <span className="truncate">{coupon.city}, {coupon.country}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Download Actions (Excluded from capture container) */}
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <Button className="w-full text-xs shadow-sm hover:shadow-md transition-shadow" variant="default" onClick={() => handleConsumeAndDownload(coupon, 'pdf')}>
                                    <Download className="mr-2 h-3 w-3" />
                                    {t('downloadPDF', 'Descargar PDF')}
                                </Button>
                                <Button className="w-full text-xs shadow-sm hover:shadow-md transition-shadow" variant="outline" onClick={() => handleConsumeAndDownload(coupon, 'jpg')}>
                                    <Download className="mr-2 h-3 w-3" />
                                    {t('downloadJPG', 'Descargar JPG')}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
