'use server';

import { getAdminDb } from '@/lib/firebase-admin';

/**
 * Searches for businesses/clients for B2B assignment.
 * Searches in the 'clients' collection.
 * 
 * @param query Search term
 * @returns Array of { id, name }
 */
export async function searchBusiness(query: string) {
    if (!query || query.length < 2) return [];

    // Normalize query for better matching if possible, but Firestore is case-sensitive usually.
    // For this implementation effectively we assume proper casing or use a workaround.
    // Ideally, we should have a `keywords` array or `lowercaseName` field.
    // We will try a direct range query (case-sensitive) and a backup strategy if needed.

    // Simple case-sensitive prefix search
    // Note: In production, ensure you store a 'searchKey' (lowercase) field on clients.

    // Attempt 1: Try exact/prefix match (Case Sensitive) outputting standard names
    try {
        const db = getAdminDb();
        const start = query;
        const end = query + '\uf8ff';

        let snapshot = await db.collection('clients')
            .orderBy('clientName')
            .startAt(start)
            .endAt(end)
            .limit(10)
            .get();

        let results = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().clientName as string
        }));

        // Fallback: If no results, and query is lowercase, maybe try capitalizing?
        // Or fetch recent/active clients and filter in memory if the list is small (e.g. < 500 active B2B clients).
        if (results.length === 0) {
            // Naive in-memory fallback for better UX (assuming not too many B2B clients)
            // This is safer for finding "Travelposting" when user types "travel"
            const allClientsSnap = await db.collection('clients').where('clientType', 'in', ['premium', 'retailer', 'starter']).limit(100).get();
            const lowerQ = query.toLowerCase();

            results = allClientsSnap.docs
                .map(doc => ({ id: doc.id, name: doc.data().clientName as string }))
                .filter(c => c.name?.toLowerCase().includes(lowerQ))
                .slice(0, 10);
        }

        return results;
    } catch (error) {
        console.error('Error searching businesses:', error);
        return [];
    }
}
