import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export interface MailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}

export async function sendSmtpEmail({ to, subject, html, from }: MailOptions) {
    const mailOptions = {
        from: from || process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending SMTP email:', error);
        return { success: false, error };
    }
}
