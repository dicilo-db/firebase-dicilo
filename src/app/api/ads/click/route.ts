
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { adId, clientId } = body;

        if (!adId) {
            return NextResponse.json({ error: 'Missing adId' }, { status: 400 });
        }

        const db = getAdminDb();
        const adRef = db.collection('ads_banners').doc(adId);

        // Atomic increment of clicks
        const batch = db.batch();
        batch.update(adRef, {
            clicks: FieldValue.increment(1),
        });

        // 2. [NEW] Log to analyticsEvents (for Real-time Dashboard)
        const analyticsRef = db.collection('analyticsEvents').doc();
        batch.set(analyticsRef, {
            type: 'cardClick', // This maps to "Clicks en Tarjetas"
            businessId: adId,
            businessName: 'Ad Banner', // Placeholder
            timestamp: FieldValue.serverTimestamp(),
            clickedElement: 'banner',
            isAd: true
        });

        // 3. [NEW] Log to ad_stats_daily (for Charts/Billing)
        const today = new Date();
        const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const statsId = `${adId}_${dateKey}`;
        const statsRef = db.collection('ad_stats_daily').doc(statsId);

        batch.set(statsRef, {
            adId,
            date: dateKey,
            clicks: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        await batch.commit();

        // Optional: If we want to track clicks per client separately, we could do it here.
        // But users requested stats in Ads Manager which reads 'ads_banners'.

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error logging ad click:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
