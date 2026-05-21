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
    text?: string;
    assetId?: string;
    selectedImageUrl?: string;
    targetUrl?: string;
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
        // 1. Completed Actions (isPublished = true, createdAt in range)
        const completedSnap = await db.collection('user_campaign_actions')
            .where('userId', '==', userId)
            .where('created_at', '>=', admin.firestore.Timestamp.fromDate(startDate))
            .where('created_at', '<=', admin.firestore.Timestamp.fromDate(endDate))
            .get();

        // 2. Scheduled Actions (isPublished = false, scheduledAt in range)
        const scheduledSnap = await db.collection('user_campaign_actions')
            .where('userId', '==', userId)
            .where('scheduledAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
            .where('scheduledAt', '<=', admin.firestore.Timestamp.fromDate(endDate))
            .get();

        const events: CalendarEvent[] = [];

        // Process Completed
        completedSnap.forEach(doc => {
            const data = doc.data();
            if (data.status === 'scheduled') return; // Skip scheduled here
            events.push({
                id: doc.id,
                campaignId: data.campaignId,
                companyName: data.companyName || 'Campaign',
                date: data.created_at.toDate().toISOString(),
                status: 'completed',
                earnings: data.rewardAmount || 0,
                platform: data.platform || 'instagram',
                text: data.text || '',
                assetId: data.assetId || '',
                selectedImageUrl: data.selectedImageUrl || '',
                targetUrl: data.targetUrl || ''
            });
        });

        // Process Scheduled
        scheduledSnap.forEach(doc => {
            const data = doc.data();
            // Avoid duplicates
            if (!events.find(e => e.id === doc.id)) {
                events.push({
                    id: doc.id,
                    campaignId: data.campaignId,
                    companyName: data.companyName || 'Campaign',
                    date: data.scheduledAt.toDate().toISOString(),
                    status: 'scheduled',
                    earnings: data.estimatedReward || 0.40, // Future earnings estimate
                    platform: data.platform || 'instagram',
                    text: data.text || '',
                    assetId: data.assetId || '',
                    selectedImageUrl: data.selectedImageUrl || '',
                    targetUrl: data.targetUrl || ''
                });
            }
        });

        return { success: true, data: { events, warnings: [] } };
    } catch (error: any) {
        console.error('Error fetching marketing plan:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sketches a post for a future date.
 */
export async function scheduleCampaignPost(
    userId: string,
    campaignId: string,
    companyName: string,
    date: Date,
    initialData?: {
        platform?: string;
        text?: string;
        assetId?: string;
        selectedImageUrl?: string;
        targetUrl?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!userId) throw new Error('Unauthorized');

        // 1. Validate Limit (10 per day per campaign)
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
            platform: initialData?.platform || 'instagram',
            text: initialData?.text || '',
            assetId: initialData?.assetId || '',
            selectedImageUrl: initialData?.selectedImageUrl || '',
            targetUrl: initialData?.targetUrl || ''
        });

        return { success: true };

    } catch (error: any) {
        console.error('Error scheduling post:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Updates a scheduled post's details.
 */
export async function updateScheduledPostAction(
    userId: string,
    eventId: string,
    updates: {
        platform?: string;
        text?: string;
        assetId?: string;
        selectedImageUrl?: string;
        targetUrl?: string;
        date?: Date;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!userId) throw new Error('Unauthorized');
        const db = getAdminDb();
        const docRef = db.collection('user_campaign_actions').doc(eventId);
        const doc = await docRef.get();

        if (!doc.exists || doc.data()?.userId !== userId) {
            throw new Error('Event not found or unauthorized');
        }

        const dataToUpdate: any = {};
        if (updates.platform !== undefined) dataToUpdate.platform = updates.platform;
        if (updates.text !== undefined) dataToUpdate.text = updates.text;
        if (updates.assetId !== undefined) dataToUpdate.assetId = updates.assetId;
        if (updates.selectedImageUrl !== undefined) dataToUpdate.selectedImageUrl = updates.selectedImageUrl;
        if (updates.targetUrl !== undefined) dataToUpdate.targetUrl = updates.targetUrl;
        if (updates.date !== undefined) {
            dataToUpdate.scheduledAt = admin.firestore.Timestamp.fromDate(updates.date);
        }

        dataToUpdate.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await docRef.update(dataToUpdate);
        return { success: true };
    } catch (error: any) {
        console.error('Error updating scheduled post:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Deletes a scheduled post.
 */
export async function deleteScheduledPostAction(userId: string, eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (!userId) throw new Error('Unauthorized');
        const db = getAdminDb();
        const docRef = db.collection('user_campaign_actions').doc(eventId);
        const doc = await docRef.get();

        if (!doc.exists || doc.data()?.userId !== userId) {
            throw new Error('Event not found or unauthorized');
        }

        await docRef.delete();
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting scheduled post:', error);
        return { success: false, error: error.message };
    }
}
