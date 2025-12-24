'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, MousePointerClick, DollarSign } from 'lucide-react';

export default function FreelancerStatsPage() {
    return (
        <div className="p-6 md:p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
                <p className="text-muted-foreground mt-2">Monitoriza el rendimiento de tus promociones y tus ganancias.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clicks Totales</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,234</div>
                        <p className="text-xs text-muted-foreground">+20.1% vs mes anterior</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ganancias Estimadas</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$124.50</div>
                        <p className="text-xs text-muted-foreground">+15% vs mes anterior</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Promociones Activas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8</div>
                        <p className="text-xs text-muted-foreground">3 nuevas esta semana</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">CTR Promedio</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3.2%</div>
                        <p className="text-xs text-muted-foreground">+0.4% vs mes anterior</p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Stats Placeholder */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Rendimiento Reciente</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                        Gráfico de rendimiento próximamente...
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
