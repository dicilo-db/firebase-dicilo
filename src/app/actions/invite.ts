'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { headers } from 'next/headers';

interface InviteFriend {
    name: string;
    email: string;
    lang: 'es' | 'de' | 'en' | 'fr' | 'pt' | 'it';
    template?: string;
}

interface SendInvitationResult {
    success: boolean;
    sentCount?: number;
    inviteIds?: string[];
    error?: string;
}

export async function sendPioneerInvitations(
    referrerId: string,
    referrerName: string,
    friends: (InviteFriend & { rewardAmount?: number })[]
): Promise<SendInvitationResult> {
    try {
        if (!referrerId) {
            return { success: false, error: 'Unauthorized' };
        }

        const db = getAdminDb();
        const batch = db.batch();
        const referralsRef = db.collection('referrals_pioneers');

        // 1. Get User Role to determine daily limit
        const userDoc = await db.collection('users_private').doc(referrerId).get();
        const userData = userDoc.data();
        const userRole = userData?.role || 'user';

        let dailyLimit = 300; // Default for normal users
        if (userRole === 'superadmin') {
            dailyLimit = 3000;
        } else if (userRole === 'admin') {
            dailyLimit = 1500;
        }

        // 2. Count invites sent TODAY (UTC)
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        
        const todayInvites = await referralsRef
            .where('referrerId', '==', referrerId)
            .where('createdAt', '>=', startOfDay)
            .get();

        const currentCount = todayInvites.size;

        if (currentCount + friends.length > dailyLimit) {
            return { 
                success: false, 
                error: `Daily limit reached. Your limit is ${dailyLimit} per day. You have already sent ${currentCount} today.` 
            };
        }

        const generatedIds: string[] = [];

        for (const friend of friends) {
            const newDocRef = referralsRef.doc();
            generatedIds.push(newDocRef.id);

            batch.set(newDocRef, {
                referrerId,
                referrerName,
                friendName: friend.name,
                friendEmail: friend.email,
                lang: friend.lang.toLowerCase(),
                status: 'sent', // Or 'draft' depending on email sending outcome
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                opened: false,
                template: friend.template || 'default',
                rewardAmount: friend.rewardAmount || 10
            });
        }

        await batch.commit();

        return { success: true, sentCount: friends.length, inviteIds: generatedIds };
    } catch (error: any) {
        console.error('Error sending invitations:', error);
        return { success: false, error: error.message };
    }
}
