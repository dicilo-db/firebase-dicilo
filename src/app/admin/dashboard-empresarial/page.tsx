'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, Shield, Award, Briefcase, Star, LayoutTemplate, PlusCircle, PenTool } from 'lucide-react';
import Link from 'next/link';

// Tipos de Fichas Configurales (Features de Dicilo)
export interface FichaConfig {
    id: string; // ej. "idiomas", "banner_flotante", "cupones"
    name: string;
    enabled: boolean;
    maxLimit?: number; // si aplica (ej. Max 6 idiomas)
}

// Estructura del Módulo (El "Contenedor" Básico, Premium, etc.)
export interface SystemModuleConfig {
    id: string; // 'basico', 'banner', 'starter', 'minorista', 'premium'
    name: string; // 'Básico', 'Banner', 'Starter', 'Minorista', 'Premium'
    description: string;
    fichas: Record<string, FichaConfig>;
}

// Semilla por Defecto si la DB está vacía
export const DEFAULT_MODULES: SystemModuleConfig[] = [
    {
        id: 'basico', name: 'Básico', description: 'Nivel gratuito con acceso esencial a directorio.',
        fichas: {
            "idiomas": { id: "idiomas", name: "Traducción de Idiomas", enabled: true, maxLimit: 3 },
            "banner_flotante": { id: "banner_flotante", name: "Banner Flotante", enabled: false },
            "cupones": { id: "cupones", name: "Editor de Cupones", enabled: false },
            "productos": { id: "productos", name: "Gestión de Productos", enabled: false },
            "estadisticas": { id: "estadisticas", name: "Estadísticas Reales", enabled: false },
            "inteligencia_mercado": { id: "inteligencia_mercado", name: "Inteligencia de Mercado", enabled: false },
            "redes_sociales": { id: "redes_sociales", name: "Automatización Redes", enabled: false },
            "geomarketing": { id: "geomarketing", name: "Geomarketing", enabled: false },
            "campanas": { id: "campanas", name: "Campañas Personalizadas", enabled: false },
            "consultas": { id: "consultas", name: "Consultas Comerciales", enabled: true },
            "categorias": { id: "categorias", name: "Limitar Categorías", enabled: false },
            "herramientas_graficas": { id: "herramientas_graficas", name: "Herramientas Gráficas", enabled: false },
            "cursos_ia": { id: "cursos_ia", name: "Cursos I.A.", enabled: false },
            "captacion_leads": { id: "captacion_leads", name: "Captación de Leads", enabled: false },
            "soporte_tecnico": { id: "soporte_tecnico", name: "Soporte Técnico Premium", enabled: false },
            "chatbot_ia": { id: "chatbot_ia", name: "Asistente Chatbot", enabled: false },
            "landing_page": { id: "landing_page", name: "Landing Page", enabled: false },
            "scanner_cobro": { id: "scanner_cobro", name: "Scanner de Cobro QR", enabled: false },
            "dual_wallet": { id: "dual_wallet", name: "Dual-Wallet Financiera", enabled: false }
        }
    },
    {
        id: 'banner', name: 'Banner', description: 'Módulo corporativo para anuncios gráficos dedicados.',
        fichas: {
            "banner_flotante": { id: "banner_flotante", name: "Banner Flotante (Extra)", enabled: true },
            "estadisticas": { id: "estadisticas", name: "Rendimiento del Banner", enabled: true },
            "consultas": { id: "consultas", name: "Consultas Comerciales", enabled: true },
            "scanner_cobro": { id: "scanner_cobro", name: "Scanner de Cobro QR", enabled: false },
            "dual_wallet": { id: "dual_wallet", name: "Dual-Wallet Financiera", enabled: false }
        }
    },
    {
        id: 'starter', name: 'Starter', description: 'Nivel de entrada comercial con visibilidad extendida.',
        fichas: {
            "idiomas": { id: "idiomas", name: "Traducción de Idiomas", enabled: true, maxLimit: 6 },
            "banner_flotante": { id: "banner_flotante", name: "Banner Flotante", enabled: false },
            "cupones": { id: "cupones", name: "Editor de Cupones", enabled: true, maxLimit: 5 },
            "productos": { id: "productos", name: "Gestión de Productos", enabled: true, maxLimit: 24 },
            "estadisticas": { id: "estadisticas", name: "Estadísticas Reales", enabled: true },
            "inteligencia_mercado": { id: "inteligencia_mercado", name: "Inteligencia de Mercado", enabled: true },
            "redes_sociales": { id: "redes_sociales", name: "Automatización Redes", enabled: true, maxLimit: 12 },
            "geomarketing": { id: "geomarketing", name: "Geomarketing", enabled: true },
            "campanas": { id: "campanas", name: "Campañas Personalizadas", enabled: true },
            "consultas": { id: "consultas", name: "Consultas Comerciales", enabled: true },
            "categorias": { id: "categorias", name: "Limitar Categorías", enabled: true, maxLimit: 1 },
            "herramientas_graficas": { id: "herramientas_graficas", name: "Herramientas Gráficas", enabled: false },
            "cursos_ia": { id: "cursos_ia", name: "Cursos I.A.", enabled: false },
            "captacion_leads": { id: "captacion_leads", name: "Captación de Leads", enabled: false },
            "soporte_tecnico": { id: "soporte_tecnico", name: "Soporte Técnico Premium", enabled: false },
            "chatbot_ia": { id: "chatbot_ia", name: "Asistente Chatbot", enabled: false },
            "landing_page": { id: "landing_page", name: "Landing Page", enabled: false },
            "edicion_graficos": { id: "edicion_graficos", name: "Edición de Gráficos VIP", enabled: false },
            "edicion_textos": { id: "edicion_textos", name: "Edición de Textos VIP", enabled: false },
            "presentaciones_online": { id: "presentaciones_online", name: "Presentaciones Online", enabled: false },
            "soporte_whatsapp": { id: "soporte_whatsapp", name: "Soporte por WhatsApp", enabled: false },
            "soporte_individual": { id: "soporte_individual", name: "Soporte Individual (No IA)", enabled: false },
            "scanner_cobro": { id: "scanner_cobro", name: "Scanner de Cobro QR", enabled: true },
            "dual_wallet": { id: "dual_wallet", name: "Dual-Wallet Financiera", enabled: true }
        }
    },
    {
        id: 'minorista', name: 'Minorista', description: 'Comerciantes con todas las herramientas de venta.',
        fichas: {
            "idiomas": { id: "idiomas", name: "Traducción de Idiomas", enabled: true, maxLimit: 12 },
            "banner_flotante": { id: "banner_flotante", name: "Banner Flotante", enabled: true },
            "cupones": { id: "cupones", name: "Editor de Cupones", enabled: true, maxLimit: 20 },
            "productos": { id: "productos", name: "Gestión de Productos", enabled: true, maxLimit: 300 },
            "estadisticas": { id: "estadisticas", name: "Estadísticas Reales", enabled: true, maxLimit: 1 },
            "inteligencia_mercado": { id: "inteligencia_mercado", name: "Inteligencia de Mercado", enabled: true, maxLimit: 2 },
            "redes_sociales": { id: "redes_sociales", name: "Automatización Redes", enabled: true, maxLimit: 60 },
            "geomarketing": { id: "geomarketing", name: "Geomarketing", enabled: true },
            "campanas": { id: "campanas", name: "Campañas Personalizadas", enabled: true },
            "consultas": { id: "consultas", name: "Consultas Comerciales", enabled: true },
            "categorias": { id: "categorias", name: "Limitar Categorías", enabled: true, maxLimit: 4 },
            "herramientas_graficas": { id: "herramientas_graficas", name: "Herramientas Gráficas", enabled: true },
            "cursos_ia": { id: "cursos_ia", name: "Cursos I.A.", enabled: true, maxLimit: 4 },
            "captacion_leads": { id: "captacion_leads", name: "Captación de Leads", enabled: true },
            "soporte_tecnico": { id: "soporte_tecnico", name: "Soporte Técnico Premium", enabled: true },
            "chatbot_ia": { id: "chatbot_ia", name: "Asistente Chatbot", enabled: true },
            "landing_page": { id: "landing_page", name: "Landing Page", enabled: true },
            "edicion_graficos": { id: "edicion_graficos", name: "Edición de Gráficos VIP", enabled: false },
            "edicion_textos": { id: "edicion_textos", name: "Edición de Textos VIP", enabled: false },
            "presentaciones_online": { id: "presentaciones_online", name: "Presentaciones Online", enabled: false },
            "soporte_whatsapp": { id: "soporte_whatsapp", name: "Soporte por WhatsApp", enabled: false },
            "soporte_individual": { id: "soporte_individual", name: "Soporte Individual (No IA)", enabled: false },
            "scanner_cobro": { id: "scanner_cobro", name: "Scanner de Cobro QR", enabled: true },
            "dual_wallet": { id: "dual_wallet", name: "Dual-Wallet Financiera", enabled: true }
        }
    },
    {
        id: 'premium', name: 'Premium', description: 'Acceso total indiscutible, sin límites y con visibilidad top.',
        fichas: {
            "idiomas": { id: "idiomas", name: "Traducción de Idiomas", enabled: true, maxLimit: 99 },
            "banner_flotante": { id: "banner_flotante", name: "Banner Flotante", enabled: true },
            "cupones": { id: "cupones", name: "Editor de Cupones", enabled: true, maxLimit: 999 },
            "productos": { id: "productos", name: "Gestión de Productos", enabled: true, maxLimit: 600 },
            "estadisticas": { id: "estadisticas", name: "Estadísticas Reales", enabled: true, maxLimit: 2 },
            "inteligencia_mercado": { id: "inteligencia_mercado", name: "Inteligencia de Mercado", enabled: true, maxLimit: 2 },
            "redes_sociales": { id: "redes_sociales", name: "Automatización Redes", enabled: true, maxLimit: 120 },
            "geomarketing": { id: "geomarketing", name: "Geomarketing", enabled: true },
            "campanas": { id: "campanas", name: "Campañas Personalizadas", enabled: true },
            "consultas": { id: "consultas", name: "Consultas Comerciales", enabled: true },
            "categorias": { id: "categorias", name: "Limitar Categorías", enabled: true, maxLimit: 14 },
            "herramientas_graficas": { id: "herramientas_graficas", name: "Herramientas Gráficas", enabled: true },
            "cursos_ia": { id: "cursos_ia", name: "Cursos I.A.", enabled: true, maxLimit: 12 },
            "captacion_leads": { id: "captacion_leads", name: "Registro Personalizado", enabled: true },
            "soporte_tecnico": { id: "soporte_tecnico", name: "Soporte Técnico Premium", enabled: true },
            "chatbot_ia": { id: "chatbot_ia", name: "Asistente Chatbot Personalizado", enabled: true },
            "landing_page": { id: "landing_page", name: "Landing Page Premium", enabled: true },
            "edicion_graficos": { id: "edicion_graficos", name: "Edición de Gráficos VIP", enabled: true },
            "edicion_textos": { id: "edicion_textos", name: "Edición de Textos VIP", enabled: true },
            "presentaciones_online": { id: "presentaciones_online", name: "Presentaciones Online", enabled: true, maxLimit: 6 },
            "soporte_whatsapp": { id: "soporte_whatsapp", name: "Soporte por WhatsApp", enabled: true },
            "soporte_individual": { id: "soporte_individual", name: "Soporte Individual (No IA)", enabled: true },
            "scanner_cobro": { id: "scanner_cobro", name: "Scanner de Cobro QR", enabled: true },
            "dual_wallet": { id: "dual_wallet", name: "Dual-Wallet Financiera", enabled: true }
        }
    }
];

