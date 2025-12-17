// src/app/api/analytics/log/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

const db = getAdminDb();

// Schema for validating incoming events
const eventSchema = z.object({
  type: z.enum(['search', 'cardClick', 'popupClick']),
  businessId: z.string().optional(),
  businessName: z.string().optional(),
  searchQuery: z.string().optional(),
  resultsCount: z.number().optional(),
  clickedElement: z.string().optional(), // e.g., 'website', 'offer', 'map'
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate the event data
    const validatedData = eventSchema.parse(body);

    // 2. Prepare the document for Firestore
    const eventData = {
      ...validatedData,
      timestamp: Timestamp.now(), // Use server-side timestamp
      userAgent: request.headers.get('user-agent') || 'Unknown',
      ip: request.headers.get('x-forwarded-for') || request.ip || 'Unknown',
    };

    // 3. Save the event in the 'analyticsEvents' collection
    await db.collection('analyticsEvents').add(eventData);

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