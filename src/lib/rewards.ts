import { getAdminDb } from './firebase-admin';

export type RewardResolution = {
    rewardSender: number;
    rewardReceiver: number;
    referrerId: string | null;
    inviteId: string | null;
    templateId: string | null;
};

/**
 * Resolves the correct reward amounts for a referral based on an invitation ID or email.
 * Priority: inviteId > email.
 */
export async function resolveRewards(inviteId?: string, email?: string): Promise<RewardResolution> {
    const db = getAdminDb();
    const result: RewardResolution = {
        rewardSender: 50,
        rewardReceiver: 50,
        referrerId: null,
        inviteId: inviteId || null,
        templateId: null
    };

    try {
        let inviteData: any = null;
        let inviteDocId: string | null = null;

        // 1. Try lookup by inviteId
        if (inviteId) {
            const inviteSnap = await db.collection('referrals_pioneers').doc(inviteId).get();
            if (inviteSnap.exists) {
                inviteData = inviteSnap.data();
                inviteDocId = inviteSnap.id;
            }
        }

        // 2. Fallback to lookup by email if not found by ID
        if (!inviteData && email) {
            const inviteQuery = await db.collection('referrals_pioneers')
                .where('friendEmail', '==', email)
                .where('status', '==', 'sent')
                .limit(1)
                .get();
            
            if (!inviteQuery.empty) {
                inviteData = inviteQuery.docs[0].data();
                inviteDocId = inviteQuery.docs[0].id;
            }
        }

        if (inviteData) {
            result.referrerId = inviteData.referrerId || null;
            result.inviteId = inviteDocId;
            result.templateId = inviteData.templateId || null;

            // Use values from the invitation if present
            if (typeof inviteData.rewardSender === 'number') {
                result.rewardSender = inviteData.rewardSender;
            }
            if (typeof inviteData.rewardReceiver === 'number') {
                result.rewardReceiver = inviteData.rewardReceiver;
            }

            // If rewards are missing (legacy), try to fetch from the original template
            if ((!inviteData.rewardSender || !inviteData.rewardReceiver) && inviteData.templateId) {
                const templateSnap = await db.collection('email_templates').doc(inviteData.templateId).get();
                if (templateSnap.exists) {
                    const templateData = templateSnap.data();
                    if (typeof templateData?.rewardSender === 'number') {
                        result.rewardSender = templateData.rewardSender;
                    }
                    if (typeof templateData?.rewardReceiver === 'number') {
                        result.rewardReceiver = templateData.rewardReceiver;
                    }
                }
            }
        }
    } catch (error) {
        console.error('[Rewards] Error resolving rewards:', error);
    }

    return result;
}
