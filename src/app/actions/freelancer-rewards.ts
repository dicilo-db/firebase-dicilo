'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export type ActionType = 'email_sent' | 'converted_to_client' | 'p2_data_updated' | 'p2_sent_to_client';
export type RecordType = 'referrals_pioneers' | 'businesses';

export async function logActionAndReward(
    userId: string, 
    actionType: ActionType, 
    recordId: string, 
    recordType: RecordType
): Promise<{ success: boolean; error?: string }> {
    try {
        const db = getAdminDb();
        
        // 1. Fetch User Profile to get Name and Role
        const profileSnap = await db.collection('private_profiles').doc(userId).get();
        if (!profileSnap.exists) {
            return { success: false, error: 'Usuario no encontrado' };
        }
        const profileData = profileSnap.data();
        const userName = profileData?.name || profileData?.firstName || 'Usuario Desconocido';
        const role = profileData?.role || 'freelancer'; // Default to freelancer if missing
        
        // 2. Determine Rewards based on Action and Role
        let eurReward = 0;
        let dpReward = 0;

        if (actionType === 'email_sent' || actionType === 'converted_to_client') {
            // Rewards for Ficha Técnica Actions
            eurReward = 0.10;
            dpReward = 50;
        } else if (actionType === 'p2_data_updated' || actionType === 'p2_sent_to_client') {
            // Rewards for P2 Records
            if (role === 'team_office' || role === 'partner_b2b' || role === 'admin' || role === 'superadmin') {
                // Assuming team leader roles
                eurReward = 0.10;
                dpReward = 20;
            } else {
                // Regular freelancer
                eurReward = 0.05;
                dpReward = 10;
            }
        }

        const now = admin.firestore.FieldValue.serverTimestamp();

        // 3. Prepare Audit Log Entry
        const logEntry = {
            userId,
            userName,
            action: actionType,
            timestamp: now,
            eurReward,
            dpReward
        };

        // 4. Execute Transaction to update wallet and record history
        await db.runTransaction(async (transaction) => {
            // Update Record History
            const recordRef = db.collection(recordType).doc(recordId);
            transaction.update(recordRef, {
                activityHistory: admin.firestore.FieldValue.arrayUnion(logEntry)
            });

            // Update Wallet
            if (eurReward > 0 || dpReward > 0) {
                const walletRef = db.collection('wallets').doc(userId);
                const walletSnap = await transaction.get(walletRef);
                
                if (walletSnap.exists) {
                    transaction.update(walletRef, {
                        eurBalance: admin.firestore.FieldValue.increment(eurReward),
                        balance: admin.firestore.FieldValue.increment(dpReward),
                        updatedAt: now
                    });
                } else {
                    transaction.set(walletRef, {
                        eurBalance: eurReward,
                        balance: dpReward,
                        createdAt: now,
                        updatedAt: now
                    });
                }
            }
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error logging action and rewarding:", error);
        return { success: false, error: error.message };
    }
}
