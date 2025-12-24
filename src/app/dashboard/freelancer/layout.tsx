'use client';

import React from 'react';
import { FreelancerSidebar } from '@/components/dashboard/freelancer/FreelancerSidebar';

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex bg-background min-h-screen">
            {/* Sidebar Freelancer */}
            <div className="hidden md:block w-72 border-r bg-card/50 backdrop-blur-xl fixed inset-y-0 z-50">
                <FreelancerSidebar className="w-full h-full border-none" />
            </div>

            {/* Mobile Sidebar Logic can be added here later */}

            {/* Main Content Area */}
            <main className="flex-1 md:ml-72 p-0 overflow-y-auto h-screen bg-slate-50 dark:bg-black/20">
                {children}
            </main>
        </div>
    );
}
