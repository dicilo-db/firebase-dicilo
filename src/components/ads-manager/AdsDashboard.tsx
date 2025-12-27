'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Mail, MonitorPlay, ArrowRight, BarChart, Database, ShoppingBag, Layout, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { seedCampaignsAction } from '@/app/actions/seed-freelancer';
import { useToast } from "@/hooks/use-toast";
import { QrManager } from './QrManager';

type View = 'overview' | 'qr-codes';

export default function AdsDashboard() {
    const { toast } = useToast();
    const { t } = useTranslation('common');
    const [isSeeding, setIsSeeding] = useState(false);
    const [currentView, setCurrentView] = useState<View>('overview');

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
        return <QrManager onBack={() => setCurrentView('overview')} />;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('adsManager.dashboard.title')}</h1>
                    <p className="text-muted-foreground mt-2">{t('adsManager.dashboard.subtitle')}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSeedData} disabled={isSeeding}>
                    <Database className="mr-2 h-4 w-4" />
                    {isSeeding ? t('adsManager.dashboard.loading') : t('adsManager.dashboard.seedData')}
                </Button>
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

                {/* Module: Email Marketing */}
                <Card className="opacity-75 border-dashed">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <Mail className="h-8 w-8 text-muted-foreground mb-2" />
                            <Badge variant="outline">{t('adsManager.cards.comingSoon')}</Badge>
                        </div>
                        <CardTitle>{t('adsManager.cards.programs.emailMarketing.title')}</CardTitle>
                        <CardDescription>{t('adsManager.cards.programs.emailMarketing.description')}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button variant="secondary" disabled className="w-full">
                            {t('adsManager.cards.inDevelopment')}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Module: Display Ads */}
                <Card className="opacity-75 border-dashed">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <MonitorPlay className="h-8 w-8 text-muted-foreground mb-2" />
                            <Badge variant="outline">{t('adsManager.cards.comingSoon')}</Badge>
                        </div>
                        <CardTitle>{t('adsManager.cards.programs.displayAds.title')}</CardTitle>
                        <CardDescription>{t('adsManager.cards.programs.displayAds.description')}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button variant="secondary" disabled className="w-full">
                            {t('adsManager.cards.inDevelopment')}
                        </Button>
                    </CardFooter>
                </Card>
                {/* Module: Social Product Campaigns */}
                <Card className="opacity-75 border-dashed">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground mb-2" />
                            <Badge variant="outline">{t('adsManager.cards.comingSoon')}</Badge>
                        </div>
                        <CardTitle>{t('adsManager.cards.programs.socialProduct.title')}</CardTitle>
                        <CardDescription>{t('adsManager.cards.programs.socialProduct.description')}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button variant="secondary" disabled className="w-full">
                            {t('adsManager.cards.inDevelopment')}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Module: Banner Redirect Campaigns */}
                <Card className="opacity-75 border-dashed">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <Layout className="h-8 w-8 text-muted-foreground mb-2" />
                            <Badge variant="outline">{t('adsManager.cards.comingSoon')}</Badge>
                        </div>
                        <CardTitle>{t('adsManager.cards.programs.bannerRedirect.title')}</CardTitle>
                        <CardDescription>{t('adsManager.cards.programs.bannerRedirect.description')}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button variant="secondary" disabled className="w-full">
                            {t('adsManager.cards.inDevelopment')}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Module: Sampling "Try It" Campaigns */}
                <Card className="opacity-75 border-dashed">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <Gift className="h-8 w-8 text-muted-foreground mb-2" />
                            <Badge variant="outline">{t('adsManager.cards.comingSoon')}</Badge>
                        </div>
                        <CardTitle>{t('adsManager.cards.programs.sampling.title')}</CardTitle>
                        <CardDescription>{t('adsManager.cards.programs.sampling.description')}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button variant="secondary" disabled className="w-full">
                            {t('adsManager.cards.inDevelopment')}
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
