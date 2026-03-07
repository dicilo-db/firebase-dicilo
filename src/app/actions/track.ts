'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function markInviteAsOpened(inviteId: string) {
    if (!inviteId) return { success: false, error: 'No ID provided' };

    try {
        const db = getAdminDb();
        const docRef = db.collection('referrals_pioneers').doc(inviteId);

        // Use update with field mask to be efficient
        await docRef.update({
            opened: true,
            openedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error tracking invite open:', error);
        return { success: false, error: error.message };
    }
}
