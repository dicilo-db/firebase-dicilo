'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { getFreelancerStats, FreelancerStats } from '@/app/actions/freelancer-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import {
    Eye, ThumbsUp, Share2, Calendar,
    Facebook, Instagram, Twitter, Linkedin,
    Image as ImageIcon, Youtube,
    MessageCircle, Send, Pin, Twitch,
    BarChart3, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatisticsView() {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const [stats, setStats] = useState<FreelancerStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        async function load() {
            setIsLoading(true);
            const res = await getFreelancerStats(user!.uid);
            if (res.success && res.stats) {
                setStats(res.stats);
            }
            setIsLoading(false);
        }
        load();
    }, [user]);

    // Derived Stats (Mocking mostly since we transition to a Follower-heavy view)
    const totalPosts = stats?.totalPosts || 0;
    const totalEarnings = stats?.totalEarnings || 0;
    const totalViews = totalPosts * 154; // Mock estimate based on screenshot numbers
    const totalReach = Math.floor(totalViews * 0.85);
    const totalInteractions = Math.floor(totalViews * 0.05);

    const channels = [
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-500' },
        { id: 'telegram', label: 'Telegram', icon: Send, color: 'text-sky-500' },
        { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
        { id: 'facebook', label: 'Facebook Fanpage', icon: Facebook, color: 'text-blue-600' },
        { id: 'tiktok', label: 'TikTok', icon: VideoIcon, color: 'text-black dark:text-white' },
        { id: 'linkedin', label: 'LinkedIn Fanpage', icon: Linkedin, color: 'text-blue-700' },
        { id: 'youtube', label: 'YouTube Kanal', icon: Youtube, color: 'text-red-600' },
        { id: 'twitter', label: '"X" (Früher Twitter)', icon: Twitter, color: 'text-slate-900 dark:text-slate-50' },
        { id: 'twitch', label: 'Twitch Kanal', icon: Twitch, color: 'text-purple-600' },
        { id: 'pinterest', label: 'Pinterest Kanal', icon: Pin, color: 'text-red-500' },
    ];

    if (isLoading) {
        return (
            <div className="p-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
                <Skeleton className="h-64 mt-8" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-black/10 min-h-full">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    {t('freelancer_views.statistics.title')} {getIconForPlatform('facebook')} {getIconForPlatform('instagram')}
                </h1>
                <p className="text-muted-foreground mt-1 max-w-3xl">
                    {t('freelancer_views.statistics.subtitle')}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={ImageIcon} label={t('freelancer_views.statistics.published_posts')} value={totalPosts} />
                <KpiCard icon={Calendar} label={t('freelancer_views.statistics.planned')} value="-" />
                <KpiCard icon={Eye} label={t('freelancer_views.statistics.contacts')} value={totalViews} />
                <KpiCard icon={Share2} label={t('freelancer_views.statistics.reach')} value={totalReach} />

                <KpiCard icon={ThumbsUp} label={t('freelancer_menu.connections')} value={totalInteractions} />
                <KpiCard icon={Facebook} label="Facebook" value="121" />
                <KpiCard icon={Instagram} label="Instagram" value="79" />
                <KpiCard icon={Users} label={t('freelancer_views.statistics.followers')} value="200" />
            </div>

            {/* ACCORDION for Insights */}
            <div className="bg-white dark:bg-card rounded-xl shadow-sm border p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-bold">{t('freelancer_views.statistics.accordion_title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('freelancer_views.statistics.accordion_desc')}</p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {channels.map((channel) => {
                        // Mock growth data logic per channel
                        const data = generateMockData(channel.id === 'facebook' ? 120 : channel.id === 'instagram' ? 70 : 10);
                        const currentFollowers = data[data.length - 1].value;
                        const growth = ((currentFollowers - data[0].value) / data[0].value * 100).toFixed(2);

                        return (
                            <AccordionItem key={channel.id} value={channel.id}>
                                <AccordionTrigger className="hover:no-underline px-4 border rounded-lg mb-2 data-[state=open]:mb-0 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:bg-slate-50 transition-all">
                                    <div className="flex items-center gap-4 w-full">
                                        <div className={cn("h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0", channel.color)}>
                                            <channel.icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-semibold text-base">{channel.label}</span>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-normal">
                                                <span>{currentFollowers} {t('freelancer_views.statistics.followers')}</span>
                                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded", Number(growth) >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                                    {Number(growth) > 0 ? '+' : ''}{growth}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="border border-t-0 p-6 rounded-b-lg">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="text-lg font-bold flex items-center gap-2">
                                                    {channel.label} <channel.icon className={cn("h-5 w-5", channel.color)} />
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-sm font-semibold">+{Math.floor(Math.random() * 5)} {t('freelancer_views.statistics.followers')}</span>
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t('freelancer_views.statistics.since')} 29.12.2024</span>
                                                </div>
                                            </div>
                                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                                <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold bg-white shadow-sm">{t('freelancer_views.statistics.filter_total')}</Button>
                                                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">{t('freelancer_views.statistics.filter_last_month')}</Button>
                                                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">{t('freelancer_views.statistics.filter_last_3_months')}</Button>
                                            </div>
                                        </div>

                                        {/* CHART */}
                                        <div className="h-[250px] w-full mt-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={data}>
                                                    <defs>
                                                        <linearGradient id={`grad-${channel.id}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis
                                                        dataKey="name"
                                                        stroke="#94a3b8"
                                                        fontSize={10}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <YAxis
                                                        stroke="#94a3b8"
                                                        fontSize={10}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        domain={['dataMin - 1', 'dataMax + 1']}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#3b82f6"
                                                        strokeWidth={2}
                                                        fillOpacity={1}
                                                        fill={`url(#grad-${channel.id})`}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </div>
        </div>
    );
}

function KpiCard({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) {
    return (
        <Card className="shadow-sm border-0 border-l-4 border-l-primary/20">
            <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm font-medium text-muted-foreground">{label}</div>
                </div>
            </CardContent>
        </Card>
    );
}

// Helper for icons
function getIconForPlatform(platform: string) {
    if (platform === 'facebook') return <Facebook className="h-4 w-4 text-blue-600 inline" />;
    if (platform === 'instagram') return <Instagram className="h-4 w-4 text-pink-600 inline" />;
    return null;
}

// Helper: Video Icon
const VideoIcon = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14v-4z" />
        <rect x="3" y="6" width="12" height="12" rx="2" />
    </svg>
)

// Generate consistent mock data for charts
function generateMockData(baseValue: number) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    let current = baseValue;
    return months.map(m => {
        // Random fluctuation
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        current += change;
        if (current < 0) current = 0;
        return { name: m, value: current };
    });
}
