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

    const walletRef = db.collection('wallets').doc(neysaUid);
    const walletDoc = await walletRef.get();

    if (!walletDoc.exists) {
        console.error("Wallet not found for Neysa Castro");
        return;
    }

    const currentData = walletDoc.data();
    const currentUsdBalance = currentData.usdBalance || 0;
    const targetBalance = 8.38;
    const adjustmentAmount = targetBalance - currentUsdBalance; // e.g., 8.38 - 64.38 = -56.00

    console.log(`Current USD Balance: ${currentUsdBalance}`);
    console.log(`Target USD Balance: ${targetBalance}`);
    console.log(`Adjustment Amount: ${adjustmentAmount}`);

    if (adjustmentAmount === 0) {
        console.log("No adjustment needed.");
        return;
    }

    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();

    // 1. Update Neysa's Wallet
    batch.update(walletRef, {
        usdBalance: targetBalance,
        updatedAt: now
    });

    // 2. Log Adjustment Transaction
    const trxRef = db.collection('wallet_transactions').doc();
    batch.set(trxRef, {
        userId: neysaUid,
        amount: adjustmentAmount, // -56.00
        currency: 'USD',
        type: 'PAYOUT_RESET',
        description: `Pago procesado y reseteo parcial de Tarjeta Verde ($${Math.abs(adjustmentAmount).toFixed(2)}) por administrador. Saldo restante: $${targetBalance.toFixed(2)}`,
        timestamp: now
    });

    console.log("Committing Neysa Castro balance adjustment...");
    await batch.commit();
    console.log("Successfully adjusted Neysa Castro's balance to $8.38 USD!");
}

main().catch(err => {
    console.error(err);
});
