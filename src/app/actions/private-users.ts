'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

/**
 * Toggles the disabled status of a private user.
 * Disables both the Firestore profile and the Firebase Auth account.
 */
export async function togglePrivateUserStatus(uid: string, disabled: boolean) {
    try {
        // 1. Update Authentication User
        try {
            await admin.auth().updateUser(uid, { disabled });
        } catch (authError: any) {
            console.warn(`Auth user update failed for ${uid} (might not exist):`, authError);
            // Continue to update DB even if auth fails (e.g. user deleted from auth but not db)
        }

        // 2. Update Firestore Profile
        await getAdminDb().collection('private_profiles').doc(uid).update({
            disabled: disabled,
            status: disabled ? 'disabled' : 'active',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { success: true, message: `User ${disabled ? 'disabled' : 'enabled'} successfully.` };
    } catch (error: any) {
        console.error('Error toggling user status:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Deletes a private user permanently.
 * Removes Firestore profile and Firebase Auth account.
 */
export async function deletePrivateUser(uid: string) {
    try {
        // 1. Delete Authentication User
        try {
            await admin.auth().deleteUser(uid);
        } catch (authError: any) {
            console.warn(`Auth user delete failed for ${uid} (might not exist):`, authError);
        }

        // 2. Delete Firestore Profile
        await getAdminDb().collection('private_profiles').doc(uid).delete();

        // 3. Optional: Clean up other related data (e.g. coupons assigned, etc - left for future)

        return { success: true, message: 'User deleted successfully.' };
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return { success: false, error: error.message };
    }
}
