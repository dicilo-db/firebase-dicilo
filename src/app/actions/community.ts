'use server';

import { getAuth } from 'firebase-admin/auth';
import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import { randomUUID } from 'crypto';
import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const postSchema = z.object({
    content: z.string().max(3000, "El contenido excede el límite de caracteres (3000)").nullable().optional(),
    neighborhood: z.string().max(200, "Error en barrio"),
    userId: z.string().min(5, "ID de usuario inválido"),
    visibility: z.string().max(50).optional()
});

const db = getAdminDb();
const auth = getAuth();
const storage = getAdminStorage();

export async function createPostAction(prevState: any, formData: FormData) {
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    
    // Limits an IP to 10 posts per minute to prevent brute-force server flooding
    if (!checkRateLimit(`create_post_${ip}`, 10, 60000)) {
        return { success: false, error: 'Has excedido el límite de creación. Por favor, espera 1 minuto.' };
    }

    const rawData = {
        content: formData.get('content') as string,
        neighborhood: formData.get('neighborhood') as string,
        userId: formData.get('userId') as string,
        visibility: (formData.get('visibility') as string) || 'public'
    };

    const parsed = postSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0].message };
    }

    const { content, neighborhood, userId, visibility } = parsed.data;
    const mediaFiles = formData.getAll('media') as File[];

    if (!content && mediaFiles.length === 0) {
        return { success: false, error: 'La publicación debe tener contenido o imágenes.' };
    }

    if (mediaFiles.length > 10) {
        return { success: false, error: 'No puedes subir más de 10 archivos en una sola publicación.' };
    }

    if (!neighborhood || !userId) {
        return { success: false, error: 'Faltan datos obligatorios.' };
    }

    try {
        // 1. Get User Data for denormalization
        let userName = 'Vecino';
        let userAvatar = '';

        try {
            const userRecord = await auth.getUser(userId);
            userName = userRecord.displayName || 'Vecino';
            userAvatar = userRecord.photoURL || '';
        } catch (e) {
            console.warn("Auth getUser failed", e);
        }

        try {
            const profileSnap = await db.collection('private_profiles').doc(userId).get();
            if (profileSnap.exists) {
                const profile = profileSnap.data();
                if (profile?.firstName) {
                    userName = `${profile.firstName} ${profile.lastName || ''}`.trim();
                }
                if (profile?.imgUrl) {
                    userAvatar = profile.imgUrl;
                }
            }
        } catch (e) {
            console.warn("Profile fetch failed", e);
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
                const filename = `community/${neighborhood}/${randomUUID()}.${extension}`;
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

        // 3. Create Post
        const newPost: any = {
            content: content,
            neighborhood: neighborhood,
            imageUrl: firstImageUrl || (mediaItems.length > 0 ? mediaItems[0].url : null),
            media: mediaItems,
            userId: userId,
            userName: userName,
            userAvatar: userAvatar,
            visibility: visibility,
            createdAt: new Date(),
            likes: [],
            language: 'es',
            commentCount: 0
        };

        const res = await db.collection('community_posts').add(newPost);

        // 4. Trigger Notifications for Friends
        try {
            // Find friends (Accepted requests where current user is either sender or receiver)
            const [sentRequests, receivedRequests] = await Promise.all([
                db.collection('friend_requests')
                    .where('fromUserId', '==', userId)
                    .where('status', '==', 'accepted')
                    .get(),
                db.collection('friend_requests')
                    .where('toUserId', '==', userId)
                    .where('status', '==', 'accepted')
                    .get()
            ]);

            const friendIds = new Set<string>();
            sentRequests.forEach(doc => friendIds.add(doc.data().toUserId));
            receivedRequests.forEach(doc => friendIds.add(doc.data().fromUserId));

            if (friendIds.size > 0) {
                const batch = db.batch();
                friendIds.forEach(fId => {
                    const notifRef = db.collection('notifications').doc();
                    batch.set(notifRef, {
                        toUserId: fId,
                        fromUserId: userId,
                        fromUserName: userName,
                        fromUserAvatar: userAvatar,
                        type: 'new_post',
                        postId: res.id,
                        neighborhood: neighborhood,
                        read: false,
                        createdAt: new Date()
                    });
                });
                await batch.commit();
            }
        } catch (notifError) {
            console.error("Failed to trigger friend notifications:", notifError);
        }

        return { success: true, id: res.id };

    } catch (error: any) {
        console.error("Error creating post:", error);
        return { success: false, error: error.message };
    }
}

import { ai } from '@/ai/genkit';

