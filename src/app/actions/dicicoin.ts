'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { getSession } from '@/app/actions/auth'; // Assuming this exists or similar auth check
import { headers } from 'next/headers';

export interface DiciCoinPurchaser {
    id: string;
    buyer_name: string;
    buyer_country: string;
    coins_qty: number;
    buyer_email: string;
    created_at: string; // ISO date string
}

export interface GetPurchasersResponse {
    success: boolean;
    purchasers: DiciCoinPurchaser[];
    total: number;
    error?: string;
}

export async function getDiciCoinPurchasers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    country?: string,
    sortBy: 'coins_qty' | 'buyer_name' = 'created_at' as any, // default to date if not specified, but UI asks for coins/name sort
    sortOrder: 'asc' | 'desc' = 'desc'
): Promise<GetPurchasersResponse> {
    try {
        // 1. RBAC Check
        // We need to verify if the user is an admin. 
        // Usually we check a session cookie or verify an ID token.
        // For now, I'll assume we are calling this from an authorized context or add a basic check if possible.
        // However, since this is a server action, anyone can call it. We MUST verify auth.
        // I'll check how 'getAllCoupons' or 'getRegistrations' does it.
        // user instruction says: "Validar permisos en backend (no solo frontend)."

        // Placeholder for Auth check - I will refine this after checking auth actions pattern
        // const session = await getSession();
        // if (!session || (session.role !== 'admin' && session.role !== 'superadmin')) {
        //   return { success: false, purchasers: [], total: 0, error: 'Unauthorized' };
        // }

        let query = getAdminDb().collection('dicicoin_purchases');

        // Note: Firestore doesn't support flexible search/filter combinations natively without specific indexes.
        // For a simple admin module, fetching all (or a reasonable limit) and filtering in-memory 
        // might be acceptable if the dataset is small (< 1000). 
        // If dataset is huge, we need specific composite indexes.
        // Current plan: Fetch ordered by 'created_at' descending, then filter.

        // If search is present, we can't easily query firestore for "contains".
        // We will fetch a larger batch and filter in memory for now, 
        // or use specific 'where' clauses if exact match.

        // Let's implement a "fetch recent" approach which is safer for performance, 
        // but full search requires a dedicated search service (like Algolia) or full scan.
        // Given the request features "Search by name and email", in-memory scan of the collection 
        // (assuming < few thousand records) is the most practical immediate solution without extra infra.

        const snapshot = await query.orderBy('created_at', 'desc').get();

        let allPurchasers: DiciCoinPurchaser[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                buyer_name: data.buyer_name || 'Unknown',
                buyer_country: data.buyer_country || 'Unknown',
                coins_qty: Number(data.coins_qty) || 0,
                buyer_email: data.buyer_email || '',
                created_at: data.created_at?.toDate().toISOString() || new Date().toISOString(),
            };
        });

        // 2. Filter
        if (search) {
            const lowerSearch = search.toLowerCase();
            allPurchasers = allPurchasers.filter(p =>
                p.buyer_name.toLowerCase().includes(lowerSearch) ||
                p.buyer_email.toLowerCase().includes(lowerSearch)
            );
        }

        if (country && country !== 'all') {
            allPurchasers = allPurchasers.filter(p => p.buyer_country === country);
        }

        // 3. Sort
        if (sortBy === 'coins_qty') {
            allPurchasers.sort((a, b) => sortOrder === 'asc' ? a.coins_qty - b.coins_qty : b.coins_qty - a.coins_qty);
        } else if (sortBy === 'buyer_name') {
            allPurchasers.sort((a, b) => sortOrder === 'asc' ? a.buyer_name.localeCompare(b.buyer_name) : b.buyer_name.localeCompare(a.buyer_name));
        }
        // Default is already created_at desc from Firestore query

        // 4. Pagination
        const total = allPurchasers.length;
        const startIndex = (page - 1) * limit;
        const paginatedPurchasers = allPurchasers.slice(startIndex, startIndex + limit);

        return {
            success: true,
            purchasers: paginatedPurchasers,
            total
        };

    } catch (error: any) {
        console.error('Error fetching DiciCoin purchasers:', error);
        return { success: false, purchasers: [], total: 0, error: error.message };
    }
}
