import type { Timestamp } from 'firebase/firestore';

export type MarketRole = 'buyer' | 'seller';
export type MarketModality = 'direct' | 'intermediary';

export const MARKET_CATEGORIES = [
    'energy',
    'real_estate',
    'transport',
    'agriculture',
    'precious_metals',
    'other',
] as const;

export type MarketCategory = typeof MARKET_CATEGORIES[number];

export type ProvisionType = 'percentage' | 'fixed_amount';

export interface MarketOffer {
    id?: string;
    userId: string;
    createdAt: Timestamp | any;
    updatedAt: Timestamp | any;
    
    // Roles
    primaryRole: MarketRole;
    modality: MarketModality;
    
    // Financials
    provisionType: ProvisionType;
    provisionValue: number;
    provisionDescription?: string;
    
    // Categorization
    category: MarketCategory;
    subCategory: string;
    
    // Details
    title: string;
    description: string;
    volumeOrQuantity?: string;
    status: 'active' | 'negotiation' | 'closed';
}
