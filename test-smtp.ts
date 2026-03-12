import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Import after config
import { sendSmtpEmail } from './src/lib/mail-service';

async function test() {
    console.log('Testing SMTP with Host:', process.env.SMTP_HOST);
    console.log('Testing SMTP with User:', process.env.SMTP_USER);
    
    const result = await sendSmtpEmail({
        to: 'niloescolar.de@gmail.com',
        subject: 'Test Local SMTP v2',
        html: '<b>Hello from localhost v2!</b>'
    });
    console.log('Result:', JSON.stringify(result, null, 2));
}

test();
