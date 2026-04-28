import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import type { Business } from '@/components/dicilo-search-page';

export const dynamic = 'force-dynamic';

// No memory caching needed due to selective projections (reduces memory usage by 95%)

// Duplicated helper from page.tsx to serialize businesses efficiently
function extractCoords(data: any): [number, number] | undefined {
  if (!data) return undefined;
  const validate = (lat: any, lng: any): [number, number] | undefined => {
    const nLat = Number(lat);
    const nLng = Number(lng);
    if (!isNaN(nLat) && !isNaN(nLng)) return [nLat, nLng];
    return undefined;
  };

  if (data.lat !== undefined && data.lng !== undefined) return validate(data.lat, data.lng);
  if (data.latitude !== undefined && data.longitude !== undefined) return validate(data.latitude, data.longitude);
  if (data._latitude !== undefined && data._longitude !== undefined) return validate(data._latitude, data._longitude);

  const c = data.coords || data.coordinates;
  if (c) {
    if (Array.isArray(c) && c.length === 2) return validate(c[0], c[1]);
    if (typeof c === 'object') {
      if (c.lat !== undefined && c.lng !== undefined) return validate(c.lat, c.lng);
      if (c.latitude !== undefined && c.longitude !== undefined) return validate(c.latitude, c.longitude);
      if (c._latitude !== undefined && c._longitude !== undefined) return validate(c._latitude, c._longitude);
    }
  }

  if (Array.isArray(data) && data.length === 2) return validate(data[0], data[1]);

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
    description: (data.description || data.bodyData?.description || data.headerData?.welcomeText || '').substring(0, 500),
    location: data.location || '',
    imageUrl: imageUrl,
    clientLogoUrl: data.clientLogoUrl || imageUrl,
    coverImageUrl: data.headerData?.headerImageUrl || data.headerData?.headerBackgroundImageUrl || data.headerData?.backgroundImage || data.coverImage || imageUrl,
    imageHint: data.imageHint || '',
    address: data.address || '',
    phone: data.phone || '',
    email: data.email || '',
    clientType: docId === 'E6IUdKlV5OMlv2DWlNxE' || docId === 'Qt9u8Pd1Qi52AM0no2uw' ? 'premium' : data.clientType || 'retailer',
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

// Simple memory cache
interface CacheData {
  businesses: Business[];
  timestamp: number;
}
let globalCache: CacheData | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedData() {
  const now = Date.now();
  if (globalCache && now - globalCache.timestamp < CACHE_TTL) {
    return { businesses: globalCache.businesses };
  }

  const db = getAdminDb();
  
  // Use select() to strictly limit the data payload to kilobytes instead of megabytes
  const selectedFields = [
      'name', 'clientName', 'category', 'location', 
      'coordinates', 'coords', 'lat', 'lng', 'latitude', 'longitude', '_latitude', '_longitude',
      'visibility_settings', 'clientType', 'tier_level', 'active', 
      'clientLogoUrl', 'imageUrl', 'headerData', 'coverImage', 
      'address', 'phone', 'email', 'website', 'currentOfferUrl', 
      'slug', 'mapUrl', 'category_key', 'subcategory_key', 'rating',
      'description', 'translations', 'description_translations'
  ];

  const [businessSnap, clientSnap] = await Promise.all([
    db.collection('businesses').select(...selectedFields).get(),
    db.collection('clients').select(...selectedFields).get()
  ]);

  const businesses = businessSnap.docs
    .map((doc) => serializeBusiness(doc.id, doc.data()));

  const clients = clientSnap.docs
    .map((doc) => serializeBusiness(doc.id, doc.data()));

  const allBusinesses = [...businesses, ...clients];

  globalCache = {
    businesses: allBusinesses,
    timestamp: now
  };

  return { businesses: allBusinesses };
}

function haversineDistance(coords1: [number, number], coords2: [number, number]): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(coords2[0] - coords1[0]);
  const dLon = toRad(coords2[1] - coords1[1]);
  const lat1 = toRad(coords1[0]);
  const lat2 = toRad(coords2[0]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const normalizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const queryStr = searchParams.get('q') || '';
    const pageStr = searchParams.get('page') || '0';
    const limitStr = searchParams.get('limit') || '50';

    const lat = latStr ? parseFloat(latStr) : null;
    const lng = lngStr ? parseFloat(lngStr) : null;
    const page = parseInt(pageStr, 10);
    const limit = parseInt(limitStr, 10);
    const query = normalizeText(queryStr);

    const { businesses } = await getCachedData();

    // 1. Filter active businesses
    let filtered = businesses.filter((b) => b.active !== false);

    // 2. Text Search Filtering (if provided)
    if (query.trim().length > 0) {
      filtered = filtered.filter((b) => {
        const searchableText = [b.name, b.description, b.category, b.location, b.address]
          .map(normalizeText)
          .join(' ');
        return searchableText.includes(query);
      });
    }

    // 3. Sorting
    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      const userLocation: [number, number] = [lat, lng];
      
      filtered.sort((a, b) => {
        // Boost premium clients always
        if (a.clientType === 'premium' && b.clientType !== 'premium') return -1;
        if (a.clientType !== 'premium' && b.clientType === 'premium') return 1;

        // If there's a search query, words starting with the query go first
        if (query.trim()) {
           const aStarts = normalizeText(a.name).startsWith(query) ? -1 : 1;
           const bStarts = normalizeText(b.name).startsWith(query) ? -1 : 1;
           if (aStarts !== bStarts) return aStarts - bStarts;
        }

        if (!a.coords || a.coords.length !== 2) return 1;
        if (!b.coords || b.coords.length !== 2) return -1;
        
        const distA = haversineDistance(userLocation, a.coords as [number, number]);
        const distB = haversineDistance(userLocation, b.coords as [number, number]);
        return distA - distB;
      });
    } else {
      // Default fallback sorting if no coords provided
      filtered.sort((a, b) => {
        if (a.clientType === 'premium' && b.clientType !== 'premium') return -1;
        if (a.clientType !== 'premium' && b.clientType === 'premium') return 1;
        
        // If there's a search query, exact matches first
        if (query.trim()) {
           const aStarts = normalizeText(a.name).startsWith(query) ? -1 : 1;
           const bStarts = normalizeText(b.name).startsWith(query) ? -1 : 1;
           if (aStarts !== bStarts) return aStarts - bStarts;
        }
        
        return a.name.localeCompare(b.name);
      });
    }

    // 4. Pagination
    const startIndex = page * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = filtered.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedResults,
      meta: {
        total: filtered.length,
        page,
        limit,
        hasMore: endIndex < filtered.length
      }
    });

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
