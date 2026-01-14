'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// Helper to normalize strings for comparison (e.g., "St. Pauli" -> "stpauli")
function normalize(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function registerNeighborhood(neighborhoodName: string, userId: string) {
    if (!neighborhoodName || !neighborhoodName.trim()) {
        return { success: false, error: "El nombre del barrio es obligatorio." };
    }

    const db = getAdminDb();
    const cleanName = neighborhoodName.trim();
    const normalizedName = normalize(cleanName);

    try {
        // --- PASO A: Verificación Interna (Firestore) ---
        // Check if explicitly exists in 'neighborhoods' collection
        // We assume the ID is the normalized name or we query by a field 'normalizedName'
        const neighborhoodsRef = db.collection('neighborhoods');
        const q = neighborhoodsRef.where('normalizedName', '==', normalizedName).limit(1);
        const snapshot = await q.get();

        if (!snapshot.empty) {
            // Already exists
            const existing = snapshot.docs[0].data();
            return {
                success: true,
                exists: true,
                slug: existing.slug || existing.id || displayToSlug(existing.name),
                message: "¡Este barrio ya existe!"
            };
        }

        // --- PASO B: Verificación Externa (Google Places API) ---
        const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        if (!googleApiKey) {
            console.error("Missing GOOGLE_MAPS_API_KEY");
            return { success: false, error: "Error de configuración del sistema (API Key)." };
        }

        // https://developers.google.com/maps/documentation/places/web-service/search-text
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(cleanName)}&key=${googleApiKey}`;

        const googleRes = await fetch(searchUrl);
        const googleData = await googleRes.json();

        if (googleData.status !== 'OK' && googleData.status !== 'ZERO_RESULTS') {
            console.error("Google Places API Error:", googleData);
            return { success: false, error: "Error al verificar con Google Maps." };
        }

        // Filter for valid types
        const validTypes = ['neighborhood', 'sublocality', 'political', 'sublocality_level_1'];
        const validPlace = googleData.results?.find((place: any) =>
            place.types.some((t: string) => validTypes.includes(t))
        );

        if (!validPlace) {
            return {
                success: false,
                error: "No hemos podido verificar que este barrio exista realmente. Por favor revisa el nombre."
            };
        }

        // --- PASO C: Detalles y Jerarquía (Nuevo con processDiciloPlace) ---
        // 1. Fetch Details to get explicit address components
        const placeId = validPlace.place_id;
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,geometry,address_components,place_id,formatted_address&key=${googleApiKey}`;

        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        if (detailsData.status !== 'OK') {
            console.error("Google Place Details Error:", detailsData);
            return { success: false, error: "Error obteniendo detalles del lugar." };
        }

        const placeDetails = detailsData.result;

        // 2. Parse using standardized utility
        const { processDiciloPlace } = await import('@/lib/place-utils');
        const processed = processDiciloPlace(placeDetails);

        if (!processed) {
            return { success: false, error: "No se pudo procesar la ubicación correctamente." };
        }

        const officialName = processed.name;
        // Use normalized name or slug as ID. 
        // Existing logic used displayToSlug. Let's keep that but ensure uniqueness?
        // Actually, let's stick to slug based on name for clean URLs
        const newSlug = displayToSlug(officialName);

        // --- PASO D: Sincronización con system_locations (Admin Panel) ---
        // Sync with Admin Locations system so it appears in /admin/locations
        try {
            // Import actions dynamically or use direct DB access to avoid circular deps if any
            // We'll use direct DB access here for atomicity/speed within this flow
            const countryCode = processed.hierarchy.countryCode || 'DE'; // Default to DE if missing
            const countryName = processed.hierarchy.country || 'Alemania';
            const cityName = processed.hierarchy.city || 'Hamburg';
            const districtName = officialName;

            const sysLocRef = db.collection('system_locations');

            // 1. Find or Create Country
            // Try by code first, then name
            let countryDoc = null;
            let countrySnap = await sysLocRef.where('countryCode', '==', countryCode).limit(1).get();

            if (countrySnap.empty) {
                // Try by name as fallback
                countrySnap = await sysLocRef.where('countryName', '==', countryName).limit(1).get();
            }

            let countryId = '';

            if (countrySnap.empty) {
                // Create Country
                const newCountry = await sysLocRef.add({
                    countryName: countryName,
                    countryCode: countryCode,
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

                // Find City
                let cityIndex = cities.findIndex((c: any) => {
                    const cName = typeof c === 'string' ? c : c.name;
                    return cName.toLowerCase() === cityName.toLowerCase();
                });

                if (cityIndex === -1) {
                    // Add new City
                    cities.push({
                        name: cityName,
                        districts: [districtName]
                    });
                } else {
                    // Update existing city
                    let cityObj = cities[cityIndex];
                    if (typeof cityObj === 'string') {
                        cityObj = { name: cityObj, districts: [] };
                    }

                    // Add district if not exists
                    if (!cityObj.districts.includes(districtName)) {
                        cityObj.districts.push(districtName);
                    }
                    cities[cityIndex] = cityObj;
                }

                await sysLocRef.doc(countryId).update({ cities });
            }

        } catch (syncError) {
            console.error("Error syncing with system_locations:", syncError);
            // Non-blocking error, user flow continues
        }

        return {
            success: true,
            created: true,
            slug: newSlug,
            name: officialName,
            type: processed.type,
            hierarchy: processed.hierarchy,
            message: `¡${officialName} registrado exitosamente en ${processed.hierarchy.city}, ${processed.hierarchy.country}!`
        };

    } catch (error: any) {
        console.error("Error registering neighborhood:", error);
        // Expose the real error for debugging purposes
        return { success: false, error: `Error interno: ${error.message || JSON.stringify(error)}` };
    }
}

function displayToSlug(text: string) {
    return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}

function parseCityFromAddress(address: string): string {
    // Basic heuristics for City. Google Address Components would be better but require details fetch
    // Ensure we default to something reasonable if not found.
    // Address format usually: "Neighborhood, City, Country" or "Neighborhood, City"
    if (!address) return '';
    const parts = address.split(',');
    if (parts.length >= 2) {
        // Return the second to last p art usually contains city/zip
        // This is fuzzy. For "Hamburg", usually simply "Hamburg" works.
        // Let's rely on basic string check or return the input as fallback
        if (address.includes('Hamburg')) return 'Hamburg';
        if (address.includes('Berlin')) return 'Berlin';
        return parts[parts.length - 2].trim().replace(/[0-9]/g, '').trim(); // Remove zip codes
    }
    return 'Hamburg'; // Default fallback as per user context predominant city
}
