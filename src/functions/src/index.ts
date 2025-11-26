// functions/src/index.ts
/**
 * @fileoverview Cloud Functions for Firebase.
 * This file contains the backend logic for setting custom claims on users.
 */
import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { Lang, getEmailI18n, render } from './i18n';
import { sendMail } from './email';
import _ from 'lodash';
import * as businessesToSeed from './seed-data.json';

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

/**
 * Sets custom claims on a user to grant admin privileges. This function is triggered
 * automatically when a document in the 'admins' collection is created or updated.
 * This is a v1 function for robustness and reliability.
 */
export const onAdminWrite = functions
  .region('europe-west1')
  .firestore.document('admins/{uid}')
  .onWrite(async (change, context) => {
    const uid = context.params.uid;
    const afterData = change.after.data();

    const roleAfter = afterData?.role;

    // If the document is deleted or the role is removed, revoke admin claims.
    if (
      !change.after.exists ||
      (roleAfter !== 'admin' && roleAfter !== 'superadmin')
    ) {
      logger.info(
        `Admin role removed for user ${uid}. Revoking admin custom claim.`
      );
      try {
        // Check current claims before setting new ones to prevent unnecessary updates
        const user = await getAuth().getUser(uid);
        if (user.customClaims?.admin === true || user.customClaims?.role) {
          await getAuth().setCustomUserClaims(uid, { admin: null, role: null });
          await getAuth().revokeRefreshTokens(uid); // Force re-login to apply new claims
          logger.info(
            `Successfully revoked admin claim and refresh tokens for ${uid}.`
          );
        } else {
          logger.info(
            `User ${uid} had no admin claims to revoke. No action taken.`
          );
        }
      } catch (error) {
        logger.error(`Error revoking admin claim for ${uid}:`, error);
      }
      return null;
    }

    // If a role of 'admin' or 'superadmin' is set, grant the claims.
    if (roleAfter === 'admin' || roleAfter === 'superadmin') {
      logger.info(
        `Role document for user ${uid} written with role: ${roleAfter}. Setting/Verifying custom claims.`
      );
      try {
        const user = await getAuth().getUser(uid);
        // Force update claims even if they appear to be the same, to fix inconsistencies.
        await getAuth().setCustomUserClaims(uid, {
          admin: true,
          role: roleAfter,
        });
        await getAuth().revokeRefreshTokens(uid); // Force re-login to apply new claims
        logger.info(
          `Successfully SET/FORCED custom claims for ${uid} with role ${roleAfter} and revoked refresh tokens.`
        );
      } catch (error) {
        logger.error(`Error setting custom claims for ${uid}:`, error);
      }
    }
    return null;
  });

export const sendRegistrationToErp = onDocumentCreated(
  { document: 'registrations/{registrationId}', region: 'europe-west1' },
  async (event) => {
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

    logger.info(
      `New registration detected: ${registrationId}. Sending to ERP...`
    );

    const payload = {
      ...newData,
      id: registrationId,
      planId: `plan_${newData.registrationType}`,
    };

    try {
      await axios.post(ERP_RECEIVER_URL, payload, {
        headers: { 'x-api-key': SECRET_API_KEY },
      });
      logger.info(`Registration ${registrationId} sent to ERP successfully.`);
    } catch (error: any) {
      logger.error(
        `Failed to send registration ${registrationId} to ERP:`,
        error.message
      );
    }
  }
);

export const syncExistingCustomersToErp = onCall(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth || request.auth.token.role !== 'superadmin') {
      throw new HttpsError(
        'permission-denied',
        'Only superadmins can perform this action.'
      );
    }

    const ERP_RECEIVER_URL = process.env.ERP_RECEIVER_URL;
    const SECRET_API_KEY = process.env.ERP_API_KEY;

    if (!ERP_RECEIVER_URL || !SECRET_API_KEY) {
      logger.error('Config Error! ERP URL or secret key not defined.');
      throw new HttpsError('internal', 'Config error. Contact an admin.');
    }

    logger.info('--- Sync started ---');

    try {
      const registrationsSnapshot = await db.collection('registrations').get();
      if (registrationsSnapshot.empty) {
        return { success: true, newCount: 0, message: 'No customers to sync.' };
      }

      let successCount = 0;
      const promises = registrationsSnapshot.docs.map(async (doc) => {
        const registrationData = doc.data();
        const regId = doc.id;
        const payload = {
          id: regId,
          ...registrationData,
          planId: `plan_${registrationData.registrationType}`,
        };

        try {
          await axios.post(ERP_RECEIVER_URL!, payload, {
            headers: { 'x-api-key': SECRET_API_KEY! },
          });
          successCount++;
        } catch (error) {
          logger.error(`Error syncing customer ${regId}:`, error);
        }
      });

      await Promise.all(promises);

      logger.info(
        `Success! Synced ${successCount} of ${registrationsSnapshot.size} customers.`
      );
      return {
        success: true,
        newCount: successCount,
        message: `Synced ${successCount} customers.`,
      };
    } catch (error: any) {
      logger.error('--- ERROR DURING SYNC ---:', error);
      throw new HttpsError('internal', `Unexpected error: ${error.message}`);
    }
  }
);

