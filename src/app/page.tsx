// src/app/page.tsx
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { Business } from '@/components/dicilo-search-page';
import DiciloSearchPage from '@/components/dicilo-search-page';

export const dynamic = 'force-dynamic';

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
      ? businessResult.value.docs.map((doc) => {
        const data = doc.data();
        if (!data.imageUrl || data.imageUrl.includes('1024terabox.com')) {
          data.imageUrl = `https://placehold.co/128x128.png`;
        }
        return { id: doc.id, ...data } as Business;
      })
      : [];

    if (businessResult.status === 'rejected') {
      console.error('Error fetching businesses:', businessResult.reason);
    }

    const clients = clientResult.status === 'fulfilled'
      ? clientResult.value.docs.map((doc) => {
        const data = doc.data();
        let imageUrl = data.clientLogoUrl || data.imageUrl;
        if (!imageUrl || imageUrl.includes('1024terabox.com')) {
          imageUrl = `https://placehold.co/128x128.png`;
        }

        return {
          id: doc.id,
          name: data.clientName || data.name || 'Unbekanntes Unternehmen',
          category: data.category || 'Allgemein',
          description: data.description || '',
          location: data.location || '',
          imageUrl: imageUrl,
          imageHint: data.imageHint || '',
          coords: data.coords || undefined,
          address: data.address || '',
          phone: data.phone || '',
          website: data.website || '',
          currentOfferUrl: data.currentOfferUrl || '',
          clientSlug: data.slug || '',
          mapUrl: data.mapUrl || '',
        } as Business;
      })
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
