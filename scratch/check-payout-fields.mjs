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
    const snap = await db.collection('registrations').get();
    console.log(`Total registrations: ${snap.size}`);

    const typeCounts = {};
    const paidCounts = {};
    const missingFieldDocs = [];

    snap.docs.forEach(doc => {
        const data = doc.data();
        const type = data.registrationType || 'missing_type';
        typeCounts[type] = (typeCounts[type] || 0) + 1;

        const paid = data.referralRewardPaid;
        const paidStr = paid === undefined ? 'undefined' : String(paid);
        paidCounts[paidStr] = (paidCounts[paidStr] || 0) + 1;

        if (paid === undefined) {
            missingFieldDocs.push({ id: doc.id, type, email: data.email });
        }
    });

    console.log("\nRegistration Types counts:", typeCounts);
    console.log("referralRewardPaid field value counts:", paidCounts);

    console.log("\nSample documents with undefined referralRewardPaid:");
    console.log(missingFieldDocs.slice(0, 10));

    process.exit(0);
}

run();