// --- Recommendation Engine ---
export const submitRecommendation = onCall(
  { region: 'europe-west1' },
  async (req) => {
    // Basic validation
    const { recommenderName, recommenderEmail, recipients, clientId, lang } =
      req.data;
    if (
      !recommenderName ||
      !recommenderEmail ||
      !recipients?.length ||
      !clientId ||
      !lang
    ) {
      throw new HttpsError('invalid-argument', 'Missing required fields.');
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
      createdAt: FieldValue.serverTimestamp(),
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
        createdAt: FieldValue.serverTimestamp(),
        clientId,
        lang,
        recommenderName,
      });
    }

    await batch.commit();
    return { success: true, recommendationId };
  }
);

export const taskWorker = onDocumentCreated(
  { document: 'recommendation_tasks/{taskId}', region: 'europe-west1' },
  async (event) => {
    const task = event.data?.data();
    if (!task) return logger.info('No data in task, exiting.');

    const {
      recipientName,
      recipientContact,
      lang,
      recommenderName,
      contactType,
    } = task;
    const i18n = await getEmailI18n(lang as Lang);
    const acceptUrl = `https://europe-west1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/consentAccept?taskId=${event.params.taskId}`;
    const declineUrl = `https://europe-west1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/consentDecline?taskId=${event.params.taskId}`;

    if (contactType === 'email') {
      const html = render(i18n['consent.body'], {
        recipientName,
        name: recommenderName,
        cta_accept: `<a href="${acceptUrl}"><b>${i18n['consent.cta.accept']}</b></a>`,
        cta_decline: `<a href="${declineUrl}"><b>${i18n['consent.cta.decline']}</b></a>`,
      });
      await sendMail({
        to: recipientContact,
        subject: render(i18n['consent.subject'], { name: recommenderName }),
        html,
      });
    }
    await event.data?.ref.update({
      status: 'sent',
      sentAt: FieldValue.serverTimestamp(),
    });
  }
);

const handleConsent = async (
  req: functions.https.Request,
  res: functions.Response,
  newStatus: 'accepted' | 'declined'
) => {
  const taskId = req.query.taskId as string;
  if (!taskId) {
    res.status(400).send('Missing taskId parameter.');
    return;
  }
  const taskRef = db.doc(`recommendation_tasks/${taskId}`);
  const taskSnap = await taskRef.get();
  if (!taskSnap.exists) {
    res.status(404).send('Task not found.');
    return;
  }

  await taskRef.update({
    status: newStatus,
    handledAt: FieldValue.serverTimestamp(),
  });

  if (newStatus === 'accepted') {
    const recommendationRef = db.doc(
      `recommendations/${taskSnap.data()?.recommendationId}`
    );
    await recommendationRef.update({ acceptedCount: FieldValue.increment(1) });
  }

  res
    .status(200)
    .send(`Thank you! Your choice has been registered as: ${newStatus}`);
};

export const consentAccept = functions
  .region('europe-west1')
  .https.onRequest((req, res) => handleConsent(req, res, 'accepted'));
export const consentDecline = functions
  .region('europe-west1')
  .https.onRequest((req, res) => handleConsent(req, res, 'declined'));

const doSeedDatabase = async () => {
  const batch = db.batch();

  // This is the robust way to handle direct JSON imports with varying module structures.
  const data = Object.values(businessesToSeed);

  // The imported data can sometimes be nested, so we flatten it.
  const businesses = data.flat();

  if (!Array.isArray(businesses) || businesses.length === 0) {
    logger.error('Seed data is not an array or is empty after processing.', {
      importedData: businessesToSeed,
    });
    throw new Error(
      'Formato de datos de origen no válido o vacío. Se esperaba un array de objetos.'
    );
  }

  logger.info(`Found ${businesses.length} businesses to seed.`);

  businesses.forEach((business: any) => {
    // Basic validation to ensure it's a valid business object
    if (business && typeof business === 'object' && business.name) {
      const docRef = db.collection('businesses').doc(); // Auto-generate ID
      batch.set(docRef, business);
    } else {
      logger.warn('Skipping invalid business object in seed data:', business);
    }
  });

  await batch.commit();
  return {
    success: true,
    message: `${businesses.length} businesses from seed-data.json have been seeded.`,
  };
};

