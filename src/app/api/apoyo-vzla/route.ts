import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const revalidate = 0;

export async function GET() {
  try {
    const db = getAdminDb();

    // Fetch latest field reports from partner organizations
    const reportsSnap = await db
      .collection('vzla_field_reports')
      .where('status', '==', 'approved')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const fieldReports = reportsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        org: d.org ?? '',
        orgType: d.orgType ?? '',
        zone: d.zone ?? '',
        message: d.message ?? '',
        peopleHelped: d.peopleHelped ?? null,
        category: d.category ?? 'general',
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
        contact: d.contact ?? null,
      };
    });

    return NextResponse.json(
      {
        campaign: {
          title: 'Ayuda Venezuela · Terremoto 24 junio 2026',
          status: 'active',
          startDate: '2026-06-24',
          url: 'https://dicilo.net/la-comunidad/apoyo-vzla',
          description:
            'Campaña de ayuda humanitaria directa tras el doble terremoto M7.2 + M7.5 del 24 de junio de 2026 en Venezuela. Organizado por la comunidad Dicilo / MILENIUM HOLDING & CONSULTING UG.',
          donate: {
            revolut: 'https://revolut.me/mileniummv',
            bank: {
              beneficiary: 'MILENIUM HOLDING & CONSULTING UG',
              iban: 'DE57200400600528459800',
              bic: 'COBADEFFXXX',
              bank: 'Commerzbank',
              reference: 'Ayuda Humanitaria Venezuela',
            },
            usdt_trc20: 'TNDSBiuZPXgfDKJLMnWxYrugMrMmBFqxh6',
          },
        },
        fieldReports,
        api: {
          version: '1.0',
          docs: 'https://dicilo.net/api/apoyo-vzla',
          submitReport: 'https://dicilo.net/api/apoyo-vzla/report',
          contact: 'info@dicilo.net',
        },
        lastUpdated: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
