'use server';

import { sendSmtpEmail } from '@/lib/mail-service';
import { getAdminDb } from '@/lib/firebase-admin';

export async function sendBusinessDirectInvite(opts: {
    friendEmail: string;
    friendName: string;
    businessName: string;
    uniqueCode: string;
    lang?: string;
}) {
    const { friendEmail, friendName, businessName, uniqueCode, lang = 'es' } = opts;

    if (!friendEmail || !businessName || !uniqueCode) {
        return { success: false, message: 'Faltan datos obligatorios para enviar la invitación.' };
    }

    const tMap: Record<string, { subject: string, greeting: string, msg: string, benefits: string, cta: string, team: string }> = {
        es: {
            subject: `${businessName} te invita a unirte a Dicilo`,
            greeting: `¡Hola ${friendName}!`,
            msg: `La empresa <strong>${businessName}</strong> cree que Dicilo puede ser una excelente herramienta para ti.`,
            benefits: `Dicilo es la plataforma líder en networking y fidelización. Únete gratis y descubre cómo optimizar tus conexiones.`,
            cta: `Utiliza el siguiente código exclusivo de invitación al registrarte para vincularte con ${businessName}:`,
            team: 'Tu Equipo Dicilo',
            button: 'Regístrate Ahora'
        },
        en: {
            subject: `${businessName} invites you to join Dicilo`,
            greeting: `Hello ${friendName}!`,
            msg: `The company <strong>${businessName}</strong> believes Dicilo could be an excellent tool for you.`,
            benefits: `Dicilo is the leading platform for networking and loyalty. Join for free and discover how to optimize your connections.`,
            cta: `Use the following exclusive invitation code when registering to connect with ${businessName}:`,
            team: 'Your Dicilo Team',
            button: 'Register Now'
        },
        de: {
            subject: `${businessName} lädt Sie ein, Dicilo beizutreten`,
            greeting: `Hallo ${friendName}!`,
            msg: `Das Unternehmen <strong>${businessName}</strong> glaubt, dass Dicilo ein hervorragendes Werkzeug für Sie sein könnte.`,
            benefits: `Dicilo ist die führende Plattform für Networking und Kundenbindung. Treten Sie kostenlos bei und entdecken Sie, wie Sie Ihre Verbindungen optimieren können.`,
            cta: `Verwenden Sie den folgenden exklusiven Einladungscode bei der Registrierung, um sich mit ${businessName} zu verbinden:`,
            team: 'Ihr Dicilo Team',
            button: 'Jetzt Registrieren'
        }
    };

    const t = tMap[lang] || tMap['en'];

    const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #333333; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="padding: 30px 20px; text-align: center; background-color: #0f172a;">
               <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Dicilo <span style="color: #3b82f6;">Network</span></h1>
            </div>
            
            <div style="padding: 30px 20px;">
                <p style="font-size: 18px; color: #0f172a; font-weight: 600;">${t.greeting}</p>
                <p style="font-size: 16px; line-height: 1.6; color: #475569;">${t.msg}</p>
                <p style="font-size: 15px; line-height: 1.6; color: #64748b; background-color: #f8fafc; padding: 15px; border-left: 4px solid #cbd5e1;">${t.benefits}</p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-top: 30px;">${t.cta}</p>
                
                <div style="margin: 20px 0; padding: 20px; text-align: center; border-radius: 8px; border: 2px solid #3b82f6; background-color: #eff6ff;">
                    <p style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #1e3a8a;">${uniqueCode}</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://dicilo.net/registrieren?inviteId=${uniqueCode}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                        ${t.button}
                    </a>
                </div>
            </div>

            <div style="padding: 20px; text-align: center; border-top: 1px solid #f1f5f9; background: #fafafa; font-size: 13px; color: #94a3b8;">
                <p style="margin: 0; font-weight: 500;">${t.team}</p>
                <p style="margin: 5px 0;">dicilo.net</p>
            </div>
        </div>
    `;

    try {
        const result = await sendSmtpEmail({
            to: friendEmail,
            subject: t.subject,
            html: htmlBody
        });

        return result;
    } catch (e: any) {
        console.error("Error sending business invite:", e);
        return { success: false, message: e.message || 'Error temporal al enviar correo.' };
    }
}

export async function fetchBusinessInviteData(clientId: string) {
    if (!clientId) return { success: false, message: 'No client ID provided' };

    try {
        const db = getAdminDb();
        
        let docRef = db.collection('clients').doc(clientId);
        let snapshot = await docRef.get();
        let collectionType = 'clients';

        if (!snapshot.exists) {
            // Might be a basic business
            docRef = db.collection('businesses').doc(clientId);
            snapshot = await docRef.get();
            collectionType = 'businesses';
            
            if (!snapshot.exists) {
                return { success: false, message: 'Client not found' };
            }
        }

        const data = snapshot.data();
        let uniqueCode = data?.uniqueCode;

        if (!uniqueCode) {
            // Generar código EMDC retroactivo para clientes antiguos
            uniqueCode = `EMDC-${clientId.substring(0, 5).toUpperCase()}${Math.floor(Math.random() * 100)}`;
            
            // Only update the found collection
            await docRef.update({ uniqueCode: uniqueCode });
        }

        return { 
            success: true, 
            clientData: { 
                id: snapshot.id, 
                uniqueCode: uniqueCode,
                clientName: data?.clientName || data?.name || data?.businessName || 'Tu Empresa' 
            } 
        };
    } catch (e: any) {
        console.error("Error fetching invite data", e);
        return { success: false, message: e.message };
    }
}
