'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';

const db = getAdminDb();

/**
 * MIGRATION HELPER: 
 * Syncs ALL existing companies from the old 'clients' collection to the new 'business_profiles'.
 * Used by Superadmins to populate the new B2B dashboard.
 */
export async function migrateAllLegacyClients() {
    try {
        const legacyClientsRef = db.collection('clients');
        // Only migrate those that are technically "business" plans in the old system
        const snapshot = await legacyClientsRef.where('clientType', 'in', ['premium', 'retailer', 'starter']).get();

        if (snapshot.empty) {
            return { success: true, migrated: 0, message: "No legacy clients found to migrate." };
        }

        const batch = db.batch();
        let migratedCount = 0;
        let alreadyExistedCount = 0;

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
                    ownerUid: data.ownerUid || 'UNKNOWN_OWNER',
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
                    // Copy Landing Page specific old data
                    headerData: data.headerData || null,
                    bodyData: data.bodyData || null,
                    infoCards: data.infoCards || null,
                    graphics: data.graphics || null,
                    createdAt: new Date()
                };

                batch.set(newProfileRef, legacyDataToCopy);
                migratedCount++;
            } else {
                alreadyExistedCount++;
            }
        }

        if (migratedCount > 0) {
            await batch.commit();
            console.log(`[B2B MASS MIGRATION] Sync completed. ${migratedCount} companies imported. (${alreadyExistedCount} skipped)`);
        }

        return { 
            success: true, 
            migrated: migratedCount, 
            skipped: alreadyExistedCount,
            message: `Migración exitosa. ${migratedCount} empresas transferidas al nuevo ecosistema.`
        };

    } catch (error: any) {
        console.error("Error in mass migration:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Assigns an owner to a B2B profile based on their email.
 */
export async function assignB2BOwnerByEmail(companyId: string, email: string) {
    try {
        const auth = getAdminAuth();
        
        let targetUid = '';
        try {
            const userRecord = await auth.getUserByEmail(email);
            targetUid = userRecord.uid;
        } catch (e: any) {
            if (e.code === 'auth/user-not-found') {
                return { success: false, error: 'No se encontró ningún usuario con ese correo electrónico.' };
            }
            throw e;
        }

        const profileRef = db.collection('business_profiles').doc(companyId);
        const snap = await profileRef.get();
        if (!snap.exists) {
            return { success: false, error: 'No se encontró la empresa especificada.' };
        }

        await profileRef.update({ ownerUid: targetUid });

        return { 
            success: true, 
            message: `Propietario asignado con éxito a ${email}.`
        };

    } catch (error: any) {
        console.error("Error assigning owner:", error);
        return { success: false, error: error.message || 'Error interno al asignar propietario.' };
    }
}
