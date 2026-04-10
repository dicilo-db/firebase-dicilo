
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';


export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY is missing');
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2024-12-18.acacia' as any,
        });

        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!sig || !endpointSecret) {
            throw new Error('Missing signature or secret');
        }
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // Fulfill the purchase...
        const metadata = session.metadata;
        const clientId = metadata?.clientId;
        const type = metadata?.type;

        if (type === 'wallet_topup' && clientId && session.amount_total) {
            const amountEur = session.amount_total / 100;

            console.log(`Processing top-up: Client ${clientId}, Amount ${amountEur}€`);

            try {
                const adminDb = getAdminDb();
                const clientRef = adminDb.collection('clients').doc(clientId);

                await clientRef.update({
                    budget_remaining: FieldValue.increment(amountEur),
                    total_invested: FieldValue.increment(amountEur),
                    last_topup: FieldValue.serverTimestamp(),
                    last_topup_amount: amountEur
                });

                // Log transaction
                await adminDb.collection('wallet_transactions').add({
                    clientId,
                    amount: amountEur,
                    type: 'credit',
                    source: 'stripe',
                    sessionId: session.id,
                    createdAt: FieldValue.serverTimestamp(),
                    status: 'success'
                });

            } catch (dbError) {
                console.error('Database Error updating wallet:', dbError);
                return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
