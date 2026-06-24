import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY in env");
        process.exit(1);
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'geosearch-fq4i9',
    });

    const db = admin.firestore();

    console.log("Fetching wallets...");
    const walletsSnap = await db.collection('wallets').get();
    const wallets = walletsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log("Fetching private_profiles...");
    const profilesSnap = await db.collection('private_profiles').get();
    const profiles = profilesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const profilesMap = new Map(profiles.map(p => [p.id, p]));

    console.log("\nAuditing wallets for incorrect currencies (Non-Europeans with EUR balances)...");

    const anomalies = [];

    for (const w of wallets) {
        const p = profilesMap.get(w.id);
        const country = p?.country || '';
        const name = p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : 'Unknown';

        const isEurope = ['DE', 'ES', 'AT', 'CH', 'FR', 'IT', 'PT', 'BE', 'NL', 'LU'].some(c => 
            country.toUpperCase().includes(c)
        ) || country.toLowerCase().includes('alemania') || country.toLowerCase().includes('españa') || country.toLowerCase().includes('hamburg');

        if (!isEurope && w.eurBalance > 0) {
            anomalies.push({
                uid: w.id,
                name,
                country,
                role: p?.role || 'user',
                eurBalance: w.eurBalance,
                usdBalance: w.usdBalance || 0
            });
        }
    }

    console.log(`Found ${anomalies.length} non-European users with EUR balances:`);
    anomalies.forEach(a => {
        console.log(`- ${a.name} (${a.uid}) | País: ${a.country} | Rol: ${a.role} | EUR Balance: ${a.eurBalance} | USD Balance: ${a.usdBalance}`);
    });
}

main().catch(err => {
    console.error(err);
});
