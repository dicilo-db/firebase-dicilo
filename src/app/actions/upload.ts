'use server';

const pdf = require('pdf-parse');
import { getStorage } from 'firebase-admin/storage';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

// Ensure Admin is initialized (Server Actions run in Node, not Client)
if (!getApps().length) {
    initializeApp();
}

export async function uploadImage(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        const path = formData.get('path') as string;

        if (!file || !path) {
            return { success: false, error: 'Missing file or path' };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const storage = getStorage();
        const bucket = storage.bucket();
        // Note: bucket() might need 'your-bucket-name' if not default. usually default works if configured.
        // Assuming default bucket.

        const fileRef = bucket.file(path);

        await fileRef.save(buffer, {
            contentType: file.type,
            public: true, // Make publicly accessible for simplicity in this MVP? Or use signed URL.
            // Better: just make it publicToken or similar.
            // For now, let's try standard save.
        });

        // Make it public explicitly if needed or get public URL
        await fileRef.makePublic();
        const publicUrl = fileRef.publicUrl();

        return { success: true, url: publicUrl };
    } catch (error: any) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
    }
}

export async function extractTextFromDocument(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = '';

        if (file.type === 'application/pdf') {
            const data = await pdf(buffer);
            text = data.text;
        } else if (file.type === 'text/plain') {
            text = buffer.toString('utf-8');
        } else {
            return { success: false, error: 'Unsupported file type' };
        }

        return { success: true, text: text.substring(0, 10000) }; // Limit context size
    } catch (error: any) {
        console.error('Error extracting text:', error);
        return { success: false, error: error.message };
    }
}
