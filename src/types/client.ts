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
    clientType: 'retailer' | 'premium';
    clientLogoUrl: string;
    headerData?: HeaderData;
    marqueeHeaderData?: MarqueeHeaderData;
    bodyData?: BodyData;
    infoCards?: InfoCardData[];
    graphics?: GraphicData[];
    translations: any;
    slug: string;
    layout?: any[];
}
