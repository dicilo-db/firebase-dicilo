import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Basic validation
        if (!body.client_name || !body.client_phone || !body.date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = getAdminDb();
        
        // Store in Firestore using Server SDK which bypasses security rules!
        const docRef = await db.collection('crm_appointments').add({
            title: `Asesoría B2B: ${body.client_name}`,
            date: body.date,
            duration: 30, // minutes
            status: 'pending',
            client_name: body.client_name,
            client_phone: body.client_phone,
            client_reason: body.client_reason,
            source: 'native_web_booking',
            created_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error: any) {
        console.error('Error creating booking:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
