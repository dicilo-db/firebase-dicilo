
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { campaignId, freelancerId, targetUrl, selectedImageUrl, assetId, language, existingId, text } = body;

        if (!campaignId || !freelancerId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = getAdminDb();

        let shortId = existingId;

        if (shortId) {
            const docRef = db.collection('freelancer_links').doc(shortId);
            const doc = await docRef.get();
            if (doc.exists) {
                const data = doc.data();
                // Only allow updating if it belongs to user
                if (data?.freelancerId === freelancerId) {
                    await docRef.update({
                        targetUrl: targetUrl || data?.targetUrl,
                        selectedImageUrl: selectedImageUrl || data?.selectedImageUrl,
                        assetId: assetId || data?.assetId,
                        language: language || data?.language,
                        messageText: text || '', // Store for OG Desc
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    return NextResponse.json({
                        success: true,
                        shortId: shortId,
                        shortUrl: `https://dicilo.net/r/${shortId}`
                    });
                }
            }
            // If not found or mismatch, fall through to create new? Or error?
            // Let's create new to be safe/robust
        }

        // Generate Short ID (7 chars)
        shortId = Math.random().toString(36).substring(2, 9);

        const linkRef = db.collection('freelancer_links').doc(shortId);

        // Create Draft Link
        await linkRef.set({
            linkId: shortId,
            freelancerId,
            campaignId,
            targetUrl: targetUrl || 'https://dicilo.net',
            selectedImageUrl: selectedImageUrl || '',
            assetId: assetId || null,
            language: language || 'en',
            messageText: text || '', // Initial text

            // Status flags
            monetizationActive: false, // Inactive until post confirmed
            status: 'draft',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),

            // Analytics init
            clickCount: 0
        });

        return NextResponse.json({
            success: true,
            shortId: shortId,
            shortUrl: `https://dicilo.net/r/${shortId}`
        });

    } catch (error: any) {
        console.error('Shortener Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
