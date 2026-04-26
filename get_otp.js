const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // assuming it exists from earlier
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
async function run() {
  const snapshot = await db.collection('private_profiles').where('uniqueCode', '==', 'DHH26DZ00173').get();
  if (snapshot.empty) {
    console.log("Not found in private_profiles, checking registrations...");
    const regSnap = await db.collection('registrations').where('uniqueCode', '==', 'DHH26DZ00173').get();
    if (regSnap.empty) {
      console.log("Not found anywhere.");
    } else {
      console.log(regSnap.docs[0].data().emailVerificationCode);
    }
  } else {
    console.log(snapshot.docs[0].data().emailVerificationCode);
  }
}
run();
