import React from 'react';
import { BusinessSidebar } from '@/components/business/BusinessSidebar';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
    // Note: We will add strict auth guards here later, similar to useAuthGuard.
    // For now, it's just the structural layout.
    
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="flex">
                <BusinessSidebar />
                <main className="flex-1 min-w-0 p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
