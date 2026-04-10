export interface Subcategory {
    id: string; // slug
    name: {
        de: string;
        en?: string;
        es?: string;
    };
    order?: number;
    businessCount?: number;
}

export interface Category {
    id: string; // slug (e.g. 'beratung-coaching')
    name: {
        de: string;
        en?: string;
        es?: string;
    };
    icon: string; // Lucide icon name
    order: number;
    businessCount: number; // For performance (read-heavy)
    subcategories: Subcategory[];
}
