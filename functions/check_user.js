const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // if needed, or default

admin.initializeApp({
  // Use application default credentials or explicit
});

const db = admin.firestore();

async function checkUser() {
  const email = 'mmmrodriguez@hotmail.de';
  console.log(`Checking user: ${email}`);
  
  // Try finding in 'users'
  let snapshot = await db.collection('users').where('email', '==', email).get();
  if (snapshot.empty) {
    // Try finding in 'registrations'
    snapshot = await db.collection('registrations').where('email', '==', email).get();
  }
  if (snapshot.empty) {
     snapshot = await db.collection('clients').where('email', '==', email).get();
  }
  
  if (snapshot.empty) {
    console.log('User not found in users, registrations, or clients collections.');
  } else {
    snapshot.forEach(doc => {
      console.log(`Found in collection. ID: ${doc.id}`);
      console.log(doc.data());
    });
  }
}

checkUser().catch(console.error);
