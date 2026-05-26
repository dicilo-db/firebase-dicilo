const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configuración de clave desde .env.local
const envPath = path.join(__dirname, '../diciwallet-web/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let serviceAccountKey = '';
const lines = envContent.split('\n');
for (const line of lines) {
  if (line.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY=')) {
    let val = line.substring('FIREBASE_SERVICE_ACCOUNT_KEY='.length).trim();
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1);
    }
    serviceAccountKey = val;
    break;
  }
}

if (!serviceAccountKey) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY in .env.local");
  process.exit(1);
}

let serviceAccount;
try {
  let cleanKey = serviceAccountKey.trim();
  cleanKey = cleanKey.replace(/\\\\n/g, '\\n');
  serviceAccount = JSON.parse(cleanKey);
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
} catch (e) {
  console.error("Failed to parse service account JSON:", e);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'geosearch-fq4i9'
});

const db = admin.firestore();
const getFieldValue = () => admin.firestore.FieldValue;
const getTimestamp = () => admin.firestore.Timestamp;

const DP_TO_DC_RATE = 10;

async function testConvertDpToDc(userId, amountDp) {
  console.log(`Starting conversion test for user ${userId} with ${amountDp} DP...`);
  if (amountDp <= 0 || amountDp % DP_TO_DC_RATE !== 0) {
    return { success: false, messageKey: 'api.validation_multiple' };
  }

  const amountDc = amountDp / DP_TO_DC_RATE;

  try {
    const result = await db.runTransaction(async (transaction) => {
      const walletRef = db.collection('wallets').doc(userId);
      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists) {
        return { success: false, messageKey: 'api.error_no_wallet' };
      }

      const currentBalance = walletDoc.data()?.balance || 0;
      console.log(`Current Wallet Balance: ${currentBalance} DP. Needed: ${amountDp} DP.`);
      if (currentBalance < amountDp) {
        return { success: false, messageKey: 'api.validation_insufficient' };
      }

      console.log(`Updating wallet balances: balance: -${amountDp}, balanceDC: +${amountDc}`);
      // Restar DP e incrementar DC
      transaction.update(walletRef, {
        balance: getFieldValue().increment(-amountDp),
        balanceDC: getFieldValue().increment(amountDc),
        updatedAt: getTimestamp().now(),
      });

      console.log(`Creating transaction history docs...`);
      // Registrar transacciones en el historial
      const trxRef = db.collection('wallet_transactions').doc();
      transaction.set(trxRef, {
        userId,
        amount: -amountDp,
        currency: 'DP',
        type: 'CONVERSION_TO_DC',
        description: `Conversión de ${amountDp} DP a ${amountDc} DC`,
        timestamp: getTimestamp().now(),
      });

      const trxRefDc = db.collection('wallet_transactions').doc();
      transaction.set(trxRefDc, {
        userId,
        amount: amountDc,
        currency: 'DC',
        type: 'CONVERSION_FROM_DP',
        description: `Recibido por conversión de ${amountDp} DP`,
        timestamp: getTimestamp().now(),
      });

      return { success: true, messageKey: 'api.conversion_success' };
    });

    return result;
  } catch (error) {
    console.error('Error in convertDpToDc transaction:', error);
    return { success: false, message: error.message };
  }
}

testConvertDpToDc('6OWAhwKRPZfaAUshsze7FUOsQ813', 5000)
  .then(res => console.log("Result:", res))
  .catch(console.error);
