'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

// --- TYPES ---

export interface CreateCampaignData {
    clientId: string;
    budgetTotal: number;
    // costPerAction removed from required inputs, calculated backend
    manualCostPerAction?: number;
    rewardPerAction: number;
    dailyLimit: number;
    startDate: string;
    endDate: string;
    allowedLanguages: string[];
    images: string[];
    content: {
        [lang: string]: {
            title: string;
            description: string;
            suggestedText: string;
        }
    };
    targetUrls: { [lang: string]: string[] }; // Map langCode -> URL[]
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
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);
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

        // 2. Validate Data
        if (!data.clientId || !data.images || data.images.length === 0 || data.allowedLanguages.length === 0 || !data.startDate || !data.endDate) {
            return { success: false, error: 'Missing required fields' };
        }

        const db = getAdminDb();
        const batch = db.batch();
        const campaignRef = db.collection('campaigns').doc();

        // 3. fetch client info
        const clientSnap = await db.collection('clients').doc(data.clientId).get();
        const clientData = clientSnap.data() || {};
        const companyName = clientData.clientName || clientData.name || 'Unknown Client';
        const companyLogo = clientData.logo || '';

        // 4. Calculate Financials
        // Margin logic: 40% margin. Price = Cost / (1 - Margin) => Price = Reward / 0.6
        const MARGIN = 0.4;
        let finalCostPerAction = data.manualCostPerAction;

        if (finalCostPerAction === undefined || finalCostPerAction === null) { // Check for undefined or null explicitly
            // Avoid division by zero
            if (data.rewardPerAction > 0) {
                finalCostPerAction = Number((data.rewardPerAction / (1 - MARGIN)).toFixed(2));
            } else {
                finalCostPerAction = 0;
            }
        }

        // 5. Construct Campaign Document
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
            cost_per_action: Number(finalCostPerAction),
            reward_per_action: Number(data.rewardPerAction),
            daily_limit_per_user: Number(data.dailyLimit) || 10,

            // Dates
            start_date: data.startDate,
            end_date: data.endDate,

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

            // Destination URLs
            target_urls: data.targetUrls || {},

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


export async function getCampaigns(idToken: string) {
    try {
        const decodedToken = await verifyAdminRole(idToken); // Reuse consistent check

        const snapshot = await getAdminDb().collection('campaigns')
            .orderBy('createdAt', 'desc')
            .get();

        const campaigns = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                created_at: data.createdAt?.toDate?.()?.toISOString() || data.created_at || null,
                updated_at: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || null,
                // Overwrite original timestamp fields to prevent serialization errors
                createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
                start_date: data.start_date,
                end_date: data.end_date
            };
        });

        return { success: true, campaigns };
    } catch (error: any) {
        console.error('Error fetching campaigns:', error);
        return { success: false, error: 'Failed to fetch campaigns: ' + error.message };
    }
}

export async function updateCampaign(idToken: string, campaignId: string, data: CreateCampaignData) {
    try {
        await verifyAdminRole(idToken); // Reuse consistent check

        const campaignRef = getAdminDb().collection('campaigns').doc(campaignId);

        // Calculate costs
        // Margin logic assumed same as create: 40% margin. Price = Reward / 0.6
        const MARGIN = 0.4;
        let finalCostPerAction = data.manualCostPerAction;
        if (finalCostPerAction === undefined || finalCostPerAction === null) {
            if (data.rewardPerAction > 0) {
                finalCostPerAction = Number((data.rewardPerAction / (1 - MARGIN)).toFixed(2));
            } else {
                finalCostPerAction = 0;
            }
        }

        const updateData = {
            budget_total: Number(data.budgetTotal),
            reward_per_action: Number(data.rewardPerAction),
            cost_per_action: Number(finalCostPerAction),
            daily_limit_per_user: Number(data.dailyLimit),
            start_date: data.startDate,
            end_date: data.endDate,
            languages: data.allowedLanguages, // Fixed property name

            // Content Map (Full data)
            content_map: data.content,

            // Denormalize Text (using first language or es default)
            title: data.content[data.allowedLanguages[0]]?.title || data.content['es']?.title,
            description: data.content[data.allowedLanguages[0]]?.description || data.content['es']?.description,

            // Target URLs
            target_urls: data.targetUrls || {},

            images: data.images,

            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await campaignRef.update(updateData);

        revalidatePath('/dashboard/freelancer');
        revalidatePath('/admin');

        return { success: true, id: campaignId };
    } catch (error: any) {
        console.error('Error updating campaign:', error);
        return { success: false, error: 'Failed to update campaign: ' + error.message };
    }
}

export async function deleteCampaign(idToken: string, campaignId: string) {
    try {
        await verifyAdminRole(idToken); // Reuse consistent check

        await getAdminDb().collection('campaigns').doc(campaignId).delete();

        revalidatePath('/dashboard/freelancer');
        revalidatePath('/admin');

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting campaign:', error);
        return { success: false, error: 'Failed to delete campaign: ' + error.message };
    }
}
