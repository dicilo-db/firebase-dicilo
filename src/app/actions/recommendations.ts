'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function submitRecommendation(data: any) {
    try {
        await getAdminDb().collection('recommendations').add({
            ...data,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            source: data.source || 'search_page_recommendation',
        });
        return { success: true };
    } catch (error: any) {
        console.error('Error submitting recommendation:', error);
        return { success: false, error: error.message };
    }
}
