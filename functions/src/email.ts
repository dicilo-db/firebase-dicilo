import nodemailer from 'nodemailer';
import { decrypt } from './encryption';
import * as admin from 'firebase-admin';

export type MailInput = { to: string; subject: string; html: string };

// Helper to clean environment variables (remove potential quotes)
const cleanEnv = (val: string | undefined) => {
  if (!val) return undefined;
  const trimmed = val.trim();
  // Only remove quotes if they wrap the entire string as a pair
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || 
      (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

export async function sendMail(input: MailInput) {
  const mode = cleanEnv(process.env.MAIL_MODE) || 'gmail'; // "gmail" | "smtp" | "disabled"
  if (mode === 'disabled') return { ok: true, id: 'disabled' };

  if (mode === 'gmail') {
    const gmailSender = cleanEnv(process.env.GMAIL_SENDER);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: gmailSender,
        clientId: cleanEnv(process.env.GMAIL_CLIENT_ID),
        clientSecret: cleanEnv(process.env.GMAIL_CLIENT_SECRET),
        refreshToken: cleanEnv(process.env.GMAIL_REFRESH_TOKEN),
      },
    });
    const info = await transporter.sendMail({
      from: gmailSender,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return { ok: true, id: info.messageId };
  }

  const host = cleanEnv(process.env.SMTP_HOST);
  const port = Number(cleanEnv(process.env.SMTP_PORT) || 587);
  const user = cleanEnv(process.env.SMTP_USER);
  let pass = cleanEnv(process.env.SMTP_PASS);
  const encryptionKey = cleanEnv(process.env.ENCRYPTION_KEY);
  const fromAddress = cleanEnv(process.env.SMTP_FROM) || user;

  if (pass?.startsWith('enc:') && encryptionKey) {
    try {
      pass = decrypt(pass.substring(4), encryptionKey);
    } catch (e) {
      console.error("Failed to decrypt SMTP pass in function", e);
    }
  }

  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465, // true for 465, false for other ports
    auth: { user: user, pass: pass },
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
      from: fromAddress,
      status: 'pending',
      createdAt: new Date(),
      source: 'cloud-function'
    });
  } catch (dbError) {
    console.error("Failed to initialize mail log in Firestore (Functions):", dbError);
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
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
