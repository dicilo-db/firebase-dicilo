import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const linkId = params.id;
    // Fallback URL if everything fails
    const DEFAULT_REDIRECT = 'https://dicilo.net';

    // 1. FAIL-SAFE: Capture 'dest' param EARLY
    // If DB fails or link invalid, we still want to redirect the user if possible.
    let overrideDestination: string | null = null;

    // Robust extraction attempt using standard URL API if nextUrl is quirky
    try {
        const fullUrl = new URL(request.url);
        const rawDest = fullUrl.searchParams.get('dest');

        if (rawDest) {
            // Express/Node usually decodes, but we ensure it here to be safe as requested
            const decodedDest = decodeURIComponent(rawDest);
            // Basic validation: Must be http or https
            if (decodedDest.startsWith('http://') || decodedDest.startsWith('https://')) {
                overrideDestination = decodedDest;
            }
        }
    } catch (e) {
        // Fallback or ignore invalid URLs
    }

    if (!linkId) {
        return NextResponse.redirect(overrideDestination || DEFAULT_REDIRECT);
    }

    try {
        const db = getAdminDb();

        // 1. IP Hashing for Fraud/Unique Check
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        const linkRef = db.collection('freelancer_links').doc(linkId);
        const clickTrackingRef = linkRef.collection('unique_clicks').doc(ipHash);

        // Run as transaction to ensure atomic updates for payments & counting
        const targetUrl = await db.runTransaction(async (t) => {
            const linkDoc = await t.get(linkRef);

            // If link doesn't exist in DB, check if we have override
            if (!linkDoc.exists) {
                // Return override if available (Fail-safe for invalid IDs), otherwise default
                return overrideDestination || DEFAULT_REDIRECT;
            }

            const clickDoc = await t.get(clickTrackingRef);

            const data = linkDoc.data();
            // Default destination from DB
            let destination = data?.targetUrl || DEFAULT_REDIRECT;

            // Apply Override if valid
            if (overrideDestination) {
                destination = overrideDestination;
            }

            // FRAUD CHECK: If this IP already clicked, just redirect, do NOT increment or pay.
            if (clickDoc.exists) {
                return destination;
            }

            // --- Valid New Unique Click ---

            // 1. Register the click for this IP
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
            return destination;
        });

        return NextResponse.redirect(targetUrl);

    } catch (error) {
        console.error(`[Redirect Error] Link ${linkId}:`, error);
        // CRITICAL FAIL-SAFE: Redirect to override if DB fails
        return NextResponse.redirect(overrideDestination || DEFAULT_REDIRECT);
    }
}
