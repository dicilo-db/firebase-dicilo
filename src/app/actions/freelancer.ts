'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { Campaign, Promotion } from '@/types/freelancer';

const db = getAdminDb();

const serializeFirestoreData = (data: any) => {
    if (!data) return null;
    const serialized = { ...data };
    if (serialized.createdAt && typeof serialized.createdAt.toDate === 'function') {
        serialized.createdAt = serialized.createdAt.toDate().toISOString();
    }
    // Handle other potential timestamps if any
    return serialized;
};

/**
 * Fetches active campaigns suitable for a freelancer based on filters.
 */
export async function getFreelancerCampaigns(
    filters: { languages?: string[], location?: string } = {}
): Promise<{ success: boolean, campaigns?: Campaign[], error?: string }> {
    try {
        let q = db.collection('campaigns').where('status', 'in', ['active', 'gray_mode']);

        // Note: Firestore array-contains-any allows filtering by language match
        if (filters.languages && filters.languages.length > 0) {
            q = q.where('languages', 'array-contains-any', filters.languages);
        }
        // Location filtering might need more complex logic or client-side filtering 
        // depending on how specific "target_locations" data structure is.

        const snapshot = await q.get();

        const campaigns: Campaign[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...serializeFirestoreData(doc.data())
        } as Campaign));

        // Filter by gray mode budget rule explicitly if needed, though 'status' should reflect it via trigger
        // Also apply location filter in memory if "Global" vs specific city logic is complex
        const filtered = campaigns.filter(c => {
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
