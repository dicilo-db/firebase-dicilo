'use client';

import React, { useEffect, useState } from 'react';
import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { BrainCircuit, LineChart, Target, Zap, TrendingUp, Users, Presentation, Lightbulb, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getGlobalStats, GlobalStats } from '@/app/actions/global-stats';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// Simulated trend data based on category
const getTrendData = (category: string) => {
    return [
        { name: 'Ene', interes: 45, conversiones: 20 },
        { name: 'Feb', interes: 52, conversiones: 28 },
        { name: 'Mar', interes: 61, conversiones: 35 },
        { name: 'Abr', interes: 58, conversiones: 30 },
        { name: 'May', interes: 74, conversiones: 48 },
        { name: 'Jun', interes: 85, conversiones: 60 },
    ];
};

export default function MarketIntelligencePage() {
    const { plan, isLoading } = useBusinessAccess();
    
    const [globalData, setGlobalData] = useState<GlobalStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoadingStats(true);
            try {
                const data = await getGlobalStats();
                setGlobalData(data);
            } catch (error) {
                console.error("Error fetching intelligence data:", error);
            } finally {
                setLoadingStats(false);
            }
        }
        if (!isLoading) fetchStats();
    }, [isLoading]);

    if (isLoading) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <Skeleton className="w-1/3 h-10" />
                <Skeleton className="w-full h-80 rounded-xl" />
            </div>
        );
    }

    if (plan === 'basic' || plan === 'starter') {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-4 text-sm font-medium mt-6">
                    <p>El módulo de Inteligencia de Mercado requiere plan Retailer o Premium.</p>
                </div>
            </div>
        );
    }

    const businessCategory = 'General';
    const trendData = getTrendData(businessCategory);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="pb-4 border-b border-slate-200 text-left mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold flex items-center gap-3 text-slate-900">
                        <BrainCircuit className="w-8 h-8 text-blue-600" />
                        Inteligencia de <span className="text-blue-600">Mercado</span>
                    </h1>
                    <p className="mt-2 text-slate-500 text-lg">
                        Descubre insights demográficos, competitividad en red y toma decisiones basadas en la data de Dicilo.
                    </p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 px-3 py-1 text-sm">
                    <Zap className="w-4 h-4" /> I.A. Actualizada Hoy
                </Badge>
            </div>

            {loadingStats ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-t-4 border-t-blue-500 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 flex justify-between">
                                Usuarios Potenciales <Users className="w-4 h-4 text-slate-400"/>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-800">{globalData?.totalUsers.toLocaleString() || '---'}</div>
                            <p className="text-xs text-blue-600 mt-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1"/> En constante crecimiento global</p>
                        </CardContent>
                    </Card>

                    <Card className="border-t-4 border-t-indigo-500 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 flex justify-between">
                                Red de Comercios <Presentation className="w-4 h-4 text-slate-400"/>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-800">{globalData?.totalAgencies.toLocaleString() || '---'}</div>
                            <p className="text-xs text-indigo-600 mt-1 flex items-center"><Target className="w-3 h-3 mr-1"/> Socios corporativos activos</p>
                        </CardContent>
                    </Card>

                    <Card className="border-t-4 border-t-violet-500 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 flex justify-between">
                                Alcance Demográfico <MapPin className="w-4 h-4 text-slate-400"/>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-800">{globalData?.totalCountriesPotential || 0}</div>
                            <p className="text-xs text-violet-600 mt-1">Países conectados en la plataforma</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                
                {/* Visual Chart Area */}
                <Card className="lg:col-span-2 shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                            <LineChart className="w-5 h-5 text-blue-500"/> Tendencia de Categoría: {businessCategory}
                        </CardTitle>
                        <CardDescription>Volumen de búsquedas estimadas y clics de la comunidad local.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80 w-full pl-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorInteres" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="interes" name="Interés Local" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorInteres)" />
                                <Area type="monotone" dataKey="conversiones" name="Visitas a Fichas" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorConv)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* AI Suggestions Box */}
                <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader>
                        <CardTitle className="text-xl text-indigo-900 flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-indigo-600"/> Sugerencias I.A.
                        </CardTitle>
                        <CardDescription className="text-indigo-700/70">Consejos automatizados para destacar sobre la competencia.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 flex gap-3">
                            <span className="text-2xl">🔥</span>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800">Sube 2 nuevos cupones</h4>
                                <p className="text-xs text-slate-500 mt-1">Tu sector ({businessCategory}) tiene un 40% más de retención si rotas las ofertas quincenalmente.</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 flex gap-3">
                            <span className="text-2xl">📸</span>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800">Actualiza tus fotos</h4>
                                <p className="text-xs text-slate-500 mt-1">Descubrimos que las fichas con imágenes subidas este mes tienen un 2.5x más tiempo de visita.</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 flex gap-3 opacity-70">
                            <span className="text-2xl">📈</span>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800 flex justify-between">
                                    SEO Local <Badge variant="secondary" className="text-[10px] py-0 h-4">Pronto</Badge>
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">Generador de Keywords para aparecer primero en las búsquedas zonales.</p>
                            </div>
                        </div>

                        <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                            Descargar Reporte PDF
                        </Button>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
