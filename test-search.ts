import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest } from 'next/server';

if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')) });
}
// We cannot easily import the GET handler directly because it uses NextRequest which requires Next.js environment.
// But we can replicate the logic.
const normalizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

async function run() {
    const db = getFirestore();
    const snap = await db.collection('businesses').where('name', '==', 'Hotel Boato').get();
    console.log(`Found ${snap.size} businesses exactly named 'Hotel Boato'`);
    if (!snap.empty) {
        const b = snap.docs[0].data();
        const searchableText = [b.name, b.description, b.category, b.location, b.address]
          .map(normalizeText)
          .join(' ');
        console.log("Searchable Text:");
        console.log(searchableText);
        console.log("Includes 'hotel boato'? ", searchableText.includes('hotel boato'));
        console.log("Includes 'hotel boate'? ", searchableText.includes('hotel boate'));
    }
}
run();
