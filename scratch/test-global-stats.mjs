import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import countriesIso from 'i18n-iso-countries';
import { fileURLToPath } from 'url';

countriesIso.registerLocale(JSON.parse(fs.readFileSync('./node_modules/i18n-iso-countries/langs/en.json', 'utf8')));
countriesIso.registerLocale(JSON.parse(fs.readFileSync('./node_modules/i18n-iso-countries/langs/es.json', 'utf8')));
countriesIso.registerLocale(JSON.parse(fs.readFileSync('./node_modules/i18n-iso-countries/langs/de.json', 'utf8')));

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env.local manually
const envLocal = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const match = envLocal.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(.*)'/);
if (!match) {
    console.error("Could not find service account key in .env.local");
    process.exit(1);
}

let keyStr = match[1].trim();
keyStr = keyStr.replace(/\\\\n/g, '\\n');
const serviceAccount = JSON.parse(keyStr);
if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'geosearch-fq4i9',
});

const db = admin.firestore();

async function getGlobalStats() {
    const [registrationsSnap, profilesSnap, clientsSnap] = await Promise.all([
        db.collection('registrations').get(),
        db.collection('private_profiles').get(),
        db.collection('clients').get()
    ]);
    
    const identityMap = new Map();
    
    profilesSnap.docs.forEach(doc => {
        const data = doc.data();
        const id = doc.id;
        const email = data.email?.toLowerCase().trim();
        const key = email || id;
        identityMap.set(key, { ...data, id, _type: 'user', _source: 'profile' });
    });

    clientsSnap.docs.forEach(doc => {
        const data = doc.data();
        const id = doc.id;
        const email = data.email?.toLowerCase().trim();
        const key = email || id;
        const existing = identityMap.get(key);
        identityMap.set(key, { ...(existing || {}), ...data, id, _type: 'agency', _source: 'client' });
    });

    registrationsSnap.docs.forEach(doc => {
        const data = doc.data();
        const id = doc.id;
        const email = data.email?.toLowerCase().trim();
        const key = email || id;
        const existing = identityMap.get(key);
        
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

    const agenciesByAlpha2 = {};
    const usersByAlpha2 = {};
    const countryNames = {};

    let totalAgencies = 0;
    let totalUsers = 0;

    const commonMap = {
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

    const findCountryCode = (obj) => {
        if (!obj || typeof obj !== 'object') return null;

        const candidates = [
            obj.countryCode, obj.isoCode, obj.iso2, 
            obj.hierarchy?.countryCode, obj.location?.countryCode,
            obj.address?.countryCode
        ];
        for (const c of candidates) {
            if (typeof c === 'string' && c.length === 2) return c.toUpperCase();
            if (typeof c === 'string' && c.length === 3) return countriesIso.alpha3ToAlpha2(c.toUpperCase()) || null;
        }

        const stringFields = [
            obj.country, obj.pais, obj.país, obj.land, obj.city, obj.ciudad, obj.stadt,
            obj.location?.country, obj.location?.pais, obj.location?.país, obj.location?.city,
            obj.address?.country, obj.address?.state, obj.address?.city,
            obj.direccion, obj.dirección, obj.address?.street
        ];

        for (const val of stringFields) {
            if (typeof val !== 'string' || val.length < 2) continue;
            const normalized = val.toLowerCase().trim();
            
            if (commonMap[normalized]) return commonMap[normalized];
            
            for (const [key, code] of Object.entries(commonMap)) {
                if (normalized.includes(key)) return code;
            }

            const code = countriesIso.getAlpha2Code(normalized, 'es') || 
                         countriesIso.getAlpha2Code(normalized, 'en') || 
                         countriesIso.getAlpha2Code(normalized, 'de');
            if (code) return code;
        }

        for (const k in obj) {
            const val = obj[k];
            if (typeof val === 'string' && val.length > 2) {
                const normalized = val.toLowerCase().trim();
                if (commonMap[normalized]) return commonMap[normalized];
                for (const [mapKey, code] of Object.entries(commonMap)) {
                    if (normalized.includes(mapKey)) return code;
                }
            }
        }

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
    });

    const commercialCountryCodes = Object.keys(agenciesByAlpha2);
    const allPotentialCountryCodes = new Set([...Object.keys(agenciesByAlpha2), ...Object.keys(usersByAlpha2)]);
    
    const countries = {};
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
        countries
    };
}

async function run() {
    const stats = await getGlobalStats();
    console.log("Global Stats Output:", JSON.stringify(stats, null, 2));
    process.exit(0);
}
run().catch(e => {
    console.error(e);
    process.exit(1);
});
