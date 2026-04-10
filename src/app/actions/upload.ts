'use server';

const pdf = require('pdf-parse');
import { getAdminStorage } from '@/lib/firebase-admin';

export async function uploadImage(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        const path = formData.get('path') as string;

        if (!file || !path) {
            return { success: false, error: 'Missing file or path' };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const storage = getAdminStorage();
        const bucket = storage.bucket();
        // Uses default bucket from config or the one initialized in firebase-admin.ts

        const fileRef = bucket.file(path);

        await fileRef.save(buffer, {
            contentType: file.type,
            public: true,
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
