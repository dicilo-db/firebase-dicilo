import { getAdminDb } from './src/lib/firebase-admin';

async function checkUser() {
  const email = 'mmmrodriguez@hotmail.de';
  const db = getAdminDb();
  console.log(`Checking user: ${email}`);
  
  let snapshot = await db.collection('private_profiles').where('email', '==', email).get();
  if (!snapshot.empty) {
     console.log('Found in private_profiles:', snapshot.docs[0].id, snapshot.docs[0].data());
  } else {
     console.log('Not in private_profiles');
  }

  snapshot = await db.collection('clients').where('email', '==', email).get();
  if (!snapshot.empty) {
     console.log('Found in clients:', snapshot.docs[0].id, snapshot.docs[0].data());
  } else {
     console.log('Not in clients');
  }
}
checkUser();
