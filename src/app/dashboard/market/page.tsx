'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MarketOffersList from '@/components/dashboard/market/MarketOffersList';
import MarketWizard from '@/components/dashboard/market/MarketWizard';

export default function MarketDashboardPage() {
    const { t } = useTranslation(['market']);
    const [view, setView] = useState<'list' | 'wizard'>('list');

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {t('title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {t('description')}
                </p>
            </header>

            {view === 'list' && (
                <MarketOffersList onCrearNueva={() => setView('wizard')} />
            )}

            {view === 'wizard' && (
                <MarketWizard 
                    onCancel={() => setView('list')} 
                    onSuccess={() => setView('list')} 
                />
            )}
        </div>
    );
}
