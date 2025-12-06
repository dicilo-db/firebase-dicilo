
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        const { adId } = await request.json();

        if (!adId) {
            return NextResponse.json({ error: 'Missing adId' }, { status: 400 });
        }

        const adRef = adminDb.collection('ads_banners').doc(adId);

        // Simple increment for views. No charge.
        // We use update instead of transaction for speed/throughput since exact view count isn't financial critical.
        await adRef.update({
            views: FieldValue.increment(1)
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error logging ad view:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
