
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY is missing');
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2024-12-18.acacia' as any,
        });

        const { amount, clientId, clientEmail, returnUrl } = await req.json();

        if (!amount || amount < 5) {
            return NextResponse.json({ error: 'Minimum amount is 5€' }, { status: 400 });
        }

        if (!clientId) {
            return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'paypal', 'sofort'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Wallet Top-up',
                            description: `Top-up for client ${clientId}`,
                        },
                        unit_amount: Math.round(amount * 100), // Stripe expects cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: returnUrl || `${req.headers.get('origin')}/admin/clients/${clientId}/edit?payment=success`,
            cancel_url: returnUrl || `${req.headers.get('origin')}/admin/clients/${clientId}/edit?payment=cancelled`,
            customer_email: clientEmail,
            metadata: {
                clientId: clientId,
                type: 'wallet_topup'
            },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
