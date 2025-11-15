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
exports.promoteToClient = exports.seedDatabaseCallable = exports.consentDecline = exports.consentAccept = exports.taskWorker = exports.submitRecommendation = exports.syncExistingCustomersToErp = exports.sendRegistrationToErp = exports.onAdminWrite = void 0;
// functions/src/index.ts
/**
 * @fileoverview Cloud Functions for Firebase.
 * This file contains the backend logic for setting custom claims on users.
 */
const functions = __importStar(require("firebase-functions"));
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const axios_1 = __importDefault(require("axios"));
const firestore_2 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const i18n_1 = require("./i18n");
const email_1 = require("./email");
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
    var _a, _b;
    const task = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
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
    yield ((_b = event.data) === null || _b === void 0 ? void 0 : _b.ref.update({
        status: 'sent',
        sentAt: firestore_1.FieldValue.serverTimestamp(),
    }));
}));
const handleConsent = (req, res, newStatus) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const recommendationRef = db.doc(`recommendations/${(_a = taskSnap.data()) === null || _a === void 0 ? void 0 : _a.recommendationId}`);
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
const clientsToSeed = [
    {
        clientName: 'HörComfort Services Ammersbek',
        clientLogoUrl: 'https://placehold.co/128x128.png',
        clientTitle: 'Willkommen bei HörComfort Services',
        clientSubtitle: 'Ihr Experte für Hörsysteme in Ammersbek.',
        products: [],
        slug: 'horcomfort-services-ammersbek',
        socialLinks: { instagram: '', facebook: '', linkedin: '' },
        strengths: [],
        testimonials: [],
        translations: {},
        clientType: 'retailer',
    },
    {
        clientName: 'Inviajes - Reisen Club',
        clientLogoUrl: 'https://placehold.co/128x128.png',
        clientTitle: 'Inviajes - Reisen Club',
        clientSubtitle: 'Entdecken Sie die Welt mit uns.',
        products: [],
        slug: 'inviajes-reisen-club',
        socialLinks: { instagram: '', facebook: '', linkedin: '' },
        strengths: [],
        testimonials: [],
        translations: {},
        clientType: 'premium',
    },
];
const businessesToSeed = [
    {
        name: 'Ecosierra Perdida Tours',
        category: 'Reise & Tourismus / Reisebüros',
        description: 'Agencia de viajes especializada en tours únicos en Colombia.',
        location: 'Colombia',
        imageUrl: 'https://mhc-int.com/wp-content/uploads/2022/03/EcoSierra_a_mhc_sw.png',
        imageHint: 'colombia travel',
        address: 'Colombia',
        phone: '',
        website: 'https://ecosierraperdidatours.com',
        rating: 4.8,
        category_key: 'category.travel_tourism',
        subcategory_key: 'subcategory.travel_agencies',
        currentOfferUrl: '',
    },
    {
        name: 'Carlota Stockar Viajes y Turismo (EVT)',
        category: 'Reise & Tourismus / Reisebüros',
        description: 'Organización de viajes y turismo en Argentina.',
        location: 'Argentina',
        imageUrl: 'https://mhc-int.com/wp-content/uploads/2022/03/Carlota_Stockar_mhc.png',
        imageHint: 'argentina travel',
        address: 'Argentina',
        phone: '',
        website: 'https://www.carlotastockar.tur.ar/',
        rating: 4.9,
        category_key: 'category.travel_tourism',
        subcategory_key: 'subcategory.travel_agencies',
        currentOfferUrl: '',
    },
];
const doSeedDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    const batch = db.batch();
    businessesToSeed.forEach((business) => {
        const docRef = db.collection('businesses').doc();
        batch.set(docRef, business);
    });
    clientsToSeed.forEach((client) => {
        const docRef = db.collection('clients').doc();
        batch.set(docRef, client);
    });
    yield batch.commit();
    return {
        success: true,
        message: `${businessesToSeed.length} businesses and ${clientsToSeed.length} clients seeded successfully.`,
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
    if (!request.auth || request.auth.token.role !== 'superadmin') {
        throw new https_1.HttpsError('permission-denied', 'Only superadmins can perform this action.');
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
        const clientRef = db.collection('clients').doc();
        yield clientRef.set(clientData);
        return {
            success: true,
            message: `Business ${businessData.name} has been promoted to a ${clientType} client with ID ${clientRef.id}.`,
            clientId: clientRef.id,
        };
    }
    catch (error) {
        logger.error('Error promoting business:', error);
        throw new https_1.HttpsError('internal', error.message || 'Failed to promote business.');
    }
}));
