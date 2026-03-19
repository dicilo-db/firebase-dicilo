export interface MediaItem {
    type: 'image' | 'video';
    url: string;
}

export interface CommunityPost {
    id: string;
    content: string;
    imageUrl?: string;
    media?: MediaItem[];
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
