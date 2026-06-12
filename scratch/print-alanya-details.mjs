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

async function printDetails() {
    try {
        const docRef = db.collection("businesses").doc("CZ8aPGq0OuxPUcCIO2UY");
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            console.log("Details for CZ8aPGq0OuxPUcCIO2UY (Alanya 5):");
            console.log(JSON.stringify(docSnap.data(), null, 2));
        } else {
            console.log("Document CZ8aPGq0OuxPUcCIO2UY not found");
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

printDetails();
