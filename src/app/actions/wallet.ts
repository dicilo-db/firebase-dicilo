'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

const MASTER_KEY = process.env.DICIPOINTS_MASTER_KEY; // Need to ensure this is set or handle fallback

/**
 * Gets the current global configuration for Dicipoints.
 */
async function getDicipointsConfig() {
    const db = getAdminDb();
    const doc = await db.collection('system_settings').doc('dicipoints').get();
    if (!doc.exists) {
        // Default config
        return { pointValue: 0.10 };
    }
    return doc.data() as { pointValue: number };
}

/**
 * Fetches wallet data for a user, including the current point value and EUR equivalent.
 */
export async function getWalletData(uid: string) {
    if (!uid) {
        return {
            balance: 0,
            pointValue: 0.10,
            valueInEur: 0,
            currency: 'EUR',
            history: [],
            totalEarned: 0
        };
    }
    const db = getAdminDb();

    // Get Wallet
    const walletDoc = await db.collection('wallets').doc(uid).get();
    const walletData = walletDoc.exists ? walletDoc.data() : { balance: 0, totalEarned: 0 };
    const balance = walletData?.balance || 0;

    // Get Config
    let pointValue = 0.10;
    try {
        const config = await getDicipointsConfig();
        pointValue = config.pointValue;
    } catch (e) {
        console.warn("Failed to fetch Dicipoints config, using default", e);
    }
    const valueInEur = balance * pointValue;

    // Get History (Limit 20)
    let history: any[] = [];
    try {
        const historySnap = await db.collection('wallet_transactions')
            .where('userId', '==', uid)
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();

        history = historySnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Timestamp to simple date string for serializability
            timestamp: doc.data().timestamp?.toDate().toISOString() || new Date().toISOString()
        }));
    } catch (e) {
        console.warn("Failed to fetch history", e);
    }

    return {
        balance,
        pointValue,
        valueInEur,
        currency: 'EUR',
        history,
        totalEarned: walletData?.totalEarned || 0
    };
}

const SECURITY_DOC = 'system_settings/dicipoints_security';

/**
 * Checks if a master password has been configured in the system.
 */
export async function isMasterPasswordSet() {
    const db = getAdminDb();
    const doc = await db.doc(SECURITY_DOC).get();
    return doc.exists && !!doc.data()?.password;
}

/**
 * Validates the provided master password against the database.
 */
/**
 * Validates the provided master password against the database.
 */
export async function verifyMasterPassword(password: string) {
    const db = getAdminDb();
    const doc = await db.doc(SECURITY_DOC).get();

    // Fallback to Env var if not set in DB yet (migration path)
    if (!doc.exists) {
        const envPass = process.env.DICIPOINTS_MASTER_KEY;
        return envPass ? envPass === password : false;
    }

    const stored = doc.data()?.password;
    return stored === password;
}

/**
 * Sets or Resets the Master Password.
 * PROTECTED: Should ideally be called only by Superadmin (caller verification handles this).
 */
export async function setMasterPassword(newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
    }
    const db = getAdminDb();
    await db.doc(SECURITY_DOC).set({
        password: newPassword,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
}

/**
 * Superadmin ONLY: Adjusts a user's balance manually.
 */
export async function adminAdjustBalance(targetUid: string, amount: number, reason: string, masterPass: string) {
    const isValid = await verifyMasterPassword(masterPass);
    if (!isValid) {
        return { success: false, message: 'Invalid Master Password' };
    }

    const db = getAdminDb();
    const batch = db.batch();

    const walletRef = db.collection('wallets').doc(targetUid);
    const trxRef = db.collection('wallet_transactions').doc();

    const increment = amount;

    // Create wallet if not exists (upsert)
    batch.set(walletRef, {
        balance: admin.firestore.FieldValue.increment(increment),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // Only increment totalEarned if adding points positive
        ...(amount > 0 ? { totalEarned: admin.firestore.FieldValue.increment(increment) } : {})
    }, { merge: true });

    batch.set(trxRef, {
        userId: targetUid,
        amount: amount,
        type: 'MANUAL_ADJUSTMENT',
        description: reason,
        adminId: 'SUPERADMIN',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    try {
        await batch.commit();
        revalidatePath('/admin/private-users');
        return { success: true, message: 'Balance adjusted successfully' };
    } catch (e) {
        console.error(e);
        return { success: false, message: 'Transaction failed' };
    }
}

/**
 * Superadmin ONLY: Updates the global point value.
 */
export async function adminUpdatePointValue(newValue: number, masterPass: string) {
    const isValid = await verifyMasterPassword(masterPass);
    if (!isValid) {
        return { success: false, message: 'Invalid Master Password' };
    }

    const db = getAdminDb();
    await db.collection('system_settings').doc('dicipoints').set({
        pointValue: newValue,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * Merchant: Process a payment/deduction.
 * Returns success and new balance.
 */
export async function processQrPayment(userId: string, merchantId: string, amountPoints: number) {
    const db = getAdminDb();

    try {
        const result = await db.runTransaction(async (t) => {
            const walletRef = db.collection('wallets').doc(userId);
            const doc = await t.get(walletRef);

            if (!doc.exists) {
                throw new Error("User has no wallet");
            }

            const currentBalance = doc.data()?.balance || 0;
            if (currentBalance < amountPoints) {
                throw new Error("Insufficient balance");
            }

            const newBalance = currentBalance - amountPoints;
            t.update(walletRef, {
                balance: newBalance,
                totalSpent: admin.firestore.FieldValue.increment(amountPoints)
            });

            // Log Transaction
            const trxRef = db.collection('wallet_transactions').doc();
            t.set(trxRef, {
                userId: userId,
                amount: -amountPoints,
                type: 'PURCHASE',
                merchantId: merchantId,
                description: `Payment to Merchant ${merchantId}`,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            return newBalance;
        });

        return { success: true, newBalance: result };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
