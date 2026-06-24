import dotenv from 'dotenv';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'geosearch-fq4i9',
});

const db = admin.firestore();

async function audit() {
    console.log("=========================================================");
    console.log("🔍 AUDIT: WALLET BALANCES AND MAY REFERRAL PAYMENTS");
    console.log("=========================================================");

    const start = new Date(Date.UTC(2026, 4, 1, 0, 0, 0, 0)); // May 1st
    const end = new Date(Date.UTC(2026, 5, 0, 23, 59, 59, 999)); // May 31st

    try {
        // 1. Fetch all private profiles
        const profilesSnap = await db.collection('private_profiles').get();
        const profilesMap = new Map();
        profilesSnap.docs.forEach(doc => {
            profilesMap.set(doc.id, doc.data());
        });

        // 2. Fetch all wallets
        const walletsSnap = await db.collection('wallets').get();
        const walletsMap = new Map();
        walletsSnap.docs.forEach(doc => {
            walletsMap.set(doc.id, doc.data());
        });

        // 3. Fetch all registrations from May
        const regsSnap = await db.collection('registrations')
            .where('createdAt', '>=', start)
            .where('createdAt', '<=', end)
            .get();

        console.log(`May Registrations found: ${regsSnap.size}`);

        const referrersAudit = {};

        regsSnap.docs.forEach(doc => {
            const data = doc.data();
            const referrerId = data.referrerId;
            if (!referrerId) return;

            const isVerified = data.isEmailVerified !== false;
            const isPaid = data.referralRewardPaid !== false;

            if (!referrersAudit[referrerId]) {
                const rProfile = profilesMap.get(referrerId) || {};
                const rWallet = walletsMap.get(referrerId) || { balance: 0, eurBalance: 0 };
                referrersAudit[referrerId] = {
                    name: `${rProfile.firstName || ''} ${rProfile.lastName || ''}`.trim() || 'Desconocido',
                    role: rProfile.role || (rProfile.isFreelancer ? 'freelancer' : 'user'),
                    email: rProfile.email || 'N/A',
                    walletEur: rWallet.eurBalance || 0,
                    walletDp: rWallet.balance || 0,
                    mayRegistrations: []
                };
            }

            referrersAudit[referrerId].mayRegistrations.push({
                id: doc.id,
                businessName: data.businessName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                isVerified,
                isPaid,
                createdAt: data.createdAt?.toDate().toISOString()
            });
        });

        console.log("\nSummary of referrers and their May referrals:");
        for (const [refId, auditData] of Object.entries(referrersAudit)) {
            const total = auditData.mayRegistrations.length;
            const verified = auditData.mayRegistrations.filter(r => r.isVerified).length;
            const paid = auditData.mayRegistrations.filter(r => r.isPaid).length;
            
            // Expected rewards:
            let rateEUR = 0.25;
            let rateDP = 25.0;
            if (['team_leader', 'team_office', 'admin', 'superadmin'].includes(auditData.role)) {
                rateEUR = 0.50;
                rateDP = 50.0;
            }

            const expectedEUR = verified * rateEUR;
            const expectedDP = verified * rateDP;

            console.log(`\nPatrocinador: ${auditData.name} (${auditData.role.toUpperCase()})`);
            console.log(`  Email: ${auditData.email} | ID: ${refId}`);
            console.log(`  Registros May: Total ${total} | Verificados ${verified} | Pagados en RegsDoc ${paid}`);
            console.log(`  Esperado por estos regs: €${expectedEUR.toFixed(2)} | ${expectedDP} DP`);
            console.log(`  Saldo actual en Billetera (wallets/): €${auditData.walletEur.toFixed(2)} | ${auditData.walletDp} DP`);
            
            // Discrepancy checks
            const hasDiscrepancy = auditData.walletEur < expectedEUR;
            if (hasDiscrepancy) {
                console.log(`  ⚠️  ALERTA: El saldo actual en Tarjeta Verde (€${auditData.walletEur.toFixed(2)}) es menor al esperado por los registros de mayo (€${expectedEUR.toFixed(2)})!`);
            } else {
                console.log(`  ✅ OK: El saldo en billetera cubre o supera las ganancias de mayo.`);
            }
        }

    } catch (e) {
        console.error("Audit failed:", e);
    }
    process.exit(0);
}

audit();
