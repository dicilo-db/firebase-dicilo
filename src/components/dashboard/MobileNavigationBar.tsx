'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
    Home, 
    Share2, 
    Wallet, 
    Briefcase, 
    Users, 
    Settings, 
    Scan, 
    BarChart3, 
    Database,
    Bot,
    Cookie
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavigationBarProps {
    userData: any;
    currentView: string;
    onViewChange: (view: string) => void;
}

export function MobileNavigationBar({ userData, currentView, onViewChange }: MobileNavigationBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const role = userData?.role || (userData?.isFreelancer ? 'freelancer' : 'user');
    const permissions = userData?.permissions || [];
    const isFreelancerOrHigher = ['freelancer', 'team_leader', 'team_office', 'admin', 'superadmin'].includes(role) || permissions.includes('freelancer_tool');

    // Detect active tab under freelancer view
    const currentTab = searchParams?.get('tab') || 'dashboard';

    // Check if we are in the freelancer sub-dashboard context
    const isFreelancerContext = currentView === 'freelancer' || currentView === 'scanner';

    const handleFreelancerTab = (tab: string) => {
        onViewChange('freelancer');
        router.push(`?view=freelancer&tab=${tab}`);
    };

    if (isFreelancerContext) {
        // Freelancer Context Tabs
        return (
            <div className="mobile-nav-bar fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t bg-white shadow-lg md:hidden">
                {/* Inicio / Freelancer Dashboard Home */}
                <button
                    onClick={() => handleFreelancerTab('dashboard')}
                    className={cn(
                        "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors",
                        (currentView === 'freelancer' && currentTab === 'dashboard') ? "text-primary font-bold" : "text-slate-500"
                    )}
                >
                    <Home className="h-5 w-5 mb-0.5" />
                    <span>Inicio</span>
                </button>

                {/* Campañas */}
                <button
                    onClick={() => handleFreelancerTab('all_campaigns')}
                    className={cn(
                        "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors",
                        (currentView === 'freelancer' && currentTab === 'all_campaigns') ? "text-primary font-bold" : "text-slate-500"
                    )}
                >
                    <Briefcase className="h-5 w-5 mb-0.5" />
                    <span>Campañas</span>
                </button>

                {/* Floating QR Scanner (Scanner Pro) */}
                <div className="flex-1 flex justify-center -mt-6">
                    <button
                        onClick={() => onViewChange('scanner')}
                        className={cn(
                            "flex h-14 w-14 items-center justify-center rounded-full shadow-md border-4 border-white transition-all transform active:scale-95",
                            currentView === 'scanner' 
                                ? "bg-emerald-600 text-white" 
                                : "bg-primary text-white hover:bg-primary/95"
                        )}
                    >
                        <Scan className="h-6 w-6 animate-pulse" />
                    </button>
                </div>

                {/* Estadísticas */}
                <button
                    onClick={() => handleFreelancerTab('statistics')}
                    className={cn(
                        "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors",
                        (currentView === 'freelancer' && currentTab === 'statistics') ? "text-primary font-bold" : "text-slate-500"
                    )}
                >
                    <BarChart3 className="h-5 w-5 mb-0.5" />
                    <span>Métricas</span>
                </button>

                {/* Registros P2 */}
                <button
                    onClick={() => handleFreelancerTab('p2_records')}
                    className={cn(
                        "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors",
                        (currentView === 'freelancer' && currentTab === 'p2_records') ? "text-primary font-bold" : "text-slate-500"
                    )}
                >
                    <Database className="h-5 w-5 mb-0.5" />
                    <span>Registros</span>
                </button>
            </div>
        );
    }

    // General B2B Client Dashboard Tabs
    return (
        <div className="mobile-nav-bar fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t bg-white shadow-lg md:hidden pb-[safe-area-inset-bottom] h-16">
            {/* Inicio B2B */}
            <button
                onClick={() => onViewChange('overview')}
                className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] transition-colors",
                    currentView === 'overview' ? "text-primary font-bold" : "text-slate-500"
                )}
            >
                <Home className="h-5 w-5 mb-0.5" />
                <span>Inicio</span>
            </button>

            {/* Red / Comunidad (Mapped to my-network) */}
            <button
                onClick={() => onViewChange('my-network')}
                className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] transition-colors",
                    currentView === 'my-network' ? "text-primary font-bold" : "text-slate-500"
                )}
            >
                <Share2 className="h-5 w-5 mb-0.5" />
                <span>Tu Red</span>
            </button>

            {/* Floating DiciBot Chat */}
            <div className="flex-1 flex flex-col items-center justify-center -mt-5">
                <button
                    onClick={() => window.dispatchEvent(new Event('open-dicibot'))}
                    className="flex h-12 w-12 items-center justify-center rounded-full shadow-md border-2 border-white transition-all transform active:scale-95 bg-[#8cc63f] text-white"
                >
                    <Bot className="h-6 w-6" />
                </button>
                <span className="text-[9px] text-slate-500 mt-0.5 font-medium">DiciBot</span>
            </div>

            {/* Wallet */}
            <button
                onClick={() => onViewChange('wallet')}
                className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] transition-colors",
                    currentView === 'wallet' ? "text-primary font-bold" : "text-slate-500"
                )}
            >
                <Wallet className="h-5 w-5 mb-0.5" />
                <span>Wallet</span>
            </button>

            {/* Cookies */}
            <button
                onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] transition-colors",
                    "text-slate-500 hover:text-primary"
                )}
            >
                <Cookie className="h-5 w-5 mb-0.5" />
                <span>Cookies</span>
            </button>

            {/* Perfil / Settings */}
            <button
                onClick={() => onViewChange('settings')}
                className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] transition-colors",
                    currentView === 'settings' ? "text-primary font-bold" : "text-slate-500"
                )}
            >
                <Settings className="h-5 w-5 mb-0.5" />
                <span>Ajustes</span>
            </button>
        </div>
    );
}
