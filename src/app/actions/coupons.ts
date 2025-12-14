'use server';

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Types
export interface CouponData {
    companyId: string;
    companyName: string;
    category: string;
    title: string;
    description: string;
    startDate: string; // ISO string
    endDate: string; // ISO string
    country: string;
    city: string;
    // New Fields
    discountType: 'euro' | 'percent' | 'text';
    discountValue?: string; // e.g. "20", "50", or empty if text
    backgroundImage?: string; // Auto-generated
}

export interface CouponFilter {
    search?: string;
    country?: string;
    city?: string;
    month?: string; // YYYY-MM
    status?: string; // active, expired, scheduled
}

// Simulated AI Background Generator
// Maps categories to high-quality Unsplash source URLs
const CATEGORY_BACKGROUNDS: Record<string, string> = {
    'Gastronomie & Kulinarik': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1000', // Food/Restaurant
    'Gesundheit & Wellness': 'https://images.unsplash.com/photo-1544367563-12123d8965cd?auto=format&fit=crop&q=80&w=1000', // Spa/Wellness
    'Gesundheit & Hörakustiker': 'https://images.unsplash.com/photo-1582234559530-9eb4c9e4fb64?auto=format&fit=crop&q=80&w=1000', // Medical/Person
    'Hotellerie & Hotels Boutique': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000', // Hotel Room
    'Reise & Tourismus': 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=1000', // Landscape/Travel
    // Fallbacks
    'default': 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1000' // Abstract gradient
};

function generateCouponBackground(category: string): string {
    // Basic fuzzy matching if exact key isn't found
    if (CATEGORY_BACKGROUNDS[category]) return CATEGORY_BACKGROUNDS[category];

    const lowerCat = category.toLowerCase();
    if (lowerCat.includes('gastro') || lowerCat.includes('restaur')) return CATEGORY_BACKGROUNDS['Gastronomie & Kulinarik'];
    if (lowerCat.includes('gesund') || lowerCat.includes('health') || lowerCat.includes('arzt')) return CATEGORY_BACKGROUNDS['Gesundheit & Wellness'];
    if (lowerCat.includes('hotel') || lowerCat.includes('unterkunft')) return CATEGORY_BACKGROUNDS['Hotellerie & Hotels Boutique'];
    if (lowerCat.includes('reise') || lowerCat.includes('tour')) return CATEGORY_BACKGROUNDS['Reise & Tourismus'];

    return CATEGORY_BACKGROUNDS['default'];
}

/**
 * Creates a new coupon.
 */
