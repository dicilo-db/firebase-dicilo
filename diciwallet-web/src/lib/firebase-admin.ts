import * as admin from 'firebase-admin';

const PROJECT_ID = 'geosearch-fq4i9';

function initFirebaseAdmin() {
    const defaultApp = admin.apps.find(a => a?.name === '[DEFAULT]');
    if (defaultApp) {
        return defaultApp;
    }

    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            let serviceAccount;
            try {
                let keyStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
                if ((keyStr.startsWith("'") && keyStr.endsWith("'")) || (keyStr.startsWith('"') && keyStr.endsWith('"'))) {
                    keyStr = keyStr.slice(1, -1);
                }
                keyStr = keyStr.replace(/\\\\n/g, '\\n');
                serviceAccount = JSON.parse(keyStr);

                if (serviceAccount.private_key) {
                    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
                }
            } catch (e) {
                console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
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
                    return admin.app();
                }
                throw error;
            }
        }
    } catch (error) {
        console.error("Firebase Admin initialization failed:", error);
        if (admin.apps.length > 0) return admin.app();
        throw error;
    }
}

export const getAdminAuth = () => admin.auth(initFirebaseAdmin());
export const getAdminDb = () => admin.firestore(initFirebaseAdmin());
export const getAdminStorage = () => admin.storage(initFirebaseAdmin());
export const getFieldValue = () => admin.firestore.FieldValue;
export const getTimestamp = () => admin.firestore.Timestamp;
export const getAdminFirestore = () => admin.firestore;
