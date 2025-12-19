// src/app/api/analytics/log/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
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
  isAd: z.boolean().optional(), // [NEW] Flag to identify if the card was an Ad
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
    const mainLogPromise = db.collection('analyticsEvents').add(eventData);

    // 4. [NEW] If it's an Ad Click, update daily stats
    let statsPromise = Promise.resolve();
    if (validatedData.type === 'cardClick' && validatedData.isAd && validatedData.businessId) {
      statsPromise = (async () => {
        try {
          const today = new Date();
          const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD
          const adId = validatedData.businessId!;
          const statsId = `${adId}_${dateKey}`;
          const statsRef = db.collection('ad_stats_daily').doc(statsId);

          await statsRef.set({
            adId,
            date: dateKey,
            clicks: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp()
          }, { merge: true });
        } catch (err) {
          console.error('[STATS ERROR] Failed to track ad click:', err);
        }
      })();
    }

    await Promise.all([mainLogPromise, statsPromise]);

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