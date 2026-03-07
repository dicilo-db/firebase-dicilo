'use server';

import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { registerNewProspect } from './dicipoints';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

export async function submitRecommendation(formData: FormData) {
    try {
        const db = getAdminDb();
        const storage = getAdminStorage();
        const bucket = storage.bucket();

        // Extract textual data
        const companyName = formData.get('companyName') as string;
        const contactName = formData.get('contactName') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const country = formData.get('country') as string;
        const countryCode = formData.get('countryCode') as string;
        const city = formData.get('city') as string;
        const website = formData.get('website') as string;
        const category = formData.get('category') as string;
        const comments = formData.get('comments') as string;
        const diciloCode = formData.get('diciloCode') as string;
        const source = formData.get('source') as string;
        const neighborhood = formData.get('neighborhood') as string;
        const userId = formData.get('userId') as string;

        const mediaFiles = formData.getAll('media') as File[];
        
        const uploadPromises = mediaFiles.map(async (file) => {
            if (file.size === 0) return null;

            try {
                const buffer = Buffer.from(await file.arrayBuffer() as any);
                const fileName = `${randomUUID()}`;
                const isImage = file.type.startsWith('image/');
                const isVideo = file.type.startsWith('video/');

                let uploadBuffer = buffer;
                let finalPath = '';
                let contentType = file.type;

                if (isImage) {
                    if (file.type === 'image/webp') {
                        finalPath = `recommendations/images/${fileName}.webp`;
                        contentType = 'image/webp';
                    } else {
                        try {
                            uploadBuffer = await sharp(buffer)
                                .webp({ quality: 80 })
                                .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                                .toBuffer();
                            finalPath = `recommendations/images/${fileName}.webp`;
                            contentType = 'image/webp';
                        } catch (err) {
                            console.error("Sharp processing failed, uploading original:", err);
                            const ext = file.name.split('.').pop() || 'jpg';
                            finalPath = `recommendations/images/${fileName}.${ext}`;
                        }
                    }
                } else if (isVideo) {
                    const ext = file.name.split('.').pop() || 'mp4';
                    finalPath = `recommendations/videos/${fileName}.${ext}`;
                } else {
                    return null; // Skip unknown types
                }

                const fileRef = bucket.file(finalPath);
                await fileRef.save(uploadBuffer, {
                    metadata: { contentType },
                });

                await fileRef.makePublic();
                return {
                    type: (isImage ? 'image' : 'video') as 'image' | 'video',
                    url: fileRef.publicUrl()
                };
            } catch (err) {
                console.error("Single file upload error in recommendation:", err);
                return null;
            }
        });

        const uploadResults = await Promise.all(uploadPromises);
        const media = uploadResults.filter((item): item is { type: 'image' | 'video'; url: string } => item !== null);

        const recommendationData: any = {
            companyName,
            contactName,
            email,
            phone,
            country,
            countryCode,
            city,
            website,
            category,
            comments,
            diciloCode,
            source: source || 'search_page_recommendation',
            neighborhood,
            userId,
            media,
            photoUrl: media.find(m => m.type === 'image')?.url || '',
            status: 'approved', // Auto-approved for this flow
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            pointsPaid: false
        };

        const ref = await db.collection('recommendations').add(recommendationData);

        // AUTOMATIC PAYMENT
        if (userId) {
            await registerNewProspect(userId, ref.id);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error submitting recommendation:', error);
        return { success: false, error: error.message };
    }
}
