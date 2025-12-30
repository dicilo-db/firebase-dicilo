/**
 * @fileoverview Cloud Functions for Firebase (Gen 2).
 * Migrated to Gen 2 to support Node 20 and explicit CPU/Memory configuration.
 */
import { onDocumentWritten, onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import * as logger from 'firebase-functions/logger';
import { Lang, getEmailI18n, render } from './i18n';
import { sendMail } from './email';
import _ from 'lodash';
import * as businessesToSeed from './seed-data.json';

// Initialize Firebase Admin SDK
try {
  admin.initializeApp();
} catch (e) {
  // App already initialized, ignore
}

// Set global options for all functions (Gen 2 specific)
setGlobalOptions({ region: 'europe-west1', memory: '512MiB' });

// Replace getDb() with db
const db = admin.firestore();

// --- Admin Role Management (v2) ---

export const onAdminWrite = onDocumentWritten('admins/{uid}', async (event) => {
  const uid = event.params.uid;
  // In v2, event.data is a Change object with before/after
  const change = event.data;

  if (!change) {
    return; // Should not happen for onWrite
  }

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
      const user = await admin.auth().getUser(uid);
      if (user.customClaims?.admin === true || user.customClaims?.role) {
        await admin.auth().setCustomUserClaims(uid, { admin: null, role: null });
        await admin.auth().revokeRefreshTokens(uid); // Force re-login to apply new claims
        logger.info(
          `Successfully revoked admin claim and refresh tokens for ${uid}.`
        );
      }
    } catch (error) {
      logger.error(`Error revoking admin claim for ${uid}:`, error);
    }
    return;
  }

  // If a role of 'admin' or 'superadmin' is set, grant the claims.
  if (roleAfter === 'admin' || roleAfter === 'superadmin') {
    logger.info(
      `Role document for user ${uid} written with role: ${roleAfter}. Setting/Verifying custom claims.`
    );
    try {
      await admin.auth().setCustomUserClaims(uid, {
        admin: true,
        role: roleAfter,
      });
      await admin.auth().revokeRefreshTokens(uid);
      logger.info(
        `Successfully SET/FORCED custom claims for ${uid} with role ${roleAfter} and revoked refresh tokens.`
      );
    } catch (error) {
      logger.error(`Error setting custom claims for ${uid}:`, error);
    }
  }
});

// --- Registration Handlers (v2) ---

export const sendRegistrationToErp = onDocumentCreated('registrations/{registrationId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

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
});

export const notifyAdminOnRegistration = onDocumentCreated('registrations/{registrationId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  const registrationId = event.params.registrationId;

  const adminEmail = 'support@dicilo.net';
  const subject = `New Registration: ${data.firstName} ${data.lastName}`;

  const html = `
    <h1>New Registration on Dicilo</h1>
    <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>WhatsApp:</strong> ${data.whatsapp || 'N/A'}</p>
    <p><strong>Type:</strong> ${data.registrationType}</p>
    <p><strong>ID:</strong> ${registrationId}</p>
    
    ${data.businessName
      ? `
      <hr/>
      <h2>Business Details</h2>
      <p><strong>Business Name:</strong> ${data.businessName}</p>
      <p><strong>Category:</strong> ${data.category || 'N/A'}</p>
      <p><strong>Location:</strong> ${data.location || 'N/A'}</p>
      <p><strong>Address:</strong> ${data.address || 'N/A'}</p>
      <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
      <p><strong>Website:</strong> ${data.website || 'N/A'}</p>
      <p><strong>Description:</strong><br/>${data.description || 'N/A'}</p>
    `
      : ''
    }
    
    <br/>
    <p>This is an automated message from Dicilo Firebase Functions.</p>
  `;

  try {
    await sendMail({
      to: adminEmail,
      subject: subject,
      html: html,
    });
    logger.info(`Admin notification sent for registration ${registrationId}`);
  } catch (error) {
    logger.error(
      `Failed to send admin notification for ${registrationId}:`,
      error
    );
  }
});

