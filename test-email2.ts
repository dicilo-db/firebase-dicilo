import { getAdminDb } from './src/lib/firebase-admin';

async function run() {
    console.log("Testing getAdminDb...");
    try {
        const db = getAdminDb();
        const doc = await db.collection('email_templates').doc('NRyMkTfJ7Q06V8d9rsgD').get();
        console.log("Doc exists:", doc.exists);
    } catch (e) {
        console.error("Caught error:", e);
    }
}
run();
