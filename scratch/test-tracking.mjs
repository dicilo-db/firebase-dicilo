import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fetch from 'node-fetch'; // Standard fetch is available in node 18+, but let's just use global fetch if available, or dynamic import

dotenv.config({ path: '.env.local' });

const PROJECT_ID = 'geosearch-fq4i9';

// Init admin db
let serviceAccount;
try {
    let keyStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
    if ((keyStr.startsWith("'") && keyStr.endsWith("'")) || (keyStr.startsWith('"') && keyStr.endsWith('"'))) {
        keyStr = keyStr.slice(1, -1);
    }
    keyStr = keyStr.replace(/\\\\n/g, '\\n');
    serviceAccount = JSON.parse(keyStr);
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
} catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID,
});

const db = admin.firestore();

async function runTests() {
    console.log("🚀 Starting Tracking API Integration Tests...");

    const campaignId = "test_camp_perf_v2";
    const freelancerId = "test_free_perf_v2";
    const linkId = "test_link_perf_v2";

    // Clean up if any leftovers exist
    await cleanUp(campaignId, freelancerId, linkId);

    // 1. Seed Initial Data
    console.log("⚙️ Seeding test documents...");
    await db.collection('campaigns').doc(campaignId).set({
        title: "Test Campaign V2 Performance",
        budget_total: 100.00,
        budget_remaining: 100.00,
        reward_per_action: 0.20,
        payment_model: 'fixed_plus_bonus',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('wallets').doc(freelancerId).set({
        balance: 0.00,
        totalEarned: 0.00,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('freelancer_links').doc(linkId).set({
        campaignId: campaignId,
        freelancerId: freelancerId,
        paymentModel: 'fixed_plus_bonus',
        clickCount: 4, // 5th click will trigger bonus
        bonusPaidStatus: false,
        status: 'active',
        companyName: "Test Campaign V2 Performance",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log("✅ Seed complete.");

    // 2. Perform Click via API
    console.log("➡️ Simulating 5th click (achievement of threshold)...");
    try {
        const clickRes = await fetch(`http://localhost:3000/api/track/click?id=${linkId}`, {
            headers: { 'x-forwarded-for': `1.2.3.${Date.now()}` } // Mock unique IP
        });
        const clickJson = await clickRes.json();
        console.log("Click API response:", clickJson);
    } catch (e) {
        console.error("❌ Click API request failed. Make sure 'npm run dev' is running!", e.message);
        await cleanUp(campaignId, freelancerId, linkId);
        process.exit(1);
    }

    // Verify DB states after click
    console.log("🔍 Verifying DB state after click...");
    const linkSnap = await db.collection('freelancer_links').doc(linkId).get();
    const campSnap = await db.collection('campaigns').doc(campaignId).get();
    const walletSnap = await db.collection('wallets').doc(freelancerId).get();

    const linkData = linkSnap.data();
    const campData = campSnap.data();
    const walletData = walletSnap.data();

    console.log(`- Link clickCount: ${linkData?.clickCount} (Expected: 5)`);
    console.log(`- Link bonusPaidStatus: ${linkData?.bonusPaidStatus} (Expected: true)`);
    console.log(`- Campaign budget_remaining: ${campData?.budget_remaining} (Expected: 99.90)`);
    console.log(`- Wallet balance: ${walletData?.balance} (Expected: 0.10)`);
    console.log(`- Wallet totalEarned: ${walletData?.totalEarned} (Expected: 0.10)`);

    let passedClick = true;
    if (linkData?.clickCount !== 5 || linkData?.bonusPaidStatus !== true) passedClick = false;
    if (Math.abs((campData?.budget_remaining || 0) - 99.90) > 0.01) passedClick = false;
    if (Math.abs((walletData?.balance || 0) - 0.10) > 0.01) passedClick = false;

    if (passedClick) {
        console.log("🟢 CLICK & BONUS SYNC TEST PASSED!");
    } else {
        console.error("🔴 CLICK & BONUS SYNC TEST FAILED!");
    }

    // 3. Perform Conversion via API
    console.log("➡️ Simulating first conversion...");
    const orderId = `order_${Date.now()}`;
    const value = 15.50;

    try {
        const convRes = await fetch(`http://localhost:3000/api/track/conversion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ linkId, orderId, value })
        });
        const convJson = await convRes.json();
        console.log("Conversion API response:", convJson);
    } catch (e) {
        console.error("❌ Conversion API request failed.", e.message);
        await cleanUp(campaignId, freelancerId, linkId);
        process.exit(1);
    }

    // Verify DB states after conversion
    console.log("🔍 Verifying DB state after conversion...");
    const linkSnap2 = await db.collection('freelancer_links').doc(linkId).get();
    const campSnap2 = await db.collection('campaigns').doc(campaignId).get();
    
    const linkData2 = linkSnap2.data();
    const campData2 = campSnap2.data();

    console.log(`- Link conversionCount: ${linkData2?.conversionCount} (Expected: 1)`);
    console.log(`- Campaign conversionCount: ${campData2?.conversionCount} (Expected: 1)`);

    // Verify conversions_tracking collection doc exists
    const trackingDocId = `${linkId}_order_${orderId}`;
    const trackSnap = await db.collection('conversions_tracking').doc(trackingDocId).get();
    console.log(`- Conversion doc exists: ${trackSnap.exists} (Expected: true)`);
    if (trackSnap.exists) {
        console.log(`  - Logged value: ${trackSnap.data()?.value} (Expected: 15.5)`);
    }

    // 4. Try duplicate conversion
    console.log("➡️ Simulating duplicate conversion...");
    try {
        const dupRes = await fetch(`http://localhost:3000/api/track/conversion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ linkId, orderId, value })
        });
        const dupJson = await dupRes.json();
        console.log("Duplicate Conversion API response (should be status 200 alreadyTracked):", dupJson);
    } catch (e) {
        console.error("❌ Duplicate Conversion API request failed.", e.message);
    }

    const linkSnap3 = await db.collection('freelancer_links').doc(linkId).get();
    const campSnap3 = await db.collection('campaigns').doc(campaignId).get();
    console.log(`- Link conversionCount (after duplicate): ${linkSnap3.data()?.conversionCount} (Expected: 1)`);
    console.log(`- Campaign conversionCount (after duplicate): ${campSnap3.data()?.conversionCount} (Expected: 1)`);

    let passedConv = true;
    if (linkData2?.conversionCount !== 1 || campData2?.conversionCount !== 1 || !trackSnap.exists) passedConv = false;
    if (linkSnap3.data()?.conversionCount !== 1) passedConv = false;

    if (passedConv) {
        console.log("🟢 CONVERSION TRACKING TEST PASSED!");
    } else {
        console.error("🔴 CONVERSION TRACKING TEST FAILED!");
    }

    // Clean up
    await cleanUp(campaignId, freelancerId, linkId);
    console.log("✨ Clean up finished.");

    if (passedClick && passedConv) {
        console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
        process.exit(0);
    } else {
        console.error("⛔ SOME TESTS FAILED.");
        process.exit(1);
    }
}

async function cleanUp(campaignId, freelancerId, linkId) {
    console.log("🧹 Cleaning up test documents...");
    await db.collection('campaigns').doc(campaignId).delete();
    await db.collection('wallets').doc(freelancerId).delete();
    await db.collection('freelancer_links').doc(linkId).delete();
    
    // Clean unique_clicks subcollection if any
    const clicksRef = db.collection('freelancer_links').doc(linkId).collection('unique_clicks');
    const clicksSnap = await clicksRef.get();
    for (const doc of clicksSnap.docs) {
        await doc.ref.delete();
    }

    // Clean test conversions tracking
    const convSnap = await db.collection('conversions_tracking')
        .where('linkId', '==', linkId)
        .get();
    for (const doc of convSnap.docs) {
        await doc.ref.delete();
    }

    // Clean test wallet transactions
    const txSnap = await db.collection('wallet_transactions')
        .where('userId', '==', freelancerId)
        .get();
    for (const doc of txSnap.docs) {
        await doc.ref.delete();
    }

    // Clean test analyticsEvents
    const analyticSnap = await db.collection('analyticsEvents')
        .where('businessId', '==', campaignId)
        .get();
    for (const doc of analyticSnap.docs) {
        await doc.ref.delete();
    }
}

runTests();
