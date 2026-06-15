import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

async function main() {
    console.log("Initializing Firebase Admin...");
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

    console.log("Fetching private_profiles...");
    const profilesSnap = await db.collection('private_profiles').get();
    const profiles = profilesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Loaded ${profiles.length} profiles.`);

    console.log("Fetching wallets...");
    const walletsSnap = await db.collection('wallets').get();
    const wallets = walletsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Loaded ${wallets.length} wallets.`);

    console.log("Fetching wallet_transactions...");
    const txSnap = await db.collection('wallet_transactions').get();
    const transactions = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Loaded ${transactions.length} transactions.`);

    // Date Range: May 1 to May 31, 2026
    const start = new Date('2026-05-01T00:00:00.000Z');
    const end = new Date('2026-05-31T23:59:59.999Z');

    console.log(`Filtering registrations between ${start.toISOString()} and ${end.toISOString()}...`);

    const mayRegistrations = profiles.filter(p => {
        if (!p.createdAt) return false;
        let date;
        if (typeof p.createdAt.toDate === 'function') {
            date = p.createdAt.toDate();
        } else {
            date = new Date(p.createdAt);
        }
        return date >= start && date <= end;
    });

    console.log(`Found ${mayRegistrations.length} registrations in May 2026.`);

    // Build map of profiles for fast lookup
    const profilesMap = new Map();
    profiles.forEach(p => profilesMap.set(p.id, p));

    const report = [];
    const inconsistencies = [];

    for (const user of mayRegistrations) {
        let dateStr = "";
        if (user.createdAt && typeof user.createdAt.toDate === 'function') {
            dateStr = user.createdAt.toDate().toISOString();
        } else {
            dateStr = new Date(user.createdAt).toISOString();
        }

        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No Name';
        const email = user.email || 'No Email';
        const uid = user.id;
        const userCode = user.uniqueCode || '';

        // Referrer
        const referrerId = user.referredBy;
        let referrer = null;
        if (referrerId) {
            referrer = profilesMap.get(referrerId);
        }

        let referrerName = 'None';
        let referrerCode = 'None';
        let referrerRole = 'None';
        let referrerEmail = 'None';

        if (referrer) {
            referrerName = `${referrer.firstName || ''} ${referrer.lastName || ''}`.trim() || 'No Name';
            referrerCode = referrer.uniqueCode || 'N/A';
            referrerRole = referrer.role || (referrer.isFreelancer ? 'freelancer' : 'user');
            referrerEmail = referrer.email || 'N/A';
        }

        // Expected Rates in audit context
        // Note: the system writes REFERRAL_REWARD with 30 or 50 DP literally on registration.
        // But generateReferralAuditReport uses rateDP = 2.5 or 5.0 and rateEUR = 0.25 or 0.50.
        // Let's check: 30 DP and 50 DP are literal. Let's record both standard transaction values (e.g. 30/50 DP) and audit rate.
        let rateEUR = 0;
        let rateDP = 0;

        if (referrer) {
            if (referrerRole === 'team_leader' || referrerRole === 'admin' || referrerRole === 'superadmin' || referrerRole === 'team_office') {
                rateEUR = 0.50;
                rateDP = 5.0; // or 50 DP literal in transaction
            } else if (referrerRole === 'freelancer') {
                rateEUR = 0.25;
                rateDP = 2.5; // or 25/30 DP literal in transaction
            } else {
                rateEUR = 0.25;
                rateDP = 2.5; // or 25/30 DP literal in transaction
            }
        }

        // Check paid transactions
        let paidDP = 0;
        let paidEUR = 0;
        const matchingTxs = [];

        if (referrerId) {
            transactions.forEach(tx => {
                if (tx.userId === referrerId) {
                    const desc = (tx.description || '').toLowerCase();
                    const type = (tx.type || '').toLowerCase();
                    
                    const matchesUid = desc.includes(uid.toLowerCase());
                    const matchesCode = userCode && desc.includes(userCode.toLowerCase());
                    
                    const nameParts = name.toLowerCase().split(' ');
                    const matchesName = nameParts.length > 0 && nameParts.every(part => part.length > 2 && desc.includes(part));
                    
                    const isReferralTx = type.includes('referral') || type.includes('welcome') || type.includes('bonus') || type.includes('reward');

                    if (matchesUid || matchesCode || (isReferralTx && matchesName)) {
                        matchingTxs.push(tx);
                        if (tx.currency === 'EUR' || tx.type?.includes('EUR') || desc.includes('eur') || desc.includes('efectivo') || tx.type === 'REFERRAL_CASH_BONUS') {
                            paidEUR += tx.amount || 0;
                        } else {
                            paidDP += tx.amount || 0;
                        }
                    }
                }
            });
        }

        // Inconsistency check:
        // A registration is inconsistent if it has a referrer but paidDP is 0 (i.e. no transaction recorded).
        let isIncorrect = false;
        let reason = "";

        if (referrerId) {
            if (paidDP === 0) {
                isIncorrect = true;
                reason += `No DP transaction found for this registration. `;
            }
            // For Cash EUR, since there is no automatic transaction on registration,
            // having paidEUR = 0 is expected in DB, but let's note it.
        } else {
            if (user.referrerCode) {
                isIncorrect = true;
                reason += `Has referrerCode '${user.referrerCode}' but referredBy is empty! `;
            }
        }

        const regItem = {
            uid,
            name,
            email,
            userCode,
            createdAt: dateStr,
            referrer: referrerId ? {
                id: referrerId,
                name: referrerName,
                code: referrerCode,
                role: referrerRole,
                email: referrerEmail
            } : null,
            payment: referrerId ? {
                rateDP,
                rateEUR,
                paidDP,
                paidEUR,
                isIncorrect,
                reason
            } : null,
            hasReferrerCode: user.referrerCode || null
        };

        report.push(regItem);
        if (isIncorrect) {
            inconsistencies.push(regItem);
        }
    }

    // Aggregate by referrer
    const referrerAggregates = {};
    for (const item of report) {
        if (!item.referrer) continue;
        const refId = item.referrer.id;
        if (!referrerAggregates[refId]) {
            referrerAggregates[refId] = {
                referrer: item.referrer,
                invitedUsers: [],
                totalExpectedDP: 0,
                totalExpectedEUR: 0,
                totalPaidDP: 0,
                totalPaidEUR: 0
            };
        }
        referrerAggregates[refId].invitedUsers.push({
            uid: item.uid,
            name: item.name,
            email: item.email,
            userCode: item.userCode,
            createdAt: item.createdAt,
            payment: item.payment
        });
        referrerAggregates[refId].totalExpectedDP += item.payment.rateDP;
        referrerAggregates[refId].totalExpectedEUR += item.payment.rateEUR;
        referrerAggregates[refId].totalPaidDP += item.payment.paidDP;
        referrerAggregates[refId].totalPaidEUR += item.payment.paidEUR;
    }

    // Write full output to a JSON file
    fs.writeFileSync('scratch/audit_results_may_2026.json', JSON.stringify({ report, referrerAggregates, inconsistencies }, null, 2));
    console.log("Auditoría completa escrita en scratch/audit_results_may_2026.json");
}

main().catch(err => {
    console.error("Error running audit:", err);
});
