'use server';

import { getAdminDb } from '@/lib/firebase-admin';

export interface MarketingSend {
    id: string;
    friendName: string;
    friendEmail: string;
    rewardAmount: number;
    createdAt: string;
    template: string;
    status: string;
    converted?: boolean;
    convertedAt?: string;
}

export async function getMarketingSends(userId: string) {
    try {
        const db = getAdminDb();
        const snapshot = await db.collection('referrals_pioneers')
            .where('referrerId', '==', userId)
            // Filter by marketing-related templates if needed, 
            // but usually referrals_pioneers is for these sends
            .orderBy('createdAt', 'desc')
            .get();

        const sends: MarketingSend[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                friendName: data.friendName || 'N/A',
                friendEmail: data.friendEmail || 'N/A',
                rewardAmount: data.rewardAmount || 10,
                template: data.template || 'default',
                status: data.status || 'sent',
                converted: !!data.converted,
                convertedAt: data.convertedAt?.toDate ? data.convertedAt.toDate().toISOString() : undefined,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            };
        });

        return { success: true, sends };
    } catch (error: any) {
        console.error('Error fetching marketing sends:', error);
        return { success: false, error: error.message };
    }
}
