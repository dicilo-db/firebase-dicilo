
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

        const { adId, costPerView } = body; // Accept costPerView if provided, default handled below

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

                const batch = db.batch();
                batch.set(statsRef, {
                    adId,
                    date: dateKey,
                    views: FieldValue.increment(1),
                    // cost: FieldValue.increment(price), // Views are free! Cost is per CLICK.
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });

                // [NEW] Also log to analyticsEvents for the Admin Dashboard
                const analyticsRef = db.collection('analyticsEvents').doc();
                batch.set(analyticsRef, {
                    type: 'cardClick', // Note: Ad Views are technically 'impressions', but for now we might map them or just use a new type. 
                    // However, the dashboard expects 'search', 'cardClick', 'popupClick'. 
                    // Let's use a new type 'adView' if the dashboard supports it, OR reuse 'popupClick' as a proxy if needed? 
                    // Wait, the dashboard only counts 'searches', 'cardClicks', 'popupClicks'.
                    // If the user wants "Statistics ... connected to banners", they probably want CLICKS (cardClicks) and VIEWS (impressions).
                    // Let's log it as 'adView' and I will update the dashboard to read it? 
                    // OR, simply ensure CLICKS are logged as 'cardClick'.
                    // The instruction was "stats are useless... need to be connected to banners".
                    // The dashboard shows "Total Searches", "Clicks on Cards", "Clicks on Popups".
                    // Ad Views are NOT Clicks. I should probably NOT log views as clicks.
                    // I will log it as 'adView' for future proofing, but focus on the CLICK API for the dashboard metrics.
                    type: 'adImpression',
                    businessId: adId,
                    businessName: 'Ad Banner', // We might need to fetch the name, but for efficiency let's skip or pass it if possible.
                    timestamp: FieldValue.serverTimestamp(),
                    isAd: true
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
