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

/**
 * Updates a private user's profile data.
 */
export async function updatePrivateProfile(uid: string, data: any) {
    try {
        await getAdminDb().collection('private_profiles').doc(uid).set({
            ...data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return { success: true };
    } catch (error: any) {
        console.error('Error updating profile:', error);
        throw new Error(error.message);
    }
}

/**
 * Toggles the freelancer status of a private user.
 * @deprecated Use setPrivateUserRole instead for granular roles.
 */
export async function toggleFreelancerStatus(uid: string, isFreelancer: boolean) {
    return setPrivateUserRole(uid, isFreelancer ? 'freelancer' : 'user');
}

/**
 * Sets the role of a private user.
 * Valid roles: 'user', 'freelancer', 'team_office', 'admin', 'superadmin'.
 * Security: UI prevents non-superadmins from calling, but valid security rules should enforce this in Firestore/Auth.
 */
export async function setPrivateUserRole(uid: string, role: string) {
    const validRoles = ['user', 'freelancer', 'team_office', 'admin', 'superadmin'];
    if (!validRoles.includes(role)) {
        return { success: false, error: 'Invalid role specified.' };
    }

    try {
        await getAdminDb().collection('private_profiles').doc(uid).update({
            role: role,
            isFreelancer: role === 'freelancer' || role === 'team_office' || role === 'admin' || role === 'superadmin', // Backwards compatibility
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Also update Custom Claims in Auth if needed? 
        // For now, we stick to Firestore profile based RBAC as per current architecture.

        return { success: true, message: `User role updated to ${role}.` };
    } catch (error: any) {
        console.error('Error updating user role:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Updates the granular permissions of a private user.
 * @param uid The user ID.
 * @param permissions Array of permission strings.
 */
export async function updateUserPermissions(uid: string, permissions: string[]) {
    try {
        await getAdminDb().collection('private_profiles').doc(uid).update({
            permissions: permissions,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, message: 'Permissions updated successfully.' };
    } catch (error: any) {
        console.error('Error updating permissions:', error);
        return { success: false, error: error.message };
    }
}

