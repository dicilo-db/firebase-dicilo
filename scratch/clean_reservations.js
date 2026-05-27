const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');

let serviceAccountStr = '';
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_KEY='({.*?})'/s);
  if (match && match[1]) {
    serviceAccountStr = match[1].replace(/\\\\n/g, '\\n');
  }
} catch (e) {
  console.error("Error reading environment variable file:", e);
}

if (!serviceAccountStr) {
  console.error("Could not find FIREBASE_SERVICE_ACCOUNT_KEY");
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountStr);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'geosearch-fq4i9',
});

const db = admin.firestore();

async function cleanReservations() {
  const targetCoins = ['LA-DC0000003', 'EU-DC0000001'];
  
  console.log(`Starting cleanup for coins: ${targetCoins.join(', ')}`);

  for (const coinId of targetCoins) {
    console.log(`\n--- Processing Coin: ${coinId} ---`);
    
    // 1. Buscar reservación(es)
    const resSnapshot = await db.collection('coin_reservations')
      .where('coinId', '==', coinId)
      .get();
      
    if (resSnapshot.empty) {
      console.log(`No active reservations found for coin: ${coinId}`);
    } else {
      for (const resDoc of resSnapshot.docs) {
        const resData = resDoc.data();
        const userId = resData.userId;
        const paidAmount = resData.paidAmount || 0;
        
        console.log(`Found Reservation ID: ${resDoc.id}`);
        console.log(`- User ID: ${userId}`);
        console.log(`- Paid Amount: ${paidAmount} EUR`);
        
        // 2. Restar del totalPaidEur del usuario en su wallet
        if (userId) {
          const walletRef = db.collection('wallets').doc(userId);
          const walletDoc = await walletRef.get();
          if (walletDoc.exists) {
            console.log(`Updating user wallet ${userId}: decrementing totalPaidEur by ${paidAmount}`);
            await walletRef.update({
              totalPaidEur: admin.firestore.FieldValue.increment(-paidAmount),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          } else {
            console.log(`Wallet doc not found for user: ${userId}`);
          }
        }
        
        // 3. Borrar el historial de pagos (payment_history) asociado a esta reserva
        const paySnapshot = await db.collection('payment_history')
          .where('reservationId', '==', resDoc.id)
          .get();
          
        for (const payDoc of paySnapshot.docs) {
          console.log(`Deleting Payment Record ID: ${payDoc.id}`);
          await payDoc.ref.delete();
        }
        
        // 4. Borrar el documento de reservación
        console.log(`Deleting Reservation Document ID: ${resDoc.id}`);
        await resDoc.ref.delete();
      }
    }
    
    // 5. Restablecer la moneda dici_coins a disponible
    const coinRef = db.collection('dici_coins').doc(coinId);
    const coinDoc = await coinRef.get();
    if (coinDoc.exists) {
      console.log(`Reverting DiciCoin ${coinId} status to 'available'`);
      await coinRef.update({
        status: 'available',
        currentOwnerId: null,
        serial: admin.firestore.FieldValue.delete(),
        paidAmount: 0,
        shippingInfo: admin.firestore.FieldValue.delete(),
        saleSignature: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      console.log(`DiciCoin document not found: ${coinId}`);
    }
  }

  console.log("\nCleanup completed successfully!");
  process.exit(0);
}

cleanReservations().catch(err => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
