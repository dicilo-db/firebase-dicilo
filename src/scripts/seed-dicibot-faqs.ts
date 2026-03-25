import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { faqsData } from '../data/faqs';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Use environment variable that contains the JSON string
const serviceAccountKeyStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKeyStr) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local");
}

let serviceAccount;
try {
    // Some env strings are wrapped in quotes, let's parse safely
    let cleanStr = serviceAccountKeyStr.trim();
    if (cleanStr.startsWith("'") && cleanStr.endsWith("'")) {
        cleanStr = cleanStr.slice(1, -1);
    }
    serviceAccount = JSON.parse(cleanStr);
} catch (error) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON");
    throw error;
}

if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function seedFaqs() {
    console.log("Starting FAQ Seeding into Dicibot Knowledge Base...");
    let successCount = 0;

    for (const faq of faqsData.es) {
        try {
            const factText = `Pregunta: ${faq.pregunta}\nRespuesta: ${faq.respuesta}`;
            
            await db.collection('ai_knowledge_snippets').add({
                text: factText,
                createdAt: FieldValue.serverTimestamp(),
                category: faq.categoria || 'general'
            });
            successCount++;
        } catch (e) {
            console.error(`Error adding FAQ ID ${faq.id}:`, e);
        }
    }

    console.log(`Successfully seeded ${successCount} FAQs into the AI Knowledge Base!`);
}

seedFaqs().catch(console.error);
