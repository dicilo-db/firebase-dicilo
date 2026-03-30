'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Settings, Lock, CheckCircle, Store, Tags, BarChart, Ticket, Globe, MessageSquare, Bot, Wallet, LayoutTemplate, ScanLine } from 'lucide-react';
import { Header } from '@/components/header';
import Footer from '@/components/footer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdStatistics } from '@/components/dashboard/AdStatistics';
import { ClientCouponManager } from '@/components/dashboard/ClientCouponManager';

// Interfaces for Modules
type ModuleId = 'general' | 'marquee' | 'landing_body' | 'info_cards' | 'graphics' | 'products' | 'coupons' | 'stats' | 'forms' | 'ai_marketing' | 'wallet' | 'scanner_cobro';

interface ModuleDef {
    id: ModuleId;
    title: string;
    description: string;
    icon: React.ElementType;
    minPlan: 'basic' | 'retailer' | 'premium';
    color: string;
}

const MODULES: ModuleDef[] = [
    { id: 'general', title: 'Información General', description: 'Datos básicos, logo y contacto de la empresa.', icon: Store, minPlan: 'basic', color: 'bg-blue-50 text-blue-600' },
    { id: 'marquee', title: 'Marquesina Dinámica', description: 'Cinta rotativa con ofertas, temporalidad y enlaces.', icon: ArrowLeft, minPlan: 'retailer', color: 'bg-emerald-50 text-emerald-600' },
    { id: 'landing_body', title: 'Cuerpo (Landing)', description: 'Diseño principal, botones de acción y multimedia.', icon: LayoutTemplate, minPlan: 'retailer', color: 'bg-indigo-50 text-indigo-600' },
    { id: 'info_cards', title: 'Tarjetas de Información', description: 'Información estructurada en tarjetas (FAQs, Servicios).', icon: Settings, minPlan: 'retailer', color: 'bg-orange-50 text-orange-600' },
    { id: 'products', title: 'Gestor de Productos', description: 'Catálogo de productos y lista de precios.', icon: Tags, minPlan: 'retailer', color: 'bg-purple-50 text-purple-600' },
    { id: 'graphics', title: 'Gráficos Promocionales', description: 'Banners adicionales y gráficos de campaña.', icon: Globe, minPlan: 'premium', color: 'bg-teal-50 text-teal-600' },
    { id: 'coupons', title: 'Gestor de Cupones', description: 'Creación y validación de cupones de descuento.', icon: Ticket, minPlan: 'premium', color: 'bg-pink-50 text-pink-600' },
    { id: 'forms', title: 'Formularios Custom', description: 'Recepción de leads y encuestas.', icon: MessageSquare, minPlan: 'premium', color: 'bg-amber-50 text-amber-600' },
    { id: 'stats', title: 'Estadísticas Ads', description: 'Rendimiento de los anuncios y clics.', icon: BarChart, minPlan: 'premium', color: 'bg-slate-100 text-slate-700' },
    { id: 'ai_marketing', title: 'Marketing de IA (DiciBot)', description: 'Automatización y conocimiento base del agente IA.', icon: Bot, minPlan: 'premium', color: 'bg-blue-100 text-blue-800' },
    { id: 'wallet', title: 'Billetera Virtual', description: 'Gestión financiera, recargas y retiros.', icon: Wallet, minPlan: 'basic', color: 'bg-green-100 text-green-700' },
    { id: 'scanner_cobro', title: 'Scanner QR Terminal', description: 'Punto de cobro para procesar pagos de usuarios con Dicipoints.', icon: ScanLine, minPlan: 'retailer', color: 'bg-indigo-100 text-indigo-700' },
];

