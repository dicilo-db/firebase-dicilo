const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(require('./backup_verify.json'))
    });
}

const db = admin.firestore();

async function run() {
    const snap = await db.collection('businesses').get();
    const all = snap.docs.map(d => ({id: d.id, ...d.data()}));
    
    const hor = all.find(b => String(b.companyName).toLowerCase().includes('horcomfort'));
    console.log("HorComfort Data:", hor ? JSON.stringify({
        name: hor.companyName,
        neighborhood: hor.neighborhood,
        city: hor.city,
        status: hor.status
    }, null, 2) : "Not found");
}

run().catch(console.error);
