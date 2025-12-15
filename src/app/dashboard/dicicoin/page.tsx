'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Coins, TrendingUp, HelpCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/header';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { DiciCoinInfo } from '@/components/dashboard/DiciCoinInfo';
import { DiciCoinSecurityInfo } from '@/components/dashboard/DiciCoinSecurityInfo';

export default function DiciCoinUserPage() {
    const { t } = useTranslation('common');

    // MOCK DATA for now - In future retrieve real balance/history
    const balance = 0;

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
            <Header />
            <main className="container mx-auto py-8 px-4 max-w-5xl">

                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
                            <Coins className="h-8 w-8 text-amber-500" />
                            DiciCoin Center
                        </h1>
                        <p className="text-muted-foreground">{t('dashboard.dicicoin.walletDescription', 'Tu billetera y centro de recompensas.')}</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 md:grid-cols-3">

                    {/* Security & Balance Card - Featured */}
                    <Card className="md:col-span-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none shadow-lg overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <ShieldCheck className="w-64 h-64" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-xl font-bold text-amber-400 flex items-center gap-2">
                                <ShieldCheck className="h-6 w-6" />
                                {t('dicicoin.securityTitle', 'Seguridad, Autenticidad y Titularidad')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 relative z-10">
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 min-w-[200px]">
                                    <p className="text-sm font-medium text-amber-200 mb-1">Tu Balance</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-bold text-white">{balance}</span>
                                        <span className="text-xl font-medium text-amber-400">DiciCoins</span>
                                    </div>
                                </div>
                                <div className="hidden md:block h-16 w-px bg-white/20"></div>
                                <div className="flex-1 space-y-4">
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        {t('dashboard.dicicoin.securityDesc', 'Las DICICOIN solo pueden ser adquiridas a través de Agentes Autorizados...')}
                                    </p>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="link" className="text-amber-400 p-0 h-auto font-normal hover:text-amber-300">
                                                {t('dashboard.dicicoin.readMore', 'Leer más')} &rarr;
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2 text-xl mb-4">
                                                    <ShieldCheck className="h-5 w-5 text-amber-500" />
                                                    {t('dashboard.dicicoin.securityTitle')}
                                                </DialogTitle>
                                                <DialogDescription>
                                                    <DiciCoinSecurityInfo />
                                                </DialogDescription>
                                            </DialogHeader>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Purchase Card */}
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-500">
                        <CardHeader>
                            <Coins className="h-8 w-8 text-amber-500 mb-2" />
                            <CardTitle className="text-lg">{t('dashboard.dicicoin.purchaseTitle', 'Adquiere más DiciCoins')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                {t('dashboard.dicicoin.purchaseDesc', 'Incrementar tu saldo te permite...')}
                            </p>
                            <div className="mt-auto">
                                <Button className="w-full bg-amber-600 hover:bg-amber-700" disabled>
                                    {t('dashboard.dicicoin.commingSoon', 'Próximamente')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* History Card */}
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                        <CardHeader>
                            <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
                            <CardTitle className="text-lg">{t('dashboard.dicicoin.historyTitle', 'Historial')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                {t('dashboard.dicicoin.historyDesc', 'Sus transacciones...')}
                            </p>
                            <Button variant="outline" className="w-full" disabled>
                                {t('tickets.myTickets', 'Ver Historial')}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* How it works Card (Dialog) */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500 h-full">
                                <CardHeader>
                                    <HelpCircle className="h-8 w-8 text-emerald-500 mb-2" />
                                    <CardTitle className="text-lg">{t('dashboard.dashboard.dicicoin.howTo', '¿Cómo funciona?')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                        {t('dashboard.dicicoin.learnMore', 'Aprende sobre DiciCoin')}
                                    </p>
                                    <Button variant="secondary" className="w-full">
                                        {t('dashboard.dicicoin.readGuide', 'Leer Guía')}
                                    </Button>
                                </CardContent>
                            </Card>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-2xl mb-4">
                                    <Coins className="h-6 w-6 text-amber-500" />
                                    {t('dashboard.dicicoin.learnMore', 'Aprende sobre DiciCoin')}
                                </DialogTitle>
                                <DialogDescription>
                                    <DiciCoinInfo />
                                </DialogDescription>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>

                </div>

                <div className="mt-8 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
                    {t('dicicoin.limit', 'El límite máximo permitido es de 2.000 DICICOIN por usuario...')}
                </div>

            </main>
        </div>
    );
}
