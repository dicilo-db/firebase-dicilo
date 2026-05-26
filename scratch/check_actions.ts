import { getAdminDb } from '../src/lib/firebase-admin';

async function checkActions() {
  const db = getAdminDb();
  console.log('Fetching a few documents from user_campaign_actions...');
  const snapshot = await db.collection('user_campaign_actions').limit(3).get();
  if (snapshot.empty) {
    console.log('No documents found in user_campaign_actions');
  } else {
    snapshot.forEach(doc => {
      console.log(`Doc ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  }
}
checkActions();
