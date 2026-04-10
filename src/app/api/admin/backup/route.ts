
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        const db = getAdminDb();

        // Fetch Ads
        const adsSnapshot = await db.collection('ads_banners').get();
        const ads = adsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch Clients
        const clientsSnapshot = await db.collection('clients').get();
        const clients = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch Private Users (optional but good for completion)
        const privateSnapshot = await db.collection('private_profiles').get();
        const privateUsers = privateSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const backupData = {
            timestamp: new Date().toISOString(),
            collections: {
                ads_banners: ads,
                clients: clients,
                private_profiles: privateUsers
            }
        };

        return new NextResponse(JSON.stringify(backupData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="dicilo_backup_${new Date().toISOString().split('T')[0]}.json"`
            }
        });

    } catch (error) {
        console.error('Backup failed:', error);
        return NextResponse.json({ error: 'Backup failed' }, { status: 500 });
    }
}
