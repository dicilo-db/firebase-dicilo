import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from 'fs';

let app;
if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || fs.readFileSync('./serviceAccountKey.json', 'utf8'));
    app = initializeApp({
        credential: cert(serviceAccount)
    });
} else {
    app = getApps()[0];
}

const db = getFirestore(app);

async function check() {
    const doc = await db.collection('email_templates').doc('qVCINezvMyoMLJk7DUnL').get();
    console.log(JSON.stringify(doc.data(), null, 2));
}

check().catch(console.error);
