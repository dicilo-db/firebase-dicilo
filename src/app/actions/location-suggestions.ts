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
    isVerified?: boolean;
    lat?: number;
    lon?: number;
}) {
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(`suggest_location_${ip}`, 5, 60000)) {
        return { success: false, error: 'Demasiadas sugerencias. Espera 1 minuto.' };
    }

    try {
        const db = getAdminDb();
        
        // If Verified by OSM, we Auto-Approve it and inject straight into system locations
        if (data.isVerified) {
            const { addCity, addDistrict } = await import('./admin-locations');
            let result;
            if (data.type === 'city') {
                result = await addCity(data.countryId, data.cityName);
            } else if (data.type === 'district' && data.districtName) {
                // Ensure city exists first (addCity ignores if it already exists, but we need to be safe)
                await addCity(data.countryId, data.cityName);
                result = await addDistrict(data.countryId, data.cityName, data.districtName);
            }
            
            if (result && !result.success) {
                // Si la ciudad/barrio ya existía, igual devolvemos un éxito al usuario diciendo que ya existe y está activo.
                return { success: true, message: 'La ubicación ya se encontraba habilitada en el sistema de Dicilo.' };
            }

            return { success: true, message: '¡Gracias! El sistema OSM confirmó la ubicación y ya ha sido dada de alta inmediatamente en Dicilo.' };
        }

        // Prevent duplicate manual suggestions
        const existingQuery = data.type === 'city' 
            ? db.collection(COLLECTION_NAME).where('type', '==', 'city').where('countryId', '==', data.countryId).where('cityName', '==', data.cityName)
            : db.collection(COLLECTION_NAME).where('type', '==', 'district').where('countryId', '==', data.countryId).where('cityName', '==', data.cityName).where('districtName', '==', data.districtName);
        
        const existing = await existingQuery.get();
        if (!existing.empty) {
            return { success: false, error: 'Esta ubicación ya ha sido sometida y está pendiente de revisión manual.' };
        }

        await db.collection(COLLECTION_NAME).add({
            type: data.type,
            countryId: data.countryId,
            countryName: data.countryName,
            cityName: data.cityName,
            districtName: data.districtName || null,
            suggestedBy: data.userId,
            lat: data.lat || null,
            lon: data.lon || null,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, message: 'Ubicación no encontrada en mapas globales. Ha sido enviada a revisión manual a los administradores.' };
    } catch (e: any) {
        console.error("Error suggesting location:", e);
        return { success: false, error: 'Ocurrió un error al procesar la sugerencia.' };
    }
}

export async function getPendingSuggestions(): Promise<{success: boolean, data?: LocationSuggestion[], error?: string}> {
    try {
        const db = getAdminDb();
        const snap = await db.collection(COLLECTION_NAME).orderBy('createdAt', 'desc').get();
        const docs = snap.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data, 
                createdAt: data.createdAt ? data.createdAt.toMillis() : Date.now() 
            };
        }) as LocationSuggestion[];
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