export const seedDatabaseCallable = onCall(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth || request.auth.token.role !== 'superadmin') {
      throw new HttpsError(
        'permission-denied',
        'Only superadmins can perform this action.'
      );
    }

    try {
      return await doSeedDatabase();
    } catch (error: any) {
      logger.error('Error seeding database from callable function:', error);
      throw new HttpsError(
        'internal',
        error.message || 'Failed to seed database.'
      );
    }
  }
);

export const promoteToClient = onCall(
  { region: 'europe-west1' },
  async (request) => {
    if (
      !request.auth ||
      (request.auth.token.role !== 'admin' &&
        request.auth.token.role !== 'superadmin')
    ) {
      throw new HttpsError(
        'permission-denied',
        'Only admins or superadmins can perform this action.'
      );
    }

    const { businessId, clientType } = request.data;
    if (
      !businessId ||
      !clientType ||
      (clientType !== 'retailer' && clientType !== 'premium')
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Must provide "businessId" and a valid "clientType".'
      );
    }

    try {
      const businessRef = db.collection('businesses').doc(businessId);
      const businessSnap = await businessRef.get();

      if (!businessSnap.exists) {
        throw new HttpsError(
          'not-found',
          'The specified business does not exist.'
        );
      }

      const businessData = businessSnap.data()!;
      const slugify = (text: string) =>
        text
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '');

      const clientData = {
        clientName: businessData.name,
        slug: slugify(businessData.name),
        clientLogoUrl:
          businessData.imageUrl || 'https://placehold.co/128x128.png',
        clientTitle: `Willkommen bei ${businessData.name}`,
        clientSubtitle: `Entdecken Sie ${businessData.name}`,
        socialLinks: { instagram: '', facebook: '', linkedin: '' },
        products: [],
        strengths: [],
        testimonials: [],
        translations: {},
        clientType: clientType,
      };

      const clientRef = await db.collection('clients').add(clientData);

      return {
        success: true,
        message: `Business ${businessData.name} has been promoted to a ${clientType} client with ID ${clientRef.id}.`,
        clientId: clientRef.id,
      };
    } catch (error: any) {
      logger.error('Error promoting business:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError(
        'internal',
        error.message || 'Failed to promote business.'
      );
    }
  }
);

export const importBusinessesFromStorage = onCall(
  { region: 'europe-west1', timeoutSeconds: 300, memory: '1GiB' },
  async (request) => {
    if (!request.auth || request.auth.token.role !== 'superadmin') {
      throw new HttpsError(
        'permission-denied',
        'Only superadmins can perform this action.'
      );
    }

    const bucket = admin.storage().bucket();
    const file = bucket.file('BD_Espana_faderbase_extended.json');

    try {
      logger.info(
        `Attempting to download file from bucket: ${bucket.name}, path: ${file.name}`
      );

      const [contents] = await file.download();
      const businesses = JSON.parse(contents.toString());

      if (!Array.isArray(businesses)) {
        throw new Error('El archivo JSON no contiene un array de empresas.');
      }

      logger.info(`Found ${businesses.length} businesses to import.`);
      let importedCount = 0;

      const batchSize = 450;
      for (let i = 0; i < businesses.length; i += batchSize) {
        const batch = db.batch();
        const chunk = businesses.slice(i, i + batchSize);

        chunk.forEach((business: any) => {
          if (business && typeof business === 'object' && business.name) {
            const docRef = db.collection('businesses').doc(); // Auto-generate ID
            batch.set(docRef, business);
          }
        });

        await batch.commit();
        importedCount += chunk.length;
        logger.info(
          `Committed batch. Total processed: ${importedCount}/${businesses.length}`
        );
      }

      const message = `${importedCount} empresas importadas correctamente desde Storage.`;
      logger.info(message);
      return { success: true, message: message };
    } catch (error: any) {
      logger.error('Error importing from Storage:', error);
      if (error.code === 404) {
        throw new HttpsError(
          'not-found',
          `El archivo 'BD_Espana_faderbase_extended.json' no se encontró en el bucket de almacenamiento.`
        );
      }
      throw new HttpsError(
        'internal',
        error.message || 'Error desconocido durante la importación desde Storage.'
      );
    }
  }
);
