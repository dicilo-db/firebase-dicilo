'use client';

import React from 'react';
import { useBusinessAccess } from '@/hooks/useBusinessAccess';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import AdsDashboard from '@/components/ads-manager/AdsDashboard';

export default function CampaignsPage() {
    const { t } = useTranslation('common');
    const { businessId, clientId, plan, isLoading } = useBusinessAccess();
    const activeId = businessId || clientId;

    if (isLoading) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <Skeleton className="w-1/3 h-10" />
                <Skeleton className="w-full h-80 rounded-xl" />
            </div>
        );
    }

    if (plan === 'basic' || !activeId) {
        return (
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-4 text-sm font-medium mt-6">
                    <p>{t('business.campaigns.planReq', 'El módulo de Campañas requiere plan Starter o superior.')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <AdsDashboard clientId={activeId} />
        </div>
    );
}
