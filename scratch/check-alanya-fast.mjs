import dotenv from "dotenv";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env file
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

async function search() {
    console.log("Searching Firestore collections FAST for 'Alanya 5' or related entries...");

    try {
        // 1. Search in registrations
        console.log("\n--- Searching in 'registrations' ---");
        const regSnap = await db.collection("registrations").get();
        console.log(`Total registrations in DB: ${regSnap.size}`);
        regSnap.forEach(doc => {
            const data = doc.data();
            const name = data.companyName || data.name || data.clientName || '';
            if (name.toLowerCase().includes("alanya") || doc.id.toLowerCase().includes("alanya")) {
                console.log(`[registrations] ID: ${doc.id}`);
                console.log(`  Data:`, JSON.stringify(data, null, 2));
            }
        });

        // 2. Search in businesses (by prefix / exact name)
        console.log("\n--- Searching in 'businesses' ---");
        const busSnap1 = await db.collection("businesses").where("name", "==", "Alanya 5").get();
        console.log(`Exact name 'Alanya 5' in businesses: ${busSnap1.size}`);
        busSnap1.forEach(doc => {
            console.log(`[businesses ID: ${doc.id}]:`, JSON.stringify(doc.data(), null, 2));
        });

        const busSnap2 = await db.collection("businesses").where("clientName", "==", "Alanya 5").get();
        console.log(`Exact clientName 'Alanya 5' in businesses: ${busSnap2.size}`);
        busSnap2.forEach(doc => {
            console.log(`[businesses ID: ${doc.id}]:`, JSON.stringify(doc.data(), null, 2));
        });

        // 3. Search in clients (by prefix / exact name)
        console.log("\n--- Searching in 'clients' ---");
        const cliSnap1 = await db.collection("clients").where("name", "==", "Alanya 5").get();
        console.log(`Exact name 'Alanya 5' in clients: ${cliSnap1.size}`);
        cliSnap1.forEach(doc => {
            console.log(`[clients ID: ${doc.id}]:`, JSON.stringify(doc.data(), null, 2));
        });

        const cliSnap2 = await db.collection("clients").where("clientName", "==", "Alanya 5").get();
        console.log(`Exact clientName 'Alanya 5' in clients: ${cliSnap2.size}`);
        cliSnap2.forEach(doc => {
            console.log(`[clients ID: ${doc.id}]:`, JSON.stringify(doc.data(), null, 2));
        });

        // 4. Case-insensitive search on first few documents of businesses to see what name they have
        console.log("\n--- Checking first 5 businesses to see schema ---");
        const firstBus = await db.collection("businesses").limit(5).get();
        firstBus.forEach(doc => {
            console.log(`[businesses ID: ${doc.id}]: Name=${doc.data().name || doc.data().clientName}, Location=${doc.data().location}, Active=${doc.data().active}`);
        });

    } catch (e) {
        console.error("Error during fast search:", e);
    }
    process.exit(0);
}

search();
