'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ScanLine, Search, Calculator, CheckCircle2, User, History, ShoppingBag } from 'lucide-react';
import { getWalletData, processQrPayment } from '@/app/actions/wallet';
import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { useTranslation } from 'react-i18next';

export default function BusinessScannerPage() {
    const { t } = useTranslation('common');
    const { businessId, plan } = useBusinessAccess();
    const { toast } = useToast();

    const [step, setStep] = useState(1); 
    const [searchQuery, setSearchQuery] = useState(''); 
    const [customerData, setCustomerData] = useState<any>(null);
    const [pointsToDeduct, setPointsToDeduct] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearchUser = async () => {
        if (!searchQuery) return;
        setLoading(true);
        try {
            const wallet = await getWalletData(searchQuery);
            if (wallet) {
                setCustomerData({ ...wallet, uid: searchQuery });
                setStep(2);
            } else {
                toast({ title: t("business.scanner.toastUserNotFound", "Usuario no encontrado"), variant: "destructive" });
            }
        } catch (error) {
            toast({ title: t("business.scanner.toastSearchError", "Error al buscar usuario"), variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayment = async () => {
        const amount = parseInt(pointsToDeduct);
        if (isNaN(amount) || amount <= 0) {
            toast({ title: t("business.scanner.toastInvalid", "Monto inválido"), variant: "destructive" });
            return;
        }
        if (amount > customerData.balance) {
            toast({ title: t("business.scanner.toastInsufficient", "Saldo insuficiente"), variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const res = await processQrPayment(customerData.uid, businessId || 'MERCHANT_ERROR', amount);
            if (res.success) {
                setCustomerData({ ...customerData, balance: res.newBalance });
                setStep(3);
                toast({ title: t("business.scanner.toastSuccess", "Transacción Exitosa") });
            } else {
                toast({ title: t("business.scanner.toastTrxError", "Error en la Transacción"), description: res.message, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: t("business.scanner.toastServerError", "Error de Servidor"), variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep(1);
        setSearchQuery('');
        setPointsToDeduct('');
        setCustomerData(null);
    };

    if (plan === 'basic') {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-4 text-sm font-medium mt-6">
                    <p>{t('business.scanner.planReq', 'El módulo de Scanner y Cobro requiere plan Starter o superior.')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="pb-4 border-b border-slate-200">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    <span dangerouslySetInnerHTML={{ __html: t('business.scanner.title', 'Scanner de <span class="text-green-600">Cobro QR</span>') }}></span>
                </h1>
                <p className="text-slate-500 mt-2 text-lg">{t('business.scanner.desc', 'Caja registradora terminal para procesar cobros en Dicipoints.')}</p>
            </div>

            <div className="flex justify-center mt-12">
                <Card className="w-full max-w-md shadow-xl border-slate-200">
                    <CardHeader className="bg-slate-900 text-white rounded-t-xl pb-6">
                        <CardTitle className="flex items-center gap-2">
                            <ScanLine className="h-6 w-6 text-green-400" /> {t('business.scanner.terminal', 'Terminal de Cobro')}
                        </CardTitle>
                        <CardDescription className="text-slate-400">{t('business.scanner.subtitle', 'Scanner B2B de Dicilo.net')}</CardDescription>
                    </CardHeader>

                    <CardContent className="pt-8 pb-8">
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right">
                                <div className="flex justify-center py-4">
                                    <div className="h-40 w-40 border-4 border-dashed border-green-300 rounded-3xl flex items-center justify-center bg-green-50 animate-pulse">
                                        <ScanLine className="h-16 w-16 text-green-500" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-slate-700 font-semibold">{t('business.scanner.waiting', 'Esperando Escaneo QR (o ID Manual)')}</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder={t("business.scanner.placeholder", "Ingresa el UID de prueba...")}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="font-mono text-center border-slate-300"
                                        />
                                        <Button onClick={handleSearchUser} disabled={loading} className="bg-slate-900 hover:bg-slate-800">
                                            <Search size={18} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && customerData && (
                            <div className="space-y-8 animate-in slide-in-from-right">
                                <div className="bg-green-50 p-4 rounded-xl flex items-center gap-4 border border-green-100">
                                    <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                                        <User className="text-green-700" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg text-slate-900">{t('business.scanner.userVerified', 'Usuario Verificado')}</p>
                                        <p className="text-sm text-slate-600">{t('business.scanner.balance', 'Saldo Disp:')} <span className="font-bold text-green-700">{customerData.balance} DP</span></p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-slate-700 font-semibold">{t('business.scanner.amount', 'Monto a Cobrar (En Puntos)')}</Label>
                                    <div className="relative">
                                        <Calculator className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
                                        <Input
                                            type="number"
                                            className="pl-12 text-2xl font-bold h-14 border-slate-300"
                                            placeholder="0"
                                            value={pointsToDeduct}
                                            onChange={(e) => setPointsToDeduct(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-sm text-right text-slate-500 font-medium">
                                        {t('business.scanner.willReceive', 'Recibirás:')} <span className="text-green-600 font-bold">€{((parseInt(pointsToDeduct) || 0) * 0.10).toFixed(2)}</span>
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 mt-4">
                                    <Button className="w-full text-lg h-14 bg-green-600 hover:bg-green-700 text-white" onClick={handleProcessPayment} disabled={loading}>
                                        {loading ? t('business.scanner.processing', 'Procesando Transacción...') : t('business.scanner.confirmBtn', 'Confirmar Cobro')}
                                    </Button>
                                    <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-700" onClick={reset}>
                                        {t('business.scanner.cancelBtn', 'Cancelar')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="text-center space-y-6 animate-in zoom-in duration-300 py-6">
                                <div className="flex justify-center">
                                    <CheckCircle2 className="h-28 w-28 text-green-500" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">{t('business.scanner.approved', '¡Cobro Aprobado!')}</h3>
                                    <p className="text-slate-500 mt-2">{t('business.scanner.deposited', 'Se depositaron los fondos en tu Dual-Wallet.')}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-6 text-left text-sm space-y-3 border border-slate-100 mt-4">
                                    <p className="flex justify-between items-center"><span className="text-slate-500">{t('business.scanner.amountCharged', 'Monto Cobrado:')}</span> <span className="font-bold text-lg text-green-600">-{pointsToDeduct} DP</span></p>
                                    <p className="flex justify-between items-center"><span className="text-slate-500">{t('business.scanner.trxId', 'ID Operación:')}</span> <span className="font-mono text-xs bg-slate-200 px-2 py-1 rounded">TRX-{Date.now().toString().slice(-6)}</span></p>
                                </div>
                                <Button className="w-full mt-6 h-12 bg-slate-900 hover:bg-slate-800" onClick={reset}>
                                    {t('business.scanner.newClientBtn', 'Nuevo Cliente')}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Panel de Resumen Rápido (Historial Reciente) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom flex-wrap">
                <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            {t('business.scanner.lastPayment', 'Último Cobro Recibido')}
                            <History className="w-4 h-4 text-slate-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">+150 DP</div>
                        <p className="text-xs text-slate-500 mt-1">{t('business.scanner.lastPaymentDesc', 'Hace 2 horas • Cliente Anónimo')}</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            {t('business.scanner.lastProduct', 'Último Producto Vendido')}
                            <ShoppingBag className="w-4 h-4 text-slate-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-slate-900 truncate">{t('business.scanner.lastProductTitle', 'Suscripción Manual / Genérico')}</div>
                        <p className="text-xs text-slate-500 mt-1">{t('business.scanner.lastProductDesc', 'Pagado con DiciPoints • Modo Offline')}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
