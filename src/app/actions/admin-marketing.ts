'use server';

import { getAdminDb } from '@/lib/firebase-admin';

export interface AdminMarketingSend {
    id: string;
    friendName: string;
    friendEmail: string;
    rewardAmount: number;
    createdAt: string;
    template: string;
    referrerId: string;
    referrerName: string;
}

export async function getAllMarketingSends() {
    try {
        const db = getAdminDb();
        const snapshot = await db.collection('referrals_pioneers')
            .orderBy('createdAt', 'desc')
            .limit(1000)
            .get();

        const sends: AdminMarketingSend[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                friendName: data.friendName || 'N/A',
                friendEmail: data.friendEmail || 'N/A',
                rewardAmount: data.rewardAmount || 10,
                template: data.template || 'default',
                referrerId: data.referrerId || 'N/A',
                referrerName: data.referrerName || 'N/A',
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            };
        });

        return { success: true, sends };
    } catch (error: any) {
        console.error('Error fetching admin marketing sends:', error);
        return { success: false, error: error.message };
    }
}
