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
    }
) {
    const { firstName, lastName, email, whatsapp, phone, contactType } = data;

    // Check if exists
    const docRef = getAdminDb().collection('private_profiles').doc(uid);
    const existing = await docRef.get();
    if (existing.exists) return { success: false, message: 'Profile already exists', profile: existing.data() };

    const phoneForCode = whatsapp || phone || '000';
    const uniqueCode = await generateUniqueCodeAdmin(firstName, lastName, phoneForCode);

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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await docRef.set(profileData);
    return { success: true, profile: profileData };
}
