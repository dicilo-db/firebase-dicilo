'use client';

import React from 'react';
import BusinessSidebar from '@/components/dashboard/business/BusinessSidebar';
import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
    const { plan, email, isLoading } = useBusinessAccess();
    const router = useRouter();

    React.useEffect(() => {
        if (!isLoading && plan === 'none') {
            router.push('/dashboard'); // Kick out normal users automatically
        }
    }, [isLoading, plan, router]);

    if (isLoading || plan === 'none') {
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
            <div className="h-full hidden md:block z-10 shrink-0">
                <BusinessSidebar plan={plan} email={email} isLoading={false} />
            </div>

            <div className="flex-1 h-full overflow-y-auto w-full relative">
                {children}
            </div>
        </div>
    );
}
