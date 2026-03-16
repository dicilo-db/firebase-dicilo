
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { sendMail } from './email';
import { getEmailI18n, render, Lang } from './i18n';

// Helper to check if the caller is an admin
const assertAdmin = async (uid: string) => {
    if (getApps().length === 0) initializeApp();
    const db = getFirestore();
    const adminDoc = await db.collection('admins').doc(uid).get();
    const adminData = adminDoc.data();

    if (!adminData || (adminData.role !== 'admin' && adminData.role !== 'superadmin')) {
        throw new HttpsError('permission-denied', 'Only admins can perform this action.');
    }
};

export const updateUserEmail = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { targetUid, newEmail } = request.data;

    if (!targetUid || !newEmail) {
        throw new HttpsError('invalid-argument', 'The function must be called with targetUid and newEmail.');
    }

    try {
        // Verify admin privileges
        await assertAdmin(request.auth.uid);

        // Update the user's email in Auth
        await getAuth().updateUser(targetUid, {
            email: newEmail,
            emailVerified: true, // Optional: auto-verify if admin sets it
        });

        // Also update the email in the 'clients' collection if it exists there
        // This is a bit tricky because 'clients' might not be keyed by UID directly or might have different structure
        // But usually we want to keep data in sync.
        // For now, we just update Auth. The client document might need a separate update if it stores email.

        logger.info(`Email updated for user ${targetUid} to ${newEmail} by admin ${request.auth.uid} `);

        return { success: true, message: 'Email updated successfully.' };
    } catch (error: any) {
        logger.error('Error updating user email:', error);
        throw new HttpsError('internal', error.message || 'Error updating user email.');
    }
});

export const sendUserPasswordReset = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { email } = request.data;

    if (!email) {
        throw new HttpsError('invalid-argument', 'The function must be called with an email.');
    }

    try {
        // Verify admin privileges
        await assertAdmin(request.auth.uid);

        // Generate the password reset link
        const link = await getAuth().generatePasswordResetLink(email);

        // Send the email using our custom SMTP service
        const i18n = await getEmailI18n('es', getFirestore()); // Defaulting to ES for admin trigger or detect from doc
        const html = render(i18n['passwordReset.body'], { link });
        
        await sendMail({
            to: email,
            subject: i18n['passwordReset.subject'],
            html: html
        });

        logger.info(`Password reset email sent to ${email} by admin ${request.auth.uid}`);

        return { success: true, message: 'Password reset email sent successfully.' };
    } catch (error: any) {
        logger.error('Error generating password reset link:', error);
        throw new HttpsError('internal', error.message || 'Error generating password reset link.');
    }
});

/**
 * Public function to request a password reset email.
 * This is called from the login page by unauthenticated users.
 */
export const requestPasswordReset = onCall(async (request) => {
    const { email, lang = 'es' } = request.data;

    if (!email) {
        throw new HttpsError('invalid-argument', 'Email is required.');
    }

    try {
        if (getApps().length === 0) initializeApp();
        
        // 1. Verify user exists (optional, but good for UX)
        try {
            await getAuth().getUserByEmail(email);
        } catch (authError: any) {
            if (authError.code === 'auth/user-not-found') {
                // To avoid email enumeration, we return success even if user not found,
                // but we don't send the email.
                return { success: true, message: 'If an account exists for this email, a reset link has been sent.' };
            }
            throw authError;
        }

        // 2. Generate the link
        const link = await getAuth().generatePasswordResetLink(email);

        // 3. Send the email
        const i18n = await getEmailI18n(lang as Lang, getFirestore());
        const html = render(i18n['passwordReset.body'], { link });
        
        await sendMail({
            to: email,
            subject: i18n['passwordReset.subject'],
            html: html
        });

        logger.info(`Password reset email requested and sent to ${email}`);

        return { success: true, message: 'If an account exists for this email, a reset link has been sent.' };
    } catch (error: any) {
        logger.error('Error in requestPasswordReset:', error);
        // We still return generic "success" message to prevent email enumeration
        return { success: true, message: 'If an account exists for this email, a reset link has been sent.' };
    }
});
