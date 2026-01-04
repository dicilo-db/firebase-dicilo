'use client';

import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import { InviteStats } from './invite/InviteStats';
import { InviteTracking } from './invite/InviteTracking';
import { ReferralCard } from './ReferralCard';
import { InviteList } from './invite/InviteList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FollowersListDialog } from './invite/FollowersListDialog';

interface InviteFriendSectionProps {
    uniqueCode: string;
    referrals: any[];
}

export function InviteFriendSection({ uniqueCode, referrals }: InviteFriendSectionProps) {
    const { t } = useTranslation(['admin']);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const [invites, setInvites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowersDialogOpen, setIsFollowersDialogOpen] = useState(false);

    const MAX_FRIENDS = 1500;

    // Data Fetch
    useEffect(() => {
        if (!auth.currentUser) return;
        const q = query(
            collection(db, 'referrals_pioneers'),
            where('referrerId', '==', auth.currentUser.uid)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedInvites = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt,
                    opened: data.opened,
                    status: data.status
                };
            });
            // Sort by creation date desc
            loadedInvites.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setInvites(loadedInvites);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [auth.currentUser]);

    // We prioritize the referrals list from the profile content as it is the source of truth for successful signups
    const registeredCount = referrals?.length || 0;

    // Available slots: Max friends minus registered friends. 
    // (We could also subtract pending invites, but usually limits apply to successful connections)
    const availableSlots = Math.max(0, MAX_FRIENDS - registeredCount);

    const openedCount = invites.filter(i => i.opened).length;
    const sentCount = invites.length;

    // Determine user name
    const userName = auth.currentUser?.displayName || 'Usuario';

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Top Stats */}
            <InviteStats
                availableSlots={availableSlots}
                maxSlots={MAX_FRIENDS}
                openedCount={openedCount}
                registeredCount={registeredCount}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Tracking & History */}
                <div className="lg:col-span-2 space-y-8">
                    <InviteTracking
                        visualContacts={openedCount}
                        reach={sentCount}
                        instagram={0} // Placeholder
                        followers={registeredCount}
                        onViewFollowers={() => setIsFollowersDialogOpen(true)}
                        uniqueCode={uniqueCode}
                    />

                    <InviteList invites={invites} />
                </div>

                {/* Right Column: Invite Form */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <Card className="border-l-4 border-l-blue-500 shadow-md">
                            <CardHeader className="bg-blue-50/50 pb-4 border-b">
                                <CardTitle className="text-lg text-blue-800">{t('admin:invite.form.title', 'Personalizar Invitación')}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {t('admin:invite.form.description', 'Agrega hasta 7 amigos y envíales una invitación personalizada.')}
                                </p>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ReferralCard />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <FollowersListDialog
                open={isFollowersDialogOpen}
                onOpenChange={setIsFollowersDialogOpen}
                followerReferrals={referrals || []}
            />
        </div>
    );
}
