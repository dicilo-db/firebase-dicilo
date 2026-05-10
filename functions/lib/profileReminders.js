"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIncompleteProfiles = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const logger = __importStar(require("firebase-functions/logger"));
const firestore_1 = require("firebase-admin/firestore");
const email_1 = require("./email");
/**
 * Determina el idioma basándose en el nombre del país (español, inglés o alemán).
 * Si no coincide con ninguno, retorna 'all' para enviar el correo multilingüe.
 */
function getLanguageFromCountry(country) {
    if (!country)
        return 'all';
    const c = country.toLowerCase().trim();
    // Español
    const esCountries = ['españa', 'spain', 'colombia', 'mexico', 'méxico', 'argentina', 'chile', 'peru', 'perú', 'venezuela', 'ecuador', 'guatemala', 'bolivia', 'republica dominicana', 'república dominicana', 'dominican republic', 'honduras', 'paraguay', 'el salvador', 'nicaragua', 'costa rica', 'puerto rico', 'panama', 'panamá', 'uruguay'];
    if (esCountries.includes(c))
        return 'es';
    // Alemán
    const deCountries = ['alemania', 'germany', 'deutschland', 'austria', 'österreich', 'suiza', 'switzerland', 'schweiz', 'liechtenstein'];
    if (deCountries.includes(c))
        return 'de';
    // Inglés
    const enCountries = ['usa', 'united states', 'estados unidos', 'uk', 'united kingdom', 'reino unido', 'australia', 'canada', 'canadá', 'new zealand', 'nueva zelanda', 'ireland', 'irlanda'];
    if (enCountries.includes(c))
        return 'en';
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
// Generate content block
function generateContentBlock(lang, clientName, missingKeys, editUrl, unsubscribeUrl) {
    const texts = {
        es: {
            title: '¡Tu perfil en Dicilo está casi listo!',
            greeting: `Hola, <strong>${clientName}</strong>,`,
            p1: 'Hemos notado que aún faltan algunos detalles importantes en tu perfil para que tu negocio pueda aparecer correctamente en la primera página de nuestro portal y sea visible para los clientes.',
            p2: 'Actualmente, aún necesitas completar algunos datos importantes, como:',
            p3: 'Es muy importante que la ubicación esté correctamente detallada y visible en el mapa del formulario, ya que esto permite que tu empresa aparezca correctamente dentro de nuestro portal y facilite que los clientes puedan encontrarte.',
            p4: 'También es importante que tu empresa cuente con un logo visible, ya sea subiendo la imagen directamente o agregando la dirección URL del logo.',
            noteTitle: '📌 <strong>Recuerda:</strong> Todos los campos del formulario son importantes, con excepción de:',
            note1: 'Coordenadas',
            note2: 'Pista de Imagen (IA)',
            note3: 'Calificación URL',
            note4: 'Oferta actual (si no cuentas con una)',
            p5: 'Además, te recomendamos agregar una descripción corta de tu negocio para que los clientes puedan conocer mejor tus servicios.',
            tip: '💡 <em><strong>Tip:</strong> Puedes copiar la URL de tu ubicación directamente desde Google Maps y pegarla en el formulario.</em>',
            btn: '👉 Completar mi perfil ahora',
            p6: '<em>(Si aún no has iniciado sesión o no estás registrado, el enlace te pedirá que ingreses a tu cuenta primero para poder llenar los datos faltantes).</em>',
            p7: 'No dudes en comunicarte con nosotros si tienes alguna complicación o necesitas ayuda para completar tu perfil.',
            p8: 'Atentamente,<br><strong>El equipo de Dicilo</strong>',
            p9: 'Gracias por ser parte de Dicilo.<br>Ten siempre en cuenta que Dicilo está para apoyarte y esperamos poder contactar contigo muy pronto.',
            ps1: 'PS: Recuerda que tu registro Básico es 100% gratis.',
            ps2: '¿No ha sido usted el que registró la empresa o su propio negocio?',
            ps3: 'En este enlace puede dar de baja su registro completamente gratis.'
        },
        en: {
            title: 'Your Dicilo profile is almost ready!',
            greeting: `Hello, <strong>${clientName}</strong>,`,
            p1: 'We noticed that your profile is still missing some important details so that your business can appear correctly on the first page of our portal and be visible to customers.',
            p2: 'Currently, you still need to complete some important data, such as:',
            p3: 'It is very important that the location is correctly detailed and visible on the form map, as this allows your company to appear correctly within our portal and makes it easier for customers to find you.',
            p4: 'It is also important that your company has a visible logo, either by uploading the image directly or adding the logo URL.',
            noteTitle: '📌 <strong>Remember:</strong> All form fields are important, except for:',
            note1: 'Coordinates',
            note2: 'Image Hint (AI)',
            note3: 'Rating URL',
            note4: 'Current offer (if you don\'t have one)',
            p5: 'In addition, we recommend adding a short description of your business so that customers can better understand your services.',
            tip: '💡 <em><strong>Tip:</strong> You can copy your location URL directly from Google Maps and paste it into the form.</em>',
            btn: '👉 Complete my profile now',
            p6: '<em>(If you have not logged in or registered yet, the link will ask you to log into your account first to fill in the missing data).</em>',
            p7: 'Do not hesitate to contact us if you have any complications or need help completing your profile.',
            p8: 'Sincerely,<br><strong>The Dicilo Team</strong>',
            p9: 'Thank you for being part of Dicilo.<br>Always keep in mind that Dicilo is here to support you and we hope to contact you very soon.',
            ps1: 'PS: Remember that your Basic registration is 100% free.',
            ps2: 'Were you not the one who registered the company or your own business?',
            ps3: 'In this link you can unsubscribe your registration completely free of charge.'
        },
        de: {
            title: 'Dein Dicilo-Profil ist fast fertig!',
            greeting: `Hallo <strong>${clientName}</strong>,`,
            p1: 'Wir haben festgestellt, dass in deinem Profil noch einige wichtige Details fehlen, damit dein Unternehmen korrekt auf der ersten Seite unseres Portals erscheint und für Kunden sichtbar ist.',
            p2: 'Aktuell musst du noch einige wichtige Daten ergänzen, wie zum Beispiel:',
            p3: 'Es ist sehr wichtig, dass der Standort auf der Formularkarte korrekt detailliert und sichtbar ist, da dein Unternehmen dadurch korrekt in unserem Portal angezeigt wird und Kunden dich leichter finden können.',
            p4: 'Außerdem ist es wichtig, dass dein Unternehmen über ein sichtbares Logo verfügt. Lade dazu entweder das Bild direkt hoch oder gib die Logo-URL ein.',
            noteTitle: '📌 <strong>Zur Erinnerung:</strong> Alle Formularfelder sind wichtig, mit Ausnahme von:',
            note1: 'Koordinaten',
            note2: 'Bildhinweis (KI)',
            note3: 'Bewertungs-URL',
            note4: 'Aktuelles Angebot (falls nicht vorhanden)',
            p5: 'Zudem empfehlen wir, eine kurze Beschreibung deines Unternehmens hinzuzufügen, damit Kunden deine Dienstleistungen besser kennenlernen können.',
            tip: '💡 <em><strong>Tipp:</strong> Du kannst deine Standort-URL direkt aus Google Maps kopieren und in das Formular einfügen.</em>',
            btn: '👉 Mein Profil jetzt vervollständigen',
            p6: '<em>(Wenn du dich noch nicht angemeldet oder registriert hast, fordert dich der Link auf, dich zuerst in dein Konto einzuloggen, um die fehlenden Daten einzugeben).</em>',
            p7: 'Zögere nicht, uns zu kontaktieren, falls du Schwierigkeiten hast oder Hilfe beim Ausfüllen deines Profils benötigst.',
            p8: 'Mit freundlichen Grüßen,<br><strong>Das Dicilo-Team</strong>',
            p9: 'Danke, dass du Teil von Dicilo bist.<br>Denke immer daran, dass Dicilo hier ist, um dich zu unterstützen, und wir hoffen, dich bald kontaktieren zu können.',
            ps1: 'PS: Denk daran, dass deine Basis-Registrierung zu 100% kostenlos ist.',
            ps2: 'Warst du nicht derjenige, der das Unternehmen oder dein eigenes Geschäft registriert hat?',
            ps3: 'Unter diesem Link kannst du deine Registrierung völlig kostenlos abmelden.'
        }
    };
    const t = texts[lang];
    const missingListHtml = missingKeys.map(k => `<li style="margin-bottom: 8px; color: #4b5563;">${missingFieldsDict[k][lang]}</li>`).join('');
    return `
        <div id="${lang}" class="content" style="padding-top: 20px;">
            <h2>${t.title}</h2>
            <p>${t.greeting}</p>
            <p>${t.p1}</p>
            
            <p>${t.p2}</p>
            <div class="missing-list"><ul>${missingListHtml}</ul></div>
            
            <p>${t.p3}</p>
            <p>${t.p4}</p>
            
            <div class="note-box">
                <p>${t.noteTitle}</p>
                <ul>
                    <li>${t.note1}</li>
                    <li>${t.note2}</li>
                    <li>${t.note3}</li>
                    <li>${t.note4}</li>
                </ul>
            </div>
            
            <p>${t.p5}</p>
            <p>${t.tip}</p>
            
            <div class="button-container">
                <a href="${editUrl}" class="button" style="color: white !important;">${t.btn}</a>
            </div>
            
            <p>${t.p6}</p>
            <p>${t.p7}</p>
            <p>${t.p8}</p>
            <p>${t.p9}</p>
            
            <p class="ps-text">
                ${t.ps1}<br><br>
                ${t.ps2}<br>
                <a href="${unsubscribeUrl}" style="color: #ef4444; text-decoration: underline;">${t.ps3}</a>
            </p>
        </div>
    `;
}
exports.checkIncompleteProfiles = (0, scheduler_1.onSchedule)('every day 10:00', (event) => __awaiter(void 0, void 0, void 0, function* () {
    const db = (0, firestore_1.getFirestore)();
    const now = Date.now();
    const threeDaysInMillis = 3 * 24 * 60 * 60 * 1000;
    try {
        const businessesSnapshot = yield db.collection('businesses')
            .where('clientType', 'in', ['basic', 'starter', 'premium'])
            .get();
        const BATCH_SIZE = 30;
        let emailsSent = 0;
        const allDocs = businessesSnapshot.docs;
        for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
            const batchDocs = allDocs.slice(i, i + BATCH_SIZE);
            const batchPromises = batchDocs.map((doc) => __awaiter(void 0, void 0, void 0, function* () {
                const data = doc.data();
                const email = data.email;
                const clientName = data.clientName || data.name || 'Usuario';
                if (!email)
                    return;
                if (data.profileReminderLastSentAt) {
                    const lastSentAt = data.profileReminderLastSentAt.toMillis();
                    if (now - lastSentAt < threeDaysInMillis) {
                        return;
                    }
                }
                const missingKeys = [];
                if (!data.clientLogoUrl && !data.imageUrl)
                    missingKeys.push('logo');
                if (!data.phone)
                    missingKeys.push('phone');
                if (!data.address)
                    missingKeys.push('address');
                if (!data.zip)
                    missingKeys.push('zip');
                if (!data.city)
                    missingKeys.push('city');
                if (!data.neighborhood)
                    missingKeys.push('neighborhood');
                if (!data.country)
                    missingKeys.push('country');
                if (!data.website)
                    missingKeys.push('website');
                if (!data.mapUrl && !data.location)
                    missingKeys.push('mapUrl');
                if (missingKeys.length === 0) {
                    return;
                }
                const lang = getLanguageFromCountry(data.country);
                let emailBody = '';
                let menuHtml = '';
                let subject = '';
                if (lang === 'all') {
                    subject = '¡Tu perfil en Dicilo está casi listo! / Your profile is almost ready!';
                    menuHtml = `
                <div style="background-color: #f1f5f9; padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0; font-size: 14px;">
                    <a href="#en" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Read in English</a> &nbsp;|&nbsp; 
                    <a href="#de" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Auf Deutsch lesen</a> &nbsp;|&nbsp; 
                    <a href="#es" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Leer en Español</a>
                </div>`;
                    emailBody = generateContentBlock('es', clientName, missingKeys, `https://dicilo.net/login?lng=es`, `https://dicilo.net/api/unsubscribe?email=${encodeURIComponent(email)}&lang=es`) +
                        '<hr style="border: none; border-top: 1px solid #cbd5e1; margin: 40px 0;">' +
                        generateContentBlock('en', clientName, missingKeys, `https://dicilo.net/login?lng=en`, `https://dicilo.net/api/unsubscribe?email=${encodeURIComponent(email)}&lang=en`) +
                        '<hr style="border: none; border-top: 1px solid #cbd5e1; margin: 40px 0;">' +
                        generateContentBlock('de', clientName, missingKeys, `https://dicilo.net/login?lng=de`, `https://dicilo.net/api/unsubscribe?email=${encodeURIComponent(email)}&lang=de`);
                }
                else {
                    if (lang === 'es')
                        subject = '¡Tu perfil en Dicilo está casi listo! 🚀';
                    if (lang === 'en')
                        subject = 'Your Dicilo profile is almost ready! 🚀';
                    if (lang === 'de')
                        subject = 'Dein Dicilo-Profil ist fast fertig! 🚀';
                    emailBody = generateContentBlock(lang, clientName, missingKeys, `https://dicilo.net/login?lng=${lang}`, `https://dicilo.net/api/unsubscribe?email=${encodeURIComponent(email)}&lang=${lang}`);
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
                    .content h2 { color: #0f172a; font-size: 20px; margin-top: 0; }
                    .missing-list { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 20px 20px 40px; margin: 25px 0; }
                    .missing-list ul { margin: 0; padding: 0; list-style-type: none; }
                    .note-box { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
                    .note-box p { margin: 0; font-size: 14px; color: #92400e; }
                    .note-box ul { margin: 10px 0 0 0; font-size: 14px; color: #92400e; }
                    .button-container { text-align: center; margin: 40px 0; }
                    .button { background-color: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.2s; }
                    .button:hover { background-color: #2563eb; }
                    .footer { text-align: center; padding: 30px; background-color: #f8fafc; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
                    .ps-text { font-style: italic; color: #059669; font-weight: 600; margin-top: 15px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="https://dicilo.net/logo.png" alt="Dicilo Logo">
                        <h1>Dicilo.net</h1>
                    </div>
                    ${menuHtml}
                    ${emailBody}
                    <div class="footer">
                        &copy; 2026 Dicilo Network. Todos los derechos reservados.
                    </div>
                </div>
            </body>
            </html>
            `;
                const promise = (0, email_1.sendMail)({
                    to: email,
                    subject: subject,
                    html: emailHtml
                }).then(() => {
                    logger.info(`Recordatorio enviado a ${email} (${clientName})`);
                    return doc.ref.update({
                        profileReminderLastSentAt: firestore_1.Timestamp.now()
                    });
                }).catch((err) => {
                    logger.error(`Error enviando email a ${email}:`, err);
                });
                yield promise;
                emailsSent++;
            }));
            yield Promise.all(batchPromises);
            if (i + BATCH_SIZE < allDocs.length) {
                yield new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        logger.info(`Cron job de recordatorios finalizado. Correos intentados: ${emailsSent}`);
    }
    catch (error) {
        logger.error('Error en el cron job checkIncompleteProfiles:', error);
    }
}));
