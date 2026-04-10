
export interface DiciloLocation {
    placeId: string;
    name: string; // Friendly name (Neighborhood or City)
    type: 'barrio' | 'ciudad' | 'pais';
    hierarchy: {
        country: string;
        countryCode?: string; // Add countryCode
        city: string;
        neighborhood?: string; // Optional
    };
    coordinates: {
        lat: number;
        lng: number;
    };
}

// Interface compatible with both Google Maps JS API (PlaceResult) and Places API REST (Place Details)
// We define the minimum fields we need to avoid type dependency issues on server vs client
export interface GooglePlaceData {
    place_id?: string;
    placeId?: string; // Client side
    name?: string;
    address_components?: Array<{
        long_name: string;
        short_name: string;
        types: string[];
    }>;
    geometry?: {
        location?: {
            lat: () => number;
            lng: () => number;
        } | {
            lat: number;
            lng: number;
        };
    };
}

// FIX: Regla de Oro Implementada
// City = ONLY locality or administrative_area_level_2
// Neighborhood = ONLY sublocality variants

export const processDiciloPlace = (place: GooglePlaceData): DiciloLocation | null => {
    if (!place.address_components || !place.geometry) return null;

    let country = '';
    let countryCode = '';
    let city = '';
    let neighborhood = '';

    // 1. Strict Extraction loop
    place.address_components.forEach(component => {
        const types = component.types;

        if (types.includes('country')) {
            country = component.long_name;
            countryCode = component.short_name;
        }

        // STRICT City Logic
        if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            // Only overwrite if it's the first one found or specifically 'locality' (usually more accurate)
            // But the rule says: assign only if type includes these.
            // We prioritize 'locality' over 'admin_level_2' if both exist.
            if (!city || types.includes('locality')) {
                city = component.long_name;
            }
        }

        // STRICT Neighborhood Logic
        if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood')) {
            // If we find a sublocality, it IS the neighborhood.
            // We take the most specific one if multiple exist? Usually sublocality_level_1 is good.
            neighborhood = component.long_name;
        }
    });

    // 2. Dicilo Business Logic
    // If we have a neighborhood, we MUST have a parent city.
    // If Google returned a neighborhood but NO city (Edge Case), we need a fallback.
    // However, for now we stick to what validPlace returned.

    const isNeighborhood = neighborhood !== '';
    const finalName = isNeighborhood ? neighborhood : (city || place.name || '');

    // Normalize coordinates
    let lat = 0;
    let lng = 0;
    if (place.geometry.location) {
        if (typeof (place.geometry.location as any).lat === 'function') {
            lat = (place.geometry.location as any).lat();
            lng = (place.geometry.location as any).lng();
        } else {
            lat = (place.geometry.location as any).lat;
            lng = (place.geometry.location as any).lng;
        }
    }

    return {
        placeId: place.place_id || place.placeId || '',
        name: finalName,
        type: isNeighborhood ? 'barrio' : 'ciudad',
        hierarchy: {
            country: country || 'Alemania', // Default to Alemania if missing
            countryCode: countryCode || 'DE',
            city: city, // Might be empty if it's a pure state search?
            neighborhood: isNeighborhood ? neighborhood : null // Explicit null for Firestore
        } as any, // Cast to avoid TS strict null checks if interface expects string | undefined
        coordinates: {
            lat,
            lng
        }
    };
};
