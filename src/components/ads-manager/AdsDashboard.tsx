'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Mail, MonitorPlay, ArrowRight, BarChart, Database, ShoppingBag, Layout, Gift, Users, Store, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { seedCampaignsAction } from '@/app/actions/seed-freelancer';
import { useToast } from "@/hooks/use-toast";
import { NetworkCampaignsManager } from './NetworkCampaignsManager';
import { QrManager } from './QrManager';
import { ProspectsManager } from './ProspectsManager';
import { ReferralCard } from '@/components/dashboard/ReferralCard';
import { MarketingShareCard } from './MarketingShareCard';
import { EmailMarketingComposer } from './EmailMarketingComposer';
import { EmailTemplate } from '@/actions/email-templates';
import { DisplayAdsManager } from './DisplayAdsManager';
import { BannerRedirectManager } from './BannerRedirectManager';
import { SamplingManager } from './SamplingManager';
import { HostessManager } from './HostessManager';

type View = 'overview' | 'qr-codes' | 'network-campaigns' | 'prospects' | 'email-marketing' | 'display-ads' | 'banner-redirect' | 'sampling' | 'hostess';

interface AdsDashboardProps {
    clientId?: string;
}

export default function AdsDashboard({ clientId }: AdsDashboardProps = {}) {
    const { toast } = useToast();
    const { t } = useTranslation('common');
    const [isSeeding, setIsSeeding] = useState(false);
    const [currentView, setCurrentView] = useState<View>('overview');
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

    const handleSeedData = async () => {
        setIsSeeding(true);
        try {
            const result = await seedCampaignsAction();
            if (result.success) {
                toast({ title: t('adsManager.qrManager.toasts.created'), description: "Datos cargados correctamente" });
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Error seed", variant: "destructive" });
        } finally {
            setIsSeeding(false);
        }
    };

    if (currentView === 'qr-codes') {
        return <QrManager onBack={() => setCurrentView('overview')} clientId={clientId} />;
    }

    if (currentView === 'network-campaigns') {
        return <NetworkCampaignsManager onBack={() => setCurrentView('overview')} clientId={clientId} />;
    }

    if (currentView === 'prospects') {
        return <ProspectsManager onBack={() => setCurrentView('overview')} />;
    }

    if (currentView === 'display-ads') {
        return <DisplayAdsManager onBack={() => setCurrentView('overview')} clientId={clientId} />;
    }

    if (currentView === 'banner-redirect') {
        return <BannerRedirectManager onBack={() => setCurrentView('overview')} clientId={clientId} />;
    }

    if (currentView === 'sampling') {
        return <SamplingManager onBack={() => setCurrentView('overview')} clientId={clientId} />;
    }

    if (currentView === 'hostess') {
        return <HostessManager onBack={() => setCurrentView('overview')} clientId={clientId} />;
    }

    if (currentView === 'email-marketing' && selectedTemplate) {
        return (
            <EmailMarketingComposer 
                template={selectedTemplate} 
                onBack={() => {
                    setCurrentView('overview');
                    setSelectedTemplate(null);
                }} 
            />
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('adsManager.dashboard.title')}</h1>
                    <p className="text-muted-foreground mt-2">{t('adsManager.dashboard.subtitle')}</p>
                </div>
                {!clientId && (
                    <Button variant="outline" size="sm" onClick={handleSeedData} disabled={isSeeding}>
                        <Database className="mr-2 h-4 w-4" />
                        {isSeeding ? t('adsManager.dashboard.loading') : t('adsManager.dashboard.seedData')}
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Module: Dynamic QR */}
                <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-all">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <QrCode className="h-8 w-8 text-primary mb-2" />
                            <Badge>{t('adsManager.cards.active')}</Badge>
                        </div>
                        <CardTitle>{t('adsManager.cards.programs.dynamicQr.title')}</CardTitle>
                        <CardDescription>{t('adsManager.cards.programs.dynamicQr.description')}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full group" onClick={() => setCurrentView('qr-codes')}>
                            {t('adsManager.cards.programs.dynamicQr.button')}
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardFooter>
                </Card>

                {/* Module: Network Campaigns (Active) */}
                <Card className="border-l-4 border-l-green-600 shadow-md hover:shadow-lg transition-all">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <ShoppingBag className="h-8 w-8 text-green-600 mb-2" />
                            <Badge className="bg-green-600 hover:bg-green-700">New</Badge>
                        </div>
                        <CardTitle>{t('adsManager.cards.programs.socialProduct.title')}</CardTitle>
                        <CardDescription>{t('adsManager.cards.programs.socialProduct.description')}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full group bg-green-600 hover:bg-green-700 text-white" onClick={() => setCurrentView('network-campaigns')}>
                            Manage Campaigns
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardFooter>
                </Card>

                {/* Module: Email Marketing (ACTIVE & INTERACTIVE) */}
                <MarketingShareCard 
                    onManage={(template) => {
                        setSelectedTemplate(template);
                        setCurrentView('email-marketing');
                    }} 
                />

                {/* Module: Display Ads */}
                <Card className="border-l-4 border-l-blue-600 shadow-md hover:shadow-lg transition-all">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <MonitorPlay className="h-8 w-8 text-blue-600 mb-2" />
                            <Badge>{t('adsManager.cards.active')}</Badge>
                        </div>
                        <CardTitle>{t('adsManager.cards.programs.displayAds.title')}</CardTitle>
                        <CardDescription>{t('adsManager.cards.programs.displayAds.description')}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white group" onClick={() => setCurrentView('display-ads')}>
                            {t('adsManager.cards.programs.displayAds.button') || 'Gestionar Display Ads'}
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardFooter>
                </Card>

                {/* Module: Banner Redirect Campaigns */}
                <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-all">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <Layout className="h-8 w-8 text-orange-500 mb-2" />
                            <Badge>{t('adsManager.cards.active')}</Badge>
                        </div>
                        <CardTitle>{t('adsManager.cards.programs.bannerRedirect.title')}</CardTitle>
                        <CardDescription>{t('adsManager.cards.programs.bannerRedirect.description')}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white group" onClick={() => setCurrentView('banner-redirect')}>
                            {t('adsManager.cards.programs.bannerRedirect.button') || 'Gestionar Redirecciones'}
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardFooter>
                </Card>

                {/* Module: Sampling "Try It" Campaigns */}
                <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-all">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <Gift className="h-8 w-8 text-purple-500 mb-2" />
                            <Badge>{t('adsManager.cards.active')}</Badge>
                        </div>
                        <CardTitle>{t('adsManager.cards.programs.sampling.title')}</CardTitle>
                        <CardDescription>{t('adsManager.cards.programs.sampling.description')}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white group" onClick={() => setCurrentView('sampling')}>
                            {t('adsManager.cards.programs.sampling.button') || 'Gestionar Pruébalo'}
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardFooter>
                </Card>

                {/* Module: Recommend Friends */}
                <ReferralCard />

                {/* Module: Your Prospects (ACTIVE NOW) */}
                <Card className="bg-green-50 dark:bg-green-900/10 border-green-200">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <Store className="h-8 w-8 text-green-600 mb-2" />
                            <Badge className="bg-green-600 text-white hover:bg-green-700">{t('adsManager.cards.active')}</Badge>
                        </div>
                        <CardTitle>{t('adsManager.cards.programs.prospects.title')}</CardTitle>
                        <CardDescription>{t('adsManager.cards.programs.prospects.description')}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white group" onClick={() => setCurrentView('prospects')}>
                            {t('adsManager.cards.programs.prospects.button')}
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardFooter>
                </Card>

                {/* Module: Hostesses */}
                <Card className="border-l-4 border-l-pink-500 shadow-md hover:shadow-lg transition-all">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <Megaphone className="h-8 w-8 text-pink-500 mb-2" />
                            <Badge>{t('adsManager.cards.active')}</Badge>
                        </div>
                        <CardTitle>{t('adsManager.cards.programs.hostess.title')}</CardTitle>
                        <CardDescription>{t('adsManager.cards.programs.hostess.description')}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white group" onClick={() => setCurrentView('hostess')}>
                            {t('adsManager.cards.programs.hostess.button') || 'Gestionar Hostessen'}
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Global Stats Preview */}
            <Card className="bg-slate-50 dark:bg-slate-900 border-none">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        <CardTitle>{t('adsManager.dashboard.globalStats')}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-32 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg border-slate-200 dark:border-slate-800">
                        {t('adsManager.dashboard.globalStatsDesc')}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
