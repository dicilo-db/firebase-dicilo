'use server';

import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import { registerNewProspect } from './dicipoints'; // Used for Dicipoints logic
import { z } from 'zod';

const quickHighlightSchema = z.object({
    businessId: z.string().min(5),
    businessName: z.string().min(1),
    neighborhood: z.string().min(1),
    userId: z.string().min(5),
    userName: z.string().min(1),
    comments: z.string().max(2000, "Los comentarios no pueden exceder 2000 caracteres"),
    rating: z.number().min(1).max(5).default(4)
});

export async function submitQuickHighlight(formData: FormData) {
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    
    if (!checkRateLimit(`create_quick_highlight_${ip}`, 5, 60000)) {
        return { success: false, error: 'Has excedido el límite de recomendaciones. Por favor, espera 1 minuto.' };
    }

    try {
        const db = getAdminDb();
        const storage = getAdminStorage();

        const rawData = {
            businessId: formData.get('businessId') as string,
            businessName: formData.get('businessName') as string,
            neighborhood: formData.get('neighborhood') as string,
            userId: formData.get('userId') as string,
            userName: formData.get('userName') as string,
            comments: formData.get('comments') as string,
            rating: parseInt(formData.get('rating') as string || '4', 10)
        };

        const parsed = quickHighlightSchema.safeParse(rawData);
        if (!parsed.success) {
            return { success: false, error: parsed.error.errors[0].message };
        }

        const { businessId, businessName, neighborhood, userId, userName, comments, rating } = parsed.data;

        // Process media if any
        const mediaFiles = formData.getAll('media') as File[];
        const media = [];
        
        for (const file of mediaFiles) {
            if (file.size === 0) continue;
            try {
                const buffer = Buffer.from(await file.arrayBuffer() as any);
                const fileName = `${randomUUID()}`;
                
                let uploadBuffer = buffer;
                let contentType = file.type;
                let finalPath = `recommendations/images/${fileName}.webp`;

                if (file.type.startsWith('image/') && file.type !== 'image/webp') {
                    const sharp = (await import('sharp')).default;
                    uploadBuffer = await sharp(buffer)
                        .resize({ width: 1200, withoutEnlargement: true })
                        .webp({ quality: 80 })
                        .toBuffer();
                    contentType = 'image/webp';
                } else if (file.type.startsWith('video/')) {
                    finalPath = `recommendations/videos/${fileName}.mp4`;
                }

                const fileRef = storage.bucket().file(finalPath);
                await fileRef.save(uploadBuffer, { metadata: { contentType } });
                await fileRef.makePublic();
                
                media.push({
                    type: file.type.startsWith('video/') ? 'video' : 'image',
                    url: fileRef.publicUrl()
                });
            } catch (err) {
                console.error("Single file upload error:", err);
            }
        }

        const securityKey = randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
        
        // Match expected recommendation schema
        const recommendationData: any = {
            businessId, // explicit link
            companyName: businessName,
            neighborhood,
            userId,
            userName,
            contactName: userName,
            comments,
            rating,
            media,
            photoUrl: media.find(m => m.type === 'image')?.url || '',
            status: 'approved', // Live immediately to feed
            validationStatus: 'approved',
            securityKey,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            pointsPaid: false,
            source: 'quick_highlight'
        };

        const ref = await db.collection('recommendations').add(recommendationData);

        // Award DiciPoint!
        try {
            await registerNewProspect(userId, ref.id, 'quick_highlight');
        } catch (e) {
            console.error("Error giving Dicipoint for quick highlight:", e);
        }

        return { success: true, id: ref.id, message: '¡Destacado publicado exitosamente y has ganado 1 DiciPoint!' };

    } catch (e: any) {
        console.error("SubmitQuickHighlight error:", e);
        return { success: false, error: e.message || 'Error del servidor al destacar la empresa' };
    }
}
