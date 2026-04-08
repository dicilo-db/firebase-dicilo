const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const app = initializeApp();
const db = getFirestore();

async function run() {
  const q = await db.collection('businesses').where('city', '==', 'Hamburg').get();
  console.log('Hamburg city matches:', q.size);
  q.forEach(d => console.log(d.id, d.data().companyName, d.data().status, d.data().neighborhood));

  const q2 = await db.collection('businesses').where('neighborhood', '==', 'Hamburg').get();
  console.log('Hamburg neighborhood matches:', q2.size);
  q2.forEach(d => console.log(d.id, d.data().companyName, d.data().status, d.data().neighborhood));
}
run().catch(console.error);
