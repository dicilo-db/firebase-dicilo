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

    console.log("Fetching registrations...");
    const registrationsSnap = await db.collection('registrations').get();
    const regs = registrationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log("Fetching private_profiles...");
    const profilesSnap = await db.collection('private_profiles').get();
    const profiles = profilesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const profilesMap = new Map(profiles.map(p => [p.id, p]));

    // May 2026 Range
    const start = new Date('2026-05-01T00:00:00.000Z');
    const end = new Date('2026-05-31T23:59:59.999Z');

    const mayRegs = regs.filter(r => {
        if (!r.createdAt) return false;
        const date = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
        return date >= start && date <= end;
    });

    console.log(`Found ${mayRegs.length} registrations in May 2026.`);

    const pendingPayments = new Map();

    for (const r of mayRegs) {
        const refId = r.referrerId;
        if (!refId) continue;

        // Check if email is verified
        const isVerified = r.isEmailVerified !== false;
        if (!isVerified) continue;

        // Check if already paid
        if (r.referralRewardPaid === true) {
            continue; // Already paid
        }

        const p = profilesMap.get(refId);
        if (!p) {
            console.warn(`Referrer profile not found for ID: ${refId} (${r.referrerName})`);
        }

        const role = p?.role || 'user';
        const country = p?.country || 'VE'; // default to VE if missing
        
        // Determine currency: Europe -> EUR, Rest -> USD
        const isEurope = ['DE', 'ES', 'AT', 'CH', 'FR', 'IT', 'PT', 'BE', 'NL', 'LU'].some(c => 
            country.toUpperCase().includes(c)
        ) || country.toLowerCase().includes('alemania') || country.toLowerCase().includes('españa') || country.toLowerCase().includes('hamburg');
        
        const currency = isEurope ? 'EUR' : 'USD';

        // Determine rate
        let rate = 0.25;
        if (role === 'team_leader' || role === 'admin' || role === 'superadmin' || role === 'team_office') {
            rate = 0.50;
        }

        if (!pendingPayments.has(refId)) {
            pendingPayments.set(refId, {
                id: refId,
                name: r.referrerName || p?.firstName + ' ' + (p?.lastName || '') || 'Unknown',
                country,
                role,
                currency,
                invitesCount: 0,
                amount: 0,
                registrations: []
            });
        }

        const entry = pendingPayments.get(refId);
        entry.invitesCount++;
        entry.amount += rate;
        entry.registrations.push({
            id: r.id,
            name: r.businessName || r.firstName + ' ' + (r.lastName || ''),
            email: r.email,
            rate
        });
    }

    console.log("\nCálculo de pagos pendientes de Mayo 2026:");
    let totalEUR = 0;
    let totalUSD = 0;

    for (const p of pendingPayments.values()) {
        console.log(`- Referidor: ${p.name} (${p.id})`);
        console.log(`  Rol: ${p.role} | País: ${p.country}`);
        console.log(`  A pagar: ${p.amount.toFixed(2)} ${p.currency} (por ${p.invitesCount} invitados)`);
        if (p.currency === 'EUR') totalEUR += p.amount;
        else totalUSD += p.amount;
    }

    console.log(`\nTOTALES GENERALES A PAGAR:`);
    console.log(`- total EUR: €${totalEUR.toFixed(2)}`);
    console.log(`- total USD: $${totalUSD.toFixed(2)}`);
}

main().catch(err => {
    console.error(err);
});
