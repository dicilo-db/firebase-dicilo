import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id: clientId } = params;
        const searchParams = request.nextUrl.searchParams;
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        if (!clientId) {
            return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
        }

        const db = getAdminDb();

        // Query `ad_stats_daily` collecting where clientId matches
        // Note: ad_stats_daily documents are ID'ed as `adId_YYYY-MM-DD`.
        // They contain `clientId` field (we need to ensure this in ads/view, but assumes it exists or we query ads first).

        // Actually, looking at ads/view/route.ts, it doesn't explicitly save `clientId` to stats doc, 
        // BUT it saves `adId`. We might need to query all ads for this client first.

        // Step 1: Get all Ad IDs for this client
        const adsSnapshot = await db.collection('ads_banners')
            .where('clientId', '==', clientId)
            .get();

        const adIds = adsSnapshot.docs.map(doc => doc.id);

        if (adIds.length === 0) {
            return NextResponse.json({ stats: [] });
        }

        // Calculate Overall Totals from `ads_banners` (Source of Truth for Cards)
        const overallTotals = adsSnapshot.docs.reduce((acc, doc) => {
            const data = doc.data();
            return {
                views: acc.views + (data.views || 0),
                clicks: acc.clicks + (data.clicks || 0),
                shares: acc.shares + (data.shares || 0),
                cost: acc.cost + (data.totalCost || 0) // Or calculate: ((data.clicks||0) + (data.shares||0)) * 0.05
            };
        }, { views: 0, clicks: 0, shares: 0, cost: 0 });

        // Step 2: Query stats for these ads
        // Firestore `in` query supports up to 10 items. If client has more, we need to batch or query by adId individually.
        // For simplicity and scalability, let's query ad_stats_daily where `adId` is in the list.
        // Or if we saved `clientId` on the stats doc, it would be easier. 
        // Let's assume for now we might need to do multiple queries if many ads.

        // BETTER APPROACH for now: Query `ad_stats_daily` for each adId. 
        // Typically a client has few ads (1-5).

        let allStats: any[] = [];

        for (const adId of adIds) {
            let query = db.collection('ad_stats_daily').where('adId', '==', adId);

            if (start) {
                query = query.where('date', '>=', start);
            }
            if (end) {
                query = query.where('date', '<=', end);
            }

            const statsSnap = await query.get();
            statsSnap.forEach(doc => allStats.push(doc.data()));
        }

        // Aggregate by Date
        const statsByDate: Record<string, any> = {};

        allStats.forEach(stat => {
            const date = stat.date; // YYYY-MM-DD
            if (!statsByDate[date]) {
                statsByDate[date] = {
                    date,
                    views: 0,
                    clicks: 0,
                    cost: 0,
                    shares: 0,
                    driveToStoreCount: 0,
                    socialClickCount: 0,
                    topPositionCount: 0
                };
            }
            statsByDate[date].views += (stat.views || 0);
            statsByDate[date].clicks += (stat.clicks || 0);
            statsByDate[date].cost += (stat.cost || 0); // Assuming cost is stored, else calculate
            statsByDate[date].shares += (stat.shares || 0);
            statsByDate[date].driveToStoreCount += (stat.driveToStoreCount || 0);
            statsByDate[date].socialClickCount += (stat.socialClickCount || 0);
            statsByDate[date].topPositionCount += (stat.topPositionCount || 0);
        });

        // Convert to array and sort
        const aggregatedStats = Object.values(statsByDate).sort((a: any, b: any) =>
            a.date.localeCompare(b.date)
        );

        return NextResponse.json({
            stats: aggregatedStats,
            overallTotals, // <--- Added this
            debug: { matchedAds: adIds.length, rawRows: allStats.length }
        });

    } catch (error: any) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
