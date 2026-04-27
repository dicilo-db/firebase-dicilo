'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';

export function CookieConsent() {
    const { t } = useTranslation('common');
    const [isOpen, setIsOpen] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [analytics, setAnalytics] = useState(false);
    const [preferences, setPreferences] = useState(false);
    const [marketing, setMarketing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Comprobar consentimiento previo al cargar
        const existingConsent = localStorage.getItem('dicilo_cookie_consent');
        if (!existingConsent) {
            // Si no hay cookies, forzamos abrir el modal
            setIsOpen(true);
        } else {
            // Cargar estado previo
            try {
                const parsed = JSON.parse(existingConsent);
                setAnalytics(!!parsed.analiticas);
                setPreferences(!!parsed.preferencias);
                setMarketing(!!parsed.marketing);
                aplicarCookies(parsed);
            } catch (e) {
                console.error("Error parsing cookies", e);
                setIsOpen(true);
            }
        }
    }, []);

    const aplicarCookies = (consent: any) => {
        if (consent.analiticas) console.log("Cookies: Activando Analíticas");
        if (consent.preferencias) console.log("Cookies: Activando Preferencias");
        if (consent.marketing) console.log("Cookies: Activando Marketing");
    };

    const handleSave = () => {
        const consent = {
            analiticas: analytics,
            preferencias: preferences,
            marketing: marketing,
            fecha: new Date().toISOString()
        };
        localStorage.setItem('dicilo_cookie_consent', JSON.stringify(consent));
        setIsOpen(false);
        aplicarCookies(consent);
    };

    const handleOnlyNecessary = () => {
        setAnalytics(false);
        setPreferences(false);
        setMarketing(false);
        
        const consent = {
            analiticas: false,
            preferencias: false,
            marketing: false,
            fecha: new Date().toISOString()
        };
        localStorage.setItem('dicilo_cookie_consent', JSON.stringify(consent));
        setIsOpen(false);
        aplicarCookies(consent);
    };

    const handleAcceptAll = () => {
        setAnalytics(true);
        setPreferences(true);
        setMarketing(true);
        
        const consent = {
            analiticas: true,
            preferencias: true,
            marketing: true,
            fecha: new Date().toISOString()
        };
        localStorage.setItem('dicilo_cookie_consent', JSON.stringify(consent));
        setIsOpen(false);
        setShowDetails(false);
        aplicarCookies(consent);
    };

    if (!isMounted) return null;

    return (
        <>
            {/* Pill flotante para reabrir ajustes */}
            {!isOpen && (
                <button 
                    onClick={() => { setIsOpen(true); setShowDetails(true); }}
                    className="fixed bottom-2 left-2 z-[9990] bg-white/90 backdrop-blur-sm hover:bg-slate-50 transition-all text-[#5a5a5a] text-[10px] sm:text-xs font-medium px-3 py-1.5 rounded-full shadow-md border border-[#8cc63f] hover:scale-105 opacity-80 hover:opacity-100 max-w-[140px] truncate"
                >
                    {t('cookies.floating_btn', 'Cookie-Einstellungen')}
                </button>
            )}

            {/* Banner Simple Inicial */}
            {isOpen && !showDetails && (
                <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-slate-200 animate-in slide-in-from-bottom-full duration-300">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-slate-600 flex-1">
                            {t('cookies.banner_desc', 'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern. Sie können alle akzeptieren oder Ihre Einstellungen anpassen.')}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                            <Button 
                                onClick={() => setShowDetails(true)}
                                variant="outline" 
                                size="sm"
                                className="flex-1 sm:flex-none border-slate-300 text-slate-600"
                            >
                                {t('cookies.settings', 'Einstellungen')}
                            </Button>
                            <Button 
                                onClick={handleOnlyNecessary}
                                variant="outline" 
                                size="sm"
                                className="flex-1 sm:flex-none border-slate-300 text-slate-600"
                            >
                                {t('cookies.only_necessary', 'Nur notwendige')}
                            </Button>
                            <Button 
                                onClick={handleAcceptAll}
                                size="sm"
                                className="flex-1 sm:flex-none bg-[#8cc63f] hover:bg-[#7ab133] text-white"
                            >
                                {t('cookies.accept_all', 'Alle akzeptieren')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Detalles (Preferences) */}
            {isOpen && showDetails && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-xl bg-white text-[#5a5a5a] rounded-xl shadow-2xl border-t-4 border-[#8cc63f] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 tracking-wide">
                                {t('cookies.title', 'Cookie-Einstellungen')}
                            </h2>
                            <button 
                                onClick={() => {
                                    // Si el usuario cierra con la X y no había guardado nada antes, asumimos "Solo Necesarias" o simplemente cerramos.
                                    // Si es su primera visita, forzosamente debería elegir, pero le permitimos cerrar por UX temporal.
                                    if(!localStorage.getItem('dicilo_cookie_consent')) {
                                        handleOnlyNecessary();
                                    } else {
                                        setIsOpen(false);
                                    }
                                }} 
                                className="text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Contenido (Scrollable si es pequeño) */}
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <p className="text-sm leading-relaxed mb-6">
                                {t('cookies.desc', 'Wählen Sie aus, welche Cookies Sie zulassen möchten. Notwendige Cookies sind immer aktiv, da sie für den Betrieb der Website erforderlich sind.')}
                            </p>

                            <div className="space-y-6">
                                {/* Switch 1: Notwendig */}
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-1">
                                            {t('cookies.necessary', 'Notwendig')}
                                        </h3>
                                        <p className="text-xs">
                                            {t('cookies.necessary_desc', 'Erforderlich für Sicherheit, Navigation und Grundfunktionen.')}
                                        </p>
                                    </div>
                                    <Switch checked disabled className="data-[state=checked]:bg-[#8cc63f] cursor-not-allowed opacity-60" />
                                </div>

                                {/* Separador */}
                                <div className="h-px w-full bg-slate-100"></div>

                                {/* Switch 2: Analyse */}
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-1">
                                            {t('cookies.analytics', 'Analyse')}
                                        </h3>
                                        <p className="text-xs">
                                            {t('cookies.analytics_desc', 'Hilft uns zu verstehen, wie Besucher die Website nutzen.')}
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={analytics} 
                                        onCheckedChange={setAnalytics} 
                                        className="data-[state=checked]:bg-[#8cc63f] data-[state=unchecked]:bg-slate-300" 
                                    />
                                </div>

                                <div className="h-px w-full bg-slate-100"></div>

                                {/* Switch 3: Präferenzen */}
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-1">
                                            {t('cookies.preferences', 'Präferenzen')}
                                        </h3>
                                        <p className="text-xs">
                                            {t('cookies.preferences_desc', 'Speichert Sprach- oder Oberflächeneinstellungen.')}
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={preferences} 
                                        onCheckedChange={setPreferences} 
                                        className="data-[state=checked]:bg-[#8cc63f] data-[state=unchecked]:bg-slate-300" 
                                    />
                                </div>

                                <div className="h-px w-full bg-slate-100"></div>

                                {/* Switch 4: Marketing */}
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-1">
                                            {t('cookies.marketing', 'Marketing')}
                                        </h3>
                                        <p className="text-xs">
                                            {t('cookies.marketing_desc', 'Für Kampagnen, Messung und Remarketing.')}
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={marketing} 
                                        onCheckedChange={setMarketing} 
                                        className="data-[state=checked]:bg-[#8cc63f] data-[state=unchecked]:bg-slate-300" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
                            <Button 
                                onClick={handleOnlyNecessary}
                                variant="outline" 
                                className="w-full sm:w-auto bg-transparent border-slate-300 text-[#5a5a5a] hover:bg-slate-100"
                            >
                                {t('cookies.only_necessary', 'Nur notwendige')}
                            </Button>
                            <Button 
                                onClick={handleSave}
                                className="w-full sm:w-auto bg-[#8cc63f] hover:bg-[#7ab133] text-white font-bold"
                            >
                                {t('cookies.save', 'Einstellungen speichern')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
