'use client';

import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientProductManager } from '@/components/dashboard/ClientProductManager';

export default function ProductsPage() {
    const { businessId, clientId, plan, isLoading } = useBusinessAccess();
    const activeId = businessId || clientId;

    if (isLoading) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <Skeleton className="w-1/3 h-10" />
                <Skeleton className="w-full h-80 rounded-xl" />
            </div>
        );
    }

    if (plan === 'basic' || !activeId) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-4 text-sm font-medium mt-6">
                    <p>El módulo de Gestión de Productos requiere plan Starter o superior.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="pb-4 border-b border-slate-200 text-left">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <Package className="w-8 h-8 text-indigo-600" />
                    Catálogo de <span className="text-indigo-600">Productos y Servicios</span>
                </h1>
                <p className="text-slate-500 mt-2 text-lg">Crea, edita y organiza tu oferta comercial para que tus clientes la vean en la app de manera destacada.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <ClientProductManager companyId={activeId as string} />
            </div>
        </div>
    );
}
