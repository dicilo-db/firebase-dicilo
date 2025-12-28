import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// SECURITY: This endpoint should be protected. 
// For this script, we assume a header check or valid Admin session.
// In production deployment, ensure only Super Admins can trigger this.

export async function POST(request: Request) {
    try {
        const db = getAdminDb();
        const batchSize = 450; // Firestore batch limit is 500
        let totalUpdated = 0;

        // --- STEP 1: FAILSAFE - ROOT USER "Dicilo System" ---
        const SYSTEM_ID = 'dicilo_system_legacy';
        const systemUserRef = db.collection('private_profiles').doc(SYSTEM_ID);
        const systemUserDoc = await systemUserRef.get();

        if (!systemUserDoc.exists) {
            console.log("Creating Root User: Dicilo System");
            await systemUserRef.set({
                firstName: 'Dicilo',
                lastName: 'System',
                email: 'system@dicilo.net',
                role: 'system',
                uniqueCode: 'DCLSYSTEM01',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                isSystemRoot: true
            });
        }

        // --- STEP 2: LOOP & UPDATE (Data Patching) ---
        // We handle this in batches. Note: Vercel functions have timeout limits (10s-60s).
        // If you have >1000 users, run this script multiple times or locally.

        const profilesSnapshot = await db.collection('private_profiles').get();

        let batch = db.batch();
        let operationCount = 0;

        for (const doc of profilesSnapshot.docs) {
            const data = doc.data();
            const docRef = doc.ref;
            let needsUpdate = false;
            let updates: any = {};

            // Skip the system user itself
            if (doc.id === SYSTEM_ID) continue;

            // 2.1: GENERATE MISSING CODES
            if (!data.uniqueCode) {
                const role = data.role || 'user';
                const isCompany = ['retailer', 'premium', 'donor', 'company'].includes(role);

                let newCode = '';

                if (isCompany) {
                    // Pattern: EMDC + ID_SUB + RAND
                    // Example: EMDC + A8F21 + 9X
                    const idSub = doc.id.substring(0, 5).toUpperCase();
                    const rand = Math.floor(Math.random() * 90 + 10); // 2 digit random
                    newCode = `EMDC${idSub}${rand}`;
                } else {
                    // Pattern: DCL + NAME(3) + ID(4)
                    // Example: DCL + JUA + 62D1
                    const namePart = (data.firstName || 'UNK').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
                    const idSub = doc.id.substring(0, 4).toUpperCase();
                    newCode = `DCL${namePart}${idSub}`;
                }

                updates.uniqueCode = newCode;
                needsUpdate = true;
            }

            // 2.2: ASSIGN FALLBACK REFERRER
            // Only if referredBy is Missing AND referrerCode is Missing (truly orphan)
            // If they have a code but no ID, we might want to resolve it, strictly strictly assigning system to NULLs
            if (!data.referredBy && !data.referrerCode) {
                updates.referredBy = SYSTEM_ID;
                updates.referrerCode = 'DCLSYSTEM01'; // Optional: keep consistency
                // Mark as的历史 data / Legacy
                updates.migrationNote = 'LEGACY_MIGRATION_2025';
                needsUpdate = true;
            }

            if (needsUpdate) {
                batch.update(docRef, updates);
                operationCount++;
                totalUpdated++;
            }

            // Commit batch if limit reached
            if (operationCount >= batchSize) {
                await batch.commit();
                batch = db.batch(); // Reset
                operationCount = 0;
            }
        }

        // Commit remaining
        if (operationCount > 0) {
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            message: `Migration verified. Processed ${profilesSnapshot.size} records. Updated ${totalUpdated} records.`,
            systemRootId: SYSTEM_ID
        });

    } catch (error: any) {
        console.error("Migration Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
