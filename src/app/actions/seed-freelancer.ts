'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { Campaign } from '@/types/freelancer';

const db = getAdminDb();

export async function seedCampaignsAction() {
    try {
        const campaigns: Omit<Campaign, 'id'>[] = [
            {
                companyId: 'vasen_keramik_gmbh_id',
                companyName: 'VasenKeramik GmbH',
                companyLogo: '/placeholder-logo.png', // Using local placeholder path
                title: 'Nueva Colección Cerámica 2025',
                description: 'Promociona nuestros vasos artesanales de alta calidad.',
                images: [
                    '/placeholder-product-1.jpg',
                    '/placeholder-product-2.jpg'
                ],
                budget_marketing: 500.00,
                budget_banners: 1000.00,
                rate_per_click: 0.15,
                categories: ['Hogar', 'Artesanía', 'Decoración'],
                languages: ['es', 'de'],
                target_locations: ['Madrid', 'Berlin', 'Global'],
                status: 'active',
                gray_mode_trigger: false,
                createdAt: new Date()
            },
            {
                companyId: 'tech_trend_solutions_id',
                companyName: 'TechTrend Solutions',
                companyLogo: '/placeholder-logo.png',
                title: 'Software de Gestión SaaS',
                description: 'Ayuda a empresas a digitalizarse con nuestra suite.',
                images: [
                    '/placeholder-product-3.jpg'
                ],
                budget_marketing: 1200.00,
                budget_banners: 3000.00,
                rate_per_click: 0.45,
                categories: ['Tecnología', 'B2B', 'Software'],
                languages: ['en', 'es'],
                target_locations: ['Global'],
                status: 'active',
                gray_mode_trigger: false,
                createdAt: new Date()
            },
            {
                companyId: 'eco_friendly_co_id',
                companyName: 'EcoFriendly Co.',
                companyLogo: '/placeholder-logo.png',
                title: 'Botellas Reutilizables',
                description: 'Salva el planeta una botella a la vez.',
                images: [],
                budget_marketing: 0.00,
                budget_banners: 100.00,
                rate_per_click: 0.10,
                categories: ['Sostenibilidad', 'Ecología'],
                languages: ['de'],
                target_locations: ['Munich', 'Hamburg'],
                status: 'gray_mode',
                gray_mode_trigger: true,
                createdAt: new Date()
            }
        ];

        const batch = db.batch();
        for (const c of campaigns) {
            const ref = db.collection('campaigns').doc();
            batch.set(ref, c);
        }
        await batch.commit();
        return { success: true, message: 'Seeded 3 campaigns' };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}
