// src/app/api/feedback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';

const db = getFirestore(app);

// Schema de validación (debe coincidir con el del frontend)
const feedbackSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  country: z.string().min(2, 'Country is required'),
  customerType: z.enum(['private', 'donor', 'company', 'premium'], {
    required_error: 'Please select a customer type.',
  }),
  rating: z.coerce
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot be more than 5'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar los datos usando Zod
    const validatedData = feedbackSchema.parse(body);

    // Preparar datos para Firestore
    const feedbackData = {
      ...validatedData,
      createdAt: new Date(), // Usar la fecha del servidor
      processed: false,
      source: 'website_vorteile_page',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      ip: request.headers.get('x-forwarded-for') || 'Unknown',
    };

    // Guardar en la colección 'feedbacks'
    const docRef = await addDoc(collection(db, 'feedbacks'), feedbackData);

    return NextResponse.json(
      {
        success: true,
        message: 'Feedback saved successfully',
        id: docRef.id,
      },
      { status: 201 }
    );
  } catch (error) {
    // Error de validación de Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Error de Firebase u otros
    if (error instanceof Error) {
      if ('code' in error && (error as any).code?.startsWith('firebase/')) {
        return NextResponse.json(
          { success: false, message: 'Database error. Please try again.' },
          { status: 500 }
        );
      }
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { success: false, message: 'Invalid JSON format' },
          { status: 400 }
        );
      }
    }

    // Error genérico
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}

// Método GET para testing
export async function GET() {
  return NextResponse.json(
    {
      message: 'Feedback API is working',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
