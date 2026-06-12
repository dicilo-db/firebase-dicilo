require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const admin = require('firebase-admin');

const PROJECT_ID = 'geosearch-fq4i9';

function initFirebaseAdmin() {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            let keyStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
            if ((keyStr.startsWith("'") && keyStr.endsWith("'")) || (keyStr.startsWith('"') && keyStr.endsWith('"'))) {
                keyStr = keyStr.slice(1, -1);
            }
            keyStr = keyStr.replace(/\\\\n/g, '\\n');
            const serviceAccount = JSON.parse(keyStr);
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
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

if (admin.apps.length === 0) {
    initFirebaseAdmin();
}
const db = admin.firestore();

async function count() {
    const snap = await db.collection('private_profiles').count().get();
    console.log("Total private profiles in Firestore:", snap.data().count);
    process.exit(0);
}

count();
