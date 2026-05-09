import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendSmtpEmail } from '@/lib/mail-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const lang = searchParams.get('lang') || 'es';
  
  if (!email) {
    return NextResponse.json({ message: 'No email provided.' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    await db.collection('email_blacklist').doc(email).set({
      email,
      unsubscribedAt: new Date(),
      source: 'Email Footer - Unsubscribe Link'
    });
    
    // Notify admin
    try {
      await sendSmtpEmail({
        to: 'central@mhc-int.com',
        subject: `🚫 Alerta de Baja: ${email} se ha dado de baja`,
        html: `
          <p>Hola Administrador,</p>
          <p>El usuario con el correo <strong>${email}</strong> se ha dado de baja (Unsubscribed) de las notificaciones comerciales a través del enlace de correo de recordatorio de perfil.</p>
          <p>Su correo ha sido agregado a la lista negra (<code>email_blacklist</code>).</p>
        `
      });
    } catch (mailErr) {
      console.error('Failed to notify admin of unsubscribe:', mailErr);
    }
    
    const messages: any = {
      es: { title: 'Baja Exitosa', text: `El correo <strong>${email}</strong> ha sido añadido exitosamente a nuestra lista negra. Ya no recibirás más comunicaciones comerciales nuestras.` },
      en: { title: 'Unsubscribe Successful', text: `The email <strong>${email}</strong> has been successfully added to our blacklist. You will no longer receive commercial communications from us.` },
      de: { title: 'Abmeldung erfolgreich', text: `Die E-Mail <strong>${email}</strong> wurde erfolgreich zu unserer Sperrliste hinzugefügt. Sie erhalten keine kommerziellen Mitteilungen mehr von uns.` }
    };

    const t = messages[lang] || messages.es;

    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t.title}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
             body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; height: 100vh; }
             .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 500px; text-align: center; margin: 20px; }
             h2 { color: #0f172a; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; }
             p { color: #475569; line-height: 1.6; font-size: 16px; }
             .success-icon { width: 64px; height: 64px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <h2>${t.title}</h2>
            <p>${t.text}</p>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (err) {
    return NextResponse.json({ message: 'Error processing unsubscribe.' }, { status: 500 });
  }
}
