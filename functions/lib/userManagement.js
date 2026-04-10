"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestPasswordReset = exports.sendUserPasswordReset = exports.updateUserEmail = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const email_1 = require("./email");
const i18n_1 = require("./i18n");
// Helper to check if the caller is an admin
const assertAdmin = (uid) => __awaiter(void 0, void 0, void 0, function* () {
    if ((0, app_1.getApps)().length === 0)
        (0, app_1.initializeApp)();
    const db = (0, firestore_1.getFirestore)();
    const adminDoc = yield db.collection('admins').doc(uid).get();
    const adminData = adminDoc.data();
    if (!adminData || (adminData.role !== 'admin' && adminData.role !== 'superadmin')) {
        throw new https_1.HttpsError('permission-denied', 'Only admins can perform this action.');
    }
});
exports.updateUserEmail = (0, https_1.onCall)((request) => __awaiter(void 0, void 0, void 0, function* () {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { targetUid, newEmail } = request.data;
    if (!targetUid || !newEmail) {
        throw new https_1.HttpsError('invalid-argument', 'The function must be called with targetUid and newEmail.');
    }
    try {
        // Verify admin privileges
        yield assertAdmin(request.auth.uid);
        // Update the user's email in Auth
        yield (0, auth_1.getAuth)().updateUser(targetUid, {
            email: newEmail,
            emailVerified: true, // Optional: auto-verify if admin sets it
        });
        // Also update the email in the 'clients' collection if it exists there
        // This is a bit tricky because 'clients' might not be keyed by UID directly or might have different structure
        // But usually we want to keep data in sync.
        // For now, we just update Auth. The client document might need a separate update if it stores email.
        logger.info(`Email updated for user ${targetUid} to ${newEmail} by admin ${request.auth.uid} `);
        return { success: true, message: 'Email updated successfully.' };
    }
    catch (error) {
        logger.error('Error updating user email:', error);
        throw new https_1.HttpsError('internal', error.message || 'Error updating user email.');
    }
}));
exports.sendUserPasswordReset = (0, https_1.onCall)((request) => __awaiter(void 0, void 0, void 0, function* () {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { email } = request.data;
    if (!email) {
        throw new https_1.HttpsError('invalid-argument', 'The function must be called with an email.');
    }
    try {
        // Verify admin privileges
        yield assertAdmin(request.auth.uid);
        // Generate the password reset link
        const link = yield (0, auth_1.getAuth)().generatePasswordResetLink(email);
        // Send the email using our custom SMTP service
        const i18n = yield (0, i18n_1.getEmailI18n)('es', (0, firestore_1.getFirestore)()); // Defaulting to ES for admin trigger or detect from doc
        const html = (0, i18n_1.render)(i18n['passwordReset.body'], { link });
        yield (0, email_1.sendMail)({
            to: email,
            subject: i18n['passwordReset.subject'],
            html: html
        });
        logger.info(`Password reset email sent to ${email} by admin ${request.auth.uid}`);
        return { success: true, message: 'Password reset email sent successfully.' };
    }
    catch (error) {
        logger.error('Error generating password reset link:', error);
        throw new https_1.HttpsError('internal', error.message || 'Error generating password reset link.');
    }
}));
/**
 * Public function to request a password reset email.
 * This is called from the login page by unauthenticated users.
 */
exports.requestPasswordReset = (0, https_1.onCall)((request) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, lang = 'es' } = request.data;
    if (!email) {
        throw new https_1.HttpsError('invalid-argument', 'Email is required.');
    }
    try {
        if ((0, app_1.getApps)().length === 0)
            (0, app_1.initializeApp)();
        // 1. Verify user exists (optional, but good for UX)
        try {
            yield (0, auth_1.getAuth)().getUserByEmail(email);
        }
        catch (authError) {
            if (authError.code === 'auth/user-not-found') {
                // To avoid email enumeration, we return success even if user not found,
                // but we don't send the email.
                return { success: true, message: 'If an account exists for this email, a reset link has been sent.' };
            }
            throw authError;
        }
        // 2. Generate the link
        const link = yield (0, auth_1.getAuth)().generatePasswordResetLink(email);
        // 3. Send the email
        const i18n = yield (0, i18n_1.getEmailI18n)(lang, (0, firestore_1.getFirestore)());
        const html = (0, i18n_1.render)(i18n['passwordReset.body'], { link });
        yield (0, email_1.sendMail)({
            to: email,
            subject: i18n['passwordReset.subject'],
            html: html
        });
        logger.info(`Password reset email requested and sent to ${email}`);
        return { success: true, message: 'If an account exists for this email, a reset link has been sent.' };
    }
    catch (error) {
        logger.error('Error in requestPasswordReset:', error);
        // We still return generic "success" message to prevent email enumeration
        return { success: true, message: 'If an account exists for this email, a reset link has been sent.' };
    }
}));