export async function createCoupon(data: CouponData) {
    try {
        // Generate a unique code
        // Format: DCL-CPN-{RANDOM6}
        const codeSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const code = `DCL-CPN-${codeSuffix}`;

        // Ensure Uniqueness (Simple check, could be loop if robust needed)
        const check = await adminDb.collection('coupons').where('code', '==', code).get();
        if (!check.empty) {
            return { success: false, error: 'Code generation collision, please try again.' };
        }

        const couponRef = adminDb.collection('coupons').doc();

        const now = new Date();
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);

        let status = 'active';
        if (end < now) status = 'expired';
        if (start > now) status = 'scheduled';

        // AI Background Generation
        const bgImage = data.backgroundImage || generateCouponBackground(data.category);

        await couponRef.set({
            ...data,
            backgroundImage: bgImage, // Ensure it's set
            code,
            status,
            startDate: admin.firestore.Timestamp.fromDate(start),
            endDate: admin.firestore.Timestamp.fromDate(end),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return { success: true, id: couponRef.id, code };
    } catch (error: any) {
        console.error('Error creating coupon:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get stats for categories (Active vs Total)
 */
export async function getCouponStats() {
    try {
        const snapshot = await adminDb.collection('coupons').get();
        const stats: Record<string, { active: number; total: number }> = {};

        const now = new Date();

        snapshot.forEach(doc => {
            const data = doc.data();
            const cat = data.category || 'Uncategorized';
            const end = data.endDate.toDate();

            if (!stats[cat]) stats[cat] = { active: 0, total: 0 };

            stats[cat].total++;
            if (end >= now) {
                stats[cat].active++;
            }
        });

        return { success: true, stats };
    } catch (error: any) {
        console.error('Error fetching coupon stats:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get ALL coupons with filters (Central Admin View)
 */
export async function getAllCoupons(filters: CouponFilter) {
    try {
        let query = adminDb.collection('coupons').orderBy('createdAt', 'desc');

        // Note: Firestore limitation on multiple inequality filters/where clauses without composite indexes.
        // We will fetch mostly active/recent and filter in memory for complex combinations 
        // OR rely on direct indexes if simple.

        // For Admin List, we usually want everything, but let's limit if no search
        // query = query.limit(100); 

        const snapshot = await query.get();
        let coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

        // In-Memory Filtering
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            coupons = coupons.filter(c =>
                c.companyName?.toLowerCase().includes(searchLower) ||
                c.title?.toLowerCase().includes(searchLower) ||
                c.code?.toLowerCase().includes(searchLower) ||
                c.category?.toLowerCase().includes(searchLower)
            );
        }

        if (filters.country) {
            coupons = coupons.filter(c => c.country === filters.country);
        }
        if (filters.city) {
            coupons = coupons.filter(c => c.city === filters.city);
        }

        const now = new Date();

        // Recalculate status and Serialize
        const serializedCoupons = coupons.map(c => {
            const start = c.startDate?.toDate ? c.startDate.toDate() : new Date(c.startDate);
            const end = c.endDate?.toDate ? c.endDate.toDate() : new Date(c.endDate);
            const createdAt = c.createdAt?.toDate ? c.createdAt.toDate() : (c.createdAt ? new Date(c.createdAt) : null);

            let status = 'active';
            if (end < now) status = 'expired';
            else if (start > now) status = 'scheduled';

            // Filter by Status if requested
            if (filters.status && filters.status !== 'all' && status !== filters.status) return null;

            // Filter by Month if requested
            if (filters.month) {
                const [year, month] = filters.month.split('-').map(Number);
                const createdMatch = createdAt && createdAt.getFullYear() === year && (createdAt.getMonth() + 1) === month;
                const endMatch = end && end.getFullYear() === year && (end.getMonth() + 1) === month;
                if (!createdMatch && !endMatch) return null;
            }

            return {
                id: String(c.id || ''),
                companyId: String(c.companyId || ''),
                companyName: String(c.companyName || ''),
                category: String(c.category || ''),
                title: String(c.title || ''),
                description: String(c.description || ''),
                country: String(c.country || ''),
                city: String(c.city || ''),
                code: String(c.code || ''),
                discountType: String(c.discountType || 'text'),
                discountValue: String(c.discountValue || ''),
                backgroundImage: String(c.backgroundImage || CATEGORY_BACKGROUNDS['default']),
                startDate: !isNaN(start.getTime()) ? start.toISOString() : '',
                endDate: !isNaN(end.getTime()) ? end.toISOString() : '',
                createdAt: createdAt && !isNaN(createdAt.getTime()) ? createdAt.toISOString() : null,
                status: String(status)
            };
        }).filter(Boolean); // Remove nulls from filters

        return { success: true, coupons: serializedCoupons };

    } catch (error: any) {
        console.error('Error fetching all coupons:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get coupons by category with filters
 * (Mainly for frontend public view search)
 */
export async function getCouponsByCategory(category: string, filters: CouponFilter) {
    try {
        let query = adminDb.collection('coupons').where('category', '==', category);

        if (filters.country) {
            query = query.where('country', '==', filters.country);
        }
        if (filters.city) {
            query = query.where('city', '==', filters.city);
        }

        const snapshot = await query.get();
        let coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

        // In-Memory Filtering for Search and Month
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            coupons = coupons.filter(c =>
                c.companyName?.toLowerCase().includes(searchLower) ||
                c.title?.toLowerCase().includes(searchLower) ||
                c.code?.toLowerCase().includes(searchLower)
            );
        }

        // ... (Similar month filter logic if needed)

        // Sort A-Z by Company
        coupons.sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''));

        // Recalculate status dynamically
        const now = new Date();
        coupons = coupons.map(c => {
            const start = c.startDate?.toDate ? c.startDate.toDate() : new Date(c.startDate);
            const end = c.endDate?.toDate ? c.endDate.toDate() : new Date(c.endDate);

            let status = 'active';
            if (end < now) status = 'expired';
            else if (start > now) status = 'scheduled';

            return {
                ...c,
                id: c.id,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                discountType: c.discountType || 'text',
                discountValue: c.discountValue || '',
                backgroundImage: c.backgroundImage || CATEGORY_BACKGROUNDS['default'],
                status
            };
        });

        return { success: true, coupons };
    } catch (error: any) {
        console.error('Error fetching coupons:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Search Private Users for Assignment
 */
export async function searchPrivateUsers(term: string) {
    try {
        if (!term || term.length < 2) return { success: true, users: [] };

        // Search by email, name, or phone.
        // Firestore doesn't support OR queries across different fields natively (well, it does with 'in', but not 'contains' for multiple fields).
        // We'll search primarily by email or firstName.

        // 1. Search by exact email
        const emailQuery = adminDb.collection('private_profiles')
            .where('email', '>=', term)
            .where('email', '<=', term + '\uf8ff')
            .limit(5);

        // 2. Search by firstName
        const nameQuery = adminDb.collection('private_profiles')
            .where('firstName', '>=', term)
            .where('firstName', '<=', term + '\uf8ff')
            .limit(5);

        const [emailRes, nameRes] = await Promise.all([emailQuery.get(), nameQuery.get()]);

        const usersMap = new Map();

        [...emailRes.docs, ...nameRes.docs].forEach(doc => {
            const data = doc.data();
            usersMap.set(doc.id, {
                id: doc.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.contactPreferences?.whatsapp || data.contactPreferences?.telegram || 'N/A'
            });
        });

        return { success: true, users: Array.from(usersMap.values()) };

    } catch (error: any) {
        console.error('Error searching users:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Assign Coupon to User
 */
export async function assignCoupon(couponId: string, companyId: string, userId: string) {
    try {
        // Check if already assigned
        const exists = await adminDb.collection('coupon_assignments')
            .where('couponId', '==', couponId)
            .where('userId', '==', userId)
            .get();

        if (!exists.empty) {
            return { success: false, error: 'User already has this coupon.' };
        }

        await adminDb.collection('coupon_assignments').add({
            couponId,
            companyId,
            userId,
            assignedAt: FieldValue.serverTimestamp(),
            status: 'assigned'
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error assigning coupon:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Search Companies (Clients)
 */
export async function searchCompanies(term: string) {
    try {
        if (!term || term.length < 2) return { success: true, companies: [] };

        // Search in 'clients' collection
        // Since Firestore is case-sensitive and we don't have a 'searchName' field,
        // and assuming the client list is < 1000, we can fetch most/all and filter in memory 
        // OR rely on client-side filtering if we were just fetching a list.
        // But here we are a server action.

        // Strategy: Fetch up to 100 recent clients or just fetch all (if predictable size).
        // For robustness without search indices, we will fetch a larger batch and filter.
        // Ideally: Add a 'searchName' (lowercase) field to database in future.

        const clientsRef = adminDb.collection('clients');
        const snapshot = await clientsRef.limit(2000).get(); // Increased limit to ensure we find the company

        const termLower = term.toLowerCase();

        const companies = snapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.clientName || 'Unknown',
                    address: data.address || '',
                    city: data.location || '',
                    phone: data.phone || '',
                    country: 'Deutschland' // Default
                };
            })
            .filter(c => c.name.toLowerCase().includes(termLower));

        return {
            success: true,
            companies: companies.slice(0, 10),
            debugInfo: {
                scanned: snapshot.size,
                matchCount: companies.length
            }
        };
    } catch (error: any) {
        console.error('Error searching companies:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get coupons for a specific company
 */
export async function getCouponsByCompany(companyId: string) {
    try {
        console.log(`[getCouponsByCompany] Fetching for: ${companyId}`);
        if (!companyId) return { success: false, error: 'Company ID is required' };

        const snapshot = await adminDb.collection('coupons')
            .where('companyId', '==', companyId)
            .get();

        console.log(`[getCouponsByCompany] Found ${snapshot.size} documents.`);

        let coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

        // Recalculate status dynamically AND serialize all dates
        const now = new Date();
        const serializedCoupons = coupons.map(c => {
            const start = c.startDate?.toDate ? c.startDate.toDate() : new Date(c.startDate);
            const end = c.endDate?.toDate ? c.endDate.toDate() : new Date(c.endDate);
            const createdAt = c.createdAt?.toDate ? c.createdAt.toDate() : (c.createdAt ? new Date(c.createdAt) : null);
            const updatedAt = c.updatedAt?.toDate ? c.updatedAt.toDate() : (c.updatedAt ? new Date(c.updatedAt) : null);

            let status = 'active';
            if (end < now) status = 'expired';
            else if (start > now) status = 'scheduled';

            // Explicitly map fields.
            // Using strict checks to ensure no undefined/complex objects leak.
            return {
                id: String(c.id || ''),
                companyId: String(c.companyId || ''),
                companyName: String(c.companyName || ''),
                category: String(c.category || ''),
                title: String(c.title || ''),
                description: String(c.description || ''),
                country: String(c.country || ''),
                city: String(c.city || ''),
                code: String(c.code || ''),
                discountType: String(c.discountType || 'text'),
                discountValue: String(c.discountValue || ''),
                backgroundImage: String(c.backgroundImage || CATEGORY_BACKGROUNDS['default']),
                startDate: !isNaN(start.getTime()) ? start.toISOString() : '',
                endDate: !isNaN(end.getTime()) ? end.toISOString() : '',
                createdAt: createdAt && !isNaN(createdAt.getTime()) ? createdAt.toISOString() : null,
                updatedAt: updatedAt && !isNaN(updatedAt.getTime()) ? updatedAt.toISOString() : null,
                status: String(status)
            };
        });

        // Sort by created date desc
        serializedCoupons.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        // Nuclear option: Ensure strictly valid JSON
        const cleanCoupons = JSON.parse(JSON.stringify(serializedCoupons));

        return { success: true, coupons: cleanCoupons };
    } catch (error: any) {
        console.error('Error fetching company coupons:', error);
        // Explicitly return a plain object error
        return { success: false, error: String(error?.message || 'Unknown error') };
    }
}
/**
 * Share Coupon via Email
 */
import { sendCouponShareEmail } from '@/lib/email';

export async function shareCoupon(email: string, coupon: any) {
    try {
        const result = await sendCouponShareEmail(email, coupon);
        if (!result.success) {
            return { success: false, error: 'Failed to send email' };
        }
        return { success: true };
    } catch (error: any) {
        console.error('Error sharing coupon:', error);
        return { success: false, error: error.message };
    }
}
