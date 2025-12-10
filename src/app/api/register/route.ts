import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { adminAuth } from '@/lib/firebase-admin';
import { createPrivateUserProfile } from '@/lib/private-user-service';

const db = getFirestore(app);

// ¡REEMPLAZAR CON TU URL REAL DE N8N!
const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  'https://webhook.site/d2a33f4a-7360-4f95-9273-d5d1c2580a37'; // URL de prueba

// Define the schema for validation (must match frontend)
const registrationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  whatsapp: z.string().optional(),
  contactType: z.enum(['whatsapp', 'telegram']).optional(),
  registrationType: z.enum(['private', 'donor', 'retailer', 'premium']),
  // Business Fields
  businessName: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  imageHint: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  currentOfferUrl: z.string().url().optional().or(z.literal('')),
  mapUrl: z.string().url().optional().or(z.literal('')),
  coords: z.array(z.number()).length(2).optional(),
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

    // Validate the request body
    const result = registrationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.format() },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      password,
      whatsapp,
      contactType,
      registrationType,
      businessName,
      category,
      description,
      location,
      address,
      phone,
      website,
      imageUrl,
      imageHint,
      rating,
      currentOfferUrl,
      mapUrl,
      coords,
    } = result.data;

    // 1. Create Authentication User (if password provided)
    let ownerUid = null;
    if (password) {
      try {
        const userRecord = await adminAuth.createUser({
          email,
          password,
          displayName: `${firstName} ${lastName}`,
        });
        ownerUid = userRecord.uid;
        console.log('Successfully created new user:', ownerUid);
      } catch (authError: any) {
        console.error('Error creating new user:', authError);
        // If user already exists, we might want to fail or proceed without linking.
        // For now, let's fail to inform the user they are already registered.
        if (authError.code === 'auth/email-already-exists') {
          return NextResponse.json(
            { message: 'Email already registered. Please login.' },
            { status: 409 }
          );
        }
        // Other auth errors
        console.error('Detailed Auth Error:', authError);
        return NextResponse.json(
          { message: `Error creating user account: ${authError.message}` },
          { status: 500 }
        );
      }
    }

    // 2. Save to Firestore
    const registrationData = {
      firstName,
      lastName,
      email,
      whatsapp: whatsapp || null,
      contactType: contactType || 'whatsapp', // Default to whatsapp if not provided
      registrationType,
      ownerUid: ownerUid, // Link to Auth User
      // Business Fields
      businessName: businessName || null,
      category: category || null,
      description: description || null,
      location: location || null,
      address: address || null,
      phone: phone || null,
      website: website || null,
      imageUrl: imageUrl || null,
      imageHint: imageHint || null,
      rating: rating || null,
      currentOfferUrl: currentOfferUrl || null,
      mapUrl: mapUrl || null,
      coords: coords || null,
      createdAt: serverTimestamp(),
      status: 'pending', // Initial status
    };

    const registrationDocRef = await addDoc(collection(db, 'registrations'), registrationData);

    // 3. Crear automáticamente una landing page si es Minorista o Premium
    if (
      registrationType === 'retailer' ||
      registrationType === 'premium'
    ) {
      const clientName = businessName || `${firstName} ${lastName}`; // Use business name if available
      const defaultClientData = {
        clientName: clientName,
        clientLogoUrl: imageUrl || '',
        clientTitle: `Bienvenido a ${clientName}`,
        clientSubtitle:
          'Esta es tu página de aterrizaje. ¡Edítala desde el panel de administración!',
        products: [],
        slug: slugify(clientName),
        socialLinks: { instagram: '', facebook: '', linkedin: '' },
        strengths: [],
        testimonials: [],
        translations: {},
        ownerUid: ownerUid, // Link to Auth User
        registrationId: registrationDocRef.id,
      };

      try {
        await addDoc(collection(db, 'clients'), defaultClientData);
      } catch (dbError) {
        console.error('Firestore Error (clients):', dbError);
        // No detenemos el proceso si esto falla, pero lo registramos.
      }
    }

    // 3.5 Create Private Profile if type is 'private'
    if (registrationType === 'private' && ownerUid) {
      try {
        await createPrivateUserProfile(ownerUid, {
          firstName,
          lastName,
          email,
          whatsapp,
          phone,
          contactType: contactType as 'whatsapp' | 'telegram' | undefined
        });
      } catch (profileError) {
        console.error('Error creating private profile:', profileError);
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
          ...result.data,
          firestoreId: registrationDocRef.id,
          ownerUid: ownerUid,
        }),
      });

      if (!webhookResponse.ok) {
        const errorBody = await webhookResponse.text();
        console.error('N8N Webhook error:', errorBody);
      }
    } catch (webhookError) {
      console.error('Webhook fetch error:', webhookError);
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
