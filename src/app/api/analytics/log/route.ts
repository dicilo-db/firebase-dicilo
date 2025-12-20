// src/app/api/analytics/log/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

const db = getAdminDb();

// Schema for validating incoming events
const eventSchema = z.object({
  type: z.enum(['search', 'cardClick', 'popupClick', 'driveToStore', 'socialClick']),
  businessId: z.string().optional(),
  businessName: z.string().optional(),
  searchQuery: z.string().optional(),
  resultsCount: z.number().optional(),
  clickedElement: z.string().optional(), // e.g., 'website', 'offer', 'map'
  details: z.string().optional(), // For social network name etc.
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

    // 4. [NEW] Update daily stats for Ads and Client Metrics
    let statsPromise = Promise.resolve();

    // Check if we need to update stats
    const isAdClick = validatedData.type === 'cardClick' && validatedData.isAd;
    const isClientMetric = ['driveToStore', 'socialClick'].includes(validatedData.type);

    if ((isAdClick || isClientMetric) && validatedData.businessId) {
      statsPromise = (async () => {
        try {
          const today = new Date();
          const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD
          const businessId = validatedData.businessId!;
          const statsId = `${businessId}_${dateKey}`;
          const statsRef = db.collection('ad_stats_daily').doc(statsId);

          const updateData: any = {
            adId: businessId, // Keeping field name consistent for now
            date: dateKey,
            updatedAt: FieldValue.serverTimestamp()
          };

          if (isAdClick) {
            updateData.clicks = FieldValue.increment(1);
          } else if (validatedData.type === 'driveToStore') {
            updateData.driveToStoreCount = FieldValue.increment(1);
          } else if (validatedData.type === 'socialClick') {
            updateData.socialClickCount = FieldValue.increment(1);
          }

          await statsRef.set(updateData, { merge: true });
        } catch (err) {
          console.error('[STATS ERROR] Failed to track stats:', err);
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