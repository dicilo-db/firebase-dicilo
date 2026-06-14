import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, TrendingUp, HelpCircle, ShieldCheck, Volume2, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { useAuth } from '@/context/AuthContext';

interface DiciCoinSectionProps {
    userData?: any;
    walletData?: any;
    onViewHistory?: () => void; // Optional: Callback if history requires view switching
}

export function DiciCoinSection({ userData, walletData, onViewHistory }: DiciCoinSectionProps) {
    const { t, i18n } = useTranslation('common');
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        if (walletData && typeof walletData.balanceDC === 'number') {
            setBalance(walletData.balanceDC / 5000);
        } else if (user?.uid) {
            import('@/app/actions/wallet').then(({ getWalletData }) => {
                getWalletData(user.uid).then((data) => {
                    if (data && typeof data.balanceDC === 'number') {
                        setBalance(data.balanceDC / 5000);
                    }
                });
            });
        }
    }, [walletData, user?.uid]);

    // Selección dinámica de URLs de media basada en el idioma activo
    const audioUrl = i18n.language === 'de'
        ? 'https://wp.dicilo.net/wp-content/uploads/2026/06/DiciCoin_als_VIP-Mitgliedskarte.mp3'
        : 'https://wp.dicilo.net/wp-content/uploads/2026/06/DiciCoin-la-llave-al-ecosistema-Dicilo.mp3';

    const videoUrl = i18n.language === 'de'
        ? 'https://wp.dicilo.net/wp-content/uploads/2026/06/DiciCoin-Dicilo-als-Oekosystem_web.mp4'
        : 'https://wp.dicilo.net/wp-content/uploads/2026/06/DiciCoin-Dicilo-web.mp4';

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-slate-900">
                    <Coins className="h-8 w-8 text-amber-500" />
                    {t('dashboard.dicicoin.title', 'DiciCoin Center')}
                </h1>
                <p className="text-muted-foreground">{t('dashboard.dicicoin.walletDescription', 'Tu billetera y centro de recompensas.')}</p>
            </div>

            {/* Content Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Security Card */}
                <Card className="md:col-span-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <ShieldCheck className="w-64 h-64" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-amber-400 flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6" />
                            {t('dashboard.dicicoin.securityTitle', 'Seguridad, Autenticidad y Titularidad')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 relative z-10">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 min-w-[200px]">
                                <p className="text-sm font-medium text-amber-200 mb-1">{t('dashboard.dicicoin.yourBalance', 'Tu Balance')}</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-bold text-white">{balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}</span>
                                    <span className="text-xl font-medium text-amber-400">{t('dashboard.dicicoin.currency', 'DiciCoins')}</span>
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
                            <Button className="w-full bg-amber-600 hover:bg-amber-700" asChild>
                                <a href="https://dicicoin-dicilo.web.app" target="_blank" rel="noopener noreferrer">
                                    {t('dashboard.dicicoin.commingSoon', 'Reserva tu DiciCoin')}
                                </a>
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
                        <Button variant="outline" className="w-full" onClick={onViewHistory}>
                            {t('dashboard.dicicoin.viewHistory', 'Ver Historial')}
                        </Button>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Dialog>
                    <DialogTrigger asChild>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500 h-full">
                            <CardHeader>
                                <HelpCircle className="h-8 w-8 text-emerald-500 mb-2" />
                                <CardTitle className="text-lg">{t('dashboard.dicicoin.howTo', '¿Cómo funciona?')}</CardTitle>
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

            {/* Mediateca de Presentación */}
            <div className="pt-6 border-t border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {t('dashboard.dicicoin.mediaTitle', 'Materiales de Presentación')}
                </h2>
                <p className="text-muted-foreground mb-6">
                    {t('dashboard.dicicoin.mediaDesc', 'Escucha y mira el material explicativo oficial que preparamos para DiciCoin.')}
                </p>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Audio Card */}
                    <Card className="hover:shadow-md transition-shadow border border-slate-100 border-l-4 border-l-amber-500 flex flex-col justify-between">
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                                <Volume2 className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">
                                    {t('dashboard.dicicoin.audioTitle', 'DiciCoin: La llave al ecosistema Dicilo')}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {t('dashboard.dicicoin.audioDesc', 'Audio de presentación detallado.')}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 mt-auto">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="w-full bg-amber-600 hover:bg-amber-700">
                                        {t('dashboard.dicicoin.audioBtn', 'Escuchar Audio')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                                            <Volume2 className="h-5 w-5 text-amber-500" />
                                            {t('dashboard.dicicoin.audioTitle')}
                                        </DialogTitle>
                                        <DialogDescription className="pt-4 flex flex-col items-center">
                                            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                                <Coins className="w-12 h-12 text-amber-600" />
                                            </div>
                                            <audio controls src={audioUrl} className="w-full mt-2" />
                                        </DialogDescription>
                                    </DialogHeader>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>

                    {/* Video Card */}
                    <Card className="hover:shadow-md transition-shadow border border-slate-100 border-l-4 border-l-red-500 flex flex-col justify-between">
                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <div className="p-3 bg-red-50 rounded-lg text-red-600">
                                <Video className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">
                                    {t('dashboard.dicicoin.videoTitle', 'DiciCoin + Dicilo')}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {t('dashboard.dicicoin.videoDesc', 'Video promocional sobre el ecosistema.')}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 mt-auto">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="w-full bg-red-600 hover:bg-red-700">
                                        {t('dashboard.dicicoin.videoBtn', 'Ver Video')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xl">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                                            <Video className="h-5 w-5 text-red-500" />
                                            {t('dashboard.dicicoin.videoTitle')}
                                        </DialogTitle>
                                        <DialogDescription className="pt-4">
                                            <video controls autoPlay src={videoUrl} className="w-full rounded-lg shadow-md mt-2" />
                                        </DialogDescription>
                                    </DialogHeader>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
                {t('dashboard.dicicoin.limit', 'El límite máximo permitido es de 2.000 DICICOIN por usuario...')}
            </div>
        </div>
    );
}
