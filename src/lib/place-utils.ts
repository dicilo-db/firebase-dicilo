
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
        // Neighborhoods or Sub-localities
        if (types.includes('sublocality') || types.includes('neighborhood') || types.includes('sublocality_level_1')) {
            neighborhood = component.long_name;
        }
    });

    // 2. Dicilo Business Logic: Neighborhood or City?
    // If Google returned a neighborhood, it's a neighborhood. Otherwise assume top level city.
    const isNeighborhood = neighborhood !== '';

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
