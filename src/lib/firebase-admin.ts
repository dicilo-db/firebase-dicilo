import * as admin from 'firebase-admin';
import { getApps, getApp } from 'firebase-admin/app';

const PROJECT_ID = 'geosearch-fq4i9';

function initFirebaseAdmin() {
    if (!process.env.GCLOUD_PROJECT) {
        process.env.GCLOUD_PROJECT = PROJECT_ID;
    }

    if (getApps().length) {
        return getApp();
    }

    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            let serviceAccount;
            try {
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            } catch (e) {
                console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
                throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON");
            }
            return admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: PROJECT_ID,
                storageBucket: 'geosearch-fq4i9.firebasestorage.app',
            });
        } else {
            return admin.initializeApp({
                projectId: PROJECT_ID,
                storageBucket: 'geosearch-fq4i9.firebasestorage.app',
            });
        }
    } catch (error) {
        console.error("Firebase Admin initialization failed:", error);
        throw error;
    }
}

// Lazy accessors to prevent module-load time crashes
export const getAdminAuth = () => admin.auth(initFirebaseAdmin());
export const getAdminDb = () => admin.firestore(initFirebaseAdmin());
export const getAdminStorage = () => admin.storage(initFirebaseAdmin());

// Deprecated top-level exports - retained for temporary compat but will throw if init fails
// ideally we replace these usages.
// export const adminAuth = admin.auth(); 
// export const adminDb = admin.firestore();
// export const adminStorage = admin.storage();

