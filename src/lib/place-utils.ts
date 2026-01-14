
export interface DiciloLocation {
    placeId: string;
    name: string; // Friendly name (Neighborhood or City)
    type: 'barrio' | 'ciudad' | 'pais';
    hierarchy: {
        country: string;
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

export const processDiciloPlace = (place: GooglePlaceData): DiciloLocation | null => {
    if (!place.address_components || !place.geometry) return null;

    let country = '';
    let city = '';
    let neighborhood = '';

    let sublocalityLevel1 = '';
    let sublocalityLevel2 = '';

    // 1. Extract official Google components
    place.address_components.forEach(component => {
        const types = component.types;

        if (types.includes('country')) {
            country = component.long_name;
        }
        // In Germany (and others), city can be 'locality' or 'administrative_area_level_1' (for city-states like Hamburg/Berlin)
        if (types.includes('locality') || (types.includes('administrative_area_level_1') && !city)) {
            city = component.long_name;
        }

        // Capture specific sub-levels
        if (types.includes('sublocality_level_1')) {
            sublocalityLevel1 = component.long_name;
        }
        if (types.includes('sublocality_level_2')) {
            sublocalityLevel2 = component.long_name;
        }
        // Fallback or generic neighborhood
        if (types.includes('neighborhood') || types.includes('sublocality')) {
            if (!neighborhood) neighborhood = component.long_name;
        }
    });

    // Priority: Level 2 (most specific) > Level 1 (District) > Generic Neighborhood
    if (sublocalityLevel2) {
        neighborhood = sublocalityLevel2;
    } else if (sublocalityLevel1 && (!neighborhood || neighborhood === city)) {
        // Only use Level 1 if we don't have a generic neighborhood, or if generic is same as city
        neighborhood = sublocalityLevel1;
    }

    // 2. Dicilo Business Logic: Neighborhood or City?
    // If Google returned a neighborhood, it's a neighborhood. Otherwise assume top level city.
    // Additional check: If neighborhood name == city name, it's the city.
    const isNeighborhood = neighborhood !== '' && neighborhood !== city;

    // Case: User searches "Hamburg" directly. Google returns name="Hamburg", type="locality" (or admin area), no sublocality.
    // 'city' will be detected as Hamburg. 'neighborhood' empty.
    const finalName = isNeighborhood ? neighborhood : (city || place.name || '');

    // Normalize coordinates extraction (handle both function and property style)
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
            country,
            city, // There must always be a parent city (or itself if it is the city)
            neighborhood: isNeighborhood ? neighborhood : undefined
        },
        coordinates: {
            lat,
            lng
        }
    };
};
