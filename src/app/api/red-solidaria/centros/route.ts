import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendSmtpEmail } from '@/lib/mail-service';

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

    // Notify team — non-blocking, registration succeeds even if email fails
    const necesidadesList = data.necesidades
      .map((n) => `<li><strong>${n.categoria}</strong> (urgencia: ${n.urgencia})</li>`)
      .join('');

    sendSmtpEmail({
      to: 'ayudavzla@dicilo.net',
      subject: `🏠 Nuevo centro de acopio pendiente de verificación — ${data.nombre}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <div style="background:#1e3a5f;padding:24px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:20px">🏠 Nuevo Centro de Acopio</h1>
            <p style="color:#94a3b8;margin:4px 0 0;font-size:13px">Pendiente de verificación — Red Solidaria Dicilo</p>
          </div>
          <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:8px 0;color:#64748b;width:120px">ID Firestore</td><td style="padding:8px 0;font-weight:600">${docRef.id}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Nombre</td><td style="padding:8px 0;font-weight:600">${data.nombre}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Sector</td><td style="padding:8px 0">${data.sector}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">WhatsApp</td><td style="padding:8px 0">${data.whatsapp}</td></tr>
              ${data.horario ? `<tr><td style="padding:8px 0;color:#64748b">Horario</td><td style="padding:8px 0">${data.horario}</td></tr>` : ''}
              ${data.capacidad ? `<tr><td style="padding:8px 0;color:#64748b">Capacidad</td><td style="padding:8px 0">${data.capacidad}</td></tr>` : ''}
              <tr><td style="padding:8px 0;color:#64748b">Coordenadas</td><td style="padding:8px 0">${data.lat}, ${data.lng}</td></tr>
            </table>
            ${necesidadesList ? `
            <div style="margin-top:16px">
              <p style="font-weight:600;font-size:13px;color:#334155;margin:0 0 6px">Categorías que recibe:</p>
              <ul style="margin:0;padding-left:18px;font-size:13px;color:#475569">${necesidadesList}</ul>
            </div>` : ''}
            <div style="margin-top:24px;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px">
              <p style="margin:0;font-size:13px;color:#92400e">
                ✅ Para aprobar: abre Firestore → <strong>red_solidaria_centros</strong> → documento <strong>${docRef.id}</strong> → cambia <strong>verificado</strong> a <code>true</code>
              </p>
            </div>
          </div>
        </div>
      `,
    }).catch((emailErr) => console.error('[centros] email notification failed:', emailErr));

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
