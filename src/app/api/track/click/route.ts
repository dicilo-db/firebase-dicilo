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
                ipHash: ipHash,
                userAgent: request.headers.get('user-agent') || 'unknown'
            });

            // 2. Increment click count
            const newCount = (data?.clickCount || 0) + 1;
            const updates: any = {
                clickCount: newCount,
                lastClickAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // 3. REVENUE SHARE LOGIC (Conditional V1 vs V2)
            const paymentModel = data.paymentModel || 'legacy_rev_share';

            if (paymentModel === 'fixed_plus_bonus') {
                // --- V2 LOGIC: Bonus at 5 Clicks ---
                const UNIQUE_CLICKS_THRESHOLD = 5;
                const BONUS_AMOUNT = 0.10;

                // Check if we just hit the threshold and haven't paid yet
                if (newCount === UNIQUE_CLICKS_THRESHOLD && !data.bonusPaidStatus) {
                    const freelancerId = data.freelancerId;

                    // Credit Wallet
                    const walletRef = db.collection('wallets').doc(freelancerId);

                    t.update(walletRef, {
                        balance: admin.firestore.FieldValue.increment(BONUS_AMOUNT),
                        totalEarned: admin.firestore.FieldValue.increment(BONUS_AMOUNT),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    // Log Transaction
                    const trxRef = db.collection('wallet_transactions').doc();
                    t.set(trxRef, {
                        userId: freelancerId,
                        amount: BONUS_AMOUNT,
                        type: 'CAMPAIGN_BONUS_PERFORMANCE',
                        description: `Bono Rendimiento (5 Clics): ${data.campaignId}`,
                        campaignId: data.campaignId,
                        linkId: linkId,
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    });

                    // Mark as Paid
                    updates.bonusPaidStatus = true;
                    updates.bonusPaidAt = admin.firestore.FieldValue.serverTimestamp();
                }

            } else {
                // --- LEGACY V1 LOGIC: Revenue Share ---
                // Fetch Campaign to get the actual rate
                const campaignRef = db.collection('campaigns').doc(data.campaignId);
                const campaignDoc = await t.get(campaignRef);

                const campaignData = campaignDoc.exists ? campaignDoc.data() : null;
                const ratePerClick = campaignData?.rate_per_click || 0.05; // Default safe 0.05 if missing

                const freelancerShare = ratePerClick * 0.60;
                const platformShare = ratePerClick * 0.40;

                if (campaignData && freelancerShare > 0) {
                    const freelancerId = data.freelancerId;

                    // Credit Freelancer Wallet
                    const walletRef = db.collection('wallets').doc(freelancerId);
                    const walletDoc = await t.get(walletRef);
                    const currentTotalEarned = (walletDoc.data()?.totalEarned || 0) + freelancerShare;

                    t.update(walletRef, {
                        balance: admin.firestore.FieldValue.increment(freelancerShare),
                        totalEarned: admin.firestore.FieldValue.increment(freelancerShare),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    // Detailed Transaction Log
                    const trxRef = db.collection('wallet_transactions').doc();
                    t.set(trxRef, {
                        userId: freelancerId,
                        amount: freelancerShare,
                        type: 'CAMPAIGN_CLICK_REWARD',
                        description: `Pago por Click (60%): ${campaignData.name || 'Campaign'}`,
                        campaignId: data.campaignId,
                        linkId: linkId,
                        timestamp: admin.firestore.FieldValue.serverTimestamp(),
                        meta: {
                            rate_per_click: ratePerClick,
                            platform_share: platformShare,
                            ip_hash: ipHash
                        }
                    });

                    // KYC CHECK (> 2000 DiciCoins/EUR)
                    if (currentTotalEarned > 2000) {
                        const profileRef = db.collection('private_profiles').doc(freelancerId);
                        t.set(profileRef, { kycStatus: 'required' }, { merge: true });
                    }
                }
            }

            t.update(linkRef, updates);
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error(`[Tracking Error] Link ${linkId}:`, error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
