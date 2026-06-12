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

// Parallel implementation of getNetworkTree with cycle prevention (using a Set of visited UIDs)
async function getNetworkTreeSafe(uid, maxDepth = 6, currentDepth = 1, visited = new Set()) {
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
    
    visited.add(uid);
    
    if (currentDepth <= maxDepth) {
        const directsSnap = await db.collection('private_profiles')
            .where('referredBy', '==', uid)
            .get();
             
        node.directsCount = directsSnap.size;
        
        // Filter out directs that have already been visited to prevent circular loops
        const validDirectDocs = directsSnap.docs.filter(doc => !visited.has(doc.id));
        
        // Execute child nodes in parallel
        const childPromises = validDirectDocs.map(directDoc => {
            // Clone visited Set for this branch
            const nextVisited = new Set(visited);
            return getNetworkTreeSafe(directDoc.id, maxDepth, currentDepth + 1, nextVisited);
        });
        
        const childNodes = await Promise.all(childPromises);
        
        for (const childNode of childNodes) {
            if (childNode) {
                node.directs.push(childNode);
                node.teamCount += 1 + childNode.teamCount;
            }
        }
    } else {
        // Even if we are beyond maxDepth, we can fetch the count of directs using count() query
        const countSnap = await db.collection('private_profiles')
            .where('referredBy', '==', uid)
            .count()
            .get();
        node.directsCount = countSnap.data().count;
    }
    
    return node;
}

async function test() {
    console.log("Starting safe test...");
    const start = Date.now();
    
    const niloUid = '6OWAhwKRPZfaAUshsze7FUOsQ813';
    console.log("Fetching tree for Nilo Escolar with maxDepth = 6 in parallel (SAFE)...");
    
    const tree = await getNetworkTreeSafe(niloUid, 6);
    const end = Date.now();
    console.log(`Finished in ${end - start}ms`);
    console.log(`Total directs: ${tree.directsCount}`);
    console.log(`Total team size: ${tree.teamCount}`);
    
    // Find Marialis Moran in Nilo's tree
    function findNode(currentNode, targetUid) {
        if (currentNode.uid === targetUid) return currentNode;
        for (const child of currentNode.directs) {
            const found = findNode(child, targetUid);
            if (found) return found;
        }
        return null;
    }
    
    const marialisNode = findNode(tree, '3T5MpVQt1pgUwBtSLWJU06Bvctw1');
    if (marialisNode) {
        console.log("\nMarialis Moran node found in Nilo's tree:");
        console.log({
            uid: marialisNode.uid,
            firstName: marialisNode.firstName,
            lastName: marialisNode.lastName,
            role: marialisNode.role,
            directsCount: marialisNode.directsCount,
            directsLoaded: marialisNode.directs.length,
            teamCount: marialisNode.teamCount
        });
    } else {
        console.log("\nMarialis Moran not found in Nilo's tree!");
    }
    
    process.exit(0);
}

test();
