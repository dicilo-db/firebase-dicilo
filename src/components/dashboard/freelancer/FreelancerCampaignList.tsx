import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Search, MapPin, Globe, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Campaign } from '@/types/freelancer';
import { getFreelancerCampaigns } from '@/app/actions/freelancer';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

interface FreelancerCampaignListProps {
    className?: string;
    onSelect: (id: string) => void;
    selectedId: string | null;
}

export function FreelancerCampaignList({ className, onSelect, selectedId }: FreelancerCampaignListProps) {
    const { t } = useTranslation('common');
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    React.useEffect(() => {
        async function load() {
            setIsLoading(true);
            const res = await getFreelancerCampaigns({});
            if (res.success && res.campaigns) {
                setCampaigns(res.campaigns);
            }
            setIsLoading(false);
        }
        load();
    }, []);

    const filtered = campaigns.filter(c =>
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={cn("flex flex-col h-full bg-white dark:bg-zinc-900 border-r", className)}>
            {/* Header */}
            <div className="p-4 border-b space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{t('freelancer.campaigns', 'Campaigns')}</h2>
                    <Badge variant="secondary" className="text-xs">{filtered.length}</Badge>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('search', 'Search...')}
                        className="pl-8 h-9 bg-secondary/50 border-0 focus-visible:ring-1"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
                <div className="flex flex-col p-2 gap-1">
                    {isLoading ? (
                        <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">Loading opportunities...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">No campaigns found.</div>
                    ) : filtered.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => onSelect(c.id!)}
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-lg text-left transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                selectedId === c.id ? "bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-200 dark:ring-zinc-700 shadow-sm" : ""
                            )}
                        >
                            {/* Logo */}
                            <div className="h-10 w-10 shrink-0 rounded-full border bg-white flex items-center justify-center overflow-hidden">
                                {c.companyLogo && c.companyLogo !== '/placeholder-logo.png' ? (
                                    <Image src={c.companyLogo} alt={c.companyName} width={40} height={40} className="object-cover h-full w-full" />
                                ) : (
                                    <span className="text-xs font-bold text-zinc-500">{c.companyName.substring(0, 2).toUpperCase()}</span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-medium text-sm truncate pr-2">{c.companyName}</h3>
                                    <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                                        ${c.rate_per_click.toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{c.title}</p>
                                <div className="flex gap-2 mt-2">
                                    {c.languages?.includes('es') && <span className="text-[10px] text-zinc-500 border px-1 rounded">ES</span>}
                                    {c.languages?.includes('en') && <span className="text-[10px] text-zinc-500 border px-1 rounded">EN</span>}
                                    {c.target_locations?.includes('Global') && (
                                        <div className="flex items-center gap-0.5 text-[10px] text-zinc-500 ml-auto">
                                            <Globe className="h-3 w-3" /> Global
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
