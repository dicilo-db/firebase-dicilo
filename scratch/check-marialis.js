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

// Copy of getMlmLeaders
async function getMlmLeaders() {
    const snap = await db.collection('private_profiles')
        .where('role', 'in', ['freelancer', 'team_leader'])
        .get();

    const leaders = [];
    for (const doc of snap.docs) {
        const data = doc.data();
        
        // Count directs quickly
        const directsSnap = await db.collection('private_profiles')
            .where('referredBy', '==', doc.id)
            .get();
            
        leaders.push({
            uid: doc.id,
            firstName: data.firstName || 'Usuario',
            lastName: data.lastName || '',
            email: data.email || '--',
            uniqueCode: data.uniqueCode || '--',
            role: data.role,
            directsCount: directsSnap.size,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : '--'
        });
    }

    return leaders.sort((a, b) => {
        if (a.role === 'team_leader' && b.role !== 'team_leader') return -1;
        if (a.role !== 'team_leader' && b.role === 'team_leader') return 1;
        return b.directsCount - a.directsCount;
    });
}

async function test() {
    const leaders = await getMlmLeaders();
    console.log("=== MLM LEADERS ===");
    leaders.forEach(l => {
        console.log(`${l.firstName} ${l.lastName} (${l.role}) | Directs: ${l.directsCount} | UID: ${l.uid}`);
    });
}

test();