const getIconForModule = (id: string) => {
    switch (id) {
        case 'basico': return <Shield className="w-8 h-8 text-slate-500" />;
        case 'banner': return <LayoutTemplate className="w-8 h-8 text-pink-500" />;
        case 'starter': return <Briefcase className="w-8 h-8 text-blue-500" />;
        case 'minorista': return <Award className="w-8 h-8 text-emerald-500" />;
        case 'premium': return <Star className="w-8 h-8 text-amber-500" />;
        default: return <Settings className="w-8 h-8 text-slate-500" />;
    }
};

export default function PanelEmpresarialPage() {
    useAuthGuard(['admin', 'superadmin', 'team_office'], 'manage_modules');
    const router = useRouter();
    const { toast } = useToast();
    const db = getFirestore(app);

    const [modules, setModules] = useState<SystemModuleConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const modulesCol = collection(db, 'system_modules');
                const snapshot = await getDocs(modulesCol);
                
                if (snapshot.empty) {
                    // Seed initial data si no existe (Run once)
                    console.log("Seeding system_modules collection...");
                    for (const mod of DEFAULT_MODULES) {
                        await setDoc(doc(modulesCol, mod.id), mod);
                    }
                    setModules(DEFAULT_MODULES);
                } else {
                    const loadedModules: SystemModuleConfig[] = [];
                    for (const docSnap of snapshot.docs) {
                        const dbData = docSnap.data() as SystemModuleConfig;
                        const defMod = DEFAULT_MODULES.find(m => m.id === dbData.id);
                        let needsUpdate = false;

                        if (defMod) {
                            if (!dbData.fichas) dbData.fichas = {};
                            for (const [fKey, fVal] of Object.entries(defMod.fichas)) {
                                // If a feature doesn't exist in DB, or we want to ensure new limits are applied for new features:
                                if (!dbData.fichas[fKey]) {
                                    dbData.fichas[fKey] = fVal;
                                    needsUpdate = true;
                                }
                            }
                        }

                        if (needsUpdate) {
                            await setDoc(doc(modulesCol, dbData.id), dbData, { merge: true });
                        }

                        loadedModules.push(dbData);
                    }
                    
                    // Asegurarnos de ordenar como queremos [básico, banner, starter, minorista, premium]
                    const order = ['basico', 'banner', 'starter', 'minorista', 'premium'];
                    loadedModules.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

                    setModules(loadedModules);
                }
            } catch (error: any) {
                console.error("Error fetching rules:", error);
                toast({ title: 'Error', description: 'No se pudieron cargar los módulos maestros.', variant: 'destructive' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchModules();
    }, [db, toast]);

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50">
                <main className="container p-8 mx-auto mt-8 flex-grow">
                    <Skeleton className="h-10 w-1/3 mb-8" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <main className="container p-4 md:p-8 mx-auto flex-grow max-w-7xl animate-in fade-in zoom-in duration-500">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-2xl border shadow-lg mb-8 text-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight flex items-center">
                                <Settings className="w-8 h-8 mr-3 text-primary animate-spin-slow" />
                                Panel de Control Empresarial
                            </h1>
                            <p className="text-slate-300 mt-2 text-lg max-w-2xl">
                                Centro Maestro de Gobernanza. Modifica las fichas y límites de tus 5 Módulos. Los cambios aquí aplicarán en cascada e instantáneamente a toda la base de clientes.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {modules.map((mod) => {
                        // Calcular cuantas fichas están habilitadas
                        const fichasActivas = Object.values(mod.fichas || {}).filter(f => f.enabled).length;
                        const totalFichas = Object.values(mod.fichas || {}).length;

                        return (
                            <Card key={mod.id} className="flex flex-col hover:shadow-xl transition-all border-t-4 border-t-primary bg-white">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="p-3 bg-slate-100 rounded-xl">
                                            {getIconForModule(mod.id)}
                                        </div>
                                        <Badge variant="outline" className="text-xs uppercase tracking-widest bg-slate-50">
                                            {mod.id}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-2xl mt-4 text-slate-900">Módulo {mod.name}</CardTitle>
                                    <CardDescription className="text-sm mt-1 h-10">
                                        {mod.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="space-y-3 mt-2">
                                        <div className="flex items-center justify-between text-sm py-2 border-b border-dashed border-slate-200">
                                            <span className="text-slate-500 font-medium">Fichas Activas</span>
                                            <Badge variant={fichasActivas === 0 ? "secondary" : "default"} className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                                {fichasActivas} / {totalFichas}
                                            </Badge>
                                        </div>
                                        
                                        {/* Vista rápida de Fichas (Max 6 para preview) */}
                                        <div className="flex flex-col gap-2 mt-4">
                                            {Object.values(mod.fichas || {}).slice(0,6).map(ficha => (
                                                <div key={ficha.id} className="flex items-center text-xs text-slate-600 bg-slate-50 p-2 rounded-md">
                                                    <div className={`w-2 h-2 rounded-full mr-2 ${ficha.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                    <span className="flex-grow truncate">{ficha.name}</span>
                                                    {ficha.maxLimit !== undefined && ficha.enabled && (
                                                        <span className="font-bold text-slate-800 ml-2">Lim: {ficha.maxLimit}</span>
                                                    )}
                                                </div>
                                            ))}
                                            {totalFichas > 6 && (
                                                <div className="text-center text-xs text-slate-400 mt-1 italic">
                                                    + {totalFichas - 6} fichas más...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-4 border-t bg-slate-50/50 rounded-b-xl">
                                    <Button 
                                        className="w-full flex items-center justify-center font-bold" 
                                        size="lg"
                                        asChild
                                    >
                                        <Link href={`/admin/dashboard-empresarial/edit/${mod.id}`}>
                                            <PenTool className="w-4 h-4 mr-2" />
                                            Gobernar Módulo
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
