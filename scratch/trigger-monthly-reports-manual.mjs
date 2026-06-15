import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const admin = require('../functions/node_modules/firebase-admin');

// 1. Load configuration from .env.local
dotenv.config({ path: '.env.local' });

// Parse command line arguments
const args = process.argv.slice(2);
const yearArg = args.find(a => a.startsWith('--year='));
const monthArg = args.find(a => a.startsWith('--month='));
const emailArg = args.find(a => a.startsWith('--email='));
const isExecute = args.includes('--execute');
const isTest = args.includes('--test') || !isExecute; // default to test mode if --execute is not provided

const year = yearArg ? parseInt(yearArg.split('=')[1]) : 2026;
const month = monthArg ? parseInt(monthArg.split('=')[1]) : 5; // Default to May
const testEmail = emailArg ? emailArg.split('=')[1] : 'niloescolar@gmail.com'; // Default test email

async function main() {
    console.log("=========================================================");
    console.log(`🚀 MANUAL REPORT TRIGGER: Month ${month}/${year}`);
    console.log(`   Mode: ${isExecute ? (isTest ? 'TEST (Sends to one email)' : 'PRODUCTION (Sends to real users)') : 'DRY RUN (No emails, saves PDFs locally)'}`);
    if (isTest) {
        console.log(`   Test Email Override: ${testEmail}`);
    }
    console.log("=========================================================");

    // Initialize Firebase Admin SDK
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.error("❌ ERROR: Missing FIREBASE_SERVICE_ACCOUNT_KEY in .env.local");
        process.exit(1);
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    // Initialize admin SDK before importing functions
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'geosearch-fq4i9',
    });

    // Import compiled reports code from functions
    const { runMonthlyReport, generateFreelancerPDF, generateAdminPDF } = await import('../functions/lib/reports.js');

    if (!isExecute) {
        // DRY RUN: Let's fetch data and generate PDFs locally without sending any emails
        console.log("\n🔍 Running Dry Run. Fetching records and saving PDFs locally...");
        const db = admin.firestore();

        const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        
        console.log(`Range: ${start.toISOString()} to ${end.toISOString()}`);

        const profilesSnap = await db.collection('private_profiles').get();
        const allProfiles = profilesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const newUsers = allProfiles.filter(p => {
            if (!p.createdAt) return false;
            let date;
            if (typeof p.createdAt.toDate === 'function') {
                date = p.createdAt.toDate();
            } else {
                date = new Date(p.createdAt);
            }
            return date >= start && date <= end;
        });

        console.log(`Found ${newUsers.length} total registrations.`);

        const groupedByReferrer = {};
        newUsers.forEach(user => {
            const refId = user.referredBy;
            if (!refId) return;
            if (!groupedByReferrer[refId]) {
                groupedByReferrer[refId] = [];
            }
            groupedByReferrer[refId].push(user);
        });

        const summaryList = [];
        let platformTotalDP = 0;
        let platformTotalCash = 0;

        for (const [refId, invitedUsers] of Object.entries(groupedByReferrer)) {
            const referrer = allProfiles.find(p => p.id === refId);
            if (!referrer) continue;
            
            const role = referrer.role || (referrer.isFreelancer ? 'freelancer' : 'user');
            
            let rateEUR = 0.25;
            let rateDP = 25.0;
            if (['team_leader', 'team_office', 'admin', 'superadmin'].includes(role)) {
                rateEUR = 0.50;
                rateDP = 50.0;
            }

            const count = invitedUsers.length;
            const earnedDP = count * rateDP;
            const earnedCash = count * rateEUR;

            platformTotalDP += earnedDP;
            platformTotalCash += earnedCash;

            summaryList.push({
                referrerId: refId,
                name: `${referrer.firstName || ''} ${referrer.lastName || ''}`.trim() || 'No Name',
                email: referrer.email,
                code: referrer.uniqueCode || 'N/A',
                role,
                invitedCount: count,
                earnedDP,
                earnedCash,
                invitedUsers
            });
        }

        summaryList.sort((a, b) => b.invitedCount - a.invitedCount);
        console.log(`\n--- Active Referrers Summary (${summaryList.length} referrers) ---`);
        
        // Ensure scratch/temp_pdfs exists
        const pdfDir = 'scratch/temp_pdfs';
        if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true });
        }

        // Generate and save PDFs
        for (const summary of summaryList) {
            console.log(`- ${summary.name} (${summary.role.toUpperCase()}): ${summary.invitedCount} guests | Expected: ${summary.earnedDP} DP | €${summary.earnedCash.toFixed(2)}`);
            
            if (!['freelancer', 'team_leader', 'team_office', 'admin', 'superadmin'].includes(summary.role)) {
                console.log("  ⚠️ Skipping PDF (not freelancer or above)");
                continue;
            }

            const pdfBuffer = generateFreelancerPDF(
                summary.name,
                summary.code,
                summary.role,
                `Mayo 2026`,
                summary.invitedUsers,
                summary.earnedDP,
                summary.earnedCash
            );
            
            const fileName = path.join(pdfDir, `Reporte_Freelancer_${summary.name.replace(/\s+/g, '_')}.pdf`);
            fs.writeFileSync(fileName, pdfBuffer);
            console.log(`  Saved PDF: ${fileName}`);
        }

        // Generate and save admin PDF
        const adminPdfBuffer = generateAdminPDF(`Mayo 2026`, newUsers, {
            totalRegistrations: newUsers.length,
            totalWithReferrer: newUsers.filter(u => u.referredBy).length,
            activeReferrers: summaryList.length,
            platformTotalDP,
            platformTotalCash
        });
        const adminFileName = path.join(pdfDir, `Reporte_Global_Admin.pdf`);
        fs.writeFileSync(adminFileName, adminPdfBuffer);
        console.log(`  Saved Global Admin PDF: ${adminFileName}`);
        
        console.log("\n✅ DRY RUN COMPLETE. Review the PDFs generated in scratch/temp_pdfs/");
        console.log("To actually send emails, run with --execute (in test mode by default) or with --execute --test=false for real users.");
        console.log("Example: npx node scratch/trigger-monthly-reports-manual.mjs --execute --email=your_email@gmail.com");
    } else {
        // ACTUAL EXECUTION (either test override or production)
        console.log("\n📧 Executing report generation and email dispatch...");
        await runMonthlyReport(year, month, isTest, isTest ? testEmail : undefined);
        console.log("\n✅ EXECUTION COMPLETED.");
    }
    
    process.exit(0);
}

main().catch(err => {
    console.error("❌ Critical error:", err);
    process.exit(1);
});
