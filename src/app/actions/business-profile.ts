'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { BusinessProfile } from '@/types/business';

const db = getAdminDb();

/**
 * Calculates the completion score of a business profile based on its data fields.
 * Returns a number between 0 and 100.
 */
export async function calculateProfileCompletion(data: Partial<BusinessProfile>): Promise<number> {
    let score = 0;
    let maxScore = 100;
    let earnedPoints = 0;

    // Point distribution map
    const pointSystem = [
        { field: 'companyName', points: 15 },
        { field: 'category', points: 10 },
        { field: 'subcategory', points: 5 },
        { field: 'description', points: 15 },
        { field: 'logoUrl', points: 15 },
        { field: 'bannerUrl', points: 10 },
        { field: 'address', points: 10 },
        { field: 'city', points: 5 },
        { field: 'phone', points: 10 },
        { field: 'email', points: 5 }
    ];

    for (const item of pointSystem) {
        // @ts-ignore
        if (data[item.field] && String(data[item.field]).trim().length > 0) {
            earnedPoints += item.points;
        }
    }

    score = Math.min(100, Math.round((earnedPoints / maxScore) * 100));
    return score;
}

/**
 * Updates a company profile and recalculates its completion score and status.
 * Prepares mock MCP/n8n hooks.
 */
export async function updateCompanyProfile(companyId: string, updates: Partial<BusinessProfile>) {
    try {
        const ref = db.collection('business_profiles').doc(companyId);
        const docSnap = await ref.get();
        
        let existingData = {};
        if (docSnap.exists) {
            existingData = docSnap.data() || {};
        }

        const mergedData = { ...existingData, ...updates };
        
        // 1. Calculate Score
        const score = await calculateProfileCompletion(mergedData);
        
        // 2. Determine Status & Landing Activation
        let status: 'pending' | 'review' | 'active' = 'pending';
        if (score >= 85) {
            status = 'active';
        } else if (score >= 75) {
            status = 'review';
        }

        const landingEnabled = score >= 85;

        // 3. Save to DB
        const finalUpdates = {
            ...updates,
            profileCompletionScore: score,
            status,
            landingEnabled,
            updatedAt: new Date()
        };

        await ref.set(finalUpdates, { merge: true });

        // 4. Hook triggers for n8n/MCP (Placeholder)
        // If landing just got activated, we could trigger the n8n Workflow #7
        if (landingEnabled && docSnap.data()?.landingEnabled === false) {
            console.log(`[n8n Hook Triggered] Landing page activated for Company: ${companyId}`);
            // await fetch('n8n-webhook-url/activate-landing', { method: 'POST', body: ... })
        }

        return { success: true, score, status, landingEnabled };

    } catch (error: any) {
        console.error("Error updating company profile:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Helper to get the current plan logic rules.
 */
export async function validateCompanyPlan(companyId: string) {
    try {
        const snap = await db.collection('business_profiles').doc(companyId).get();
        if (!snap.exists) return { success: false, error: "Company not found" };

        const plan = snap.data()?.plan || 'basic';
        return { success: true, plan };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * MIGRATION HELPER: 
 * Syncs existing companies from the old 'clients' collection to the new 'business_profiles'.
 * This ensures no existing 'premium' companies are lost, without breaking the old data.
 */
export async function syncLegacyCompanies(userId: string) {
    try {
        const legacyClientsRef = db.collection('clients');
        const q = legacyClientsRef.where('ownerUid', '==', userId);
        const snapshot = await q.get();

        if (snapshot.empty) {
            return { success: true, migrated: 0 };
        }

        const batch = db.batch();
        let migratedCount = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const newProfileRef = db.collection('business_profiles').doc(doc.id);
            const newProfileSnap = await newProfileRef.get();

            // Only migrate if it doesn't already exist in the new collection
            if (!newProfileSnap.exists) {
                // Determine plan based on old clientType
                let mappedPlan: 'basic' | 'starter' | 'minorista' | 'premium' = 'basic';
                if (data.clientType === 'premium') mappedPlan = 'premium';
                else if (data.clientType === 'retailer') mappedPlan = 'minorista';
                else if (data.clientType === 'starter') mappedPlan = 'starter';

                const legacyDataToCopy = {
                    ownerUid: userId,
                    companyName: data.clientName || 'Sin Nombre',
                    plan: mappedPlan,
                    category: data.category || '',
                    subcategory: data.subcategory || '',
                    logoUrl: data.clientLogoUrl || '',
                    address: data.address || '',
                    city: data.city || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    status: 'active', // Legacy ones are considered active
                    landingEnabled: true, // Legacy ones already had landings
                    profileCompletionScore: 100, // Bypass requirement for old premium ones
                    migratedFromLegacy: true,
                    createdAt: new Date()
                };

                batch.set(newProfileRef, legacyDataToCopy);
                migratedCount++;
            }
        }

        if (migratedCount > 0) {
            await batch.commit();
            console.log(`[B2B MIGRATION] Sync completed for User ${userId}. ${migratedCount} companies imported.`);
        }

        return { success: true, migrated: migratedCount };

    } catch (error: any) {
        console.error("Error syncing legacy companies:", error);
        return { success: false, error: error.message };
    }
}
