import React from 'react';
import { Header } from '@/components/header';

export default function AdminLayout({
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
