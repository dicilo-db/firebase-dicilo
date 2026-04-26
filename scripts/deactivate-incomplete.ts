import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Firebase Admin
if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
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
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: 'geosearch-fq4i9',
            });
            console.log("Firebase initialized successfully.");
        } catch (e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
            process.exit(1);
        }
    } else {
        console.error("No FIREBASE_SERVICE_ACCOUNT_KEY found in .env.local");
        process.exit(1);
    }
}

const db = admin.firestore();

// Helper to extract coordinates (same logic as frontend)
function hasValidCoords(data: any): boolean {
    if (!data) return false;

    const validate = (lat: any, lng: any): boolean => {
        const nLat = Number(lat);
        const nLng = Number(lng);
        return !isNaN(nLat) && !isNaN(nLng) && nLat !== 0 && nLng !== 0; // 0,0 is usually default/invalid
    };

    if (data.lat !== undefined && data.lng !== undefined) return validate(data.lat, data.lng);
    if (data.latitude !== undefined && data.longitude !== undefined) return validate(data.latitude, data.longitude);
    if (data._latitude !== undefined && data._longitude !== undefined) return validate(data._latitude, data._longitude);

    const c = data.coords || data.coordinates;
    if (c) {
        if (Array.isArray(c) && c.length === 2) return validate(c[0], c[1]);
        if (typeof c === 'object') {
            if (c.lat !== undefined && c.lng !== undefined) return validate(c.lat, c.lng);
            if (c.latitude !== undefined && c.longitude !== undefined) return validate(c.latitude, c.longitude);
            if (c._latitude !== undefined && c._longitude !== undefined) return validate(c._latitude, c._longitude);
        }
    }

    if (Array.isArray(data) && data.length === 2) return validate(data[0], data[1]);

    if (data.visibility_settings?.geo_coordinates) {
        const { lat, lng } = data.visibility_settings.geo_coordinates;
        return validate(lat, lng);
    }

    return false;
}

async function runCleanup() {
    console.log("Starting database cleanup...");
    
    const collections = ['businesses', 'clients'];
    let deactivatedCount = 0;
    let checkedCount = 0;

    for (const colName of collections) {
        console.log(`\nProcessing collection: ${colName}`);
        const snapshot = await db.collection(colName).get();
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            checkedCount++;

            // 1. Check required fields
            const name = data.clientName || data.name;
            const category = data.category || data.category_key;
            const location = data.location || data.address || data.city;
            const hasCoords = hasValidCoords(data.coordinates) || hasValidCoords(data);
            
            const isComplete = Boolean(name && category && location && hasCoords);
            const isCurrentlyActive = data.active !== false;

            if (!isComplete && isCurrentlyActive) {
                console.log(`Deactivating ${colName}/${doc.id} - Name: ${name || 'UNKNOWN'}. Reason: Missing required fields.`);
                // Set active to false
                await db.collection(colName).doc(doc.id).update({
                    active: false,
                    deactivated_reason: 'missing_required_fields',
                    deactivated_at: new Date().toISOString()
                });
                deactivatedCount++;
            } else if (isComplete && !isCurrentlyActive) {
                // Should we automatically activate them if they become complete?
                // The user said "solo se activan manualmente una vez llenos los campos."
                // So we do nothing if it's inactive but complete.
            }
        }
    }

    console.log(`\nCleanup finished!`);
    console.log(`Total records checked: ${checkedCount}`);
    console.log(`Total records deactivated: ${deactivatedCount}`);
    process.exit(0);
}

runCleanup().catch(console.error);
