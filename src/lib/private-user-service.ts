import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

/**
 * Generates a unique code for a private user using Admin SDK.
 */
export async function generateUniqueCodeAdmin(firstName: string, lastName: string, phoneNumber: string): Promise<string> {
    const prefix = 'DHH';
    const year = new Date().getFullYear().toString().slice(-2);
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    const initials = `${firstInitial}${lastInitial}`;

    const db = getAdminDb();
    const counterRef = db.collection('counters').doc('private_users');

    try {
        const newCode = await db.runTransaction(async (t) => {
            const doc = await t.get(counterRef);
            let currentCount = 0;
            if (doc.exists) {
                currentCount = doc.data()?.count || 0;
            }

            const nextCount = currentCount + 1;
            t.set(counterRef, { count: nextCount }, { merge: true });

            const sequenceStr = nextCount.toString().padStart(5, '0');
            return `${prefix}${year}${initials}${sequenceStr}`;
        });

        return newCode;
    } catch (error) {
        console.error('Error generating unique code:', error);
        throw new Error('Failed to generate unique code');
    }
}

export async function createPrivateUserProfile(
    uid: string,
    data: {
        firstName: string;
        lastName: string;
        email: string;
        whatsapp?: string;
        phone?: string;
        contactType?: 'whatsapp' | 'telegram';
        referralCode?: string;
        inviteId?: string;
    }
) {
    const { firstName, lastName, email, whatsapp, phone, contactType, referralCode, inviteId } = data;

    const db = getAdminDb();

    // Check if exists
    const docRef = db.collection('private_profiles').doc(uid);
    const existing = await docRef.get();
    if (existing.exists) return { success: false, message: 'Profile already exists', profile: existing.data() };

    const phoneForCode = whatsapp || phone || '000';
    const uniqueCode = await generateUniqueCodeAdmin(firstName, lastName, phoneForCode);

    // Referral Logic
    let referrerUid: string | null = null;
    let initialBalance = 0;

    let inviteDocRef: admin.firestore.DocumentReference | null = null;

    if (inviteId) {
        // 1. Priority: Validate via Pioneer Invite ID
        const inviteSnapshot = await db.collection('referrals_pioneers').doc(inviteId).get();
        if (inviteSnapshot.exists) {
            const inviteData = inviteSnapshot.data();
            // Verify email matches? Optional but good practice.
            // if (inviteData?.friendEmail === email) ... 

            referrerUid = inviteData?.referrerId || null;
            if (referrerUid) {
                initialBalance = 50; // Welcome Bonus for Pioneer
                inviteDocRef = inviteSnapshot.ref;
            }
        }
    }

    if (!referrerUid && referralCode) {
        // 2. Fallback: Validate via Standard Referral Code
        referrerUid = await validateReferralCode(referralCode);
        if (referrerUid) {
            initialBalance = 50; // Welcome Bonus standard
        }
    }

    const batch = db.batch();

    // 1. Create Profile
    const profileData = {
        uid,
        email,
        firstName,
        lastName,
        uniqueCode,
        contactPreferences: {
            whatsapp: contactType === 'whatsapp' ? (whatsapp || phone || '') : '',
            telegram: contactType === 'telegram' ? (whatsapp || phone || '') : '',
            email: true,
            frequency: 'weekly',
        },
        interests: [],
        profileData: {
            travelInterest: null,
            multiplierInterest: false,
            rewardPreference: null,
            hobbies: '',
            socialGroup: 'none',
        },
        referrals: [],
        referredBy: referrerUid || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    batch.set(docRef, profileData);

    // 2. Create Wallet for New User
    const walletRef = db.collection('wallets').doc(uid);
    batch.set(walletRef, {
        balance: initialBalance,
        totalEarned: initialBalance,
        totalSpent: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3. Transactions & Referrer Rewards
    if (initialBalance > 0) {
        // Log Welcome Bonus
        const trxRef = db.collection('wallet_transactions').doc();
        batch.set(trxRef, {
            userId: uid,
            amount: 50,
            type: 'WELCOME_BONUS',
            description: 'Welcome Bonus (Referred by ' + (referralCode || 'Friend') + ')',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    if (referrerUid) {
        // Reward Referrer (+20)
        const referrerWalletRef = db.collection('wallets').doc(referrerUid);
        batch.set(referrerWalletRef, {
            balance: admin.firestore.FieldValue.increment(20),
            totalEarned: admin.firestore.FieldValue.increment(20),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Log Referrer Reward
        const refTrxRef = db.collection('wallet_transactions').doc();
        batch.set(refTrxRef, {
            userId: referrerUid,
            amount: 20,
            type: 'REFERRAL_REWARD',
            description: 'Referral Reward (User: ' + uniqueCode + ')',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update Referrer Profile (add to referrals list)
        // We need to read existing referrals or just arrayUnion. batch supports arrayUnion.
        const referrerProfileRef = db.collection('private_profiles').doc(referrerUid);
        batch.update(referrerProfileRef, {
            referrals: admin.firestore.FieldValue.arrayUnion({
                uid: uid,
                code: uniqueCode,
                joinedAt: new Date().toISOString() // Approximate time, okay for list
            })
        });
    }

    // 4. Update Pioneer Invite Status (if applicable)
    if (inviteDocRef) {
        batch.update(inviteDocRef, {
            status: 'registered',
            registeredUid: uid,
            registeredAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    // 5. Create Registration Entry (for Admin 'Registros' visibility)
    // This ensures the new user appears in the general admin inbox
    const registrationRef = db.collection('registrations').doc();
    batch.set(registrationRef, {
        firstName,
        lastName,
        email,
        whatsapp: whatsapp || phone || '',
        registrationType: 'private',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        // optional source tracking
        source: 'private-signup',
        uid: uid
    });

    await batch.commit();
    return { success: true, profile: profileData };
}

/**
 * Validates a referral code and returns the referrer's UID if valid.
 */
async function validateReferralCode(code: string): Promise<string | null> {
    if (!code) return null;
    const db = getAdminDb();
    const snapshot = await db.collection('private_profiles')
        .where('uniqueCode', '==', code)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].id;
}
