'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Prospect } from '@/types/prospect';
import { revalidatePath } from 'next/cache';

const COLLECTION = 'prospects'; // Functionally equivalent to 'directorio_basic'

/**
 * Creates a new prospect from the scanner with Smart Merge Logic.
 * 1. Checks if prospect exists (by Email or Name).
 * 2. If exists: Enriches missing fields (Smart Merge).
 * 3. If not exists: Creates new record.
 */
export async function createProspect(
    data: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'reportGeneratedAt'>
) {
    try {
        const db = getAdminDb();
        const collectionRef = db.collection(COLLECTION);

        // 1. Detection: Check for duplicates
        let querySnapshot;

        // Priority 1: Check by Email if provided
        if (data.email) {
            querySnapshot = await collectionRef.where('email', '==', data.email).limit(1).get();
        }

        // Priority 2: Check by Name if no email match yet
        if ((!querySnapshot || querySnapshot.empty) && data.businessName) {
            // Note: Firestore doesn't support case-insensitive query natively without external index or redundant field.
            // For this smart merge, we assume exact name match or prefix match could be implemented if 'searchKey' existed.
            // Using exact match for safety and speed standard.
            querySnapshot = await collectionRef.where('businessName', '==', data.businessName).limit(1).get();
        }

        // --- SCENARIO A: COMPANY EXISTS (SMART MERGE) ---
        if (querySnapshot && !querySnapshot.empty) {
            const existingDoc = querySnapshot.docs[0];
            const existingData = existingDoc.data() as Prospect;
            const updates: any = {};
            let enrichedCount = 0;

            // Helper to enrich only if DB value is empty/missing
            const enrichField = (field: keyof Prospect, newValue: any) => {
                if (!existingData[field] && newValue) {
                    updates[field] = newValue;
                    enrichedCount++;
                }
            };

            enrichField('phone', data.phone);
            enrichField('email', data.email);
            enrichField('website', data.website);
            enrichField('address', data.address);

            // Special Case: Description Concatenation
            if (data.ocrRawData && (!existingData.ocrRawData || !existingData.ocrRawData.includes(data.ocrRawData))) {
                const currentDesc = existingData.ocrRawData || '';
                updates['ocrRawData'] = currentDesc + '\n--- Info Extra Escáner ---\n' + data.ocrRawData;
                enrichedCount++;
            }

            if (Object.keys(updates).length > 0) {
                await existingDoc.ref.update({
                    ...updates,
                    updatedAt: new Date().toISOString()
                });
                return {
                    success: true,
                    status: 'duplicate',
                    message: `⚠️ Empresa ya registrada. Se han completado ${enrichedCount} campos que faltaban.`,
                    companyName: existingData.businessName
                };
            } else {
                return {
                    success: true,
                    status: 'duplicate',
                    message: `⚠️ Empresa ya registrada. No había datos nuevos para agregar.`,
                    companyName: existingData.businessName
                };
            }
        }

        // --- SCENARIO B: NEW COMPANY (INSERT) ---
        const ref = collectionRef.doc();
        const now = new Date().toISOString();

        const newProspect: Prospect = {
            id: ref.id,
            ...data,
            isActive: false, // Default pending
            createdAt: now,
            updatedAt: now,
            reportGeneratedAt: null
        };

        await ref.set(newProspect);

        return { success: true, status: 'success', id: ref.id, message: '✅ Lead nuevo registrado correctamente.' };

    } catch (error: any) {
        console.error('Error creating prospect:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Updates a prospect's B2B status or assignment.
 */
export async function updateProspectB2B(
    id: string,
    updates: Partial<Pick<Prospect, 'leadDestination' | 'clientCompanyId' | 'clientCompanyName'>>
) {
    try {
        await getAdminDb().collection(COLLECTION).doc(id).update({
            ...updates,
            updatedAt: new Date().toISOString()
        });
        revalidatePath('/admin/prospects');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Sets a prospect as "Reported" (exported to Excel).
 */
export async function markProspectsAsReported(ids: string[]) {
    try {
        const batch = getAdminDb().batch();
        const now = new Date().toISOString();

        ids.forEach(id => {
            const ref = getAdminDb().collection(COLLECTION).doc(id);
            batch.update(ref, { reportGeneratedAt: now });
        });

        await batch.commit();
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Gets prospects filtered by client company (For B2B Reporting).
 * Use this to generate the Excel report.
 */
export async function getClientProspects(clientId: string, onlyUnreported: boolean = true) {
    try {
        let q = getAdminDb().collection(COLLECTION)
            .where('clientCompanyId', '==', clientId);

        if (onlyUnreported) {
            q = q.where('reportGeneratedAt', '==', null);
        }

        const snap = await q.get();
        return snap.docs.map(d => d.data() as Prospect);
    } catch (error: any) {
        console.error('Error fetching client prospects:', error);
        return [];
    }
}
