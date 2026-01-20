import * as dotenv from 'dotenv';
dotenv.config();
import { sendMail } from './email';

async function main() {
    console.log('Testing email sending...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_USER:', process.env.SMTP_USER);

    try {
        const result = await sendMail({
            to: 'support@dicilo.net',
            subject: 'Test Email from Local Script',
            html: '<p>This is a test email to verify SMTP credentials.</p>',
        });
        console.log('Email sent successfully:', result);
    } catch (error) {
        console.error('Failed to send email:', error);
    }
}

main();
