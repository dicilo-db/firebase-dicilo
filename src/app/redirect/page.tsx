'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ExternalLink, ArrowRight, ShieldCheck, Info, RefreshCw, AlertTriangle, CheckCircle, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { checkUrlSafety } from '@/app/actions/security-utils';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/lib/firebase';

function RedirectContent() {
    const { t } = useTranslation('common');
    const searchParams = useSearchParams();
    const router = useRouter();
    const url = searchParams.get('url');
    
    const [scanResult, setScanResult] = useState<{status: string, message?: string, stats?: any} | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });
        return () => unsubscribe();
    }, []);

    if (!url) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl shadow-xl max-w-md mx-auto">
                <ShieldAlert className="h-16 w-16 text-yellow-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Enlace no válido</h1>
                <p className="text-muted-foreground mb-6">No se ha proporcionado una dirección de destino válida.</p>
                <Button onClick={() => router.push('/')} variant="outline" className="w-full h-12 rounded-xl">Volver a Dicilo</Button>
            </div>
        );
    }

    const decodedUrl = decodeURIComponent(url);
    
    const handleScan = async () => {
        setIsScanning(true);
        try {
            const result = await checkUrlSafety(decodedUrl);
            if (result.success) {
                setScanResult(result.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsScanning(false);
        }
    };

    const handleReturn = () => {
        if (isLoggedIn) {
            window.location.href = 'https://dicilo.net/dashboard';
        } else {
            window.location.href = 'https://dicilo.net';
        }
    };

    return (
        <Card className="w-full max-w-xl mx-auto shadow-2xl border-0 ring-1 ring-slate-200 overflow-hidden bg-white">
            <div className="h-2 bg-yellow-500" />
            <CardHeader className="text-center p-8 pb-4">
                <div className="mx-auto bg-yellow-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <ShieldAlert className="h-8 w-8 text-yellow-600" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Seguridad de Enlace</CardTitle>
                <CardDescription className="text-sm mt-1">
                    Estás a punto de salir de la plataforma oficial de **Dicilo.net**
                </CardDescription>
            </CardHeader>
            <CardContent className="px-8 space-y-5">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 break-all">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">DESTINO:</p>
                    <p className="text-base font-mono text-slate-700 leading-tight">{decodedUrl}</p>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-blue-900">
                    <Info className="h-5 w-5 shrink-0 text-blue-500" />
                    <p className="leading-relaxed">
                        Para tu seguridad, recuerda nunca compartir tus contraseñas o datos bancarios en sitios externos. Dicilo no se hace responsable del contenido de páginas de terceros. <strong>Tampoco pedimos ni contraseñas ni números bancarios ni datos fiscales a través de un enlace.</strong>
                    </p>
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-600 text-center italic">¿Deseas verificar este enlace antes de continuar?</p>
                    
                    {!scanResult ? (
                        <Button 
                            variant="outline" 
                            disabled={isScanning}
                            className="w-full bg-white border-slate-200 hover:bg-slate-50 text-slate-700 h-12 rounded-xl group transition-all"
                            onClick={handleScan}
                        >
                            {isScanning ? <RefreshCw className="h-5 w-5 mr-3 animate-spin text-purple-600" /> : <ShieldCheck className="h-5 w-5 mr-3 text-green-600" />}
                            {isScanning ? 'Escaneando con VirusTotal...' : 'Escanear con VirusTotal (Recomendado)'}
                        </Button>
                    ) : (
                        <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-2 ${
                            scanResult.status === 'dangerous' ? 'bg-red-50 border-red-200 text-red-900' :
                            scanResult.status === 'safe' ? 'bg-green-50 border-green-200 text-green-900' :
                            'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                            {scanResult.status === 'dangerous' ? <AlertTriangle className="h-6 w-6 shrink-0" /> : 
                             scanResult.status === 'safe' ? <CheckCircle className="h-6 w-6 shrink-0" /> : 
                             <Info className="h-6 w-6 shrink-0" />}
                            
                            <div className="flex-1">
                                <p className="font-bold text-sm">
                                    {scanResult.status === 'dangerous' ? '¡AMENAZA DETECTADA!' :
                                     scanResult.status === 'safe' ? 'Página verfificada como segura' :
                                     'Resultado desconocido'}
                                </p>
                                <p className="text-xs opacity-80">
                                    {scanResult.status === 'dangerous' 
                                        ? `Reportada por ${scanResult.stats.malicious + scanResult.stats.suspicious} motores de seguridad.` 
                                        : scanResult.status === 'safe'
                                        ? `Analizada por ${scanResult.total_engines} motores sin amenazas detectadas.`
                                        : scanResult.message || 'No hay reportes previos para este sitio.'}
                                </p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => setScanResult(null)} className="h-8 px-2">Reintentar</Button>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 p-8 flex flex-col sm:flex-row gap-4 border-t border-slate-100">
                <Button 
                    variant="ghost" 
                    className="flex-1 h-12 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                    onClick={handleReturn}
                >
                    <Home className="mr-2 h-4 w-4" />
                    Volver a Dicilo
                </Button>
                <Button 
                    className="flex-1 h-12 rounded-xl bg-[#0F172A] hover:bg-black text-white font-bold group shadow-lg"
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
        <div className="min-h-screen bg-slate-100/30 flex items-center justify-center p-4 py-8">
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
