'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, TrendingUp, History, CreditCard, Loader2, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getWalletData } from '@/app/actions/wallet';
import { PointsChart } from './PointsChart';
// import { QRCodeSVG } from 'qrcode.react'; // Not installed, using simple img API or placeholder
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';

interface WalletSectionProps {
    uid: string;
    uniqueCode: string;
}

export function WalletSection({ uid, uniqueCode }: WalletSectionProps) {
    const { t } = useTranslation('common');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
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

    if (!data) return <div>Failed to load wallet</div>;

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
                                    Dicilo Wallet
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
                                    <Badge variant="outline" className="border-white/20 text-white hover:bg-white/10">Personal</Badge>
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
                                        Show QR for Pay
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Scan to Pay</DialogTitle>
                                        <DialogDescription>Show this code to a partner merchant to redeem your points.</DialogDescription>
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

                <PointsChart data={data.history} />
            </div>

            {/* Transactions History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History size={18} />
                        Recent Transactions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.history.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-4">No transactions yet.</p>
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
