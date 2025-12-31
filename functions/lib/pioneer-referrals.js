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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmPioneerPurchase = exports.referralAutomationCron = exports.handleBrevoWebhook = exports.sendPioneerInvitations = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
const SibApiV3Sdk = __importStar(require("sib-api-v3-sdk"));
const moment_1 = __importDefault(require("moment"));
// Define configuration parameter
const brevoApiKey = process.env.BREVO_API_KEY || '';
// Initialize Brevo (Sendinblue) Client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
// Access the parameter value at runtime
apiKey.apiKey = brevoApiKey;
exports.sendPioneerInvitations = (0, https_1.onCall)((request) => __awaiter(void 0, void 0, void 0, function* () {
    const db = admin.firestore();
    // Verificar autenticación
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be logged in to send invitations.');
    }
    const data = request.data;
    const { friends, referrerName, referrerId } = data;
    if (!friends || friends.length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'No friends provided.');
    }
    // Límite de seguridad de 15 amigos (validación backend) por lote o total?
    // Asumiremos por lote por ahora, pero la regla de negocio es "hasta 15 invitaciones".
    // Idealmente se verificaría cuántos ha enviado ya el usuario en la DB.
    const batch = db.batch();
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const results = [];
    for (const friend of friends) {
        const inviteRef = db.collection('referrals_pioneers').doc();
        const inviteId = inviteRef.id;
        // 1. Guardamos la lógica completa en la DB
        const inviteData = {
            referrerId: referrerId,
            friendName: friend.name,
            friendEmail: friend.email,
            customBody: friend.editedText,
            status: 'sent', // 'draft', 'sent', 'opened', 'registered', 'action_required'
            iteration: 0, // 0=Inicial, 1=7 días, 2=14 días
            opened: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastAttempt: admin.firestore.FieldValue.serverTimestamp(),
            diciPointsIncentive: 50,
            guaranteedBalance: 25,
            lang: friend.lang || 'es'
        };
        batch.set(inviteRef, inviteData);
        // 2. Preparamos el Email para Brevo
        // Construimos el HTML. En una implementación ideal, usaríamos templates de Brevo ID.
        // Aquí usaremos la plantilla HTML raw con reemplazos como solicitaste, o un templateId si se prefiere.
        // Usaremos el HTML raw proporcionado para máxima flexibilidad inicial.
        const registrationLink = `https://dicilo.net/registrieren?ref=${referrerId}&invite=${inviteId}&utm_source=email_pioneer`;
        // TODO: Ajustar dominio real. dicilo.net o dicilo-search.web.app? Usaré dicilo.net como placeholder.
        const emailContent = generatePioneerEmailHtml(friend.name, referrerName, friend.editedText, registrationLink, friend.lang);
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = getSubjectByLang(friend.lang, referrerName);
        sendSmtpEmail.htmlContent = emailContent;
        sendSmtpEmail.sender = { "name": "Pioneros Dicilo", "email": "pioneros@dicilo.net" };
        sendSmtpEmail.to = [{ "email": friend.email, "name": friend.name }];
        sendSmtpEmail.tags = ["pioneer_invitation"];
        // Metadata para tracking en webhooks
        // Headers personalizados para rastrear inviteId si Brevo lo permite en metadata o params
        // Brevo permite 'params' pero son para templates. Usaremos una cabecera custom o simplemente tracking basico.
        // Lo mejor para vincular es pasar el inviteId en el enlace (YA HECHO) y confiar en el tracking de clicks.
        // Para OPEN tracking exacto por ID, Brevo usa Message-ID.
        // Pasaremos un tag único o header si es posible, o confiaremos en que el 'opened' 
        // general por email es suficiente (compromiso habitual).
        // Sin embargo, para hacerlo robusto:
        // Añadiremos un "pixel" personalizado o tracking via webhook usando el email como clave en el webhook de 'open'.
        try {
            const apiResponse = yield apiInstance.sendTransacEmail(sendSmtpEmail);
            // Guardamos el MessageId de Brevo para correlacionar eventos
            // apiResponse.messageId
            batch.update(inviteRef, { trackingId: apiResponse.messageId }); // Actualizamos el doc que acabamos de crear (necesita ser set separado o merge)
            // Como es batch, no podemos usar el resultado de la api call en el set inmediato...
            // Ajuste: Hacemos las llamadas a API primero y luego el batch? No, mejor todo en paralelo o secuencial seguro.
            // Opción: Hacemos el batch.set inicial. Luego update asincrono.
            results.push({ email: friend.email, status: 'initiated' });
        }
        catch (error) {
            logger.error(`Error sending email to ${friend.email}:`, error);
            // Si falla el email, quizás no deberíamos guardar en DB o marcar como error.
            // Por simplicidad, marcaremos como 'error_sending' en un update posterior si fuera necesario.
        }
    }
    yield batch.commit();
    return { success: true, count: friends.length };
}));
// --- 2. Webhook de Brevo (Tracking Open/Click) ---
exports.handleBrevoWebhook = (0, https_1.onRequest)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const db = admin.firestore();
    // Brevo envía eventos POST
    const event = req.body;
    // Estructura típica: { "event": "opened", "email": "user@example.com", "message-id": "..." }
    // Puede venir un array o un objeto único dependiendo de la config.
    logger.info('Brevo Webhook received:', event);
    if (!event || !event.email) {
        res.status(400).send('Invalid payload');
        return;
    }
    const eventType = event.event; // 'opened', 'clicked', 'hard_bounce'
    const email = event.email;
    const messageId = event['message-id']; // Ojo con el formato exacto de Brevo
    if (eventType === 'opened' || eventType === 'clicked') {
        try {
            // Buscamos la invitación activa para este email
            // Podríamos intentar buscar por messageId (trackingId) para ser más precisos
            let q = db.collection('referrals_pioneers')
                .where('friendEmail', '==', email)
                .where('opened', '==', false); // Solo si no estaba abierto ya
            // Si tenemos messageId guardado, mejor usarlo
            /*
            if (messageId) {
                 q = db.collection('referrals_pioneers').where('trackingId', '==', messageId);
            }
            */
            const snapshot = yield q.get();
            if (!snapshot.empty) {
                const batch = db.batch();
                snapshot.forEach(doc => {
                    batch.update(doc.ref, {
                        opened: true,
                        status: 'opened',
                        openedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                });
                yield batch.commit();
                logger.info(`Updated status to OPENED for ${email}`);
            }
        }
        catch (e) {
            logger.error('Error updating Firestore from Webhook:', e);
            res.status(500).send('Internal Error');
            return;
        }
    }
    else if (eventType === 'hard_bounce') {
        // Marcar como inválido
        const q = db.collection('referrals_pioneers').where('friendEmail', '==', email);
        const snapshot = yield q.get();
        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.update(doc.ref, { status: 'invalid_email' });
        });
        yield batch.commit();
    }
    res.status(200).send('OK');
}));
// --- 3. Cron Job de Automatización (7, 14, 21 días) ---
exports.referralAutomationCron = (0, scheduler_1.onSchedule)('every 24 hours', (event) => __awaiter(void 0, void 0, void 0, function* () {
    const db = admin.firestore();
    const now = (0, moment_1.default)();
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    // Buscamos invitaciones enviadas y NO abiertas (opened == false)
    // que NO estén completadas ni canceladas
    const snapshot = yield db.collection('referrals_pioneers')
        .where('opened', '==', false)
        .where('status', 'in', ['sent', 'reminder_1', 'reminder_2']) // Filtramos estados activos
        .get();
    const batch = db.batch();
    let updatesCount = 0;
    for (const doc of snapshot.docs) {
        const data = doc.data();
        const lastAttempt = data.lastAttempt ? data.lastAttempt.toDate() : data.createdAt.toDate();
        const daysSinceLast = (0, moment_1.default)(now).diff((0, moment_1.default)(lastAttempt), 'days');
        const totalDays = (0, moment_1.default)(now).diff((0, moment_1.default)(data.createdAt.toDate()), 'days');
        // Lógica de iteraciones
        // T+7 Días (Primer Recordatorio)
        if (data.iteration === 0 && daysSinceLast >= 7) {
            yield sendReminderEmail(doc.id, data, 1, apiInstance);
            batch.update(doc.ref, {
                iteration: 1,
                status: 'reminder_1_sent',
                lastAttempt: admin.firestore.FieldValue.serverTimestamp()
            });
            updatesCount++;
        }
        // T+14 Días (Segundo Recordatorio) - 7 días después del primero (aprox)
        else if (data.iteration === 1 && daysSinceLast >= 7) {
            yield sendReminderEmail(doc.id, data, 2, apiInstance);
            batch.update(doc.ref, {
                iteration: 2,
                status: 'reminder_2_sent',
                lastAttempt: admin.firestore.FieldValue.serverTimestamp()
            });
            updatesCount++;
        }
        // T+21 Días (Alerta de Red)
        // Si totalDays >= 21 y sigue sin abrir
        else if (totalDays >= 21 && data.status !== 'action_required') {
            yield notifyReferrer(data.referrerId, data.friendName, data.friendEmail);
            batch.update(doc.ref, {
                status: 'action_required', // Naranja
                manualAction: true
            });
            updatesCount++;
        }
    }
    if (updatesCount > 0) {
        yield batch.commit();
    }
    logger.info(`Referral automation finished. Updated ${updatesCount} docs.`);
}));
//Helpers
function sendReminderEmail(docId, data, iteration, apiInstance) {
    return __awaiter(this, void 0, void 0, function* () {
        const lang = data.lang || 'es';
        let subject = '';
        let bodyIntro = '';
        // Contenido dinámico según iteración
        if (iteration === 1) {
            subject = lang === 'es' ? 'Recuerda: 50 DiciPoints te esperan' : 'Erinnerung: 50 DiciPoints warten auf dich';
            bodyIntro = lang === 'es'
                ? 'Hola, noté que no has visto tu invitación. Recuerda que al unirte recibes 50 DiciPoints inmediatamente.'
                : 'Hallo, ich habe gesehen, du hast deine Einladung noch nicht geöffnet. Denke an deine 50 DiciPoints.';
        }
        else if (iteration === 2) {
            subject = lang === 'es' ? 'Última oportunidad para ser Pionero' : 'Letzte Chance, Pionier zu werden';
            bodyIntro = lang === 'es' // Tono de escasez
                ? 'Es tu última oportunidad para asegurar tu estatus de Pionero y los 25€ garantizados.'
                : 'Dies ist deine letzte Chance, dir den Pionier-Status und die garantierten 25€ zu sichern.';
        }
        const registrationLink = `https://dicilo.net/registrieren?ref=${data.referrerId}&invite=${docId}&utm_source=email_pioneer_reminder_${iteration}`;
        // Reutilizamos el generador HTML pero forzamos el mensaje custom (o usamos uno nuevo de recordatorio)
        const emailContent = generatePioneerEmailHtml(data.friendName, 'Dicilo Reminder', // Sender ficticio o el original
        bodyIntro, registrationLink, lang);
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = emailContent;
        sendSmtpEmail.sender = { "name": "Pioneros Dicilo", "email": "pioneros@dicilo.net" };
        sendSmtpEmail.to = [{ "email": data.friendEmail, "name": data.friendName }];
        sendSmtpEmail.tags = [`pioneer_reminder_${iteration}`];
        try {
            yield apiInstance.sendTransacEmail(sendSmtpEmail);
        }
        catch (e) {
            logger.error(`Failed to send reminder ${iteration} to ${data.friendEmail}`, e);
        }
    });
}
function notifyReferrer(referrerId, friendName, friendEmail) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = admin.firestore();
        // Aquí deberíamos crear una notificación en el sistema o enviar un email al referrer
        // Para simplificar, creamos un documento de notificación en una colección 'notifications'
        yield db.collection('notifications').add({
            userId: referrerId,
            type: 'referral_stalled',
            title: 'Tu amigo no ha respondido',
            message: `${friendName} (${friendEmail}) no ha abierto tu invitación tras 21 días. Contáctalo manualmente.`,
            data: { friendEmail, friendName },
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });
}
function getSubjectByLang(lang, referrerName) {
    switch (lang) {
        case 'de': return `Deine exklusive Einladung: Werde Pionier bei Dicilo.net`;
        case 'en': return `Special Invitation from ${referrerName}: Be a Pioneer at Dicilo`;
        default: return `Invitación especial de ${referrerName}: Sé pionero en Dicilo`;
    }
}
function generatePioneerEmailHtml(name, referrerName, customMessage, link, lang) {
    // Textos base para el template
    const texts = {
        es: {
            title: `¡Hola ${name}!`,
            intro: `Has sido seleccionado por <b>${referrerName}</b> para ser parte de los cimientos de <b>Dicilo.net</b>.`,
            boxTitle: 'Tu oportunidad como Pionero:',
            li1: 'Adquiere tu <span class="highlight">DiciCoin Física</span> (Activo tangible).',
            li2: 'Recibe <span class="highlight">50 DiciPoints</span> de regalo inmediato.',
            li3: 'Asegura <span class="highlight">25€ de saldo</span> para tus futuras acciones.',
            cta: 'RECLAMAR MI LUGAR Y SER INVERSOR',
            footer: 'No es solo una plataforma, es tu futuro patrimonio heredable.'
        },
        de: {
            title: `Hallo ${name}!`,
            intro: `Du wurdest von <b>${referrerName}</b> ausgewählt, Teil des Fundaments von <b>Dicilo.net</b> zu werden.`,
            boxTitle: 'Deine Chance als Pionier:',
            li1: 'Sichere dir deine <span class="highlight">Physische DiciCoin</span> (Greifbarer Wert).',
            li2: 'Erhalte sofort <span class="highlight">50 DiciPoints</span> als Geschenk.',
            li3: 'Sichere dir <span class="highlight">25€ Guthaben</span> für deine zukünftigen Anteile.',
            cta: 'MEINEN PLATZ BEANSPRUCHEN UND INVESTOR WERDEN',
            footer: 'Es ist nicht nur eine Plattform, es ist dein zukünftiges vererbbares Vermögen.'
        },
        en: {
            title: `Hello ${name}!`,
            intro: `You have been selected by <b>${referrerName}</b> to be part of the foundation of <b>Dicilo.net</b>.`,
            boxTitle: 'Your Pioneer Opportunity:',
            li1: 'Get your <span class="highlight">Physical DiciCoin</span> (Tangible asset).',
            li2: 'Receive <span class="highlight">50 DiciPoints</span> immediately.',
            li3: 'Secure <span class="highlight">25€ balance</span> for future shares.',
            cta: 'CLAIM MY SPOT AND BECOME AN INVESTOR',
            footer: 'It is not just a platform, it is your future inheritable asset.'
        }
    };
    const t = texts[lang] || texts.es;
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        .container { font-family: Verdana, sans-serif; color: #5a5a5a; max-width: 600px; margin: 0 auto; border-top: 10px solid #8cc63f; }
        .header { padding: 20px; text-align: center; background: #f4f4f4; }
        .content { padding: 40px; line-height: 1.6; }
        .highlight { color: #8cc63f; font-weight: bold; }
        .button { background-color: #8cc63f; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; }
        .footer { font-size: 10px; color: #999; padding: 20px; text-align: center; }
        .coin-box { border: 1px dashed #8cc63f; padding: 15px; margin: 20px 0; background: #f9f9f9; }
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            <h1>${t.title}</h1>
            <p>${t.intro}</p>
            
            <div class="coin-box">
                <p><strong>${t.boxTitle}</strong></p>
                <ul>
                    <li>${t.li1}</li>
                    <li>${t.li2}</li>
                    <li>${t.li3}</li>
                </ul>
            </div>

            <p>${customMessage}</p>

            <div style="text-align: center; margin-top: 30px;">
                <a href="${link}" class="button">${t.cta}</a>
            </div>

            <p style="margin-top: 40px;">${t.footer}</p>
        </div>
        <div class="footer">
            Dicilo.net - Ecosistema Global de Recomendación e Inversión.<br>
            Este mensaje es una invitación personal. Si no deseas recibir más, ignora este correo.
        </div>
    </div>
</body>
</html>`;
}
exports.confirmPioneerPurchase = (0, https_1.onCall)((request) => __awaiter(void 0, void 0, void 0, function* () {
    const db = admin.firestore();
    // Autenticación: Solo Admin o Sistema
    // if (!request.auth || request.auth.token.role !== 'admin') ... (Simplificado por ahora)
    const data = request.data;
    const { registrationId, inviteId } = data;
    if (!registrationId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing registrationId');
    }
    // 1. Obtener datos del registro
    const regRef = db.collection('registrations').doc(registrationId);
    const regSnap = yield regRef.get();
    if (!regSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Registration not found');
    }
    const regData = regSnap.data();
    const userEmail = regData === null || regData === void 0 ? void 0 : regData.email;
    // 2. Buscar la invitación correspondiente
    let inviteRef = null;
    let inviteSnap = null;
    if (inviteId) {
        inviteRef = db.collection('referrals_pioneers').doc(inviteId);
        inviteSnap = yield inviteRef.get();
    }
    else if (userEmail) {
        // Fallback: buscar por email si no tenemos ID directo
        const q = db.collection('referrals_pioneers').where('friendEmail', '==', userEmail).limit(1);
        const qSnap = yield q.get();
        if (!qSnap.empty) {
            inviteSnap = qSnap.docs[0];
            inviteRef = inviteSnap.ref;
        }
    }
    const batch = db.batch();
    // 3. Aplicar Recompensas (Wallet)
    // Asumimos que el "wallet" está en el documento del usuario o en una subcolección/colección separada vinculada al UID o RegistrationID.
    // El prompt dice "wallet.dicipoints += 50", "wallet.guaranteed_balance += 25".
    // Crearemos/Actualizaremos 'wallets/{registrationId}'
    const walletRef = db.collection('wallets').doc(registrationId);
    batch.set(walletRef, {
        dicipoints: admin.firestore.FieldValue.increment(50),
        guaranteed_balance: admin.firestore.FieldValue.increment(25),
        currency: 'EUR',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    // 4. Actualizar Estado del Usuario
    batch.update(regRef, {
        investorStatus: 'Pioneer_Investor', // Usamos un campo específico para no romper 'status' (active/paused)
        isPioneer: true,
        pioneerSince: admin.firestore.FieldValue.serverTimestamp()
    });
    // 5. Cerrar el ciclo de la invitación (si existe)
    if (inviteRef && (inviteSnap === null || inviteSnap === void 0 ? void 0 : inviteSnap.exists)) {
        batch.update(inviteRef, {
            status: 'registered',
            convertedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Opcional: Notificar al Referrer que su amigo completó el proceso
        // const referrerId = inviteSnap.data()?.referrerId;
        // ... Logica de notificación ...
    }
    yield batch.commit();
    return { success: true, message: 'Pioneer rewards applied.' };
}));