export const notifyAdminOnTopUp = onDocumentCreated('transaction_requests/{requestId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  const requestId = event.params.requestId;

  const adminEmail = 'support@dicilo.net';
  const subject = `Neue Aufladeanfrage: ${data.amount}€ von Client ${data.clientId}`;

  const html = `
    <h1>Neue Guthaben-Anfrage (Wallet)</h1>
    <p>Ein Kunde hat eine Aufladung angefordert.</p>
    <hr/>
    <p><strong>Client ID:</strong> ${data.clientId}</p>
    <p><strong>Email:</strong> ${data.clientEmail || 'N/A'}</p>
    <p><strong>Betrag:</strong> ${data.amount}€</p>
    <p><strong>Request ID:</strong> ${requestId}</p>
    <p><strong>Zeitpunkt:</strong> ${data.createdAt ? data.createdAt.toDate().toLocaleString() : new Date().toLocaleString()}</p>
    
    <br/>
    <h3>Aktion erforderlich:</h3>
    <ol>
      <li>Rechnung an Kunden senden (${data.amount}€).</li>
      <li>Nach Zahlungseingang: Im Admin-Panel Guthaben manuell buchen.</li>
    </ol>
    
    <p>Dies ist eine automatische Nachricht von Dicilo Firebase Functions.</p>
  `;

  try {
    await sendMail({
      to: adminEmail,
      subject: subject,
      html: html,
    });
    logger.info(`Admin notification sent for wallet top-up request ${requestId}`);
  } catch (error) {
    logger.error(
      `Failed to send admin notification for top-up request ${requestId}:`,
      error
    );
  }
});

