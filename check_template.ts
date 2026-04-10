import { getAdminDb } from './src/lib/firebase-admin';

async function check() {
    const db = getAdminDb();
    const doc1 = await db.collection('emailTemplates').doc('9NZAP74oNGLwtZrgiJIT').get();
    console.log("NOTE TEMPLATE ES:");
    console.log(doc1.data()?.versions['es']?.body);
}

check().catch(console.error);
