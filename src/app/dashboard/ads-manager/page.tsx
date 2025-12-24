'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Mail, MonitorPlay, ArrowRight, BarChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdsManagerDashboard() {
    return (
        <div className="p-6 md:p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Ads Campañas Manager</h1>
                <p className="text-muted-foreground mt-2">Centraliza y optimiza tus estrategias de marketing digital y físico.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Module: Dynamic QR */}
                <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-all">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <QrCode className="h-8 w-8 text-primary mb-2" />
                            <Badge>Activo</Badge>
                        </div>
                        <CardTitle>QRs Dinámicos</CardTitle>
                        <CardDescription>Crea códigos QR editables para tus campañas impresas y digitales. Rastrea scans y cambia destinos.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Link href="/dashboard/ads-manager/qr-codes" className="w-full">
                            <Button className="w-full group">
                                Gestionar QRs
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>

                {/* Module: Email Marketing */}
                <Card className="opacity-75 border-dashed">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <Mail className="h-8 w-8 text-muted-foreground mb-2" />
                            <Badge variant="outline">Próximamente</Badge>
                        </div>
                        <CardTitle>Email Marketing</CardTitle>
                        <CardDescription>Envía newsletters y promociones automatizadas a tus listas de clientes segmentadas.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button variant="secondary" disabled className="w-full">
                            En desarrollo
                        </Button>
                    </CardFooter>
                </Card>

                {/* Module: Display Ads */}
                <Card className="opacity-75 border-dashed">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <MonitorPlay className="h-8 w-8 text-muted-foreground mb-2" />
                            <Badge variant="outline">Próximamente</Badge>
                        </div>
                        <CardTitle>Display Ads</CardTitle>
                        <CardDescription>Gestiona banners publicitarios dentro de la red Dicilo y sitios asociados.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button variant="secondary" disabled className="w-full">
                            En desarrollo
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Global Stats Preview */}
            <Card className="bg-slate-50 dark:bg-slate-900 border-none">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        <CardTitle>Resumen Global de Rendimiento</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-32 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg border-slate-200 dark:border-slate-800">
                        Las estadísticas agregadas de todos tus módulos aparecerán aquí.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
