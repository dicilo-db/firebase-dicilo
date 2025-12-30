import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const linkId = searchParams.get('id');

    if (!linkId) {
        return NextResponse.json({ success: false, error: 'Missing link ID' }, { status: 400 });
    }

    try {
        const db = getAdminDb();

        // 1. IP Hashing for Fraud/Unique Check
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        const linkRef = db.collection('freelancer_links').doc(linkId);
        const clickTrackingRef = linkRef.collection('unique_clicks').doc(ipHash);

        // Run as transaction
        await db.runTransaction(async (t) => {
            const linkDoc = await t.get(linkRef);

            if (!linkDoc.exists) {
                return; // Link doesn't exist, nothing to track
            }

            const clickDoc = await t.get(clickTrackingRef);
            const data = linkDoc.data();

            // FRAUD CHECK: If this IP already clicked, do nothing
            if (clickDoc.exists) {
                return;
            }

            // --- Valid New Unique Click ---

            // 1. Register the click
            t.set(clickTrackingRef, {
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                ipHash: ipHash
            });

            // 2. Increment click count
            const newCount = (data?.clickCount || 0) + 1;
            const updates: any = {
                clickCount: newCount,
                lastClickAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // 3. BONUS LOGIC: Check if this click triggers the reward
            if (data?.monetizationActive && !data?.bonusPaidStatus && newCount >= 5) {
                const freelancerId = data.freelancerId;
                const bonusAmount = data.clickBonusAmount || 0.10;

                // Credit Freelancer Wallet
                const walletRef = db.collection('wallets').doc(freelancerId);
                t.update(walletRef, {
                    balance: admin.firestore.FieldValue.increment(bonusAmount),
                    totalEarned: admin.firestore.FieldValue.increment(bonusAmount),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                // Log Transaction
                const trxRef = db.collection('wallet_transactions').doc();
                t.set(trxRef, {
                    userId: freelancerId,
                    amount: bonusAmount,
                    type: 'CAMPAIGN_BONUS_TRAFFIC',
                    description: `Bono Objetivo: 5 Clics Únicos Alcanzados (Link: ${linkId})`,
                    campaignId: data.campaignId,
                    linkId: linkId,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });

                updates.bonusPaidStatus = true;
            }

            t.update(linkRef, updates);
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error(`[Tracking Error] Link ${linkId}:`, error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
