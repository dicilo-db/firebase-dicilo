import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';

const serviceAccount = JSON.parse(await readFile('./service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  const q = db.collection('clients');
  const snap = await q.get();
  
  const hoisbuttelBusinesses = [];
  snap.forEach(doc => {
    const data = doc.data();
    const city = (data.city || '').toLowerCase();
    const neighborhood = (data.neighborhood || '').toLowerCase();
    const search = 'hoisbüttel';
    
    if (city.includes(search) || neighborhood.includes(search)) {
      hoisbuttelBusinesses.push({ id: doc.id, name: data.name || data.clientName, city: data.city, neighborhood: data.neighborhood });
    }
  });
  
  console.log("Found businesses:", hoisbuttelBusinesses);
}

run().catch(console.error);
