import { Timestamp } from 'firebase/firestore';

export interface Recommendation {
    id: string;
    businessId: string; // The business being recommended
    userId: string;     // The user making the recommendation
    userName: string;   // Denormalized for display
    userAvatar?: string;

    photoUrl: string;   // The uploaded photo path in Storage
    comment?: string;

    status: 'pending' | 'approved' | 'rejected';

    // Auto-generated metadata
    createdAt: Timestamp;

    // n8n Analysis results (stored here for debugging/transparency)
    aiAnalysis?: {
        isRelevant: boolean;
        confidence: number;
        tags: string[];
    };

    // Gamification
    pointsAwarded?: number;
}
