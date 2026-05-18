'use client';

import React from 'react';
import { BusinessSidebar } from '@/components/business/BusinessSidebar';
import { BusinessAuthProvider, useBusinessAuth } from '@/components/business/BusinessAuthProvider';
import { AlertTriangle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ImpersonationBanner() {
    const { isImpersonating, companyProfile, exitImpersonation } = useBusinessAuth();
    
    if (!isImpersonating) return null;

    return (
        <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between shadow-md z-50 relative">
            <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span className="font-bold uppercase tracking-wider text-sm">Modo Dios Activo</span>
                <span className="text-sm border-l border-red-400 pl-2 ml-2">
                    Visualizando como: <strong className="bg-red-800 px-2 py-0.5 rounded">{companyProfile?.companyName}</strong>
                </span>
            </div>
            <Button size="sm" variant="outline" className="bg-white text-red-600 hover:bg-red-50 border-none" onClick={exitImpersonation}>
                <LogOut className="w-4 h-4 mr-2" />
                Salir
            </Button>
        </div>
    );
}

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
    return (
        <BusinessAuthProvider>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
                <ImpersonationBanner />
                <div className="flex flex-1">
                    <BusinessSidebar />
                    <main className="flex-1 min-w-0 p-4 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </BusinessAuthProvider>
    );
}
