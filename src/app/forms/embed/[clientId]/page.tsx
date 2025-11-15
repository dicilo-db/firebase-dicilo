// src/app/forms/embed/[clientId]/page.tsx
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import RecommendationFormForClient from './form-client';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';

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

// Esto es necesario para que el provider de `next-intl` funcione en esta página aislada.
export default async function EmbedFormPage({
  params,
}: {
  params: { clientId: string; locale: string };
}) {
  const products = await getClientProducts(params.clientId);
  const messages = await getMessages();

  if (!params.clientId) {
    notFound();
  }

  return (
    <NextIntlClientProvider locale={params.locale} messages={messages}>
      <div className="bg-background p-4">
        <RecommendationFormForClient products={products} />
      </div>
    </NextIntlClientProvider>
  );
}
