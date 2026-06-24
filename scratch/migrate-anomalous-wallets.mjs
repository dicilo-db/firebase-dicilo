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

    const targets = [
        { uid: 'OQGYBd9URhY1ZjDM3zl3dc4VFWa2', name: 'NEYSA CASTRO', correctCurrency: 'USD' },
        { uid: 'dicilo_system_legacy', name: 'Dicilo System', correctCurrency: 'USD' },
        { uid: 'm6AbsHlOocQ8itQwk9aFyRZxvPf1', name: 'Carmen Ochoa', correctCurrency: 'USD' },
        { uid: 'wVUcG6OgOoZT9HYIaiW6Zlrv0LJ3', name: 'Joan Pérez', correctCurrency: 'USD' }
    ];

    console.log("Starting currency migration batch for non-European users...");

    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();

    for (const t of targets) {
        const walletRef = db.collection('wallets').doc(t.uid);
        const walletDoc = await walletRef.get();
        if (!walletDoc.exists) {
            console.log(`No wallet found for ${t.name} (${t.uid}). Skipping.`);
            continue;
        }

        const data = walletDoc.data();
        const eurBal = data.eurBalance || 0;
        if (eurBal <= 0) {
            console.log(`${t.name} (${t.uid}) has EUR balance: ${eurBal}. No migration needed.`);
            continue;
        }

        console.log(`Migrating ${eurBal} EUR to USD for ${t.name} (${t.uid})...`);

        // Update Wallet
        batch.set(walletRef, {
            eurBalance: 0,
            usdBalance: admin.firestore.FieldValue.increment(eurBal),
            totalUsdEarned: admin.firestore.FieldValue.increment(eurBal),
            totalEurEarned: admin.firestore.FieldValue.increment(-eurBal),
            updatedAt: now
        }, { merge: true });

        // EUR Debit Transaction
        const eurTrxRef = db.collection('wallet_transactions').doc();
        batch.set(eurTrxRef, {
            userId: t.uid,
            amount: -eurBal,
            currency: 'EUR',
            type: 'CURRENCY_CORRECTION',
            description: `Corrección de divisa: Transferencia de saldo EUR a USD ($${eurBal.toFixed(2)}) por residencia fuera de Europa`,
            timestamp: now
        });

        // USD Credit Transaction
        const usdTrxRef = db.collection('wallet_transactions').doc();
        batch.set(usdTrxRef, {
            userId: t.uid,
            amount: eurBal,
            currency: 'USD',
            type: 'CURRENCY_CORRECTION',
            description: `Corrección de divisa: Recepción de saldo transferido desde EUR (€${eurBal.toFixed(2)}) por residencia fuera de Europa`,
            timestamp: now
        });
    }

    console.log("Committing transaction batch...");
    await batch.commit();
    console.log("Migration completed successfully!");
}

main().catch(err => {
    console.error("Migration failed:", err);
});
