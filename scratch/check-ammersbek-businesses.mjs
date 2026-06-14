import dotenv from "dotenv";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "geosearch-fq4i9",
});

const db = admin.firestore();

async function run() {
  console.log("=== CHECKING ALL AMMERSBEK BUSINESSES ===");
  const collections = ['businesses', 'clients'];
  
  for (const coll of collections) {
    console.log(`\n--- Collection: ${coll} ---`);
    const snap = await db.collection(coll).get();
    let count = 0;
    
    snap.docs.forEach(doc => {
      const data = doc.data();
      const name = data.name || data.clientName || 'Unbekannt';
      const address = data.address || '';
      const location = data.location || '';
      const city = data.city || '';
      const zip = data.zip || '';
      
      const isAmmersbek = 
        address.toLowerCase().includes('ammersbek') || 
        location.toLowerCase().includes('ammersbek') || 
        city.toLowerCase().includes('ammersbek') ||
        zip.includes('22949'); // Ammersbek ZIP code
        
      if (isAmmersbek) {
        count++;
        console.log(`\nDoc ID: ${doc.id}`);
        console.log(`Name/ClientName: "${name}"`);
        console.log(`active:`, data.active);
        console.log(`location:`, data.location);
        console.log(`city:`, data.city);
        console.log(`zip:`, data.zip);
        console.log(`address:`, data.address);
        console.log(`coordinates:`, data.coordinates || data.coords);
      }
    });
    console.log(`Total found in ${coll}: ${count}`);
  }
  process.exit(0);
}

run().catch(console.error);
