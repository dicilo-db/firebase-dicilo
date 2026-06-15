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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.checkFreelancerGreenCard = exports.importBusinessesFromStorage = exports.promoteToClient = exports.seedDatabaseCallable = exports.consentDecline = exports.consentAccept = exports.taskWorker = exports.submitRecommendation = exports.syncExistingCustomersToErp = exports.sendRegistrationToErp = exports.onAdminWrite = void 0;
// functions/src/index.ts
/**
 * @fileoverview Cloud Functions for Firebase.
 * This file contains the backend logic for setting custom claims on users.
 */
const functions = __importStar(require("firebase-functions"));
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const firestore_2 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const i18n_1 = require("./i18n");
const email_1 = require("./email");
const businessesToSeed = __importStar(require("./seed-data.json"));
// Initialize Firebase Admin SDK
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
/**
 * Sets custom claims on a user to grant admin privileges. This function is triggered
 * automatically when a document in the 'admins' collection is created or updated.
 * This is a v1 function for robustness and reliability.
 */
exports.onAdminWrite = functions
    .region('europe-west1')
    .firestore.document('admins/{uid}')
    .onWrite((change, context) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const uid = context.params.uid;
    const afterData = change.after.data();
    const roleAfter = afterData === null || afterData === void 0 ? void 0 : afterData.role;
    // If the document is deleted or the role is removed, revoke admin claims.
    if (!change.after.exists ||
        (roleAfter !== 'admin' && roleAfter !== 'superadmin')) {
        logger.info(`Admin role removed for user ${uid}. Revoking admin custom claim.`);
        try {
            // Check current claims before setting new ones to prevent unnecessary updates
            const user = yield (0, auth_1.getAuth)().getUser(uid);
            if (((_a = user.customClaims) === null || _a === void 0 ? void 0 : _a.admin) === true || ((_b = user.customClaims) === null || _b === void 0 ? void 0 : _b.role)) {
                yield (0, auth_1.getAuth)().setCustomUserClaims(uid, { admin: null, role: null });
                yield (0, auth_1.getAuth)().revokeRefreshTokens(uid); // Force re-login to apply new claims
                logger.info(`Successfully revoked admin claim and refresh tokens for ${uid}.`);
            }
            else {
                logger.info(`User ${uid} had no admin claims to revoke. No action taken.`);
            }
        }
        catch (error) {
            logger.error(`Error revoking admin claim for ${uid}:`, error);
        }
        return null;
    }
    // If a role of 'admin' or 'superadmin' is set, grant the claims.
    if (roleAfter === 'admin' || roleAfter === 'superadmin') {
        logger.info(`Role document for user ${uid} written with role: ${roleAfter}. Setting/Verifying custom claims.`);
        try {
            const user = yield (0, auth_1.getAuth)().getUser(uid);
            // Force update claims even if they appear to be the same, to fix inconsistencies.
            yield (0, auth_1.getAuth)().setCustomUserClaims(uid, {
                admin: true,
                role: roleAfter,
            });
            yield (0, auth_1.getAuth)().revokeRefreshTokens(uid); // Force re-login to apply new claims
            logger.info(`Successfully SET/FORCED custom claims for ${uid} with role ${roleAfter} and revoked refresh tokens.`);
        }
        catch (error) {
            logger.error(`Error setting custom claims for ${uid}:`, error);
        }
    }
    return null;
}));
exports.sendRegistrationToErp = (0, firestore_2.onDocumentCreated)({ document: 'registrations/{registrationId}', region: 'europe-west1' }, (event) => __awaiter(void 0, void 0, void 0, function* () {
    const snapshot = event.data;
    if (!snapshot) {
        logger.warn('No data found in event. Ending function.');
        return;
    }
    const newData = snapshot.data();
    const registrationId = event.params.registrationId;
    const ERP_RECEIVER_URL = process.env.ERP_RECEIVER_URL;
    const SECRET_API_KEY = process.env.ERP_API_KEY;
    if (!ERP_RECEIVER_URL || !SECRET_API_KEY) {
        logger.error('Config Error! ERP URL or secret key not defined.');
        return;
    }
    logger.info(`New registration detected: ${registrationId}. Sending to ERP...`);
    const payload = Object.assign(Object.assign({}, newData), { id: registrationId, planId: `plan_${newData.registrationType}` });
    try {
        yield axios_1.default.post(ERP_RECEIVER_URL, payload, {
            headers: { 'x-api-key': SECRET_API_KEY },
        });
        logger.info(`Registration ${registrationId} sent to ERP successfully.`);
    }
    catch (error) {
        logger.error(`Failed to send registration ${registrationId} to ERP:`, error.message);
    }
}));
exports.syncExistingCustomersToErp = (0, https_1.onCall)({ region: 'europe-west1' }, (request) => __awaiter(void 0, void 0, void 0, function* () {
    if (!request.auth || request.auth.token.role !== 'superadmin') {
        throw new https_1.HttpsError('permission-denied', 'Only superadmins can perform this action.');
    }
    const ERP_RECEIVER_URL = process.env.ERP_RECEIVER_URL;
    const SECRET_API_KEY = process.env.ERP_API_KEY;
    if (!ERP_RECEIVER_URL || !SECRET_API_KEY) {
        logger.error('Config Error! ERP URL or secret key not defined.');
        throw new https_1.HttpsError('internal', 'Config error. Contact an admin.');
    }
    logger.info('--- Sync started ---');
    try {
        const registrationsSnapshot = yield db.collection('registrations').get();
        if (registrationsSnapshot.empty) {
            return { success: true, newCount: 0, message: 'No customers to sync.' };
        }
        let successCount = 0;
        const promises = registrationsSnapshot.docs.map((doc) => __awaiter(void 0, void 0, void 0, function* () {
            const registrationData = doc.data();
            const regId = doc.id;
            const payload = Object.assign(Object.assign({ id: regId }, registrationData), { planId: `plan_${registrationData.registrationType}` });
            try {
                yield axios_1.default.post(ERP_RECEIVER_URL, payload, {
                    headers: { 'x-api-key': SECRET_API_KEY },
                });
                successCount++;
            }
            catch (error) {
                logger.error(`Error syncing customer ${regId}:`, error);
            }
        }));
        yield Promise.all(promises);
        logger.info(`Success! Synced ${successCount} of ${registrationsSnapshot.size} customers.`);
        return {
            success: true,
            newCount: successCount,
            message: `Synced ${successCount} customers.`,
        };
    }
    catch (error) {
        logger.error('--- ERROR DURING SYNC ---:', error);
        throw new https_1.HttpsError('internal', `Unexpected error: ${error.message}`);
    }
}));
// --- Recommendation Engine ---
exports.submitRecommendation = (0, https_1.onCall)({ region: 'europe-west1' }, (req) => __awaiter(void 0, void 0, void 0, function* () {
    // Basic validation
    const { recommenderName, recommenderEmail, recipients, clientId, lang } = req.data;
    if (!recommenderName ||
        !recommenderEmail ||
        !(recipients === null || recipients === void 0 ? void 0 : recipients.length) ||
        !clientId ||
        !lang) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields.');
    }
    const batch = db.batch();
    const recommendationId = db.collection('recommendations').doc().id;
    // 1. Create main recommendation document
    const recommendationRef = db.doc(`recommendations/${recommendationId}`);
    batch.set(recommendationRef, {
        recommenderName,
        recommenderEmail,
        clientId,
        lang,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        status: 'pending',
        recipientsCount: recipients.length,
        acceptedCount: 0,
    });
    // 2. Create tasks for each recipient
    for (const recipient of recipients) {
        const taskId = db.collection('recommendation_tasks').doc().id;
        const taskRef = db.doc(`recommendation_tasks/${taskId}`);
        batch.set(taskRef, {
            recommendationId,
            recipientName: recipient.name,
            recipientContact: recipient.email || recipient.whatsapp,
            contactType: recipient.email ? 'email' : 'whatsapp',
            status: 'pending', // pending, sent, accepted, declined
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            clientId,
            lang,
            recommenderName,
        });
    }
    yield batch.commit();
    return { success: true, recommendationId };
}));
exports.taskWorker = (0, firestore_2.onDocumentCreated)({ document: 'recommendation_tasks/{taskId}', region: 'europe-west1' }, (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    const task = (_c = event.data) === null || _c === void 0 ? void 0 : _c.data();
    if (!task)
        return logger.info('No data in task, exiting.');
    const { recipientName, recipientContact, lang, recommenderName, contactType, } = task;
    const i18n = yield (0, i18n_1.getEmailI18n)(lang);
    const acceptUrl = `https://europe-west1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/consentAccept?taskId=${event.params.taskId}`;
    const declineUrl = `https://europe-west1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/consentDecline?taskId=${event.params.taskId}`;
    if (contactType === 'email') {
        const html = (0, i18n_1.render)(i18n['consent.body'], {
            recipientName,
            name: recommenderName,
            cta_accept: `<a href="${acceptUrl}"><b>${i18n['consent.cta.accept']}</b></a>`,
            cta_decline: `<a href="${declineUrl}"><b>${i18n['consent.cta.decline']}</b></a>`,
        });
        yield (0, email_1.sendMail)({
            to: recipientContact,
            subject: (0, i18n_1.render)(i18n['consent.subject'], { name: recommenderName }),
            html,
        });
    }
    yield ((_d = event.data) === null || _d === void 0 ? void 0 : _d.ref.update({
        status: 'sent',
        sentAt: firestore_1.FieldValue.serverTimestamp(),
    }));
}));
const handleConsent = (req, res, newStatus) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const taskId = req.query.taskId;
    if (!taskId) {
        res.status(400).send('Missing taskId parameter.');
        return;
    }
    const taskRef = db.doc(`recommendation_tasks/${taskId}`);
    const taskSnap = yield taskRef.get();
    if (!taskSnap.exists) {
        res.status(404).send('Task not found.');
        return;
    }
    yield taskRef.update({
        status: newStatus,
        handledAt: firestore_1.FieldValue.serverTimestamp(),
    });
    if (newStatus === 'accepted') {
        const recommendationRef = db.doc(`recommendations/${(_e = taskSnap.data()) === null || _e === void 0 ? void 0 : _e.recommendationId}`);
        yield recommendationRef.update({ acceptedCount: firestore_1.FieldValue.increment(1) });
    }
    res
        .status(200)
        .send(`Thank you! Your choice has been registered as: ${newStatus}`);
});
exports.consentAccept = functions
    .region('europe-west1')
    .https.onRequest((req, res) => handleConsent(req, res, 'accepted'));
