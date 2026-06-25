'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Settings, LifeBuoy, LogOut, Coins, Shield, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { FreelancerSidebar } from './freelancer/FreelancerSidebar';
import { MobileHeader } from './MobileHeader';
import { MobileNavigationBar } from './MobileNavigationBar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
    userData: any;
    currentView: string;
    onViewChange: (view: string) => void;
    children: React.ReactNode;
    walletData?: any;
}

export function DashboardLayout({ userData, currentView, onViewChange, children, walletData }: DashboardLayoutProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { user } = useAuth();

    // Check if user is admin (simple check, or use useAuthGuard logic if available)
    // For now assuming userData might have role or we check checks
    const isAdmin = userData?.role === 'admin' || userData?.role === 'superadmin' || user?.email?.includes('dicilo.net'); // Basic check

    return (
        <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden border-r bg-white md:block">
                {currentView === 'freelancer' ? (
                    <FreelancerSidebar
                        currentView={currentView}
                        onViewChange={onViewChange}
                    />
                ) : (
                    <Sidebar
                        userData={userData}
                        currentView={currentView}
                        onViewChange={onViewChange}
                    />
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col min-h-screen">

                {/* Mobile Header (replaces standard header) */}
                <MobileHeader
                    userData={userData}
                    currentView={currentView}
                    onViewChange={onViewChange}
                />

                <main className={cn(
                    "flex-1 pb-20 md:pb-0",
                    (currentView === 'freelancer' || currentView === 'map' || currentView === 'calendar') ? "!p-0 !pb-20 md:!pb-0" : "px-3 py-6 sm:px-4 md:p-8"
                )}>
                    <div className={cn(
                        "mx-auto",
                        (currentView === 'freelancer' || currentView === 'map' || currentView === 'calendar') ? "!max-w-none !w-full animate-in fade-in duration-300" : "max-w-5xl"
                    )}>
                        {children}
                    </div>
                </main>

                {/* Mobile Bottom Tab Bar Navigation */}
                <MobileNavigationBar
                    userData={userData}
                    currentView={currentView}
                    onViewChange={onViewChange}
                />
            </div>
        </div>
    );
}
