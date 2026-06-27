import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const revalidate = 0;

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection('vzla_seismic_log')
      .orderBy('time', 'desc')
      .limit(20)
      .get();

    const events = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id:        doc.id,
        magnitude: d.magnitude ?? null,
        place:     d.place ?? '',
        time:      d.time?.toDate?.()?.toISOString() ?? null,
        url:       d.url ?? '',
        depth:     d.depth ?? null,
      };
    });

    return NextResponse.json({ events }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ events: [], error: err.message }, { status: 500 });
  }
}
