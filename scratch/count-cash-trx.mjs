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
    const snap = await db.collection('wallet_transactions').where('type', '==', 'REFERRAL_CASH_BONUS').get();
    console.log('Total REFERRAL_CASH_BONUS transactions in DB:', snap.size);
    if (snap.size > 0) {
        snap.docs.slice(0, 10).forEach(d => {
            console.log(d.id, d.data());
        });
    }
    
    const snap2 = await db.collection('wallet_transactions').where('currency', '==', 'EUR').get();
    console.log('Total EUR transactions in DB:', snap2.size);
    if (snap2.size > 0) {
        snap2.docs.slice(0, 10).forEach(d => {
            console.log(d.id, d.data());
        });
    }
    process.exit(0);
}

run();
