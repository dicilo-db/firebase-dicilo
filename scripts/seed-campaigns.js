const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Admin SDK provided credentials are set in environment
// OR run this with `firebase functions:shell` or local emulator
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = getFirestore();

/**
 * Script to seed sample campaigns for the Freelancer Module.
 * Run this using: node scripts/seed-campaigns.js (requires service account)
 * OR invoke via a temporary cloud function or just manually in a scratchpad.
 */
async function seedCampaigns() {
    const campaigns = [
        {
            companyId: 'vasen_keramik_gmbh_id', // Mock ID
            companyName: 'VasenKeramik GmbH',
            companyLogo: 'https://placehold.co/100x100/png?text=VK',
            title: 'Nueva Colección Cerámica 2025',
            description: 'Promociona nuestros vasos artesanales de alta calidad.',
            images: [
                'https://placehold.co/600x600/png?text=Vaso+1',
                'https://placehold.co/600x600/png?text=Vaso+2',
                'https://placehold.co/600x600/png?text=Taller'
            ],
            budget_marketing: 500.00, // Budget for freelancers
            budget_banners: 1000.00,
            rate_per_click: 0.15,
            categories: ['Hogar', 'Artesanía', 'Decoración'],
            languages: ['es', 'de'],
            target_locations: ['Madrid', 'Berlin', 'Global'],
            status: 'active',
            gray_mode_trigger: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            companyId: 'tech_trend_solutions_id',
            companyName: 'TechTrend Solutions',
            companyLogo: 'https://placehold.co/100x100/png?text=TT',
            title: 'Software de Gestión SaaS',
            description: 'Ayuda a empresas a digitalizarse con nuestra suite.',
            images: [
                'https://placehold.co/600x400/png?text=Dashboard',
                'https://placehold.co/600x400/png?text=MobileApp'
            ],
            budget_marketing: 1200.00,
            budget_banners: 3000.00,
            rate_per_click: 0.45,
            categories: ['Tecnología', 'B2B', 'Software'],
            languages: ['en', 'es'],
            target_locations: ['Global'],
            status: 'active',
            gray_mode_trigger: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
            companyId: 'eco_friendly_co_id',
            companyName: 'EcoFriendly Co.',
            companyLogo: 'https://placehold.co/100x100/png?text=Eco',
            title: 'Botellas Reutilizables',
            description: 'Salva el planeta una botella a la vez.',
            images: [
                'https://placehold.co/600x800/png?text=Botella+Verde'
            ],
            budget_marketing: 0.00, // Trigger Gray Mode
            budget_banners: 100.00,
            rate_per_click: 0.10,
            categories: ['Sostenibilidad', 'Ecología'],
            languages: ['de'],
            target_locations: ['Munich', 'Hamburg'],
            status: 'gray_mode', // Explicitly set or derived
            gray_mode_trigger: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
    ];

    const batch = db.batch();

    for (const c of campaigns) {
        const ref = db.collection('campaigns').doc();
        batch.set(ref, c);
    }

    await batch.commit();
    console.log('✅ Successfully seeded 3 sample campaigns.');
}

// Check if running directly (node script)
if (require.main === module) {
    // This part requires GOOGLE_APPLICATION_CREDENTIALS to be set
    console.log('Starting seed process...');
    seedCampaigns().catch(console.error);
}

module.exports = { seedCampaigns };
