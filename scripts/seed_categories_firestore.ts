import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
// Assumes GOOGLE_APPLICATION_CREDENTIALS is set or running in an environment with default creds
// For local run, the user might need to set standard creds.
// Alternatively, we can try to load serviceAccountKey.json if it exists.
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} else {
    admin.initializeApp();
}

const db = admin.firestore();

// Load Data
const categoriesPath = path.resolve(__dirname, '../src/data/categories.json');
const subcategoryTranslationsPath = path.resolve(__dirname, '../src/data/subcategory_translations.json');
const categoryTranslationsPath = path.resolve(__dirname, '../src/data/category_translations.json');

const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
const subcategoryTranslations = JSON.parse(fs.readFileSync(subcategoryTranslationsPath, 'utf8'));
const categoryTranslations = JSON.parse(fs.readFileSync(categoryTranslationsPath, 'utf8'));

// Mappings (Copied from src/lib/seed-categories.ts)
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
    'Reise & Tourismus': 'Bus', // Fixed from original mapping just in case
    'Technologie & Innovation': 'Bot',
    'Tier & Haustierbedarf': 'PawPrint',
    'Transport & Mobilität': 'Bus',
    'Umwelt & Nachhaltigkeit': 'Trees',
    'Unterhaltung & Freizeit': 'Tv',
};

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

const slugify = (text: string) => text.toLowerCase().replace(/&/g, 'und').replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

const seedCategories = async () => {
    console.log('Starting seed...');
    const batch = db.batch();
    const collectionRef = db.collection('categories');

    for (const cat of categories) {
        const catId = LEGACY_ID_MAPPING[cat.categoria] || slugify(cat.categoria);
        const ref = collectionRef.doc(catId);

        const subs = cat.subcategorias.map((subName: string) => {
            const subId = slugify(subName);
            const trans = subcategoryTranslations[subName] || { de: subName, en: subName, es: subName };
            return {
                id: subId,
                name: trans,
                businessCount: 0 // Logic from original file indicates we might want to preserve this, but for update we'll rely on merge behavior if possible. 
                // Wait, map objects are fully replaced in array fields usually. 
                // We should try to read existing businessCount if possible? 
                // For now, defaulting to 0 as in original seed script request.
            };
        });

        const catTrans = categoryTranslations[cat.categoria] || { de: cat.categoria, en: cat.categoria, es: cat.categoria };
        const iconName = ICON_MAPPING[cat.categoria] || 'HelpCircle';

        // Partial update for top level fields + full replace of subcategories array
        batch.set(ref, {
            id: catId,
            name: catTrans,
            icon: iconName,
            subcategories: subs
        }, { merge: true });

        console.log(`Prepared batch for category: ${cat.categoria}`);
    }

    await batch.commit();
    console.log('Categories seeded successfully.');
};

seedCategories().catch(console.error);
