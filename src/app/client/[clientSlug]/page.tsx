// src/app/client/[clientSlug]/page.tsx
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import ClientLandingPage from '@/components/ClientLandingPage';
import { ClientData } from '@/components/ClientLandingPage';
import { I18nProvider } from '@/context/i18n-provider';

const db = getFirestore(app);

export async function generateStaticParams() {
  try {
    const clientsCol = collection(db, 'clients');
    const clientSnapshot = await getDocs(clientsCol);
    const slugs = clientSnapshot.docs
      .map((doc) => doc.data().slug)
      .filter(Boolean);
    return slugs.map((slug) => ({ clientSlug: slug }));
  } catch (error) {
    console.error('Error generating static params for clients:', error);
    return [];
  }
}

async function getClientData(slug: string): Promise<ClientData | null> {
  try {
    const q = query(collection(db, 'clients'), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = { id: doc.id, ...doc.data() } as ClientData;
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error('Error fetching client data:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { clientSlug: string };
}) {
  const clientData = await getClientData(params.clientSlug);

  if (!clientData) {
    return {
      title: 'Client Not Found | dicilo.net',
      description: 'The requested client profile does not exist.',
    };
  }

  const description =
    clientData.bodyData?.subtitle ||
    `Discover ${clientData.clientName}'s profile on dicilo.net.`;

  return {
    title: `${clientData.clientName} | dicilo.net`,
    description: description,
    openGraph: {
      title: `${clientData.clientName} | dicilo.net`,
      description: description,
      images: clientData.clientLogoUrl
        ? [{ url: clientData.clientLogoUrl }]
        : [],
    },
  };
}

export default async function ClientPage({
  params,
}: {
  params: { clientSlug: string };
}) {
  const clientData = await getClientData(params.clientSlug);

  if (!clientData) {
    notFound();
  }

  return (
    <I18nProvider>
      <ClientLandingPage clientData={clientData} />
    </I18nProvider>
  );
}
