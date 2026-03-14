'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { RecommendationFormContent } from '@/components/RecommendationForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export function RecommendCompanyView() {
    const { t } = useTranslation('common');

    return (
        <div className="p-6 md:p-8 space-y-6 bg-slate-50/50 dark:bg-black/10 fade-in animate-in duration-500">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-primary" />
                    {t('freelancer_menu.recommendation_section', 'Recomienda empresas')}
                </h1>
                <p className="text-muted-foreground">
                    {t('form.description', 'Rellena este formulario para recomendar una empresa.')}
                </p>
            </div>

            <Card className="max-w-4xl border-0 shadow-lg ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
                    <CardTitle>{t('form.title', 'Recomendar una empresa')}</CardTitle>
                    <CardDescription>{t('form.description')}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 md:p-10 bg-white dark:bg-slate-950">
                    <RecommendationFormContent />
                </CardContent>
            </Card>
        </div>
    );
}
