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

async function traceReferrals() {
    try {
        let currentUid = "3T5MpVQt1pgUwBtSLWJU06Bvctw1"; // Marialis
        console.log("=== TRACING REFERRAL PATH UPWARDS ===");
        
        while (currentUid) {
            const doc = await db.collection('private_profiles').doc(currentUid).get();
            if (!doc.exists) {
                console.log(`Document not found for UID: ${currentUid}`);
                break;
            }
            const data = doc.data();
            console.log(`- User: ${data.firstName} ${data.lastName} (UID: ${doc.id}) | Role: ${data.role} | ReferredBy: ${data.referredBy || 'None'}`);
            currentUid = data.referredBy;
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

traceReferrals();
