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
    console.log("Searching Firestore collections (via Firebase Admin) for 'Alanya' or 'Düsseldorf'...");

    try {
        // Search in businesses
        console.log("\n--- Searching in 'businesses' collection ---");
        const bSnap = await db.collection("businesses").get();
        let bFound = 0;
        bSnap.forEach((doc) => {
            const data = doc.data();
            const name = data.name || data.clientName || '';
            const location = data.location || '';
            const address = data.address || '';
            
            const matchAlanya = name.toLowerCase().includes("alanya");
            const matchDusseldorf = location.toLowerCase().includes("düsseldorf") || 
                                    address.toLowerCase().includes("düsseldorf") ||
                                    location.toLowerCase().includes("dusseldorf") ||
                                    address.toLowerCase().includes("dusseldorf");
            
            if (matchAlanya || matchDusseldorf) {
                bFound++;
                console.log(`[businesses] ID: ${doc.id}`);
                console.log(`  Name: ${name}`);
                console.log(`  Location: ${location}`);
                console.log(`  Address: ${address}`);
                console.log(`  Active: ${data.active}`);
                console.log(`  Coords:`, data.coords || data.coordinates);
                console.log(`  Visibility Settings:`, data.visibility_settings);
            }
        });
        console.log(`Total matching businesses found: ${bFound}`);

        // Search in clients
        console.log("\n--- Searching in 'clients' collection ---");
        const cSnap = await db.collection("clients").get();
        let cFound = 0;
        cSnap.forEach((doc) => {
            const data = doc.data();
            const name = data.name || data.clientName || '';
            const location = data.location || '';
            const address = data.address || '';
            
            const matchAlanya = name.toLowerCase().includes("alanya");
            const matchDusseldorf = location.toLowerCase().includes("düsseldorf") || 
                                    address.toLowerCase().includes("düsseldorf") ||
                                    location.toLowerCase().includes("dusseldorf") ||
                                    address.toLowerCase().includes("dusseldorf");
            
            if (matchAlanya || matchDusseldorf) {
                cFound++;
                console.log(`[clients] ID: ${doc.id}`);
                console.log(`  Name: ${name}`);
                console.log(`  Location: ${location}`);
                console.log(`  Address: ${address}`);
                console.log(`  Active: ${data.active}`);
                console.log(`  Coords:`, data.coords || data.coordinates);
                console.log(`  Visibility Settings:`, data.visibility_settings);
            }
        });
        console.log(`Total matching clients found: ${cFound}`);

    } catch (e) {
        console.error("Error during search:", e);
    }
    process.exit(0);
}

search();
