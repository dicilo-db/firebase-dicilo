const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
    try {
        const q = query(collection(db, 'trustboard_posts'), limit(1));
        const snap = await getDocs(q);
        console.log("TrustBoard:", snap.size);
    } catch (e) {
        console.error("TrustBoard Error:", e.message);
    }

    try {
        const q2 = query(collection(db, 'community_posts'), limit(1));
        const snap2 = await getDocs(q2);
        console.log("Community:", snap2.size);
    } catch (e) {
        console.error("Community Error:", e.message);
    }
}

test();
