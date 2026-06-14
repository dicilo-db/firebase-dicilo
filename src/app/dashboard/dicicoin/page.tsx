'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DiciCoinSection } from '@/components/dashboard/DiciCoinSection';
import { useRouter } from 'next/navigation';

export default function DiciCoinUserPage() {
    const { t } = useTranslation('common');
    const { clientData, privateProfile, isLoading } = useDashboardData();
    const [walletData, setWalletData] = useState<any>(null);
    const router = useRouter();

    // Determine user data for sidebar
    const userData = clientData || privateProfile || {};

    // Fetch wallet data if user is authenticated
    useEffect(() => {
        const uid = privateProfile?.uid || userData?.ownerUid;
        if (uid) {
            import('@/app/actions/wallet').then(({ getWalletData }) => {
                getWalletData(uid).then((data) => setWalletData(data));
            });
        }
    }, [privateProfile, userData]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center text-muted-foreground">
                {t('dashboard.dicicoin.loading', 'Cargando...')}
            </div>
        );
    }

    return (
        <DashboardLayout
            userData={userData}
            currentView="dicicoin" // Keep 'dicicoin' highlighted
            walletData={walletData}
            onViewChange={(view) => {
                // Navigate to the correct view on the main dashboard SPA
                router.push(`/dashboard?view=${view}`);
            }}
        >
            <DiciCoinSection
                userData={userData}
                walletData={walletData}
                onViewHistory={() => {
                    router.push('/dashboard?view=wallet');
                }}
            />
        </DashboardLayout>
    );
}
