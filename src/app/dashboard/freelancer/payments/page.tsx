'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Wallet, ArrowUpRight, History, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { getWalletData } from '@/app/actions/wallet';
import { getAdminDb } from '@/lib/firebase-admin'; // NOTE: Can't import admin lib on client. Must fetch profile via action/hook.
import { getProfile } from '@/app/actions/profile';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function FreelancerPaymentsPage() {
    const { user } = useAuth();
    const [walletData, setWalletData] = useState<any>(null);
    const [kycRequired, setKycRequired] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (user?.uid) {
                // 1. Get Wallet
                const data = await getWalletData(user.uid);
                setWalletData(data);

                // 2. Get Profile for KYC Status
                const profile = await getProfile(user.uid);
                if (profile?.kycStatus === 'required') {
                    setKycRequired(true);
                }
                setLoading(false);
            }
        }
        load();
    }, [user?.uid]);

    if (loading) return <div className="p-8">Cargando billetera...</div>;

    const balance = walletData?.balance || 0;
    const pendingBalance = 0; // TODO: Calculate from pending transactions if we track them separately
    const history = walletData?.history || [];

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pagos y Carteras</h1>
                <p className="text-muted-foreground mt-2">Gestiona tus ganancias, retiros y métodos de pago.</p>
            </div>

            {/* KYC ALERT */}
            {kycRequired && (
                <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Verificación de Identidad Requerida</AlertTitle>
                    <AlertDescription>
                        Has superado los 2,000 DiciCoins en ganancias acumuladas. Por regulaciones financieras, necesitamos verificar tu identidad antes de procesar nuevos retiros.
                        <Button variant="link" className="p-0 h-auto font-bold ml-1 text-red-600 dark:text-red-400 underline">Iniciar Verificación</Button>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Main Wallet Card */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center text-slate-100">
                            <span>Saldo Disponible</span>
                            <Wallet className="h-5 w-5 opacity-70" />
                        </CardTitle>
                        <CardDescription className="text-slate-300">Listo para retirar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold mb-6">${balance.toFixed(2)}</div>
                        <Button
                            className="w-full bg-white text-black hover:bg-slate-200 font-semibold"
                            size="lg"
                            disabled={kycRequired || balance < 10}
                        >
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            {kycRequired ? "Verificación Pendiente" : "Solicitar Retiro"}
                        </Button>
                        {balance < 10 && !kycRequired && <p className="text-xs text-slate-400 mt-2 text-center">Mínimo para retirar: $10.00</p>}
                    </CardContent>
                </Card>

                {/* Pending Balance Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Saldo Pendiente</span>
                            <History className="h-5 w-5 text-muted-foreground" />
                        </CardTitle>
                        <CardDescription>En proceso de validación (30 días)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold mb-6 text-muted-foreground">${pendingBalance.toFixed(2)}</div>
                        <div className="flex gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                            <History className="h-4 w-4" /> Próxima liberación: --
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Transacciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {history.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-4">No hay transacciones recientes.</p>
                        ) : (
                            history.map((trx: any) => (
                                <div key={trx.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${trx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {trx.amount > 0 ? <ArrowUpRight className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{trx.description || trx.type}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{trx.id}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`font-bold ${trx.amount > 0 ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                                            {trx.amount > 0 ? '+' : ''}${Math.abs(trx.amount).toFixed(2)}
                                        </span>
                                        <p className="text-xs text-muted-foreground">
                                            {trx.timestamp ? format(new Date(trx.timestamp), "d MMM, HH:mm", { locale: es }) : '-'}
                                        </p>
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
