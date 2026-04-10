"use strict";
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
exports.getEmailI18n = getEmailI18n;
exports.render = render;
function getEmailI18n(lang, db) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Opción A: Firestore (si subes docs i18n/email.es|de|en)
            if (db) {
                const doc = yield db.doc(`i18n/email.${lang}`).get();
                if (doc.exists)
                    return doc.data();
            }
        }
        catch (_a) { }
        // Opción B: Fallback mínimo embebido (ajusta si quieres más claves)
        const fallback = {
            es: {
                'consent.subject': '[DICILO] ¿Aceptas recibir información recomendada por {{name}}?',
                'consent.body': 'Hola {{recipientName}},<br/>Has recibido una recomendación de {{name}}.<br/>¿Deseas recibir información de DICILO?<br/><br/>{{cta_accept}}&nbsp;|&nbsp;{{cta_decline}}',
                'consent.cta.accept': 'Sí, acepto',
                'consent.cta.decline': 'No, gracias',
                'reminder.subject': '[DICILO] Recordatorio de consentimiento',
                'passwordReset.subject': '[DICILO] Restablecer tu contraseña',
                'passwordReset.body': 'Hola,<br/><br/>Has solicitado restablecer tu contraseña para tu cuenta de Dicilo.<br/><br/><a href="{{link}}" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Haga clic aquí para restablecer su contraseña</a><br/><br/>Si el botón de arriba no funciona, copie y pegue el siguiente enlace en su navegador:<br/>{{link}}<br/><br/>Si no solicitaste este cambio, puedes ignorar este correo.',
            },
            de: {
                'consent.subject': '[DICILO] Akzeptieren Sie Informationen von {{name}}?',
                'consent.body': 'Hallo {{recipientName}},<br/>Sie haben eine Empfehlung von {{name}} erhalten.<br/>Möchten Sie Informationen von DICILO erhalten?<br/><br/>{{cta_accept}}&nbsp;|&nbsp;{{cta_decline}}',
                'consent.cta.accept': 'Ja, akzeptieren',
                'consent.cta.decline': 'Nein, danke',
                'reminder.subject': '[DICILO] Erinnerung: Einwilligung ausstehend',
                'passwordReset.subject': '[DICILO] Passwort zurücksetzen',
                'passwordReset.body': 'Hallo,<br/><br/>Sie haben angefordert, das Passwort für Ihr Dicilo-Konto zurückzusetzen.<br/><br/><a href="{{link}}" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Klicken Sie hier, um Ihr Passwort zurückzusetzen</a><br/><br/>Falls die Schaltfläche oben nicht funktioniert, kopieren Sie den folgenden Link in Ihren Browser:<br/>{{link}}<br/><br/>Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.',
            },
            en: {
                'consent.subject': '[DICILO] Do you accept info recommended by {{name}}?',
                'consent.body': 'Hi {{recipientName}},<br/>You received a recommendation from {{name}}.<br/>Would you like to receive information from DICILO?<br/><br/>{{cta_accept}}&nbsp;|&nbsp;{{cta_decline}}',
                'consent.cta.accept': 'Yes, I accept',
                'consent.cta.decline': 'No, thanks',
                'reminder.subject': '[DICILO] Consent reminder',
                'passwordReset.subject': '[DICILO] Reset your password',
                'passwordReset.body': 'Hi,<br/><br/>You requested to reset your password for your Dicilo account.<br/><br/><a href="{{link}}" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Click here to reset your password</a><br/><br/>If the button above does not work, copy and paste the following link into your browser:<br/>{{link}}<br/><br/>If you did not request this change, you can ignore this email.',
            },
            fr: {
                'consent.subject': '[DICILO] Do you accept info recommended by {{name}}?',
                'consent.body': 'Hi {{recipientName}},<br/>You received a recommendation from {{name}}.<br/>Would you like to receive information from DICILO?<br/><br/>{{cta_accept}}&nbsp;|&nbsp;{{cta_decline}}',
                'consent.cta.accept': 'Yes, I accept',
                'consent.cta.decline': 'No, thanks',
                'reminder.subject': '[DICILO] Consent reminder',
                'passwordReset.subject': '[DICILO] Reset your password',
                'passwordReset.body': 'Hi,<br/><br/>You requested to reset your password for your Dicilo account.<br/><br/><a href="{{link}}" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Click here to reset your password</a><br/><br/>If the button above does not work, copy and paste the following link into your browser:<br/>{{link}}<br/><br/>If you did not request this change, you can ignore this email.',
            },
            pt: {
                'consent.subject': '[DICILO] Do you accept info recommended by {{name}}?',
                'consent.body': 'Hi {{recipientName}},<br/>You received a recommendation from {{name}}.<br/>Would you like to receive information from DICILO?<br/><br/>{{cta_accept}}&nbsp;|&nbsp;{{cta_decline}}',
                'consent.cta.accept': 'Yes, I accept',
                'consent.cta.decline': 'No, thanks',
                'reminder.subject': '[DICILO] Consent reminder',
                'passwordReset.subject': '[DICILO] Reset your password',
                'passwordReset.body': 'Hi,<br/><br/>You requested to reset your password for your Dicilo account.<br/><br/><a href="{{link}}" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Click here to reset your password</a><br/><br/>If the button above does not work, copy and paste the following link into your browser:<br/>{{link}}<br/><br/>If you did not request this change, you can ignore this email.',
            },
            it: {
                'consent.subject': '[DICILO] Do you accept info recommended by {{name}}?',
                'consent.body': 'Hi {{recipientName}},<br/>You received a recommendation from {{name}}.<br/>Would you like to receive information from DICILO?<br/><br/>{{cta_accept}}&nbsp;|&nbsp;{{cta_decline}}',
                'consent.cta.accept': 'Yes, I accept',
                'consent.cta.decline': 'No, thanks',
                'reminder.subject': '[DICILO] Consent reminder',
                'passwordReset.subject': '[DICILO] Reset your password',
                'passwordReset.body': 'Hi,<br/><br/>You requested to reset your password for your Dicilo account.<br/><br/><a href="{{link}}" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Click here to reset your password</a><br/><br/>If the button above does not work, copy and paste the following link into your browser:<br/>{{link}}<br/><br/>If you did not request this change, you can ignore this email.',
            },
        };
        return fallback[lang];
    });
}
function render(tpl, vars) {
    return tpl.replace(/{{(.*?)}}/g, (_, k) => { var _a; return (_a = vars[k.trim()]) !== null && _a !== void 0 ? _a : ''; });
}