exports.consentDecline = functions
    .region('europe-west1')
    .https.onRequest((req, res) => handleConsent(req, res, 'declined'));
const doSeedDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    const batch = db.batch();
    // This is the robust way to handle direct JSON imports with varying module structures.
    const data = Object.values(businessesToSeed);
    // The imported data can sometimes be nested, so we flatten it.
    const businesses = data.flat();
    if (!Array.isArray(businesses) || businesses.length === 0) {
        logger.error('Seed data is not an array or is empty after processing.', {
            importedData: businessesToSeed,
        });
        throw new Error('Formato de datos de origen no válido o vacío. Se esperaba un array de objetos.');
    }
    logger.info(`Found ${businesses.length} businesses to seed.`);
    businesses.forEach((business) => {
        // Basic validation to ensure it's a valid business object
        if (business && typeof business === 'object' && business.name) {
            const docRef = db.collection('businesses').doc(); // Auto-generate ID
            batch.set(docRef, business);
        }
        else {
            logger.warn('Skipping invalid business object in seed data:', business);
        }
    });
    yield batch.commit();
    return {
        success: true,
        message: `${businesses.length} businesses from seed-data.json have been seeded.`,
    };
});
exports.seedDatabaseCallable = (0, https_1.onCall)({ region: 'europe-west1' }, (request) => __awaiter(void 0, void 0, void 0, function* () {
    if (!request.auth || request.auth.token.role !== 'superadmin') {
        throw new https_1.HttpsError('permission-denied', 'Only superadmins can perform this action.');
    }
    try {
        return yield doSeedDatabase();
    }
    catch (error) {
        logger.error('Error seeding database from callable function:', error);
        throw new https_1.HttpsError('internal', error.message || 'Failed to seed database.');
    }
}));
exports.promoteToClient = (0, https_1.onCall)({ region: 'europe-west1' }, (request) => __awaiter(void 0, void 0, void 0, function* () {
    if (!request.auth ||
        (request.auth.token.role !== 'admin' &&
            request.auth.token.role !== 'superadmin')) {
        throw new https_1.HttpsError('permission-denied', 'Only admins or superadmins can perform this action.');
    }
    const { businessId, clientType } = request.data;
    if (!businessId ||
        !clientType ||
        (clientType !== 'retailer' && clientType !== 'premium')) {
        throw new https_1.HttpsError('invalid-argument', 'Must provide "businessId" and a valid "clientType".');
    }
    try {
        const businessRef = db.collection('businesses').doc(businessId);
        const businessSnap = yield businessRef.get();
        if (!businessSnap.exists) {
            throw new https_1.HttpsError('not-found', 'The specified business does not exist.');
        }
        const businessData = businessSnap.data();
        const slugify = (text) => text
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '');
        const clientData = {
            clientName: businessData.name,
            slug: slugify(businessData.name),
            clientLogoUrl: businessData.imageUrl || 'https://placehold.co/128x128.png',
            clientTitle: `Willkommen bei ${businessData.name}`,
            clientSubtitle: `Entdecken Sie ${businessData.name}`,
            socialLinks: { instagram: '', facebook: '', linkedin: '' },
            products: [],
            strengths: [],
            testimonials: [],
            translations: {},
            clientType: clientType,
        };
        const clientRef = yield db.collection('clients').add(clientData);
        return {
            success: true,
            message: `Business ${businessData.name} has been promoted to a ${clientType} client with ID ${clientRef.id}.`,
            clientId: clientRef.id,
        };
    }
    catch (error) {
        logger.error('Error promoting business:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', error.message || 'Failed to promote business.');
    }
}));
exports.importBusinessesFromStorage = (0, https_1.onCall)({ region: 'europe-west1', timeoutSeconds: 540, memory: '2GiB' }, (request) => __awaiter(void 0, void 0, void 0, function* () {
    if (!request.auth || request.auth.token.role !== 'superadmin') {
        throw new https_1.HttpsError('permission-denied', 'Only superadmins can perform this action.');
    }
    const bucket = admin.storage().bucket();
    const file = bucket.file('BD_Espana_faderbase_extended.json');
    try {
        logger.info(`Attempting to download file from bucket: ${bucket.name}, path: ${file.name}`);
        // Descargar el archivo desde Storage
        const [contents] = yield file.download();
        const rawData = JSON.parse(contents.toString());
        // El archivo puede ser un objeto o un array. Lo normalizamos.
        let businesses;
        if (Array.isArray(rawData)) {
            businesses = rawData;
        }
        else if (typeof rawData === 'object') {
            // Si es un objeto, convertimos sus valores a array
            businesses = Object.values(rawData);
        }
        else {
            throw new Error('El formato del archivo JSON no es válido.');
        }
        // Aplanar por si hay arrays anidados
        businesses = businesses.flat();
        if (businesses.length === 0) {
            throw new Error('No se encontraron empresas en el archivo.');
        }
        logger.info(`Found ${businesses.length} businesses to import.`);
        let importedCount = 0;
        // Procesar en lotes de 450 (dejamos margen bajo el límite de 500)
        const batchSize = 450;
        for (let i = 0; i < businesses.length; i += batchSize) {
            const batch = db.batch();
            const chunk = businesses.slice(i, i + batchSize);
            chunk.forEach((business) => {
                // Validar que sea un objeto válido con nombre
                if (business && typeof business === 'object' && business.name) {
                    const docRef = db.collection('businesses').doc(); // Auto-generar ID
                    batch.set(docRef, business);
                }
                else {
                    logger.warn('Skipping invalid business object:', business);
                }
            });
            yield batch.commit();
            importedCount += chunk.length;
            logger.info(`✅ Batch committed. Progress: ${importedCount}/${businesses.length} (${Math.round((importedCount / businesses.length) * 100)}%)`);
        }
        const message = `✅ Successfully imported ${importedCount} businesses from Storage.`;
        logger.info(message);
        return {
            success: true,
            message: message,
            imported: importedCount,
            total: businesses.length
        };
    }
    catch (error) {
        logger.error('❌ Error importing from Storage:', error);
        if (error.code === 404) {
            throw new https_1.HttpsError('not-found', `El archivo 'BD_Espana_faderbase_extended.json' no se encontró en el bucket de almacenamiento. Verifica que el archivo existe en Storage.`);
        }
        throw new https_1.HttpsError('internal', `Error durante la importación: ${error.message}`);
    }
}));
exports.checkFreelancerGreenCard = (0, firestore_2.onDocumentUpdated)({ document: 'wallets/{uid}', region: 'europe-west1' }, (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g, _h, _j;
    const uid = event.params.uid;
    const beforeData = (_f = event.data) === null || _f === void 0 ? void 0 : _f.before.data();
    const afterData = (_g = event.data) === null || _g === void 0 ? void 0 : _g.after.data();
    if (!afterData)
        return;
    const eurBalanceBefore = (beforeData === null || beforeData === void 0 ? void 0 : beforeData.eurBalance) || 0;
    const eurBalanceAfter = (afterData === null || afterData === void 0 ? void 0 : afterData.eurBalance) || 0;
    const usdBalanceAfter = (afterData === null || afterData === void 0 ? void 0 : afterData.usdBalance) || 0;
    const notified20Euro = (afterData === null || afterData === void 0 ? void 0 : afterData.notified20Euro) === true;
    // Check if balance is >= 20 (in EUR or USD) and we haven't notified them yet
    if ((eurBalanceAfter >= 20 || usdBalanceAfter >= 20) && !notified20Euro) {
        // Fetch user profile to verify it exists
        const profileSnap = yield db.collection('private_profiles').doc(uid).get();
        if (!profileSnap.exists)
            return;
        const profileData = profileSnap.data();
        const email = profileData === null || profileData === void 0 ? void 0 : profileData.email;
        const name = (profileData === null || profileData === void 0 ? void 0 : profileData.name) || (profileData === null || profileData === void 0 ? void 0 : profileData.firstName) || 'Colaborador';
        if (!email) {
            logger.warn(`User ${uid} has >= 20 but no email found. Skipping notification.`);
            return;
        }
        logger.info(`Collaborator ${uid} reached 20 $ o €! Sending notifications...`);
        // 1. Update the wallet FIRST to prevent duplicate triggers if the email fails or takes long
        yield ((_h = event.data) === null || _h === void 0 ? void 0 : _h.after.ref.update({ notified20Euro: true }));
        const currencySymbol = eurBalanceAfter >= 20 ? '€' : '$';
        const balanceAmount = eurBalanceAfter >= 20 ? eurBalanceAfter : usdBalanceAfter;
        // 2. Prepare and send emails
        const emailHtmlUser = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>¡Felicidades ${name}! 🎉</h2>
            <p>Queríamos notificarte que has alcanzado o superado los <strong>20 ${currencySymbol}</strong> en tu Tarjeta Verde (Balance actual: ${balanceAmount.toFixed(2)} ${currencySymbol}).</p>
            <p>Ya puedes solicitar la transacción o retiro de tus fondos desde tu panel de control de Dicilo.</p>
            <p>¡Sigue con el excelente trabajo!</p>
            <br/>
            <p>El equipo de Dicilo.</p>
        </div>
      `;
        const emailHtmlAdmin = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Notificación de Balance de Colaborador</h2>
            <p>El colaborador/referidor <strong>${name}</strong> (Email: ${email}, UID: ${uid}, Rol: ${(profileData === null || profileData === void 0 ? void 0 : profileData.role) || 'user'}) ha alcanzado un balance en su Tarjeta Verde de <strong>${balanceAmount.toFixed(2)} ${currencySymbol}</strong>.</p>
            <p>Por favor, revisa su cuenta en el panel de administración, ya que está habilitado para realizar una transacción.</p>
        </div>
      `;
        try {
            // Send email to Collaborator
            yield (0, email_1.sendMail)({
                to: email,
                subject: `¡Felicidades! Has alcanzado 20 ${currencySymbol} en tu Tarjeta Verde`,
                html: emailHtmlUser,
            });
            // Send email to Administration
            yield (0, email_1.sendMail)({
                to: 'support@dicilo.net',
                subject: `Aviso: El colaborador ${name} ha alcanzado 20 ${currencySymbol}`,
                html: emailHtmlAdmin,
            });
            logger.info(`Successfully sent 20 Euro/USD notification emails for collaborator ${uid}`);
        }
        catch (error) {
            logger.error(`Error sending 20 Euro/USD emails for ${uid}:`, error);
            // If email fails, revert the flag so it triggers again on next update
            yield ((_j = event.data) === null || _j === void 0 ? void 0 : _j.after.ref.update({ notified20Euro: admin.firestore.FieldValue.delete() }));
        }
    }
}));
