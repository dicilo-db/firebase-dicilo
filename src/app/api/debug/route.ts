import { NextResponse } from 'next/server';
import { sendProspectInvitation } from '@/app/actions/prospect-actions';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        const db = getAdminDb();
        const doc = await db.collection('recommendations').limit(1).get();
        if (doc.empty) return NextResponse.json({ error: "No recommendation found" });
        const res = await sendProspectInvitation(doc.docs[0].id, 'MYXkACjt1zFkIhsz7qmY');
        return NextResponse.json({ result: res });
    } catch (e: any) {
        return NextResponse.json({ crash: e.message, stack: e.stack });
    }
}
