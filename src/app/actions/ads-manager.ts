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
    clientId?: string;
}

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
export async function createQrCampaign(data: { name: string; targetUrl: string; description?: string; clientId?: string }) {
    try {
        const db = getAdminDb();
        const shortId = generateShortId(6);

        const newCampaign: any = {
            name: data.name,
            targetUrl: data.targetUrl, // The destination URL (editable)
            description: data.description || '',
            clicks: 0,
            active: true,
            createdAt: new Date(),
            shortId: shortId, // Used for dicilo.net/qr/{shortId}
            clientId: data.clientId || null
        };

        console.log(`Creating QR campaign: ${shortId}`, newCampaign);
        await db.collection('qr_campaigns').doc(shortId).set(newCampaign);

        return { success: true, id: shortId };
    } catch (error: any) {
        console.error('Error creating QR campaign:', error);
        return { success: false, error: error.message };
    }
}

// Get all QR Campaigns (with optional clientId filter for SaaS)
export async function getQrCampaigns(clientId?: string) {
    try {
        const db = getAdminDb();
        let ref: any = db.collection('qr_campaigns');
        
        if (clientId) {
            ref = ref.where('clientId', '==', clientId);
        }

        const snapshot = await ref.get();

        const campaigns = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'Untitled',
                targetUrl: data.targetUrl || '',
                description: data.description || '',
                clicks: data.clicks || 0,
                active: data.active ?? true,
                clientId: data.clientId || null,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            };
        }) as any[];

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
export async function generateQrReportConfig(clientId?: string) {
    try {
        const db = getAdminDb();

        // 1. Fetch History
        let historyRef: any = db.collection('qr_history');
        if (clientId) {
            historyRef = historyRef.where('clientId', '==', clientId);
        }
        const historySnap = await historyRef.orderBy('archivedAt', 'desc').get();
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
        let activeRef: any = db.collection('qr_campaigns');
        if (clientId) {
            activeRef = activeRef.where('clientId', '==', clientId);
        }
        const activeSnap = await activeRef.get();
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

// --- NEW SAAS B2B CAMPAIGNS ACTIONS (Display, Banners, Sampling, Hostesses) ---

export async function createAdCampaign(data: {
    clientId: string;
    title: string;
    description: string;
    type: 'display_ad' | 'banner_redirect' | 'sampling' | 'hostess';
    budgetTotal: number;
    startDate: string;
    endDate: string;
    image?: string;
    images?: string[];
    // Specific fields
    targetUrl?: string;
    zone?: string;
    samplesTotal?: number;
    rewardPerReview?: number;
    eventLocation?: string;
    eventDate?: string;
    hostessesCount?: number;
}) {
    try {
        const db = getAdminDb();
        
        // Fetch B2B client details
        let companyName = 'Negocio';
        let companyLogo = '';
        const clientSnap = await db.collection('clients').doc(data.clientId).get();
        if (clientSnap.exists) {
            const cData = clientSnap.data() || {};
            companyName = cData.clientName || cData.name || 'Negocio';
            companyLogo = cData.logo || '';
        } else {
            const bSnap = await db.collection('business_profiles').doc(data.clientId).get();
            if (bSnap.exists) {
                const bData = bSnap.data() || {};
                companyName = bData.name || 'Negocio';
                companyLogo = bData.logo || '';
            }
        }

        const newDoc: any = {
            clientId: data.clientId,
            companyName,
            companyLogo,
            title: data.title,
            description: data.description,
            type: data.type,
            status: 'active',
            budget_total: Number(data.budgetTotal),
            budget_remaining: Number(data.budgetTotal),
            start_date: data.startDate,
            end_date: data.endDate,
            image: data.image || '',
            images: data.images || (data.image ? [data.image] : []),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Specific fields mapping
        if (data.targetUrl) newDoc.targetUrl = data.targetUrl;
        if (data.zone) newDoc.zone = data.zone;
        if (data.type === 'display_ad' || data.type === 'banner_redirect') {
            newDoc.clicks = 0;
            newDoc.impressions = 0;
        }

        if (data.type === 'sampling') {
            newDoc.samplesTotal = Number(data.samplesTotal) || 0;
            newDoc.samplesRemaining = Number(data.samplesTotal) || 0;
            newDoc.rewardPerReview = Number(data.rewardPerReview) || 0;
        }

        if (data.type === 'hostess') {
            newDoc.eventLocation = data.eventLocation || '';
            newDoc.eventDate = data.eventDate || '';
            newDoc.hostessesCount = Number(data.hostessesCount) || 1;
        }

        const docRef = await db.collection('campaigns').add(newDoc);
        return { success: true, id: docRef.id };
    } catch (e: any) {
        console.error("Error creating B2B ad campaign:", e);
        return { success: false, error: e.message };
    }
}

export async function getAdCampaigns(clientId?: string, type?: 'display_ad' | 'banner_redirect' | 'sampling' | 'hostess') {
    try {
        const db = getAdminDb();
        let ref: any = db.collection('campaigns');
        
        if (clientId) {
            ref = ref.where('clientId', '==', clientId);
        }
        if (type) {
            ref = ref.where('type', '==', type);
        }

        const snapshot = await ref.get();
        const campaigns = snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null
            };
        });

        // Sort in-memory to avoid needing index
        campaigns.sort((a: any, b: any) => {
            const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tB - tA;
        });

        return { success: true, campaigns };
    } catch (e: any) {
        console.error("Error fetching B2B ad campaigns:", e);
        return { success: false, error: e.message };
    }
}

export async function updateAdCampaign(id: string, data: any) {
    try {
        const db = getAdminDb();
        const docRef = db.collection('campaigns').doc(id);
        const docSnap = await docRef.get();
        
        if (!docSnap.exists) {
            return { success: false, error: 'Campaign not found' };
        }

        const updateData: any = {
            title: data.title,
            description: data.description,
            budget_total: Number(data.budgetTotal),
            start_date: data.startDate,
            end_date: data.endDate,
            image: data.image || '',
            images: data.images || (data.image ? [data.image] : []),
            status: data.status || 'active',
            updatedAt: new Date()
        };

        if (data.targetUrl !== undefined) updateData.targetUrl = data.targetUrl;
        if (data.zone !== undefined) updateData.zone = data.zone;

        if (data.samplesTotal !== undefined) {
            updateData.samplesTotal = Number(data.samplesTotal);
            const oldData = docSnap.data();
            const diff = Number(data.samplesTotal) - (oldData?.samplesTotal || 0);
            updateData.samplesRemaining = Math.max(0, (oldData?.samplesRemaining || 0) + diff);
        }
        if (data.rewardPerReview !== undefined) updateData.rewardPerReview = Number(data.rewardPerReview);
        if (data.eventLocation !== undefined) updateData.eventLocation = data.eventLocation;
        if (data.eventDate !== undefined) updateData.eventDate = data.eventDate;
        if (data.hostessesCount !== undefined) updateData.hostessesCount = Number(data.hostessesCount);

        await docRef.update(updateData);
        return { success: true };
    } catch (e: any) {
        console.error("Error updating B2B ad campaign:", e);
        return { success: false, error: e.message };
    }
}

export async function deleteAdCampaign(id: string) {
    try {
        const db = getAdminDb();
        await db.collection('campaigns').doc(id).delete();
        return { success: true };
    } catch (e: any) {
        console.error("Error deleting B2B ad campaign:", e);
        return { success: false, error: e.message };
    }
}
