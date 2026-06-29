import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const revalidate = 0;

const CATEGORIAS = ['alimentos','agua','medicamentos','ropa','hogar','herramientas','transporte','servicio_medico','otro'] as const;

const centroSchema = z.object({
  nombre:      z.string().min(3).max(120),
  direccion:   z.string().min(5).max(300).optional(),
  sector:      z.string().min(2).max(200),
  lat:         z.number().min(-90).max(90),
  lng:         z.number().min(-180).max(180),
  horario:     z.string().min(3).max(200).optional(),
  responsable: z.string().min(2).max(120).optional(),
  whatsapp:    z.string().min(7).max(30),
  capacidad:   z.string().max(100).optional(),
  necesidades: z.array(z.object({
    categoria:   z.enum(CATEGORIAS),
    descripcion: z.string().max(300).default(''),
    urgencia:    z.enum(['alta', 'media', 'baja']),
  })).min(1).max(20),
});

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection('red_solidaria_centros')
      .orderBy('creadoEn', 'desc')
      .limit(200)
      .get();

    const centros = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id:          doc.id,
        nombre:      d.nombre,
        direccion:   d.direccion,
        sector:      d.sector,
        lat:         d.lat,
        lng:         d.lng,
        horario:     d.horario,
        responsable: d.responsable,
        verificado:  d.verificado ?? false,
        necesidades: d.necesidades ?? [],
        fotoUrl:     d.fotoUrl ?? null,
        creadoEn:    d.creadoEn?.toDate?.()?.toISOString() ?? null,
        // whatsapp omitted from GET; shared only on confirmed match
      };
    });

    return NextResponse.json({ centros, total: centros.length }, {
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
    const data = centroSchema.parse(body);

    const db = getAdminDb();
    const docRef = await db.collection('red_solidaria_centros').add({
      ...data,
      verificado: false, // manual verification by Dicilo team
      creadoEn: FieldValue.serverTimestamp(),
      source: 'web_v1',
    });

    return NextResponse.json(
      {
        success: true,
        id: docRef.id,
        message: 'Centro registrado. El equipo de Dicilo lo verificará en 24h.',
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
