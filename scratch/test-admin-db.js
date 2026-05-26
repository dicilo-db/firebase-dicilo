const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envLocal = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const match = envLocal.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(.*)'/);
if (!match) {
    console.error("Could not find service account key in .env.local");
    process.exit(1);
}

let keyStr = match[1].trim();
keyStr = keyStr.replace(/\\\\n/g, '\\n');
// Node regex replacement for string parsing: we need to handle actual escaped newlines or literals
const serviceAccount = JSON.parse(keyStr);
if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'geosearch-fq4i9',
});

const db = admin.firestore();

async function run() {
    console.log("Fetching counts...");
    const [reg, prof, cli] = await Promise.all([
        db.collection('registrations').get(),
        db.collection('private_profiles').get(),
        db.collection('clients').get()
    ]);
    console.log("Registrations size:", reg.size);
    console.log("Private Profiles size:", prof.size);
    console.log("Clients size:", cli.size);
    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
