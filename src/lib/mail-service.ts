import nodemailer from 'nodemailer';
import { decrypt } from './encryption';
import { getAdminDb } from './firebase-admin';

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

function getTransporter() {
    const host = cleanEnv(process.env.SMTP_HOST);
    const port = Number(cleanEnv(process.env.SMTP_PORT) || 465);
    const user = cleanEnv(process.env.SMTP_USER);
    let pass = cleanEnv(process.env.SMTP_PASS);
    const encryptionKey = cleanEnv(process.env.ENCRYPTION_KEY);

    if (pass?.startsWith('enc:') && encryptionKey) {
        try {
            const cipheredText = pass.substring(4);
            pass = decrypt(cipheredText, encryptionKey);
        } catch (error) {
            console.error('Failed to decrypt SMTP password:', error);
            // Fallback to original pass if decryption fails
        }
    }

    // Diagnostics for production (safe to log presence only)
    console.log('SMTP Diagnostics:', {
        hasHost: !!host,
        hostValue: host, // Host is generally safe to log for debugging
        hasPort: !!port,
        portValue: port,
        hasUser: !!user,
        hasPass: !!pass,
        envMode: process.env.NODE_ENV
    });

    if (!host || !user || !pass) {
        console.error('Missing SMTP configuration:', { host, user, hasPass: !!pass });
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
            user,
            pass,
            // authMethod: 'LOGIN' // Leave it automatic for now as PLAIN failed too
        },
        tls: {
            rejectUnauthorized: false
        },
        debug: true, // Keep debug for now since we are still troubleshooting with user
        logger: true,
        connectionTimeout: 30000, 
        greetingTimeout: 30000,
        socketTimeout: 30000,
    });
}

export interface MailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}

export async function sendSmtpEmail({ to, subject, html, from }: MailOptions) {
    const transporter = getTransporter();
    const fromAddress = from || cleanEnv(process.env.SMTP_FROM) || cleanEnv(process.env.SMTP_USER);

    const mailOptions = {
        from: fromAddress,
        to,
        subject,
        html,
    };

    const startTime = Date.now();
    let logDocRef: any = null;

    try {
        const db = getAdminDb();
        logDocRef = db.collection('mail_logs').doc();
        
        await logDocRef.set({
            to,
            subject,
            from: fromAddress,
            status: 'pending',
            createdAt: new Date(),
            source: 'app-server-action'
        });
    } catch (dbError) {
        console.error('Failed to initialize mail log in Firestore:', dbError);
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);

        if (logDocRef) {
            await logDocRef.update({
                status: 'success',
                messageId: info.messageId,
                durationMs: Date.now() - startTime,
                updatedAt: new Date()
            }).catch((e: Error) => console.error('Failed to update success log:', e));
        }

        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error('Error sending SMTP email:', error);
        
        if (logDocRef) {
            await logDocRef.update({
                status: 'failed',
                error: error.message || String(error),
                errorCode: error.code,
                durationMs: Date.now() - startTime,
                updatedAt: new Date()
            }).catch((e: Error) => console.error('Failed to update failure log:', e));
        }

        return { 
            success: false, 
            error: error.message || String(error),
            code: error.code,
            command: error.command
        };
    }
}
