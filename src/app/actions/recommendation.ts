'use server';

import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import { sendRecommendationNotification } from '@/lib/email'; 
import { FieldValue } from 'firebase-admin/firestore';
import sharp from 'sharp';

// Initialize Admin SDK via shared lib
const db = getAdminDb();
const storage = getAdminStorage();

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const recommendationSchema = z.object({
    businessId: z.string().min(1),
    userId: z.string().optional(), 
    userName: z.string().min(1, 'Name is required'),
    userContact: z.string().optional(), 
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
                    Check for: profanity, hate speech, spam or gibberish.
                    Return a JSON object: { "safe": boolean, "reason": string }.`
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
        return { safe: false, reason: 'Error verificando el contenido. Inténtalo más tarde.' };
    }
}

import { headers } from 'next/headers';

export async function submitRecommendation(prevState: any, formData: FormData) {
    try {
        const businessId = formData.get('businessId') as string;
        const rating = formData.get('rating');
        const userId = formData.get('userId') as string;

        if (!userId || userId === 'guest' || userId === 'Anonymous') {
            return { success: false, message: 'Debes iniciar sesión para publicar una reseña.' };
        }

        const headersList = await headers();
        const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'IP desconocida';

        const rawData = {
            businessId,
            userId,
            userName: formData.get('userName') as string,
            userContact: formData.get('userContact') as string,
            comment: formData.get('comment') as string,
            rating: rating,
        };

        const validatedFields = recommendationSchema.parse(rawData);

        const moderation = await moderateContent(validatedFields.comment!);
        if (!moderation.safe) {
            return { success: false, message: moderation.reason };
        }

        const mediaFiles = formData.getAll('media') as File[];
        const media: { type: 'image' | 'video'; url: string }[] = [];
        const bucket = storage.bucket();

        for (const file of mediaFiles) {
            if (file.size === 0) continue;

            const buffer = Buffer.from(await file.arrayBuffer() as any);
            const fileName = `${randomUUID()}`;
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');

            let uploadBuffer = buffer;
            let finalPath = '';
            let contentType = file.type;

            if (isImage) {
                try {
                    uploadBuffer = await sharp(buffer)
                        .webp({ quality: 80 })
                        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                        .toBuffer();
                    finalPath = `clients/${businessId}/recommendations/${fileName}.webp`;
                    contentType = 'image/webp';
                } catch (err) {
                    const ext = file.name.split('.').pop() || 'jpg';
                    finalPath = `clients/${businessId}/recommendations/${fileName}.${ext}`;
                }
            } else if (isVideo) {
                const ext = file.name.split('.').pop() || 'mp4';
                finalPath = `clients/${businessId}/recommendations/${fileName}.${ext}`;
            } else {
                continue;
            }

            const fileRef = bucket.file(finalPath);
            await fileRef.save(uploadBuffer, { metadata: { contentType } });
            await fileRef.makePublic();
            media.push({
                type: isImage ? 'image' : 'video',
                url: fileRef.publicUrl()
            });
        }

        const clientRef = db.collection('clients').doc(businessId);
        const clientDoc = await clientRef.get();
        const clientName = clientDoc.data()?.clientName || 'Partner';
        const clientEmail = clientDoc.data()?.email;

        const reviewData = {
            ...validatedFields,
            clientName,
            media,
            photoUrl: media.find(m => m.type === 'image')?.url || '',
            status: 'approved',
            createdAt: FieldValue.serverTimestamp(),
            moderatedBy: 'ai',
            ipAddress, // Nuevo campo de auditoría
        };

        await clientRef.collection('recommendations').add(reviewData);

        await db.runTransaction(async (t) => {
            const doc = await t.get(clientRef);
            if (!doc.exists) return;
            const existingRating = doc.data()?.rating_promedio || 0;
            const existingCount = doc.data()?.total_resenas || 0;
            const newCount = existingCount + 1;
            const newAverage = ((existingRating * existingCount) + validatedFields.rating) / newCount;
            t.update(clientRef, {
                rating_promedio: parseFloat(newAverage.toFixed(2)),
                total_resenas: newCount
            });
        });

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
        console.error('Error submitting recommendation:', error);
        return { success: false, message: error.message || 'Failed to submit recommendation.' };
    }
}
