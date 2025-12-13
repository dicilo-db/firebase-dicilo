'use server';

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function submitRecommendation(data: any) {
    try {
        await adminDb.collection('recommendations').add({
            ...data,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            source: 'search_page_recommendation',
        });
        return { success: true };
    } catch (error: any) {
        console.error('Error submitting recommendation:', error);
        return { success: false, error: error.message };
    }
}
