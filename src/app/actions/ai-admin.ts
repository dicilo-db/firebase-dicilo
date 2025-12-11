'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import pdf from 'pdf-parse';

// Initialize Firebase Admin (Singleton)
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

if (!getApps().length && serviceAccount) {
    initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
} else if (!getApps().length) {
    // Fallback or dev mode without explicit cert (relies on default Google creds if available)
    initializeApp({
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}

const db = getFirestore();
const bucket = getStorage().bucket();

export async function processUploadedFile(fileId: string, storagePath: string, mimeType: string) {
    try {
        console.log(`Processing file: ${fileId} (${mimeType}) at ${storagePath}`);

        // 1. Download file from Storage
        const file = bucket.file(storagePath);
        const [buffer] = await file.download();

        let extractedText = '';

        // 2. Extract Text based on type
        if (mimeType === 'application/pdf') {
            const data = await pdf(buffer);
            extractedText = data.text;
            // Limit text length if necessary, but for RAG getting full context is good.
            // Clean up text (remove excessive newlines)
            extractedText = extractedText.replace(/\n\s*\n/g, '\n').trim();
        } else if (mimeType.startsWith('image/')) {
            // For images, we don't extract text *strictly* here unless we use OCR.
            // But we can mark it as "ready for multimodal".
            // For now, let's leave extractedText empty, the chat flow will handle images differently.
            extractedText = '';
        }

        // 3. Update Firestore Document with extracted text
        if (extractedText) {
            await db.collection('ai_knowledge_files').doc(fileId).update({
                extractedText: extractedText,
                status: 'processed',
                processedAt: new Date(),
            });
            return { success: true, textLength: extractedText.length };
        } else {
            await db.collection('ai_knowledge_files').doc(fileId).update({
                status: 'processed', // Processed but no text (e.g. image)
                processedAt: new Date(),
            });
            return { success: true, message: 'File processed (no text extracted)' };
        }

    } catch (error: any) {
        console.error('Error processing file:', error);
        // Update status to error
        await db.collection('ai_knowledge_files').doc(fileId).update({
            status: 'error',
            error: error.message,
        });
        return { success: false, error: error.message };
    }
}
