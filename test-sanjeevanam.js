const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json'); // wait, let me use the default app auth

admin.initializeApp({
  projectId: 'geosearch-fq4i9',
  credential: admin.credential.applicationDefault()
});

async function run() {
  const db = admin.firestore();
  const snapshot = await db.collection('recommendations').where('companyName', '==', 'SANJEEVANAM').get();
  console.log("SANJEEVANAM Recoms found: ", snapshot.docs.length);
  snapshot.docs.forEach(doc => {
      console.log(doc.id, doc.data());
  });
}
run().catch(console.error);
