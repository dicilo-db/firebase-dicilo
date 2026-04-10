'use client';

import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { LifeBuoy, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SupportPage() {
    const { businessId, plan, isLoading } = useBusinessAccess();

    if (isLoading) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <Skeleton className="w-1/3 h-10" />
                <Skeleton className="w-full h-80 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="pb-4 border-b border-slate-200 text-left">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <LifeBuoy className="w-8 h-8 text-rose-600" />
                    Soporte <span className="text-rose-600">Técnico B2B</span>
                </h1>
                <p className="text-slate-500 mt-2 text-lg">Acude al equipo técnico humano para asistencia sobre la plataforma, pagos o facturación.</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-16 text-center border shadow-sm">
                <LifeBuoy className="w-16 h-16 mx-auto text-rose-300 mb-6" />
                <h2 className="text-3xl font-extrabold text-slate-700 mb-2">Centro de Ayuda</h2>
                <p className="text-slate-500 max-w-lg mx-auto mb-8">
                    Para brindarte un mejor servicio, agrupamos toda la asistencia mediante un portal de Tickets Inteligentes donde puedes adjuntar comprobantes o capturas.
                </p>
                <Link href="/dashboard/tickets/create">
                    <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white gap-2 font-bold px-8">
                         Crear Ticket Nuevo <ArrowRight className="w-5 h-5" />
                    </Button>
                </Link>
                
                <div className="mt-6">
                    <Link href="/dashboard/tickets" className="text-rose-600 hover:text-rose-800 font-medium underline-offset-4 hover:underline">
                         Ver Monitoreo de Tickets Abiertos
                    </Link>
                </div>
            </div>
        </div>
    );
}
