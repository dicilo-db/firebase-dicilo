'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import * as geofire from 'geofire-common';

// Helper to normalize strings for comparison (e.g., "St. Pauli" -> "stpauli")
function normalize(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function registerNeighborhood(neighborhoodName: string, userId: string, countryName?: string) {
    if (!neighborhoodName || !neighborhoodName.trim()) {
        return { success: false, error: "El nombre del barrio es obligatorio." };
    }

    const db = getAdminDb();
    const cleanName = neighborhoodName.trim();
    // Normalize locally just for initial ID generation if needed, but we rely on Google's name
    const normalizedName = normalize(cleanName);

    try {
        // --- PASO 1: Verificación Externa (Google Places API) ---
        // We do this FIRST to ensure we have the correct data (Self-Healing)
        const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        if (!googleApiKey) {
            console.error("Missing GOOGLE_MAPS_API_KEY");
            return { success: false, error: "Error de configuración del sistema (API Key)." };
        }

        // Append Country Name to query if provided for better precision
        const queryTerm = countryName ? `${cleanName}, ${countryName}` : cleanName;
        // Language ES for consistent "Alemania" results
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(queryTerm)}&language=es&key=${googleApiKey}`;

        const googleRes = await fetch(searchUrl);
        const googleData = await googleRes.json();

        if (googleData.status !== 'OK' && googleData.status !== 'ZERO_RESULTS') {
            console.error("Google Places API Error:", googleData);
            return { success: false, error: "Error al verificar con Google Maps." };
        }

        // Filter valid types for Neighborhoods OR Sublocalities
        // Strict mapping happens in place-utils, here we just need to find a candidate
        const validTypes = ['neighborhood', 'sublocality', 'sublocality_level_1', 'sublocality_level_2', 'political', 'locality'];
        const validPlace = googleData.results?.find((place: any) =>
            place.types.some((t: string) => validTypes.includes(t))
        );

        if (!validPlace) {
            return {
                success: false,
                error: `No hemos encontrado "${cleanName}" como barrio oficial. Intenta ser más específico (ej. "${cleanName}, Ciudad").`
            };
        }

        // --- PASO 2: Obtener Detalles y Procesar "Golden Rule" ---
        const placeId = validPlace.place_id;
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,geometry,address_components,place_id,formatted_address&key=${googleApiKey}&language=es`;

        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        if (detailsData.status !== 'OK') {
            return { success: false, error: "Error obteniendo detalles del lugar." };
        }

        const { processDiciloPlace } = await import('@/lib/place-utils');
        const processed = processDiciloPlace(detailsData.result);

        if (!processed) {
            return { success: false, error: "No se pudo procesar la ubicación correctamente." };
        }

        // Verify it is strictly a neighborhood
        if (processed.type !== 'barrio') {
            return {
                success: false,
                error: `"${processed.name}" está clasificado administrativamente como Ciudad, no como barrio. Por favor úsalo como ciudad.`
            };
        }

        const officialName = processed.name;
        const cityName = processed.hierarchy.city;
        const countryToUse = processed.hierarchy.country || countryName || 'Alemania';
        const countryCode = processed.hierarchy.countryCode || 'DE';

        // Unique slug to avoid collision if same neighborhood name exists in different cities
        const newSlug = displayToSlug(`${officialName}-${cityName}`);

        // --- PASO 3: Verificar Existencia en BD & Actualizar ---
        const neighborhoodsRef = db.collection('neighborhoods');

        // Check by slug first (most accurate) or legacy name+city check
        // We prefer checking by exact name and city to award founder correctly if slug changed for some reason
        // But slug is consistent. Let's check slug first.
        let existingDoc = await neighborhoodsRef.doc(newSlug).get();

        if (!existingDoc.exists) {
            // Double check by query for safety (migration usage)
            const q = neighborhoodsRef
                .where('name', '==', officialName)
                .where('hierarchy.city', '==', cityName)
                .limit(1);
            const snapshot = await q.get();
            if (!snapshot.empty) {
                existingDoc = snapshot.docs[0];
            }
        }

        if (existingDoc.exists) {
            // ACCION A: YA EXISTE
            const existing = existingDoc.data()!;
            const existingSlug = existingDoc.id;

            // Ensure sync just in case
            await syncWithSystemLocations(db, countryCode, countryToUse, cityName, officialName);

            return {
                success: true,
                exists: true,
                slug: existingSlug,
                name: existing.name,
                message: `Bienvenido a ${existing.name}. Este barrio ya tiene fundadores.` // No badge
            };
        }

        // --- ACCION B: NO EXISTE (NUEVO) ---

        // Helper to remove undefined values for Firestore
        const cleanUndefined = (obj: any) => JSON.parse(JSON.stringify(obj));

        // 1. Ensure Country Exists
        await ensureCountryExists(db, countryCode, countryToUse);

        // 2. Prepare Data with Geohash
        const lat = processed.coordinates.lat;
        const lng = processed.coordinates.lng;
        const hash = geofire.geohashForLocation([lat, lng]);

        const newNeighborhoodData = cleanUndefined({
            name: officialName,
            normalizedName: normalize(officialName),
            slug: newSlug,
            city: cityName,
            country: countryToUse,
            location: new admin.firestore.GeoPoint(lat, lng), // Native GeoPoint
            geohash: hash,
            placeId: placeId,
            type: 'barrio',
            hierarchy: {
                country: countryToUse,
                countryCode: countryCode,
                city: cityName,
                neighborhood: officialName
            },
            founderId: userId, // Mark the founder
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 3. Create Neighborhood
        await neighborhoodsRef.doc(newSlug).set(newNeighborhoodData);

        // 4. Sincronizar con Admin Panel
        await syncWithSystemLocations(db, countryCode, countryToUse, cityName, officialName);

        // 5. Award Founder Badge
        await awardFounderBadge(db, userId, officialName);

        return {
            success: true,
            created: true,
            slug: newSlug,
            name: officialName,
            isFounder: true, // Frontend signal
            type: processed.type,
            hierarchy: processed.hierarchy,
            message: `¡Felicidades! Eres el FUNDADOR de ${officialName}. Has desbloqueado una nueva medalla.`
        };

    } catch (error: any) {
        console.error("Error registering neighborhood:", error);
        return { success: false, error: `Error interno: ${error.message || JSON.stringify(error)}` };
    }
}

// --- Helpers ---

// Ensure Country Exists in system_locations
async function ensureCountryExists(db: admin.firestore.Firestore, code: string, name: string) {
    const sysLocRef = db.collection('system_locations');
    const q = sysLocRef.where('countryCode', '==', code).limit(1);
    const snap = await q.get();

    if (snap.empty) {
        // Double check by name
        const qName = sysLocRef.where('countryName', '==', name).limit(1);
        const snapName = await qName.get();
        if (snapName.empty) {
            await sysLocRef.add({
                countryName: name,
                countryCode: code,
                cities: [],
                isActive: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    }
}

// Award Founder Badge
async function awardFounderBadge(db: admin.firestore.Firestore, userId: string, placeName: string) {
    if (!userId) return;
    try {
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
            badges: admin.firestore.FieldValue.arrayUnion({
                type: 'FOUNDER',
                place: placeName,
                assignedAt: new Date().toISOString()
            })
        });
    } catch (e) {
        console.error("Error awarding badge:", e);
    }
}

// Helper to keep Admin Panel in sync
async function syncWithSystemLocations(db: admin.firestore.Firestore, countryCode: string, countryName: string, cityName: string, districtName: string) {
    try {
        // Defaults
        const cCode = countryCode || 'DE';
        const cName = countryName || 'Alemania';
        const cCity = cityName || 'Hamburg';

        const sysLocRef = db.collection('system_locations');

        // 1. Find or Create Country
        let countryDoc = null;
        let countrySnap = await sysLocRef.where('countryCode', '==', cCode).limit(1).get();

        if (countrySnap.empty) {
            countrySnap = await sysLocRef.where('countryName', '==', cName).limit(1).get();
        }

        let countryId = '';

        if (countrySnap.empty) {
            // Should be created by ensureCountryExists but good fallback
            const newCountry = await sysLocRef.add({
                countryName: cName,
                countryCode: cCode,
                cities: [],
                isActive: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            countryId = newCountry.id;
        } else {
            countryDoc = countrySnap.docs[0];
            countryId = countryDoc.id;
        }

        // 2. Update City and District
        // We need to fetch fresh to safely update array
        const freshCountryDoc = await sysLocRef.doc(countryId).get();
        if (freshCountryDoc.exists) {
            const data = freshCountryDoc.data();
            let cities = (data?.cities || []) as any[];

            // CLEANUP Step: Remove the districtName if it strangely exists as a top-level City
            // This fixes "Hohenfelde" appearing as a City
            // Filter out any city whose name is EXACTLY the district name we are adding
            cities = cities.filter((c: any) => {
                const existingCityName = typeof c === 'string' ? c : c.name;
                return existingCityName.toLowerCase() !== districtName.toLowerCase();
            });

            // Find City
            let cityIndex = cities.findIndex((c: any) => {
                const cName = typeof c === 'string' ? c : c.name;
                return cName.toLowerCase() === cCity.toLowerCase();
            });

            if (cityIndex === -1) {
                // Add new City with district
                cities.push({
                    name: cCity,
                    districts: [districtName]
                });
            } else {
                // Update existing city
                let cityObj = cities[cityIndex];
                if (typeof cityObj === 'string') {
                    cityObj = { name: cityObj, districts: [] }; // Migrate string to obj
                }

                // Add district if not exists
                if (!cityObj.districts.includes(districtName)) {
                    cityObj.districts.push(districtName);
                }
                cities[cityIndex] = cityObj;
            }

            // Save cleaned up and updated list
            await sysLocRef.doc(countryId).update({ cities });
        }

    } catch (syncError) {
        console.error("Error syncing with system_locations:", syncError);
    }
}

function displayToSlug(text: string) {
    return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}

// Fallback logic for parseCity if needed (not active in main flow anymore but kept for safety)
function parseCityFromAddress(address: string): string {
    if (!address) return '';
    const parts = address.split(',');
    if (parts.length >= 2) {
        if (address.includes('Hamburg')) return 'Hamburg';
        if (address.includes('Berlin')) return 'Berlin';
        return parts[parts.length - 2].trim().replace(/[0-9]/g, '').trim();
    }
    return 'Hamburg';
}
