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
  const emailToFind = 'superadmin@dicilo.net';
  console.log(`Searching for email: ${emailToFind}`);
  
  const privateProfileSnap = await db.collection('private_profiles').where('email', '==', emailToFind).get();
  if (!privateProfileSnap.empty) {
    privateProfileSnap.forEach(doc => {
      console.log(`Found in private_profiles: ID=${doc.id}, Data=`, doc.data());
    });
  } else {
    console.log("Not found in private_profiles.");
  }
  
  const userSnap = await db.collection('users').where('email', '==', emailToFind).get();
  if (!userSnap.empty) {
    userSnap.forEach(doc => {
      console.log(`Found in users: ID=${doc.id}, Data=`, doc.data());
    });
  } else {
    console.log("Not found in users.");
  }
  
  // Also check auth
  try {
    const userRecord = await admin.auth().getUserByEmail(emailToFind);
    console.log(`Found in Firebase Auth: UID=${userRecord.uid}, Email=${userRecord.email}`);
  } catch (err) {
    console.log(`Not found in Firebase Auth:`, err.message);
  }

  process.exit(0);
}

check();
