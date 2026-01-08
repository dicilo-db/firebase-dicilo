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

    // Get Config for display purposes
    let pointValue = 0.10;
    try {
        const config = await getDicipointsConfig();
        pointValue = config.pointValue;
    } catch (e) {
        console.warn("Failed to fetch Dicipoints config, using default", e);
    }

    // EUR Balance is now separate from DP, earned via commissions
    const valueInEur = walletData?.eurBalance || 0;

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

/**
 * Syncs the user's wallet with their confirmed referrals.
 * Checks for missing 'REFERRAL_BONUS' transactions for each referral in the profile
 * and credits +50 DP per missing referral.
 */
export async function syncReferralRewards(uid: string) {
    const POINTS_PER_REFERRAL = 50;
    const db = getAdminDb();

    try {
        // 1. Get User Profile (Source of Truth for Referrals)
        const profileSnap = await db.collection('private_profiles').doc(uid).get();
        if (!profileSnap.exists) return { success: false, message: 'User profile not found' };

        const profileData = profileSnap.data();
        const referrals = profileData?.referrals || [];

        if (referrals.length === 0) return { success: true, message: 'No referrals to sync.' };

        // 2. Get Existing Referral Transactions
        const trxSnap = await db.collection('wallet_transactions')
            .where('userId', '==', uid)
            .where('type', '==', 'REFERRAL_BONUS')
            .get();

        // Map of already paid referral UIDs
        const paidReferralIds = new Set<string>();
        trxSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.referralUid) {
                paidReferralIds.add(data.referralUid);
            }
        });

        // 3. Identify Unpaid Referrals
        const unpaidReferrals = referrals.filter((ref: any) => {
            // ref can be an object { uid, ... } or string ID depending on legacy data structure
            const refId = typeof ref === 'object' ? ref.uid : ref;
            // Only count if valid ID and not already paid
            return refId && !paidReferralIds.has(refId);
        });

        if (unpaidReferrals.length === 0) {
            return { success: true, message: 'All referrals already rewarded.' };
        }

        // 4. Batch Update
        const batch = db.batch();
        const walletRef = db.collection('wallets').doc(uid);

        // Calculate Total
        const totalPointsToAdd = unpaidReferrals.length * POINTS_PER_REFERRAL;

        // Upsert Wallet
        batch.set(walletRef, {
            balance: admin.firestore.FieldValue.increment(totalPointsToAdd),
            totalEarned: admin.firestore.FieldValue.increment(totalPointsToAdd),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Create Transactions
        unpaidReferrals.forEach((ref: any) => {
            const refId = typeof ref === 'object' ? ref.uid : ref;

            const trxRef = db.collection('wallet_transactions').doc();
            batch.set(trxRef, {
                userId: uid,
                amount: POINTS_PER_REFERRAL,
                type: 'REFERRAL_BONUS',
                referralUid: refId,
                description: `Bono por referido 50DP`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                metaCreated: new Date().toISOString()
            });
        });

        await batch.commit();

        revalidatePath('/dashboard');
        return { success: true, message: `Synced ${unpaidReferrals.length} referrals (+${totalPointsToAdd} DP)` };

    } catch (error: any) {
        console.error('Sync Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Superadmin ONLY: Process a "Cash Register" manual payment.
 * Handles both DiciPoints and EUR (Prepaid Card) updates atomically.
 * Verifies User Identity (UID + Email + Optional Code) before processing.
 */
export async function adminProcessManualPayment(
    payload: {
        targetUid: string;
        targetEmail: string;
        targetCode?: string; // Optional unique code verification
        pointsAmount: number;
        pointsReason: string;
        cashAmount: number;
        cashReason: string;
        referenceNote: string;
        customDate: string; // ISO String for backdating
        masterKey: string;
    }
) {
    const {
        targetUid, targetEmail, targetCode,
        pointsAmount, pointsReason,
        cashAmount, cashReason,
        referenceNote, customDate, masterKey
    } = payload;

    // 1. Security Check
    const isValid = await verifyMasterPassword(masterKey);
    if (!isValid) {
        return { success: false, message: 'Invalid Master Password / Access Denied' };
    }

    const db = getAdminDb();

    // 2. Identity Verification
    const profileSnap = await db.collection('private_profiles').doc(targetUid).get();
    if (!profileSnap.exists) {
        return { success: false, message: `User with UID ${targetUid} not found.` };
    }

    const userData = profileSnap.data();
    if (userData?.email !== targetEmail) {
        return { success: false, message: `Email mismatch! UID belongs to ${userData?.email}, not ${targetEmail}.` };
    }

    if (targetCode) {
        // Check if code matches either uniqueCode or any other code field if needed
        // Assuming 'uniqueCode' is the field name based on previous valid code
        if (userData?.uniqueCode !== targetCode && userData?.code !== targetCode) {
            return { success: false, message: `Unique Code mismatch for this user.` };
        }
    }

    // 3. Prepare Batch
    const batch = db.batch();
    const walletRef = db.collection('wallets').doc(targetUid);

    // Ensure wallet exists
    batch.set(walletRef, {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const timestamp = customDate ? new Date(customDate) : new Date();
    const firestoreTimestamp = admin.firestore.Timestamp.fromDate(timestamp);

    // 4. Handle DiciPoints
    if (pointsAmount !== 0) {
        batch.set(walletRef, {
            balance: admin.firestore.FieldValue.increment(pointsAmount),
            // Only increment 'earned' if positive addition
            ...(pointsAmount > 0 ? { totalEarned: admin.firestore.FieldValue.increment(pointsAmount) } : {})
        }, { merge: true });

        const pointsTrxRef = db.collection('wallet_transactions').doc();
        batch.set(pointsTrxRef, {
            userId: targetUid,
            amount: pointsAmount,
            type: 'MANUAL_POINTS', // Specific type for manual register
            description: `${pointsReason} - ${referenceNote}`,
            adminId: 'SUPERADMIN', // Could be dynamic if we had admin sessions
            timestamp: firestoreTimestamp,
            meta: {
                reasonCategory: pointsReason,
                manualNote: referenceNote,
                source: 'CASH_REGISTER'
            }
        });
    }

    // 5. Handle Cash (EUR / Prepaid Card)
    if (cashAmount !== 0) {
        batch.set(walletRef, {
            eurBalance: admin.firestore.FieldValue.increment(cashAmount)
        }, { merge: true });

        const cashTrxRef = db.collection('wallet_transactions').doc();
        batch.set(cashTrxRef, {
            userId: targetUid,
            amount: cashAmount,
            currency: 'EUR', // Mark as EUR transaction
            type: 'MANUAL_CASH',
            description: `${cashReason} - ${referenceNote}`,
            adminId: 'SUPERADMIN',
            timestamp: firestoreTimestamp,
            meta: {
                reasonCategory: cashReason,
                manualNote: referenceNote,
                source: 'CASH_REGISTER'
            }
        });
    }

    try {
        await batch.commit();
        revalidatePath('/admin/dicipoints');
        revalidatePath('/admin/freelancers');

        return {
            success: true,
            message: 'Transaction processed successfully',
            data: {
                userName: userData?.name || 'Unknown',
                userEmail: userData?.email,
                userCode: userData?.uniqueCode || 'N/A',
                timestamp: timestamp.toISOString()
            }
        };
    } catch (e: any) {
        console.error("Manual Payment Error:", e);
        return { success: false, message: 'Transaction failed: ' + e.message };
    }
}
