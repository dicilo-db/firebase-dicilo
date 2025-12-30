'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

import { registerNewProspect } from './dicipoints';

export async function submitRecommendation(data: any) {
    try {
        const ref = await getAdminDb().collection('recommendations').add({
            ...data,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            source: data.source || 'search_page_recommendation',
            pointsPaid: false // Will be updated by registerNewProspect immediately
        });

        // AUTOMATIC PAYMENT
        if (data.userId) {
            await registerNewProspect(data.userId, ref.id);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error submitting recommendation:', error);
        return { success: false, error: error.message };
    }
}
