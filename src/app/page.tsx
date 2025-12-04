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
    // Add other fields if they are simple types and needed
    category_key: data.category_key,
    subcategory_key: data.subcategory_key,
    rating: typeof data.rating === 'number' ? data.rating : undefined,
  };
}

async function getBusinesses(): Promise<Business[]> {
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
    const allBusinesses = [...businesses, ...clients];
    // Optional: Deduplication logic if needed, but IDs should be unique per collection. 
    // If we want to avoid showing the same entity twice if it exists in both (migration scenario):
    // const uniqueBusinesses = Array.from(new Map(allBusinesses.map(item => [item.id, item])).values());

    return allBusinesses;
  } catch (error) {
    console.error('Error fetching businesses on server:', error);
    return [];
  }
}

export default async function SearchPage() {
  const initialBusinesses = await getBusinesses();

  return (
    <main className="h-screen w-screen overflow-hidden">
      <DiciloSearchPage initialBusinesses={initialBusinesses} />
    </main>
  );
}
