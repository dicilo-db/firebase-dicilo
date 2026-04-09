import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Extract headers for IP/Country
        const country = req.headers.get('x-vercel-ip-country') 
                     || req.headers.get('x-country') 
                     || req.headers.get('x-appengine-country') 
                     || 'Unknown';

        const forwardIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const clientIp = forwardIp.split(',')[0].trim();
        
        // Basic anonymization of IP (Hash or discard last octet)
        const ipParts = clientIp.split('.');
        const anonymizedIp = ipParts.length === 4 
            ? `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0`
            : clientIp; // IPv6 fallback basic

        const db = getAdminDb();
        
        // Build the payload
        const visitData = {
            url: body.url || '/',
            referrer: body.referrer || '',
            screen: body.screen || 'Unknown',
            device: body.device || 'Desktop',
            browser: body.browser || 'Unknown',
            country: country,
            ipPrefix: anonymizedIp, 
            createdAt: new Date(),
        };

        // Write to Firestore securely via Admin SDK
        await db.collection('site_visits').add(visitData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to log metric:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
