export interface CommunityPost {
    id: string;
    content: string;
    imageUrl?: string;
    userId: string;
    userName: string;
    userAvatar: string;
    neighborhood: string;
    createdAt: any; // Firestore Timestamp or Date
    likes: string[];
    language: string;
    commentCount?: number;
    visibility?: 'public' | 'private';
}
