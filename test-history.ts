import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getManualPaymentHistory } from './src/app/actions/wallet';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')) });
}

async function run() {
    const res = await getManualPaymentHistory();
    console.log(res.data?.slice(0, 5).map(x => ({ userId: x.userId, userCode: x.userCode })));
}
run();
