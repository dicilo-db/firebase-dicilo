'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share2, X, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PwaInstallHelper() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [isIos, setIsIos] = useState(false);

    useEffect(() => {
        // 1. Detect standalone mode
        const checkStandalone = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                || (navigator as any).standalone 
                || document.referrer.includes('android-app://');
            setIsInstalled(isStandalone);
            if (isStandalone) {
                setShowBanner(false);
            }
        };

        checkStandalone();

        // 2. Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIos(ios);

        // 3. Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((reg) => console.log('PWA ServiceWorker registered:', reg.scope))
                .catch((err) => console.error('PWA ServiceWorker registration failed:', err));
        }

        // 4. Capture beforeinstallprompt (Chrome / Android)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            
            // Show banner if not dismissed and not installed
            const isDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
            if (!isInstalled && !isDismissed) {
                setShowBanner(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for appinstalled
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowBanner(false);
            setDeferredPrompt(null);
            console.log('PWA was installed successfully');
        };
        window.addEventListener('appinstalled', handleAppInstalled);

        // iOS auto-prompt suggestion after delay
        if (ios) {
            const isStandalone = (navigator as any).standalone;
            const isDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
            if (!isStandalone && !isDismissed) {
                const timer = setTimeout(() => {
                    setShowBanner(true);
                }, 3000);
                return () => clearTimeout(timer);
            }
        }

        // Manual trigger from settings
        const handleTriggerInstall = () => {
            localStorage.removeItem('pwa-install-dismissed');
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult: any) => {
                    if (choiceResult.outcome === 'accepted') {
                        setIsInstalled(true);
                        setShowBanner(false);
                    }
                });
            } else if (ios) {
                setShowBanner(true);
            } else {
                alert('La instalación PWA no es compatible en este navegador, o la app ya está instalada. En navegadores como Firefox u Opera, puedes instalarla seleccionando "Añadir a pantalla de inicio" en el menú del navegador.');
            }
        };

        window.addEventListener('trigger-pwa-install', handleTriggerInstall);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('trigger-pwa-install', handleTriggerInstall);
        };
    }, [isInstalled, deferredPrompt, isIos]);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    setIsInstalled(true);
                    setShowBanner(false);
                }
                setDeferredPrompt(null);
            });
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (isInstalled || !showBanner) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-96 z-[9999] animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-4 relative overflow-hidden">
                <button 
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
                
                <div className="flex items-start gap-3 pr-6">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 text-white">
                        <Download className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-extrabold text-sm tracking-tight text-white">Instalar Dicilo.net</h4>
                        <p className="text-xs text-slate-300 mt-1">
                            Añade Dicilo a tu pantalla de inicio para una experiencia más rápida y navegación fluida.
                        </p>
                    </div>
                </div>

                {isIos ? (
                    <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-300 space-y-2">
                        <p className="font-bold flex items-center gap-1.5 text-blue-400">
                            Instrucciones para iPhone / Safari:
                        </p>
                        <ol className="list-decimal pl-4 space-y-1">
                            <li>Presiona el botón de Compartir <Share2 className="h-3.5 w-3.5 inline mx-1 text-slate-400" /> en Safari.</li>
                            <li>Desliza y selecciona <span className="font-bold text-white">"Añadir a pantalla de inicio"</span> <PlusSquare className="h-3.5 w-3.5 inline mx-1 text-slate-400" />.</li>
                            <li>Toca <span className="font-bold text-white">"Añadir"</span> arriba a la derecha.</li>
                        </ol>
                    </div>
                ) : (
                    <div className="mt-4 flex gap-2 justify-end">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleDismiss}
                            className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
                        >
                            Quizás más tarde
                        </Button>
                        <Button 
                            size="sm" 
                            onClick={handleInstallClick}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                        >
                            Instalar
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
