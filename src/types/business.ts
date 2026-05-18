import type { Timestamp } from 'firebase/firestore';

export type BusinessPlan = 'basic' | 'starter' | 'minorista' | 'premium';

export interface BusinessProfile {
    id?: string;
    ownerUid: string;
    companyName: string;
    plan: BusinessPlan;
    
    // Status tracking
    profileCompletionScore: number; // 0 to 100
    status: 'pending' | 'review' | 'active';
    landingEnabled: boolean; // Set to true only if profileCompletionScore >= 85
    
    // Company details
    logoUrl?: string;
    bannerUrl?: string;
    description?: string;
    category?: string;
    subcategory?: string;
    
    // Contact Info
    phone?: string;
    email?: string;
    website?: string;
    whatsapp?: string;
    
    // Location
    address?: string;
    city?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
    
    createdAt?: Timestamp | Date;
    updatedAt?: Timestamp | Date;
}

export interface BusinessProduct {
    id?: string;
    companyId: string;
    name: string;
    description: string;
    price: string | number;
    currency: string;
    images: string[];
    category: string;
    subcategory?: string;
    language: string;
    country: string;
    hasActivePromotion: boolean;
    promotionDetails?: string;
    couponId?: string; // If linked to a coupon
    createdAt?: Timestamp | Date;
    updatedAt?: Timestamp | Date;
}
