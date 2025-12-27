'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

// --- TYPES ---

export interface CreateCampaignData {
    clientId: string;
    budgetTotal: number;
    costPerAction: number;
    rewardPerAction: number;
    dailyLimit: number;
    allowedLanguages: string[];
    images: string[];
    content: {
        [lang: string]: {
            title: string;
            description: string;
            suggestedText: string;
        }
    };
}

export interface ClientOption {
    id: string;
    name: string;
    logo?: string;
}

// --- HELPERS ---

async function verifyAdminRole(idToken: string) {
    if (!idToken) throw new Error('Unauthorized: No token provided');
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const role = decodedToken.role as string | undefined;
        const hasAdminClaim = decodedToken.admin === true;

        const allowedRoles = ['superadmin', 'admin', 'team_office', 'super_admin'];

        // Allow if explicit admin boolean is true OR if role is in allowed list
        if (!hasAdminClaim && (!role || !allowedRoles.includes(role))) {
            throw new Error(`Forbidden: Role '${role}' not authorized. (admin claim: ${decodedToken.admin})`);
        }
        return decodedToken;
    } catch (error: any) {
        console.error('RBAC Verification Failed:', error.message);
        // Pass the specific error message for debugging in the UI
        throw new Error(error.message || 'Unauthorized or Forbidden');
    }
}

// --- ACTIONS ---

/**
 * Creates a new Network Campaign.
 * Strictly adheres to RBAC: only admins can create.
 */
export async function createCampaign(idToken: string, data: CreateCampaignData) {
    try {
        // 1. Strict RBAC Check
        const user = await verifyAdminRole(idToken);

        // 2. Validate Data (Add Zod here if needed, manual for now)
        if (!data.clientId || !data.images || data.images.length === 0 || data.allowedLanguages.length === 0) {
            return { success: false, error: 'Missing required fields' };
        }

        const db = getAdminDb();
        const batch = db.batch();
        const campaignRef = db.collection('campaigns').doc();

        // 3. fetch client info for denormalization
        const clientSnap = await db.collection('clients').doc(data.clientId).get();
        const clientData = clientSnap.data() || {};
        const companyName = clientData.clientName || clientData.name || 'Unknown Client';
        const companyLogo = clientData.logo || '';

        // 4. Construct Campaign Document
        // We use the default language content for the main fields, or 'en'/'es' fallback
        const defaultLang = data.allowedLanguages[0] || 'es';
        const defaultContent = data.content[defaultLang] || { title: 'No Title', description: 'No Description' };

        const campaignDoc = {
            clientId: data.clientId,
            companyName: companyName,
            companyLogo: companyLogo,

            // Financials
            budget_total: Number(data.budgetTotal),
            budget_remaining: Number(data.budgetTotal), // Start full
            cost_per_action: Number(data.costPerAction),
            reward_per_action: Number(data.rewardPerAction),
            daily_limit_per_user: Number(data.dailyLimit) || 10,

            // Configuration
            type: 'social_product', // Fixed type for this module
            status: 'active',
            languages: data.allowedLanguages,

            // Visuals
            image: data.images[0], // Main image (first one)
            images: data.images, // Full array

            // Text (Denormalized default for simple queries)
            title: defaultContent.title,
            description: defaultContent.description,
            suggestedText: defaultContent.suggestedText,

            // Content Map (Full data)
            content_map: data.content,

            // Meta
            createdBy: user.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        batch.set(campaignRef, campaignDoc);

        // 5. Commit
        await batch.commit();

        revalidatePath('/dashboard/freelancer'); // Update freelancer views
        revalidatePath('/admin');

        return { success: true, campaignId: campaignRef.id };

    } catch (error: any) {
        console.error('Create Campaign Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetches clients for the select dropdown.
 * Restricted to admins? Yes, but less critical. We'll check token too.
 */
export async function getClientsForSelect(idToken: string): Promise<{ success: boolean, clients?: ClientOption[], error?: string }> {
    try {
        await verifyAdminRole(idToken); // Reuse check

        const snap = await getAdminDb().collection('clients')
            .select('clientName', 'name', 'logo')
            .get();

        const clients = snap.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                name: d.clientName || d.name || 'Unnamed',
                logo: d.logo
            };
        });

        return { success: true, clients };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
