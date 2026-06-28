import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const revalidate = 0;

const CATEGORIAS = ['alimentos','agua','medicamentos','ropa','hogar','herramientas','transporte','servicio_medico','otro'] as const;

const ofertaSchema = z.object({
  tipo:             z.enum(['donacion', 'solicitud']),
  categoria:        z.enum(CATEGORIAS),
  descripcion:      z.string().min(5).max(500),
  cantidad:         z.string().max(100).optional(),
  lat:              z.number().min(-90).max(90),
  lng:              z.number().min(-180).max(180),
  sector:           z.string().min(2).max(200),
  contactoWhatsapp: z.string().min(7).max(20),
  disponibleHasta:  z.string().datetime(),
  centroAcopioId:   z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lng = parseFloat(searchParams.get('lng') ?? '');

    let q = db.collection('red_solidaria_ofertas')
      .where('estado', '==', 'disponible')
      .orderBy('creadoEn', 'desc')
      .limit(100);

    if (categoria && CATEGORIAS.includes(categoria as any)) {
      q = db.collection('red_solidaria_ofertas')
        .where('estado', '==', 'disponible')
        .where('categoria', '==', categoria)
        .orderBy('creadoEn', 'desc')
        .limit(100);
    }

    const snap = await q.get();
    const ofertas = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id:              doc.id,
        tipo:            d.tipo,
        categoria:       d.categoria,
        descripcion:     d.descripcion,
        cantidad:        d.cantidad ?? null,
        lat:             d.lat,
        lng:             d.lng,
        sector:          d.sector,
        disponibleHasta: d.disponibleHasta?.toDate?.()?.toISOString() ?? d.disponibleHasta,
        estado:          d.estado,
        fotoUrl:         d.fotoUrl ?? null,
        creadoEn:        d.creadoEn?.toDate?.()?.toISOString() ?? null,
        centroAcopioId:  d.centroAcopioId ?? null,
        // contactoWhatsapp is intentionally omitted from GET
      };
    });

    return NextResponse.json({ ofertas, total: ofertas.length }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = ofertaSchema.parse(body);

    const db = getAdminDb();
    const docRef = await db.collection('red_solidaria_ofertas').add({
      ...data,
      // store whatsapp but never expose in GET
      contactoWhatsapp: data.contactoWhatsapp,
      estado: 'disponible',
      creadoEn: FieldValue.serverTimestamp(),
      disponibleHasta: new Date(data.disponibleHasta),
      source: 'web_v1',
    });

    return NextResponse.json(
      { success: true, id: docRef.id },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
