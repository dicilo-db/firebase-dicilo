
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';

const db = getFirestore(app);

export async function POST(request: NextRequest) {
    try {
        const { clientId, clientEmail, amount } = await request.json();

        if (!clientId || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create Request Record
        await addDoc(collection(db, 'transaction_requests'), {
            clientId,
            clientEmail: clientEmail || 'unknown@example.com',
            amount: Number(amount),
            status: 'pending',
            createdAt: serverTimestamp(),
        });

        // 2. Mock Email Notification (In real app, use SendGrid/Nodemailer/Firebase Extensions)
        // console.log(`[EMAIL] To: admin@dicilo.net | Subject: SOLICITUD RECARGA ${amount}€ - Client ${clientId}`);

        return NextResponse.json({ success: true, message: 'Request received' });
    } catch (error) {
        console.error('Error processing top-up request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
