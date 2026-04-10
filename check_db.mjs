
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    projectId: "geosearch-fq4i9",
    appId: "1:382703499489:web:88d6bf76f4cffe84d15fa0",
    apiKey: "AIzaSyCCGBqtGt-sefut4RHfwaTs4bDGCfPjp9E",
    authDomain: "geosearch-fq4i9.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
    console.log("Checking DB...");

    try {
        // 1. Check Categories
        const catsSnap = await getDocs(collection(db, "categories"));
        console.log("Categories Count:", catsSnap.size);
        if (catsSnap.size > 0) {
            const first = catsSnap.docs[0].data();
            console.log("First Category:", first.name?.de);
        } else {
            console.log("WARNING: No categories found!");
        }

        // 2. Check Business "absotec"
        const businessRef = doc(db, "businesses", "absotec");
        const bSnap = await getDoc(businessRef);

        if (bSnap.exists()) {
            console.log("Business Found: absotec");
            const d = bSnap.data();
            console.log("Coords:", d.coords);
            console.log("Category String:", d.category);
        } else {
            console.log("Business 'absotec' NOT FOUND by ID.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

check();
