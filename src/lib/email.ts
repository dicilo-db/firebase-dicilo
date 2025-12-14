import { Resend } from 'resend';

const resend = new Resend('re_TfJ5WjR2_7t1v7b8P2p5X8z9X6x4x5x3x'); // Placeholder key, user needs to replace or env var

export async function sendWelcomeEmail(email: string, firstName: string) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Skipping email.');
        return { success: false, error: 'Missing API Key' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Dicilo <onboarding@dicilo.com>', // Update with real domain
            to: [email],
            subject: 'Willkommen bei Dicilo!',
            html: `
        <h1>Willkommen bei Dicilo, ${firstName}!</h1>
        <p>Vielen Dank für Ihre Registrierung. Wir freuen uns, Sie in unserer Gemeinschaft begrüßen zu dürfen.</p>
        <p>Entdecken Sie jetzt exklusive Angebote und vernetzen Sie sich mit lokalen Unternehmen.</p>
        <br/>
        <p>Ihr Dicilo Team</p>
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
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Skipping email.');
        return { success: false, error: 'Missing API Key' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Dicilo <info@dicilo.com>',
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
