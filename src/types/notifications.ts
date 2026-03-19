export interface Notification {
    id: string;
    toUserId: string;
    fromUserId: string;
    fromUserName: string;
    fromUserAvatar?: string;
    type: 'new_post' | 'friend_request' | 'like' | 'comment';
    postId?: string;
    neighborhood?: string;
    read: boolean;
    createdAt: any; // Firestore timestamp
}
