'use client';

import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, CreditCard, PiggyBank, ReceiptEuro, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function BusinessFinancialsPage() {
    const { businessId, plan, isLoading: authLoading } = useBusinessAccess();
    const [balances, setBalances] = useState({ dp: 0, eur: 0 });
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        let mounted = true;
        async function fetchBalances() {
            if (!businessId) return;
            try {
                const docRef = doc(db, 'businesses', businessId);
                const ds = await getDoc(docRef);
                if (ds.exists() && mounted) {
                    const data = ds.data();
                    setBalances({
                        dp: data.dpBalance || 0,
                        eur: data.eurBalance || 0
                    });
                }
            } catch (e) {
                console.error("Error fetching balances", e);
            } finally {
                if (mounted) setLoadingData(false);
            }
        }
        if (!authLoading && businessId) {
            fetchBalances();
        }
    }, [businessId, authLoading]);

    if (authLoading || loadingData) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <Skeleton className="w-1/3 h-10" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="w-full h-64 rounded-xl" />
                    <Skeleton className="w-full h-64 rounded-xl" />
                </div>
            </div>
        );
    }

    const conversionRate = 0.10; // 1 DP = 0.10 EUR for businesses to buy ads
    const dpInEuros = balances.dp * conversionRate;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="pb-4 border-b border-slate-200">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Wallet <span className="text-blue-600">Empresarial</span></h1>
                <p className="text-slate-500 mt-2 text-lg">Consulta y gestiona tus saldo en puntos y comisiones disponibles.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* DP WALLET */}
                <Card className="border-slate-200 shadow-lg relative overflow-hidden bg-slate-900 text-white">
                    <div className="absolute top-0 right-0 p-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-medium tracking-wide flex items-center gap-2">
                                <PiggyBank className="w-5 h-5 text-blue-400" />
                                Dicilo Puntos (DP)
                            </CardTitle>
                            <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded-md font-mono border border-slate-700">Acumulados</span>
                        </div>
                        <CardDescription className="text-slate-400">Puntos recibidos de los usuarios como descuento.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 relative z-10">
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold tracking-tight">{balances.dp}</span>
                            <span className="text-xl text-slate-400 font-medium tracking-wide">DP</span>
                        </div>
                        <p className="text-sm text-blue-300 mt-2 flex items-center gap-1.5 opacity-90">
                            <RefreshCw className="w-3.5 h-3.5" />
                            Equivale a {dpInEuros.toFixed(2)}€ para pago de publicidad B2B.
                        </p>
                        
                        <div className="mt-8 pt-6 border-t border-slate-700/50 flex gap-3">
                            <Button disabled={plan === 'basic' || balances.dp === 0} className="bg-blue-600 hover:bg-blue-500 text-white flex-1" onClick={() => alert("Módulo Ad-Manager conectando...")}>
                                Pagar Anuncios con DP
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* EUR COMMISSIONS WALLET */}
                <Card className="border-teal-100 shadow-lg relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 border-2">
                    <div className="absolute bottom-0 left-0 p-32 bg-emerald-400/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-medium tracking-wide text-teal-900 flex items-center gap-2">
                                <ReceiptEuro className="w-5 h-5 text-teal-600" />
                                Comisiones Efectivas
                            </CardTitle>
                            <span className="bg-white text-teal-700 text-xs px-2 py-1 rounded-md font-mono border border-teal-200">Cashback B2B</span>
                        </div>
                        <CardDescription className="text-teal-700/70">Saldo generado por referir otras empresas a Dicilo.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 relative z-10">
                        <div className="flex items-baseline gap-2 text-teal-950">
                            <span className="text-5xl font-bold tracking-tight">{balances.eur.toFixed(2)}</span>
                            <span className="text-xl font-medium tracking-wide">EUR</span>
                        </div>
                        <p className="text-sm text-teal-600/80 mt-2 flex items-center gap-1.5 font-medium">
                            Disponible de inmediato para retiro o facturación.
                        </p>
                        
                        <div className="mt-8 pt-6 border-t border-teal-200/50 flex flex-col sm:flex-row gap-3">
                            <Button disabled={plan === 'basic' || balances.eur === 0} variant="outline" className="flex-1 bg-white border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800">
                                Pagar Suscripción
                            </Button>
                            <Button disabled={plan === 'basic' || balances.eur === 0} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white border-0 shadow-md">
                                Iniciar Retiro a Banco
                            </Button>
                        </div>
                    </CardContent>
                </Card>

            </div>
            
            {(plan === 'basic') && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-4 text-sm font-medium mt-6">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                    <p>Tu plan {plan} solo te permite observar el saldo. Necesitas mejorar al menos a Starter para recibir comisiones B2B operativas.</p>
                </div>
            )}
        </div>
    );
}

import { AlertTriangle } from 'lucide-react';
