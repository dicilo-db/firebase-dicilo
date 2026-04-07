const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!process.env.FIREBASE_PROJECT_ID) {
  console.log("No env");
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  })
});

const db = getFirestore();
db.collection('trustboard_posts').limit(5).get().then(s => {
  s.docs.forEach(d => console.log(d.id, d.data()));
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
