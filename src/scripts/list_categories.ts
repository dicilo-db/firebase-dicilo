
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function listCategories() {
    console.log("Fetching categories...");
    const snap = await getDocs(collection(db, "categories"));
    const data = snap.docs.map(d => ({ id: d.id, name: d.data().name }));
    console.log(JSON.stringify(data, null, 2));
    fs.writeFileSync("current_categories_dump_v2.json", JSON.stringify(data, null, 2));
    console.log("Dumped to current_categories_dump_v2.json");
    process.exit(0);
}

listCategories().catch(e => {
    console.error(e);
    process.exit(1);
});
