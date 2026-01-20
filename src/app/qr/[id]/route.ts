import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const db = getAdminDb();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const qrId = params.id;
    const userAgent = request.headers.get('user-agent') || '';
    const purpose = request.headers.get('purpose') || request.headers.get('x-purpose') || request.headers.get('sec-purpose') || '';

    // Detect Prefetch/Preview headers from browsers/scanners
    const isPrefetch = purpose.toLowerCase().includes('prefetch') || purpose.toLowerCase().includes('preview');

    // Simple Bot Detection (Optional: can be expanded)
    const isBot = userAgent.toLowerCase().includes('bot') ||
        userAgent.toLowerCase().includes('crawler') ||
        userAgent.toLowerCase().includes('whatsapp') || // WhatsApp Link Preview
        userAgent.toLowerCase().includes('telegram') || // Telegram Link Preview
        userAgent.toLowerCase().includes('facebook');   // FB Crawler

    try {
        // 1. Fetch the QR Campaign
        const docRef = db.collection('qr_campaigns').doc(qrId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();

            if (data?.targetUrl) {
                // 2. Increment Click Count (Only if NOT a bot/prefetch)
                if (!isPrefetch && !isBot) {
                    // Use await to ensure serverless function doesn't kill the process before write
                    // Use FieldValue.increment for atomic updates
                    await docRef.update({
                        clicks: FieldValue.increment(1),
                        lastClickAt: new Date()
                    }).catch(err => console.error("Error updating stats", err));
                } else {
                    console.log(`QR Scan skipped (Bot/Prefetch): ${userAgent} | Purpose: ${purpose}`);
                }

                // 3. Redirect to the Target URL
                let destination = data.targetUrl;

                // Ensure protocol exists
                if (!destination.startsWith('http://') && !destination.startsWith('https://')) {
                    destination = `https://${destination}`;
                }

                return NextResponse.redirect(destination);
            }
        }

        // Fallback if not found or no URL
        return NextResponse.redirect(new URL('/', request.url));

    } catch (error) {
        console.error("QR Redirect Error:", error);
        return NextResponse.redirect(new URL('/', request.url));
    }
}
