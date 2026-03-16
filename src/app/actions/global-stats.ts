'use server';

import countriesIso from 'i18n-iso-countries';
import { getAdminDb } from '@/lib/firebase-admin';

// Initialize with languages you need
countriesIso.registerLocale(require("i18n-iso-countries/langs/en.json"));
countriesIso.registerLocale(require("i18n-iso-countries/langs/es.json"));
countriesIso.registerLocale(require("i18n-iso-countries/langs/de.json"));

export interface GlobalStats {
    totalAgencies: number;
    totalCountriesCommercial: number;
    totalUsers: number;
    totalCountriesPotential: number;
    countries: Record<string, { 
        agencies: number, 
        users: number, 
        name: string 
    }>;
    markers: Array<{
        id: string;
        coordinates: [number, number]; // [lng, lat]
        name: string;
        type: 'agency' | 'user';
    }>;
}

export async function getGlobalStats(): Promise<GlobalStats> {
    try {
        const db = getAdminDb();
        
        // --- POWER RESOLVER: Fetch from all 3 sources to ensure no data is missed ---
        const [registrationsSnap, profilesSnap, clientsSnap] = await Promise.all([
            db.collection('registrations').get(),
            db.collection('private_profiles').get(),
            db.collection('clients').get()
        ]);
        
        // Maps to aggregate data
        const identityMap = new Map<string, any>(); // Key: email or id
        
        // 1. Ingest Private Profiles (High fidelity user data)
        profilesSnap.docs.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            const email = data.email?.toLowerCase().trim();
            const key = email || id;
            identityMap.set(key, { ...data, id, _type: 'user', _source: 'profile' });
        });

        // 2. Ingest Clients (High fidelity agency data)
        clientsSnap.docs.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            const email = data.email?.toLowerCase().trim();
            const key = email || id;
            const existing = identityMap.get(key);
            identityMap.set(key, { ...(existing || {}), ...data, id, _type: 'agency', _source: 'client' });
        });

        // 3. Ingest Registrations (The aggregate list, has the types like 'donor')
        registrationsSnap.docs.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            const email = data.email?.toLowerCase().trim();
            const key = email || id;
            const existing = identityMap.get(key);
            
            // Map types to simplifies Agency/User
            const regType = (data.registrationType || 'donor').toLowerCase();
            const isAgency = ['retailer', 'premium', 'starter', 'donor', 'basica', 'basic', 'einzelhändler', 'agency'].includes(regType);
            
            identityMap.set(key, { 
                ...(existing || {}), 
                ...data, 
                id, 
                _type: isAgency ? 'agency' : 'user',
                _source: 'registration' 
            });
        });

        const agenciesByAlpha2: Record<string, number> = {};
        const usersByAlpha2: Record<string, number> = {};
        const countryNames: Record<string, string> = {};
        const markers: Array<{ id: string; coordinates: [number, number]; name: string; type: 'agency' | 'user' }> = [];

        let totalAgencies = 0;
        let totalUsers = 0;

        // Force mapping for the 10 countries the user specified + common variants
        const commonMap: Record<string, string> = {
            'españa': 'ES', 'spain': 'ES', 'madrid': 'ES', 'barcelona': 'ES', 'es': 'ES',
            'alemania': 'DE', 'germany': 'DE', 'deutschland': 'DE', 'berlin': 'DE', 'de': 'DE',
            'bolivia': 'BO', 'la paz': 'BO', 'santa cruz': 'BO', 'bo': 'BO',
            'brasil': 'BR', 'brazil': 'BR', 'rio': 'BR', 'sao paulo': 'BR', 'br': 'BR',
            'colombia': 'CO', 'bogota': 'CO', 'bogotá': 'CO', 'medellin': 'CO', 'co': 'CO',
            'ecuador': 'EC', 'quito': 'EC', 'guayaquil': 'EC', 'ec': 'EC',
            'panama': 'PA', 'panamá': 'PA', 'pa': 'PA',
            'dominicana': 'DO', 'republica dominicana': 'DO', 'santo domingo': 'DO', 'do': 'DO',
            'nicaragua': 'NI', 'managua': 'NI', 'ni': 'NI',
            'venezuela': 'VE', 'caracas': 'VE', 've': 'VE',
            'usa': 'US', 'eeuu': 'US', 'united states': 'US', 'us': 'US'
        };

        // Recursive scanner to find location data anywhere in the doc
        const findCountryCode = (obj: any): string | null => {
            if (!obj || typeof obj !== 'object') return null;

            // 1. Direct field checks (common patterns)
            const candidates = [
                obj.countryCode, obj.isoCode, obj.iso2, 
                obj.hierarchy?.countryCode, obj.location?.countryCode,
                obj.address?.countryCode
            ];
            for (const c of candidates) {
                if (typeof c === 'string' && c.length === 2) return c.toUpperCase();
                if (typeof c === 'string' && c.length === 3) return countriesIso.alpha3ToAlpha2(c.toUpperCase()) || null;
            }

            // 2. String field checks (pais, country, city, stadt, land, etc)
            const stringFields = [
                obj.country, obj.pais, obj.land, obj.city, obj.ciudad, obj.stadt,
                obj.location?.country, obj.location?.pais, obj.location?.city,
                obj.address?.country, obj.address?.state, obj.address?.city
            ];

            for (const val of stringFields) {
                if (typeof val !== 'string' || val.length < 2) continue;
                const normalized = val.toLowerCase().trim();
                
                // Check map
                if (commonMap[normalized]) return commonMap[normalized];
                
                // Partial word check for commonMap (e.g. "Quito, Ecuador")
                for (const [key, code] of Object.entries(commonMap)) {
                    if (normalized.includes(key)) return code;
                }

                // Library check
                const code = countriesIso.getAlpha2Code(normalized, 'es') || 
                             countriesIso.getAlpha2Code(normalized, 'en') || 
                             countriesIso.getAlpha2Code(normalized, 'de');
                if (code) return code;
            }

            // 3. Deep recursion for nested objects (limit depth to avoid infinite loops)
            // If we still haven't found it, check if any property is an object
            for (const key in obj) {
                if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && key !== 'createdAt' && key !== 'updatedAt') {
                    const found = findCountryCode(obj[key]);
                    if (found) return found;
                }
            }

            return null;
        };

        identityMap.forEach((data, key) => {
            if (data._type === 'agency') totalAgencies++;
            else totalUsers++;

            const countryCode = findCountryCode(data);

            if (countryCode && countryCode !== 'UN' && countryCode !== 'UNKNOWN') {
                const alpha2 = countryCode.toUpperCase();
                if (data._type === 'agency') agenciesByAlpha2[alpha2] = (agenciesByAlpha2[alpha2] || 0) + 1;
                else usersByAlpha2[alpha2] = (usersByAlpha2[alpha2] || 0) + 1;
                
                if (!countryNames[alpha2]) {
                    countryNames[alpha2] = countriesIso.getName(alpha2, 'es') || alpha2;
                }
            }

            // Marker
            if (data.coords && Array.isArray(data.coords) && data.coords.length === 2) {
                const lat = data.coords[0];
                const lng = data.coords[1];
                if (typeof lat === 'number' && typeof lng === 'number' && (lat !== 0 || lng !== 0)) {
                    markers.push({
                        id: data.id,
                        coordinates: [lng, lat],
                        name: data.businessName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'User',
                        type: data._type as 'agency' | 'user'
                    });
                }
            }
        });

        const commercialCountryCodes = Object.keys(agenciesByAlpha2);
        const allPotentialCountryCodes = new Set([...Object.keys(agenciesByAlpha2), ...Object.keys(usersByAlpha2)]);
        
        const countries: Record<string, { agencies: number; users: number; name: string }> = {};
        allPotentialCountryCodes.forEach(alpha2 => {
            countries[alpha2] = {
                agencies: agenciesByAlpha2[alpha2] || 0,
                users: usersByAlpha2[alpha2] || 0,
                name: countryNames[alpha2] || countriesIso.getName(alpha2, 'es') || alpha2
            };
        });

        return {
            totalAgencies,
            totalCountriesCommercial: commercialCountryCodes.length,
            totalUsers,
            totalCountriesPotential: allPotentialCountryCodes.size,
            countries,
            markers
        };

    } catch (error) {
        console.error('Error fetching global stats:', error);
        return { totalAgencies: 0, totalCountriesCommercial: 0, totalUsers: 0, totalCountriesPotential: 0, countries: {}, markers: [] };
    }
}
