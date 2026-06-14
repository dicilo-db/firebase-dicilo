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
  console.log("=== ACTIVATING SICHTBAR IN CLIENTS ===");
  const docRef = db.collection('clients').doc('Qt9u8Pd1Qi52AM0no2uw');
  const doc = await docRef.get();
  if (doc.exists) {
    console.log("Found client 'SiCHTBAR Augenoptik'. Current active status:", doc.data().active);
    await docRef.update({
      active: true,
      deactivated_at: admin.firestore.FieldValue.delete(),
      deactivated_reason: admin.firestore.FieldValue.delete()
    });
    console.log("Updated active to true and cleared deactivation fields.");
  } else {
    console.log("Client 'SiCHTBAR Augenoptik' not found!");
  }
  process.exit(0);
}

run().catch(console.error);
