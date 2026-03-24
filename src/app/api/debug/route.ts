import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        const db = getAdminDb();
        const c1 = await db.collection('private_profiles').doc('60WAhwKRPZfaAUshsze7FU0sQ813').get();
        if (c1.exists) return NextResponse.json({ collection: 'private_profiles', data: c1.data() });

        const c2 = await db.collection('public_users').doc('60WAhwKRPZfaAUshsze7FU0sQ813').get();
        if (c2.exists) return NextResponse.json({ collection: 'public_users', data: c2.data() });

        const c3 = await db.collection('superadmins').doc('60WAhwKRPZfaAUshsze7FU0sQ813').get();
        if (c3.exists) return NextResponse.json({ collection: 'superadmins', data: c3.data() });

        const c4 = await db.collection('admins').doc('60WAhwKRPZfaAUshsze7FU0sQ813').get();
        if (c4.exists) return NextResponse.json({ collection: 'admins', data: c4.data() });

        const c5 = await db.collection('users').doc('60WAhwKRPZfaAUshsze7FU0sQ813').get();
        if (c5.exists) return NextResponse.json({ collection: 'users', data: c5.data() });

        return NextResponse.json({ not_found: true });
    } catch (e: any) {
        return NextResponse.json({ crash: e.message, stack: e.stack });
    }
}
