'use server';

import { getAdminDb } from '@/lib/firebase-admin';


export interface QrCampaign {
    id: string;
    name: string;
    targetUrl: string;
    description?: string;
    clicks: number;
    createdAt: string | Date;
    active: boolean;
}

// import { nanoid } from 'nanoid'; // Removed due to ESM issues in Server Actions

// Simple random ID generator (6 chars)
function generateShortId(length: number = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Create a new QR Campaign
export async function createQrCampaign(data: { name: string; targetUrl: string; description?: string }) {
    try {
        const db = getAdminDb();
        // Generate a short ID (6 chars) for the QR URL
        const shortId = generateShortId(6);

        const newCampaign: any = {
            name: data.name,
            targetUrl: data.targetUrl, // The destination URL (editable)
            description: data.description || '',
            clicks: 0,
            active: true,
            createdAt: new Date(),
            shortId: shortId // Used for dicilo.net/qr/{shortId}
        };

        console.log(`Creating QR campaign: ${shortId}`, newCampaign); // Log for debugging
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
        const db = getAdminDb();
        const snapshot = await db.collection('qr_campaigns')
            // .orderBy('createdAt', 'desc')
            .get();

        const campaigns = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'Untitled',
                targetUrl: data.targetUrl || '',
                description: data.description || '',
                clicks: data.clicks || 0,
                active: data.active ?? true,
                // Convert to ISO string explicitly to avoid serialization issues
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            };
        }) as any[]; // casting to any to allow string createdAt temporarily while I update interface

        return { success: true, campaigns };
    } catch (error: any) {
        console.error('Error getting QR campaigns:', error);
        return { success: false, error: error.message };
    }
}

// Update Target URL (The "Dynamic" part)
export async function updateQrTargetUrl(id: string, newUrl: string) {
    try {
        const db = getAdminDb();
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
        const db = getAdminDb();
        await db.collection('qr_campaigns').doc(id).delete();
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
