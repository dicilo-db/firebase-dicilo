// src/app/page.tsx
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { Business } from '@/components/dicilo-search-page';
import DiciloSearchPage from '@/components/dicilo-search-page';

export const dynamic = 'force-dynamic';

function serializeBusiness(docId: string, data: any): Business {
  let imageUrl = data.clientLogoUrl || data.imageUrl;
  if (!imageUrl || imageUrl.includes('1024terabox.com')) {
    imageUrl = `https://placehold.co/128x128.png`;
  }

  // Ensure coords is a simple array of numbers or undefined
  let coords: [number, number] | undefined = undefined;
  if (data.coords) {
    if (Array.isArray(data.coords) && data.coords.length === 2) {
      coords = [Number(data.coords[0]), Number(data.coords[1])];
    } else if (typeof data.coords === 'object' && 'latitude' in data.coords && 'longitude' in data.coords) {
      // Handle Firestore GeoPoint if it comes back as an object
      coords = [data.coords.latitude, data.coords.longitude];
    }
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
    coords: coords,
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


import { headers } from 'next/headers';

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

  // Check for mock parameter in development
  // Note: manipulating headers for dev testing or just rely on default 127.0.0.1
  // Real implementation calls ip-api.com

  if (ip === '127.0.0.1' || ip === '::1') {
    // Default Localhost Fallback (Hamburg for testing purposes, or empty)
    // To test "Berlin User", we would need to manually mock this return here during verification.
    // For now, let's look for a specialized header or just return a default safety.

    // [VERIFICATION HOOK] Uncomment to mock locations
    // return { ip, city: 'Berlin', country: 'Germany', lat: 52.52, lon: 13.405, continent: 'Europa' };
    return null;
  }

  try {
    // 45 Requests per minute limit for free tier.
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,city,lat,lon,timezone`, { cache: 'no-store' });
    const data = await response.json();
    if (data.status === 'success') {
      // Infer continent from timezone roughly or map countries. 
      // For now, we will just use Country/City.
      // A robust system would map country codes to Continents.
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
  const db = getFirestore(app);
  // console.log('Fetching businesses on server...');
  try {

    // Fetch from both collections in parallel with error handling
    const businessesCol = collection(db, 'businesses');
    const clientsCol = collection(db, 'clients');

    const [businessResult, clientResult] = await Promise.allSettled([
      getDocs(query(businessesCol)),
      getDocs(query(clientsCol))
    ]);

    const businesses = businessResult.status === 'fulfilled'
      ? businessResult.value.docs
        .filter((doc) => doc.data().active !== false)
        .map((doc) => serializeBusiness(doc.id, doc.data()))
      : [];

    if (businessResult.status === 'rejected') {
      console.error('Error fetching businesses:', businessResult.reason);
    }

    const clients = clientResult.status === 'fulfilled'
      ? clientResult.value.docs
        .filter((doc) => doc.data().active !== false)
        .map((doc) => serializeBusiness(doc.id, doc.data()))
      : [];

    if (clientResult.status === 'rejected') {
      console.error('Error fetching clients:', clientResult.reason);
    }

    // Merge and deduplicate by ID
    // Extract raw client data for budget checking (preserving budget_remaining)
    const clientsRawData = clientResult.status === 'fulfilled'
      ? clientResult.value.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      : [];

    // Merge and deduplicate by ID
    const allBusinesses = [...businesses, ...clients];
    // Deep sanitize businesses to ensure no non-serializable objects (like Timestamps) leak through
    return {
      businesses: JSON.parse(JSON.stringify(allBusinesses)),
      clientsRaw: clientsRawData
    };
  } catch (error) {
    console.error('Error fetching businesses on server:', error);
    return { businesses: [], clientsRaw: [] };
  }
}

async function getAds(clientsRaw: any[], businesses: Business[], userGeo: UserGeo | null) {
  const db = getFirestore(app);
  try {
    const adsCol = collection(db, 'ads_banners');
    const q = query(adsCol);
    const snapshot = await getDocs(q);

    const clientMap = new Map(clientsRaw.map((c: any) => [c.id, c]));
    const businessMap = new Map(businesses.map((b) => [b.id, b]));

    const ads = snapshot.docs.map(doc => {
      const data = doc.data();
      const client = data.clientId ? clientMap.get(data.clientId) : null;
      const business = data.clientId ? businessMap.get(data.clientId) : null;

      let coords: [number, number] | undefined = undefined;

      // Try getting coords from Client (Raw)
      if (client && client.coords) {
        if (Array.isArray(client.coords) && client.coords.length === 2) {
          coords = [Number(client.coords[0]), Number(client.coords[1])];
        } else if (client.coords.latitude !== undefined && client.coords.longitude !== undefined) {
          coords = [Number(client.coords.latitude), Number(client.coords.longitude)];
        }
      }

      // Fallback: Try getting coords from Business (Sanitized)
      if (!coords && business && business.coords) {
        coords = business.coords;
      }

      // Fallback 2: Match by Name
      if (!coords && data.title) {
        const normalizedTitle = data.title.toLowerCase().trim();
        const matchedBusiness = businesses.find(b =>
          b.name.toLowerCase().trim() === normalizedTitle ||
          b.name.toLowerCase().trim().includes(normalizedTitle) && normalizedTitle.length > 5
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

      // [3] Geographic Filtering (New)
      if (userGeo && ad.reach_config) {
        const { type, value } = ad.reach_config;
        const radius = value?.radius_km || 50;

        // Safety: if tracking enabled but user IP failed, we default to SHOW (per request)
        if (!userGeo.lat && !userGeo.city) return true;

        if (type === 'local' && ad.coords && userGeo.lat && userGeo.lon) {
          const dist = calculateDistance(userGeo.lat, userGeo.lon, ad.coords[0], ad.coords[1]);
          if (dist > radius) return false;
        }

        if (type === 'regional' && userGeo.city) {
          // If ad has specific city target, use it. Otherwise imply Business City.
          // NOTE: Logic here assumes if type is regional, the business only wants to show to THEIR city.
          // We'd ideally take the business city from the map, but it's not always in 'city' field. 
          // We can approximate by checking if User City is contained in Business Address or Location string if available.
          // For this implementation, we will trust the `city` field in reach_config if it exists, otherwise skip (show).
          if (value?.city && value.city.toLowerCase() !== userGeo.city.toLowerCase()) return false;
        }

        if (type === 'national' && userGeo.country) {
          // Default to business country if ad config missing? 
          // Assuming Ads Manager saves the country in `value.country`
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
    console.error('Error fetching ads:', error);
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

