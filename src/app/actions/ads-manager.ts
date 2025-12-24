'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { nanoid } from 'nanoid';

const db = getAdminDb();

export interface QrCampaign {
    id: string;
    name: string;
    targetUrl: string;
    description?: string;
    clicks: number;
    createdAt: Date;
    active: boolean;
}

// Create a new QR Campaign
export async function createQrCampaign(data: { name: string; targetUrl: string; description?: string }) {
    try {
        // Generate a short ID (6 chars) for the QR URL
        const shortId = nanoid(6);

        const newCampaign: any = {
            name: data.name,
            targetUrl: data.targetUrl, // The destination URL (editable)
            description: data.description || '',
            clicks: 0,
            active: true,
            createdAt: new Date(),
            shortId: shortId // Used for dicilo.net/qr/{shortId}
        };

        await db.collection('qr_campaigns').doc(shortId).set(newCampaign);

        return { success: true, id: shortId };
    } catch (error: any) {
        console.error('Error creating QR campaign:', error);
        return { success: false, error: error.message };
    }
}

// Get all QR Campaigns
export async function getQrCampaigns() {
    try {
        const snapshot = await db.collection('qr_campaigns')
            .orderBy('createdAt', 'desc')
            .get();

        const campaigns = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Timestamp to Date for client serialization
            createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as QrCampaign[];

        return { success: true, campaigns };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Update Target URL (The "Dynamic" part)
export async function updateQrTargetUrl(id: string, newUrl: string) {
    try {
        await db.collection('qr_campaigns').doc(id).update({
            targetUrl: newUrl
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Delete Campaign
export async function deleteQrCampaign(id: string) {
    try {
        await db.collection('qr_campaigns').doc(id).delete();
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
