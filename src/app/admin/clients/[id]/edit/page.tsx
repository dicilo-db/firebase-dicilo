// src/app/admin/clients/[id]/edit/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import EditClientForm from './EditClientForm';
import { Skeleton } from '@/components/ui/skeleton';

// Define la estructura de datos que se espera
export interface ClientData {
  id: string;
  clientName: string;
  clientType: 'retailer' | 'premium';
  clientLogoUrl: string;
  headerData?: any;
  marqueeHeaderData?: any;
  bodyData?: any;
  infoCards?: any[];
  graphics?: any[];
  products?: any[];
  translations: any;
  slug: string;
}

const EditClientFormSkeleton = () => (
  <div className="space-y-6 p-8">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-24" />
    </div>
    <div className="rounded-lg border p-6">
      <Skeleton className="mb-6 h-10 w-full" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <div className="mt-6 flex justify-end">
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  </div>
);

export default function EditClientPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const getClientData = async (id: string) => {
      const db = getFirestore(app);
      try {
        const docRef = doc(db, 'clients', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const serializableData = JSON.parse(
            JSON.stringify(data, (key, value) => {
              if (
                value &&
                value.hasOwnProperty('seconds') &&
                value.hasOwnProperty('nanoseconds')
              ) {
                return new Date(value.seconds * 1000).toISOString();
              }
              return value;
            })
          );
          setClientData({ id: docSnap.id, ...serializableData } as ClientData);
        } else {
          notFound();
        }
      } catch (error) {
        console.error('Error fetching client data on client:', error);
        // Aquí podrías mostrar un toast de error si lo deseas
        router.push('/admin/clients'); // Redirigir en caso de error
      } finally {
        setIsLoading(false);
      }
    };

    getClientData(id);
  }, [id, router]);

  if (isLoading) {
    return <EditClientFormSkeleton />;
  }

  if (!clientData) {
    // Esto no debería suceder si notFound() funciona, pero es una salvaguarda.
    return null;
  }

  return (
    <div className="p-8">
      <EditClientForm initialData={clientData} />
    </div>
  );
}
