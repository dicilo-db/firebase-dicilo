import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')) });
}
const db = getFirestore();

async function run() {
    const snap = await db.collection('businesses').limit(10).get();
    snap.docs.forEach(doc => {
        const d = doc.data();
        console.log(`ID: ${doc.id}, language: ${d.language}, country: ${d.country}`);
    });
}
run();
