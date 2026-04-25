'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { headers } from 'next/headers';

interface InviteFriend {
    name: string;
    email: string;
    lang: 'es' | 'de' | 'en' | 'fr' | 'pt' | 'it';
    template?: string;
    company?: string;
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
    friends: (InviteFriend & { rewardSender?: number, rewardReceiver?: number })[]
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

        const commonTypos: Record<string, string> = {
            'gamil.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gemail.com': 'gmail.com', 
            'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'jmail.com': 'gmail.com', 'gmoil.com': 'gmail.com',
            'homail.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 
            'hotmail.con': 'hotmail.com', 'hormail.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'jimeil.com': 'hotmail.com', 'hitmail.com': 'hotmail.com',
            'yaho.com': 'yahoo.com', 'yajoo.com': 'yahoo.com', 'yahoo.con': 'yahoo.com', 'yahoo.co': 'yahoo.com',
            'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'outloo.com': 'outlook.com',
            'iclud.com': 'icloud.com', 'icloud.con': 'icloud.com'
        };

        const generatedIds: string[] = [];

        for (const friend of friends) {
            const email = friend.email.trim().toLowerCase();
            const domainParts = email.split('@');
            if (domainParts.length === 2) {
                const domain = domainParts[1];
                if (commonTypos[domain]) {
                    return { success: false, error: `El correo "${email}" parece estar mal escrito. ¿Quisiste decir @${commonTypos[domain]}?` };
                }
            }

            // Check duplicates in referrals_pioneers
            const existPioneer = await referralsRef.where('friendEmail', '==', email).limit(1).get();
            if (!existPioneer.empty) {
                return { success: false, error: `El correo ${email} ya está registrado en la base de datos de prospectos.` };
            }

            const newDocRef = referralsRef.doc();
            generatedIds.push(newDocRef.id);

            const docData: any = {
                referrerId,
                referrerName,
                friendName: friend.name || '',
                friendEmail: email,
                companyName: friend.company || '',
                lang: friend.lang.toLowerCase(),
                status: 'sent', // Or 'draft' depending on email sending outcome
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                opened: false,
                template: friend.template || 'default'
            };

            if (friend.rewardSender !== undefined) {
                docData.rewardSender = friend.rewardSender;
            }
            if (friend.rewardReceiver !== undefined) {
                docData.rewardReceiver = friend.rewardReceiver;
            }

            batch.set(newDocRef, docData);
        }

        await batch.commit();

        return { success: true, sentCount: friends.length, inviteIds: generatedIds };
    } catch (error: any) {
        console.error('Error sending invitations:', error);
        return { success: false, error: error.message };
    }
}
