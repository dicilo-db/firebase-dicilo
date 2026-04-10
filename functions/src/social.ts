import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

/**
 * Triggered on community post creation.
 * Rewards the user with 1 DP and records the transaction/action.
 */
export const onCommunityPostCreated = onDocumentCreated('community_posts/{postId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        logger.info('No data in post, exiting.');
        return;
    }

    const post = snapshot.data();
    if (!post || !post.userId) {
        logger.info('Post missing data or userId, exiting.');
        return;
    }

    const userId = post.userId;
    const postId = event.params.postId;
    const db = admin.firestore();

    try {
        await db.runTransaction(async (t) => {
            // 1. Update Wallet
            const walletRef = db.collection('wallets').doc(userId);
            const walletDoc = await t.get(walletRef);

            if (!walletDoc.exists) {
                // If wallet doesn't exist, create it with 1 DP
                t.set(walletRef, {
                    userId,
                    balance: 1,
                    totalEarned: 1,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            } else {
                t.update(walletRef, {
                    balance: admin.firestore.FieldValue.increment(1),
                    totalEarned: admin.firestore.FieldValue.increment(1),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }

            // 2. Register Transaction in History
            const trxRef = db.collection('wallet_transactions').doc();
            t.set(trxRef, {
                userId,
                amount: 1,
                type: 'COMMUNITY_POST_REWARD',
                description: 'Recompensa por publicación en comunidad',
                postId,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            // 3. Register Action for Statistics (Dashboard Stats relies on this)
            const actionRef = db.collection('user_campaign_actions').doc();
            t.set(actionRef, {
                userId,
                actionType: 'community_post_reward',
                rewardAmount: 1,
                companyName: 'Comunidad',
                companyId: 'community',
                postId,
                created_at: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        logger.info(`Successfully rewarded user ${userId} for post ${postId}`);

    } catch (error) {
        logger.error(`Error rewarding user ${userId} for post ${postId}:`, error);
    }
});
