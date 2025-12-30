export type CampaignStatus = 'active' | 'gray_mode' | 'paused' | 'ended' | 'draft';

export interface CampaignTranslation {
    title: string;
    description: string;
    promo_text?: string;
}

export interface Campaign {
    id: string;
    clientId: string; // Reference to business/user
    companyId: string;
    companyName: string;
    companyLogo?: string;

    // Internal & Financials
    status: CampaignStatus;
    budget_total: number;
    budget_remaining: number;
    cost_per_action: number;   // Charged to client
    reward_per_action: number; // Paid to freelancer (replaces rate_per_click)
    rate_per_click: number;    // Keeping for backward compat, same as reward_per_action
    daily_cap_per_user: number;

    // Content & I18n
    default_language: string;
    translations: { [langCode: string]: CampaignTranslation };
    tracking_ids?: { [langCode: string]: string };
    target_urls?: { [langCode: string]: string[] }; // Destination/Landing Page URLs

    // Legacy/Display fields (can be populated from default translation)
    title: string;
    description: string;

    images: string[];
    categories: string[];
    languages: string[]; // Supported languages codes
    target_locations: string[];
    gray_mode_trigger: boolean;
    createdAt: any;
}

export interface CampaignAction {
    id?: string;
    campaignId: string;
    freelancerId: string;
    languageCode: string;
    status: 'pending' | 'approved' | 'rejected' | 'scheduled' | 'published'; // Expanded status
    rewardAmount: number;
    createdAt: any;

    // Display / Expanded fields
    companyName?: string;
    actionType?: string; // 'share', 'click', 'post'
    platform?: string; // 'facebook', 'instagram', etc.
    topic?: string;
    views?: number;
    clicks?: number;
}

export interface Promotion {
    id?: string;
    campaignId: string;
    freelancerId: string;
    customText: string;
    selectedImage: string;
    trackingLink: string;
    platform: 'whatsapp' | 'instagram' | 'telegram' | 'facebook' | 'twitter' | 'linkedin' | 'clipboard';
    status: 'draft' | 'scheduled' | 'published';
    scheduledDate?: any;
    createdAt: any;
}

export interface FreelancerProfile {
    userId: string;
    categories: string[];
    languages: string[];
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
    walletStatus?: 'active' | 'pending_setup';
    revolutTag?: string;
}
