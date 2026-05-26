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

const COIN_VALUE_EUR = 5000;
const RESERVE_AMOUNT_EUR = 500;

async function testReserveCoin(userId, coinId, shippingInfo) {
  console.log(`Starting reserveCoin test for user ${userId}, coin ${coinId}...`);
  try {
    const result = await db.runTransaction(async (transaction) => {
      const coinRef = db.collection('dici_coins').doc(coinId);
      const coinDoc = await transaction.get(coinRef);

      if (!coinDoc.exists) {
        return { success: false, messageKey: 'api.error_coin_not_found' };
      }

      const coinData = coinDoc.data();
      console.log(`Coin Status: ${coinData?.status}, Continent: ${coinData?.continent}`);
      if (coinData?.status !== 'available') {
        return { success: false, messageKey: 'api.error_coin_unavailable' };
      }

      const walletRef = db.collection('wallets').doc(userId);
      const walletDoc = await transaction.get(walletRef);

      if (!walletDoc.exists) {
        return { success: false, messageKey: 'api.error_wallet_not_found' };
      }

      const profileRef = db.collection('private_profiles').doc(userId);
      const profileDoc = await transaction.get(profileRef);
      const profileData = profileDoc.exists ? profileDoc.data() : null;
      console.log(`Profile Name: ${profileData?.firstName} ${profileData?.lastName}`);
      
      const firstName = profileData?.firstName || 'U';
      const lastName = profileData?.lastName || 'D';

      const nameInit = firstName.trim().charAt(0).toUpperCase() || 'X';
      const lastNameInit = lastName.trim().charAt(0).toUpperCase() || 'X';

      const continentCode = coinId.substring(0, 2).toUpperCase();
      const block1 = `${continentCode}${nameInit}${lastNameInit}`;
      const block2 = Math.floor(1000 + Math.random() * 9000).toString();

      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).substring(2);
      const block3 = `${month}${year}`;

      const digitalSerial = `DC-${block1}-${block2}-${block3}`;
      console.log(`Generated Digital Serial: ${digitalSerial}`);

      const reservationId = `res_${Math.random().toString(36).substring(2, 10)}`;
      const reservationRef = db.collection('coin_reservations').doc(reservationId);
      
      console.log(`Setting reservation doc ${reservationId}...`);
      transaction.set(reservationRef, {
        id: reservationId,
        userId,
        coinId,
        serial: digitalSerial,
        status: 'active',
        totalAmount: COIN_VALUE_EUR,
        paidAmount: RESERVE_AMOUNT_EUR,
        remainingAmount: COIN_VALUE_EUR - RESERVE_AMOUNT_EUR,
        progressPercentage: 10,
        shippingInfo,
        createdAt: getTimestamp().now(),
        updatedAt: getTimestamp().now(),
      });

      const paymentId = `pay_${Math.random().toString(36).substring(2, 10)}`;
      const paymentRef = db.collection('payment_history').doc(paymentId);
      
      console.log(`Setting payment history doc ${paymentId}...`);
      transaction.set(paymentRef, {
        id: paymentId,
        userId,
        coinId,
        reservationId,
        amount: RESERVE_AMOUNT_EUR,
        paymentMethod: 'simulated_card',
        status: 'completed',
        createdAt: getTimestamp().now(),
      });

      console.log(`Updating coin status to reserved...`);
      transaction.update(coinRef, {
        status: 'reserved',
        currentOwnerId: userId,
        serial: digitalSerial,
        paidAmount: RESERVE_AMOUNT_EUR,
        shippingInfo,
        updatedAt: getTimestamp().now(),
      });

      console.log(`Updating wallet with totalPaidEur increment...`);
      transaction.update(walletRef, {
        totalPaidEur: getFieldValue().increment(RESERVE_AMOUNT_EUR),
        updatedAt: getTimestamp().now(),
      });

      return { success: true, messageKey: 'api.success_reserve', reservationId, serial: digitalSerial };
    });

    return result;
  } catch (error) {
    console.error('Error in reserveCoin transaction:', error);
    return { success: false, message: error.message };
  }
}

const shippingInfo = {
  fullName: "Nilo Escolar",
  email: "superadmin@dicilo.net",
  phone: "+491788338735",
  country: "Alemania",
  city: "Hamburgo",
  address: "Mühlendamm 84a, 22087"
};

testReserveCoin('6OWAhwKRPZfaAUshsze7FUOsQ813', 'LA-DC0000003', shippingInfo)
  .then(res => console.log("Result:", res))
  .catch(console.error);
