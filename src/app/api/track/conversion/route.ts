import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

async function trackConversion(request: NextRequest, linkId: string, orderId?: string, value?: number) {
    try {
        const db = getAdminDb();

        // 1. IP Hashing for Fraud/Unique Check
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        // Document ID for unique conversion. Use orderId if provided, otherwise ipHash combined with linkId
        const conversionDocId = orderId ? `${linkId}_order_${orderId}` : `${linkId}_ip_${ipHash}`;

        const linkRef = db.collection('freelancer_links').doc(linkId);
        const conversionTrackingRef = db.collection('conversions_tracking').doc(conversionDocId);

        let errorResponse: any = null;

        await db.runTransaction(async (t) => {
            const linkDoc = await t.get(linkRef);

            if (!linkDoc.exists) {
                errorResponse = { status: 404, message: 'Freelancer link not found' };
                return;
            }

            const conversionDoc = await t.get(conversionTrackingRef);
            
            // Duplicate Prevention: If this conversion was already logged, do nothing
            if (conversionDoc.exists) {
                errorResponse = { status: 200, message: 'Conversion already tracked', alreadyTracked: true };
                return;
            }

            const linkData = linkDoc.data();
            if (!linkData) {
                errorResponse = { status: 500, message: 'Invalid link data' };
                return;
            }

            const campaignId = linkData.campaignId;
            const freelancerId = linkData.freelancerId;
            const valueAmount = value || 0;

            // 1. Log the unique conversion in conversions_tracking
            t.set(conversionTrackingRef, {
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                linkId: linkId,
                campaignId: campaignId,
                freelancerId: freelancerId,
                paymentModel: linkData.paymentModel || 'fixed_plus_bonus',
                value: valueAmount,
                orderId: orderId || null,
                ipHash: ipHash,
                userAgent: request.headers.get('user-agent') || 'unknown'
            });

            // 2. Increment conversionCount in the freelancer link
            t.update(linkRef, {
                conversionCount: admin.firestore.FieldValue.increment(1),
                lastConversionAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // 3. Increment conversionCount in the Campaign
            const campaignRef = db.collection('campaigns').doc(campaignId);
            t.update(campaignRef, {
                conversionCount: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // 4. Log to global analyticsEvents for the Admin/Client dashboard overall stats
            const analyticsRef = db.collection('analyticsEvents').doc();
            t.set(analyticsRef, {
                type: 'conversion',
                businessId: campaignId,
                businessName: linkData.companyName || 'Campaign',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                clickedElement: 'freelancer_conversion',
                isAd: false,
                userIp: ip,
                details: `Conversión por Freelancer ${freelancerId}`,
                meta: {
                    linkId: linkId,
                    value: valueAmount,
                    orderId: orderId || null
                }
            });
        });

        if (errorResponse) {
            return NextResponse.json(
                { success: errorResponse.status === 200, message: errorResponse.message, alreadyTracked: errorResponse.alreadyTracked },
                { status: errorResponse.status }
            );
        }

        return NextResponse.json({ success: true, message: 'Conversion tracked successfully' });

    } catch (error) {
        console.error(`[Conversion Tracking Error] Link ${linkId}:`, error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST endpoint - Receives payload in body
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { linkId, orderId, value } = body;

        if (!linkId) {
            return NextResponse.json({ success: false, error: 'Missing linkId' }, { status: 400 });
        }

        const valueNum = value ? parseFloat(value) : 0;
        return await trackConversion(request, linkId, orderId, valueNum);
    } catch (e) {
        return NextResponse.json({ success: false, error: 'Malformed JSON payload' }, { status: 400 });
    }
}

// GET endpoint - Receives payload in query params (useful for simple pixel triggers / redirection campaigns)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const linkId = searchParams.get('linkId') || searchParams.get('id');
    const orderId = searchParams.get('orderId');
    const valueStr = searchParams.get('value');

    if (!linkId) {
        return NextResponse.json({ success: false, error: 'Missing linkId parameter' }, { status: 400 });
    }

    const valueNum = valueStr ? parseFloat(valueStr) : 0;
    return await trackConversion(request, linkId, orderId || undefined, valueNum);
}
