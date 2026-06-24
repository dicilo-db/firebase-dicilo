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

    console.log("Fetching REFERRAL_CASH_BONUS transactions...");

    const txSnap = await db.collection('wallet_transactions')
        .where('type', '==', 'REFERRAL_CASH_BONUS')
        .get();

    console.log(`Found ${txSnap.size} REFERRAL_CASH_BONUS transactions.`);
    txSnap.docs.slice(0, 10).forEach(doc => {
        console.log(doc.id, doc.data());
    });
}

main().catch(console.error);
