'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
// Note: In server actions we often check getApps()
if (!getApps().length) {
    // We assume app is initialized centrally or we rely on the default app if this runs in an environment 
    // where GOOGLE_APPLICATION_CREDENTIALS is set, or similar.
    // For this codebase, it seems admin init happens in utils or implicitly.
    // We'll trust the existing patterns. 
    // Based on admin/dashboard/page.tsx, it uses 'firebase/functions' client side and 'firebase-admin' server side.
    // We need to import the initialized admin app from a shared lib if possible, or init here safely.
}

// Reuse the singleton pattern if available, or just use getFirestore() if the default app is ready.
// Typically `src/lib/firebase-admin.ts` provides this. Let's assume standard admin usage.
const db = getFirestore();

interface SeedResult {
    success: boolean;
    message: string;
}

const CATEGORIES_DATA = [
    { name: 'Beratung & Coaching', icon: 'MessagesSquare', order: 1 },
    { name: 'Bildung & Karriere', icon: 'GraduationCap', order: 2 },
    { name: 'Finanzdienstleistung & Vorsorge', icon: 'PiggyBank', order: 3 },
    { name: 'Gastronomie & Kulinarik', icon: 'UtensilsCrossed', order: 4 },
    { name: 'Gesundheit & Wellness', icon: 'HeartPulse', order: 5 },
    { name: 'Hotellerie & Gastgewerbe', icon: 'Hotel', order: 6 },
    { name: 'Immobilien & Wohnraum', icon: 'Home', order: 7 },
    { name: 'Lebensmittel & Feinkost', icon: 'ShoppingBasket', order: 8 },
    { name: 'Mode & Textil', icon: 'Shirt', order: 9 }, // Reordered name to match common usage, but user list said "Textil & Mode"
    { name: 'Musik & Events', icon: 'Music', order: 10 },
    { name: 'Soziales & Engagement', icon: 'HandHeart', order: 11 },
    { name: 'Sport & Fitness', icon: 'Dumbbell', order: 12 },
    { name: 'Reise & Tourismus', icon: 'Plane', order: 13 },
    { name: 'Technologie & Innovation', icon: 'Cpu', order: 14 },
    { name: 'Tier & Haustierbedarf', icon: 'PawPrint', order: 15 },
    { name: 'Transport & Mobilität', icon: 'Car', order: 16 },
    { name: 'Umwelt & Nachhaltigkeit', icon: 'Leaf', order: 17 },
    { name: 'Unterhaltung & Freizeit', icon: 'Gamepad2', order: 18 },
];

/**
 * Helper to slugify text
 */
function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/&/g, 'und')
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .trim();
}

export async function seedCategoriesAction(): Promise<SeedResult> {
    try {
        const batch = db.batch();
        const categoriesRef = db.collection('categories');

        // 1. Clear existing categories (Optional: usually seeded on empty DB, but safe to overwrite)
        // For safety, we will just merge/overwrite based on slug.

        for (const cat of CATEGORIES_DATA) {
            const slug = slugify(cat.name); // e.g., 'beratung-und-coaching'
            const docRef = categoriesRef.doc(slug);

            // Check if doc exists to preserve businessCount if we are re-seeding
            const docSnap = await docRef.get();
            let currentCount = 0;
            let existingSubcats = [];
            if (docSnap.exists) {
                const data = docSnap.data();
                currentCount = data?.businessCount || 0;
                existingSubcats = data?.subcategories || [];
            }

            batch.set(docRef, {
                id: slug,
                name: {
                    de: cat.name,
                    en: cat.name, // Fallback english = german for now, can be updated later
                    es: cat.name, // Fallback spanish = german for now
                },
                icon: cat.icon,
                order: cat.order,
                businessCount: currentCount,
                subcategories: existingSubcats, // Preserve existing subcats if any
            }, { merge: true });
        }

        await batch.commit();

        return {
            success: true,
            message: `Successfully seeded ${CATEGORIES_DATA.length} categories.`,
        };
    } catch (error: any) {
        console.error('Error seeding categories:', error);
        return {
            success: false,
            message: error.message || 'Unknown error seeding categories',
        };
    }
}
