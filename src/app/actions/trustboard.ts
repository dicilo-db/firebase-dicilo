'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function createTrustBoardPost(userId: string, data: any) {
    if (!userId || !data) {
        return { success: false, error: 'User ID or Data missing.' };
    }

    const db = getAdminDb();

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

        // 2. Prepare Post Object
        const postRef = db.collection('trustboard_posts').doc();
        const newPost = {
            id: postRef.id,
            authorId: userId,
            authorName: profileData.displayName || data.authorName || 'Usuario',
            category: data.category, // 'jobs', 'living', 'talent', 'swap'
            neighborhood: data.neighborhood, // 'Hamburg', etc.
            title: {
                // By default set original text to all. If premium, Cloud Function will overwrite others.
                es: data.title,
                en: data.title,
                de: data.title,
                // fallback languages
            },
            description: {
                es: data.description,
                en: data.description,
                de: data.description,
            },
            originalLang: data.lang || 'es',
            status: 'pending', // Cloud function should transition this to 'approved' after AI check
            isPremium: isPremium, // Flag for the cloud function translation trigger
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // 3. Batch Write: Create Post + Update User Counter
        const batch = db.batch();
        batch.set(postRef, newPost);
        
        batch.update(profileRef, {
            [`trustBoardStats.${currentMonth}`]: admin.firestore.FieldValue.increment(1)
        });

        await batch.commit();

        return { success: true, postId: postRef.id };

    } catch (error: any) {
        console.error('Error creating TrustBoard post:', error);
        return { success: false, error: 'Internal server error.' };
    }
}
