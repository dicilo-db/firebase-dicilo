// src/app/api/businesses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';
import { app } from '@/lib/firebase';

const db = getFirestore(app);

// Define la estructura de los datos del negocio para la respuesta
interface Business {
  id: string;
  [key: string]: any;
}

/**
 * Endpoint de API para obtener la lista de negocios.
 * En el futuro, se puede ampliar para aceptar parámetros de geolocalización o paginación.
 */
export async function GET(request: NextRequest) {
  try {
    const businessesCol = collection(db, 'businesses');
    const businessQuery = query(businessesCol);
    const businessSnapshot = await getDocs(businessQuery);

    const businessList: Business[] = businessSnapshot.docs.map((doc) => {
      const data = doc.data();
      // Data sanitization: Replace invalid or empty image URLs
      if (!data.imageUrl || data.imageUrl.includes('1024terabox.com')) {
        data.imageUrl = `https://placehold.co/128x128.png`;
      }
      return { id: doc.id, ...data };
    });

    return NextResponse.json(businessList, { status: 200 });
  } catch (error) {
    console.error('Error en el endpoint /api/businesses:', error);

    let errorMessage = 'Ocurrió un error inesperado en el servidor.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { message: 'Error interno del servidor.', error: errorMessage },
      { status: 500 }
    );
  }
}
