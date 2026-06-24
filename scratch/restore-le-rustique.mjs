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
  console.log('Fetching registration O7srEH7dev2vBVBnuQuc...');
  const regRef = db.collection('registrations').doc('O7srEH7dev2vBVBnuQuc');
  const regSnap = await regRef.get();
  
  if (!regSnap.exists) {
    console.error('Registration not found!');
    process.exit(1);
  }
  
  const regData = regSnap.data();
  console.log('Registration data loaded:', regData.businessName);
  
  const busRef = db.collection('businesses').doc('le-rustique-04KAO0');
  const busSnap = await busRef.get();
  
  const updateData = {
    description: regData.description || '',
    category: regData.category || 'Gastronomie & Kulinarik',
    subcategory: regData.subcategory || '',
    location: regData.location || '',
    address: regData.address || '',
    phone: regData.phone || '',
    website: regData.website || '',
    currentOfferUrl: regData.currentOfferUrl || '',
    coords: regData.coords || null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (busSnap.exists) {
    console.log('Updating business le-rustique-04KAO0...');
    await busRef.update(updateData);
    console.log('Update complete!');
  } else {
    console.log('Creating business le-rustique-04KAO0...');
    await busRef.set({
      name: regData.businessName || 'Le Rustique',
      active: true,
      status: 'verified',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...updateData
    });
    console.log('Creation complete!');
  }

  process.exit(0);
}

main().catch(console.error);
