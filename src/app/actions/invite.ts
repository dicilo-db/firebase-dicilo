'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { headers } from 'next/headers';

interface InviteFriend {
    name: string;
    email: string;
    lang: 'es' | 'de' | 'en';
    template?: string;
}

interface SendInvitationResult {
    success: boolean;
    sentCount?: number;
    error?: string;
}

export async function sendPioneerInvitations(
    referrerId: string,
    referrerName: string,
    friends: InviteFriend[]
): Promise<SendInvitationResult> {
    try {
        if (!referrerId) {
            return { success: false, error: 'Unauthorized' };
        }

        const db = getAdminDb();
        const batch = db.batch();
        const referralsRef = db.collection('referrals_pioneers');

        // Check limit
        const existingDocs = await referralsRef.where('referrerId', '==', referrerId).get();
        if (existingDocs.size + friends.length > 15) {
            return { success: false, error: 'Limit reached (Max 15)' };
        }

        for (const friend of friends) {
            const newDocRef = referralsRef.doc();
            batch.set(newDocRef, {
                referrerId,
                referrerName,
                friendName: friend.name,
                friendEmail: friend.email,
                lang: friend.lang.toLowerCase(),
                status: 'sent', // Or 'draft' depending on email sending outcome
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                opened: false,
                template: friend.template || 'default'
            });
        }

        await batch.commit();

        // TODO: Trigger Email Sending here (e.g. via Brevo API or triggers)
        // For now, we assume the trigger happens on Firestore create or we implement sending logic later.

        return { success: true, sentCount: friends.length };
    } catch (error: any) {
        console.error('Error sending invitations:', error);
        return { success: false, error: error.message };
    }
}
