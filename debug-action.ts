import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

// Initialize Firebase
const serviceAccountPath = './serviceAccountKey.json';
if (!getApps().length && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    initializeApp({
        credential: cert(serviceAccount)
    });
} else if (!getApps().length) {
     console.error('No service account found, and no firebase initialized');
     process.exit(1);
}

// We can just emulate the logic instead so we don't have to stub everything
import { sendProspectInvitation } from './src/app/actions/prospect-actions';

async function run() {
    // Just find the first prospect id
    const db = getFirestore();
    const doc = await db.collection('recommendations').limit(1).get();
    if (doc.empty) return console.log('No prospect found');
    const id = doc.docs[0].id;
    
    try {
        const res = await sendProspectInvitation(id, 'MYXkACjt1zFkIhsz7qmY');
        console.log('Result:', res);
    } catch (e) {
        console.error('Crash! -> ', e);
    }
}

run().then(() => process.exit(0)).catch(console.error);
