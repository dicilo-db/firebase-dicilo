'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// Firestore Schema equivalent to the requested SQL:
// Collection: 'user_social_connections'
// Document ID: auto-generated or composite
// Fields:
//   userId: string (Reference to users)
//   provider: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok'
//   profileUrl: string
//   accessToken: string | null
//   isActive: boolean
//   createdAt: Timestamp
//   updatedAt: Timestamp

export type SocialProvider = 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok' | 'whatsapp' | 'telegram' | 'youtube' | 'twitch' | 'pinterest';

export interface SocialConnection {
    id: string;
    userId: string;
    provider: SocialProvider;
    profileUrl: string;
    accessToken?: string | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Saves or updates a manual social connection link for a user.
 */
export async function saveSocialConnection(userId: string, provider: SocialProvider, profileUrl: string) {
    try {
        if (!userId) throw new Error('Unauthorized');

        const db = getAdminDb();
        const connectionsRef = db.collection('user_social_connections');

        // Check if connection already exists for this provider and user
        const snapshot = await connectionsRef
            .where('userId', '==', userId)
            .where('provider', '==', provider)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            // Update existing
            const docId = snapshot.docs[0].id;
            await connectionsRef.doc(docId).update({
                profileUrl,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                isActive: true
            });
            return { success: true, id: docId, action: 'updated' };
        } else {
            // Create new
            const newDoc = await connectionsRef.add({
                userId,
                provider,
                profileUrl,
                accessToken: null, // Prepared for Phase 2
                isActive: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: newDoc.id, action: 'created' };
        }
    } catch (error: any) {
        console.error('Error saving social connection:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Retrieves all active social connections for a user.
 */
export async function getUserSocialConnections(userId: string) {
    try {
        if (!userId) throw new Error('Unauthorized');

        const snapshot = await getAdminDb().collection('user_social_connections')
            .where('userId', '==', userId)
            .where('isActive', '==', true)
            .get();

        const connections: SocialConnection[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<SocialConnection, 'id'>),
            createdAt: doc.data().createdAt?.toDate().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate().toISOString(),
        }));

        return { success: true, connections };
    } catch (error: any) {
        console.error('Error getting social connections:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Perform Soft Delete (Deactivate)
 */
export async function deleteSocialConnection(connectionId: string, userId: string) {
    try {
        const docRef = getAdminDb().collection('user_social_connections').doc(connectionId);
        const doc = await docRef.get();

        if (!doc.exists) return { success: false, error: 'Not found' };
        if (doc.data()?.userId !== userId) return { success: false, error: 'Unauthorized' };

        await docRef.update({
            isActive: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
