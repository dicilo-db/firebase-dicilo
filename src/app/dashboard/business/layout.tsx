'use client';

import React from 'react';
import BusinessSidebar from '@/components/dashboard/business/BusinessSidebar';
import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { useAdminUser } from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
    const { plan, email, isLoading } = useBusinessAccess();
    const { user: adminUser } = useAdminUser();
    const router = useRouter();

    React.useEffect(() => {
        const isAdmin = ['admin', 'superadmin', 'team_office'].includes(adminUser?.role || '');
        if (!isLoading && plan === 'none' && !isAdmin) {
            router.push('/dashboard'); // Kick out normal users automatically
        }
    }, [isLoading, plan, adminUser?.role, router]);

    const isAdmin = ['admin', 'superadmin', 'team_office'].includes(adminUser?.role || '');
    if (isLoading || (plan === 'none' && !isAdmin)) {
        return (
            <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
                <BusinessSidebar plan="loading" email={null} isLoading={true} />
                <div className="flex-1 p-8">
                    <Skeleton className="w-1/3 h-10 mb-8" />
                    <Skeleton className="w-full h-64" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
            {/* Desktop Sidebar */}
            <div className="h-full hidden md:block z-10 shrink-0">
                <BusinessSidebar plan={plan} email={email} isLoading={false} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative z-0">
                {/* Mobile Header (Only visible on small screens) */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shrink-0 z-20">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dicilo<span className="text-blue-600">Business</span></h2>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0">
                                <Menu className="h-5 w-5 text-slate-700" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64 border-r-0">
                            <BusinessSidebar plan={plan} email={email} isLoading={false} />
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Sub-Pages Content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
