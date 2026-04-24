'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getUserMarketOffersAction } from '@/app/actions/market-actions';
import { useAuth } from '@/context/AuthContext';
import { FiPlus, FiBox, FiTag } from 'react-icons/fi';

export default function MarketOffersList({ onCrearNueva }: { onCrearNueva: () => void }) {
    const { t } = useTranslation(['market', 'common']);
    const { user } = useAuth();
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            loadOffers();
        }
    }, [user]);

    const loadOffers = async () => {
        setLoading(true);
        if(!user) return;
        const res = await getUserMarketOffersAction(user.uid);
        if (res.success && res.offers) {
            setOffers(res.offers);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FiBox className="text-indigo-600 dark:text-indigo-400" />
                    {t('list.myOffers')}
                </h2>
                <button
                    onClick={onCrearNueva}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <FiPlus />
                    {t('list.createButton')}
                </button>
            </div>

            {offers.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <FiBox size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('list.empty')}</h3>
                    <p className="text-gray-500 max-w-sm mb-6">{t('description')}</p>
                    <button
                        onClick={onCrearNueva}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                        {t('list.createButton')} &rarr;
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offers.map(offer => (
                        <div key={offer.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 flex justify-between items-start mb-2">
                                <span className={`text-xs px-2 py-1 rounded-md font-semibold tracking-wide uppercase ${
                                    offer.primaryRole === 'buyer' 
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                }`}>
                                    {t(`roles.${offer.primaryRole}`)}
                                </span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md font-medium">
                                    {t(`modalities.${offer.modality}`)}
                                </span>
                            </div>
                            
                            <div className="px-5 py-4">
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                                    <FiTag /> {t(`categories.${offer.category}`)}
                                </p>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">{offer.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
                                    {offer.description}
                                </p>

                                <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 font-medium">
                                            {offer.modality === 'intermediary' ? t('form.provisionIntermediaryLabel') : t('form.provisionDirectLabel')}
                                        </span>
                                        <span className="font-bold text-gray-900 dark:text-gray-100">
                                            {offer.provisionValue} {offer.provisionType === 'percentage' ? '%' : 'USD'}
                                        </span>
                                    </div>
                                    {offer.volumeOrQuantity && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-medium">{t('form.volumeLabel').replace(' (opcional)', '')}</span>
                                            <span className="font-bold text-gray-900 dark:text-gray-100 truncate w-1/2 text-right">{offer.volumeOrQuantity}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
