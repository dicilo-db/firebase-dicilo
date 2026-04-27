// src/app/page.tsx
import { getAdminDb } from '@/lib/firebase-admin';
import type { Business } from '@/components/dicilo-search-page';
import DiciloSearchPage from '@/components/dicilo-search-page';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

// Helper to reliably extract coordinates from mixed Firestore data types
// Helper to reliably extract coordinates from mixed Firestore data types
function extractCoords(data: any): [number, number] | undefined {
  if (!data) return undefined;

  // Helper to validate and return valid [lat, lng]
  const validate = (lat: any, lng: any): [number, number] | undefined => {
    const nLat = Number(lat);
    const nLng = Number(lng);
    if (!isNaN(nLat) && !isNaN(nLng)) return [nLat, nLng];
    return undefined;
  };

  // 1. Direct object (lat/lng or latitude/longitude)
  // Check for direct properties first (Lat/Lng or Latitude/Longitude)
  if (data.lat !== undefined && data.lng !== undefined) return validate(data.lat, data.lng);
  if (data.latitude !== undefined && data.longitude !== undefined) return validate(data.latitude, data.longitude);
  if (data._latitude !== undefined && data._longitude !== undefined) return validate(data._latitude, data._longitude);

  // 2. Nested property check (if input is a wrapper like the document data)
  const c = data.coords || data.coordinates;
  if (c) {
    // Recursive call for nested object, but ensure we don't loop infinitely
    // Basic array check for nested
    if (Array.isArray(c) && c.length === 2) return validate(c[0], c[1]);

    // Object check for nested
    if (typeof c === 'object') {
      if (c.lat !== undefined && c.lng !== undefined) return validate(c.lat, c.lng);
      if (c.latitude !== undefined && c.longitude !== undefined) return validate(c.latitude, c.longitude);
      if (c._latitude !== undefined && c._longitude !== undefined) return validate(c._latitude, c._longitude);
    }
  }

  // 3. Direct Array [lat, lng]
  if (Array.isArray(data) && data.length === 2) return validate(data[0], data[1]);

  // 4. Visibility Settings (Premium Clients Fallback)
  if (data.visibility_settings?.geo_coordinates) {
    const { lat, lng } = data.visibility_settings.geo_coordinates;
    return validate(lat, lng);
  }

  return undefined;
}

function serializeBusiness(docId: string, data: any): Business {
  let imageUrl = data.clientLogoUrl || data.imageUrl;
  if (!imageUrl || imageUrl.includes('1024terabox.com')) {
    imageUrl = `https://placehold.co/128x128.png`;
  }

  if (imageUrl && imageUrl.startsWith('http://')) {
    imageUrl = imageUrl.replace('http://', 'https://');
  }

  const biz: any = {
    id: docId,
    name: data.clientName || data.name || 'Unbekanntes Unternehmen',
    category: data.category || 'Allgemein',
    description: data.description || data.bodyData?.description || data.headerData?.welcomeText || '',
    location: data.location || '',
    imageUrl: imageUrl,
    clientLogoUrl: data.clientLogoUrl || imageUrl,
    coverImageUrl: data.headerData?.headerImageUrl || data.headerData?.headerBackgroundImageUrl || data.headerData?.backgroundImage || data.coverImage || imageUrl,
    imageHint: data.imageHint || '',
    address: data.address || '',
    phone: data.phone || '',
    email: data.email || '',
    clientType:
      docId === 'E6IUdKlV5OMlv2DWlNxE' || docId === 'Qt9u8Pd1Qi52AM0no2uw'
        ? 'premium'
        : data.clientType || 'retailer',
    tier_level: data.tier_level || 'basic',
    website: data.website || '',
    currentOfferUrl: data.currentOfferUrl || '',
    clientSlug: data.slug || '',
    mapUrl: data.mapUrl || '',
  };

  const coords = extractCoords(data.coordinates) || extractCoords(data);
  if (coords) biz.coords = coords;

  if (data.description_translations || data.translations) biz.description_translations = data.description_translations || data.translations;
  if (data.visibility_settings) biz.visibility_settings = data.visibility_settings;
  if (data.category_key) biz.category_key = data.category_key;
  if (data.subcategory_key) biz.subcategory_key = data.subcategory_key;
  if (typeof data.rating === 'number') biz.rating = data.rating;
  
  biz.active = data.active !== false;

  return biz as Business;
}

// Types for Geolocation
interface UserGeo {
  ip: string;
  city?: string;
  country?: string;
  lat?: number;
  lon?: number;
  continent?: string; // Derived or fetched if available
}

async function getUserGeo(): Promise<UserGeo | null> {
  const headersList = headers();
  const xForwardedFor = headersList.get('x-forwarded-for');
  const ip = xForwardedFor ? xForwardedFor.split(',')[0] : '127.0.0.1';

  if (ip === '127.0.0.1' || ip === '::1') {
    return null;
  }

  // FAST PATH: Use Vercel / Cloudflare / Firebase Headers (Instant)
  const city = headersList.get('x-vercel-ip-city') || headersList.get('cf-ipcity') || headersList.get('x-appengine-city');
  const country = headersList.get('x-vercel-ip-country') || headersList.get('cf-ipcountry') || headersList.get('x-appengine-country') || headersList.get('x-country-code');
  
  let lat = parseFloat(headersList.get('x-vercel-ip-latitude') || headersList.get('cf-iplatitude') || '0');
  let lon = parseFloat(headersList.get('x-vercel-ip-longitude') || headersList.get('cf-iplongitude') || '0');

  // Firebase App Engine fallback for coordinates
  const cityLatLong = headersList.get('x-appengine-citylatlong');
  if (cityLatLong && (!lat || !lon)) {
    const parts = cityLatLong.split(',');
    if (parts.length === 2) {
      lat = parseFloat(parts[0]);
      lon = parseFloat(parts[1]);
    }
  }

  if (city && lat && lon) {
    return {
      ip,
      city: decodeURIComponent(city),
      country: country || 'Unknown',
      lat,
      lon,
      continent: 'Europa' // Simplified default
    };
  }

  // If no fast headers are available, return null. 
  // We completely skip the slow external IP API call to guarantee blazing fast server response.
  // The client-side will automatically handle geolocation via HTML5 or its own fast fallback.
  return null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}


