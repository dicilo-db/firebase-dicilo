import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')) });
}
const db = getFirestore();

async function run() {
    const snap = await db.collection('businesses')
        .where('assignmentStatus', '==', 'available')
        .get();
        
    const countries = new Map<string, number>();
    snap.docs.forEach(doc => {
        const c = doc.data().country || 'Unknown';
        countries.set(c, (countries.get(c) || 0) + 1);
    });
    
    console.log("Countries distribution in available records:");
    console.log(Object.fromEntries(countries));
}
run();
