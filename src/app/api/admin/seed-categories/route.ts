
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import categoriesData from '@/data/categories.json';
import categoryTranslationsData from '@/data/category_translations.json';
import subcategoryTranslationsData from '@/data/subcategory_translations.json';

export const dynamic = 'force-dynamic';

// Type definitions for JSON data
type Translations = Record<string, { de: string; en: string; es: string }>;
const categoryTranslations = categoryTranslationsData as Translations;
const subcategoryTranslations = subcategoryTranslationsData as Translations;
const categories = categoriesData as Array<{ categoria: string; subcategorias: string[] }>;

// Manual Icon Mapping (String names matching Lucide icons)
const ICON_MAPPING: Record<string, string> = {
    'Beratung': 'Briefcase',
    'Bildung': 'GraduationCap',
    'Finanzen': 'Wallet',
    'Gastronomie': 'Utensils',
    'Gesundheit': 'Heart',
    'Hotellerie': 'Hotel',
    'Immobilien': 'Building',
    'Lebensmittel': 'ShoppingBasket',
    'Lifestyle & persönliche Dienste': 'Smile',
    'Musik': 'Music',
    'Soziales': 'Users',
    'Schönheit & Wellness': 'Sparkles',
    'Sport': 'Trophy',
    'Reise': 'Bus',
    'Technologie': 'Bot',
    'Textil': 'Shirt',
    'Tier': 'PawPrint',
    'Transport': 'Bus',
    'Umwelt': 'Trees',
    'Unterhaltung': 'Tv',
};

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];

        try {
            const decoded = await getAdminAuth().verifyIdToken(token);
            if (!decoded.admin && decoded.role !== 'admin' && decoded.role !== 'superadmin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        } catch (e) {
            console.error("Token verification failed", e);
            return NextResponse.json({ error: 'Unauthorized (Invalid Token)' }, { status: 401 });
        }

        // 2. Seeding Logic
        const db = getAdminDb();
        const batch = db.batch();
        const collectionRef = db.collection('categories');

        // Helper to slugify
        const slugify = (text: string) => text.toLowerCase().replace(/&/g, 'und').replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

        categories.forEach((cat) => {
            const catId = slugify(cat.categoria);
            const ref = collectionRef.doc(catId);

            // Build Subcategories Array
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

            batch.set(ref, {
                id: catId,
                name: catTrans,
                icon: iconName,
                order: 0,
                subcategories: subs,
                businessCount: 0
            });
        });

        await batch.commit();
        return NextResponse.json({ success: true, message: 'Categories seeded successfully' });

    } catch (error: any) {
        console.error("Seeding API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
