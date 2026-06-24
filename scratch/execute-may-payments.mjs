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
            rate,
            ownerUid: r.ownerUid || null
        });
    }

    if (pendingPayments.size === 0) {
        console.log("No pending referral payments found to process.");
        return;
    }

    console.log(`\nPreparing batch process for ${pendingPayments.size} referrers...`);
    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();

    let totalOpCount = 0;

    // 1. Process wallets increments
    for (const p of pendingPayments.values()) {
        const walletRef = db.collection('wallets').doc(p.id);
        const updateData = {
            updatedAt: now
        };

        if (p.currency === 'EUR') {
            updateData.eurBalance = admin.firestore.FieldValue.increment(p.amount);
            updateData.totalEurEarned = admin.firestore.FieldValue.increment(p.amount);
        } else {
            updateData.usdBalance = admin.firestore.FieldValue.increment(p.amount);
            updateData.totalUsdEarned = admin.firestore.FieldValue.increment(p.amount);
        }

        batch.set(walletRef, updateData, { merge: true });
        totalOpCount++;
        console.log(`- Wallet update queued: ${p.name} -> +${p.amount.toFixed(2)} ${p.currency}`);

        // 2. Process transactions & registration updates
        for (const reg of p.registrations) {
            // Write wallet transaction document
            const trxRef = db.collection('wallet_transactions').doc();
            batch.set(trxRef, {
                userId: p.id,
                amount: reg.rate,
                currency: p.currency,
                type: 'REFERRAL_CASH_BONUS',
                description: `Bono en efectivo (Directo) por activación de ${reg.name} (Mayo 2026)`,
                relatedUserId: reg.ownerUid || reg.id,
                timestamp: now
            });
            totalOpCount++;

            // Update registration status to paid
            const regRef = db.collection('registrations').doc(reg.id);
            batch.update(regRef, {
                referralRewardPaid: true,
                referralRewardPaidAt: now
            });
            totalOpCount++;
        }
    }

    console.log(`Executing batch with ${totalOpCount} operations...`);
    await batch.commit();
    console.log("\nSuccess! All May 2026 payments have been credited and registrations marked as paid.");
}

main().catch(err => {
    console.error("Error executing payments:", err);
});
