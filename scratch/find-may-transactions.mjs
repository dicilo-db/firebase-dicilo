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

    const start = new Date('2026-05-01T00:00:00.000Z');
    const end = new Date('2026-06-15T00:00:00.000Z'); // up to now

    console.log("Fetching referral transactions created since May 1, 2026...");

    const txSnap = await db.collection('wallet_transactions').get();
    const transactions = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const mayTx = transactions.filter(tx => {
        if (!tx.timestamp) return false;
        let date;
        if (typeof tx.timestamp.toDate === 'function') {
            date = tx.timestamp.toDate();
        } else {
            date = new Date(tx.timestamp);
        }
        return date >= start && date <= end && (
            tx.type === 'REFERRAL_BONUS' || 
            tx.type === 'REFERRAL_CASH_BONUS' || 
            tx.type === 'REFERRAL_REWARD' ||
            tx.type === 'WELCOME_BONUS'
        );
    });

    console.log(`Found ${mayTx.length} transactions of interest since May 1, 2026.`);
    mayTx.slice(0, 30).forEach(tx => {
        let dateStr = tx.timestamp.toDate ? tx.timestamp.toDate().toISOString() : new Date(tx.timestamp).toISOString();
        console.log(`${dateStr} | Type: ${tx.type} | User: ${tx.userId} | Amount: ${tx.amount} | Desc: ${tx.description}`);
    });
}

main().catch(console.error);
