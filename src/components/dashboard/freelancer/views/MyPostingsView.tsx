'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { getFreelancerPostings } from '@/app/actions/freelancer';
import { CampaignAction } from '@/types/freelancer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
    Eye, ThumbsUp, Share2, Calendar,
    Facebook, Instagram, Twitter, Linkedin,
    Image as ImageIcon, Video, Youtube,
    MessageCircle, Send, Pin, Twitch,
    BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MyPostingsView() {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const [postings, setPostings] = useState<CampaignAction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (!user) return;
            setIsLoading(true);
            const res = await getFreelancerPostings(user.uid);
            if (res.success && res.postings) {
                setPostings(res.postings);
            }
            setIsLoading(false);
        }
        load();
    }, [user]);

    // Derived Stats
    const totalPosts = postings.length;
    const totalViews = postings.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalInteractions = postings.reduce((sum, p) => sum + (p.clicks || 0), 0);
    const totalReach = Math.floor(totalViews * 0.85);

    const channels = [
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-500' },
        { id: 'telegram', label: 'Telegram', icon: Send, color: 'text-sky-500' },
        { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
        { id: 'facebook', label: 'Facebook Fanpage', icon: Facebook, color: 'text-blue-600' },
        { id: 'tiktok', label: 'TikTok', icon: Video, color: 'text-black dark:text-white' },
        { id: 'linkedin', label: 'LinkedIn Fanpage', icon: Linkedin, color: 'text-blue-700' },
        { id: 'youtube', label: 'YouTube Kanal', icon: Youtube, color: 'text-red-600' },
        { id: 'twitter', label: '"X" (Früher Twitter)', icon: Twitter, color: 'text-slate-900 dark:text-slate-50' },
        { id: 'twitch', label: 'Twitch Kanal', icon: Twitch, color: 'text-purple-600' },
        { id: 'pinterest', label: 'Pinterest Kanal', icon: Pin, color: 'text-red-500' },
    ];

    const getIconForPlatform = (platform?: string) => {
        const channel = channels.find(c => c.id === platform?.toLowerCase());
        const Icon = channel?.icon || Share2;
        return <Icon className={cn("h-4 w-4", channel?.color)} />;
    };

    return (
        <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-black/10 min-h-full">

            {/* Header Section */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    {t('freelancer_views.my_postings.title')} {getIconForPlatform('facebook')} {getIconForPlatform('instagram')}
                </h1>
                <p className="text-muted-foreground mt-1 max-w-3xl">
                    {t('freelancer_views.my_postings.subtitle')}
                </p>
            </div>

            {/* KPI Cards (Global) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={ImageIcon} label={t('freelancer_views.my_postings.kpi_posts')} value={totalPosts} />
                <KpiCard icon={Eye} label={t('freelancer_views.my_postings.kpi_views')} value={totalViews} />
                <KpiCard icon={Share2} label={t('freelancer_views.my_postings.kpi_reach')} value={totalReach} />
                <KpiCard icon={ThumbsUp} label={t('freelancer_views.my_postings.kpi_interactions')} value={totalInteractions} />
            </div>

            {/* CHANNELS ACCORDION */}
            <div className="bg-white dark:bg-card rounded-xl shadow-sm border p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-bold">{t('freelancer_views.my_postings.breakdown_title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('freelancer_views.my_postings.breakdown_desc')}</p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    {channels.map((channel) => {
                        const channelPosts = postings.filter(p => p.platform?.toLowerCase() === channel.id);
                        const channelViews = channelPosts.reduce((sum, p) => sum + (p.views || 0), 0);
                        const hasPosts = channelPosts.length > 0;

                        return (
                            <AccordionItem key={channel.id} value={channel.id}>
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-4 w-full">
                                        <div className={cn("h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0", channel.color)}>
                                            <channel.icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-semibold text-base">{channel.label}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {hasPosts ? `${channelPosts.length} posts` : t('freelancer_views.my_postings.no_activity')}
                                            </span>
                                        </div>
                                        {hasPosts && (
                                            <div className="ml-auto mr-4 flex items-center gap-4 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Eye className="h-3 w-3" /> {channelViews}
                                                </div>
                                                <div className="hidden sm:flex items-center gap-1">
                                                    <BarChart3 className="h-3 w-3" /> {Math.floor(channelViews * 0.85)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pl-4 sm:pl-14 pt-2 pb-4">
                                        <div className="rounded-md border bg-card">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/50">
                                                        <TableHead className="w-[300px]">{t('freelancer_views.my_postings.table_post')}</TableHead>
                                                        <TableHead>{t('freelancer_views.my_postings.table_date')}</TableHead>
                                                        <TableHead>{t('freelancer_views.my_postings.table_format')}</TableHead>
                                                        <TableHead className="text-right">{t('freelancer_views.my_postings.table_views')}</TableHead>
                                                        <TableHead className="text-right">{t('freelancer_views.my_postings.table_interactions')}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {!hasPosts ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                                {t('freelancer_views.my_postings.no_posts')}
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        channelPosts.map((post) => (
                                                            <TableRow key={post.id}>
                                                                <TableCell>
                                                                    <div className="font-medium line-clamp-1">{post.companyName || 'Campaña'}</div>
                                                                    <div className="text-xs text-muted-foreground line-clamp-1">{post.topic || 'Sin tema'}</div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="text-xs">
                                                                        {new Date(post.createdAt).toLocaleDateString()}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <ImageIcon className="h-4 w-4 text-slate-400" />
                                                                </TableCell>
                                                                <TableCell className="text-right font-mono text-xs">
                                                                    {post.views || 0}
                                                                </TableCell>
                                                                <TableCell className="text-right font-mono text-xs">
                                                                    {post.clicks || 0}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
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
