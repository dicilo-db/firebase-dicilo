'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMarketOfferAction } from '@/app/actions/market-actions';
import { useAuth } from '@/context/AuthContext';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { MARKET_CATEGORIES } from '@/types/market';

const schema = z.object({
    primaryRole: z.enum(['buyer', 'seller']),
    modality: z.enum(['direct', 'intermediary']),
    category: z.enum(['energy', 'real_estate', 'transport', 'agriculture', 'precious_metals', 'other']),
    subCategory: z.string().min(2, "Mínimo 2 caracteres").max(100),
    provisionType: z.enum(['percentage', 'fixed_amount']),
    provisionValue: z.number().min(0, "Debe ser un valor positivo"),
    provisionDescription: z.string().max(250).optional(),
    title: z.string().min(5, "Demasiado corto").max(150),
    description: z.string().min(10, "Describe con mejor detalle").max(3000),
    volumeOrQuantity: z.string().max(200).optional(),
});

type FormData = z.infer<typeof schema>;

export default function MarketWizard({ onCancel, onSuccess }: { onCancel: () => void, onSuccess: () => void }) {
    const { t } = useTranslation(['market', 'common']);
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            primaryRole: 'buyer',
            modality: 'intermediary',
            category: 'energy',
            provisionType: 'percentage',
        }
    });

    const isIntermediary = watch('modality') === 'intermediary';

    const onSubmit = async (data: FormData) => {
        if (!user?.uid) return;
        setSubmitting(true);
        setErrorMsg('');

        try {
            const result = await createMarketOfferAction({
                ...data,
                userId: user.uid,
            });

            if (result.success) {
                onSuccess();
            } else {
                setErrorMsg(result.error || 'Error desconocido');
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Error en el servidor');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-w-4xl mx-auto">
            <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4">
                <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                    <FiArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('list.createButton')}</h2>
                    <p className="text-sm text-gray-500">{t('description')}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
                {errorMsg && (
                    <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                        {errorMsg}
                    </div>
                )}
                
                {/* SETTING ROLES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200">
                            {t('form.primaryRoleLabel')}
                        </label>
                        <select
                            {...register('primaryRole')}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="buyer">{t('roles.buyer')}</option>
                            <option value="seller">{t('roles.seller')}</option>
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-200">
                            {t('form.modalityLabel')}
                        </label>
                        <select
                            {...register('modality')}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="intermediary">{t('modalities.intermediary')}</option>
                            <option value="direct">{t('modalities.direct')}</option>
                        </select>
                    </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* FINANCIALS */}
                <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
                    <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-4 text-lg">
                        {isIntermediary ? t('form.provisionIntermediaryLabel') : t('form.provisionDirectLabel')}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.provisionTypeLabel')}</label>
                            <select
                                {...register('provisionType')}
                                className="w-full bg-white border border-indigo-200 text-gray-900 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            >
                                <option value="percentage">{t('form.provisionPercentage')}</option>
                                <option value="fixed_amount">{t('form.provisionFixed')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.provisionValueLabel')}</label>
                            <input
                                type="number"
                                step="0.01"
                                {...register('provisionValue', { valueAsNumber: true })}
                                className="w-full bg-white border border-indigo-200 text-gray-900 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            />
                            {errors.provisionValue && <span className="text-red-500 text-xs mt-1 block">{errors.provisionValue.message}</span>}
                        </div>
                    </div>
                    
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.provisionDescriptionLabel')}</label>
                        <input
                            type="text"
                            placeholder="Ej: 2% del contrato mensual"
                            {...register('provisionDescription')}
                            className="w-full bg-white border border-indigo-200 text-gray-900 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* DETAILS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.categoryLabel')}</label>
                        <select
                            {...register('category')}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {MARKET_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{t(`categories.${cat}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.subCategoryLabel')}</label>
                        <input
                            type="text"
                            {...register('subCategory')}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        {errors.subCategory && <span className="text-red-500 text-xs mt-1">{errors.subCategory.message}</span>}
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.titleLabel')}</label>
                        <input
                            type="text"
                            {...register('title')}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        {errors.title && <span className="text-red-500 text-xs mt-1">{errors.title.message}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.volumeLabel')}</label>
                        <input
                            type="text"
                            {...register('volumeOrQuantity')}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.descriptionLabel')}</label>
                        <textarea
                            rows={4}
                            {...register('description')}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        ></textarea>
                        {errors.description && <span className="text-red-500 text-xs mt-1">{errors.description.message}</span>}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-md hover:shadow-lg"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <FiCheckCircle size={20} />
                        )}
                        {t('form.submit')}
                    </button>
                </div>
            </form>
        </div>
    );
}
