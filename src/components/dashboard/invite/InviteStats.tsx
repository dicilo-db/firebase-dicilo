'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

interface InviteStatsProps {
    availableSlots: number;
    maxSlots: number;
    openedCount: number;
    registeredCount: number;
}

export function InviteStats({ availableSlots, maxSlots, openedCount, registeredCount }: InviteStatsProps) {
    const { t } = useTranslation(['admin']);

    return (
        <div className="grid gap-6 md:grid-cols-3">
            {/* Green Card */}
            <Card className="bg-[#4CAF50] text-white border-none shadow-md overflow-hidden relative">
                <CardHeader className="pb-2">
                    <CardDescription className="text-white/90 font-medium">{t('admin:invite.stats.availableSlots', 'Espacios Disponibles')}</CardDescription>
                    <CardTitle className="text-6xl font-bold">{availableSlots}</CardTitle>
                </CardHeader>
                <CardFooter className="text-sm font-medium text-white/90">
                    {t('admin:invite.stats.ofInvites', { count: maxSlots, defaultValue: `de ${maxSlots} invitaciones Pioneras` })}
                </CardFooter>
            </Card>

            {/* White Card 1 */}
            <Card className="shadow-sm">
                <CardHeader className="pb-2">
                    <CardDescription className="text-muted-foreground font-medium">{t('admin:invite.stats.opened', 'Ojeando Propuesta')}</CardDescription>
                    <CardTitle className="text-6xl font-bold text-blue-600">{openedCount}</CardTitle>
                </CardHeader>
                <CardFooter className="text-sm text-muted-foreground">
                    {t('admin:invite.stats.openedLabel', 'Emails Abiertos')}
                </CardFooter>
            </Card>

            {/* White Card 2 */}
            <Card className="shadow-sm">
                <CardHeader className="pb-2">
                    <CardDescription className="text-muted-foreground font-medium">{t('admin:invite.stats.registered', 'Pioneros Cerrados')}</CardDescription>
                    <CardTitle className="text-6xl font-bold text-[#4CAF50]">{registeredCount}</CardTitle>
                </CardHeader>
                <CardFooter className="text-sm text-muted-foreground">
                    {t('admin:invite.stats.registeredLabel', '+50 DP por c/u')}
                </CardFooter>
            </Card>
        </div>
    );
}
