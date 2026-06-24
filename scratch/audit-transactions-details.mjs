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

const TARGET_REFERRERS = [
    { name: 'Wuilfren Moran', id: 'Anq13lBl6WPFbfaxzj9aOtoNq3Y2' },
    { name: 'Marialis Moran', id: '3T5MpVQt1pgUwBtSLWJU06Bvctw1' },
    { name: 'Maicol Meléndez', id: 'ffq6KT1F14NfkhbiGNHxrsSHnV42' },
    { name: 'Antonio Perozo', id: 'O3cxPqJBNOVyIZOASJb7fRr9CMC3' }
];

async function run() {
    console.log("=========================================================");
    console.log("🔍 DIAGNOSTIC: TRANSACTION LOGS FOR TARGET REFERRERS");
    console.log("=========================================================");

    const start = new Date('2026-05-01T00:00:00.000Z');

    for (const ref of TARGET_REFERRERS) {
        console.log(`\nPatrocinador: ${ref.name} (${ref.id})`);
        
        // Fetch all transactions for this user
        const txSnap = await db.collection('wallet_transactions')
            .where('userId', '==', ref.id)
            .get();

        const txs = txSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(tx => {
                const date = tx.timestamp?.toDate ? tx.timestamp.toDate() : new Date(tx.timestamp);
                return date >= start;
            })
            .sort((a, b) => {
                const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
                const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
                return dateA - dateB;
            });

        console.log(`  Transactions since May 1, 2026: ${txs.length}`);
        if (txs.length > 0) {
            txs.forEach(tx => {
                const dateStr = tx.timestamp?.toDate ? tx.timestamp.toDate().toISOString() : new Date(tx.timestamp).toISOString();
                const currency = tx.currency || 'DP';
                console.log(`    - ${dateStr} | Type: ${tx.type} | Amount: ${tx.amount} ${currency} | Desc: ${tx.description}`);
            });
        } else {
            console.log("    (No transactions found since May 1, 2026)");
        }
    }
    
    process.exit(0);
}

run();
