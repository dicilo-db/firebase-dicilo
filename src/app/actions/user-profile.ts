'use server';

import { getAdminDb } from '@/lib/firebase-admin';

/**
 * Fetches the private profile for the current user.
 */
export async function getPrivateProfile(uid: string) {
    if (!uid) return { success: false, error: 'User ID is required.' };

    try {
        const doc = await getAdminDb().collection('private_profiles').doc(uid).get();
        if (!doc.exists) {
            return { success: false, error: 'Profile not found.' };
        }
        return { success: true, profile: doc.data() };
    } catch (error: any) {
        console.error('Error fetching private profile:', error);
        return { success: false, error: error.message };
    }
}
