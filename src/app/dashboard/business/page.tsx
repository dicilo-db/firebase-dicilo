'use client';

import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Eye, MousePointerClick, CalendarRange } from 'lucide-react';

export default function BusinessDashboardPage() {
    const { name, plan } = useBusinessAccess();

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="pb-4 border-b border-slate-200">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Portal <span className="text-blue-600">B2B</span></h1>
                <p className="text-slate-500 mt-2 text-lg">Hola, <strong>{name || 'Empresa'}</strong>. Qué bueno tenerte de vuelta.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tu Plan Actual</CardTitle>
                        <Zap className={`w-4 h-4 ${plan === 'premium' ? 'text-amber-500' : 'text-blue-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 capitalize">{plan || 'Básico'}</div>
                        <p className="text-xs text-slate-500 mt-1">Suscripción activa en Dicilo</p>
                    </CardContent>
                </Card>

                {/* Simulated Stats for Overview */}
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Visitas a tu Perfil</CardTitle>
                        <Eye className="w-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">---</div>
                        <p className="text-xs text-slate-500 mt-1">Últimos 30 días</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Clics en Botones</CardTitle>
                        <MousePointerClick className="w-4 h-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">---</div>
                        <p className="text-xs text-slate-500 mt-1">Hacia tu web / teléfono</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Cupones Usados</CardTitle>
                        <CalendarRange className="w-4 h-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">---</div>
                        <p className="text-xs text-slate-500 mt-1">Canjes validados</p>
                    </CardContent>
                </Card>
            </div>

            {/* Banner based on plan */}
            {plan !== 'premium' && (
                <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white shadow-md">
                    <h3 className="text-2xl font-bold mb-2">Desbloquea todo el potencial de {name}</h3>
                    <p className="text-blue-100 max-w-2xl mb-6">
                        Construye tu propia Micro-Web con nuestro "Page Editor", vende en línea, administra catálogos y paga anuncios usando los DiciPoints de tu Wallet cambiando a Premium.
                    </p>
                    <a href="/planes" className="bg-white text-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors inline-flex items-center gap-2">
                        Mejorar a Premium
                    </a>
                </div>
            )}
        </div>
    );
}
