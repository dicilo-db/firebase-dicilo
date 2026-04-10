'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, Shield, LayoutTemplate, Briefcase, Award, Star, ListPlus, RotateCcw } from 'lucide-react';
import { SystemModuleConfig, FichaConfig } from '../../page';

const getIconForModule = (id: string) => {
    switch (id) {
        case 'basico': return <Shield className="w-6 h-6 text-slate-500" />;
        case 'banner': return <LayoutTemplate className="w-6 h-6 text-pink-500" />;
        case 'starter': return <Briefcase className="w-6 h-6 text-blue-500" />;
        case 'minorista': return <Award className="w-6 h-6 text-emerald-500" />;
        case 'premium': return <Star className="w-6 h-6 text-amber-500" />;
        default: return <Shield className="w-6 h-6 text-slate-500" />;
    }
};

export default function ModuleEditorPage() {
    useAuthGuard(['admin', 'superadmin', 'team_office'], 'manage_modules');
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const db = getFirestore(app);

    const [moduleData, setModuleData] = useState<SystemModuleConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchModule = async () => {
            if (!params?.id) return;
            const moduleId = params.id as string;
            
            try {
                const docRef = doc(db, 'system_modules', moduleId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const dbData = { id: docSnap.id, ...docSnap.data() } as SystemModuleConfig;
                    // Merge with DEFAULT_MODULES to ensure any new fichas or limit changes are shown to the admin immediately
                    const { DEFAULT_MODULES } = await import('../../page');
                    const defModule = DEFAULT_MODULES.find(m => m.id === dbData.id);
                    if (defModule) {
                        for (const [key, val] of Object.entries(defModule.fichas)) {
                            if (!dbData.fichas[key]) {
                                // Add entirely new feature
                                dbData.fichas[key] = val;
                            } else {
                                // Keep DB's limit, name, and enabled state, but ensure structure is correct
                                dbData.fichas[key] = {
                                    ...val,
                                    name: val.name, // Force update name to the newest one
                                    enabled: dbData.fichas[key].enabled,
                                    maxLimit: dbData.fichas[key].maxLimit !== undefined 
                                        ? dbData.fichas[key].maxLimit 
                                        : val.maxLimit
                                };
                            }
                        }
                    }
                    setModuleData(dbData);
                } else {
                    console.log(`Module ${moduleId} not found, checking if we can autoseed or redirect...`);
                    // Intentamos sembrar el modulo ausente si es uno de los defaults
                    const { DEFAULT_MODULES } = await import('../../page');
                    const defModule = DEFAULT_MODULES.find(m => m.id === moduleId);
                    if (defModule) {
                        try {
                            const { setDoc } = await import('firebase/firestore');
                            await setDoc(docRef, defModule);
                            setModuleData(defModule);
                            toast({ title: 'Módulo Sancionado', description: 'Se ha restaurado la plantilla base para ' + moduleId });
                        } catch(e) {
                            console.error('Failed to autoseed', e);
                            router.replace('/admin/dashboard-empresarial');
                        }
                    } else {
                        toast({ title: 'Error', description: 'Módulo maestro no encontrado o erróneo ('+moduleId+')', variant: 'destructive' });
                        router.replace('/admin/dashboard-empresarial');
                    }
                }
            } catch(e) {
                console.error('Fetch Module error: ', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchModule();
    }, [params?.id, db, router, toast]);

    const handleSave = async () => {
        if (!moduleData) return;
        setIsSaving(true);
        try {
            const docRef = doc(db, 'system_modules', moduleData.id);
            await updateDoc(docRef, {
                fichas: moduleData.fichas
            });
            toast({ title: 'Gobernanza Actualizada', description: `Las reglas del Módulo ${moduleData.name} se han propagado exitosamente a todos sus clientes.` });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleFicha = (fichaId: string) => {
        if(!moduleData) return;
        setModuleData(prev => {
            if(!prev) return prev;
            return {
                ...prev,
                fichas: {
                    ...prev.fichas,
                    [fichaId]: {
                        ...prev.fichas[fichaId],
                        enabled: !prev.fichas[fichaId].enabled
                    }
                }
            };
        });
    };

    const updateFichaLimit = (fichaId: string, limitStr: string) => {
        if(!moduleData) return;
        const limit = parseInt(limitStr, 10);
        setModuleData(prev => {
            if(!prev) return prev;
            return {
                ...prev,
                fichas: {
                    ...prev.fichas,
                    [fichaId]: {
                        ...prev.fichas[fichaId],
                        maxLimit: isNaN(limit) ? undefined : limit
                    }
                }
            };
        });
    };

    if (isLoading || !moduleData) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50">
                <main className="container p-8 mx-auto mt-8 flex-grow">
                    <Skeleton className="h-10 w-1/3 mb-8" />
                    <Skeleton className="h-96 w-full rounded-xl" />
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <main className="container p-4 md:p-8 mx-auto flex-grow max-w-4xl animate-in fade-in zoom-in duration-500">
                <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" onClick={() => router.push('/admin/dashboard-empresarial')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Gestor Maestro
                    </Button>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            {getIconForModule(moduleData.id)}
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Módulo: {moduleData.name}
                        </h1>
                    </div>
                    <p className="text-slate-500 mt-1 max-w-2xl pl-12 text-sm">
                        Estás modificando los recursos y límites para <strong>todos los clientes</strong> que posean la membresía <strong>{moduleData.name}</strong>. Al guardar, las nuevas reglas aparecerán en sus Dashboards instantáneamente.
                    </p>
                </div>

                <Card className="border-t-4 border-t-primary shadow-lg">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <CardTitle className="text-xl flex items-center">
                            <ListPlus className="w-5 h-5 mr-2 text-primary" />
                            Gestión de Fichas (Features)
                        </CardTitle>
                        <CardDescription>
                            Habilita o deshabilita los componentes que armarán el formulario de perfil del cliente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {Object.values(moduleData.fichas || {}).map(ficha => (
                                <div key={ficha.id} className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${!ficha.enabled ? 'bg-slate-50/50' : 'bg-white'}`}>
                                    <div className="flex-1">
                                        <h3 className={`text-lg font-bold flex items-center ${ficha.enabled ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {ficha.name}
                                            {ficha.enabled && <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-widest">Activo</span>}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Identificador interno: <code className="bg-slate-100 px-1 rounded text-slate-600">{ficha.id}</code>
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-6 justify-between sm:justify-end border-t sm:border-0 pt-4 sm:pt-0">
                                        {/* Límite Numérico (Si la ficha tiene un maxLimit predefinido o lógico) */}
                                        {['idiomas', 'cupones', 'productos'].includes(ficha.id) && (
                                            <div className={`flex items-center gap-2 ${!ficha.enabled && 'opacity-50 pointer-events-none'}`}>
                                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Límite:</span>
                                                <Input 
                                                    type="number" 
                                                    className="w-20 text-center font-bold"
                                                    value={ficha.maxLimit || ''}
                                                    onChange={(e) => updateFichaLimit(ficha.id, e.target.value)}
                                                    placeholder="∞"
                                                />
                                            </div>
                                        )}

                                        <Switch 
                                            checked={ficha.enabled}
                                            onCheckedChange={() => toggleFicha(ficha.id)}
                                            className="scale-125 origin-right"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-slate-500 text-center md:text-left">
                            Los cambios afectarán a todos los perfiles <strong className="text-slate-700">{moduleData.name}</strong> al recargar.
                        </div>
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline" 
                                className="text-slate-600 hover:text-slate-900 border-slate-300 bg-white shadow-sm"
                                onClick={async () => {
                                    const { DEFAULT_MODULES } = await import('../../page');
                                    const defModule = DEFAULT_MODULES.find(m => m.id === moduleData.id);
                                    if(defModule) {
                                        setModuleData(prev => prev ? {...prev, fichas: defModule.fichas} : prev);
                                        toast({ title: 'Valores Recargados', description: 'Se han cargado las fichas por defecto. Presiona Guardar para aplicar.', variant: 'default' });
                                    }
                                }}
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Cargar Predeterminados
                            </Button>
                            <Button 
                                size="lg" 
                                className="font-bold tracking-wide shadow-md hover:shadow-lg transition-all"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                Guardar Fichas
                            </Button>
                        </div>
                    </CardFooter>
                </Card>

            </main>
        </div>
    );
}
