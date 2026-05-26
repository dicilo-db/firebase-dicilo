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

async function run() {
  console.log("Checking dici_coins for America (LA-DC)...");
  
  // Buscar monedas de América
  const snapshot = await db.collection('dici_coins')
    .where('continent', '==', 'LA')
    .limit(20)
    .get();

  if (snapshot.empty) {
    console.log("No coins found for America (LA). Listing all coins in the collection...");
    const allCoins = await db.collection('dici_coins').limit(10).get();
    if (allCoins.empty) {
      console.log("The dici_coins collection is completely empty!");
    } else {
      allCoins.forEach(doc => {
        console.log(`Coin ID: ${doc.id}, Status: ${doc.data().status}, Continent: ${doc.data().continent}`);
      });
    }
  } else {
    console.log(`Found ${snapshot.size} coins for America:`);
    snapshot.forEach(doc => {
      console.log(`Coin ID: ${doc.id}, Status: ${doc.data().status}, Continent: ${doc.data().continent}, Number: ${doc.data().number}`);
    });
  }
}

run().catch(console.error);
