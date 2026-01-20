import React from 'react';
import { Header } from '@/components/header';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            {children}
        </div>
    );
}
