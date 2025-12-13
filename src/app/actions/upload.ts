'use server';

const pdf = require('pdf-parse');

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
