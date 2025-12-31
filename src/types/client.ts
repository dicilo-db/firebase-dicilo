import type { Timestamp } from 'firebase/firestore';

export interface MarqueeHeaderData {
    enabled: boolean;
    offerEnabled?: boolean;
    offerEndDate?: Timestamp | string;
    leftButtonText?: string;
    leftButtonLink?: string;
    middleText?: string;
    clubButtonText?: string;
    clubButtonLink?: string;
    marqueeText?: string;
    rightButton1Text?: string;
    rightButton1Link?: string;
    rightButton2Text?: string;
    rightButton2Link?: string;
}

export interface HeaderData {
    welcomeText?: string;
    headerImageUrl?: string;
    embedCode?: string;
    socialShareText?: string;
    socialLinks?: { icon: string; url: string }[];
    headerBackgroundColor?: string;
    headerBackgroundImageUrl?: string;
    clientLogoWidth?: number;
    headerTextColor?: string;
    dividerLine?: {
        enabled: boolean;
        color?: string;
        thickness?: number;
    };
    bannerType?: 'embed' | 'url' | 'upload';
    bannerEmbedCode?: string;
    bannerImageUrl?: string;
    bannerImageWidth?: number;
    bannerImageHeight?: number;
    bannerShareUrl?: string;
}

export interface InfoCardData {
    title: string;
    content: string;
}

export interface GraphicData {
    imageUrl: string;
    targetUrl: string;
    text?: string;
}

export interface BodyData {
    title?: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string;
    imageHint?: string;
    videoUrl?: string;
    ctaButtonText?: string;
    ctaButtonLink?: string;
    layout?: 'image-left' | 'image-right';
    body2BackgroundColor?: string;
}

export interface ClientData {
    id: string;
    clientName: string;
    clientType: 'retailer' | 'premium' | 'starter';
    clientLogoUrl: string;

    // Wallet / Ads fields
    budget_remaining?: number; // Available funds
    total_invested?: number;   // Lifetime spend

    headerData?: HeaderData;
    marqueeHeaderData?: MarqueeHeaderData;
    bodyData?: BodyData;
    infoCards?: InfoCardData[];
    graphics?: GraphicData[];
    translations: any;
    slug: string;
    category?: string;
    subcategory?: string;
    layout?: any[];
    coordinates?: { lat: number; lng: number };
    address?: string;
    phone?: string;
    website?: string;
    email?: string;
    galleryImages?: string[];
    ownerUid?: string;

    // New fields
    products?: {
        name: string;
        price: string;
        description?: string;
        imageUrl?: string;
    }[];
    visibility_settings?: {
        active_range?: 'local' | 'regional' | 'national' | 'continental' | 'international';
        geo_coordinates?: { lat: number; lng: number } | null;
        allowed_continents?: string[] | null;
    } | null;
    layout?: any[];
}
