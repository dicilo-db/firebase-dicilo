'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { exploreCampaigns, ExplorableCampaign, CampaignExplorerFilters } from '@/app/actions/campaign-explorer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, AlertTriangle, ArrowRight, Wallet, Globe, Check } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

export function AllCampaignsView() {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [campaigns, setCampaigns] = useState<ExplorableCampaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<CampaignExplorerFilters>({});

    useEffect(() => {
        async function load() {
            setIsLoading(true);
            const result = await exploreCampaigns(filters);
            if (result.success && result.campaigns) {
                setCampaigns(result.campaigns);
            }
            setIsLoading(false);
        }
        load();
    }, [filters]); // Reload when filters change

    const filteredCampaigns = campaigns.filter(c =>
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCardClick = (id: string) => {
        // Navigate to the 'templates' view with campaignId
        router.push(`/dashboard/freelancer?tab=templates&campaignId=${id}`);
    };

    return (
        <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-black/10 min-h-full">
            {/* HERDER & FILTERS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('freelancer_menu.all_campaigns')}</h1>
                    <p className="text-muted-foreground">{t('campaign_explorer.search_placeholder', 'Encuentra tu próxima promoción')}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('campaign_explorer.search_placeholder')}
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Add Filter Button/Dropdown Logic later if needed */}
                </div>
            </div>

            {/* ERROR / EMPTY STATE */}
            {!isLoading && filteredCampaigns.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No se encontraron campañas activas con estos filtros.</p>
                </div>
            )}

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden border-0 shadow-sm">
                            <Skeleton className="h-40 w-full" />
                            <div className="p-4 space-y-2">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </Card>
                    ))
                ) : (
                    filteredCampaigns.map((campaign) => (
                        <Card
                            key={campaign.id}
                            onClick={() => handleCardClick(campaign.id)}
                            className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800"
                        >
                            {/* COVER IMAGE */}
                            <div className="relative h-40 bg-slate-100 overflow-hidden">
                                {campaign.images && campaign.images.length > 0 ? (
                                    <Image
                                        src={campaign.images[0]}
                                        alt={campaign.companyName}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-slate-200 text-slate-400">
                                        <Image src="/placeholder-logo.png" width={40} height={40} alt="Placeholder" className="opacity-50" />
                                    </div>
                                )}

                                {/* Urgency Badge */}
                                {campaign.urgency === 'high' && (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center shadow-lg animate-pulse">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        {t('campaign_explorer.pool_status_high', 'High Urgency')}
                                    </div>
                                )}

                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                                    <h3 className="font-bold text-lg leading-tight truncate">{campaign.companyName}</h3>
                                    <p className="text-xs opacity-90 truncate">{campaign.description}</p>
                                </div>
                            </div>

                            {/* BODY */}
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm line-clamp-1">{campaign.title}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-3 min-h-[48px]">
                                        {campaign.description}
                                    </p>
                                </div>

                                <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed">
                                    <div className="flex items-center text-muted-foreground text-xs">
                                        <Globe className="h-3.5 w-3.5 mr-1" />
                                        {campaign.languages?.slice(0, 2).join(', ').toUpperCase() || 'ALL'}
                                    </div>
                                    <div className="font-bold text-green-600 flex items-center bg-green-50 px-2 py-0.5 rounded-md">
                                        <Wallet className="h-3.5 w-3.5 mr-1" />
                                        €{campaign.reward_per_action ? campaign.reward_per_action.toFixed(2) : '0.10'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <Button
                                        className="w-full text-xs"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCardClick(campaign.id);
                                        }}
                                    >
                                        Ver Detalles
                                    </Button>
                                    <Button
                                        className="w-full text-xs gap-1"
                                        variant="default"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (!user) return;

                                            // Optimistic Update or Loading state could be added here
                                            toast({ title: "Uniéndose...", duration: 1000 });

                                            const { joinCampaign } = await import('@/app/actions/freelancer');
                                            const res = await joinCampaign(user.uid, campaign.id);

                                            if (res.success) {
                                                toast({
                                                    title: "¡Campaña Aceptada!",
                                                    description: "Ahora puedes encontrarla en 'Mis Campañas'.",
                                                    variant: "default",
                                                    className: "bg-green-600 text-white border-0"
                                                });
                                                router.push('/dashboard/freelancer?tab=my_campaigns');
                                            } else {
                                                toast({
                                                    title: "Error",
                                                    description: res.message || res.error,
                                                    variant: "destructive"
                                                });
                                            }
                                        }}
                                    >
                                        <Check className="h-3 w-3" /> Aceptar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
