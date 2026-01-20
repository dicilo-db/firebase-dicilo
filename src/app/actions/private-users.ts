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

/**
 * Manually sets the referrer for a user.
 * This links the user to the referrer defined by the unique code.
 * NOTE: This does NOT trigger strict welcome bonuses or transaction logs retroactively to avoid duplication,
 * but validates the code and updates the relationship in both profiles.
 */
export async function setReferrer(uid: string, referrerCode: string) {
    if (!referrerCode) return { success: false, error: 'Referrer code is required.' };

    const db = getAdminDb();

    try {
        // 1. Find Referrer by Code
        const referrerSnapshot = await db.collection('private_profiles')
            .where('uniqueCode', '==', referrerCode)
            .limit(1)
            .get();

        if (referrerSnapshot.empty) {
            return { success: false, error: 'Referrer code not found.' };
        }

        const referrerDoc = referrerSnapshot.docs[0];
        const referrerId = referrerDoc.id;

        if (referrerId === uid) {
            return { success: false, error: 'User cannot refer themselves.' };
        }

        // 2. Update User Profile (referredBy)
        await db.collection('private_profiles').doc(uid).update({
            referredBy: referrerId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 3. Update Referrer Profile (add to referrals list)
        // We need the user's data to add meaningful info to the array
        const userSnapshot = await db.collection('private_profiles').doc(uid).get();
        const userData = userSnapshot.data();
        const userCode = userData?.uniqueCode || 'UNKNOWN';

        await db.collection('private_profiles').doc(referrerId).update({
            referrals: admin.firestore.FieldValue.arrayUnion({
                uid: uid,
                code: userCode,
                joinedAt: new Date().toISOString(),
                manualLink: true
            })
        });

        return { success: true, message: `Referrer linked to ${referrerCode}` };

    } catch (error: any) {
        console.error('Error setting referrer:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetches details for a list of users by UID.
 * Useful for displaying follower lists. Includes basic info only.
 * Limits to 30 UIDs at a time for performance.
 */
export async function getFollowersDetails(uids: string[]) {
    if (!uids || uids.length === 0) return [];

    // Limit to 30 for safety/performance in this UI
    const safeUids = uids.slice(0, 30);
    const db = getAdminDb();

    try {
        const refs = safeUids.map(uid => db.collection('private_profiles').doc(uid));
        const snapshots = await db.getAll(...refs);

        return snapshots.map(snap => {
            if (!snap.exists) return null;
            const data = snap.data();
            return {
                uid: snap.id,
                firstName: data?.firstName || 'Usuario',
                lastName: data?.lastName || '',
                email: data?.email || 'No email',
                photoUrl: data?.photoUrl || null,
                createdAt: data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null
            };
        }).filter(u => u !== null);
    } catch (error: any) {
        console.error('Error fetching follower details:', error);
        return [];
    }
}

/**
 * Sets the favorite neighborhood for a user.
 */
export async function setFavoriteNeighborhood(uid: string, neighborhood: string | null) {
    try {
        await getAdminDb().collection('private_profiles').doc(uid).update({
            favoriteNeighborhood: neighborhood,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    } catch (error: any) {
        console.error('Error setting favorite neighborhood:', error);
        return { success: false, error: error.message };
    }
}
