
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

// Service Account detection similar to lib/firebase-admin.ts
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

if (!getApps().length) {
    if (serviceAccount) {
        initializeApp({
            credential: cert(serviceAccount),
        });
    } else {
        initializeApp();
    }
}

const db = getFirestore();

async function cleanupGhost() {
    console.log('Starting cleanup of "Hohenfelde" from system_locations...');

    const snapshot = await db.collection('system_locations').get();
    let updates = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const originalCities = data.cities || [];
        let modified = false;

        // Filter out Hohenfelde if it appears as a CITY
        // It might be a string or an object { name: 'Hohenfelde' ... }
        const newCities = originalCities.filter((city: any) => {
            const cityName = typeof city === 'string' ? city : city.name;
            if (cityName.toLowerCase() === 'hohenfelde') {
                console.log(`Found ghost city "Hohenfelde" in country ${data.countryName} (${doc.id}). Removing...`);
                modified = true;
                return false; // Remove it
            }
            return true; // Keep others
        });

        if (modified) {
            await doc.ref.update({ cities: newCities });
            updates++;
        }
    }

    console.log(`Cleanup complete. Updated ${updates} country documents.`);
}

cleanupGhost().catch(console.error);
