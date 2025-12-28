import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const linkId = params.id;
    // Fallback URL if everything fails
    const DEFAULT_REDIRECT = 'https://dicilo.net';

    if (!linkId) {
        return NextResponse.redirect(DEFAULT_REDIRECT);
    }

    // 1. Get IP Address for Fraud Protection
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

    // Hash IP to preserve privacy but allow uniqueness check
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    const db = getAdminDb();
    const linkRef = db.collection('freelancer_links').doc(linkId);
    const clickTrackingRef = linkRef.collection('unique_clicks').doc(ipHash);

    try {
        // Run as transaction to ensure atomic updates for payments & counting
        const targetUrl = await db.runTransaction(async (t) => {
            const linkDoc = await t.get(linkRef);
            const clickDoc = await t.get(clickTrackingRef);

            // If link doesn't exist, return default
            if (!linkDoc.exists) {
                return DEFAULT_REDIRECT;
            }

            const data = linkDoc.data();
            const destination = data?.targetUrl || DEFAULT_REDIRECT;

            // FRAUD CHECK: If this IP already clicked, just redirect, do NOT increment or pay.
            if (clickDoc.exists) {
                return destination;
            }

            // --- Valid New Unique Click ---

            // 1. Register the click for this IP
            t.set(clickTrackingRef, {
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                ipHash: ipHash // redundancy
            });

            // 2. Increment click count
            const newCount = (data?.clickCount || 0) + 1;
            const updates: any = {
                clickCount: newCount,
                lastClickAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // 3. BONUS LOGIC: Check if this click triggers the reward
            // Rule: "If unique clicks reaches 5 AND bonus not paid"

            if (data?.monetizationActive && !data?.bonusPaidStatus && newCount >= 5) {
                // Threshold reached!
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

                // Mark as Paid & Deactivate further monetization for THIS specific goal
                updates.bonusPaidStatus = true;
                // Note: We might keep monetizationActive true if we have higher tiers later, 
                // but for this specific rule, we mark the bonus as paid.
            }

            t.update(linkRef, updates);
            return destination;
        });

        return NextResponse.redirect(targetUrl);

    } catch (error) {
        console.error(`[Redirect Error] Link ${linkId}:`, error);
        return NextResponse.redirect(DEFAULT_REDIRECT);
    }
}
