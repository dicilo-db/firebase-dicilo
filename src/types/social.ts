export interface User {
    uid: string;
    displayName: string;
    photoURL?: string;
    neighborhood?: string; // To filter by "Barrio Actual"
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    status: FriendRequestStatus;
    createdAt: number;
}

export type ChatRoomType = 'direct' | 'group';

export interface ChatRoom {
    id: string;
    type: ChatRoomType;
    participants: User[];
    name?: string; // Optional for groups
    lastMessage?: Message;
    updatedAt: number;
}

export interface Message {
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    timestamp: number;
    readBy: string[]; // List of User IDs who have read the message
}
