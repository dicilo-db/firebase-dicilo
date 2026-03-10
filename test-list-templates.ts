import { getAdminDb } from './src/lib/firebase-admin';

async function listAllTemplates() {
    const db = getAdminDb();
    const snap = await db.collection('email_templates').get();
    console.log(`Found ${snap.size} templates in DB.`);
    snap.forEach(doc => {
        const data = doc.data();
        console.log(`- [${doc.id}] Name: "${data.name}" | Category: "${data.category}"`);
    });
}

listAllTemplates().catch(console.error);
