const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "geosearch-fq4i9",
  appId: "1:382703499489:web:88d6bf76f4cffe84d15fa0",
  storageBucket: "geosearch-fq4i9.firebasestorage.app",
  apiKey: "AIzaSyCCGBqtGt-sefut4RHfwaTs4bDGCfPjp9E",
  authDomain: "geosearch-fq4i9.firebaseapp.com",
  messagingSenderId: "382703499489"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function search() {
  const q = query(collection(db, 'trustboard_posts'), limit(10));
  const snap = await getDocs(q);
  console.log(`Found ${snap.size} trustboard posts`);
  snap.forEach(doc => {
    console.log("ID:", doc.id);
    console.log("Data:", JSON.stringify(doc.data(), null, 2));
    console.log("----------------------");
  });
  
  process.exit(0);
}

search().catch(console.error);
