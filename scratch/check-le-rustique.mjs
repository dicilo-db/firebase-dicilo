import dotenv from 'dotenv';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'geosearch-fq4i9',
});

const db = admin.firestore();

async function main() {
  console.log('Searching all collections for "rustique"...');
  
  const collections = ['registrations', 'businesses', 'clients', 'private_profiles'];
  
  for (const collName of collections) {
    console.log(`\n--- Searching ${collName} ---`);
    const snap = await db.collection(collName).get();
    snap.forEach(doc => {
      const data = doc.data();
      const stringified = JSON.stringify(data).toLowerCase();
      if (doc.id.toLowerCase().includes('rustique') || stringified.includes('rustique')) {
        console.log(`Found doc in ${collName} (ID: ${doc.id}):`);
        console.log(JSON.stringify(data, null, 2));
      }
    });
  }

  process.exit(0);
}

main().catch(console.error);