// getBusinesses has been removed to prevent OOM Full Table Scans.

async function getAds(userGeo: UserGeo | null) {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('ads_banners').get();

    const adsPromises = snapshot.docs.map(async doc => {
      const data = doc.data();

      // [1] Must be active
      if (data.active === false) return null;

      let coords: [number, number] | undefined = undefined;

      // 1. Try getting coords directly from the ad doc
      if (data.coords && Array.isArray(data.coords) && data.coords.length === 2) {
         coords = data.coords as [number, number];
      }

      // 2. Fallback: Fetch client or business to get coords and check budget
      if (data.clientId) {
         const clientDoc = await db.collection('clients').doc(data.clientId).get();
         if (clientDoc.exists) {
            const clientData = clientDoc.data();
            if (!coords) coords = extractCoords(clientData);
            
            // Budget check
            const budget = clientData?.budget_remaining || 0;
            if (typeof budget === 'number' && budget <= 0.05) return null;
         } else {
            // Check businesses collection
            const bizDoc = await db.collection('businesses').doc(data.clientId).get();
            if (bizDoc.exists) {
               if (!coords) coords = extractCoords(bizDoc.data());
            }
         }
      }

      // 3. Fallback: Match by Name (Exact match query)
      if (!coords && data.title) {
         const exactMatch = await db.collection('clients').where('clientName', '==', data.title).limit(1).get();
         if (!exactMatch.empty) {
             coords = extractCoords(exactMatch.docs[0].data());
         } else {
             const bizMatch = await db.collection('businesses').where('name', '==', data.title).limit(1).get();
             if (!bizMatch.empty) {
                 coords = extractCoords(bizMatch.docs[0].data());
             }
         }
      }

      const sanitized: any = {
        id: doc.id,
      };
      if (data.imageUrl !== undefined) sanitized.imageUrl = data.imageUrl;
      if (data.linkUrl !== undefined) sanitized.linkUrl = data.linkUrl;
      if (data.title !== undefined) sanitized.title = data.title;
      if (data.active !== undefined) sanitized.active = data.active;
      if (data.position !== undefined) sanitized.position = data.position;
      if (data.clientId !== undefined) sanitized.clientId = data.clientId;
      if (coords !== undefined) sanitized.coords = coords;
      if (data.reach_config !== undefined) sanitized.reach_config = data.reach_config;
      
      const ad = sanitized;

      // Geographic Filtering
      if (userGeo && ad.reach_config) {
        const { type, value } = ad.reach_config;
        const radius = value?.radius_km || 50;

        // If User Geo failed, show all ads (Fail Open) to ensure visibility
        if (!userGeo.lat && !userGeo.city) return ad;

        if (type === 'local' && ad.coords && userGeo.lat && userGeo.lon) {
          const dist = calculateDistance(userGeo.lat, userGeo.lon, ad.coords[0], ad.coords[1]);
          if (dist > radius) return null;
        }

        if (type === 'regional' && userGeo.city) {
          if (value?.city && value.city.toLowerCase() !== userGeo.city.toLowerCase()) return null;
        }

        if (type === 'national' && userGeo.country) {
          if (value?.country && value.country.toLowerCase() !== userGeo.country.toLowerCase()) return null;
        }

        if (type === 'continental' || type === 'international') {
          const allowed = value?.continents || [];
          if (allowed.length > 0 && userGeo.continent && !allowed.includes(userGeo.continent)) return null;
        }
      }

      return ad;
    });

    const ads = (await Promise.all(adsPromises)).filter(Boolean);
    return ads;
  } catch (error) {
    console.error('Error fetching ads (Admin SDK):', error);
    return [];
  }
}

export default async function SearchPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // Allow mocking via searchParams (localhost development)
  // ?mock_geo=Berlin => Mock as Berlin User
  let pageUserGeo: UserGeo | null = await getUserGeo();

  const mockGeoParam = searchParams['mock_geo'];
  if (mockGeoParam === 'Berlin') {
    pageUserGeo = { ip: 'mock', city: 'Berlin', country: 'Germany', lat: 52.52, lon: 13.405, continent: 'Europa' };
  } else if (mockGeoParam === 'Hamburg') {
    pageUserGeo = { ip: 'mock', city: 'Hamburg', country: 'Germany', lat: 53.55, lon: 9.99, continent: 'Europa' };
  } else if (mockGeoParam === 'Bogota') {
    pageUserGeo = { ip: 'mock', city: 'Bogota', country: 'Colombia', lat: 4.71, lon: -74.07, continent: 'Sudamérica' };
  }

  // Pass userGeo to filtering function
  const ads = await getAds(pageUserGeo);

  return (
    <main className="h-screen w-screen overflow-hidden">
      <DiciloSearchPage
        initialAds={ads}
        serverGeo={pageUserGeo}
      />
      {/* Dev helper to see what Geo is detected */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-0 right-0 p-1 bg-black text-white text-[10px] z-50 opacity-50 pointer-events-none">
          Geo: {pageUserGeo ? `${pageUserGeo.city}, ${pageUserGeo.country}` : 'Unknown/Localhost'}
        </div>
      )}
    </main>
  );
}
