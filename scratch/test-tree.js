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

// Copy of getNetworkTree
async function getNetworkTree(uid, maxDepth = 3, currentDepth = 1) {
    const profileSnap = await db.collection('private_profiles').doc(uid).get();
    if (!profileSnap.exists) return null;
    
    const data = profileSnap.data();
    
    const node = {
        uid: profileSnap.id,
        firstName: data.firstName || 'Usuario',
        lastName: data.lastName || '',
        email: data.email || '',
        uniqueCode: data.uniqueCode || '',
        role: data.role || 'user',
        directsCount: 0,
        teamCount: 0,
        directs: [],
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
    };
    
    if (currentDepth <= maxDepth) {
        const directsSnap = await db.collection('private_profiles')
            .where('referredBy', '==', uid)
            .get();
             
        node.directsCount = directsSnap.size;
        
        for (const directDoc of directsSnap.docs) {
            const childNode = await getNetworkTree(directDoc.id, maxDepth, currentDepth + 1);
            if (childNode) {
                node.directs.push(childNode);
                node.teamCount += 1 + childNode.teamCount;
            }
        }
    }
    
    return node;
}

async function test() {
    console.log("=== TREE FOR MARIALIS MORAN ===");
    const treeM = await getNetworkTree('3T5MpVQt1pgUwBtSLWJU06Bvctw1', 3);
    console.log(JSON.stringify(treeM, null, 2));

    console.log("\n=== TREE FOR WUILFREN MORAN ===");
    const treeW = await getNetworkTree('Anq13lBl6WPFbfaxzj9aOtoNq3Y2', 3);
    console.log(`Wuilfren direct count: ${treeW.directsCount}`);
    const marialisNode = treeW.directs.find(d => d.uid === '3T5MpVQt1pgUwBtSLWJU06Bvctw1');
    if (marialisNode) {
        console.log("Marialis Node in Wuilfren's tree:");
        console.log(JSON.stringify(marialisNode, null, 2));
    } else {
        console.log("Marialis Moran not found in Wuilfren's tree!");
    }
}

test();
