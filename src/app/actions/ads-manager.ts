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

// Update Target URL (The "Dynamic" part) with History Tracking
export async function updateQrTargetUrl(id: string, newUrl: string) {
    try {
        const db = getAdminDb();
        const docRef = db.collection('qr_campaigns').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return { success: false, error: 'Campaign not found' };
        }

        const data = docSnap.data() as any;

        // Archive current stats if there are any clicks
        if (data.clicks > 0) {
            await db.collection('qr_history').add({
                campaignId: id,
                campaignName: data.name,
                targetUrl: data.targetUrl, // Old URL
                clicks: data.clicks,
                startDate: data.activeSince || data.createdAt,
                endDate: new Date(),
                archivedAt: new Date()
            });
        }

        // Update with new URL and reset stats
        await docRef.update({
            targetUrl: newUrl,
            clicks: 0,
            activeSince: new Date()
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Generate CSV Report
export async function generateQrReportConfig() {
    try {
        const db = getAdminDb();

        // 1. Fetch History
        const historySnap = await db.collection('qr_history').orderBy('archivedAt', 'desc').get();
        const history = historySnap.docs.map(doc => {
            const d = doc.data();
            return {
                type: 'Historico',
                name: d.campaignName,
                url: d.targetUrl,
                clicks: d.clicks,
                start: d.startDate?.toDate ? d.startDate.toDate().toLocaleDateString() : '',
                end: d.endDate?.toDate ? d.endDate.toDate().toLocaleDateString() : '',
                id: d.campaignId
            };
        });

        // 2. Fetch Active
        const activeSnap = await db.collection('qr_campaigns').get();
        const active = activeSnap.docs.map(doc => {
            const d = doc.data();
            const start = d.activeSince?.toDate ? d.activeSince.toDate() : d.createdAt?.toDate ? d.createdAt.toDate() : new Date();
            return {
                type: 'Activo',
                name: d.name,
                url: d.targetUrl,
                clicks: d.clicks,
                start: start.toLocaleDateString(),
                end: 'Presente',
                id: doc.id
            };
        });

        const allRecords = [...active, ...history];

        // 3. Convert to CSV
        // Simple manual conversion to avoid dependencies
        const header = ['Tipo', 'Nombre de Campaña', 'URL Destino', 'Clics', 'Inicio', 'Fin', 'ID QR'];
        const rows = allRecords.map(r =>
            `"${r.type}","${r.name}","${r.url}",${r.clicks},"${r.start}","${r.end}","${r.id}"`
        );

        const csvContent = [header.join(','), ...rows].join('\n');

        return { success: true, csv: csvContent };

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
