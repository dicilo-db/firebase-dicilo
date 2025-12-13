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
