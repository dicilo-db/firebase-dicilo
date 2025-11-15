// src/app/api/analytics/log/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { z } from 'zod';

const db = getFirestore(app);

// Esquema para validar los eventos entrantes
const eventSchema = z.object({
  type: z.enum(['search', 'cardClick', 'popupClick']),
  businessId: z.string().optional(),
  businessName: z.string().optional(),
  searchQuery: z.string().optional(),
  resultsCount: z.number().optional(),
  clickedElement: z.string().optional(), // p.ej. 'website', 'offer', 'map'
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validar los datos del evento
    const validatedData = eventSchema.parse(body);

    // 2. Preparar el documento para Firestore
    const eventData = {
      ...validatedData,
      timestamp: serverTimestamp(), // Usar el timestamp del servidor para consistencia
      userAgent: request.headers.get('user-agent') || 'Unknown',
      ip: request.headers.get('x-forwarded-for') || request.ip || 'Unknown', // Capturar IP si es posible
    };

    // 3. Guardar el evento en la colección 'analyticsEvents'
    await addDoc(collection(db, 'analyticsEvents'), eventData);

    return NextResponse.json(
      { success: true, message: 'Event logged.' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid event data.', details: error.flatten() },
        { status: 400 }
      );
    }

    console.error('API Analytics Error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
