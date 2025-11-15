// src/app/page.tsx
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { Business } from '@/components/dicilo-search-page';
import DiciloSearchPage from '@/components/dicilo-search-page';

async function getBusinesses(): Promise<Business[]> {
  const db = getFirestore(app);
  try {
    const businessesCol = collection(db, 'businesses');
    const q = query(businessesCol);
    const businessSnapshot = await getDocs(q);
    return businessSnapshot.docs.map((doc) => {
      const data = doc.data();
      // Data sanitization: Replace invalid or empty image URLs
      if (!data.imageUrl || data.imageUrl.includes('1024terabox.com')) {
        data.imageUrl = `https://placehold.co/128x128.png`;
      }
      return { id: doc.id, ...data } as Business;
    });
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