
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

        // Fetch Ad Data for Name
        const adDoc = await adRef.get();
        const adData = adDoc.data();
        const businessName = adData?.title || adData?.clientId || 'Unknown Ad';

        // Get IP and Client Info
        const ip = request.headers.get('x-forwarded-for') || 'Unknown';
        let country = 'Unknown';
        let city = 'Unknown';

        try {
            // Simple geolocation using ip-api.com (free for non-commercial)
            // In production, consider a paid service or a local database
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

        // Atomic increment of clicks AND Cost
        const batch = db.batch();
        batch.update(adRef, {
            clicks: FieldValue.increment(1),
            totalCost: FieldValue.increment(0.05) // Ensure atomic cost update
        });

        // 2. Log to analyticsEvents
        const analyticsRef = db.collection('analyticsEvents').doc();
        batch.set(analyticsRef, {
            type: 'cardClick',
            businessId: adId,
            businessName: businessName, // Real Name
            timestamp: FieldValue.serverTimestamp(),
            clickedElement: 'banner_click', // More specific
            isAd: true,
            userIp: ip,
            location: { country, city }
        });

        // 3. Log to ad_stats_daily
        const today = new Date();
        const dateKey = today.toISOString().split('T')[0];
        const statsId = `${adId}_${dateKey}`;
        const statsRef = db.collection('ad_stats_daily').doc(statsId);

        // Nested update for location counters is tricky with dot notation in variables
        // standard Firestore supports "locations.Germany.Berlin": FieldValue.increment(1)
        const updateData: any = {
            adId,
            date: dateKey,
            clicks: FieldValue.increment(1),
            cost: FieldValue.increment(0.05),
            updatedAt: FieldValue.serverTimestamp()
        };

        if (country !== 'Unknown') {
            updateData[`locations.${country}.clicks`] = FieldValue.increment(1);
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
