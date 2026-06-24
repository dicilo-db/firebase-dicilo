import dotenv from 'dotenv';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'geosearch-fq4i9',
});

const db = admin.firestore();

async function run() {
    const referrerId = 'Anq13lBl6WPFbfaxzj9aOtoNq3Y2'; // Wuilfren Moran
    
    const snap = await db.collection('registrations')
        .where('referrerId', '==', referrerId)
        .limit(3)
        .get();

    console.log(`Found ${snap.size} registrations for Wuilfren Moran:`);
    snap.forEach(doc => {
        console.log(`\nID: ${doc.id}`);
        console.log(doc.data());
    });

    process.exit(0);
}

run();
