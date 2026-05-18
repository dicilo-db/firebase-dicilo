'use client';

import React from 'react';
import { CouponManager } from '@/components/business/CouponManager';

export default function BusinessCouponsPage() {
    // Mock company ID for now. In a real scenario, this comes from auth context.
    const MOCK_COMPANY_ID = 'test-company-123';

    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Gestor de Cupones</h1>
                <p className="text-muted-foreground mt-2">
                    Crea y administra los cupones promocionales de tu empresa. Atrae más clientes con ofertas exclusivas.
                </p>
            </div>
            
            <div className="max-w-4xl">
                <CouponManager companyId={MOCK_COMPANY_ID} />
            </div>
        </div>
    );
}
