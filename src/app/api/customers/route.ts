// src/app/api/customers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export const dynamic = 'force-dynamic'; // Fuerza el renderizado dinámico

const db = getFirestore(app);

// Define la estructura de los datos del negocio para la respuesta
interface Business {
  id: string;
  [key: string]: any;
}

/**
 * Endpoint de API para obtener la lista de negocios (clientes).
 * Requiere una clave de API en la cabecera 'x-api-key' para la autenticación.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Obtener la clave de API de la cabecera
    const apiKey = request.headers.get('x-api-key');

    // 2. Validar la clave de API
    const serverApiKey = process.env.WEBSITE_API_KEY;

    if (!serverApiKey) {
      console.error('La clave de API del servidor no está configurada.');
      return NextResponse.json(
        { message: 'Error de configuración del servidor.' },
        { status: 500 }
      );
    }

    if (apiKey !== serverApiKey) {
      return NextResponse.json(
        {
          message:
            'Acceso no autorizado: Clave de API inválida o no proporcionada.',
        },
        { status: 401 }
      );
    }

    // 3. Obtener los datos de los negocios desde Firestore
    const businessesCol = collection(db, 'businesses');
    const businessSnapshot = await getDocs(businessesCol);

    const businessList: Business[] = businessSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 4. Devolver la lista de negocios
    return NextResponse.json(businessList, { status: 200 });
  } catch (error) {
    console.error('Error en el endpoint /api/customers:', error);

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
