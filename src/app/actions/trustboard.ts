'use server';

import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import { ai } from '@/ai/genkit';
import { translateText } from './translate';

export async function createTrustBoardPost(prevState: any, formData: FormData) {
    const userId = formData.get('userId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const neighborhood = formData.get('neighborhood') as string;
    const lang = formData.get('lang') as string || 'es';
    const mediaFiles = formData.getAll('media') as File[];

    if (!userId || !title || !description || !category || !neighborhood) {
        return { success: false, error: 'User ID or Data missing.' };
    }

    if (mediaFiles.length > 6) {
        return { success: false, error: 'No puedes subir más de 6 archivos en una sola publicación.' };
    }

    const db = getAdminDb();
    const storage = getAdminStorage();

    try {
        // 1. Fetch user private profile to check model and stats
        const profileRef = db.collection('private_profiles').doc(userId);
        const profileSnap = await profileRef.get();
        if (!profileSnap.exists) {
            return { success: false, error: 'Profile not found.' };
        }

        const profileData = profileSnap.data() || {};
        const isPremium = profileData.model === 'premium' || profileData.model === 'gold' || profileData.role === 'admin' || profileData.role === 'superadmin';
        
        // Month string (e.g. "2026-04")
        const currentMonth = new Date().toISOString().substring(0, 7);
        const userTrustBoardStats = profileData.trustBoardStats || {};
        const monthCount = userTrustBoardStats[currentMonth] || 0;

        const limit = isPremium ? 30 : 12;

        if (monthCount >= limit) {
            return { 
                success: false, 
                error: isPremium 
                    ? 'Has alcanzado el límite mensual Premium (30 anuncios).'
                    : 'Has alcanzado tu límite gratuito mensual (12 anuncios). Actualiza a Premium para publicar más y disfrutar de traducciones automáticas en 12 idiomas.' 
            };
        }

        // 2. Upload Media Files in Parallel
        const uploadPromises = mediaFiles.map(async (file) => {
            if (!file || file.size === 0) return null;

            try {
                const buffer = await file.arrayBuffer();
                const fileBuffer = Buffer.from(buffer as any);
                let finalBuffer = fileBuffer;
                let contentType = file.type;
                let mediaType: 'image' | 'video' = contentType.startsWith('video/') ? 'video' : 'image';

                // Image processing (only for images)
                if (mediaType === 'image') {
                    try {
                        const { fileTypeFromBuffer } = await import('file-type');
                        const type = await fileTypeFromBuffer(fileBuffer);
                        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

                        if (type && allowedMimes.includes(type.mime)) {
                            contentType = type.mime;
                            
                            // Skip sharp if already optimized WebP (efficiency)
                            if (contentType === 'image/webp') {
                                // Already optimized by client, move to upload
                            } else {
                                // Try Sharp Optimization for other formats
                                try {
                                    const sharp = (await import('sharp')).default;
                                    finalBuffer = await sharp(fileBuffer)
                                        .resize({ width: 1200, withoutEnlargement: true })
                                        .webp({ quality: 80 })
                                        .toBuffer();
                                    contentType = 'image/webp';
                                } catch (sharpError) {
                                    console.warn("Sharp optimization failed:", sharpError);
                                }
                            }
                        }
                    } catch (dependencyError) {
                        console.warn("Image processing fallback:", dependencyError);
                    }
                }

                // Upload to Firebase Storage
                const extension = contentType.split('/')[1] || (mediaType === 'video' ? 'mp4' : 'img');
                const filename = `trustboard/${neighborhood}/${randomUUID()}.${extension}`;
                const bucket = storage.bucket();
                const fileRef = bucket.file(filename);

                await fileRef.save(finalBuffer, {
                    metadata: { contentType: contentType },
                });

                await fileRef.makePublic();
                const publicUrl = fileRef.publicUrl();

                return { type: mediaType, url: publicUrl };

            } catch (uploadError) {
                console.error("Single file upload error:", uploadError);
                return null;
            }
        });

        const uploadResults = await Promise.all(uploadPromises);
        const mediaItems = uploadResults.filter((item): item is { type: 'image' | 'video', url: string } => item !== null);
        const firstImageUrl = mediaItems.find(item => item.type === 'image')?.url || null;

        // 3. AI Moderation Check
        let status = 'approved';
        try {
            const modResponse = await ai.generate({
                prompt: `
                Analiza este anuncio clasificado para un tablero comunitario buscando violaciones.
                Título: ${title}
                Descripción: ${description}
            
                Responde ÚNICAMENTE la palabra "REJECTED" si promueve fraude, odio, violencia explícita o servicios abiertamente ilegales. 
                De lo contrario, responde ÚNICAMENTE la palabra "APPROVED".
                `
            });
            const verdict = modResponse.text?.trim().toUpperCase();
            if (verdict === 'REJECTED') {
                return { success: false, error: 'Rechazado por Cerebro DiciBot por violación de políticas comunitarias.' };
            }
        } catch (modError) {
            console.error('Moderation failed, defaulting to pending manually:', modError);
            status = 'pending'; // Fallback to manual review if AI fails
        }

        // 4. Premium Auto-Translations
        let finalTitle: any = { es: title, en: title, de: title };
        let finalDesc: any = { es: description, en: description, de: description };
        const cleanLang = lang.substring(0, 2);

        if (status === 'approved' && isPremium) {
            const targets = ['es', 'en', 'de'].filter(l => l !== cleanLang);
            
            await Promise.all(targets.map(async (target) => {
                const langName = target === 'en' ? 'English' : target === 'de' ? 'German' : 'Spanish';
                
                const [titleRes, descRes] = await Promise.all([
                    translateText(title, langName),
                    translateText(description, langName)
                ]);

                if (titleRes.success && titleRes.translation) finalTitle[target] = titleRes.translation;
                if (descRes.success && descRes.translation) finalDesc[target] = descRes.translation;
            }));
        }

        // 5. Prepare Post Object
        const postRef = db.collection('trustboard_posts').doc();
        const newPost = {
            id: postRef.id,
            authorId: userId,
            authorName: profileData.displayName || 'Usuario',
            category: category, 
            neighborhood: neighborhood, 
            title: finalTitle,
            description: finalDesc,
            imageUrl: firstImageUrl || (mediaItems.length > 0 ? mediaItems[0].url : null),
            media: mediaItems,
            originalLang: cleanLang,
            status: status,
            isPremium: isPremium,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // 4. Batch Write: Create Post + Update User Counter
        const batch = db.batch();
        batch.set(postRef, newPost);
        
        batch.update(profileRef, {
            [`trustBoardStats.${currentMonth}`]: admin.firestore.FieldValue.increment(1)
        });

        await batch.commit();

        return { success: true, postId: postRef.id };

    } catch (error: any) {
        console.error('Error creating TrustBoard post:', error);
        return { success: false, error: error.message || 'Internal server error.' };
    }
}
