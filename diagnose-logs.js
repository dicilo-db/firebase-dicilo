
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({ path: '.env.local' });

let serviceAccount;
try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} catch (e) {
    console.error('Failed to parse service account from .env.local');
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'geosearch-fq4i9'
    });
}

const db = admin.firestore();

async function checkLogs() {
    console.log('Fetching latest 5 mail logs from geosearch-fq4i9...');
    const snapshot = await db.collection('mail_logs')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

    if (snapshot.empty) {
        console.log('No logs found in "mail_logs" collection.');
        return;
    }

    snapshot.forEach(doc => {
        const data = doc.data();
        console.log('-------------------');
        console.log(`ID: ${doc.id}`);
        console.log(`To: ${data.to}`);
        console.log(`Status: ${data.status}`);
        console.log(`Source: ${data.source}`);
        console.log(`Error: ${data.error || 'None'}`);
        console.log(`Time: ${data.createdAt?.toDate().toISOString() || 'Unknown'}`);
    });
}

checkLogs().catch(console.error);
