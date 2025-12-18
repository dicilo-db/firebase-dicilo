'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function updatePrivateProfile(uid: string, data: any) {
    try {
        if (!uid) {
            return { success: false, error: 'Unauthorized' };
        }

        const docRef = getAdminDb().collection('private_profiles').doc(uid);
        // const doc = await docRef.get();

        // if (!doc.exists) {
        //     return { success: false, error: 'Profile not found' };
        // }

        // Sanitize data to ensure it's a plain object and remove undefined
        const safeData = JSON.parse(JSON.stringify(data));

        await docRef.set({
            ...safeData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        return { success: true };
    } catch (error: any) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Ensures a unique code exists for the user.
 * Generates one if missing.
 */
export async function ensureUniqueCode(uid: string) {
    try {
        if (!uid) return { success: false, error: 'Unauthorized' };

        const docRef = getAdminDb().collection('private_profiles').doc(uid);
        const doc = await docRef.get();

        if (!doc.exists) return { success: false, error: 'Profile not found' };

        const data = doc.data();
        if (data?.uniqueCode) {
            return { success: true, uniqueCode: data.uniqueCode };
        }

        // Generate Code
        const firstName = data?.firstName || 'User';
        const lastName = data?.lastName || '';
        const phoneNumber = data?.contactPreferences?.whatsapp || data?.contactPreferences?.telegram || data?.phoneNumber || '000';

        const prefix = 'DHH';
        const year = new Date().getFullYear().toString().slice(-2);
        const firstInitial = firstName.charAt(0).toUpperCase();
        const lastInitial = lastName.charAt(0).toUpperCase() || 'X';
        const initials = `${firstInitial}${lastInitial}`;

        let cleanPhone = phoneNumber.replace(/\D/g, '');
        if (cleanPhone.length === 0) cleanPhone = '000';
        const last3Phone = cleanPhone.length >= 3 ? cleanPhone.slice(-3) : cleanPhone.padEnd(3, '0');

        const baseCode = `${prefix}${year}${initials}${last3Phone}`;

        // Find unique sequence
        let sequence = 1;
        let uniqueCode = '';
        let isUnique = false;

        // Loop to find unique sequence
        while (!isUnique && sequence <= 99) {
            const sequenceStr = sequence.toString().padStart(2, '0');
            uniqueCode = `${baseCode}${sequenceStr}`;

            const q = getAdminDb().collection('private_profiles').where('uniqueCode', '==', uniqueCode);
            const snapshot = await q.get();

            if (snapshot.empty) {
                isUnique = true;
            } else {
                sequence++;
            }
        }

        if (!isUnique) throw new Error('Failed to generate unique code');

        await docRef.update({
            uniqueCode: uniqueCode,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { success: true, uniqueCode };

    } catch (error: any) {
        console.error('Error ensuring unique code:', error);
        return { success: false, error: error.message };
    }
}

