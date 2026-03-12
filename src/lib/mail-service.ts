import nodemailer from 'nodemailer';

// Helper to clean environment variables (remove potential quotes)
const cleanEnv = (val: string | undefined) => {
    if (!val) return undefined;
    return val.replace(/^['"]|['"]$/g, '');
};

function getTransporter() {
    const host = cleanEnv(process.env.SMTP_HOST);
    const port = Number(cleanEnv(process.env.SMTP_PORT) || 587);
    const user = cleanEnv(process.env.SMTP_USER);
    const pass = cleanEnv(process.env.SMTP_PASS);

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
        },
        // Increase timeout for slow smtp servers
        connectionTimeout: 10000, 
        greetingTimeout: 10000,
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

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error('Error sending SMTP email:', error);
        // Ensure error is serializable for Server Actions
        return { 
            success: false, 
            error: error.message || String(error),
            code: error.code,
            command: error.command
        };
    }
}
