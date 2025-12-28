'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Settings, LifeBuoy, LogOut, Coins, Shield, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { FreelancerSidebar } from './freelancer/FreelancerSidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
    userData: any;
    currentView: string;
    onViewChange: (view: string) => void;
    children: React.ReactNode;
}

export function DashboardLayout({ userData, currentView, onViewChange, children }: DashboardLayoutProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { signOut, user } = useAuth();

    // Check if user is admin (simple check, or use useAuthGuard logic if available)
    // For now assuming userData might have role or we check checks
    const isAdmin = userData?.role === 'admin' || userData?.role === 'superadmin' || user?.email?.includes('dicilo.net'); // Basic check

    return (
        <div className="flex h-screen bg-gray-50">
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
            <div className="flex flex-1 flex-col overflow-hidden">

                {/* Header (Visible on Desktop & Mobile) */}
                <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">

                    {/* Mobile Toggle & Logo */}
                    <div className="flex items-center gap-2 md:hidden">
                        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-64">
                                {currentView === 'freelancer' ? (
                                    <FreelancerSidebar
                                        currentView={currentView}
                                        onViewChange={(view) => {
                                            onViewChange(view);
                                            setIsMobileOpen(false);
                                        }}
                                        onMobileClose={() => setIsMobileOpen(false)}
                                    />
                                ) : (
                                    <Sidebar
                                        userData={userData}
                                        currentView={currentView}
                                        onViewChange={(view) => {
                                            onViewChange(view);
                                            setIsMobileOpen(false);
                                        }}
                                    />
                                )}
                            </SheetContent>
                        </Sheet>
                        <span className="font-bold text-lg">Dicilo</span>
                    </div>

                    {/* Desktop Header Actions (Right aligned) - REMOVED (Moved to Sidebar) */}
                    <div className="ml-auto flex items-center gap-2">
                        {/* Empty or minimal actions if needed, e.g. Notifications later */}
                    </div>
                </header>

                <main className={cn(
                    "flex-1 overflow-auto",
                    currentView === 'freelancer' ? "p-0" : "p-4 md:p-8"
                )}>
                    <div className={cn(
                        "mx-auto",
                        currentView === 'freelancer' ? "h-full max-w-none" : "max-w-5xl"
                    )}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
