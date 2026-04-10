'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Mail, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { useTranslation } from 'react-i18next';

interface Invite {
    id: string;
    friendName: string;
    friendEmail: string;
    status: string;
    opened?: boolean;
    updatedAt?: any;
    createdAt?: any;
}

interface InviteListProps {
    invites: Invite[];
}

export function InviteList({ invites }: InviteListProps) {
    const { t } = useTranslation(['admin']);

    const getStatusColor = (status: string, opened?: boolean) => {
        if (status === 'registered') return 'bg-green-100 text-green-800 border-green-200';
        if (status === 'sent') return 'bg-blue-50 text-blue-800 border-blue-200';
        return 'bg-gray-100 text-gray-600 border-gray-200';
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'registered': return t('admin:invite.history.status.registered', 'Registrado');
            case 'sent': return t('admin:invite.history.status.sent', 'Enviado');
            case 'opened': return t('admin:invite.history.status.opened', 'Visto');
            default: return t('admin:invite.history.status.pending', 'Pendiente');
        }
    };

    return (
        <Card className="mt-6 border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl">{t('admin:invite.history.title', 'Historial de Invitaciones')}</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                <div className="space-y-2">
                    {invites.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-secondary/10 rounded-lg border border-dashed">
                            <Mail className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p>{t('admin:invite.history.empty', 'No has enviado invitaciones aún.')}</p>
                        </div>
                    ) : (
                        invites.map((invite) => (
                            <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border bg-white shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                                        {invite.friendName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm flex items-center gap-2">
                                            {invite.friendName}
                                            {invite.opened && (
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] py-0 h-4">
                                                    <Eye className="w-3 h-3 mr-1" /> {t('admin:invite.history.status.opened', 'Visto')}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{invite.friendEmail}</div>
                                    </div>
                                </div>
                                <Badge variant="outline" className={cn("text-xs", getStatusColor(invite.status, invite.opened))}>
                                    {getStatusLabel(invite.status)}
                                </Badge>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
