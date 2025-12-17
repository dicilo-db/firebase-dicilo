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

async function getBusinesses(): Promise<{ businesses: Business[], clientsRaw: any[] }> {
  const db = getFirestore(app);
  console.log('Fetching businesses on server...');
  try {

    // Fetch from both collections in parallel with error handling
    const businessesCol = collection(db, 'businesses');
    const clientsCol = collection(db, 'clients');

    const [businessResult, clientResult] = await Promise.allSettled([
      getDocs(query(businessesCol)),
      getDocs(query(clientsCol))
    ]);

    const businesses = businessResult.status === 'fulfilled'
      ? businessResult.value.docs.map((doc) => serializeBusiness(doc.id, doc.data()))
      : [];

    if (businessResult.status === 'rejected') {
      console.error('Error fetching businesses:', businessResult.reason);
    }

    const clients = clientResult.status === 'fulfilled'
      ? clientResult.value.docs.map((doc) => serializeBusiness(doc.id, doc.data()))
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

async function getAds(clientsRaw: any[]) {
  const db = getFirestore(app);
  try {
    const adsCol = collection(db, 'ads_banners');
    const q = query(adsCol);
    const snapshot = await getDocs(q);

    // Map of client budgets for quick lookup
    const clientBudgets = new Map(clientsRaw.map((c: any) => [c.id, c.budget_remaining || 0]));

    // Build plain objects and filter
    const ads = snapshot.docs.map(doc => {
      const data = doc.data();
      const sanitized = {
        id: doc.id,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        title: data.title,
        active: data.active,
        position: data.position,
        clientId: data.clientId,
      };
      return sanitized;
    }).filter(ad => {
      // Must be active
      if (ad.active === false) return false;
      // Budget check if clientId present
      if (ad.clientId) {
        const budget = clientBudgets.get(ad.clientId);
        if (typeof budget === 'number' && budget <= 0.05) return false;
      }
      return true;
    });

    // Deep sanitize final array
    return JSON.parse(JSON.stringify(ads));
  } catch (error) {
    console.error('Error fetching ads:', error);
    return [];
  }
}

export default async function SearchPage() {
  const { businesses, clientsRaw } = await getBusinesses();
  const ads = await getAds(clientsRaw);

  return (
    <main className="h-screen w-screen overflow-hidden">
      <DiciloSearchPage
        initialBusinesses={JSON.parse(JSON.stringify(businesses))}
        initialAds={JSON.parse(JSON.stringify(ads))}
      />
    </main>
  );
}
