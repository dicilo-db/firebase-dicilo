'use server';

import { ai } from '@/ai/genkit';
import { gemini15Flash } from '@genkit-ai/googleai'; // Use stable model
import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import { z } from 'zod';
import { createWorker } from 'tesseract.js';

const ScanResultSchema = z.object({
    businessName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
    address: z.string().optional(),
    interest: z.enum(['Basic', 'Starter', 'Minorista', 'Premium']).optional(),
});

export async function processBusinessCard(formData: FormData) {
    try {
        const file = formData.get('image') as File;
        const recruiterId = formData.get('recruiterId') as string || 'DIC-001';

        if (!file) {
            throw new Error('No image provided');
        }

        // 1. Upload to Firebase Storage
        const buffer = Buffer.from(await file.arrayBuffer());
        const bucket = getAdminStorage().bucket();
        const filename = `receipts/${recruiterId}/${Date.now()}_${file.name}`;
        const fileRef = bucket.file(filename);

        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type,
            },
        });

        // Make public or get signed URL
        await fileRef.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

        // 2. Perform True OCR with Tesseract.js (The "Real OCR Library" requested)
        console.log("Starting Tesseract OCR...");
        const worker = await createWorker(['eng', 'spa', 'deu']); // Multi-language support
        const { data: { text: rawOcrText } } = await worker.recognize(buffer);
        console.log("OCR Result:", rawOcrText);
        await worker.terminate();

        // 3. Process with Gemini 1.5 Flash (AI) using BOTH Image and OCR Text
        // Gemini 1.5 Flash is Multimodal and stable.
        const base64Image = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64Image}`;

        console.log("Starting Gemini Analysis...");
        const response = await ai.generate({
            model: gemini15Flash,
            prompt: [
                { media: { url: dataUrl } },
                {
                    text: `
        Analyze this business card image and the raw OCR text provided below.
        
        Raw OCR Text (from Tesseract):
        """
        ${rawOcrText}
        """

        Task:
        1. Correct any OCR errors using the visual context of the image.
        2. Extract the following information in strict JSON format:
           - businessName: The name of the company.
           - email: Primary contact email.
           - phone: Primary phone number.
           - website: Website URL.
           - address: Physical address.
           - interest: Infer interest level (Basic/Starter/Minorista/Premium). Default to 'Basic' if unsure.

        Return ONLY valid JSON matching the schema.
                    `
                }
            ],
            output: { schema: ScanResultSchema },
            config: {
                temperature: 0.1
            }
        });

        return {
            success: true,
            data: response.output,
            photoUrl: publicUrl,
            ocrDebug: rawOcrText // Optional: return this if we want to show it in debug
        };

    } catch (error: any) {
        console.error('Error processing business card:', error);
        return { success: false, error: error.message };
    }
}
