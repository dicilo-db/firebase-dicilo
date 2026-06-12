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

async function checkSchema() {
    try {
        const bSnap = await db.collection("businesses").limit(30).get();
        console.log("Businesses sample (first 30):");
        bSnap.forEach(doc => {
            const data = doc.data();
            console.log(`- ID: ${doc.id}`);
            console.log(`  Name: ${data.name || data.clientName}`);
            console.log(`  Location: ${data.location}`);
            console.log(`  City: ${data.city}`);
            console.log(`  Zip: ${data.zip}`);
            console.log(`  Address: ${data.address}`);
            console.log(`  Coords:`, data.coords || data.coordinates);
        });
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkSchema();
