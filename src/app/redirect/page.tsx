'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ExternalLink, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function RedirectContent() {
    const { t } = useTranslation('common');
    const searchParams = useSearchParams();
    const router = useRouter();
    const url = searchParams.get('url');

    if (!url) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl shadow-xl">
                <ShieldAlert className="h-16 w-16 text-yellow-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Enlace no válido</h1>
                <p className="text-muted-foreground mb-6">No se ha proporcionado una dirección de destino válida.</p>
                <Button onClick={() => router.back()} variant="outline">Volver</Button>
            </div>
        );
    }

    const decodedUrl = decodeURIComponent(url);
    const domain = new URL(decodedUrl).hostname;

    return (
        <Card className="w-full max-w-lg mx-auto shadow-2xl border-0 ring-1 ring-slate-200 overflow-hidden bg-white">
            <div className="h-2 bg-yellow-500" />
            <CardHeader className="text-center p-8">
                <div className="mx-auto bg-yellow-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="h-10 w-10 text-yellow-600" />
                </div>
                <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">Seguridad de Enlace</CardTitle>
                <CardDescription className="text-base mt-2">
                    Estás a punto de salir de la plataforma oficial de **Dicilo.net**
                </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 break-all">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Destino:</p>
                    <p className="text-lg font-mono text-slate-800 font-medium">{decodedUrl}</p>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-blue-800">
                    <Info className="h-5 w-5 shrink-0 mt-0.5" />
                    <p>
                        Para tu seguridad, recuerda nunca compartir tus contraseñas o datos bancarios en sitios externos. Dicilo no se hace responsable del contenido de páginas de terceros.
                    </p>
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-600 text-center italic">¿Deseas verificar este enlace antes de continuar?</p>
                    <div className="grid grid-cols-1 gap-3">
                        <Button 
                            variant="outline" 
                            className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 h-12 rounded-xl group"
                            onClick={() => window.open(`https://www.virustotal.com/gui/search/${encodeURIComponent(decodedUrl)}`, '_blank')}
                        >
                            <ShieldCheck className="h-5 w-5 mr-3 text-green-600" />
                            Escanear con VirusTotal (Recomendado)
                        </Button>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 p-8 flex flex-col sm:flex-row gap-4">
                <Button 
                    variant="ghost" 
                    className="flex-1 h-12 rounded-xl text-slate-600"
                    onClick={() => router.back()}
                >
                    Volver a Dicilo
                </Button>
                <Button 
                    className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-black text-white group"
                    onClick={() => window.open(decodedUrl, '_blank')}
                >
                    Continuar al sitio
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function RedirectPage() {
    return (
        <div className="min-h-screen bg-slate-100/50 flex items-center justify-center p-4 py-20">
            <Suspense fallback={
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            }>
                <RedirectContent />
            </Suspense>
        </div>
    );
}
