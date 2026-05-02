import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')) });
}
const db = getFirestore();

async function run() {
    const uids = ['OQGYBd9URhY1ZjDM3zl3dc4VFWa2', 'Anq13lBl6VPE4XlZ3rUv1Z8z9x23', 'moWUdIMx72W429wVnNqF3Qk045j1'];
    for (const uid of uids) {
        const pDoc = await db.collection('private_profiles').doc(uid).get();
        const cDoc = await db.collection('clients').doc(uid).get();
        console.log(`UID: ${uid}`);
        console.log(` - In private_profiles: ${pDoc.exists} | Code: ${pDoc.data()?.uniqueCode}`);
        console.log(` - In clients: ${cDoc.exists} | Code: ${cDoc.data()?.uniqueCode}`);
    }
}
run();
