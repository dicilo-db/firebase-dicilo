// src/app/forms/embed/[clientId]/page.tsx
'use client';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import RecommendationFormForClient from './form-client';
import { useEffect, useState } from 'react';

const db = getFirestore(app);

async function getClientProducts(
  clientId: string
): Promise<{ name: string; id: string }[]> {
  try {
    const clientRef = doc(db, 'clients', clientId);
    const clientSnap = await getDoc(clientRef);
    if (clientSnap.exists()) {
      return clientSnap.data().products || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching client products:', error);
    return [];
  }
}

export default function EmbedFormPage({
  params,
}: {
  params: { clientId: string };
}) {
  const [products, setProducts] = useState<{ name: string; id: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.clientId) {
      notFound();
      return;
    }
    const fetchProducts = async () => {
      setLoading(true);
      const fetchedProducts = await getClientProducts(params.clientId);
      setProducts(fetchedProducts);
      setLoading(false);
    };
    fetchProducts();
  }, [params.clientId]);

  if (loading) {
    return <div>Loading form...</div>;
  }

  return (
    <div className="bg-background p-4">
      <RecommendationFormForClient products={products} />
    </div>
  );
}