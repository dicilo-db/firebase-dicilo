
import { getAdminDb } from '@/lib/firebase-admin';
import { processDiciloPlace } from '@/lib/place-utils';
import * as geofire from 'geofire-common';
import { FieldValue } from 'firebase-admin/firestore';

// Only for standalone script execution, ensure you run with:
// npx tsx src/scripts/seed-neighborhoods.ts

async function seedNeighborhoods() {
    console.log("🌱 Starting Neighborhood Seeding Process...");
    const db = getAdminDb();

    // 1. Fetch all Clients (Businesses) that might have location data
    // We filter for those that have at least an address or location
    const businessesSnap = await db.collection('clients').get(); // Potentially large, but ok for a script
    console.log(`Found ${businessesSnap.size} businesses to process.`);

    const batch = db.batch();
    let opCount = 0;
    const MAX_BATCH_SIZE = 450;
    let neighborhoodsCreated = 0;

    // Store existing neighborhoods to avoid redundant reads/writes in this run
    // We preload existing ones
    const existingNeighborhoods = new Set<string>();
    const neighborhoodsSnap = await db.collection('neighborhoods').get();
    neighborhoodsSnap.forEach(doc => {
        existingNeighborhoods.add(doc.data().slug);
        // Also add by name just in case
        existingNeighborhoods.add(doc.data().name.toLowerCase());
    });
    console.log(`Loaded ${existingNeighborhoods.size} existing neighborhoods.`);

    // 2. Iterate and Process
    for (const doc of businessesSnap.docs) {
        const data = doc.data();

        // We need a raw Google Place object or similar to use processDiciloPlace effectively
        // OR we construct a mock one if we only have 'address' string (which might be hard).
        // Let's assume 'googlePlaceData' or 'location' object exists with address_components
        // If not, we might skip or try to parse 'address'.

        // Ideally, 'processDiciloPlace' expects a Google Place Result.
        // If your data only has flat strings, we might strictly rely on 'data.neighborhood' if it exists,
        // but the goal is to FIX/Standardize.

        let placeResult = null;

        // Strategy A: If we have stored raw google data (unlikely for all)
        if (data.googlePlaceData) {
            placeResult = processDiciloPlace(data.googlePlaceData);
        }
        // Strategy B: If we don't, we look at current 'neighborhood' and 'city' fields
        // and just ensure a neighborhood doc exists for them.
        else if (data.neighborhood && data.city) {
            // Create a synthetic result
            placeResult = {
                neighborhood: data.neighborhood,
                city: data.city,
                state: data.state || '',
                country: data.country || 'Deutschland',
                formatted_address: data.address || ''
            };
        }

        if (!placeResult || !placeResult.neighborhood) {
            // console.log(`Skipping ${doc.id}: No neighborhood data.`);
            continue;
        }

        const nbName = placeResult.neighborhood;
        const nbSlug = nbName.toLowerCase().replace(/[\s\W-]+/g, '-');

        // Check if exists
        if (existingNeighborhoods.has(nbSlug) || existingNeighborhoods.has(nbName.toLowerCase())) {
            continue;
        }

        // PREPARE NEW NEIGHBORHOOD DOC
        console.log(`✨ Creating NEW Neighborhood: ${nbName} (City: ${placeResult.city})`);

        const nbRef = db.collection('neighborhoods').doc(); // Auto-ID or Slug?
        // Let's use Slug ID if possible for cleaner URLs, or Auto-ID. 
        // User's registerNeighborhood uses AutoID but stores slug.

        // We need coordinates. If business has them, use them as "center" for now.
        let lat = data.lat || (data.location?.lat);
        let lng = data.lng || (data.location?.lng);

        let geohash = '';
        if (lat && lng) {
            geohash = geofire.geohashForLocation([lat, lng]);
        } else {
            // Fallback or skip location
            lat = 0; lng = 0;
        }

        const newNbDoc = {
            name: nbName,
            slug: nbSlug,
            city: placeResult.city,
            country: placeResult.country,
            description: `Bienvenido a ${nbName}`,
            location: {
                lat: lat,
                lng: lng,
                geohash: geohash
            },
            createdAt: FieldValue.serverTimestamp(),
            createdBy: 'seed-script',
            founderId: doc.data().userId || 'system', // Credit the business owner if possible?
            memberCount: 1, // Start with at least this business
            active: true
        };

        batch.set(nbRef, newNbDoc);
        existingNeighborhoods.add(nbSlug); // Mark processed
        neighborhoodsCreated++;
        opCount++;

        // Also Update Business Doc to link to this formatted neighborhood?
        // Optional: Ensure business uses this clean name
        if (data.neighborhood !== nbName || !data.neighborhoodId) {
            batch.update(doc.ref, {
                neighborhood: nbName,
                neighborhoodId: nbRef.id,
                neighborhoodSlug: nbSlug
            });
            opCount++;
        }

        // Commit batches if full
        if (opCount >= MAX_BATCH_SIZE) {
            await batch.commit();
            console.log(`Saved batch of ${opCount} operations.`);
            opCount = 0;
        }
    }

    // Final commit
    if (opCount > 0) {
        await batch.commit();
        console.log(`Saved final batch of ${opCount} operations.`);
    }

    console.log(`✅ Seeding Complete. Created ${neighborhoodsCreated} new neighborhoods.`);
}

seedNeighborhoods().catch(console.error);
