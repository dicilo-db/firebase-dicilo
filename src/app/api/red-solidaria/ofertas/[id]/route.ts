import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  descripcion:     z.string().min(5).max(500).optional(),
  cantidad:        z.string().max(100).nullable().optional(),
  sector:          z.string().min(2).max(200).optional(),
  lat:             z.number().min(-90).max(90).optional(),
  lng:             z.number().min(-180).max(180).optional(),
  disponibleHasta: z.string().datetime().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = patchSchema.parse(body);

    const db = getAdminDb();
    const docRef = db.collection('red_solidaria_ofertas').doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (data.descripcion     !== undefined) updates.descripcion     = data.descripcion;
    if (data.cantidad        !== undefined) updates.cantidad        = data.cantidad ?? null;
    if (data.sector          !== undefined) updates.sector          = data.sector;
    if (data.lat             !== undefined) updates.lat             = data.lat;
    if (data.lng             !== undefined) updates.lng             = data.lng;
    if (data.disponibleHasta !== undefined) updates.disponibleHasta = new Date(data.disponibleHasta);

    await docRef.update(updates);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
