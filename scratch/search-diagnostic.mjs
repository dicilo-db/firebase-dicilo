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
  console.log("=== DE FRIES EXPRESS DETAILS ===");
  const doc = await db.collection('businesses').doc('pvLt8xbmP9uzhlaFR9V2').get();
  if (doc.exists) {
    console.log(JSON.stringify(doc.data(), null, 2));
  } else {
    console.log("Not found in businesses");
    const docClient = await db.collection('clients').doc('pvLt8xbmP9uzhlaFR9V2').get();
    if (docClient.exists) {
      console.log(JSON.stringify(docClient.data(), null, 2));
    } else {
      console.log("Not found in clients either");
    }
  }
  process.exit(0);
}

run().catch(console.error);
