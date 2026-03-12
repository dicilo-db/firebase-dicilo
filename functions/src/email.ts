import nodemailer from 'nodemailer';
import { decrypt } from './encryption';
import * as admin from 'firebase-admin';

export type MailInput = { to: string; subject: string; html: string };

export async function sendMail(input: MailInput) {
  const mode = process.env.MAIL_MODE || 'gmail'; // "gmail" | "smtp" | "disabled"
  if (mode === 'disabled') return { ok: true, id: 'disabled' };

  if (mode === 'gmail') {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_SENDER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      },
    });
    const info = await transporter.sendMail({
      from: process.env.GMAIL_SENDER,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return { ok: true, id: info.messageId };
  }

  let pass = process.env.SMTP_PASS;
  const encryptionKey = process.env.ENCRYPTION_KEY;

  if (pass?.startsWith('enc:') && encryptionKey) {
    try {
      pass = decrypt(pass.substring(4), encryptionKey);
    } catch (e) {
      console.error("Failed to decrypt SMTP pass in function", e);
    }
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: { user: process.env.SMTP_USER, pass: pass },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  let logDocRef: any = null;
  const startTime = Date.now();

  try {
    const db = admin.firestore();
    logDocRef = db.collection('mail_logs').doc();

    await logDocRef.set({
      to: input.to,
      subject: input.subject,
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      status: 'pending',
      createdAt: new Date(),
      source: 'cloud-function'
    });
  } catch (dbError) {
    console.error("Failed to initialize mail log in Firestore (Functions):", dbError);
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (logDocRef) {
        await logDocRef.update({
          status: 'success',
          messageId: info.messageId,
          durationMs: Date.now() - startTime,
          updatedAt: new Date()
        }).catch((e: any) => console.error("Failed to update success log (Functions):", e));
    }

    return { ok: true, id: info.messageId };
  } catch (error: any) {
    console.error("SMTP Error in Function:", error);
    
    if (logDocRef) {
        await logDocRef.update({
          status: 'failed',
          error: error.message || String(error),
          errorCode: error.code,
          durationMs: Date.now() - startTime,
          updatedAt: new Date()
        }).catch((e: any) => console.error("Failed to update failure log (Functions):", e));
    }
    
    throw error;
  }
}
