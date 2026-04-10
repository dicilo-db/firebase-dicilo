import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        const db = getAdminDb();
        // Fetch 10 most recent profiles to have a good pool for random selection on the frontend
        const snapshot = await db.collection('private_profiles')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

        const recentUsers = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.firstName || 'Usuario', // Do not expose last name for privacy
                country: data.country || 'Desconocido',
            };
        });

        // Add fallback simulated users in case the DB is completely empty
        if (recentUsers.length === 0) {
            recentUsers.push(
                { id: '1', name: 'Carlos', country: 'España' },
                { id: '2', name: 'Laura', country: 'México' },
                { id: '3', name: 'Markus', country: 'Alemania' }
            );
        }

        return NextResponse.json({ success: true, users: recentUsers });
    } catch (error) {
        console.error('Failed to fetch latest activity:', error);
        return NextResponse.json({ success: false, users: [] }, { status: 500 });
    }
}
