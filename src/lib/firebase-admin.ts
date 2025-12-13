import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

if (!process.env.GCLOUD_PROJECT) {
    process.env.GCLOUD_PROJECT = 'geosearch-fq4i9';
}

if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
            projectId: 'geosearch-fq4i9',
        });
    } else {
        admin.initializeApp({
            projectId: 'geosearch-fq4i9',
        });
    }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
