'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { getJoinedCampaigns } from '@/app/actions/freelancer';
import { Campaign } from '@/types/freelancer';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Calendar, Clock, Heart, Facebook, Instagram, Linkedin, Twitter, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function MyCampaignsView() {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (!user) return;
            setIsLoading(true);
            const res = await getJoinedCampaigns(user.uid);
            if (res.success && res.campaigns) {
                setCampaigns(res.campaigns);
            }
            setIsLoading(false);
        }
        load();
    }, [user]);

    const handleOpenCampaign = (id: string, tab: string = 'templates') => {
        // Navigate to the campaign details (PromoComposer with specific view)
        // Using query params to handle navigation state
        const params = new URLSearchParams(window.location.search);
        params.set('tab', tab);
        params.set('campaignId', id);
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    if (isLoading) {
        return (
            <div className="p-6 md:p-8">
                <h1 className="text-2xl font-bold mb-6">{t('freelancer_menu.my_campaigns')}</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-[350px] rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('freelancer_menu.my_campaigns')}</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Aquí encontrarás todas las campañas activas que has aceptado. Gestiona tus promociones y revisa los detalles.
                </p>
            </div>

            {campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-zinc-900 rounded-xl border border-dashed">
                    <Heart className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <h2 className="text-xl font-semibold mb-2">No tienes campañas activas</h2>
                    <p className="text-muted-foreground mb-6 max-w-sm">No has aceptado ninguna campaña todavía. Explora nuevas oportunidades para empezar a ganar.</p>
                    <Button onClick={() => {
                        const params = new URLSearchParams(window.location.search);
                        params.set('tab', 'all_campaigns'); // Or 'explorer'
                        router.push(`${window.location.pathname}?${params.toString()}`);
                    }}>
                        Explorar Campañas
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {campaigns.map((campaign) => {
                        // Mocking visual data if missing
                        const coverImage = campaign.images?.[0] || '/placeholder-campaign.jpg';
                        const daysRemaining = calculateDaysRemaining(campaign);

                        return (
                            <Card
                                key={campaign.id}
                                className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-none shadow-md flex flex-col h-full bg-white dark:bg-zinc-900 cursor-pointer"
                                onClick={() => handleOpenCampaign(campaign.id)}
                            >
                                {/* Image Cover */}
                                <div className="relative h-48 w-full bg-zinc-100 overflow-hidden">
                                    {/* Joined/Heart Icon Overlay - Always active here */}
                                    <div className="absolute top-3 right-3 z-10 bg-white/90 p-1.5 rounded-full shadow-sm">
                                        <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                                    </div>

                                    {imageLoaderProps(coverImage) ? (
                                        <Image
                                            src={coverImage}
                                            alt={campaign.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-zinc-200 text-zinc-400">
                                            <Image className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" src="" alt="" />
                                        </div>
                                    )}

                                    {/* Category Badge */}
                                    <div className="absolute bottom-3 left-3 z-10">
                                        <Badge variant="secondary" className="bg-white/90 hover:bg-white text-zinc-900 shadow-sm backdrop-blur-sm">
                                            {campaign.categories?.[0] || 'General'}
                                        </Badge>
                                    </div>
                                </div>

                                <CardContent className="flex-1 p-5 space-y-3">
                                    {/* Company & Socials */}
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg line-clamp-1">{campaign.companyName}</h3>
                                        {/* Social Icons based on campaign requirements? Mocking for now from image ref */}
                                        <div className="flex gap-1.5 text-zinc-400">
                                            <Instagram className="h-4 w-4" />
                                            <Facebook className="h-4 w-4" />
                                        </div>
                                    </div>

                                    <h4 className="font-medium leading-tight text-zinc-700 dark:text-zinc-200 line-clamp-2 min-h-[2.5rem]">
                                        {campaign.title}
                                    </h4>

                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {campaign.description}
                                    </p>
                                </CardContent>

                                <CardFooter className="p-5 pt-0 border-t border-zinc-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 mt-auto flex items-center justify-between text-xs text-zinc-500 font-medium">
                                    <div className="flex items-center gap-4 py-3 w-full">
                                        <div className="flex items-center gap-1.5 min-w-[30%]">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>{daysRemaining} Tage</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 truncate">
                                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">{campaign.target_locations?.includes('Global') ? 'Global' : campaign.target_locations?.[0] || 'Online'}</span>
                                        </div>
                                    </div>

                                    {/* Arrow Action */}
                                    <Button size="icon" variant="ghost" className="h-8 w-8 -mr-2 text-primary">
                                        <ArrowRight className="h-4 w-4" />
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

function calculateDaysRemaining(campaign: Campaign): number {
    // Mock logic: if startDate/endDate exists use them, else random or default
    // We don't have explicit endDate in the interface yet, let's assume 14 days or check createdAt
    const created = new Date(campaign.createdAt);
    const now = new Date();
    // Assuming 30 days validity for now as placeholder logic or reading a 'validUntil' field
    const validUntil = new Date(created);
    validUntil.setDate(validUntil.getDate() + 30);

    const diffTime = Math.abs(validUntil.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

function imageLoaderProps(src: string) {
    return src && src.startsWith('http');
}
