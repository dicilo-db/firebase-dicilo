import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')) });
}
const db = getFirestore();

async function run() {
    const doc = await db.collection('businesses').doc('02UCdehBW3NvvGOntgyJ').get();
    if (doc.exists) {
        console.log("Business Data:");
        console.log(JSON.stringify(doc.data(), null, 2));
    } else {
        console.log("Business not found in Firestore");
    }
}
run();
