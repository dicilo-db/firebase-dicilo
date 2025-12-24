export type CampaignStatus = 'active' | 'gray_mode' | 'paused' | 'ended';

export interface Campaign {
    id: string;
    companyId: string;
    companyName: string;
    companyLogo?: string;
    title: string;
    description: string;
    images: string[];
    budget_marketing: number; // For freelancers
    budget_banners: number;   // For ads
    rate_per_click: number;
    categories: string[];
    languages: ('es' | 'en' | 'de')[];
    target_locations: string[]; // e.g. ["Madrid", "Berlin", "Global"]
    status: CampaignStatus;
    gray_mode_trigger: boolean; // true if budget <= 0
    createdAt: any; // Firestore Timestamp
}

export interface Promotion {
    id?: string;
    campaignId: string;
    freelancerId: string;
    customText: string;
    selectedImage: string;
    trackingLink: string;
    platform: 'whatsapp' | 'instagram' | 'telegram' | 'facebook' | 'twitter' | 'linkedin';
    status: 'draft' | 'scheduled' | 'published';
    scheduledDate?: any;
    createdAt: any;
}

export interface FreelancerProfile {
    userId: string;
    categories: string[];
    languages: ('es' | 'en' | 'de')[];
    location: {
        city?: string;
        country?: string;
        coordinates?: { lat: number, lng: number };
    };
    stats: {
        totalClicks: number;
        pendingBalance: number;
        clearedBalance: number;
        diciPoints: number;
    };
    isActive: boolean;
}
