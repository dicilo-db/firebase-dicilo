'use server';

import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { z } from 'zod';
import { adminStorage } from '@/lib/firebase-admin';
import { createWorker } from 'tesseract.js';

const ai = genkit({
    plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
    model: gemini15Flash,
});

const ScanResultSchema = z.object({
    businessName: z.string().describe("Name of the company or business"),
    personName: z.string().optional().describe("Name of the person on the card"),
    jobTitle: z.string().optional().describe("Job title"),
    email: z.string().optional().describe("Email address"),
    phone: z.string().optional().describe("Phone number"),
    website: z.string().optional().describe("Website URL"),
    address: z.string().optional().describe("Physical address"),
    interest: z.enum(['Basic', 'Starter', 'Minorista', 'Premium']).optional().describe("Inferred business size/interest level based on cues"),
});

export async function processBusinessCard(formData: FormData) {
    try {
        const file = formData.get('image') as File;
        const recruiterId = formData.get('recruiterId') as string || 'Unknown';
        const clientOcrText = formData.get('clientOcrText') as string | null;

        if (!file) {
            return { success: false, error: 'No image provided' };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Image = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64Image}`;

        // 1. Upload to Firebase Storage
        const bucket = adminStorage.bucket();
        const fileName = `scans/${recruiterId}/${Date.now()}_${file.name}`;
        const fileRef = bucket.file(fileName);

        await fileRef.save(buffer, {
            metadata: { contentType: file.type },
        });

        await fileRef.makePublic();
        const publicUrl = fileRef.publicUrl();

        // 2. OCR Strategy (Client vs Server)
        let finalOcrText = "";

        if (clientOcrText && clientOcrText.length > 10) {
            console.log("Using Client-Side OCR Text");
            finalOcrText = clientOcrText;
        } else {
            console.log("Fallback to Server-Side OCR (Tesseract)");
            const worker = await createWorker('eng');
            const { data: { text } } = await worker.recognize(buffer);
            await worker.terminate();
            finalOcrText = text;
        }

        console.log("OCR Text for AI:", finalOcrText.substring(0, 100) + "...");

        // 3. AI Processing (Gemini 1.5 Flash Multimodal)
        const response = await ai.generate({
            model: gemini15Flash,
            prompt: [
                { media: { url: dataUrl } },
                {
                    text: `Analyze this business card image and the following OCR text. 
                    Extract the structured data.
                    
                    OCR TEXT (Reference):
                    "${finalOcrText}"

                    - Correct any OCR errors using the visual image.
                    - If the OCR text is garbage, rely on the image.
                    - Infer the 'interest' level (Basic/Starter/Minorista/Premium) based on the design quality and job title if visible (CEO = Premium, Sales = Basic).
                    `
                }
            ],
            output: { schema: ScanResultSchema },
            config: {
                temperature: 0.1 // High precision
            }
        });

        return {
            success: true,
            data: response.output,
            photoUrl: publicUrl,
            ocrDebug: finalOcrText
        };

    } catch (error) {
        console.error('Scanner Error:', error);
        return { success: false, error: 'Failed to process card' };
    }
}
