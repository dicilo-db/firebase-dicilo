'use client';

import React from 'react';
import { ProductManager } from '@/components/business/ProductManager';
import { useBusinessAuth } from '@/components/business/BusinessAuthProvider';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BusinessProductsPage() {
    const { companyId, isLoading } = useBusinessAuth();

    if (isLoading) return null;

    if (!companyId) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center animate-in fade-in">
                <AlertCircle className="w-16 h-16 text-amber-500" />
                <h2 className="text-2xl font-bold">Perfil Requerido</h2>
                <p className="text-muted-foreground max-w-md">Debes crear tu perfil de empresa antes de gestionar productos.</p>
                <Button asChild className="mt-4"><Link href="/business/profile">Crear Empresa</Link></Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Gestor de Productos</h1>
                <p className="text-muted-foreground mt-2">
                    Administra tu catálogo de productos. Los límites dependen de tu plan actual.
                </p>
            </div>
            
            <div className="max-w-4xl">
                <ProductManager companyId={companyId} />
            </div>
        </div>
    );
}
