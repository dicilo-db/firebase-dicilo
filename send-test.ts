import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getAdminDb } from './src/lib/firebase-admin';
import { sendSmtpEmail } from './src/lib/mail-service';

const missingFieldsDict = {
    logo: { es: '✅ Logo de tu empresa o la URL del logo', en: '✅ Company logo or logo URL', de: '✅ Firmenlogo oder Logo-URL' },
    phone: { es: '✅ Número de contacto (Teléfono)', en: '✅ Contact number (Phone)', de: '✅ Kontaktnummer (Telefon)' },
    address: { es: '✅ Dirección física (Calle y número)', en: '✅ Physical address (Street and number)', de: '✅ Physische Adresse (Straße und Hausnummer)' },
    zip: { es: '✅ Código Postal (PLZ / Zip)', en: '✅ Postal Code (Zip)', de: '✅ Postleitzahl (PLZ)' },
    city: { es: '✅ Ciudad', en: '✅ City', de: '✅ Stadt' },
    neighborhood: { es: '✅ Barrio o Sector (Stadtteil / Neighborhood)', en: '✅ Neighborhood or District', de: '✅ Stadtteil oder Viertel' },
    country: { es: '✅ País', en: '✅ Country', de: '✅ Land' },
    website: { es: '✅ Sitio Web', en: '✅ Website', de: '✅ Webseite' },
    mapUrl: { es: '✅ Ubicación real de tu negocio (URL Mapa)', en: '✅ Real business location (Map URL)', de: '✅ Tatsächlicher Unternehmensstandort (Karten-URL)' }
};

type FieldKey = keyof typeof missingFieldsDict;

function buildEmailHtml(lang: string, templateVersion: any, clientName: string, missingKeys: FieldKey[], editUrl: string, unsubscribeUrl: string) {
    if (!templateVersion) return '';
    const missingListHtml = missingKeys.map(k => `<li style="margin-bottom: 8px; color: #4b5563;">${missingFieldsDict[k][lang as 'es'|'en'|'de']}</li>`).join('');
    
    let body = templateVersion.body || '';
    body = body.replace(/{{clientName}}/g, clientName);
    body = body.replace(/{{missingListHtml}}/g, missingListHtml);
    body = body.replace(/{{editUrl}}/g, editUrl);
    body = body.replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);
    
    return `<div id="${lang}">${body}</div>`;
}

async function runTest() {
    try {
        const db = getAdminDb();
        const templateDoc = await db.collection('email_templates').doc('profile_reminder').get();
        const templateData = templateDoc.data() as any;
        const versions = templateData.versions || {};

        const email = 'central@mhc-int.com';
        const clientName = 'Central Dicilo (TEST)';
        const missingKeys: FieldKey[] = ['logo', 'address', 'phone'];
        
        const subject = versions['es']?.subject || '¡Tu perfil en Dicilo está casi listo! 🚀';
        const emailBody = buildEmailHtml('es', versions['es'], clientName, missingKeys, 'https://dicilo.net/login?lng=es', 'https://dicilo.net/api/unsubscribe?email=test&lang=es');

        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Inter', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px; }
                .container { background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); scroll-behavior: smooth; }
                .header { background-color: #1e293b; padding: 30px 20px; display: flex; align-items: center; justify-content: center; gap: 15px; }
                .header img { height: 40px; display: block; }
                .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
                .content { padding: 20px 30px; color: #334155; line-height: 1.6; }
                .footer { text-align: center; padding: 30px; background-color: #f8fafc; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://dicilo.net/logo.png" alt="Dicilo Logo">
                    <h1>Dicilo.net</h1>
                </div>
                <div class="content">
                    ${emailBody}
                </div>
                <div class="footer">
                    &copy; 2026 Dicilo Network. Todos los derechos reservados.
                </div>
            </div>
        </body>
        </html>
        `;

        await sendSmtpEmail({
            to: email,
            subject: subject,
            html: emailHtml
        });
        console.log("TEST EMAIL SENT TO", email);
    } catch (e) {
        console.error("ERROR", e);
    }
}

runTest();
