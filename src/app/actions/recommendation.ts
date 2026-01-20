'use server';

import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import { sendRecommendationNotification } from '@/lib/email'; // Assuming mail utility exists, if not we will fix
import { FieldValue } from 'firebase-admin/firestore';

// Initialize Admin SDK via shared lib
const db = getAdminDb();
const storage = getAdminStorage();

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const recommendationSchema = z.object({
    businessId: z.string().min(1),
    userId: z.string().optional(), // If logged in
    userName: z.string().min(1, 'Name is required'),
    userContact: z.string().optional(), // Email or Phone for guests
    comment: z.string().min(10, 'Comment must be at least 10 characters'),
    rating: z.coerce.number().min(1).max(5),
});

async function moderateContent(text: string): Promise<{ safe: boolean; reason?: string }> {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a content moderator for a business review platform. 
                    Analyze the following user review. 
                    Check for:
                    1. Vulgarity, profanity, or hate speech.
                    2. Inappropriate or offensive content.
                    3. Spam or gibberish.
                    
                    The tone should be constructive, even if negative. Formal or semi-formal language is preferred.
                    Return a JSON object: { "safe": boolean, "reason": string }. 
                    If safe is false, provide a polite reason in Spanish why it was rejected (e.g., "El lenguaje utilizado no es apropiado").`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');
        return {
            safe: result.safe ?? false,
            reason: result.reason || 'Contenido no apropiado por normas de la comunidad.'
        };

    } catch (error) {
        console.error('OpenAI Moderation Error:', error);
        // Fallback: If AI fails, we might allow it but flag it, or block. 
        // For safety, let's block if we can't verify.
        return { safe: false, reason: 'Error verificando el contenido. Inténtalo más tarde.' };
    }
}

export async function submitRecommendation(prevState: any, formData: FormData) {
    try {
        const file = formData.get('photo') as File;
        const businessId = formData.get('businessId') as string;
        const rating = formData.get('rating');

        // Parse fields
        const rawData = {
            businessId,
            userId: formData.get('userId') as string || 'guest',
            userName: formData.get('userName') as string,
            userContact: formData.get('userContact') as string,
            comment: formData.get('comment') as string,
            rating: rating,
        };

        // Validate textual data
        const validatedFields = recommendationSchema.parse(rawData);

        // 1. AI Moderation
        const moderation = await moderateContent(validatedFields.comment!);
        if (!moderation.safe) {
            return { success: false, message: moderation.reason };
        }

        // 2. File Validation
        if (!file || file.size === 0) {
            return { success: false, message: 'Please upload a photo.' };
        }
        if (!file.type.startsWith('image/')) {
            return { success: false, message: 'Only image files are allowed.' };
        }

        // 3. Upload Image
        const buffer = await file.arrayBuffer();
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `clients/${businessId}/recommendations/${randomUUID()}.${ext}`;
        const bucket = storage.bucket();
        const fileRef = bucket.file(filename);

        await fileRef.save(Buffer.from(buffer), {
            metadata: { contentType: file.type },
        });
        await fileRef.makePublic();
        const publicUrl = fileRef.publicUrl();

        // 4. Create Firestore Document (Subcollection)
        const clientRef = db.collection('clients').doc(businessId);
        const clientDoc = await clientRef.get();
        const clientName = clientDoc.data()?.clientName || 'Partner';
        const clientEmail = clientDoc.data()?.email;

        const reviewData = {
            ...validatedFields,
            clientName, // Store for Admin Panel visibility without extra reads
            photoUrl: publicUrl,
            storagePath: filename,
            status: 'approved', // Auto-approved by AI
            createdAt: FieldValue.serverTimestamp(),
            moderatedBy: 'ai',
        };

        await clientRef.collection('recommendations').add(reviewData);

        // 5. Update Aggregates (Atomic)
        await db.runTransaction(async (t) => {
            const doc = await t.get(clientRef);
            if (!doc.exists) return;

            const existingRating = doc.data()?.rating_promedio || 0;
            const existingCount = doc.data()?.total_resenas || 0;

            const newCount = existingCount + 1;
            // newAvg = ((oldAvg * oldCnt) + curRating) / newCnt
            const newAverage = ((existingRating * existingCount) + validatedFields.rating) / newCount;

            t.update(clientRef, {
                rating_promedio: parseFloat(newAverage.toFixed(2)),
                total_resenas: newCount
            });
        });


        // 6. Notify Client
        if (clientEmail) {
            await sendRecommendationNotification(
                clientEmail,
                clientName,
                validatedFields.userName,
                validatedFields.rating,
                validatedFields.comment
            );
        }

        return { success: true, message: 'Recommendation submitted successfully!' };
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            console.error("Zod Error", error.errors);
            return { success: false, message: error.errors[0].message };
        }
        console.error('Error submitting recommendation:', error);
        return { success: false, message: error.message || 'Failed to submit recommendation.' };
    }
}
