// src/app/page.tsx
import { getAdminDb } from '@/lib/firebase-admin';
import type { Business } from '@/components/dicilo-search-page';
import DiciloSearchPage from '@/components/dicilo-search-page';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

// Helper to reliably extract coordinates from mixed Firestore data types
function extractCoords(data: any): [number, number] | undefined {
  if (!data?.coords) return undefined;

  const c = data.coords;

  // 1. Array [lat, lng]
  if (Array.isArray(c) && c.length === 2) {
    const lat = Number(c[0]);
    const lng = Number(c[1]);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }

  // 2. Object with latitude/longitude (Standard GeoPoint or Plain Object)
  // Admin SDK sometimes exposes _latitude/_longitude internal props
  const lat = c.latitude ?? c._latitude;
  const lng = c.longitude ?? c._longitude;

  if (lat !== undefined && lng !== undefined) {
    const nLat = Number(lat);
    const nLng = Number(lng);
    if (!isNaN(nLat) && !isNaN(nLng)) return [nLat, nLng];
  }

  return undefined;
}

function serializeBusiness(docId: string, data: any): Business {
  let imageUrl = data.clientLogoUrl || data.imageUrl;
  if (!imageUrl || imageUrl.includes('1024terabox.com')) {
    imageUrl = `https://placehold.co/128x128.png`;
  }

  // Return only fields defined in Business interface (no timestamps)
  return {
    id: docId,
    name: data.clientName || data.name || 'Unbekanntes Unternehmen',
    category: data.category || 'Allgemein',
    description: data.description || '',
    location: data.location || '',
    imageUrl: imageUrl,
    imageHint: data.imageHint || '',
    coords: extractCoords(data),
    address: data.address || '',
    phone: data.phone || '',
    website: data.website || '',
    currentOfferUrl: data.currentOfferUrl || '',
    clientSlug: data.slug || '',
    mapUrl: data.mapUrl || '',
    category_key: data.category_key,
    subcategory_key: data.subcategory_key,
    rating: typeof data.rating === 'number' ? data.rating : undefined,
  };
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
    // Default Localhost Fallback
    return null;
  }

  try {
    // 45 Requests per minute limit for free tier.
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,city,lat,lon,timezone`, { cache: 'no-store' });
    const data = await response.json();
    if (data.status === 'success') {
      let continent = 'Europa'; // Defaulting to Europa for this context as it's a German app.
      if (data.timezone.startsWith('America/')) continent = 'North America'; // Simplified
      if (data.timezone.startsWith('Asia/')) continent = 'Asia';

      return {
        ip,
        city: data.city,
        country: data.country,
        lat: data.lat,
        lon: data.lon,
        continent
      };
    }
  } catch (error) {
    console.error('Geo lookup failed:', error);
  }

  return { ip };
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


async function getBusinesses(): Promise<{ businesses: Business[], clientsRaw: any[] }> {
  try {
    const db = getAdminDb();

    // Fetch from both collections in parallel
    const [businessSnap, clientSnap] = await Promise.all([
      db.collection('businesses').get(),
      db.collection('clients').get()
    ]);

    const businesses = businessSnap.docs
      .filter((doc) => doc.data().active !== false)
      .map((doc) => serializeBusiness(doc.id, doc.data()));

    const clients = clientSnap.docs
      .filter((doc) => doc.data().active !== false)
      .map((doc) => serializeBusiness(doc.id, doc.data()));

    // Extract raw client data for budget checking
    const clientsRawData = clientSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Merge and deduplicate by ID
    const allBusinesses = [...businesses, ...clients];

    // Deep sanitize to ensure no non-serializable objects leak
    return {
      businesses: JSON.parse(JSON.stringify(allBusinesses)),
      clientsRaw: clientsRawData
    };
  } catch (error) {
    console.error('Error fetching businesses on server (Admin SDK):', error);
    return { businesses: [], clientsRaw: [] };
  }
}

async function getAds(clientsRaw: any[], businesses: Business[], userGeo: UserGeo | null) {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('ads_banners').get();

    const clientMap = new Map(clientsRaw.map((c: any) => [c.id, c]));
    const businessMap = new Map(businesses.map((b) => [b.id, b]));

    const ads = snapshot.docs.map(doc => {
      const data = doc.data();
      const client = data.clientId ? clientMap.get(data.clientId) : null;
      const business = data.clientId ? businessMap.get(data.clientId) : null;

      let coords: [number, number] | undefined = undefined;

      // 1. Try getting coords from Client (Raw)
      if (client) {
        coords = extractCoords(client);
      }

      // 2. Fallback: Try getting coords from Business (Sanitized)
      if (!coords && business) {
        coords = business.coords; // Business is already sanitized with extractCoords
      }

      // 3. Fallback: Match by Name in Businesses
      if (!coords && data.title) {
        const normalizedTitle = data.title.toLowerCase().trim();
        const matchedBusiness = businesses.find(b =>
          b.name.toLowerCase().trim() === normalizedTitle ||
          (b.name.toLowerCase().trim().includes(normalizedTitle) && normalizedTitle.length > 5)
        );
        if (matchedBusiness && matchedBusiness.coords) {
          coords = matchedBusiness.coords;
        }
      }

      const sanitized = {
        id: doc.id,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        title: data.title,
        active: data.active,
        position: data.position,
        clientId: data.clientId,
        coords: coords,
        reach_config: data.reach_config, // Include reach config
      };
      return sanitized;
    }).filter(ad => {
      // [1] Must be active
      if (ad.active === false) return false;

      // [2] Budget check
      if (ad.clientId) {
        const client = clientMap.get(ad.clientId);
        if (client) {
          const budget = client.budget_remaining || 0;
          if (typeof budget === 'number' && budget <= 0.05) return false;
        }
      }

      // [3] Geographic Filtering
      if (userGeo && ad.reach_config) {
        const { type, value } = ad.reach_config;
        const radius = value?.radius_km || 50;

        // If User Geo failed, show all ads (Fail Open) to ensure visibility
        if (!userGeo.lat && !userGeo.city) return true;

        if (type === 'local' && ad.coords && userGeo.lat && userGeo.lon) {
          const dist = calculateDistance(userGeo.lat, userGeo.lon, ad.coords[0], ad.coords[1]);
          if (dist > radius) return false;
        }

        if (type === 'regional' && userGeo.city) {
          if (value?.city && value.city.toLowerCase() !== userGeo.city.toLowerCase()) return false;
        }

        if (type === 'national' && userGeo.country) {
          if (value?.country && value.country.toLowerCase() !== userGeo.country.toLowerCase()) return false;
        }

        if (type === 'continental' || type === 'international') {
          const allowed = value?.continents || [];
          if (allowed.length > 0 && userGeo.continent && !allowed.includes(userGeo.continent)) return false;
        }
      }

      return true;
    });

    return JSON.parse(JSON.stringify(ads));
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

  const { businesses, clientsRaw } = await getBusinesses();
  // Pass userGeo to filtering function
  const ads = await getAds(clientsRaw, businesses, pageUserGeo);

  return (
    <main className="h-screen w-screen overflow-hidden">
      <DiciloSearchPage
        initialBusinesses={JSON.parse(JSON.stringify(businesses))}
        initialAds={JSON.parse(JSON.stringify(ads))}
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
