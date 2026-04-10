import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = getFirestore();
const auth = getAuth();

async function checkCompany() {
    try {
        const clientsRef = db.collection('clients');
        const snapshot = await clientsRef.where('clientName', '>=', 'Hör').where('clientName', '<=', 'Hör\uf8ff').get();
        console.log(`Encontrados ${snapshot.size} clientes`);
        snapshot.forEach(doc => {
            console.log(doc.id, '=>', doc.data().clientName, '| email:', doc.data().email, '| ownerUid:', doc.data().ownerUid);
        });
        
        // let's also check for 'Hoer'
        const snapshot2 = await clientsRef.where('clientName', '>=', 'Hoer').where('clientName', '<=', 'Hoer\uf8ff').get();
        snapshot2.forEach(doc => {
            console.log("Variante Hoer:", doc.id, '=>', doc.data().clientName, '| email:', doc.data().email, '| ownerUid:', doc.data().ownerUid);
        });
    } catch (e) {
        console.error(e);
    }
}
checkCompany();
