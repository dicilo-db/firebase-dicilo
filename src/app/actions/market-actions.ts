'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { MarketOffer } from '@/types/market';
import { z } from 'zod';

const marketOfferSchema = z.object({
    userId: z.string().min(1, "El ID de usuario es obligatorio"),
    primaryRole: z.enum(['buyer', 'seller']),
    modality: z.enum(['direct', 'intermediary']),
    provisionType: z.enum(['percentage', 'fixed_amount']),
    provisionValue: z.number().min(0, "La provisión no puede ser negativa"),
    provisionDescription: z.string().max(500).optional(),
    category: z.enum(['energy', 'real_estate', 'transport', 'agriculture', 'precious_metals', 'other']),
    subCategory: z.string().min(2, "Sub-categoría muy corta").max(100),
    title: z.string().min(5, "Título muy corto").max(150),
    description: z.string().min(10, "Descripción muy corta").max(3000),
    volumeOrQuantity: z.string().max(200).optional(),
});

export async function createMarketOfferAction(data: Omit<MarketOffer, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
    try {
        const parsed = marketOfferSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: parsed.error.errors[0].message };
        }

        const db = getAdminDb();
        const offerData: Partial<MarketOffer> = {
            ...parsed.data,
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const ref = await db.collection('market_offers').add(offerData);
        
        return { success: true, id: ref.id };
    } catch (error: any) {
        console.error("Error creating market offer:", error);
        return { success: false, error: "Error en el servidor al intentar crear la publicación." };
    }
}

export async function getUserMarketOffersAction(userId: string) {
    try {
        if (!userId) return { success: false, error: "Usuario no especificado" };

        const db = getAdminDb();
        const snapshot = await db.collection('market_offers')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const offers = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
            };
        });

        return { success: true, offers };
    } catch (error: any) {
        // Firebase index errors are common. If sorting fails due to missing index, fallback to basic limit/pull.
        console.error("Error fetching market offers:", error);
        try {
            const db = getAdminDb();
            const snapshot = await db.collection('market_offers')
                .where('userId', '==', userId)
                .get();

            let offers = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
                };
            });
            // Manual sort for fallback
            // @ts-ignore
            offers.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            return { success: true, offers };

        } catch (fbError) {
             console.error("Fallback fetch also failed:", fbError);
             return { success: false, error: "No se pudieron cargar las publicaciones." };
        }
    }
}
