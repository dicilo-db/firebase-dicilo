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

    const referrers = new Map();
    mayRegs.forEach(r => {
        const refId = r.referrerId;
        if (!refId) return;
        if (!referrers.has(refId)) {
            const p = profilesMap.get(refId);
            referrers.set(refId, {
                id: refId,
                name: r.referrerName || p?.firstName + ' ' + (p?.lastName || '') || 'Unknown',
                country: p?.country || 'Unknown',
                city: p?.city || 'Unknown',
                role: p?.role || 'user',
                count: 0
            });
        }
        referrers.get(refId).count++;
    });

    console.log("\nReferidores activos en Mayo 2026:");
    for (const ref of referrers.values()) {
        console.log(`- ID: ${ref.id} | Nombre: ${ref.name} | Rol: ${ref.role} | Ubicación: ${ref.city}, ${ref.country} | Invitados: ${ref.count}`);
    }
}

main().catch(err => {
    console.error(err);
});
