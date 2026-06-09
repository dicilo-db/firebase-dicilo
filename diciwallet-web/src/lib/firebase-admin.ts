import { initializeApp, getApps, getApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

const PROJECT_ID = 'geosearch-fq4i9';

function initFirebaseAdmin() {
    try {
        const apps = getApps();
        const defaultApp = apps.find(a => a?.name === '[DEFAULT]');
        if (defaultApp) {
            return defaultApp;
        }
    } catch (e) {
        console.warn("Error checking existing Firebase Admin apps:", e);
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
                return initializeApp({
                    credential: cert(serviceAccount),
                    projectId: PROJECT_ID,
                    storageBucket: 'geosearch-fq4i9.firebasestorage.app',
                });
            } catch (error: any) {
                if (error.code === 'app/duplicate-app') {
                    return getApp();
                }
                throw error;
            }
        } else {
            try {
                // Try initializing with project configuration and default credentials
                return initializeApp({
                    projectId: PROJECT_ID,
                    storageBucket: 'geosearch-fq4i9.firebasestorage.app',
                });
            } catch (initError: any) {
                if (initError.code === 'app/duplicate-app') {
                    return getApp();
                }
                try {
                    // Fallback to completely empty initialization
                    return initializeApp();
                } catch (error: any) {
                    if (error.code === 'app/duplicate-app') {
                        return getApp();
                    }
                    throw error;
                }
            }
        }
    } catch (error) {
        console.error("Firebase Admin initialization failed:", error);
        try {
            if (getApps().length > 0) return getApp();
        } catch (e) {}
        throw error;
    }
}

export const getAdminAuth = () => getAuth(initFirebaseAdmin());
export const getAdminDb = () => getFirestore(initFirebaseAdmin());
export const getAdminStorage = () => getStorage(initFirebaseAdmin());
export const getFieldValue = () => FieldValue;
export const getTimestamp = () => Timestamp;
export const getAdminFirestore = () => {
    // Para conservar compatibilidad en caso de que alguien llame getAdminFirestore()
    return {
        FieldValue,
        Timestamp
    } as any;
};

