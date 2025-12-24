'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    BarChart3,
    CreditCard,
    Globe,
    MapPin,
    ChevronRight,
    Search,
    CheckCircle2,
    Circle
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

import { getFreelancerCampaigns } from '@/app/actions/freelancer';
import { Campaign } from '@/types/freelancer';

interface FreelancerSidebarProps {
    className?: string;
}

export function FreelancerSidebar({ className }: FreelancerSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedCampaignId = searchParams.get('campaignId');

    const [langFilters, setLangFilters] = useState({
        es: true,
        en: false,
        de: false
    });

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch campaigns on mount and when filters change
    React.useEffect(() => {
        async function loadCampaigns() {
            setIsLoading(true);
            const activeLangs = Object.entries(langFilters).filter(([_, v]) => v).map(([k]) => k);
            const res = await getFreelancerCampaigns({ languages: activeLangs });
            if (res.success && res.campaigns) {
                setCampaigns(res.campaigns);
                // If no campaign selected in URL, select the first one automatically
                if (!selectedCampaignId && res.campaigns.length > 0) {
                    router.replace(`${pathname}?campaignId=${res.campaigns[0].id}`);
                }
            }
            setIsLoading(false);
        }
        loadCampaigns();
    }, [langFilters]); // Re-fetch when filters change

    const menuItems = [
        { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/freelancer' },
        { title: 'Estadísticas', icon: BarChart3, href: '/dashboard/freelancer/stats' },
        { title: 'Pagos', icon: CreditCard, href: '/dashboard/freelancer/payments' },
    ];

    return (
        <div className={cn("pb-12 w-64 flex-shrink-0 bg-card border-r h-screen overflow-y-auto", className)}>
            <div className="space-y-4 py-4">

                {/* Header Profile */}
                <div className="px-3 py-2">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src="/avatars/01.png" alt="@user" />
                                <AvatarFallback>FR</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">Representante</span>
                                <span className="text-[10px] text-muted-foreground">ID: 8723...</span>
                            </div>
                        </div>
                        <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                            <div className="h-6 w-6 rounded-full border border-muted-foreground/30 flex items-center justify-center">
                                <ChevronRight className="h-3 w-3" />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Main Nav */}
                <div className="px-3 py-2">
                    <div className="space-y-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                                    pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
                                )}
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                <span>{item.title}</span>
                                <ChevronRight className={cn("ml-auto h-4 w-4 opacity-0 transition-opacity", pathname === item.href && "opacity-100")} />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Segmentation Filters */}
                <div className="px-4 py-2 mt-4">
                    <h3 className="mb-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                        Filtros de Segmentación
                    </h3>

                    <div className="space-y-4">
                        {/* Language Toggles */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Idioma ES</span>
                            </div>
                            <Switch
                                checked={langFilters.es}
                                onCheckedChange={(c) => setLangFilters(prev => ({ ...prev, es: c }))}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Idioma EN</span>
                            </div>
                            <Switch
                                checked={langFilters.en}
                                onCheckedChange={(c) => setLangFilters(prev => ({ ...prev, en: c }))}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Idioma DE</span>
                            </div>
                            <Switch
                                checked={langFilters.de}
                                onCheckedChange={(c) => setLangFilters(prev => ({ ...prev, de: c }))}
                            />
                        </div>

                        {/* Location Filter */}
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Ciudad / Alcance</span>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                                <Input placeholder="Ciudad..." className="h-8 text-xs pl-7 bg-muted/50" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Companies List */}
                <div className="px-4 py-2 mt-4">
                    <h3 className="mb-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                        Empresas para Promoción
                    </h3>
                    <ScrollArea className="h-[300px] pr-2">
                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="text-center py-4 text-muted-foreground text-xs">Cargando campañas...</div>
                            ) : campaigns.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground text-xs">No hay campañas disponibles para estos filtros.</div>
                            ) : campaigns.map((campaign) => (
                                <div
                                    key={campaign.id}
                                    onClick={() => router.push(`${pathname}?campaignId=${campaign.id}`)}
                                    className={cn(
                                        "flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors",
                                        selectedCampaignId === campaign.id ? "bg-muted" : ""
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                            {campaign.companyName.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className={cn("text-sm line-clamp-1", selectedCampaignId === campaign.id ? "font-medium text-foreground" : "text-muted-foreground")}>
                                            {campaign.companyName}
                                        </span>
                                    </div>
                                    {selectedCampaignId === campaign.id ? (
                                        <Switch checked={true} className="scale-75 data-[state=checked]:bg-primary shrink-0" />
                                    ) : (
                                        <Circle className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}
