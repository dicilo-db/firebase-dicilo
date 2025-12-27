'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { CampaignAction } from '@/types/freelancer'; // Assuming we can reuse types or define new ones

export interface CalendarEvent {
    id: string;
    campaignId: string;
    companyName: string;
    date: string; // ISO String or YYYY-MM-DD
    status: 'scheduled' | 'completed';
    earnings?: number;
    platform?: string;
}

export interface MarketingPlanData {
    events: CalendarEvent[];
    warnings: string[]; // Dates with warnings or general warnings
}

/**
 * Fetches all campaign actions (completed and scheduled) for a given month.
 */
export async function getMarketingPlanEvents(userId: string, month: number, year: number): Promise<{ success: boolean; data?: MarketingPlanData; error?: string }> {
    try {
        if (!userId) throw new Error('Unauthorized');

        const db = getAdminDb();

        // Define range
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

        // Fetch actions
        // Assuming we query 'user_campaign_actions'
        // We need an index on scheduledAt ideally. Or we just query created_at for completed.
        // It's tricky because we have two dates: actual creation (completed) and scheduled date (future).
        // Let's query based on a unified date range logic or check if "any action scheduled OR created in this range".
        // Simpler: Fetch everything for this user? No, too big. 
        // Best approach for NoSQL without complex OR queries: Execute two queries and merge.

        // 1. Completed Actions (isPublished = true, createdAt in range)
        // Actually, completed actions usually use 'createdAt' as the event time.
        const completedSnap = await db.collection('user_campaign_actions')
            .where('userId', '==', userId)
            .where('created_at', '>=', admin.firestore.Timestamp.fromDate(startDate))
            .where('created_at', '<=', admin.firestore.Timestamp.fromDate(endDate))
            .get();

        // 2. Scheduled Actions (isPublished = false, scheduledAt in range)
        const scheduledSnap = await db.collection('user_campaign_actions')
            .where('userId', '==', userId)
            // .where('isPublished', '==', false) // Optional if we assume scheduledAt implies future
            .where('scheduledAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
            .where('scheduledAt', '<=', admin.firestore.Timestamp.fromDate(endDate))
            .get();

        const events: CalendarEvent[] = [];

        // Process Completed
        completedSnap.forEach(doc => {
            const data = doc.data();
            events.push({
                id: doc.id,
                campaignId: data.campaignId,
                companyName: data.companyName || 'Campaign', // Should be stored or fetched
                date: data.created_at.toDate().toISOString(),
                status: 'completed',
                earnings: data.rewardAmount || 0,
                platform: data.platform
            });
        });

        // Process Scheduled
        scheduledSnap.forEach(doc => {
            const data = doc.data();
            // Avoid duplicates if a doc matches both (unlikely for scheduled)
            if (!events.find(e => e.id === doc.id)) {
                events.push({
                    id: doc.id,
                    campaignId: data.campaignId,
                    companyName: data.companyName || 'Campaign',
                    date: data.scheduledAt.toDate().toISOString(),
                    status: 'scheduled',
                    earnings: data.estimatedReward || 0, // Future earnings
                    platform: data.platform
                });
            }
        });

        return { success: true, data: { events, warnings: [] } }; // calculate warnings on frontend or here
    } catch (error: any) {
        console.error('Error fetching marketing plan:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sketches a post for a future date.
 */
export async function scheduleCampaignPost(userId: string, campaignId: string, companyName: string, date: Date): Promise<{ success: boolean; error?: string }> {
    try {
        if (!userId) throw new Error('Unauthorized');

        // 1. Validate Limit (10 per day per campaign)
        // Query existing scheduled for that day + completed for that day?
        // Usually you can't schedule for the past, so we just check scheduled for that target day.

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const db = getAdminDb();
        const existingCount = await db.collection('user_campaign_actions')
            .where('userId', '==', userId)
            .where('campaignId', '==', campaignId)
            .where('scheduledAt', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
            .where('scheduledAt', '<=', admin.firestore.Timestamp.fromDate(endOfDay))
            .count()
            .get();

        if (existingCount.data().count >= 10) {
            return { success: false, error: 'Daily limit reached for this campaign' };
        }

        // 2. Create Scheduled Record
        await db.collection('user_campaign_actions').add({
            userId,
            campaignId,
            companyName,
            status: 'scheduled',
            isPublished: false,
            scheduledAt: admin.firestore.Timestamp.fromDate(date),
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            platform: 'instagram' // Default or passed
        });

        return { success: true };

    } catch (error: any) {
        console.error('Error scheduling post:', error);
        return { success: false, error: error.message };
    }
}
