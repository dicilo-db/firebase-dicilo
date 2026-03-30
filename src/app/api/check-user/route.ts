import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    try {
        const auth = getAdminAuth();
        const db = getAdminDb();
        const user = await auth.getUserByEmail(email);
        
        const response: any = {
            uid: user.uid,
            emailVerified: user.emailVerified,
            customClaims: user.customClaims,
            collections: {}
        };

        const clientsQuery = await db.collection('clients').where('ownerUid', '==', user.uid).get();
        response.collections.clients = clientsQuery.docs.map(doc => ({ id: doc.id, data: doc.data() }));

        const profileDoc = await db.collection('private_profiles').doc(user.uid).get();
        if (profileDoc.exists) response.collections.private_profiles = profileDoc.data();

        const regQuery = await db.collection('registrations').where('ownerUid', '==', user.uid).get();
        response.collections.registrations = regQuery.docs.map(doc => ({ id: doc.id, data: doc.data() }));

        const adminQuery = await db.collection('super_admins').where('email', '==', email).get();
        response.collections.super_admins = adminQuery.docs.map(doc => ({ id: doc.id, data: doc.data() }));

        return NextResponse.json(response);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
