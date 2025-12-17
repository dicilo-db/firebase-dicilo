
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { adId, path, location, device } = body;

        if (!adId) {
            return NextResponse.json({ error: 'Ad ID is required' }, { status: 400 });
        }

        // 0. Get Ad Data to find owner Client
        const adDoc = await getAdminDb().collection('ads_banners').doc(adId).get();
        if (!adDoc.exists) {
            return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
        }
        const adData = adDoc.data();
        // Assuming ad document has clientId field. If not passed in body, use this.
        // The previous view route expected clientId in body. Safer to trust stored ad data if available.
        // Let's fallback to body clientId if not in adData (legacy).
        const effectiveClientId = adData?.clientId || body.clientId;

        if (!effectiveClientId) {
            // If we can't find a client to charge, we might still want to log the click? 
            // But for monetization, this is critical.
            console.warn('Click recorded but no Client ID found to charge.');
        }

        const adRef = getAdminDb().collection('ads_banners').doc(adId);

        // Batch write to ensure consistency
        const batch = getAdminDb().batch();

        // 1. Deduct from Client Wallet (if client exists)
        if (effectiveClientId) {
            const clientRef = getAdminDb().collection('clients').doc(effectiveClientId);
            batch.update(clientRef, {
                budget_remaining: FieldValue.increment(-0.05)
            });
        }

        // 2. Update Ad Counters (Clicks & Cost)
        // Cost per click is 0.05
        batch.update(adRef, {
            clicks: FieldValue.increment(1),
            totalCost: FieldValue.increment(0.05)
        });

        // 3. Log Event
        const eventRef = getAdminDb().collection('ad_events').doc();
        batch.set(eventRef, {
            adId,
            clientId: effectiveClientId || null,
            type: 'click',
            timestamp: FieldValue.serverTimestamp(),
            path: path || 'unknown',
            location: location || null,
            device: device || 'unknown',
            cost: 0.05
        });

        await batch.commit();

        return NextResponse.json({ success: true, deducted: 0.05 });
    } catch (error) {
        console.error('Error logging ad click:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
