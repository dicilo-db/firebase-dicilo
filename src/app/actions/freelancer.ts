'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { Campaign, Promotion } from '@/types/freelancer';

const db = getAdminDb();

const serializeFirestoreData = (data: any): any => {
    if (data === null || data === undefined) return data;

    if (typeof data.toDate === 'function') {
        return data.toDate().toISOString();
    }

    if (Array.isArray(data)) {
        return data.map(item => serializeFirestoreData(item));
    }

    if (typeof data === 'object') {
        const serialized: any = {};
        for (const key in data) {
            serialized[key] = serializeFirestoreData(data[key]);
        }
        return serialized;
    }

    return data;
};

/**
 * Fetches active campaigns suitable for a freelancer based on filters.
 */
export async function getFreelancerCampaigns(
    filters: { languages?: string[], location?: string } = {}
): Promise<{ success: boolean, campaigns?: Campaign[], error?: string }> {
    try {
        let q = db.collection('campaigns').where('status', 'in', ['active', 'gray_mode']);

        // REMOVED: .where('languages', 'array-contains-any', filters.languages) to avoid missing index errors during MVP.
        // We will filter in-memory instead.

        const snapshot = await q.get();

        const campaigns: Campaign[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...serializeFirestoreData(doc.data())
        } as Campaign));

        const filtered = campaigns.filter(c => {
            // 1. In-memory Language Filter
            if (filters.languages && filters.languages.length > 0) {
                const hasMatchingLang = c.languages?.some(lang => filters.languages!.includes(lang));
                if (!hasMatchingLang) return false;
            }

            // 2. In-memory Location Filter
            if (filters.location && c.target_locations.length > 0 && !c.target_locations.includes('Global')) {
                return c.target_locations.some(loc => loc.toLowerCase().includes(filters.location!.toLowerCase()));
            }
            return true;
        });

        return { success: true, campaigns: filtered };
    } catch (error: any) {
        console.error('Error fetching campaigns:', error);
        return { success: false, error: 'Failed to fetch campaigns' };
    }
}

/**
 * Creates a new promotion instance (draft or published)
 */
export async function createPromotion(promo: Omit<Promotion, 'id' | 'createdAt'>) {
    try {
        const ref = db.collection('promotions').doc();
        // Use a plain Date/string for return, but Firestore might need Date/Timestamp for storage
        // But here we are sending JSON back to client.
        const now = new Date();
        const newPromo = {
            ...promo,
            id: ref.id,
            createdAt: now.toISOString(), // Send ISO string to client
            // Generate a unique short link hash here in real logic
            trackingLink: `https://dicilo.net/r/${ref.id.substring(0, 6)}`
        };

        // Save with actual Date object to Firestore
        await ref.set({
            ...newPromo,
            createdAt: now
        });

        return { success: true, promotion: newPromo };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Joins a campaign (Fav/Accept).
 */
export async function joinCampaign(userId: string, campaignId: string) {
    try {
        if (!userId) throw new Error('Unauthorized');
        const db = getAdminDb();

        // Check if already joined
        const query = await db.collection('freelancer_campaigns')
            .where('userId', '==', userId)
            .where('campaignId', '==', campaignId)
            .get();

        if (!query.empty) {
            return { success: true, message: 'Already joined' };
        }

        await db.collection('freelancer_campaigns').add({
            userId,
            campaignId,
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Leaves a campaign.
 */
export async function leaveCampaign(userId: string, campaignId: string) {
    try {
        if (!userId) throw new Error('Unauthorized');
        const db = getAdminDb();

        const query = await db.collection('freelancer_campaigns')
            .where('userId', '==', userId)
            .where('campaignId', '==', campaignId)
            .get();

        const batch = db.batch();
        query.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Gets campaigns the freelancer has joined/accepted.
 */
export async function getJoinedCampaigns(userId: string): Promise<{ success: boolean; campaigns?: Campaign[]; error?: string }> {
    try {
        if (!userId) throw new Error('Unauthorized');
        const db = getAdminDb();

        // 1. Get joined IDs
        const joinedSnap = await db.collection('freelancer_campaigns')
            .where('userId', '==', userId)
            .get();

        if (joinedSnap.empty) return { success: true, campaigns: [] };

        const campaignIds = joinedSnap.docs.map(d => d.data().campaignId);

        // 2. Fetch campaign details (batch get is limited to 10 in 'in', but getAll is better for ID list)
        // Firestore getAll supports array of refs
        const refs = campaignIds.map(id => db.collection('campaigns').doc(id));
        const campaignsSnap = await db.getAll(...refs);

        const campaigns: Campaign[] = [];
        campaignsSnap.forEach(doc => {
            if (doc.exists) {
                const data = doc.data();
                // Check if still active/valid
                if (data && (data.status === 'active' || data.status === 'gray_mode')) {
                    campaigns.push({
                        id: doc.id,
                        ...serializeFirestoreData(data)
                    } as Campaign);
                }
            }
        });

        return { success: true, campaigns };
    } catch (error: any) {
        console.error('Error getting joined campaigns:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Gets a specific campaign details
 */
export async function getCampaignById(id: string): Promise<Campaign | null> {
    const doc = await db.collection('campaigns').doc(id).get();
    if (doc.exists) {
        return {
            id: doc.id,
            ...serializeFirestoreData(doc.data())
        } as Campaign;
    }
    return null;
}

/**
 * Gets historical postings/actions for the freelancer.
 */
export async function getFreelancerPostings(userId: string): Promise<{ success: boolean; postings?: CampaignAction[]; error?: string }> {
    try {
        if (!userId) throw new Error('Unauthorized');
        const db = getAdminDb();

        const snap = await db.collection('user_campaign_actions')
            .where('userId', '==', userId)
            .orderBy('created_at', 'desc')
            .limit(50) // Limit for MVP
            .get();

        const postings: CampaignAction[] = snap.docs.map(doc => ({
            id: doc.id,
            ...serializeFirestoreData(doc.data())
        } as CampaignAction));

        return { success: true, postings };
    } catch (error: any) {
        console.error('Error fetching postings:', error);
        return { success: false, error: error.message };
    }
}
