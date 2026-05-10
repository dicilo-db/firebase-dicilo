import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { sendMail } from './email';

/**
 * Determina el idioma basándose en el nombre del país (español, inglés o alemán).
 * Si no coincide con ninguno, retorna 'all' para enviar el correo multilingüe.
 */
function getLanguageFromCountry(country: string): 'es' | 'en' | 'de' | 'all' {
    if (!country) return 'all';
    const c = country.toLowerCase().trim();
    
    // Español
    const esCountries = ['españa', 'spain', 'colombia', 'mexico', 'méxico', 'argentina', 'chile', 'peru', 'perú', 'venezuela', 'ecuador', 'guatemala', 'bolivia', 'republica dominicana', 'república dominicana', 'dominican republic', 'honduras', 'paraguay', 'el salvador', 'nicaragua', 'costa rica', 'puerto rico', 'panama', 'panamá', 'uruguay'];
    if (esCountries.includes(c)) return 'es';
    
    // Alemán
    const deCountries = ['alemania', 'germany', 'deutschland', 'austria', 'österreich', 'suiza', 'switzerland', 'schweiz', 'liechtenstein'];
    if (deCountries.includes(c)) return 'de';
    
    // Inglés
    const enCountries = ['usa', 'united states', 'estados unidos', 'uk', 'united kingdom', 'reino unido', 'australia', 'canada', 'canadá', 'new zealand', 'nueva zelanda', 'ireland', 'irlanda'];
    if (enCountries.includes(c)) return 'en';
    
    return 'all';
}

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

export const checkIncompleteProfiles = onSchedule('every day 10:00', async (event) => {
    const db = getFirestore();
    const now = Date.now();
    const threeDaysInMillis = 3 * 24 * 60 * 60 * 1000;

    try {
        // Cargar la plantilla desde Firestore
        const templateDoc = await db.collection('email_templates').doc('profile_reminder').get();
        if (!templateDoc.exists) {
            logger.error('No se encontró la plantilla profile_reminder en email_templates');
            return;
        }
        const templateData = templateDoc.data() as any;
        const versions = templateData.versions || {};

        const businessesSnapshot = await db.collection('businesses')
            .where('clientType', 'in', ['basic', 'starter', 'premium'])
            .get();

        const BATCH_SIZE = 30;
        let emailsSent = 0;
        const allDocs = businessesSnapshot.docs;

        for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
            const batchDocs = allDocs.slice(i, i + BATCH_SIZE);
            const batchPromises = batchDocs.map(async (doc) => {
                const data = doc.data();
                const email = data.email;
                const clientName = data.clientName || data.name || 'Usuario';
                
                if (!email) return;

                if (data.profileReminderLastSentAt) {
                    const lastSentAt = data.profileReminderLastSentAt.toMillis();
                    if (now - lastSentAt < threeDaysInMillis) {
                        return;
                    }
                }

                const missingKeys: FieldKey[] = [];
                
                if (!data.clientLogoUrl && !data.imageUrl) missingKeys.push('logo');
                if (!data.phone) missingKeys.push('phone');
                if (!data.address) missingKeys.push('address');
                if (!data.zip) missingKeys.push('zip');
                if (!data.city) missingKeys.push('city');
                if (!data.neighborhood) missingKeys.push('neighborhood');
                if (!data.country) missingKeys.push('country');
                if (!data.website) missingKeys.push('website');
                if (!data.mapUrl && !data.location) missingKeys.push('mapUrl');

                if (missingKeys.length === 0) {
                    return;
                }

                const lang = getLanguageFromCountry(data.country);
                
                let emailBody = '';
                let menuHtml = '';
                let subject = '';

                if (lang === 'all') {
                    subject = versions['es']?.subject || '¡Tu perfil en Dicilo está casi listo! / Your profile is almost ready!';
                    menuHtml = `
                    <div style="background-color: #f1f5f9; padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0; font-size: 14px;">
                        <a href="#en" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Read in English</a> &nbsp;|&nbsp; 
                        <a href="#de" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Auf Deutsch lesen</a> &nbsp;|&nbsp; 
                        <a href="#es" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Leer en Español</a>
                    </div>`;
                    
                    emailBody = buildEmailHtml('es', versions['es'], clientName, missingKeys, `https://dicilo.net/login?lng=es`, `https://dicilo.net/api/unsubscribe?email=${encodeURIComponent(email)}&lang=es`) +
                                '<hr style="border: none; border-top: 1px solid #cbd5e1; margin: 40px 0;">' +
                                buildEmailHtml('en', versions['en'], clientName, missingKeys, `https://dicilo.net/login?lng=en`, `https://dicilo.net/api/unsubscribe?email=${encodeURIComponent(email)}&lang=en`) +
                                '<hr style="border: none; border-top: 1px solid #cbd5e1; margin: 40px 0;">' +
                                buildEmailHtml('de', versions['de'], clientName, missingKeys, `https://dicilo.net/login?lng=de`, `https://dicilo.net/api/unsubscribe?email=${encodeURIComponent(email)}&lang=de`);
                } else {
                    subject = versions[lang]?.subject || '¡Tu perfil en Dicilo está casi listo! 🚀';
                    emailBody = buildEmailHtml(lang, versions[lang], clientName, missingKeys, `https://dicilo.net/login?lng=${lang}`, `https://dicilo.net/api/unsubscribe?email=${encodeURIComponent(email)}&lang=${lang}`);
                }

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
                        ${menuHtml}
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

                const promise = sendMail({
                    to: email,
                    subject: subject,
                    html: emailHtml
                }).then(() => {
                    logger.info(`Recordatorio enviado a ${email} (${clientName})`);
                    return doc.ref.update({
                        profileReminderLastSentAt: Timestamp.now()
                    });
                }).catch((err) => {
                    logger.error(`Error enviando email a ${email}:`, err);
                });

                await promise;
                emailsSent++;
            });

            await Promise.all(batchPromises);

            if (i + BATCH_SIZE < allDocs.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        logger.info(`Cron job de recordatorios finalizado. Correos intentados: ${emailsSent}`);
        
    } catch (error) {
        logger.error('Error en el cron job checkIncompleteProfiles:', error);
    }
});
