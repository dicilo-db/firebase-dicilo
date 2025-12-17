import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

/**
 * Generates a unique code for a private user using Admin SDK.
 */
async function generateUniqueCodeAdmin(firstName: string, lastName: string, phoneNumber: string): Promise<string> {
    const prefix = 'DHH';
    const year = new Date().getFullYear().toString().slice(-2);
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    const initials = `${firstInitial}${lastInitial}`; // e.g. NE

    // Last 3 digits of phone
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const last3Phone = cleanPhone.length >= 3 ? cleanPhone.slice(-3) : cleanPhone.padEnd(3, '0');

    const baseCode = `${prefix}${year}${initials}${last3Phone}`;

    let sequence = 1;
    let uniqueCode = '';
    let isUnique = false;

    while (!isUnique && sequence <= 99) {
        const sequenceStr = sequence.toString().padStart(2, '0');
        uniqueCode = `${baseCode}${sequenceStr}`;

        const snapshot = await getAdminDb().collection('private_profiles')
            .where('uniqueCode', '==', uniqueCode)
            .get();

        if (snapshot.empty) {
            isUnique = true;
        } else {
            sequence++;
        }
    }

    if (!isUnique) throw new Error('Unique code generation failed: limit reached.');
    return uniqueCode;
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
