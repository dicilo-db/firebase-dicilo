'use server';

import { ai } from '@/ai/genkit';
import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import { z } from 'zod';

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

        // 1. Upload to Firebase Storage (Server-side)
        const buffer = Buffer.from(await file.arrayBuffer());
        const bucket = getAdminStorage().bucket();
        const filename = `receipts/${recruiterId}/${Date.now()}_${file.name}`;
        const fileRef = bucket.file(filename);

        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type,
            },
        });

        // Make public or get signed URL?
        // For simplicity in this context, we'll get a signed URL valid for 1 hour to pass to Gemini, 
        // but store the permanent path for the DB.
        // Actually, making it public is easier if rules allow, but let's use signed URL for security.
        const [signedUrl] = await fileRef.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60, // 1 hour
        });

        // Durable URL for the database (assuming public access or client SDK usage later)
        // Constructing specific public URL if the bucket is standard firebase
        // But better to save the full path or signed URL if private.
        // Let's assume we want a long-lived public-ish URL or we store the gs:// path.
        // For the "Photo URL" field in DB, a publicly accessible URL is usually expected by frontend components.
        // Let's make it public.
        await fileRef.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

        // 2. Process with Gemini (AI)
        // Convert buffer to base64 for Genkit inline usage, or use URL if supported.
        // Genkit supports data URLs or inline base64 part.
        const base64Image = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64Image}`;

        const response = await ai.generate({
            prompt: `
        Analyze this business card image. Extract the following information in JSON format:
        - businessName: The name of the company or business.
        - email: The primary email address.
        - phone: The primary phone number.
        - website: The website URL.
        - address: The physical address.
        - interest: Infer the potential interest level based on the quality/type of business if possible, otherwise default to 'Basic'. Options: Basic, Starter, Minorista, Premium.
        
        Return ONLY valid JSON.
      `,
            model: 'googleai/gemini-2.0-flash',
            output: { schema: ScanResultSchema },
            config: {
                temperature: 0.2 // Reduced creativity for OCR
            },
            content: [
                { media: { url: dataUrl } },
                { text: "Extract business card data." }
            ]
        });

        return {
            success: true,
            data: response.output, // Using typed output
            photoUrl: publicUrl
        };

    } catch (error: any) {
        console.error('Error processing business card:', error);
        return { success: false, error: error.message };
    }
}
