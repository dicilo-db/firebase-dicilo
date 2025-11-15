import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';

const db = getFirestore(app);

// ¡REEMPLAZAR CON TU URL REAL DE N8N!
const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  'https://webhook.site/d2a33f4a-7360-4f95-9273-d5d1c2580a37'; // URL de prueba

const registrationSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  whatsapp: z.string(),
  registrationType: z.enum(['private', 'donor', 'retailer', 'premium']),
});

// Helper function to create a URL-friendly slug
const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validar los datos recibidos
    const validatedData = registrationSchema.parse(body);

    // 2. Guardar en Firestore
    let registrationDocRef;
    try {
      registrationDocRef = await addDoc(collection(db, 'registrations'), {
        ...validatedData,
        createdAt: serverTimestamp(),
      });
    } catch (dbError) {
      console.error('Firestore Error (registrations):', dbError);
      return NextResponse.json(
        { message: 'Error saving registration data.' },
        { status: 500 }
      );
    }

    // 3. Crear automáticamente una landing page si es Minorista o Premium
    if (
      validatedData.registrationType === 'retailer' ||
      validatedData.registrationType === 'premium'
    ) {
      const clientName = `${validatedData.firstName} ${validatedData.lastName}`;
      const defaultClientData = {
        clientName: clientName,
        clientLogoUrl: '',
        clientTitle: `Bienvenido a ${clientName}`,
        clientSubtitle:
          'Esta es tu página de aterrizaje. ¡Edítala desde el panel de administración!',
        products: [],
        slug: slugify(clientName),
        socialLinks: { instagram: '', facebook: '', linkedin: '' },
        strengths: [],
        testimonials: [],
        translations: {},
      };

      try {
        await addDoc(collection(db, 'clients'), defaultClientData);
      } catch (dbError) {
        console.error('Firestore Error (clients):', dbError);
        // No detenemos el proceso si esto falla, pero lo registramos.
        // El usuario ya se registró exitosamente.
      }
    }

    // 4. Enviar al webhook de N8N
    try {
      const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...validatedData,
          firestoreId: registrationDocRef.id,
        }),
      });

      if (!webhookResponse.ok) {
        const errorBody = await webhookResponse.text();
        console.error('N8N Webhook error:', errorBody);
        // Aunque falle el webhook, el registro en Firestore fue exitoso, así que no devolvemos un error al usuario, pero lo registramos.
      }
    } catch (webhookError) {
      console.error('Webhook fetch error:', webhookError);
      // Similar al caso anterior, el error de webhook no debe impedir la respuesta de éxito al usuario.
    }

    return NextResponse.json(
      { success: true, message: 'Registration successful.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid data provided.', details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
