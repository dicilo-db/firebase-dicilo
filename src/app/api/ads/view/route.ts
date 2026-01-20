
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        let body;
        try {
            const text = await request.text();
            if (!text) return NextResponse.json({});
            body = JSON.parse(text);
        } catch (e) {
            console.warn('Empty or invalid JSON body in ads/view');
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const { adId, costPerView, rank } = body; // Accept costPerView if provided, default handled below

        if (!adId) {
            return NextResponse.json({ error: 'Missing adId' }, { status: 400 });
        }

        const db = getAdminDb();
        const adRef = db.collection('ads_banners').doc(adId);

        // 1. Existing Logic: Simple increment for total views
        const updateMainPromise = adRef.update({
            views: FieldValue.increment(1)
        });

        // 2. New Logic: Daily Statistics (Safe Mode - try/catch independent)
        const statsPromise = (async () => {
            try {
                const today = new Date();
                const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD
                const statsId = `${adId}_${dateKey}`;
                const statsRef = db.collection('ad_stats_daily').doc(statsId);

                // Default cost per view if not provided/configured elsewhere is 0.05
                const price = typeof costPerView === 'number' ? costPerView : 0.05;

                const adDoc = await adRef.get();
                const adData = adDoc.data();
                const businessName = adData?.title || adData?.clientId || 'Unknown Ad';

                const batch = db.batch();

                const statsUpdate: any = {
                    adId,
                    date: dateKey,
                    views: FieldValue.increment(1),
                    updatedAt: FieldValue.serverTimestamp()
                };

                // Track Top Positions (Rank 1-3)
                if (typeof rank === 'number' && rank >= 0 && rank < 3) {
                    statsUpdate.topPositionCount = FieldValue.increment(1);
                }

                batch.set(statsRef, statsUpdate, { merge: true });

                // [NEW] Also log to analyticsEvents for the Admin Dashboard
                const analyticsRef = db.collection('analyticsEvents').doc();
                batch.set(analyticsRef, {
                    type: 'adImpression',
                    businessId: adId,
                    businessName: businessName,
                    timestamp: FieldValue.serverTimestamp(),
                    isAd: true,
                    details: 'View',
                    rank: typeof rank === 'number' ? rank : null
                });

                await batch.commit();

            } catch (err) {
                console.error('[STATS ERROR] Failed to update daily stats:', err);
                // Do not throw, so main request succeeds
            }
        })();

        // Await both, but stats failure won't reject main promise due to internal catch
        await Promise.all([updateMainPromise, statsPromise]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error logging ad view:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
