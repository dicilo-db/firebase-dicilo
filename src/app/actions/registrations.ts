'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

export type CleanupResult = {
    success: boolean;
    message: string;
    stats?: {
        totalScanned: number;
        duplicatesRemoved: number;
        updatedToBasic: number;
        createdFromClients: number;
    };
};

export async function deleteRegistration(id: string, type: string) {
    try {
        if (!id) throw new Error('ID Required');

        // 1. Get Registration to find linked data
        const regSnap = await getAdminDb().collection('registrations').doc(id).get();
        if (!regSnap.exists) return { success: false, error: 'Registration not found' };

        const regData = regSnap.data() as any;

        // 2. Delete Registration Document
        await getAdminDb().collection('registrations').doc(id).delete();

        // 3. Optional: Cleanup linked Client or User?
        // User asked to "modify/delete". Deleting the registration usually implies removing the record.
        // If it's a private user, we might want to disable their Auth?
        // For now, let's keep it safe: Delete the registration entry. 
        // If the user said "delete any private user account", we should probably delete the Auth user too if requested.
        // Let's stick to deleting the database record for now to avoid accidental destruction of Auth data unless explicitly requested.

        revalidatePath('/admin/registrations');
        return { success: true };
    } catch (error: any) {
        console.error('Delete error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateRegistrationStatus(id: string, status: 'active' | 'paused') {
    try {
        await getAdminDb().collection('registrations').doc(id).update({
            status,
            updatedAt: FieldValue.serverTimestamp()
        });
        revalidatePath('/admin/registrations');
        return { success: true };
    } catch (error: any) {
        console.error('Status update error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Executes a full database cleanup:
 * 1. Removes duplicates based on email (keeps the latest one).
 * 2. Classifies unassigned/invalid types to 'donor' (Basic).
 */
export async function runDatabaseCleanup(): Promise<CleanupResult> {
    try {
        console.log('[Cleanup] Starting database cleanup...');

        // 1. Fetch Registrations
        const regSnapshot = await getAdminDb().collection('registrations').get();
        const regs = regSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        // 2. Fetch Clients AND Businesses (Both are sources for Basic if they exist there)
        const [clientSnapshot, businessSnapshot] = await Promise.all([
            getAdminDb().collection('clients').get(),
            getAdminDb().collection('businesses').get()
        ]);

        const clients = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), _source: 'client' } as any));
        const businesses = businessSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), _source: 'business' } as any));

        // Merge lists (Prefer 'clients' data if overlap, though 'businesses' might be simpler Basic ones)
        const allCompanies = [...clients, ...businesses];

        console.log(`[Cleanup] Found ${regs.length} registrations, ${clients.length} clients, and ${businesses.length} businesses.`);

        const emailMap = new Map<string, any[]>();
        // Helper to normalize strings for comparison
        const normalize = (s: string) => s ? s.toLowerCase().trim().replace(/[^a-z0-9]/g, '') : '';
        const nameMap = new Map<string, any[]>(); // Valid names for second-pass dedupe

        // Build Registration Maps
        regs.forEach((doc: any) => {
            if (doc.email) {
                const email = doc.email.toLowerCase().trim();
                if (!emailMap.has(email)) emailMap.set(email, []);
                emailMap.get(email)!.push(doc);
            }
            // Also map by composite name for clients without email match
            const nameKey = normalize(doc.businessName || `${doc.firstName} ${doc.lastName}`);
            if (nameKey.length > 3) {
                if (!nameMap.has(nameKey)) nameMap.set(nameKey, []);
                nameMap.get(nameKey)!.push(doc);
            }
        });

        const batch = getAdminDb().batch();
        let batchCount = 0;
        let duplicatesRemoved = 0;
        let updatedToBasic = 0;
        let createdFromClient = 0;

        // --- PHASE 1: DEDUPLICATION OF REGISTRATIONS ---
        for (const [email, records] of emailMap.entries()) {
            if (records.length > 1) {
                // Keep latest
                records.sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
                    return dateB - dateA;
                });
                const [keep, ...remove] = records;
                for (const doc of remove) {
                    batch.delete(getAdminDb().collection('registrations').doc(doc.id));
                    duplicatesRemoved++;
                    batchCount++;
                }
            }
        }

        if (batchCount > 400) { await batch.commit(); batchCount = 0; }

        const processedEmails = new Set<string>();
        const processedNames = new Set<string>();

        // --- PHASE 2: SYNC COMPANIES TO REGISTRATIONS ---
        // Ensure every client/business exists in registrations
        for (const company of allCompanies) {
            // Determine best email/name
            const companyEmail = company.email ? company.email.toLowerCase().trim() : null;
            const companyName = company.clientName || company.name || 'Empresa Sin Nombre';
            const companyNameKey = normalize(companyName);

            let matchFound = false;

            // Check against existing registrations
            if (companyEmail && emailMap.has(companyEmail)) matchFound = true;
            else if (companyNameKey && nameMap.has(companyNameKey)) matchFound = true;

            // CHECK AGAINST ALREADY PROCESSED IN THIS LOOP
            if (companyEmail && processedEmails.has(companyEmail)) matchFound = true;
            if (companyNameKey && processedNames.has(companyNameKey)) matchFound = true;

            if (!matchFound) {
                // CREATE MISSING REGISTRATION
                console.log(`[Cleanup] Creating missing registration for: ${companyName}`);
                const newRegRef = getAdminDb().collection('registrations').doc();
                const now = FieldValue.serverTimestamp();

                // Fallback email generator
                const fallbackEmail = `missing-email-${normalize(companyName).substring(0, 10)}-${Math.random().toString(36).substring(7)}@dicilo.placeholder`;
                const finalEmail = companyEmail || fallbackEmail;

                const newRegData = {
                    firstName: companyName, // Fallback
                    lastName: '(Empresa)',
                    email: finalEmail,
                    businessName: companyName,
                    registrationType: 'donor', // Default to Basic
                    source: 'auto-sync',
                    createdAt: now,
                    updatedAt: now,
                    clientId: company._source === 'client' ? company.id : undefined,
                    status: 'active'
                };

                batch.set(newRegRef, newRegData);
                createdFromClient++;
                batchCount++;

                // Mark as processed
                if (companyEmail) processedEmails.add(companyEmail);
                if (companyNameKey) processedNames.add(companyNameKey);
            }
        }

        if (batchCount > 400) { await batch.commit(); batchCount = 0; }


        // --- PHASE 3: CLASSIFICATION ENFORCEMENT ---
        // Iterate all active registrations (we re-fetch or use logic, simplest is re-iterate maps but ignore deleted)
        // Since we did batch deletes, let's just use the 'keep' records from Phase 1 + Created ones (conceptually).
        // For safety, let's just do a quick pass on the original list minus known deletes. 
        // Or simpler: just strict check valid types.

        const validTypes = ['private', 'donor', 'retailer', 'premium', 'starter'];

        // We need to check the "survivors". 
        // Simplest strategy for robustness: Loop through 'regs' again. If it wasn't valid, update it.
        // We can't know for sure if it was deleted without tracking IDs.
        // Let's assume the dedupe logic worked. We will update `records[0]` from the map.

        for (const [email, records] of emailMap.entries()) {
            if (records.length === 0) continue;
            // Sort same way to pick the winner
            records.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
                return dateB - dateA;
            });
            const doc = records[0];

            // If type is invalid, Force to Basic
            if (!doc.registrationType || !validTypes.includes(doc.registrationType)) {
                batch.update(getAdminDb().collection('registrations').doc(doc.id), { registrationType: 'donor' });
                updatedToBasic++;
                batchCount++;
            }
        }

        if (batchCount > 0) {
            await batch.commit();
        }

        return {
            success: true,
            message: 'Cleanup & Sync Complete.',
            stats: {
                totalScanned: regs.length,
                duplicatesRemoved,
                updatedToBasic,
                createdFromClients: createdFromClient
            },
        };

    } catch (error: any) {
        console.error('[Cleanup] Error:', error);
        return { success: false, message: error.message };
    }
}
