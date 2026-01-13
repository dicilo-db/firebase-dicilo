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
    const file = formData.get('image') as File | null;

    if (!content || !neighborhood || !userId) {
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
            console.warn("Auth getUser failed (likely permission issue), falling back to Firestore profile.", e);
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

        // 2. Upload Image (Securely)
        let publicUrl = null;
        if (file && file.size > 0) {
            // A. Validate Magic Numbers (Real mime type)
            const buffer = await file.arrayBuffer();
            const fileBuffer = Buffer.from(buffer);

            // Dynamic import for ESM module 'file-type'
            const { fileTypeFromBuffer } = await import('file-type');
            const type = await fileTypeFromBuffer(fileBuffer);
            const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

            if (!type || !allowedMimes.includes(type.mime)) {
                console.error("Security Block: Invalid file signature.", type?.mime);
                return { success: false, error: 'Formato de archivo no permitido o inseguro. Solo imágenes (JPG, PNG, WEBP).' };
            }

            // B. Sanitize & Optimize Image (Sharp "Antivirus")
            // This re-encodes the image, stripping metadata and potential payloads.
            const sharp = (await import('sharp')).default;
            const processedBuffer = await sharp(fileBuffer)
                .resize({ width: 1200, withoutEnlargement: true }) // Reasonable limit
                .webp({ quality: 80 }) // Standardize to WebP for efficiency
                .toBuffer();

            const filename = `community/${neighborhood}/${randomUUID()}.webp`; // Always .webp
            const bucket = storage.bucket();
            const fileRef = bucket.file(filename);

            await fileRef.save(processedBuffer, {
                metadata: { contentType: 'image/webp' },
            });

            await fileRef.makePublic();
            publicUrl = fileRef.publicUrl();
        }

        // 3. Create Post
        const newPost = {
            content: content,
            neighborhood: neighborhood,
            imageUrl: publicUrl,
            userId: userId,
            userName: userName,
            userAvatar: userAvatar,
            createdAt: new Date(), // Using native Date, Firestore Admin SDK converts to Timestamp
            likes: [],
            language: 'es', // Default, ideally we'd detect this
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
