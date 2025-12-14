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
}

export interface CouponFilter {
    search?: string;
    country?: string;
    city?: string;
    month?: string; // YYYY-MM
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

        await couponRef.set({
            ...data,
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
 * Get coupons by category with filters
 */
export async function getCouponsByCategory(category: string, filters: CouponFilter) {
    try {
        let query = adminDb.collection('coupons').where('category', '==', category);

        // Client-side filtering is often needed for complex "AND" queries in Firestore 
        // if indexes aren't created for every combination.
        // For 200-500 coupons per category, fetching all and filtering in memory is acceptable.
        // For scalability, we would need composite indexes.

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

        if (filters.month) {
            // Filter by Creation OR Expiration? Requirement says "Mes de creación o mes de expiración"
            const [year, month] = filters.month.split('-').map(Number);
            coupons = coupons.filter(c => {
                const created = c.createdAt?.toDate();
                const end = c.endDate?.toDate();

                const createdMatch = created && created.getFullYear() === year && (created.getMonth() + 1) === month;
                const endMatch = end && end.getFullYear() === year && (end.getMonth() + 1) === month;

                return createdMatch || endMatch;
            });
        }

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
                startDate: start.toISOString(),
                endDate: end.toISOString(),
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
        if (!companyId) return { success: false, error: 'Company ID is required' };

        const snapshot = await adminDb.collection('coupons')
            .where('companyId', '==', companyId)
            .get();

        let coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

        // Recalculate status dynamically AND serialize all dates
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

            // Explicitly map fields to avoid serialization errors with hidden non-serializable types
            return {
                id: c.id,
                companyId: c.companyId || '',
                companyName: c.companyName || '',
                category: c.category || '',
                title: c.title || '',
                description: c.description || '',
                country: c.country || '',
                city: c.city || '',
                code: c.code || '',
                startDate: !isNaN(start.getTime()) ? start.toISOString() : '', // Handle invalid dates safely
                endDate: !isNaN(end.getTime()) ? end.toISOString() : '',
                createdAt: createdAt && !isNaN(createdAt.getTime()) ? createdAt.toISOString() : null,
                updatedAt: updatedAt && !isNaN(updatedAt.getTime()) ? updatedAt.toISOString() : null,
                status
            };
        });

        // Sort by created date desc
        serializedCoupons.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        return { success: true, coupons: serializedCoupons };
    } catch (error: any) {
        console.error('Error fetching company coupons:', error);
        return { success: false, error: error.message };
    }
}
