import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY in env");
        process.exit(1);
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'geosearch-fq4i9',
    });

    const db = admin.firestore();
    const neysaUid = 'OQGYBd9URhY1ZjDM3zl3dc4VFWa2';

    console.log(`Checking wallet for Neysa Castro (UID: ${neysaUid})...`);
    const walletDoc = await db.collection('wallets').doc(neysaUid).get();
    if (!walletDoc.exists) {
        console.log("No wallet found for Neysa Castro");
    } else {
        console.log("Wallet Data:", JSON.stringify(walletDoc.data(), null, 2));
    }

    console.log("\nChecking private_profile...");
    const profileDoc = await db.collection('private_profiles').doc(neysaUid).get();
    if (!profileDoc.exists) {
        console.log("No profile found for Neysa Castro");
    } else {
        const pd = profileDoc.data();
        console.log(`Name: ${pd.firstName} ${pd.lastName} | Role: ${pd.role} | Country: ${pd.country} | City: ${pd.city}`);
    }

    console.log("\nFetching EUR and USD transactions for Neysa Castro...");
    const txsSnap = await db.collection('wallet_transactions')
        .where('userId', '==', neysaUid)
        .get();

    const txs = txsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(tx => tx.currency === 'EUR' || tx.currency === 'USD');

    console.log(`Found ${txs.length} cash transactions.`);

    txs.sort((a, b) => {
        const t1 = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const t2 = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return t1 - t2;
    });

    txs.forEach(tx => {
        const dateStr = tx.timestamp?.toDate ? tx.timestamp.toDate().toISOString() : new Date(tx.timestamp).toISOString();
        console.log(`- [${dateStr}] Amount: ${tx.amount} | Currency: ${tx.currency} | Type: ${tx.type} | Desc: ${tx.description}`);
    });
}

main().catch(err => {
    console.error(err);
});
