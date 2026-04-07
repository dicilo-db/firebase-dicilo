'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function updatePrivateProfile(uid: string, data: any) {
    try {
        if (!uid) {
            return { success: false, error: 'Unauthorized' };
        }

        const docRef = getAdminDb().collection('private_profiles').doc(uid);
        // const doc = await docRef.get();

        // if (!doc.exists) {
        //     return { success: false, error: 'Profile not found' };
        // }

        // Sanitize data to ensure it's a plain object and remove undefined
        const safeData = JSON.parse(JSON.stringify(data));

        await docRef.set({
            ...safeData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        return { success: true };
    } catch (error: any) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Ensures a unique code exists for the user.
 * Generates one if missing.
 */
import { generateUniqueCodeAdmin } from '@/lib/private-user-service';

export async function ensureUniqueCode(uid: string) {
    try {
        if (!uid) return { success: false, error: 'Unauthorized' };

        const docRef = getAdminDb().collection('private_profiles').doc(uid);
        const doc = await docRef.get();

        if (!doc.exists) return { success: false, error: 'Profile not found' };

        const data = doc.data();
        if (data?.uniqueCode) {
            return { success: true, uniqueCode: data.uniqueCode };
        }

        // Generate Code
        const firstName = data?.firstName || 'User';
        const lastName = data?.lastName || '';
        const phoneNumber = data?.contactPreferences?.whatsapp || data?.contactPreferences?.telegram || data?.phoneNumber || '000';

        const uniqueCode = await generateUniqueCodeAdmin(firstName, lastName, phoneNumber);

        await docRef.update({
            uniqueCode: uniqueCode,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { success: true, uniqueCode };

    } catch (error: any) {
        console.error('Error ensuring unique code:', error);
        return { success: false, error: error.message };
    }
}


export async function getUserProfileSummary(uid: string) {
    try {
        if (!uid) return { success: false, error: 'Unauthorized' };

        const docRef = getAdminDb().collection('private_profiles').doc(uid);
        const doc = await docRef.get();

        if (!doc.exists) return { success: false, error: 'Profile not found' };

        const data = doc.data();
        return {
            success: true,
            data: {
                firstName: data?.firstName || '',
                lastName: data?.lastName || '',
                uniqueCode: data?.uniqueCode || '',
                role: data?.role || 'user'
            }
        };


    } catch (error: any) {
        console.error('Error fetching profile summary:', error);
        return { success: false, error: error.message };
    }
}

export async function getProfile(uid: string) {
    try {
        if (!uid) return null;
        const docRef = getAdminDb().collection('private_profiles').doc(uid);
        const doc = await docRef.get();
        if (!doc.exists) return null;
        return doc.data();
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

export async function completeOnboarding(
    uid: string, 
    data: { country: string; city: string; items: string[] }, 
    userType: 'private' | 'client', 
    clientId?: string
) {
    try {
        const db = getAdminDb();
        const updatePayload = {
            country: data.country,
            city: data.city,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (userType === 'private') {
            await db.collection('private_profiles').doc(uid).set({
                ...updatePayload,
                interests: data.items
            }, { merge: true });
        } else if (userType === 'client' && clientId) {
            await db.collection('clients').doc(clientId).set({
                ...updatePayload,
                // Si la empresa no tenía categoría asignada, le ponemos la primera que eligió
                category: data.items[0] || 'other' 
            }, { merge: true });
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error completando onboarding:', error);
        return { success: false, error: error.message };
    }
}
