const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

async function check() {
  const snapshot = await db.collection('trustboard_posts').orderBy('createdAt', 'desc').limit(5).get();
  console.log('--- LATEST 5 TRUSTBOARD POSTS ---');
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`Title: ${typeof data.title === 'string' ? data.title : JSON.stringify(data.title)}`);
    console.log(`Status: ${data.status}`);
    console.log(`Category: ${data.category}`);
    console.log(`Neighborhood: ${data.neighborhood}`);
    console.log(`Author: ${data.authorName}`);
    console.log('---------------------------');
  });
}

check().catch(console.error);
