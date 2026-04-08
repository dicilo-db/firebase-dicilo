'use server';

import { checkRateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

export interface OSMValidationResult {
    exists: boolean;
    exactMatch: boolean;
    suggestedName?: string;
    lat?: number;
    lon?: number;
    error?: string;
}

export async function validateLocationOSM(
    countryName: string,
    cityName: string,
    districtName?: string
): Promise<OSMValidationResult> {
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    
    // Rate limit OSM API calls to prevent abuse and block IP if needed
    if (!checkRateLimit(`osm_validation_${ip}`, 10, 60000)) {
        return { exists: false, exactMatch: false, error: 'Has realizado demasiadas búsquedas. Espere un momento.' };
    }

    try {
        // En un futuro el usuario puede poner la llave de LocationIQ
        // LOCATIONIQ_API_KEY en su .env.local
        const locationIQKey = process.env.LOCATIONIQ_API_KEY;

        let url = '';
        let queryParams = new URLSearchParams();

        if (locationIQKey) {
            url = 'https://us1.locationiq.com/v1/search.php';
            queryParams.append('key', locationIQKey);
        } else {
            url = 'https://nominatim.openstreetmap.org/search';
        }

        // Search format config
        queryParams.append('format', 'json');
        queryParams.append('addressdetails', '1');
        queryParams.append('limit', '3'); // Get up to 3 results to find closest match

        // We construct a generalized free-form query because OSM structured queries 
        // sometimes fail if "district" is not classified exactly as "county" or "city_district" 
        // inside OSM. Free-form string provides better typo-tolerance and fallback.
        const searchString = districtName 
            ? `${districtName}, ${cityName}, ${countryName}`
            : `${cityName}, ${countryName}`;
            
        queryParams.append('q', searchString);

        const fetchOptions: RequestInit = {
            method: 'GET',
            headers: {
                'Accept-Language': 'es,en;q=0.9',
            }
        };

        // Nominatim requires User-Agent
        if (!locationIQKey) {
            fetchOptions.headers = {
                ...fetchOptions.headers,
                'User-Agent': 'DiciloApp/1.0 (contact@dicilo.net)',
            };
        }

        const res = await fetch(`${url}?${queryParams.toString()}`, fetchOptions);

        if (!res.ok) {
            console.error('OSM API Error:', res.status, await res.text());
            return { exists: false, exactMatch: false, error: 'Servicio de mapas temporalmente inactivo.' };
        }

        const data = await res.json();

        if (!data || data.length === 0) {
            return { exists: false, exactMatch: false };
        }

        // Extraemos el primer resultado (el más relevante)
        const bestMatch = data[0];
        const matchAddress = bestMatch.address || {};
        
        // Determinar qué nos devolvió realmente OSM
        // Nominatim a veces devuelve un "condado" o "estado" si no encuentra la ciudad. 
        // Necesitamos validar que la ciudad/barrio retornado se parezca a lo buscado.
        
        let foundPlaceName = '';
        if (districtName) {
            foundPlaceName = matchAddress.suburb || matchAddress.neighbourhood || matchAddress.city_district || matchAddress.village || matchAddress.town || bestMatch.name;
        } else {
            foundPlaceName = matchAddress.city || matchAddress.town || matchAddress.village || matchAddress.municipality || bestMatch.name;
        }

        if (!foundPlaceName) {
             return { exists: false, exactMatch: false };
        }

        const requestedTarget = districtName ? districtName : cityName;
        
        // Exact match comparison (case insensitive)
        const isExactMatch = foundPlaceName.toLowerCase().trim() === requestedTarget.toLowerCase().trim();

        return {
            exists: true,
            exactMatch: isExactMatch,
            suggestedName: isExactMatch ? undefined : foundPlaceName,
            lat: parseFloat(bestMatch.lat),
            lon: parseFloat(bestMatch.lon)
        };

    } catch (e: any) {
        console.error('Error in validateLocationOSM:', e);
        return { exists: false, exactMatch: false, error: 'Error interno de validación.' };
    }
}
