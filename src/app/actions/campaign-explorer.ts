'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { Campaign } from '@/types/freelancer';

export interface CampaignExplorerFilters {
    category?: string;
    language?: string;
    paymentRange?: 'high' | 'low';
}

export interface ExplorableCampaign extends Campaign {
    urgency: 'high' | 'normal';
    poolProgress: number; // 0-100 (Simulated for visualization)
}

/**
 * Endpoint for exploring active campaigns with security filtering.
 */
export async function exploreCampaigns(filters?: CampaignExplorerFilters): Promise<{ success: boolean; campaigns?: ExplorableCampaign[]; error?: string }> {
    try {
        const db = getAdminDb();
        let query: admin.firestore.Query = db.collection('campaigns').where('status', '==', 'active');

        // Apply filters
        if (filters?.category && filters.category !== 'all') {
            query = query.where('categories', 'array-contains', filters.category);
        }

        // Note: multiple array-contains are limited in Firestore.
        // We handle language filter in memory or via separate query if index exists.

        const snapshot = await query.get();
        const campaigns: ExplorableCampaign[] = [];

        // Fetch user data/budgets to calculate urgency is expensive if we do it for all.
        // We assume 'budget_remaining' is denormalized on the campaign doc or we mock it.
        // For real implementation, we should have a scheduled function updating 'pool_status' on the campaign doc.

        snapshot.forEach(doc => {
            const data = doc.data();

            // In-Memory Filter for Language (if not done in query)
            if (filters?.language && filters.language !== 'all') {
                if (data.languages && !data.languages.includes(filters.language)) {
                    return;
                }
            }

            // Helper to deep serialize Firestore data (convert Timestamps to ISO strings)
            function serializeData(data: any): any {
                if (data === null || data === undefined) return data;

                if (typeof data.toDate === 'function') {
                    return data.toDate().toISOString();
                }

                if (Array.isArray(data)) {
                    return data.map(item => serializeData(item));
                }

                if (typeof data === 'object') {
                    const serialized: any = {};
                    for (const key in data) {
                        serialized[key] = serializeData(data[key]);
                    }
                    return serialized;
                }

                return data;
            }

            // ... inside the loop
            const safeData = serializeData(data);
            // Security: Remove cost_per_action (must be done AFTER serialization or before, but before return)
            delete safeData.cost_per_action;

            // Calculate Urgency & Fake Pool Status
            // Logic: if budget_remaining < 20% of budget_total -> urgency high
            // Mocking budget values if not present
            const total = safeData.budget_total || 1000;
            const remaining = safeData.budget_remaining !== undefined ? safeData.budget_remaining : 800;
            const percentageLeft = (remaining / total) * 100;

            const urgency = percentageLeft < 20 ? 'high' : 'normal';
            // Pool progress: Inverted (amount used)
            const poolProgress = Math.min(100, Math.max(0, 100 - percentageLeft));

            campaigns.push({
                id: doc.id,
                ...safeData,
                reward_per_action: safeData.reward_per_action || 0.10, // Fallback
                urgency,
                poolProgress
            } as ExplorableCampaign);
        });

        // Payment Range Filter (In Memory)
        if (filters?.paymentRange) {
            if (filters.paymentRange === 'high') {
                // Filter > 0.30
                return { success: true, campaigns: campaigns.filter(c => (c.reward_per_action || 0) >= 0.30) };
            } else {
                return { success: true, campaigns: campaigns.filter(c => (c.reward_per_action || 0) < 0.30) };
            }
        }

        return { success: true, campaigns };

    } catch (error: any) {
        console.error("Explore error:", error);
        return { success: false, error: error.message };
    }
}
