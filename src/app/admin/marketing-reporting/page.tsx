'use client';

import React from 'react';
import { AdminMarketingPanel } from '@/components/admin/AdminMarketingPanel';
import { useRouter } from 'next/navigation';

export default function MarketingReportingPage() {
    const router = useRouter();
    
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
            <div className="container mx-auto">
                <AdminMarketingPanel onBack={() => router.push('/admin/dashboard')} />
            </div>
        </div>
    );
}
