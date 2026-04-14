import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Resend } from 'resend';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { senderName, senderEmail, comment, clientName, referrals } = body;

        if (!senderName || !clientName || !referrals || !Array.isArray(referrals) || referrals.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const resend = new Resend(process.env.RESEND_API_KEY!);

        const emailPromises = referrals.map(async (ref: { name: string; contact: string }) => {
            // Unicamente enviamos si nos dieron un email valido (contiene @)
            if (!ref.contact || !ref.contact.includes('@')) return;

            return resend.emails.send({
                from: 'Dicilo Empfehlung <info@dicilo.net>',
                to: [ref.contact],
                subject: `${senderName} hat dir ${clientName} empfohlen!`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #0F172A; padding: 20px; text-align: center;">
                             <h2 style="color: white; margin: 0;">Eine Empfehlung für dich!</h2>
                        </div>
                        
                        <div style="padding: 24px; background-color: white;">
                            <h3 style="margin-top: 0; color: #334155;">Hallo ${ref.name || 'Freund'},</h3>
                            <p style="color: #64748B; line-height: 1.6;">
                                Dein Freund <strong>${senderName}</strong> (${senderEmail}) hat unsere Plattform besucht und möchte dir gerne <strong>${clientName}</strong> empfehlen.
                            </p>
                            
                            ${comment ? `
                            <div style="margin: 24px 0; padding: 16px; background-color: #F1F5F9; border-radius: 8px; border-left: 4px solid #3B82F6;">
                                <span style="display: block; font-size: 14px; text-transform: uppercase; color: #64748B; margin-bottom: 8px;">Nachricht von ${senderName}:</span>
                                <p style="margin: 0; font-size: 16px; color: #0F172A; font-style: italic;">"${comment}"</p>
                            </div>
                            ` : ''}
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="https://dicilo.net" style="background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Mehr auf Dicilo entdecken</a>
                            </div>
                        </div>
                        
                        <div style="background-color: #F8FAFC; padding: 16px; text-align: center; font-size: 12px; color: #94A3B8;">
                            <p>Diese E-Mail wurde dir von ${senderName} über Dicilo.net gesendet.</p>
                            <p>&copy; ${new Date().getFullYear()} Dicilo Netzwerk</p>
                        </div>
                    </div>
                `,
            });
        });

        await Promise.all(emailPromises);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error sending referral APIs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
