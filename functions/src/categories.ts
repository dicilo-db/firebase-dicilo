import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

const db = admin.firestore();

export const onBusinessWrite = onDocumentWritten('businesses/{businessId}', async (event) => {
    const change = event.data;
    if (!change) return; // Should not happen

    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    // Extract keys. 
    // Note: Your app stores `category_key` strings like "category.slug" and "subcategory.slug"
    // or sometimes just raw strings depending on legacy data.
    // We assume the new standardized format "category.<slug>" is used, but we should handle legacy or raw strings gracefully if possible,
    // or strict parsing. With the new Edit Form, we enforce `category_key`.

    const oldCategoryKey = beforeData?.category_key;
    const newCategoryKey = afterData?.category_key;

    const oldSubKey = beforeData?.subcategory_key;
    const newSubKey = afterData?.subcategory_key;

    // If no change in categories, exit
    if (oldCategoryKey === newCategoryKey && oldSubKey === newSubKey) {
        return;
    }

    const updates = new Map<string, { catChange: number; subUpdates: Map<string, number> }>();

    // Helper to accumulate updates
    const addUpdate = (catSlug: string | undefined, subSlug: string | undefined, change: number) => {
        if (!catSlug) return;
        // Strip prefix if present (e.g. "category.foo" -> "foo")
        const cleanCatSlug = catSlug.startsWith('category.') ? catSlug.split('.')[1] : catSlug;
        if (!cleanCatSlug) return;

        if (!updates.has(cleanCatSlug)) {
            updates.set(cleanCatSlug, { catChange: 0, subUpdates: new Map() });
        }
        const record = updates.get(cleanCatSlug)!;
        record.catChange += change;

        if (subSlug) {
            const cleanSubSlug = subSlug.startsWith('subcategory.') ? subSlug.split('.')[1] : subSlug;
            if (cleanSubSlug) {
                const currentSubVal = record.subUpdates.get(cleanSubSlug) || 0;
                record.subUpdates.set(cleanSubSlug, currentSubVal + change);
            }
        }
    };

    // Process Old (Decrement)
    addUpdate(oldCategoryKey, oldSubKey, -1);

    // Process New (Increment)
    addUpdate(newCategoryKey, newSubKey, 1);

    // Apply updates using transactions to ensure safety
    const promises = Array.from(updates.entries()).map(async ([catSlug, { catChange, subUpdates }]) => {
        if (catChange === 0 && subUpdates.size === 0) return;

        const catRef = db.collection('categories').doc(catSlug);

        try {
            await db.runTransaction(async (t) => {
                const doc = await t.get(catRef);
                if (!doc.exists) {
                    // If category doesn't exist, we can't update it. 
                    // This might happen if business has a category that was deleted or legacy.
                    logger.warn(`Category ${catSlug} not found while updating counts.`);
                    return;
                }

                const data = doc.data()!;
                const currentCount = data.businessCount || 0;
                const newCount = Math.max(0, currentCount + catChange);

                const subcategories = data.subcategories || [];
                let subcategoriesChanged = false;

                const newSubcategories = subcategories.map((sub: any) => {
                    if (subUpdates.has(sub.id)) {
                        const subChange = subUpdates.get(sub.id)!;
                        const currentSubCount = sub.businessCount || 0;
                        const newSubCount = Math.max(0, currentSubCount + subChange);
                        subcategoriesChanged = true;
                        return { ...sub, businessCount: newSubCount };
                    }
                    return sub;
                });

                const updateData: any = { businessCount: newCount };
                if (subcategoriesChanged) {
                    updateData.subcategories = newSubcategories;
                }

                t.update(catRef, updateData);
            });
        } catch (e) {
            logger.error(`Failed to update counts for category ${catSlug}:`, e);
        }
    });

    await Promise.all(promises);
});
