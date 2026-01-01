'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Share2, Activity, Users } from 'lucide-react';

import { useTranslation } from 'react-i18next';

interface InviteTrackingProps {
    visualContacts: number; // e.g. opened
    reach: number; // e.g. sent
    instagram?: number; // placeholder or real link
    followers?: number; // e.g. registered or friends
}

export function InviteTracking({ visualContacts, reach, instagram = 0, followers = 0 }: InviteTrackingProps) {
    const { t } = useTranslation(['admin']);

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-800">{t('admin:invite.tracking.title', 'Seguimiento de Invitaciones')}</h2>
                <p className="text-muted-foreground">{t('admin:invite.tracking.subtitle', 'Monitoriza el estado de tu red en tiempo real.')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {/* Contactos Visuales */}
                <Card className="flex items-center p-6 space-x-4 shadow-sm border-gray-100 bg-white">
                    <div className="p-3 bg-gray-50 rounded-full">
                        <Eye className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{visualContacts}</div>
                        <div className="text-sm font-medium text-gray-500">{t('admin:invite.tracking.visualContacts', 'Contactos Visuales')}</div>
                    </div>
                </Card>

                {/* Alcance */}
                <Card className="flex items-center p-6 space-x-4 shadow-sm border-gray-100 bg-white">
                    <div className="p-3 bg-gray-50 rounded-full">
                        <Share2 className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{reach}</div>
                        <div className="text-sm font-medium text-gray-500">{t('admin:invite.tracking.reach', 'Alcance')}</div>
                    </div>
                </Card>

                {/* Instagram (Placeholder mostly unless connected) */}
                <Card className="flex items-center p-6 space-x-4 shadow-sm border-gray-100 bg-white">
                    <div className="p-3 bg-gray-50 rounded-full">
                        {/* Assuming Line Icon is Activity or similar, or minus sign? Screenshot has a line. Using Activity to be safe. */}
                        {/* Actually screenshot has a straight line icon, maybe Minus? */}
                        <div className="w-6 h-6 flex items-center justify-center border-b-2 border-gray-600"></div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{instagram}</div>
                        <div className="text-sm font-medium text-gray-500">{t('admin:invite.tracking.instagram', 'Instagram')}</div>
                    </div>
                </Card>

                {/* Seguidores */}
                <Card className="flex items-center p-6 space-x-4 shadow-sm border-gray-100 bg-white">
                    <div className="p-3 bg-gray-50 rounded-full">
                        <Users className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{followers}</div>
                        <div className="text-sm font-medium text-gray-500">{t('admin:invite.tracking.followers', 'Seguidores')}</div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
