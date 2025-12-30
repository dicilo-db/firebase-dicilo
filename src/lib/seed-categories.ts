import { app } from '@/lib/firebase';
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore';
import categoriesData from '@/data/categories.json';
import categoryTranslationsData from '@/data/category_translations.json';
import subcategoryTranslationsData from '@/data/subcategory_translations.json';

const db = getFirestore(app);

// Type definitions for JSON data
type Translations = Record<string, { de: string; en: string; es: string }>;
const categoryTranslations = categoryTranslationsData as Translations;
const subcategoryTranslations = subcategoryTranslationsData as Translations;
const categories = categoriesData as Array<{ categoria: string; subcategorias: string[] }>;

// Manual Icon Mapping (String names matching Lucide icons)
// Matches src/components/CategoryDirectory.tsx
const ICON_MAPPING: Record<string, string> = {
    'Beratung & Coaching': 'Briefcase',
    'Bildung & Karriere': 'GraduationCap',
    'Finanzdienstleistung & Vorsorge': 'Wallet',
    'Gastronomie & Kulinarik': 'Utensils',
    'Gesundheit & Wellness': 'Heart',
    'Hotellerie & Gastgewerbe': 'Hotel',
    'Immobilien & Wohnraum': 'Building',
    'Lebensmittel & Feinkost': 'ShoppingBasket',
    'Textil & Mode': 'Shirt',
    'Musik & Events': 'Music',
    'Soziales & Engagement': 'Users',
    'Sport & Fitness': 'Trophy',
    'Reise & Tourismus': 'Bus',
    'Technologie & Innovation': 'Bot',
    'Tier & Haustierbedarf': 'PawPrint',
    'Transport & Mobilität': 'Bus',
    'Umwelt & Nachhaltigkeit': 'Trees',
    'Unterhaltung & Freizeit': 'Tv',
};

// Maps New Name -> Old Slug to preserve URLs
const LEGACY_ID_MAPPING: Record<string, string> = {
    'Beratung & Coaching': 'beratung',
    'Bildung & Karriere': 'bildung',
    'Finanzdienstleistung & Vorsorge': 'finanzen',
    'Gastronomie & Kulinarik': 'gastronomie',
    'Gesundheit & Wellness': 'gesundheit',
    'Hotellerie & Gastgewerbe': 'hotellerie',
    'Immobilien & Wohnraum': 'immobilien',
    'Lebensmittel & Feinkost': 'lebensmittel',
    'Textil & Mode': 'textil', // Was 'Textil' in old json
    'Musik & Events': 'musik',
    'Soziales & Engagement': 'soziales',
    'Sport & Fitness': 'sport',
    'Reise & Tourismus': 'reise', // Was 'Reise'
    'Technologie & Innovation': 'technologie',
    'Tier & Haustierbedarf': 'tier',
    'Transport & Mobilität': 'transport',
    'Umwelt & Nachhaltigkeit': 'umwelt',
    'Unterhaltung & Freizeit': 'unterhaltung'
};

export const seedCategories = async () => {
    const batch = writeBatch(db);
    const collectionRef = collection(db, 'categories');

    // Helper to slugify
    const slugify = (text: string) => text.toLowerCase().replace(/&/g, 'und').replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    categories.forEach((cat) => {
        // Use Legacy ID if available, otherwise slugify new name
        const catId = LEGACY_ID_MAPPING[cat.categoria] || slugify(cat.categoria);
        const ref = doc(collectionRef, catId);

        // Build Subcategories Array
        const subs = cat.subcategorias.map(subName => {
            const subId = slugify(subName);
            // Get translations or fallback to German name object
            const trans = subcategoryTranslations[subName] || { de: subName, en: subName, es: subName };
            return {
                id: subId,
                name: trans,
                businessCount: 0
            };
        });

        const catTrans = categoryTranslations[cat.categoria] || { de: cat.categoria, en: cat.categoria, es: cat.categoria };
        const iconName = ICON_MAPPING[cat.categoria] || 'HelpCircle'; // Fallback icon

        batch.set(ref, {
            id: catId,
            name: catTrans,
            icon: iconName,
            order: 0,
            subcategories: subs,
            // businessCount: 0  <-- removing this to avoid resetting count if we merge? 
            // Better strategy: batch.set with merge will update provided fields. 
            // But verify if businessCount needs preservation. 
            // If the goal is just to update names, we should be careful.
            // Let's assume businessCount should be preserved if not provided in merge, 
            // BUT batch.set({ ... }, { merge: true }) works by updating fields in the first arg.
            // If I include businessCount: 0 here, it might reset it.
            // Safe approach: Only set fields we want to update or ensure we don't reset counters.
            // However, the original code had businessCount: 0. 
            // Let's stick to the original logic but force the update.
            // To be safe for names:
        }, { merge: true });
    });

    await batch.commit();
    console.log('Categories seeded successfully with subcategories.');
};
