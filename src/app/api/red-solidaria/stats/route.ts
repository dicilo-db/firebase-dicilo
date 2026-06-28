import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const revalidate = 0;

export async function GET() {
  try {
    const db = getAdminDb();

    const [ofertasSnap, centrosSnap, entregadasSnap] = await Promise.all([
      db.collection('red_solidaria_ofertas').where('estado', '==', 'disponible').count().get(),
      db.collection('red_solidaria_centros').count().get(),
      db.collection('red_solidaria_ofertas').where('estado', '==', 'entregado').count().get(),
    ]);

    const entregadas = entregadasSnap.data().count;

    return NextResponse.json(
      {
        ofertasActivas:       ofertasSnap.data().count,
        centrosRegistrados:   centrosSnap.data().count,
        entregasCompletadas:  entregadas,
        personasAlcanzadas:   entregadas * 4, // conservative estimate: 4 people per delivery
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ofertasActivas: 0, centrosRegistrados: 0, entregasCompletadas: 0, personasAlcanzadas: 0, error: err.message },
      { status: 200 } // return 200 with zeros so UI doesn't break
    );
  }
}