export const sendWelcomeEmail = onDocumentCreated('registrations/{registrationId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  const registrationId = event.params.registrationId;
  const email = data.email;
  const name = `${data.firstName} ${data.lastName}`;

  if (!email) {
    logger.warn(`No email found for registration ${registrationId}, skipping welcome email.`);
    return;
  }

  const subject = 'Willkommen bei Dicilo - Ihre Registrierung war erfolgreich!';

  // Simple HTML template for welcome email
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Willkommen bei Dicilo, ${data.firstName}!</h1>
      <p>Vielen Dank für Ihre Registrierung. Wir freuen uns, Sie in unserem Netzwerk begrüßen zu dürfen.</p>
      
      <p>Sie können sich jetzt in Ihrem Dashboard anmelden, um Ihr Profil zu verwalten:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://dicilo-search.web.app/login" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Zum Dashboard</a>
      </div>

      <p>Falls Sie Fragen haben, stehen wir Ihnen gerne zur Verfügung.</p>
      
      <p>Mit freundlichen Grüßen,<br/>Ihr Dicilo Team</p>
    </div>
  `;

  try {
    await sendMail({
      to: email,
      subject: subject,
      html: html,
    });
    logger.info(`Welcome email sent to ${email} for registration ${registrationId}`);
  } catch (error) {
    logger.error(
      `Failed to send welcome email to ${email}:`,
      error
    );
  }
});

// --- Sync & Tools (v2) ---

export const syncExistingCustomersToErp = onCall(async (request) => {
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
});

// --- Recommendation Engine (v2) ---

export const submitRecommendation = onCall(async (request) => {
  const data = request.data;
  const { recommenderName, recommenderEmail, recipients, clientId, lang } = data;
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

  const recommendationRef = db.doc(`recommendations/${recommendationId}`);
  batch.set(recommendationRef, {
    recommenderName,
    recommenderEmail,
    clientId,
    lang,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'pending',
    recipientsCount: recipients.length,
    acceptedCount: 0,
  });

  for (const recipient of recipients) {
    const taskId = db.collection('recommendation_tasks').doc().id;
    const taskRef = db.doc(`recommendation_tasks/${taskId}`);
    batch.set(taskRef, {
      recommendationId,
      recipientName: recipient.name,
      recipientContact: recipient.email || recipient.whatsapp,
      contactType: recipient.email ? 'email' : 'whatsapp',
      status: 'pending', // pending, sent, accepted, declined
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      clientId,
      lang,
      recommenderName,
    });
  }

  await batch.commit();
  return { success: true, recommendationId };
});

export const taskWorker = onDocumentCreated('recommendation_tasks/{taskId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const task = snapshot.data();
  if (!task) return logger.info('No data in task, exiting.');

  const {
    recipientName,
    recipientContact,
    lang,
    recommenderName,
    contactType,
  } = task;
  const i18n = await getEmailI18n(lang as Lang, db);
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
    await event.data?.ref.update({
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});

const handleConsent = async (
  req: any, // v2 Request type is compatible with Express req
  res: any, // v2 Response type is compatible with Express res
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
    handledAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  if (newStatus === 'accepted') {
    const recommendationRef = db.doc(
      `recommendations/${taskSnap.data()?.recommendationId}`
    );
    await recommendationRef.update({ acceptedCount: admin.firestore.FieldValue.increment(1) });
  }

  res
    .status(200)
    .send(`Thank you! Your choice has been registered as: ${newStatus}`);
};

export const consentAccept = onRequest((req, res) => handleConsent(req, res, 'accepted'));

export const consentDecline = onRequest((req, res) => handleConsent(req, res, 'declined'));

// --- Business Tools (v2) ---

// Forced redeploy for promotion fix verification
export const promoteToClient = onCall(async (request) => {
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

  const data = request.data;
  const { businessId, clientType } = data;
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
});

// --- Seeding (v2) ---

import seedData from './seed-data-extended.json';

// Helper to geocode address
const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
  if (!address || address === '???' || address.length < 5) return null;
  try {
    // Add delay to respect Nominatim rate limits (1 request per second)
    await new Promise(resolve => setTimeout(resolve, 1100));

    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'DiciloApp/1.0'
      }
    });

    if (response.data && response.data.length > 0) {
      return [parseFloat(response.data[0].lat), parseFloat(response.data[0].lon)];
    }
    return null;
  } catch (error) {
    logger.error(`Geocoding error for ${address}:`, error);
    return null;
  }
};

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');

export const seedDatabase = onRequest({ timeoutSeconds: 540, memory: '512MiB' }, async (req, res) => {
  const businessesCollection = db.collection('businesses');
  let count = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  try {
    for (const business of seedData) {
      const businessId = slugify(business.name);
      if (!businessId) continue;

      const docRef = businessesCollection.doc(businessId);
      const docSnap = await docRef.get();

      // Skip if already exists and has coords
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data?.coords) {
          skippedCount++;
          continue;
        }
      }

      let coords = null;
      // Try to geocode if address exists and is valid
      if (business.address && business.address !== '???') {
        logger.info(`Geocoding ${business.name}...`);
        coords = await geocodeAddress(business.address);
      }

      await docRef.set({
        ...business,
        coords: coords,
        createdAt: docSnap.exists ? docSnap.data()?.createdAt : admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'verified'
      }, { merge: true });

      if (docSnap.exists) updatedCount++;
      else count++;

      logger.info(`Processed ${business.name} (Coords: ${coords ? 'YES' : 'NO'})`);
    }

    const message = `Seeding complete. Created: ${count}, Updated: ${updatedCount}, Skipped: ${skippedCount}`;
    logger.info(message);
    res.status(200).send(message);
  } catch (error: any) {
    logger.error('Error seeding database:', error);
    res.status(500).send(`Error seeding database: ${error.message}`);
  }
});

export const cleanupDuplicates = onRequest({ timeoutSeconds: 540, memory: '512MiB' }, async (req, res) => {
  const businessesCollection = db.collection('businesses');

  try {
    const snapshot = await businessesCollection.get();
    const businessesByName: { [key: string]: FirebaseFirestore.QueryDocumentSnapshot[] } = {};

    // Group by name
    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const name = data.name;
      if (name) {
        if (!businessesByName[name]) {
          businessesByName[name] = [];
        }
        businessesByName[name].push(doc);
      }
    });

    let deletedCount = 0;
    const batch = db.batch();
    let batchCount = 0;

    for (const name in businessesByName) {
      const docs = businessesByName[name];
      if (docs.length > 1) {
        // Sort: prefer docs with coords, then by ID length (slugs are usually cleaner/shorter than auto-ids? No, auto-ids are 20 chars. Slugs vary.
        // Better heuristic: Prefer the one where ID == slugify(name).
        // Or simply: prefer the one with coords.

        // Let's sort so the "best" one is first.
        docs.sort((a, b) => {
          const dataA = a.data();
          const dataB = b.data();

          // Prefer having coords
          if (dataA.coords && !dataB.coords) return -1;
          if (!dataA.coords && dataB.coords) return 1;

          // Prefer ID that matches slugify(name)
          const slug = slugify(name);
          if (a.id === slug) return -1;
          if (b.id === slug) return 1;

          // Prefer newer
          // @ts-ignore
          return b.createTime.toMillis() - a.createTime.toMillis();
        });

        // Keep the first one, delete the rest
        const toDelete = docs.slice(1);
        for (const doc of toDelete) {
          batch.delete(doc.ref);
          deletedCount++;
          batchCount++;

          if (batchCount >= 400) {
            await batch.commit();
            batchCount = 0;
          }
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    const message = `Cleanup complete. Deleted ${deletedCount} duplicate businesses.`;
    logger.info(message);
    res.status(200).send(message);

  } catch (error: any) {
    logger.error('Error cleaning up duplicates:', error);
    res.status(500).send(`Error cleaning up duplicates: ${error.message}`);
  }
});

// --- Telegram Bot ---
export * from './telegram';
export * from './userManagement';

// --- Pioneer Referrals System ---
export * from './pioneer-referrals';

// --- Category Counters ---
export * from './categories';

