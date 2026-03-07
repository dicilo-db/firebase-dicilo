'use server';

import { getAuth } from 'firebase-admin/auth';
import { getAdminDb, getAdminStorage } from '@/lib/firebase-admin';
import { randomUUID } from 'crypto';

const db = getAdminDb();
const auth = getAuth();
const storage = getAdminStorage();

export async function createPostAction(prevState: any, formData: FormData) {
    const content = formData.get('content') as string;
    const neighborhood = formData.get('neighborhood') as string;
    const userId = formData.get('userId') as string;
    const visibility = (formData.get('visibility') as string) || 'public';
    const mediaFiles = formData.getAll('media') as File[];

    if (!content && mediaFiles.length === 0) {
        return { success: false, error: 'La publicación debe tener contenido o imágenes.' };
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
                            // Try Sharp Optimization
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
        const response = await ai.generate({
            prompt: `Translate the following informal social media text to ${targetLanguage}. Keep the tone friendly and casual. Only return the translated text, no explanations. Text: "${text}"`,
        });

        return { success: true, translatedText: response.text.trim() };
    } catch (error: any) {
        console.error("Translation error details:", JSON.stringify(error, null, 2));
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
