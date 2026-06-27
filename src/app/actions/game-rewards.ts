'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function addGameReward(userId: string, dp: number, game: string) {
    if (!userId || dp <= 0) return { success: false, error: 'Invalid params' };

    const db = getAdminDb();
    try {
        await db.runTransaction(async (t) => {
            const walletRef = db.collection('wallets').doc(userId);
            t.set(walletRef, {
                balance: admin.firestore.FieldValue.increment(dp),
                totalEarned: admin.firestore.FieldValue.increment(dp),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            const trxRef = db.collection('wallet_transactions').doc();
            t.set(trxRef, {
                userId,
                amount: dp,
                type: 'GAME_REWARD',
                description: `Premio juego: ${game} (+${dp} DP)`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        return { success: true };
    } catch (e) {
        console.error('addGameReward failed', e);
        return { success: false, error: String(e) };
    }
}
