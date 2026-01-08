'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, TrendingUp, History, CreditCard, Loader2, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getWalletData, syncReferralRewards } from '@/app/actions/wallet';
import { PointsChart } from './PointsChart';
// import { QRCodeSVG } from 'qrcode.react'; // Not installed, using simple img API or placeholder
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';

import Image from 'next/image';

interface WalletSectionProps {
    uid: string;
    uniqueCode: string;
    userProfile?: any;
}

export function WalletSection({ uid, uniqueCode, userProfile }: WalletSectionProps) {
    const { t } = useTranslation('common');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                // Auto-sync missing referral rewards (retroactive fix)
                await syncReferralRewards(uid);

                const res = await getWalletData(uid);
                setData(res);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [uid]);

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    }

    if (!data) return <div>{t('dashboard.wallet.error')}</div>;

    // QR Data: simple JSON string or just UID
    const qrValue = JSON.stringify({ uid, code: uniqueCode });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Digital Card */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="relative overflow-hidden border-none bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl">
                    <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-white/5 blur-3xl"></div>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    {t('dashboard.wallet.title')}
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-4 w-4 text-gray-400 hover:text-white ml-1">
                                                <Info size={14} />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-xl">
                                            <DialogHeader>
                                                <DialogTitle>{t('dicipoints.whatIs.title')}</DialogTitle>
                                            </DialogHeader>
                                            <div className="text-sm text-gray-500 whitespace-pre-line leading-relaxed">
                                                {t('dicipoints.whatIs.description')}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardTitle>
                                <div className="mt-1 flex items-center gap-2">
                                    <Badge variant="outline" className="border-white/20 text-white hover:bg-white/10">{t('dashboard.wallet.personal')}</Badge>
                                </div>
                            </div>
                            <CreditCard className="text-gray-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-4xl font-bold tracking-tight">{data.balance} DP</span>
                            <p className="text-sm text-gray-400">≈ {data.valueInEur.toFixed(2)} {data.currency}</p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="secondary" className="w-full gap-2">
                                        <QrCode size={16} />
                                        {t('dashboard.wallet.showQr')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>{t('dashboard.wallet.scanToPay')}</DialogTitle>
                                        <DialogDescription>{t('dashboard.wallet.scanDesc')}</DialogDescription>
                                    </DialogHeader>
                                    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border">
                                        {/* Using a public API for QR generation to avoid new deps for now. Secure for display. */}
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uid)}`}
                                            alt="Wallet QR"
                                            className="h-48 w-48"
                                        />
                                        <p className="mt-4 font-mono text-sm tracking-widest text-gray-500">{uniqueCode}</p>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>

                {/* Prepaid Card (Right) - Replaces History Chart */}
                <Card className="h-full min-h-[240px] relative overflow-hidden border-none shadow-xl group transition-all hover:shadow-2xl">
                    <div className="absolute inset-0 z-0 select-none">
                        <Image
                            src="/assets/images/dicilo-prepaid-card.png"
                            alt="Dicilo Prepaid Card"
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            priority
                        />
                        {/* Minimal overlay just for very high contrast text if needed, kept very light to show card */}
                        <div className="absolute inset-0 bg-black/0" />
                    </div>

                    <CardContent className="relative z-20 h-full flex flex-col justify-between p-6 text-white text-shadow-sm">
                        <div className="flex justify-between items-start w-full">
                            {/* Floating Balance Badge - semi-transparent to integrate with card design */}
                            <div className="bg-black/30 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 shadow-lg">
                                <p className="text-[9px] font-bold text-white/90 uppercase tracking-widest mb-0.5">
                                    Ganancias
                                </p>
                                <div className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                                    € {data ? data.valueInEur.toFixed(2) : '0.00'}
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-md rounded text-[9px] font-bold tracking-wider border border-white/10 shadow-sm">
                                    PREPAID
                                </span>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <div className="flex gap-3 text-white/90 font-mono text-base tracking-widest opacity-95 pl-1 drop-shadow-md mb-2">
                                <span>••••</span>
                                <span>••••</span>
                                <span>••••</span>
                                <span>{uid.slice(0, 4).toUpperCase()}</span>
                            </div>
                            <div>
                                <p className="text-[7px] text-white/80 uppercase tracking-wider mb-0.5 font-semibold">Card Holder</p>
                                <p className="text-sm font-bold tracking-widest uppercase text-white drop-shadow-md">
                                    {(userProfile?.firstName || 'Miembro').substring(0, 20)} {(userProfile?.lastName || 'Dicilo').substring(0, 20)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History size={18} />
                        {t('dashboard.wallet.recentTransactions')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.history.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-4">{t('dashboard.wallet.noTransactions')}</p>
                        ) : (
                            data.history.map((tx: any) => (
                                <div key={tx.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="grid gap-1">
                                        <p className="font-medium text-sm">{tx.description || tx.type.replace('_', ' ')}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(tx.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount} DP
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
