'use client';

import React from 'react';
import { FreelancerSidebar } from '@/components/dashboard/freelancer/FreelancerSidebar';

export default function FreelancerLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex bg-background h-full overflow-hidden">
            {/* Sidebar Freelancer */}
            <div className="hidden md:block w-72 border-r bg-card/50 backdrop-blur-xl relative z-50 h-full">
                <FreelancerSidebar className="w-full h-full border-none" />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-0 p-0 overflow-y-auto bg-slate-50 dark:bg-black/20 h-full">
                {children}
            </main>
        </div>
    );
}
