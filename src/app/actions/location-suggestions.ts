'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';

const COLLECTION_NAME = 'location_suggestions';

export interface LocationSuggestion {
    id: string;
    type: 'city' | 'district';
    countryId: string;
    countryName: string;
    cityName: string;
    districtName?: string;
    suggestedBy: string;
    createdAt?: any;
}

export async function suggestLocation(data: {
    type: 'city' | 'district';
    countryId: string;
    countryName: string;
    cityName: string;
    districtName?: string;
    userId: string;
}) {
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(`suggest_location_${ip}`, 5, 60000)) {
        return { success: false, error: 'Demasiadas sugerencias. Espera 1 minuto.' };
    }

    try {
        const db = getAdminDb();
        
        // Prevent duplicate suggestions
        const existingQuery = data.type === 'city' 
            ? db.collection(COLLECTION_NAME).where('type', '==', 'city').where('countryId', '==', data.countryId).where('cityName', '==', data.cityName)
            : db.collection(COLLECTION_NAME).where('type', '==', 'district').where('countryId', '==', data.countryId).where('cityName', '==', data.cityName).where('districtName', '==', data.districtName);
        
        const existing = await existingQuery.get();
        if (!existing.empty) {
            return { success: false, error: 'Esta ubicación ya ha sido sugerida y está pendiente de revisión.' };
        }

        await db.collection(COLLECTION_NAME).add({
            type: data.type,
            countryId: data.countryId,
            countryName: data.countryName,
            cityName: data.cityName,
            districtName: data.districtName || null,
            suggestedBy: data.userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, message: 'La sugerencia ha sido enviada a los administradores para su evaluación.' };
    } catch (e: any) {
        console.error("Error suggesting location:", e);
        return { success: false, error: 'Ocurrió un error al enviar la sugerencia.' };
    }
}

export async function getPendingSuggestions(): Promise<{success: boolean, data?: LocationSuggestion[], error?: string}> {
    try {
        const db = getAdminDb();
        const snap = await db.collection(COLLECTION_NAME).orderBy('createdAt', 'desc').get();
        const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LocationSuggestion[];
        return { success: true, data: docs };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}

export async function deleteSuggestion(id: string) {
    try {
        const db = getAdminDb();
        await db.collection(COLLECTION_NAME).doc(id).delete();
        revalidatePath('/admin/locations');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
