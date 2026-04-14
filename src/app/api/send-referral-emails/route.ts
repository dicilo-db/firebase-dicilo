import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendSmtpEmail } from '@/lib/mail-service';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { senderName, senderEmail, comment, clientName, referrals, lang = 'de' } = body;

        if (!senderName || !clientName || !referrals || !Array.isArray(referrals) || referrals.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const emailPromises = referrals.map(async (ref: { name: string; contact: string }) => {
            // Unicamente enviamos si nos dieron un email valido (contiene @)
            if (!ref.contact || !ref.contact.includes('@')) return { success: false, reason: 'Invalid Email' };

            const content: any = {
                de: {
                    subject: `${senderName} hat dir ${clientName} empfohlen!`,
                    title: "Eine Empfehlung für dich!",
                    greeting: `Hallo ${ref.name || 'Freund'},`,
                    body1: `Dein Freund <strong>${senderName}</strong> (${senderEmail}) hat unsere Plattform besucht und möchte dir gerne <strong>${clientName}</strong> empfehlen.`,
                    msgFrom: `Nachricht von ${senderName}:`,
                    btn: "Mehr auf Dicilo entdecken",
                    footer1: `Diese E-Mail wurde dir von ${senderName} über Dicilo.net gesendet.`,
                    footer2: `© ${new Date().getFullYear()} Dicilo Netzwerk`
                },
                en: {
                    subject: `${senderName} recommended ${clientName} to you!`,
                    title: "A recommendation for you!",
                    greeting: `Hello ${ref.name || 'Friend'},`,
                    body1: `Your friend <strong>${senderName}</strong> (${senderEmail}) visited our platform and would like to recommend <strong>${clientName}</strong> to you.`,
                    msgFrom: `Message from ${senderName}:`,
                    btn: "Discover more on Dicilo",
                    footer1: `This email was sent to you by ${senderName} via Dicilo.net.`,
                    footer2: `© ${new Date().getFullYear()} Dicilo Network`
                },
                es: {
                    subject: `¡${senderName} te ha recomendado ${clientName}!`,
                    title: "¡Una recomendación para ti!",
                    greeting: `Hola ${ref.name || 'Amigo'},`,
                    body1: `Tu amigo <strong>${senderName}</strong> (${senderEmail}) visitó nuestra plataforma y le gustaría recomendarte <strong>${clientName}</strong>.`,
                    msgFrom: `Mensaje de ${senderName}:`,
                    btn: "Descubrir más en Dicilo",
                    footer1: `Este correo te fue enviado por ${senderName} a través de Dicilo.net.`,
                    footer2: `© ${new Date().getFullYear()} Red Dicilo`
                }
            };

            const t = content[lang] || content.de;

            return sendSmtpEmail({
                from: 'Dicilo Empfehlung <info@dicilo.net>',
                to: ref.contact,
                subject: t.subject,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #0F172A; padding: 20px; text-align: center;">
                             <h2 style="color: white; margin: 0;">${t.title}</h2>
                        </div>
                        
                        <div style="padding: 24px; background-color: white;">
                            <h3 style="margin-top: 0; color: #334155;">${t.greeting}</h3>
                            <p style="color: #64748B; line-height: 1.6;">
                                ${t.body1}
                            </p>
                            
                            ${comment ? `
                            <div style="margin: 24px 0; padding: 16px; background-color: #F1F5F9; border-radius: 8px; border-left: 4px solid #3B82F6;">
                                <span style="display: block; font-size: 14px; text-transform: uppercase; color: #64748B; margin-bottom: 8px;">${t.msgFrom}</span>
                                <p style="margin: 0; font-size: 16px; color: #0F172A; font-style: italic;">"${comment}"</p>
                            </div>
                            ` : ''}
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="https://dicilo.net" style="background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">${t.btn}</a>
                            </div>
                        </div>
                        
                        <div style="background-color: #F8FAFC; padding: 16px; text-align: center; font-size: 12px; color: #94A3B8;">
                            <p>${t.footer1}</p>
                            <p>${t.footer2}</p>
                        </div>
                    </div>
                `,
            });
        });

        const results = await Promise.all(emailPromises);
        
        // Log potential errors
        for (const res of results) {
            if (res && res.success === false) {
                console.error('SMTP Mail Failed:', res.error);
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error('Error sending referral APIs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
