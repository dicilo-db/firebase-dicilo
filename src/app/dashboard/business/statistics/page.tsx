'use client';

import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { AdStatistics } from '@/components/dashboard/AdStatistics';
import { BarChart, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function StatisticsPage() {
    const { businessId, plan, isLoading } = useBusinessAccess();

    if (isLoading) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <Skeleton className="w-1/3 h-10" />
                <Skeleton className="w-full h-80 rounded-xl" />
            </div>
        );
    }

    // Stats requires logic that generally operates starting at Retailer or higher, 
    // but typically we can block 'basic' and 'starter' if we follow sidebar's 'reqLvl: 3'
    if (plan === 'basic' || plan === 'starter' || !businessId) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-4 text-sm font-medium mt-6">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>El módulo de Estadísticas Avanzadas requiere un plan Retailer o Premium. Sube de plan para analizar el rendimiento de tu audiencia en detalle.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="pb-4 border-b border-slate-200 text-left">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <BarChart className="w-8 h-8 text-blue-600" />
                    Estadísticas <span className="text-blue-600">Dicilo</span>
                </h1>
                <p className="text-slate-500 mt-2 text-lg">Mide el impacto de tu negocio y revisa las métricas de clics, vistas de anuncios y demografía local.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <AdStatistics adId={businessId} />
            </div>
        </div>
    );
}
