'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard, DollarSign, Target, Eye,
    ArrowUpRight, Plus, Calendar, Compass,
    Share2, ExternalLink, Sparkles
} from 'lucide-react';
import Image from 'next/image';

// Backend Actions
import { getFreelancerStats, FreelancerStats } from '@/app/actions/freelancer-stats';
import { getJoinedCampaigns } from '@/app/actions/freelancer';
import { Campaign } from '@/types/freelancer';

export function DashboardHomeView() {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<FreelancerStats | null>(null);
    const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);

    useEffect(() => {
        if (!user) return;

        async function loadDashboardData() {
            setIsLoading(true);
            try {
                // Fetch Stats & Active Campaigns in parallel
                const [statsRes, campaignsRes] = await Promise.all([
                    getFreelancerStats(user!.uid),
                    getJoinedCampaigns(user!.uid)
                ]);

                if (statsRes.success && statsRes.stats) {
                    setStats(statsRes.stats);
                }

                if (campaignsRes.success && campaignsRes.campaigns) {
                    setActiveCampaigns(campaignsRes.campaigns);
                }

            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setIsLoading(false);
            }
        }

        loadDashboardData();
    }, [user]);

    // Mock generic values if no stats yet
    const earnings = stats?.totalEarnings || 0;
    const postsCount = stats?.totalPosts || 0;
    const clicks = stats?.totalClicks || 0;
    // Estimate reach if not provided directly
    const reach = postsCount * 150;

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-black/10 min-h-full fade-in animate-in duration-500">

            {/* WELCOME HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        {t('freelancer_dashboard.welcome')} <span className="text-primary">{user?.displayName?.split(' ')[0] || 'Freelancer'}</span>! 👋
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('freelancer_dashboard.overview')}
                    </p>
                </div>
                <Button onClick={() => router.push('/dashboard/freelancer?tab=campaigns')} className="shadow-md">
                    <Compass className="mr-2 h-4 w-4" /> {t('freelancer_dashboard.explore_btn')}
                </Button>
            </div>

            {/* TOP STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title={t('freelancer_dashboard.total_earnings')}
                    value={`€${earnings.toFixed(2)}`}
                    icon={DollarSign}
                    trend="+12%" // Mock trend
                    color="text-green-600"
                />
                <StatCard
                    title={t('freelancer_dashboard.active_campaigns')}
                    value={activeCampaigns.length.toString()}
                    icon={Target}
                    subValue={`${postsCount} Posts`}
                    color="text-blue-600"
                />
                <StatCard
                    title={t('freelancer_dashboard.total_reach')}
                    value={reach.toLocaleString()}
                    icon={Eye}
                    subValue={`${clicks} Clicks`}
                    color="text-purple-600"
                />
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN (2/3) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* ACTIVE CAMPAIGNS SECTION */}
                    <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-lg font-bold">{t('freelancer_dashboard.your_campaigns')}</CardTitle>
                                <CardDescription>{t('freelancer_dashboard.quick_actions')}</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/freelancer?tab=my_campaigns')}>
                                {t('freelancer_dashboard.view_all_stats')} <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {activeCampaigns.length > 0 ? (
                                <div className="space-y-4">
                                    {activeCampaigns.slice(0, 3).map((campaign) => (
                                        <div
                                            key={campaign.id}
                                            className="group flex items-center gap-4 p-3 rounded-lg border bg-white dark:bg-slate-900 hover:shadow-md transition-all cursor-pointer"
                                            onClick={() => router.push(`/dashboard/freelancer?tab=templates&campaignId=${campaign.id}`)}
                                        >
                                            <div className="relative h-12 w-12 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
                                                {campaign.images && campaign.images[0] ? (
                                                    <Image src={campaign.images[0]} alt={campaign.companyName} fill className="object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center bg-slate-200 text-slate-400 font-bold">
                                                        {campaign.companyName.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{campaign.companyName}</h4>
                                                <p className="text-xs text-muted-foreground truncate">{campaign.title}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-right hidden sm:block">
                                                    <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">€{campaign.reward_per_action?.toFixed(2)}/post</div>
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground group-hover:text-primary">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed">
                                    <Target className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                                    <p className="text-muted-foreground mb-4">{t('freelancer_dashboard.no_campaigns')}</p>
                                    <Button onClick={() => router.push('/dashboard/freelancer?tab=campaigns')}>
                                        {t('freelancer_dashboard.explore_btn')}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* RECENT ACTIVITY CHART PREVIEW (Mock) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('freelancer_dashboard.recent_activity')}</CardTitle>
                        </CardHeader>
                        <CardContent className="h-64 flex items-center justify-center bg-slate-50/50">
                            {/* Placeholder for a chart - reusing the visual style implies keeping it clean */}
                            <div className="text-center text-muted-foreground">
                                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50 text-indigo-400" />
                                <p className="text-sm">Activity Graph will appear here once you start posting.</p>
                                <Button variant="link" onClick={() => router.push('/dashboard/freelancer?tab=statistics')}>
                                    {t('freelancer_dashboard.view_all_stats')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* RIGHT COLUMN (1/3) */}
                <div className="space-y-8">

                    {/* UP NEXT / TASKS */}
                    <Card className="bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900 dashed-border">
                        <CardHeader>
                            <CardTitle className="text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> {t('freelancer_dashboard.up_next')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="text-sm">
                                    <p className="font-semibold text-slate-700 dark:text-slate-300">Daily Post Limit Reset</p>
                                    <p className="text-xs text-muted-foreground">in 4 hours</p>
                                </div>
                                <div className="text-sm">
                                    <p className="font-semibold text-slate-700 dark:text-slate-300">New Campaign: TechTrend</p>
                                    <p className="text-xs text-muted-foreground">Starts tomorrow</p>
                                </div>
                                <Button className="w-full mt-2 text-xs" variant="outline" onClick={() => router.push('/dashboard/freelancer?tab=marketing_plan')}>
                                    View Full Plan
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* QUICK ACTIONS */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('freelancer_dashboard.quick_actions')}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-3">
                            <Button variant="outline" className="justify-start h-auto py-3" onClick={() => router.push('/dashboard/freelancer?tab=campaigns')}>
                                <Compass className="mr-3 h-5 w-5 text-blue-500" />
                                <div className="text-left">
                                    <div className="font-semibold">{t('freelancer_dashboard.explore_btn')}</div>
                                    <div className="text-[10px] text-muted-foreground">Find new brands</div>
                                </div>
                            </Button>
                            <Button variant="outline" className="justify-start h-auto py-3" onClick={() => router.push('/dashboard/freelancer?tab=connections')}>
                                <Share2 className="mr-3 h-5 w-5 text-pink-500" />
                                <div className="text-left">
                                    <div className="font-semibold">{t('freelancer_dashboard.connect_socials')}</div>
                                    <div className="text-[10px] text-muted-foreground">Link Instagram, TikTok...</div>
                                </div>
                            </Button>
                            <Button variant="outline" className="justify-start h-auto py-3" onClick={() => router.push('/dashboard/freelancer?tab=statistics')}>
                                <DollarSign className="mr-3 h-5 w-5 text-green-500" />
                                <div className="text-left">
                                    <div className="font-semibold">{t('freelancer_dashboard.view_all_stats')}</div>
                                    <div className="text-[10px] text-muted-foreground">Check your earnings</div>
                                </div>
                            </Button>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, trend, subValue, color }: any) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(trend || subValue) && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        {trend && <span className="text-green-600 bg-green-50 px-1 rounded">{trend}</span>}
                        {subValue && <span>{subValue}</span>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DashboardSkeleton() {
    return (
        <div className="p-8 space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Skeleton className="col-span-2 h-96" />
                <div className="space-y-8">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-60" />
                </div>
            </div>
        </div>
    )
}
