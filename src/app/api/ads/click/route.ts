
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { adId, clientId } = body;
        const type = body.type || 'click'; // 'click' | 'share'

        if (!adId) {
            return NextResponse.json({ error: 'Missing adId' }, { status: 400 });
        }

        const db = getAdminDb();
        const adRef = db.collection('ads_banners').doc(adId);

        // Fetch Ad Data for Name
        const adDoc = await adRef.get();
        const adData = adDoc.data();
        const businessName = adData?.title || adData?.clientId || 'Unknown Ad';

        // Get IP and Client Info
        const ip = request.headers.get('x-forwarded-for') || 'Unknown';
        let country = 'Unknown';
        let city = 'Unknown';

        try {
            const geoRes = await fetch(`http://ip-api.com/json/${ip.split(',')[0].trim()}`);
            if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.status === 'success') {
                    country = geoData.country || 'Unknown';
                    city = geoData.city || 'Unknown';
                }
            }
        } catch (e) {
            console.error('Geo lookup failed:', e);
        }

        // Determine Client ID (from body or fallback to ad document)
        const finalClientId = clientId || adData?.clientId;

        // Atomic increment of clicks/shares AND Cost
        const batch = db.batch();

        if (type === 'share') {
            batch.update(adRef, {
                shares: FieldValue.increment(1),
                totalCost: FieldValue.increment(0.05)
            });
        } else {
            batch.update(adRef, {
                clicks: FieldValue.increment(1),
                totalCost: FieldValue.increment(0.05)
            });
        }

        // DECREMENT CLIENT BUDGET
        if (finalClientId) {
            const clientRef = db.collection('clients').doc(finalClientId);
            batch.update(clientRef, {
                budget_remaining: FieldValue.increment(-0.05),
                total_invested: FieldValue.increment(0.05)
            });
        } else {
            console.warn(`Ad Click: No clientId found for adId ${adId}. Budget not deducted.`);
        }

        // 2. Log to analyticsEvents
        const analyticsRef = db.collection('analyticsEvents').doc();
        batch.set(analyticsRef, {
            type: type === 'share' ? 'socialClick' : 'cardClick',
            businessId: adId,
            businessName: businessName,
            timestamp: FieldValue.serverTimestamp(),
            clickedElement: type === 'share' ? 'banner_share' : 'banner_click',
            isAd: true,
            userIp: ip,
            location: { country, city },
            details: body.details || (type === 'share' ? 'share_action' : undefined)
        });

        // 3. Log to ad_stats_daily
        const today = new Date();
        const dateKey = today.toISOString().split('T')[0];
        const statsId = `${adId}_${dateKey}`;
        const statsRef = db.collection('ad_stats_daily').doc(statsId);

        const updateData: any = {
            adId,
            date: dateKey,
            cost: FieldValue.increment(0.05),
            updatedAt: FieldValue.serverTimestamp()
        };

        if (type === 'share') {
            updateData.socialClickCount = FieldValue.increment(1);
        } else {
            updateData.clicks = FieldValue.increment(1);
        }

        if (country !== 'Unknown') {
            const metricKey = type === 'share' ? 'shares' : 'clicks';
            updateData[`locations.${country}.${metricKey}`] = FieldValue.increment(1);
            if (city !== 'Unknown') {
                updateData[`locations.${country}.cities.${city}`] = FieldValue.increment(1);
            }
        }

        batch.set(statsRef, updateData, { merge: true });

        await batch.commit();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error logging ad click:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
