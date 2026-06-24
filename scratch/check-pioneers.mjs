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

async function check() {
    const emails = [
        'anyelavidal@mail.com',
        'anyimontano@gmail.com',
        'angela123@mail.com',
        'angelamariaocoro7@gmail.com'
    ];

    console.log('--- Checking referrals_pioneers ---');
    for (const email of emails) {
        const snap = await db.collection('referrals_pioneers')
            .where('friendEmail', '==', email)
            .get();
        console.log(`Email: ${email}, found docs: ${snap.size}`);
        snap.forEach(doc => {
            console.log('Doc ID:', doc.id, 'Data:', doc.data());
        });
    }

    console.log('\n--- Checking registrations ---');
    for (const email of emails) {
        const snap = await db.collection('registrations')
            .where('email', '==', email)
            .get();
        console.log(`Email: ${email}, registrations found: ${snap.size}`);
        snap.forEach(doc => {
            console.log('Doc ID:', doc.id, 'Data:', doc.data());
        });
    }

    console.log('\n--- Checking private_profiles for DHH25NM00001 or Nilo ---');
    const userSnap = await db.collection('private_profiles')
        .where('uniqueCode', '==', 'DHH25NM00001')
        .get();
    if (!userSnap.empty) {
        console.log('Nilo UID:', userSnap.docs[0].id, 'Data:', userSnap.docs[0].data());
    } else {
        console.log('Nilo profile not found by uniqueCode DHH25NM00001');
    }

    console.log('\n--- Checking private_profiles for DCLSYSTEM01 ---');
    const sysSnap = await db.collection('private_profiles')
        .where('uniqueCode', '==', 'DCLSYSTEM01')
        .get();
    if (!sysSnap.empty) {
        console.log('DCLSYSTEM01 Owner UID:', sysSnap.docs[0].id, 'Data:', sysSnap.docs[0].data());
    } else {
        console.log('No private_profile with uniqueCode DCLSYSTEM01');
    }

    console.log('\n--- Checking clients for DCLSYSTEM01 ---');
    const sysClientSnap = await db.collection('clients')
        .where('uniqueCode', '==', 'DCLSYSTEM01')
        .get();
    if (!sysClientSnap.empty) {
        console.log('DCLSYSTEM01 Client Owner UID:', sysClientSnap.docs[0].id, 'Data:', sysClientSnap.docs[0].data());
    } else {
        console.log('No client with uniqueCode DCLSYSTEM01');
    }

    process.exit(0);
}

check().catch(console.error);
