'use client';

import React from 'react';
import { ProductManager } from '@/components/business/ProductManager';

export default function BusinessProductsPage() {
    // Mock company ID for now. In a real scenario, this comes from auth context.
    const MOCK_COMPANY_ID = 'test-company-123';

    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Gestor de Productos</h1>
                <p className="text-muted-foreground mt-2">
                    Administra tu catálogo de productos. Los límites dependen de tu plan actual.
                </p>
            </div>
            
            <div className="max-w-4xl">
                <ProductManager companyId={MOCK_COMPANY_ID} />
            </div>
        </div>
    );
}
