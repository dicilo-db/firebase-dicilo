const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');

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

async function check() {
  const snapshot = await db.collection('dici_coins').limit(5).get();
  console.log("Found coins in Firestore:");
  snapshot.forEach(doc => {
    console.log(`- ID: ${doc.id}, length: ${doc.id.length}`);
  });
  process.exit(0);
}

check();
