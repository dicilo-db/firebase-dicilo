'use client';

import React from 'react';
import { BusinessRegistrationForm } from '@/components/business/BusinessRegistrationForm';

export default function BusinessProfilePage() {
    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Mi Perfil B2B</h1>
                <p className="text-muted-foreground mt-2">
                    Administra los detalles de tu empresa, tu plan comercial y las opciones de visibilidad.
                </p>
            </div>
            
            <div className="max-w-4xl">
                <BusinessRegistrationForm />
            </div>
        </div>
    );
}
