const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../diciwallet-web/.env.local');

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
  console.log("Looking up users in private_profiles...");
  const snapshot = await db.collection('private_profiles').limit(10).get();
  snapshot.forEach(doc => {
    console.log(`- User ID: ${doc.id}, Email: ${doc.data().email}, Name: ${doc.data().firstName} ${doc.data().lastName}`);
  });
  
  console.log("Looking up users in users...");
  const usersSnapshot = await db.collection('users').limit(10).get();
  usersSnapshot.forEach(doc => {
    console.log(`- User ID: ${doc.id}, Email: ${doc.data().email}, Name: ${doc.data().displayName}`);
  });
  
  process.exit(0);
}

check();
