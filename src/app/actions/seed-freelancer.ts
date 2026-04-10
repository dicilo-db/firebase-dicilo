'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { Campaign } from '@/types/freelancer';

const db = getAdminDb();

export async function seedCampaignsAction() {
    try {
        const campaigns: Omit<Campaign, 'id'>[] = [
            // Fake campaigns removed. Use Admin Panel to create real campaigns.
        ];

        const batch = db.batch();
        for (const c of campaigns) {
            const ref = db.collection('campaigns').doc();
            batch.set(ref, c);
        }
        await batch.commit();
        return { success: true, message: 'Seeded 3 campaigns' };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}
