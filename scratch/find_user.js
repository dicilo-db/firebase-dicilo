const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Leer .env.local de diciwallet-web
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
  console.log("Searching for user with 6822 DP...");
  const snapshot = await db.collection('wallets').where('balance', '==', 6822).get();
  if (snapshot.empty) {
    console.log("No user found with exactly 6822 DP. Searching for wallets near that amount...");
    const allWallets = await db.collection('wallets').limit(10).get();
    allWallets.forEach(doc => {
      console.log(`Wallet Doc ID: ${doc.id}, Balance: ${doc.data().balance}, balanceDC: ${doc.data().balanceDC}`);
    });
  } else {
    snapshot.forEach(doc => {
      console.log(`Found wallet! User ID (Doc ID): ${doc.id}, Balance: ${doc.data().balance}, balanceDC: ${doc.data().balanceDC}`);
    });
  }
}

run().catch(console.error);
