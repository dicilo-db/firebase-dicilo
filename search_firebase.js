const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

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
  const email = "viajes@niovatraveltours.es";
  const collections = ['users', 'clients', 'registrations', 'businesses'];
  
  for (const coll of collections) {
    const q = query(collection(db, coll), where("email", "==", email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      console.log(`\nFound in collection: ${coll}`);
      snap.forEach(doc => {
        console.log("ID:", doc.id);
        console.log("Data:", doc.data());
      });
    }
  }
  
  // also try a blind search across all registrations just in case
  const regQ = query(collection(db, 'registrations'));
  const regSnap = await getDocs(regQ);
  console.log(`\nChecked ${regSnap.size} total registrations... looking for ANY match of the string NIOVA or ADNNY`);
  regSnap.forEach(doc => {
    const d = JSON.stringify(doc.data()).toLowerCase();
    if (d.includes("niova") || d.includes("adnny")) {
      console.log("\nFound partial match in registrations!");
      console.log("ID:", doc.id);
      console.log("Data:", doc.data());
    }
  });

  // also try users
  const userQ = query(collection(db, 'users'));
  const userSnap = await getDocs(userQ);
  console.log(`\nChecked ${userSnap.size} total users... looking for ANY match of the string NIOVA or ADNNY`);
  userSnap.forEach(doc => {
    const d = JSON.stringify(doc.data()).toLowerCase();
    if (d.includes("niova") || d.includes("adnny")) {
      console.log("\nFound partial match in users!");
      console.log("ID:", doc.id);
      console.log("Data:", doc.data());
    }
  });
  
  process.exit(0);
}

search().catch(console.error);
