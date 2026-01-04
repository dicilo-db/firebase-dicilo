'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Share2, Activity, Users, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface InviteTrackingProps {
    visualContacts: number; // e.g. opened
    reach: number; // e.g. sent
    instagram?: number; // kept for compatibility but unused essentially
    followers?: number; // e.g. registered or friends
    onViewFollowers?: () => void;
    uniqueCode?: string; // Needed for QR
}

export function InviteTracking({ visualContacts, reach, instagram = 0, followers = 0, onViewFollowers, uniqueCode }: InviteTrackingProps) {
    const { t } = useTranslation(['admin', 'common']);
    const [showQr, setShowQr] = useState(false);

    // Construct the registration URL
    // Use window.location.origin if available, otherwise fallback (ssr safe)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dicilo.net';
    const referralLink = `${baseUrl}/registrieren?ref=${uniqueCode || ''}`;

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

                {/* QR Code / Invite Link (Replaces Instagram) */}
                <Card
                    className="flex items-center p-6 space-x-4 shadow-sm border-gray-100 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setShowQr(true)}
                >
                    <div className="p-3 bg-gray-50 rounded-full">
                        <QrCode className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-gray-900">{t('admin:invite.tracking.qrTitle', 'Tu QR')}</div>
                        <div className="text-sm font-medium text-gray-500">{t('admin:invite.tracking.qrDesc', 'Mostrar Código')}</div>
                    </div>
                </Card>

                {/* Seguidores */}
                <Card
                    className="flex items-center p-6 space-x-4 shadow-sm border-gray-100 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={onViewFollowers}
                >
                    <div className="p-3 bg-gray-50 rounded-full">
                        <Users className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">{followers}</div>
                        <div className="text-sm font-medium text-gray-500">{t('admin:invite.tracking.followers', 'Seguidores')}</div>
                    </div>
                </Card>
            </div>

            {/* QR Dialog */}
            <Dialog open={showQr} onOpenChange={setShowQr}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-center">{t('admin:invite.qr.title', 'Tu invitación Personal')}</DialogTitle>
                        <DialogDescription className="text-center">
                            {t('admin:invite.qr.subtitle', 'Escanea para registrarte con mi código.')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-6 space-y-6">
                        <div className="p-4 bg-white rounded-xl shadow-lg border">
                            <QRCodeSVG value={referralLink} size={200} level="H" includeMargin={true} />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="font-mono text-sm bg-muted p-2 rounded">{uniqueCode}</p>
                            <p className="text-xs text-muted-foreground break-all px-4">{referralLink}</p>
                        </div>
                        <Button onClick={() => setShowQr(false)} variant="outline">
                            {t('common:close', 'Cerrar')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
