
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import categoriesData from '../data/categories.json';
import categoryTranslationsData from '../data/category_translations.json';
import subcategoryTranslationsData from '../data/subcategory_translations.json';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Use absolute path for service account for reliability in this context
const serviceAccountPath = "/Users/niloescolar/.gemini/antigravity/brain/8db9f318-5ddf-47c7-a7f4-c61b6ef11657/serviceAccountKey.json";
const serviceAccount = require(serviceAccountPath);

if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

// Type definitions
type Translations = Record<string, { de: string; en: string; es: string }>;
const categoryTranslations = categoryTranslationsData as Translations;
const subcategoryTranslations = subcategoryTranslationsData as Translations;
const categories = categoriesData as Array<{ categoria: string; subcategorias: string[] }>;

// Manual Icon Mapping (String names matching Lucide icons)
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
    'Textil & Mode': 'textil',
    'Musik & Events': 'musik',
    'Soziales & Engagement': 'soziales',
    'Sport & Fitness': 'sport',
    'Reise & Tourismus': 'reise',
    'Technologie & Innovation': 'technologie',
    'Tier & Haustierbedarf': 'tier',
    'Transport & Mobilität': 'transport',
    'Umwelt & Nachhaltigkeit': 'umwelt',
    'Unterhaltung & Freizeit': 'unterhaltung'
};

async function seed() {
    console.log("Starting Admin Seed...");
    const batch = db.batch();
    const collectionRef = db.collection('categories');

    // Helper to slugify
    const slugify = (text: string) => text.toLowerCase().replace(/&/g, 'und').replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    for (const cat of categories) {
        // Use Legacy ID if available, otherwise slugify new name
        const catId = LEGACY_ID_MAPPING[cat.categoria] || slugify(cat.categoria);
        const ref = collectionRef.doc(catId);

        // Build Subcategories
        const subs = cat.subcategorias.map(subName => {
            const subId = slugify(subName);
            const trans = subcategoryTranslations[subName] || { de: subName, en: subName, es: subName };
            return {
                id: subId,
                name: trans,
                businessCount: 0
            };
        });

        const catTrans = categoryTranslations[cat.categoria] || { de: cat.categoria, en: cat.categoria, es: cat.categoria };
        const iconName = ICON_MAPPING[cat.categoria] || 'HelpCircle';

        // Important: db.batch().set(ref, data, { merge: true }) works in admin SDK
        batch.set(ref, {
            id: catId,
            name: catTrans,
            icon: iconName,
            order: 0,
            subcategories: subs
        }, { merge: true });
    }

    await batch.commit();
    console.log("Admin Seed completed successfully.");
}

seed().catch(console.error);
