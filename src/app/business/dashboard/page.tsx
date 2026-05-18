'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfileCompletionWidget } from '@/components/business/ProfileCompletionWidget';
import Link from 'next/link';
import { Settings, Package, LayoutTemplate, MessageSquare, AlertCircle } from 'lucide-react';
import { useBusinessAuth } from '@/components/business/BusinessAuthProvider';

export default function BusinessDashboardPage() {
    const { companyProfile, isLoading } = useBusinessAuth();

    if (isLoading) return null; // Handled by layout/provider

    if (!companyProfile) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
                <AlertCircle className="w-16 h-16 text-amber-500" />
                <h2 className="text-2xl font-bold">Perfil de Empresa no Encontrado</h2>
                <p className="text-muted-foreground max-w-md">No tienes ninguna empresa registrada a tu nombre. Por favor, crea tu perfil comercial para empezar.</p>
                <Button asChild className="mt-4"><Link href="/business/profile">Crear Empresa</Link></Button>
            </div>
        );
    }

    const profileScore = companyProfile.profileCompletionScore || 0;
    const plan = companyProfile.plan || 'basic';
    
    return (
        <div className="space-y-8 animate-in fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Empresarial</h1>
                <p className="text-muted-foreground mt-2">Bienvenido a tu panel de control B2B.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Completion Widget */}
                <Card className="md:col-span-1 shadow-sm border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Estado del Perfil</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ProfileCompletionWidget score={profileScore} />
                        <div className="mt-4 flex justify-between items-center text-sm">
                            <span className="text-slate-500">Plan actual:</span>
                            <Badge variant="outline" className="font-semibold uppercase">{plan}</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="md:col-span-2 shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
                        <CardDescription>Gestiona tu presencia comercial</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
                            <Link href="/business/products">
                                <Package className="h-6 w-6 text-blue-500" />
                                <span>Añadir Producto</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
                            <Link href="/business/profile">
                                <Settings className="h-6 w-6 text-purple-500" />
                                <span>Completar Perfil</span>
                            </Link>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" disabled={profileScore < 85}>
                            <LayoutTemplate className="h-6 w-6 text-slate-400" />
                            <div className="flex flex-col items-center">
                                <span>Configurar Landing Page</span>
                                {profileScore < 85 && <span className="text-[10px] text-orange-500">(Requiere 85%)</span>}
                            </div>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
                            <Link href="/business/newsletter">
                                <MessageSquare className="h-6 w-6 text-green-500" />
                                <span>Enviar Newsletter</span>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
            
            {/* Recent Activity / Stats placeholder */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader>
                    <CardTitle className="text-lg">Rendimiento Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-40 flex items-center justify-center border border-dashed rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-500 text-sm">
                        Las estadísticas se activarán cuando tu perfil alcance el 85% y esté publicado.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Inline badge until we import the real one if it fails
function Badge({ children, className, variant = 'default' }: any) {
    return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>{children}</span>;
}
