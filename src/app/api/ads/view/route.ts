
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, runTransaction, increment, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';

const db = getFirestore(app);

export async function POST(request: NextRequest) {
    try {
        const { adId, clientId } = await request.json();

        if (!adId || !clientId) {
            return NextResponse.json({ error: 'Missing adId or clientId' }, { status: 400 });
        }

        await runTransaction(db, async (transaction) => {
            // 1. Get Client Ref (Wallet)
            const clientRef = doc(db, 'clients', clientId);
            const clientDoc = await transaction.get(clientRef);

            if (!clientDoc.exists()) {
                throw new Error('Client not found');
            }

            const clientData = clientDoc.data();
            const currentBudget = clientData.budget_remaining || 0;
            // Default cost per view can be pulled from Ad doc or config.
            // For now we use the requested default 0.05
            const costPerView = 0.05;

            if (currentBudget < costPerView) {
                // Budget exhausted. We don't charge, and ideally we shouldn't have shown the ad.
                // We can throw or just return.
                // Return without error to not crash the client, but log it.
                console.warn(`Client ${clientId} is out of budget. View not charged.`);
                return;
            }

            // 2. Get Ad Ref (Metrics)
            const adRef = doc(db, 'ads', adId);
            // We don't strictly need to read the ad doc to increment, but might want to verify it exists.
            // For performance/cost we can blindly increment if we trust the ID.
            // However, let's just create a metric record or update the Ad doc.
            // The plan said "Increment ad.views". Assuming 'ads' collection has the ads.

            // 3. Updates
            // Deduct from client wallet
            transaction.update(clientRef, {
                budget_remaining: increment(-costPerView)
            });

            // Increment view count on the Ad itself
            transaction.update(adRef, {
                views: increment(1)
            });

            // Optional: Log to a granular 'ad_views' collection if we want detailed logs (ts, ip, etc)
            // but 'ads' + 'clients' update is ACID enough for the wallet system.
        });

        return NextResponse.json({ success: true, deducted: 0.05 });
    } catch (error) {
        console.error('Error logging ad view:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