export async function translateText(text: string, targetLanguage: string) {
    if (!text) return { success: false, error: 'No text provided' };

    try {
        console.log(`[Community Translation] Translating to ${targetLanguage}: "${text.substring(0, 50)}..."`);
        const response = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            prompt: `
            ROLE: Professional Social Media Translator.
            TARGET LANGUAGE: ${targetLanguage}.
            
            TASK: Translate the following informal social media text into ${targetLanguage} accurately.
            
            STRICT RULES:
            1. Keep the tone friendly, casual, and appropriate for a community social wall.
            2. Output ONLY the translated text. Do NOT include markdown blocks (\`\`\`).
            3. ABSOLUTELY NO metadata, NO headers, NO explanations, NO intro/outro.
            4. Do NOT return Spanish. The result MUST BE in ${targetLanguage}.
            
            <TO_TRANSLATE>
            ${text}
            </TO_TRANSLATE>
            `,
        });

        const translated = response.text?.trim();
        if (translated) {
            console.log(`[Community Translation] Success for ${targetLanguage}`);
            const cleaned = translated.replace(/^```[a-z]*\n/g, '').replace(/```$/g, '').trim();
            return { success: true, translatedText: cleaned };
        }

        console.log(`[Community Translation] Fallback reached for ${targetLanguage}`);
        return { success: false, error: 'La IA devolvió un resultado vacío.' };
    } catch (error: any) {
        console.error("[Community Translation] Error:", error);
        return { success: false, error: `Translation failed: ${error.message || 'Unknown error'}` };
    }
}

export async function toggleLike(postId: string, userId: string) {
    try {
        const postRef = db.collection('community_posts').doc(postId);
        const postSnap = await postRef.get();

        if (!postSnap.exists) return { success: false, error: 'Post not found' };

        const post = postSnap.data();
        const likes = post?.likes || [];

        let newLikes;
        if (likes.includes(userId)) {
            newLikes = likes.filter((id: string) => id !== userId);
        } else {
            newLikes = [...likes, userId];
        }

        await postRef.update({ likes: newLikes });
        return { success: true, likes: newLikes };
    } catch (error: any) {
        console.error("Like error:", error);
        return { success: false, error: error.message };
    }
}

export async function addComment(postId: string, content: string, userId: string) {
    if (!content || !postId || !userId) return { success: false, error: 'Datos incompletos' };

    try {
        // 1. Get User Details
        let userName = 'Usuario';
        let userAvatar = '';
        try {
            const userRecord = await auth.getUser(userId);
            userName = userRecord.displayName || 'Usuario';
            userAvatar = userRecord.photoURL || '';
        } catch (e) {
            // Fallback to profile check
            const profileSnap = await db.collection('private_profiles').doc(userId).get();
            if (profileSnap.exists) {
                const d = profileSnap.data();
                userName = d?.firstName || 'Usuario';
                userAvatar = d?.imgUrl || '';
            }
        }

        const commentData = {
            postId,
            userId,
            userName,
            userAvatar,
            content,
            createdAt: new Date()
        };

        // 2. Add Comment
        const commentRef = await db.collection('community_posts').doc(postId).collection('comments').add(commentData);

        // 3. Update Post Comment Count (Atomic Increment)
        const { FieldValue } = await import('firebase-admin/firestore');
        await db.collection('community_posts').doc(postId).update({
            commentCount: FieldValue.increment(1)
        });

        return { success: true, id: commentRef.id, ...commentData };

    } catch (error: any) {
        console.error("Error adding comment:", error);
        return { success: false, error: error.message };
    }
}

export async function deletePostAction(postId: string, userId: string) {
    if (!postId || !userId) return { success: false, error: 'Faltan parámetros' };

    try {
        const postRef = db.collection('community_posts').doc(postId);
        const postSnap = await postRef.get();

        if (!postSnap.exists) {
            return { success: false, error: 'La publicación no existe' };
        }

        const postData = postSnap.data();
        if (postData?.userId !== userId) {
            return { success: false, error: 'No tienes permiso para eliminar esta publicación' };
        }

        // Optional: We could delete associated media from storage here, 
        // but for now we just delete the document to keep it simple.
        await postRef.delete();

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting post:", error);
        return { success: false, error: error.message };
    }
}

export async function editPostAction(postId: string, newContent: string, userId: string, updatedMedia?: any[]) {
    if (!postId || !newContent || !userId) return { success: false, error: 'Datos incompletos' };

    try {
        const postRef = db.collection('community_posts').doc(postId);
        const postSnap = await postRef.get();

        if (!postSnap.exists) {
            return { success: false, error: 'La publicación no existe' };
        }

        const postData = postSnap.data();
        if (postData?.userId !== userId) {
            return { success: false, error: 'No tienes permiso para editar esta publicación' };
        }

        // Verify the 12-hour limit
        const createdAt = postData?.createdAt?.toDate ? postData.createdAt.toDate().getTime() : new Date(postData?.createdAt).getTime();
        const now = Date.now();
        const twelveHoursInMs = 12 * 60 * 60 * 1000;

        if (now - createdAt > twelveHoursInMs) {
            return { success: false, error: 'Solo puedes editar una publicación dentro de las primeras 12 horas.' };
        }

        const updates: any = {
            content: newContent,
            updatedAt: new Date()
        };

        if (updatedMedia !== undefined) {
            updates.media = updatedMedia;
            if (updatedMedia.length === 0) {
                updates.imageUrl = null;
            } else if (updatedMedia.length > 0 && updatedMedia[0].type === 'image') {
                updates.imageUrl = updatedMedia[0].url;
            }
        }

        await postRef.update(updates);

        return { success: true };
    } catch (error: any) {
        console.error("Error editing post:", error);
        return { success: false, error: error.message };
    }
}
