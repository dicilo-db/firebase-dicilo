import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'geosearch-fq4i9',
    });

    const db = admin.firestore();

    const txSnap = await db.collection('wallet_transactions').get();
    console.log(`Total transactions in DB: ${txSnap.size}`);

    if (txSnap.size > 0) {
        const types = new Set();
        txSnap.docs.forEach(doc => {
            types.add(doc.data().type);
        });
        console.log("Unique transaction types in DB:", Array.from(types));

        console.log("\nSample transactions (up to 10):");
        txSnap.docs.slice(0, 10).forEach(doc => {
            console.log(doc.id, doc.data());
        });
    }
}

main().catch(console.error);
