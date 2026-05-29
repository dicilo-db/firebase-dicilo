'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, TrendingUp, History, CreditCard, Loader2, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getWalletData, syncReferralRewards, transferDpPoints } from '@/app/actions/wallet';
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
    initialData?: any;
}

export function WalletSection({ uid, uniqueCode, userProfile, initialData }: WalletSectionProps) {
    const { t, i18n } = useTranslation('common');
    const locale = i18n?.language || 'es';
    const [loading, setLoading] = useState(!initialData);
    const [data, setData] = useState<any>(initialData || null);

    // Puntos DP transfer variables
    const [transferTargetId, setTransferTargetId] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferLoading, setTransferLoading] = useState(false);
    const [transferMessage, setTransferMessage] = useState({ text: '', type: '' });

    const localTranslations: Record<string, { es: string; en: string; de: string }> = {
        transfer_card_title: {
            es: "Transferir Puntos DP",
            en: "Transfer DiciPoints",
            de: "DiciPoints übertragen"
        },
        transfer_desc: {
            es: "Envía puntos DP de tu balance a otro usuario usando su ID de Dicilo.",
            en: "Send DP points from your balance to another user using their Dicilo ID.",
            de: "Senden Sie DP-Punkte aus Ihrem Guthaben an einen anderen Benutzer mit dessen Dicilo-ID."
        },
        transfer_dicilo_id_label: {
            es: "ID de Dicilo del Destinatario",
            en: "Recipient's Dicilo ID",
            de: "Dicilo-ID des Empfängers"
        },
        transfer_dicilo_id_placeholder: {
            es: "Ej. EMP-12345",
            en: "e.g. EMP-12345",
            de: "z.B. EMP-12345"
        },
        transfer_amount_label: {
            es: "Cantidad de DP a enviar",
            en: "Amount of DP to send",
            de: "Menge der zu sendenden DP"
        },
        transfer_amount_placeholder: {
            es: "Ej. 100",
            en: "e.g. 100",
            de: "z.B. 100"
        },
        transfer_btn_submit: {
            es: "Transferir Puntos",
            en: "Transfer Points",
            de: "Punkte übertragen"
        },
        transfer_btn_submit_loading: {
            es: "Transfiriendo...",
            en: "Transferring...",
            de: "Übertragung..."
        },
        confirm_transfer: {
            es: "¿Estás seguro de que deseas transferir {amount} DP al ID de Dicilo {target}? Esta acción no se puede deshacer.",
            en: "Are you sure you want to transfer {amount} DP to Dicilo ID {target}? This action cannot be undone.",
            de: "Sind Sie sicher, dass Sie {amount} DP auf die Dicilo-ID {target} übertragen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
        },
        validation_invalid_amount: {
            es: "Por favor, introduce un monto válido mayor a 0.",
            en: "Please enter a valid amount greater than 0.",
            de: "Bitte geben Sie einen gültigen Betrag größer als 0 ein."
        },
        validation_insufficient: {
            es: "Balance insuficiente de puntos DP.",
            en: "Insufficient balance of DP points.",
            de: "Unzureichendes Guthaben an DP-Punkten."
        },
        transfer_success: {
            es: "¡Puntos DP transferidos con éxito!",
            en: "DP points transferred successfully!",
            de: "DP-Punkte erfolgreich übertragen!"
        },
        error_sender_not_found: {
            es: "Usuario remitente no encontrado.",
            en: "Sender user not found.",
            de: "Absender nicht gefunden."
        },
        error_not_authorized: {
            es: "No tienes permisos para realizar transferencias.",
            en: "You do not have permissions to perform transfers.",
            de: "Sie haben keine Berechtigung für Übertragungen."
        },
        error_self_transfer: {
            es: "No puedes transferir puntos a ti mismo.",
            en: "You cannot transfer points to yourself.",
            de: "Sie können keine Punkte an sich selbst übertragen."
        },
        error_recipient_not_found: {
            es: "ID de Dicilo no encontrado. Por favor, verifícalo.",
            en: "Dicilo ID not found. Please verify it.",
            de: "Dicilo-ID nicht gefunden. Bitte überprüfen."
        },
        error_sender_wallet_not_found: {
            es: "Monedero no encontrado.",
            en: "Wallet not found.",
            de: "Monedero nicht gefunden."
        },
        server_error: {
            es: "Ocurrió un error en el servidor. Inténtalo de nuevo.",
            en: "A server error occurred. Please try again.",
            de: "Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es erneut."
        }
    };

    const getTranslation = (key: string) => {
        const lang = locale.startsWith('de') ? 'de' : locale.startsWith('en') ? 'en' : 'es';
        return localTranslations[key]?.[lang] || localTranslations[key]?.['es'] || '';
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        const amountVal = parseInt(transferAmount);
        if (isNaN(amountVal) || amountVal <= 0) {
            setTransferMessage({ text: getTranslation('validation_invalid_amount'), type: 'error' });
            return;
        }

        const currentBalance = data?.balance || 0;
        if (currentBalance < amountVal) {
            setTransferMessage({ text: getTranslation('validation_insufficient'), type: 'error' });
            return;
        }

        const confirmMsg = getTranslation('confirm_transfer')
            .replace('{amount}', amountVal.toString())
            .replace('{target}', transferTargetId.trim());

        if (!window.confirm(confirmMsg)) return;

        setTransferLoading(true);
        setTransferMessage({ text: '', type: '' });

        try {
            const res = await transferDpPoints(uid, transferTargetId.trim(), amountVal);
            if (res.success) {
                setTransferMessage({ text: getTranslation(res.messageKey || 'transfer_success'), type: 'success' });
                setTransferTargetId('');
                setTransferAmount('');
                // Refresh balance
                const updatedWallet = await getWalletData(uid);
                setData(updatedWallet);
            } else {
                setTransferMessage({ text: getTranslation(res.messageKey || 'server_error'), type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setTransferMessage({ text: getTranslation('server_error'), type: 'error' });
        } finally {
            setTransferLoading(false);
        }
    };

    const userRole = (userProfile?.role || '').toLowerCase();
    const allowedRoles = ['team_leader', 'team_office', 'admin', 'superadmin'];
    const showTransfer = allowedRoles.includes(userRole);

    useEffect(() => {
        async function load() {
            if (!initialData) setLoading(true);
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
                            <p className="text-sm text-gray-400">≈ {(data.balance * (data.pointValue || 0.10)).toFixed(2)} {data.currency} / USD $</p>
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
                        <div className="flex justify-end items-start w-full">
                            {/* Floating Balance Badge - Moved to Right */}
                            <div className="bg-black/30 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 shadow-lg text-right">
                                <p className="text-[9px] font-bold text-white/90 uppercase tracking-widest mb-0.5">
                                    Ganancias
                                </p>
                                <div className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                                    € {data ? data.valueInEur.toFixed(2) : '0.00'}
                                </div>
                                {data?.valueInUsd ? (
                                    <div className="text-lg font-bold tracking-tight text-white drop-shadow-md mt-1">
                                        $ {data.valueInUsd.toFixed(2)}
                                    </div>
                                ) : null}
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

            {/* Transfer DP Card (visible for leadership roles) */}
            {showTransfer && (
                <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                            {getTranslation('transfer_card_title')}
                        </CardTitle>
                        <CardDescription>
                            {getTranslation('transfer_desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {transferMessage.text && (
                            <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
                                transferMessage.type === 'success' 
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                    : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                                {transferMessage.text}
                            </div>
                        )}
                        <form onSubmit={handleTransfer} className="space-y-4">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="transfer-dicilo-id" className="text-sm font-semibold text-slate-800">
                                        {getTranslation('transfer_dicilo_id_label')}
                                    </label>
                                    <input
                                        type="text"
                                        id="transfer-dicilo-id"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder={getTranslation('transfer_dicilo_id_placeholder')}
                                        value={transferTargetId}
                                        onChange={(e) => setTransferTargetId(e.target.value.replace(/\s+/g, ''))}
                                        disabled={transferLoading}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="transfer-amount" className="text-sm font-semibold text-slate-800">
                                        {getTranslation('transfer_amount_label')}
                                    </label>
                                    <input
                                        type="number"
                                        id="transfer-amount"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder={getTranslation('transfer_amount_placeholder')}
                                        value={transferAmount}
                                        onChange={(e) => setTransferAmount(e.target.value)}
                                        disabled={transferLoading}
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full bg-slate-950 hover:bg-slate-800 text-white font-semibold h-11"
                                disabled={transferLoading || !transferTargetId || !transferAmount}
                            >
                                {transferLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {getTranslation('transfer_btn_submit_loading')}
                                    </>
                                ) : (
                                    getTranslation('transfer_btn_submit')
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

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
