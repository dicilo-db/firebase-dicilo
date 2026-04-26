const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkAssigned() {
    const snapshot = await db.collection('businesses')
        .where('assignmentStatus', '==', 'assigned')
        .get();

    console.log(`Found ${snapshot.docs.length} total assigned businesses in the database.`);
    if (snapshot.empty) return;
    
    // Group by uid
    const users = {};
    snapshot.docs.forEach(doc => {
        const uid = doc.data().assignedTo;
        if (!users[uid]) users[uid] = 0;
        users[uid]++;
    });

    console.log("Distribution by User UID:");
    console.table(users);
}

checkAssigned()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
