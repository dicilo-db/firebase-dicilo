import { Resend } from 'resend';
import { getAdminDb } from './firebase-admin';
const getResend = () => {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
        console.warn('RESEND_API_KEY is not set.');
        return null;
    }
    return new Resend(key);
};

export async function sendWelcomeEmail(email: string, firstName: string, lang: string = 'es', code: string = '') {
    const resend = getResend();
    if (!resend) return { success: false, error: 'Missing API Key' };

    try {
        const db = getAdminDb();
        const blacklistDoc = await db.collection('email_blacklist').doc(email).get();
        if (blacklistDoc.exists) {
            console.log(`Email ${email} is in blacklist. Aborting send.`);
            return { success: false, error: 'Email unsubscribed.' };
        }

        const tMap: Record<string, { subject: string, title: string, greeting: string, msg: string, codeMsg: string, team: string, thanks: string, legalMsg1: string, legalMsg2: string, unsub: string }> = {
            es: {
                subject: '¡Bienvenido a Dicilo!',
                title: 'Verificación de Cuenta',
                greeting: `¡Bienvenido a Dicilo, ${firstName}!`,
                msg: 'Gracias por su registro. Nos complace darle la bienvenida a nuestra comunidad. Descubra ahora ofertas exclusivas y conéctese con empresas locales.',
                codeMsg: 'Para verificar y proteger su cuenta, ingrese el siguiente código en la plataforma:',
                team: 'Dicilo International Team',
                thanks: 'Gracias por su registro.',
                legalMsg1: 'Declaración de Confidencialidad / Aviso Legal',
                legalMsg2: 'Este correo electrónico contiene información que puede estar protegida legalmente o ser confidencial. Está destinado exclusivamente al destinatario indicado. Si no es el destinatario correcto o ha recibido este correo por error, informe inmediatamente al remitente y destruya este correo electrónico. No está permitida la copia no autorizada, revelación o distribución no autorizada de este material.',
                unsub: 'Si no deseas recibir más correos nuestros, haga clic aquí: '
            },
            en: {
                subject: 'Welcome to Dicilo!',
                title: 'Account Verification',
                greeting: `Welcome to Dicilo, ${firstName}!`,
                msg: 'Thank you for your registration. We are excited to welcome you to our community. Discover exclusive offers now and connect with local businesses.',
                codeMsg: 'To verify and secure your account, please enter the following code on the platform:',
                team: 'Dicilo International Team',
                thanks: 'Thank you for registering.',
                legalMsg1: 'Vertraulichkeitserklärung / Legal Notice',
                legalMsg2: 'This e-mail contains information that may be privileged or confidential. It is intended only for the person to whom it is addressed. If you are not the intended recipient or have received this e-mail in error please notify the sender immediately and destroy this e-mail. Any unauthorized copying, disclosure or distribution of the material in this e-mail is strictly forbidden.',
                unsub: 'If you no longer wish to receive emails from us, click here: '
            },
            de: {
                subject: 'Willkommen bei Dicilo!',
                title: 'Kontoverifizierung',
                greeting: `Willkommen bei Dicilo, ${firstName}!`,
                msg: 'Vielen Dank für Ihre Registrierung. Wir freuen uns, Sie in unserer Gemeinschaft begrüßen zu dürfen. Entdecken Sie jetzt exklusive Angebote und vernetzen Sie sich mit lokalen Unternehmen.',
                codeMsg: 'Um Ihr Konto zu verifizieren und zu schützen, geben Sie bitte den folgenden Code auf der Plattform ein:',
                team: 'Dicilo International Team',
                thanks: 'Vielen Dank für Ihre Registrierung.',
                legalMsg1: 'Vertraulichkeitserklärung / Legal Notice',
                legalMsg2: 'Diese E-Mail enthält Informationen, die rechtlich geschützt oder vertraulich sein können. Sie ist ausschließlich für den angegebenen Empfänger bestimmt. Sollten Sie nicht der richtige Adressat sein oder diese E-Mail irrtümlich erhalten haben, informieren Sie bitte unverzüglich den Absender und vernichten Sie diese E-Mail. Das unerlaubte Kopieren oder Offenlegen sowie die unbefugte Weitergabe dieser E-Mail ist nicht gestattet.',
                unsub: 'Wenn Sie keine weiteren E-Mails von uns erhalten möchten, klicken Sie hier: '
            },
            fr: {} as any, it: {} as any, pt: {} as any, nl: {} as any, tr: {} as any, 
            ru: {} as any, zh: {} as any, ja: {} as any, ar: {} as any
        };

        const t = tMap[lang]?.subject ? tMap[lang] : tMap['en'];
        const unsubscribeLink = `https://dicilo.net/api/unsubscribe?email=${encodeURIComponent(email)}&lang=${lang}`;

        const { data, error } = await resend.emails.send({
            from: 'Dicilo <onboarding@dicilo.net>',
            to: [email],
            subject: t.subject,
            html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #333333;">
            <div style="padding: 30px 20px; text-align: center; border-bottom: 2px solid #f1f5f9;">
               <h1 style="color: #0f172a; margin: 0; font-size: 24px;">${t.greeting}</h1>
            </div>
            
            <div style="padding: 30px 20px;">
                <p style="font-size: 16px; line-height: 1.6; color: #475569;">${t.msg}</p>
                
                ${code ? `
                <div style="margin: 30px 0; padding: 20px; text-align: center; border-radius: 8px; border: 2px solid #cbd5e1; background-color: #f8fafc;">
                    <p style="margin: 0 0 10px 0; color: #475569; font-size: 16px;">${t.codeMsg}</p>
                    <p style="margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #000000;"><strong>${code}</strong></p>
                </div>` : ''}
            </div>

            <div style="padding: 20px; text-align: left; border-top: 1px solid #f1f5f9; background: #fafafa;">
                <p style="margin: 0; font-weight: 500;">${t.thanks}</p>
                <p style="margin: 5px 0 20px 0; font-weight: 600; color: #0f172a;">${t.team}</p>

                <div style="font-size: 12px; color: #64748b; line-height: 1.5;">
                    <p style="margin: 0;">Dicilo.net es una marca del grupo:</p>
                    <p style="margin: 5px 0; font-weight: bold;">MILENIUM HOLDING & CONSULTING<br/>DICILO | Travelposting UG |</p>
                    <p style="margin: 5px 0;">International Innovations & Company<br/>(Werbe & Promotions-/Reiseagentur)</p>
                    <p style="margin: 15px 0;">Mühlendamm 84a<br/>22089 Hamburg - DE</p>
                    <p style="margin: 5px 0;">Handelsregister:<br/>Registergericht: Amtsgericht Hamburg<br/>Registernummer: HRB 171236.</p>
                    <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 15px 0;" />
                    <p style="margin: 5px 0;">Email: support@dicilo.net<br/>Web: https://dicilo.net</p>
                    <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 15px 0;" />
                    <p style="margin: 5px 0;">${t.unsub} <a href="${unsubscribeLink}" style="color: #3b82f6; text-decoration: underline;">${lang === 'es' ? 'Baja' : 'Unsubscribe'}</a></p>
                </div>
                
                <div style="margin-top: 20px; font-size: 11px; color: #94a3b8; text-align: justify; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                    <strong>${t.legalMsg1}</strong><br/>
                    ${t.legalMsg2}
                </div>
            </div>
        </div>
      `,
        });

        if (error) {
            console.error('Resend Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email Sending Error:', error);
        return { success: false, error };
    }
}

export async function sendCouponShareEmail(email: string, coupon: any) {
    const resend = getResend();
    if (!resend) return { success: false, error: 'Missing API Key' };

    try {
        const { data, error } = await resend.emails.send({
            from: 'Dicilo <info@dicilo.net>',
            to: [email],
            subject: `Holen Sie sich diesen Coupon: ${coupon.title}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #0F172A; padding: 20px; text-align: center;">
                         <h2 style="color: white; margin: 0;">Ihr Coupon von ${coupon.companyName}</h2>
                    </div>
                    
                    <div style="padding: 24px; background-color: white;">
                        <h3 style="margin-top: 0; color: #334155;">${coupon.title}</h3>
                        <p style="color: #64748B; line-height: 1.6;">${coupon.description}</p>
                        
                        <div style="margin: 24px 0; padding: 16px; background-color: #F1F5F9; border-radius: 8px; text-align: center; border: 2px dashed #94A3B8;">
                            <span style="display: block; font-size: 14px; text-transform: uppercase; color: #64748B; margin-bottom: 8px;">Ihr Code</span>
                            <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #0F172A; letter-spacing: 2px;">${coupon.code}</span>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; font-size: 14px; color: #64748B;">
                             <span>Gültig von: ${new Date(coupon.startDate).toLocaleDateString('de-DE')}</span>
                             <span>Bis: ${new Date(coupon.endDate).toLocaleDateString('de-DE')}</span>
                        </div>
                    </div>
                    
                    <div style="background-color: #F8FAFC; padding: 16px; text-align: center; font-size: 12px; color: #94A3B8;">
                        <p>Zeigen Sie diesen Code vor Ort vor, um Ihren Rabatt zu erhalten.</p>
                        <p>&copy; ${new Date().getFullYear()} Dicilo Netzwerk</p>
                    </div>
                </div>
            `,
        });

        if (error) {
            console.error('Resend Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email Sending Error:', error);
        return { success: false, error };
    }
}

export async function sendTicketCreatedEmail(email: string, ticketId: string, title: string, description: string) {
    const resend = getResend();
    if (!resend) return { success: false, error: 'Missing API Key' };

    try {
        const { data, error } = await resend.emails.send({
            from: 'Dicilo Support <support@dicilo.net>',
            to: [email],
            subject: `Ticket Received: ${title} (#${ticketId.slice(0, 8)})`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>We received your request</h2>
                    <p>Thank you for contacting Dicilo Support. We have received your ticket and will get back to you shortly.</p>
                    
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <strong>Subject:</strong> ${title}<br/>
                        <strong>Ticket ID:</strong> ${ticketId}<br/>
                        <hr style="border: 0; border-top: 1px solid #ddd; margin: 10px 0;"/>
                        <p style="white-space: pre-wrap;">${description}</p>
                    </div>

                    <p>You can view the status of your ticket in your dashboard.</p>
                    <p>Best regards,<br/>Dicilo Team</p>
                </div>
            `,
        });

        if (error) {
            console.error('Resend Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email Sending Error:', error);
        return { success: false, error };
    }
}

export async function sendTicketReplyEmail(email: string, ticketId: string, title: string, replyMessage: string, senderName: string) {
    const resend = getResend();
    if (!resend) return { success: false, error: 'Missing API Key' };

    try {
        const { data, error } = await resend.emails.send({
            from: 'Dicilo Support <support@dicilo.net>',
            to: [email],
            subject: `Re: ${title} (#${ticketId.slice(0, 8)})`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>New Reply on your Ticket</h2>
                    <p><strong>${senderName}</strong> has replied to your ticket.</p>
                    
                    <div style="background: #f0f9ff; padding: 15px; border-left: 4px solid #0070f3; margin: 20px 0;">
                        <p style="white-space: pre-wrap; margin: 0;">${replyMessage}</p>
                    </div>

                    <p>You can reply directly in your dashboard.</p>
                    <p>Best regards,<br/>Dicilo Team</p>
                </div>
            `,
        });

        if (error) {
            console.error('Resend Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email Sending Error:', error);
        return { success: false, error };
    }
}

export async function sendRecommendationNotification(email: string, clientName: string, reviewerName: string, rating: number, comment: string) {
    const resend = getResend();
    if (!resend) return { success: false, error: 'Missing API Key' };

    try {
        const { data, error } = await resend.emails.send({
            from: 'Dicilo <info@dicilo.net>',
            to: [email],
            subject: `Neue Bewertung für ${clientName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Neue Bewertung erhalten</h2>
                    <p>Hallo ${clientName},</p>
                    <p>Du hast eine neue Bewertung von <strong>${reviewerName}</strong> erhalten.</p>
                    
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                        <div style="font-size: 24px; color: #fbbf24; margin-bottom: 10px;">
                            ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}
                        </div>
                        <p style="font-style: italic; color: #475569; margin: 0;">"${comment}"</p>
                    </div>

                    <p>Du kannst die Bewertung in deinem Dashboard einsehen.</p>
                    
                    <p>Beste Grüße,<br/>Dein Dicilo Team</p>
                </div>
            `,
        });

        if (error) {
            console.error('Resend Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email Sending Error:', error);
        return { success: false, error };
    }
}

/**
 * Sends a prefabricated, multi-language email to a business when recommended by a freelancer.
 */
export async function sendBusinessRecommendationEmail(
    email: string,
    businessName: string,
    referrerName: string,
    lang: 'es' | 'en' | 'de' = 'es'
) {
    const resend = getResend();
    if (!resend) return { success: false, error: 'Missing API Key' };

    const content = {
        es: {
            subject: `¡Su empresa ha sido recomendada en Dicilo!`,
            body: `Hola ${businessName},<br/><br/>Le escribimos para informarle que su empresa ha sido recomendada en el portal <strong>dicilo.net</strong> por <strong>${referrerName}</strong>.<br/><br/>Dicilo es la plataforma líder para recomendaciones auténticas de negocios locales. Le invitamos a visitar nuestro portal y descubrir cómo podemos ayudarle a crecer.`
        },
        en: {
            subject: `Your business has been recommended on Dicilo!`,
            body: `Hello ${businessName},<br/><br/>We are writing to inform you that your business has been recommended on the <strong>dicilo.net</strong> portal by <strong>${referrerName}</strong>.<br/><br/>Dicilo is the leading platform for authentic local business recommendations. We invite you to visit our portal and discover how we can help you grow.`
        },
        de: {
            subject: `Ihr Unternehmen wurde auf Dicilo empfohlen!`,
            body: `Hallo ${businessName},<br/><br/>wir freuen uns, Ihnen mitteilen zu können, dass Ihr Unternehmen von <strong>${referrerName}</strong> auf dem Portal <strong>dicilo.net</strong> empfohlen wurde.<br/><br/>Dicilo ist die führende Plattform für authentische Empfehlungen lokaler Unternehmen. Wir laden Sie ein, unser Portal zu besuchen und zu entdecken, wie wir Sie beim Wachsen unterstützen können.`
        }
    };

    const t = content[lang] || content.es;

    try {
        const { data, error } = await resend.emails.send({
            from: 'Dicilo <info@dicilo.net>',
            to: [email],
            subject: t.subject,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #0f172a; margin: 0;">Dicilo.net</h1>
                    </div>
                    <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">${t.subject}</h2>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">${t.body}</p>
                    <div style="margin-top: 30px; text-align: center;">
                        <a href="https://dicilo.net" style="background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">${lang === 'es' ? 'Visitar Dicilo.net' : lang === 'de' ? 'Dicilo.net besuchen' : 'Visit Dicilo.net'}</a>
                    </div>
                    <p style="margin-top: 30px; color: #94a3b8; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Dicilo Netzwerk</p>
                </div>
            `,
        });

        if (error) {
            console.error('Resend Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email Sending Error:', error);
        return { success: false, error };
    }
}
