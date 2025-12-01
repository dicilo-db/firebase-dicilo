import { NextResponse } from 'next/server';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const queryText = (searchParams.get('q') || 'Medien').toLowerCase();

        const db = getFirestore(app);

        // 1. Search in Clients
        const clientsSnap = await getDocs(collection(db, 'clients'));
        const clientsFound = clientsSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data(), _source: 'clients' }))
            .filter((d: any) =>
                (d.clientName || d.name || '').toLowerCase().includes(queryText) ||
                (d.email || '').toLowerCase().includes(queryText)
            );

        // 2. Search in Businesses
        const businessesSnap = await getDocs(collection(db, 'businesses'));
        const businessesFound = businessesSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data(), _source: 'businesses' }))
            .filter((d: any) =>
                (d.name || '').toLowerCase().includes(queryText)
            );

        return NextResponse.json({
            query: queryText,
            foundInClients: clientsFound,
            foundInBusinesses: businessesFound,
            // foundInRegistrations: registrationsFound // Disabled due to permissions
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