export default function ClientModulesDashboard() {
    useAuthGuard(['admin', 'superadmin', 'team_office'], 'manage_client_modules');
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const db = getFirestore(app);

    const [clientData, setClientData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeModule, setActiveModule] = useState<ModuleId | null>(null);

    useEffect(() => {
        const fetchClient = async () => {
            if (!params.id) return;
            const docRef = doc(db, 'clients', params.id as string);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Ensure overrides map exists
                if (!data.module_overrides) {
                    data.module_overrides = {};
                }
                setClientData({ id: docSnap.id, ...data });
            } else {
                toast({ title: 'Error', description: 'Cliente no encontrado', variant: 'destructive' });
                router.push('/admin/dashboard');
            }
            setIsLoading(false);
        };
        fetchClient();
    }, [params.id, db, router, toast]);

    const handleToggleOverride = async (moduleId: ModuleId, currentValue: boolean) => {
        setIsSaving(true);
        try {
            const docRef = doc(db, 'clients', clientData.id);
            const newOverrides = { ...clientData.module_overrides, [moduleId]: !currentValue };
            await updateDoc(docRef, { module_overrides: newOverrides });
            
            setClientData((prev: any) => ({
                ...prev,
                module_overrides: newOverrides
            }));

            toast({ title: 'Éxito', description: 'Override guardado correctamente.' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const hasAccess = (mod: ModuleDef) => {
        // SuperAdmin Override Check
        if (clientData?.module_overrides?.[mod.id] === true) return true;
        if (clientData?.module_overrides?.[mod.id] === false) return false;

        // Plan Logic based on `clientType` (starter = retailer logic usually, basic = private/donor)
        const type = String(clientData?.clientType || 'basic').toLowerCase();
        
        if (mod.minPlan === 'basic') return true;
        if (mod.minPlan === 'retailer' && (type === 'retailer' || type === 'starter' || type === 'premium')) return true;
        if (mod.minPlan === 'premium' && type === 'premium') return true;

        return false;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50">
                <Header />
                <main className="container p-8 mx-auto mt-8 flex-grow">
                    <Skeleton className="h-10 w-1/3 mb-8" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Header />
            <main className="container p-4 md:p-8 mx-auto flex-grow max-w-7xl animate-in fade-in zoom-in duration-500">
                <div className="flex items-center justify-between mb-2">
                    <Button variant="ghost" onClick={() => router.push('/admin/dashboard')} className="mb-2">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Super Dashboard
                    </Button>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 border-l-4 border-primary pl-4">
                            Panel Modular de Control
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm pl-4">
                            Empresa: <strong className="text-slate-800">{clientData.clientName}</strong> | 
                            Plan Actual: <Badge variant="outline" className="ml-2 uppercase">{clientData.clientType || 'Básico'}</Badge>
                        </p>
                    </div>
                    <div>
                        {/* Botón temporal de compatibilidad: ir al formulario clásico */}
                        <Button onClick={() => router.push(`/admin/clients/${clientData.id}/edit`)} variant="outline">
                            Ver Formulario Clásico Completo
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {MODULES.map((mod) => {
                        const Icon = mod.icon;
                        const isGrantedByPlan = hasAccess(mod);
                        const isForced = clientData.module_overrides?.[mod.id] === true;
                        const isDenied = clientData.module_overrides?.[mod.id] === false;
                        
                        // Si está denegado a la fuerza, es override negativo. Si está forzado positivo, es override positivo.
                        const active = isGrantedByPlan;

                        return (
                            <Card key={mod.id} className={`flex flex-col transition-all hover:shadow-md border-t-4 ${active ? 'border-primary' : 'border-slate-200 bg-slate-50/50 grayscale-[50%]'}`}>
                                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                                    <div className={`p-2 rounded-lg ${active ? mod.color : 'bg-slate-200 text-slate-500'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {active ? (
                                            <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none shadow-none text-xs">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Activo
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-rose-200 text-xs">
                                                <Lock className="w-3 h-3 mr-1" /> Bloqueado
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <CardTitle className={`text-lg mb-2 ${!active && 'text-slate-500'}`}>{mod.title}</CardTitle>
                                    <CardDescription className="text-xs leading-relaxed">
                                        {mod.description}
                                    </CardDescription>
                                </CardContent>
                                <CardFooter className="pt-2 pb-4 bg-slate-50/50 rounded-b-xl border-t flex flex-col items-start gap-4">
                                    
                                    {/* Action Button */}
                                    <Button 
                                        className="w-full" 
                                        variant={active ? "default" : "secondary"}
                                        disabled={!active}
                                        onClick={() => {
                                            setActiveModule(mod.id);
                                        }}
                                    >
                                        <Settings className="w-4 h-4 mr-2" /> 
                                        {active ? 'Gestionar Módulo' : 'Plan Insuficiente'}
                                    </Button>

                                    {/* SuperAdmin Override */}
                                    <div className="flex w-full items-center justify-between pt-2 border-t border-slate-200/50">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Forzar Activación</span>
                                        <Switch 
                                            disabled={isSaving}
                                            checked={isForced || (isGrantedByPlan && !isDenied)}
                                            onCheckedChange={() => handleToggleOverride(mod.id, isForced || (isGrantedByPlan && !isDenied))} 
                                            className="scale-75 origin-right"
                                        />
                                    </div>

                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
                
                <Dialog open={!!activeModule} onOpenChange={(open) => !open && setActiveModule(null)}>
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                {activeModule ? MODULES.find(m => m.id === activeModule)?.title : ''}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                            {activeModule === 'coupons' && <ClientCouponManager companyId={clientData.id} companyName={clientData.clientName || clientData.name || 'Empresa Local'} category={clientData.category || 'General'} />}
                            {activeModule === 'stats' && <AdStatistics adId={clientData.id} />}
                            {activeModule !== 'coupons' && activeModule !== 'stats' && (
                                <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-50 text-slate-400 animate-spin-slow" />
                                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Módulo en Migración</h3>
                                    <p>Este módulo está siendo separado a la nueva arquitectura Ficha Técnica.</p>
                                    <p className="mt-2 text-sm text-slate-400">Por ahora, utiliza el <button onClick={() => { setActiveModule(null); router.push(`/admin/clients/${clientData.id}/edit`); }} className="text-primary hover:underline">Formulario Clásico Completo</button> para modificarlo.</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </main>
            <Footer />
        </div>
    );
}
