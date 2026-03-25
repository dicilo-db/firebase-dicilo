'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';

const db = getAdminDb();
const auth = getAuth();

/**
 * Sends a friend request and creates a notification for the recipient.
 */
export async function sendFriendRequestAction(fromUserId: string, toUserId: string) {
    if (!fromUserId || !toUserId) {
        return { success: false, error: 'Faltan datos de usuario.' };
    }

    try {
        // 1. Check if request already exists
        const existing = await db.collection('friend_requests')
            .where('fromUserId', '==', fromUserId)
            .where('toUserId', '==', toUserId)
            .get();

        if (!existing.empty) {
            return { success: false, error: 'Ya has enviado una solicitud a este usuario.' };
        }

        // 2. Get sender info for notification denormalization
        let fromUserName = 'Un vecino';
        let fromUserAvatar = '';

        try {
            const userRecord = await auth.getUser(fromUserId);
            fromUserName = userRecord.displayName || 'Un vecino';
            fromUserAvatar = userRecord.photoURL || '';
        } catch (e) {
            console.warn("Auth getUser failed in sendFriendRequestAction", e);
        }

        try {
            const profileSnap = await db.collection('private_profiles').doc(fromUserId).get();
            if (profileSnap.exists) {
                const profile = profileSnap.data();
                if (profile?.firstName) {
                    fromUserName = `${profile.firstName} ${profile.lastName || ''}`.trim();
                }
                if (profile?.imgUrl) {
                    fromUserAvatar = profile.imgUrl;
                }
            }
        } catch (e) {
            console.warn("Profile fetch failed in sendFriendRequestAction", e);
        }

        // 3. Create Friend Request
        const batch = db.batch();
        const requestRef = db.collection('friend_requests').doc();
        batch.set(requestRef, {
            fromUserId,
            toUserId,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 4. Create Notification
        const notifRef = db.collection('notifications').doc();
        batch.set(notifRef, {
            toUserId,
            fromUserId,
            fromUserName,
            fromUserAvatar,
            type: 'friend_request',
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();

        return { success: true };
    } catch (error: any) {
        console.error('Error in sendFriendRequestAction:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Responds to a friend request.
 */
export async function respondToFriendRequestAction(requestId: string, status: 'accepted' | 'rejected') {
    if (!requestId) return { success: false, error: 'ID de solicitud faltante.' };

    try {
        const batch = db.batch();
        const requestRef = db.collection('friend_requests').doc(requestId);
        
        batch.update(requestRef, {
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        if (status === 'accepted') {
            const reqSnap = await requestRef.get();
            if (reqSnap.exists) {
                const reqData = reqSnap.data();
                if (reqData && reqData.fromUserId && reqData.toUserId) {
                    const fromUserId = reqData.fromUserId;
                    const toUserId = reqData.toUserId; // Whoever is receiving and accepting

                    // Get acceptor info
                    let toUserName = 'Un vecino';
                    let toUserAvatar = '';

                    try {
                        const profileSnap = await db.collection('private_profiles').doc(toUserId).get();
                        if (profileSnap.exists) {
                            const profile = profileSnap.data();
                            if (profile?.firstName) {
                                toUserName = `${profile.firstName} ${profile.lastName || ''}`.trim();
                            }
                            if (profile?.photoURL || profile?.imgUrl) {
                                toUserAvatar = profile.photoURL || profile.imgUrl || '';
                            }
                        }
                    } catch (e) {
                        console.warn("Profile fetch failed in respondToFriendRequestAction", e);
                    }

                    const notifRef = db.collection('notifications').doc();
                    batch.set(notifRef, {
                        toUserId: fromUserId, // Send to the original requester
                        fromUserId: toUserId,
                        fromUserName: toUserName,
                        fromUserAvatar: toUserAvatar,
                        type: 'friend_request_accepted',
                        read: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
        }

        await batch.commit();
        return { success: true };
    } catch (error: any) {
        console.error('Error in respondToFriendRequestAction:', error);
        return { success: false, error: error.message };
    }
}
