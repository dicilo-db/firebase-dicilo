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
    const uid = 'Anq13lBl6WPFbfaxzj9aOtoNq3Y2'; // Wuilfren Moran
    
    console.log("--- Wuilfren Moran Profile ---");
    const pDoc = await db.collection('private_profiles').doc(uid).get();
    if (pDoc.exists) {
        console.log(pDoc.data());
    } else {
        console.log("Profile not found");
    }

    console.log("\n--- Wuilfren Moran Wallet ---");
    const wDoc = await db.collection('wallets').doc(uid).get();
    if (wDoc.exists) {
        console.log(wDoc.data());
    } else {
        console.log("Wallet not found");
    }

    process.exit(0);
}

run();
