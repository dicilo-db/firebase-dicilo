import * as admin from 'firebase-admin';

const PROJECT_ID = 'geosearch-fq4i9';

function initFirebaseAdmin() {
    const defaultApp = admin.apps.find(a => a?.name === '[DEFAULT]');
    if (defaultApp) {
        console.log("Reusing existing [DEFAULT] Firebase Admin App");
        return defaultApp;
    }
    console.log("Initializing new Firebase Admin App");

    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            let serviceAccount;
            try {
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            } catch (e) {
                console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
                // Fallback to default if JSON parsing fails, though this is risky
                throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON");
            }
            try {
                return admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: PROJECT_ID,
                    storageBucket: 'geosearch-fq4i9.firebasestorage.app',
                });
            } catch (error: any) {
                if (error.code === 'app/duplicate-app') {
                    console.log("Firebase Admin App already initialized (concurrent race detected).");
                    return admin.app();
                }
                throw error;
            }
        } else {
            try {
                return admin.initializeApp({
                    projectId: PROJECT_ID,
                    storageBucket: 'geosearch-fq4i9.firebasestorage.app',
                    credential: admin.credential.applicationDefault(),
                });
            } catch (error: any) {
                if (error.code === 'app/duplicate-app') {
                    console.log("Firebase Admin App already initialized (concurrent race detected).");
                    return admin.app();
                }
                throw error;
            }
        }
    } catch (error) {
        console.error("Firebase Admin initialization failed:", error);
        // Attempt to return existing app as last resort?
        if (admin.apps.length > 0) return admin.app();
        throw error;
    }
}

// Lazy accessors
export const getAdminAuth = () => admin.auth(initFirebaseAdmin());
export const getAdminDb = () => admin.firestore(initFirebaseAdmin());
export const getAdminStorage = () => admin.storage(initFirebaseAdmin());

// Deprecated top-level exports - retained for temporary compat but will throw if init fails
// ideally we replace these usages.
// export const adminAuth = admin.auth(); 
// export const adminDb = admin.firestore();
// export const adminStorage = admin.storage();

