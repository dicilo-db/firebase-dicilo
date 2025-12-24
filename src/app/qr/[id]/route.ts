import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const db = getAdminDb();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const qrId = params.id;

    try {
        // 1. Fetch the QR Campaign
        const docRef = db.collection('qr_campaigns').doc(qrId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();

            if (data?.targetUrl) {
                // 2. Increment Click Count (Async, fire and forget roughly)
                // We use update with FieldValue.increment ideally, but for simple MVP:
                docRef.update({
                    clicks: (data.clicks || 0) + 1,
                    lastClickAt: new Date()
                }).catch(err => console.error("Error updating stats", err));

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
        // Redirect to Dicilo home or a specific 404 for QRs
        return NextResponse.redirect(new URL('/', request.url));

    } catch (error) {
        console.error("QR Redirect Error:", error);
        return NextResponse.redirect(new URL('/', request.url));
    }
}
