import { getAdminDb } from './src/lib/firebase-admin';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    console.log("Testing getAdminDb...");
    try {
        const db = getAdminDb();
        const doc = await db.collection('email_templates').doc('NRyMkTfJ7Q06V8d9rsgD').get();
        console.log("Template NRyMkTfJ7Q06V8d9rsgD exists:", doc.exists);

        const doc2 = await db.collection('email_templates').doc('9NZAP74oNGLwtZrgiJIT').get();
        console.log("Template 9NZAP74oNGLwtZrgiJIT exists:", doc2.exists);
    } catch (e: any) {
        console.error("Caught error:", e.message);
    }
}
run();
