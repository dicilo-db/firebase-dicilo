import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue, Firestore } from 'firebase-admin/firestore';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Dicilo-Key',
};

const reportSchema = z.object({
  org: z.string().min(2).max(120),
  orgType: z.enum(['ngo', 'redcross', 'government', 'volunteer', 'church', 'company', 'media', 'other']),
  zone: z.string().min(2).max(200),
  message: z.string().min(10).max(2000),
  category: z.enum(['delivery', 'rescue', 'medical', 'shelter', 'food', 'water', 'missing', 'update', 'general']),
  peopleHelped: z.number().int().min(0).max(1_000_000).optional(),
  contact: z.string().max(200).optional(),
  lang: z.string().length(2).optional().default('es'),
});

async function validateApiKey(db: Firestore, key: string): Promise<{ valid: boolean; org?: string }> {
  if (!key || key.length < 10) return { valid: false };
  const snap = await db.collection('vzla_api_keys').where('key', '==', key).where('active', '==', true).limit(1).get();
  if (snap.empty) return { valid: false };
  return { valid: true, org: snap.docs[0].data().org ?? '' };
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-dicilo-key') ?? '';
    const db = getAdminDb();

    const { valid, org: registeredOrg } = await validateApiKey(db, apiKey);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid or missing API key. Request access at info@dicilo.net' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const body = await request.json();
    const data = reportSchema.parse(body);

    const docRef = await db.collection('vzla_field_reports').add({
      ...data,
      status: 'approved',
      registeredOrg,
      createdAt: FieldValue.serverTimestamp(),
      ip: request.headers.get('x-forwarded-for') ?? 'unknown',
      source: 'partner_api_v1',
    });

    return NextResponse.json(
      {
        success: true,
        id: docRef.id,
        message: 'Report received. It will appear on dicilo.net/la-comunidad/apoyo-vzla shortly.',
        viewAt: 'https://dicilo.net/la-comunidad/apoyo-vzla',
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: err.errors },
        { status: 422, headers: CORS_HEADERS }
      );
    }
    return NextResponse.json(
      { error: err.message ?? 'Internal error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
