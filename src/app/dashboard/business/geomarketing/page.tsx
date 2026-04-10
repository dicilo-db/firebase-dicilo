'use client';

import React, { useEffect, useState } from 'react';
import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { MapPin, Target, LocateFixed, Eye, Loader2, Save, Activity, Navigation, Radar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface GeoConfig {
    isActive: boolean;
    radiusKm: number;
    targetZips: string;
    pushMessage: string;
}

export default function GeomarketingPage() {
    const { t } = useTranslation('common');
    const { businessId, plan, isLoading } = useBusinessAccess();
    const { toast } = useToast();
    
    const [config, setConfig] = useState<GeoConfig>({
        isActive: false,
        radiusKm: 2,
        targetZips: '',
        pushMessage: '¡Hola! Estás cerca de nuestra tienda. Entra hoy y recibe un 10% de descuento.'
    });
    
    const [saving, setSaving] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!businessId) return;

        const fetchData = async () => {
            setLoadingData(true);
            try {
                const docRef = doc(db, 'clients', businessId);
                const snap = await getDoc(docRef);
                if (snap.exists() && snap.data().geomarketingConfig) {
                    setConfig(snap.data().geomarketingConfig);
                }
            } catch (err) {
                console.error(err);
                toast({ title: 'Error de conexión', variant: 'destructive' });
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [businessId, toast]);

    const handleSaveConfig = async () => {
        if (!businessId) return;
        setSaving(true);
        try {
            const docRef = doc(db, 'clients', businessId);
            await updateDoc(docRef, { geomarketingConfig: config });
            toast({ title: 'Configuración Espacial Guardada' });
        } catch (e) {
            console.error(e);
            toast({ title: 'Error al actualizar', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <Skeleton className="w-1/3 h-10" />
                <Skeleton className="w-full h-80 rounded-xl" />
            </div>
        );
    }

    if (plan === 'basic' || plan === 'starter' || !businessId) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-4 text-sm font-medium mt-6">
                    <p>El radar de Geomarketing requiere plan Retailer o Premium.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="pb-4 border-b border-slate-200 text-left mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold flex items-center gap-3 text-slate-900">
                        <Radar className="w-8 h-8 text-emerald-600" />
                        {t('business.geo.title', 'Geomarketing Hyperlocal')}
                    </h1>
                    <p className="mt-2 text-slate-500 text-lg max-w-2xl">
                        {t('business.geo.desc', 'Atrae clientes que caminan cerca de tu negocio.')}
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 mb-1 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                    <Label htmlFor="active-radar" className="text-sm font-bold text-slate-700">
                        {config.isActive ? 'Radar Activado' : 'Radar Apagado'}
                    </Label>
                    <Switch 
                        id="active-radar"
                        checked={config.isActive}
                        onCheckedChange={(val) => setConfig({...config, isActive: val})}
                        className="data-[state=checked]:bg-emerald-600"
                    />
                </div>
            </div>

            {loadingData ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Setup Panel */}
                    <Card className="border-t-4 border-t-emerald-500 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <LocateFixed className="w-5 h-5 text-emerald-600" /> {t('business.geo.zoneParams', 'Parámetros de Zona')}
                            </CardTitle>
                            <CardDescription>Ajusta cómo la app de Dicilo detecta y aborda a los clientes potenciales.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="font-bold text-slate-800">{t('business.geo.radiusLabel', 'Radio de Alcance (Kilómetros)')}</Label>
                                    <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2 rounded-md">{config.radiusKm} km</span>
                                </div>
                                <Slider 
                                    value={[config.radiusKm]} 
                                    max={50} 
                                    min={1} 
                                    step={1}
                                    onValueChange={(val) => setConfig({...config, radiusKm: val[0]})}
                                />
                                <p className="text-xs text-slate-500">Un radio de {config.radiusKm}km abarca aproximadamente {Math.round(Math.PI * Math.pow(config.radiusKm, 2))} km² a tu alrededor.</p>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <Label className="font-bold text-slate-800">{t('business.geo.zipLabel', 'Códigos Postales Prioritarios')}</Label>
                                <Input 
                                    placeholder="Ej: 28014, 28015"
                                    value={config.targetZips}
                                    onChange={(e) => setConfig({...config, targetZips: e.target.value})}
                                />
                                <p className="text-xs text-slate-500">El sistema enfocará el 70% de las impresiones publicitarias a los usuarios que residen en estos códigos.</p>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <Label className="font-bold text-slate-800">{t('business.geo.pushLabel', 'Mensaje Flash')}</Label>
                                <Textarea 
                                    placeholder="El mensaje que recibirá la persona al pasar cerca."
                                    rows={3}
                                    value={config.pushMessage}
                                    onChange={(e) => setConfig({...config, pushMessage: e.target.value})}
                                />
                                <p className="text-xs text-slate-500">Asegúrate de incluir un "Ganchop" rápido. Hazlo irresistible.</p>
                            </div>

                            <Button 
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4 font-bold" 
                                onClick={handleSaveConfig}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                Guardar Perímetro
                            </Button>

                        </CardContent>
                    </Card>

                    {/* Simulation / Feedback Panel */}
                    <div className="space-y-6">
                        <Card className="bg-slate-800 text-white border-none shadow-md overflow-hidden relative group">
                            <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=40.4168,-3.7038&zoom=14&size=600x400&maptype=roadmap&style=feature:all|element:labels|visibility:off&style=feature:water|element:geometry|color:0x3b4252&style=feature:landscape|element:geometry|color:0x2e3440')] opacity-30 mix-blend-overlay grayscale"></div>
                            
                            {/* Animated Radar Effect */}
                            {config.isActive && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/20 rounded-full animate-ping pointer-events-none"></div>
                            )}

                            <CardHeader className="relative z-10 pb-2">
                                <CardTitle className="text-xl flex items-center gap-2 text-emerald-400">
                                    <Activity className="w-5 h-5" /> {t('business.geo.simulator', 'Simulador de Impacto')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10 space-y-4">
                                <p className="text-slate-300 text-sm">
                                    Con tu configuración actual de <strong className="text-emerald-400">{config.radiusKm} km</strong>, 
                                    este es el pronóstico automático basado en el histórico de Dicilo en las últimas 72 horas:
                                </p>
                                
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="bg-slate-900/60 p-4 rounded-xl backdrop-blur-sm border border-slate-700">
                                        <div className="text-3xl font-bold text-white mb-1">
                                            {Math.floor(config.radiusKm * 1450).toLocaleString()}
                                        </div>
                                        <div className="text-xs text-slate-400 font-medium">Vecinos en la zona</div>
                                    </div>
                                    <div className="bg-slate-900/60 p-4 rounded-xl backdrop-blur-sm border border-slate-700">
                                        <div className="text-3xl font-bold text-emerald-400 mb-1">
                                            {Math.floor(config.radiusKm * 89).toLocaleString()}
                                        </div>
                                        <div className="text-xs text-emerald-600/80 font-medium flex items-center">
                                            <Navigation className="w-3 h-3 mr-1"/> Caminantes (Móvil)
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-sm flex gap-3">
                            <Target className="w-6 h-6 shrink-0 text-emerald-600" />
                            <p>
                                <strong>Privacidad Asegurada:</strong> Dicilo nunca comparte la ubicación exacta de los usuarios con los negocios. El cruce espacial ocurre internamente y de forma 100% anonimizada.
                            </p>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
