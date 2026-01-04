'use client';

import React from 'react';
import ScannerPro from '@/components/admin/ScannerPro';
import { ReportsPanel } from '@/components/admin/ReportsPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Separator } from '@/components/ui/separator';
import { Scan } from 'lucide-react';

export default function ScannerPage() {
    const { t } = useTranslation('admin');

    return (
        <div className="w-full max-w-[1800px] mx-auto p-4 md:p-8 space-y-8 pb-24">
            <div className="space-y-2 text-center md:text-left">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2 justify-center md:justify-start">
                    <Scan className="h-8 w-8 text-blue-600" />
                    Dicilo Scanner & Reports
                </h1>
                <p className="text-slate-500">
                    Herramienta unificada para capturar prospectos y generar reportes B2B.
                </p>
            </div>

            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[60%_40%] xl:grid-cols-[65%_35%]">

                {/* Left Column: Scanner */}
                <div className="space-y-6">
                    <Card className="border-blue-100 shadow-md">
                        <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-3">
                            <CardTitle className="text-lg text-blue-900">Scanner Pro</CardTitle>
                            <CardDescription>Captura tarjetas y asigna leads en tiempo real.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ScannerPro />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Reports & Info */}
                <div className="space-y-6">

                    {/* Reports Panel */}
                    <ReportsPanel />

                    {/* Instructions / Help */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">¿Cómo funciona?</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-4 text-slate-600">
                            <div>
                                <strong className="block text-slate-900 mb-1">1. Captura (Scanner)</strong>
                                <p>Apunta la cámara a una tarjeta de visita. La IA extraerá los datos automáticamente. Si estás trabajando para un cliente específico (ej. Travelposting), selecciona "Recordar" para escanear en ráfaga.</p>
                            </div>
                            <Separator />
                            <div>
                                <strong className="block text-slate-900 mb-1">2. Fusión Inteligente (Smart Merge)</strong>
                                <p>Si escaneas una empresa que ya existe, el sistema <b>no la duplicará</b>. En su lugar, completará los datos que falten (ej. si tenías el email pero no el teléfono) y te avisará.</p>
                            </div>
                            <Separator />
                            <div>
                                <strong className="block text-slate-900 mb-1">3. Reportes</strong>
                                <p>Al final del día, usa el panel de arriba para descargar un Excel con todos los leads capturados para tu cliente. ¡Listo para enviar!</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
