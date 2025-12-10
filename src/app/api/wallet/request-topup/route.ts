import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        const { clientId, clientEmail, amount } = await request.json();

        if (!clientId || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create Request Record using Admin SDK (bypasses rules)
        await adminDb.collection('transaction_requests').add({
            clientId,
            clientEmail: clientEmail || 'unknown@example.com',
            amount: Number(amount),
            status: 'pending',
            createdAt: FieldValue.serverTimestamp(),
        });

        // 2. Log for debug (Email should be handled by a Cloud Function trigger on 'transaction_requests')
        console.log(`[WALLET] Top-up request created: Client ${clientId}, Amount ${amount}€`);

        return NextResponse.json({ success: true, message: 'Request received' });
    } catch (error: any) {
        console.error('Error processing top-up request:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
