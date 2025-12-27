import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const linkId = params.id;
    // Fallback URL if everything fails
    const DEFAULT_REDIRECT = 'https://dicilo.net';

    if (!linkId) {
        return NextResponse.redirect(DEFAULT_REDIRECT);
    }

    const db = getAdminDb();
    const linkRef = db.collection('freelancer_links').doc(linkId);

    try {
        // Run as transaction to ensure atomic updates for payments
        const targetUrl = await db.runTransaction(async (t) => {
            const doc = await t.get(linkRef);

            // If link doesn't exist, return default but don't fail transaction
            if (!doc.exists) {
                return DEFAULT_REDIRECT;
            }

            const data = doc.data();
            const destination = data?.targetUrl || DEFAULT_REDIRECT;

            // Increment click count
            const newCount = (data?.clickCount || 0) + 1;

            const updates: any = {
                clickCount: newCount,
                lastClickAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // BONUS LOGIC: Check if this click triggers the reward
            // Rule: "SI clics_unicos llega a 5 Y bono_click_pagado es FALSE"
            // Note: For MVP we calculate raw clicks. Real unique IP check would go here.

            if (data?.monetizationActive && !data?.bonusPaidStatus && newCount >= 5) {
                // Threshold reached!
                const freelancerId = data.freelancerId;
                const bonusAmount = data.clickBonusAmount || 0.10;

                // 1. Credit Freelancer Wallet
                const walletRef = db.collection('wallets').doc(freelancerId);
                t.update(walletRef, {
                    balance: admin.firestore.FieldValue.increment(bonusAmount),
                    totalEarned: admin.firestore.FieldValue.increment(bonusAmount),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                // 2. Log Transaction
                const trxRef = db.collection('wallet_transactions').doc();
                t.set(trxRef, {
                    userId: freelancerId,
                    amount: bonusAmount,
                    type: 'CAMPAIGN_BONUS_TRAFFIC',
                    description: `Bono Objetivo: 5 Clics Alcanzados (Link: ${linkId})`,
                    campaignId: data.campaignId,
                    linkId: linkId,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });

                // 3. Mark as Paid & Deactivate further monetization
                updates.bonusPaidStatus = true;
                updates.monetizationActive = false;
            }

            t.update(linkRef, updates);
            return destination;
        });

        return NextResponse.redirect(targetUrl);

    } catch (error) {
        console.error(`[Redirect Error] Link ${linkId}:`, error);
        // In case of any error (DB down, etc), try to redirect to home gracefully
        return NextResponse.redirect(DEFAULT_REDIRECT);
    }
}
