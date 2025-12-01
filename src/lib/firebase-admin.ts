import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

if (!getApps().length) {
    admin.initializeApp();
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
