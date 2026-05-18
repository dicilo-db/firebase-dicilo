'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { BusinessProduct } from '@/types/business';
import { FieldValue } from 'firebase-admin/firestore';

const db = getAdminDb();

const PLAN_LIMITS = {
    basic: { maxProducts: 0, maxCategories: 0 },
    starter: { maxProducts: 24, maxCategories: 1 },
    minorista: { maxProducts: 300, maxCategories: 4 },
    premium: { maxProducts: 600, maxCategories: 14 }
};

/**
 * Validates if a company can add a new product based on their plan limits.
 * Reads dynamic limits from the system_modules governance collection.
 */
async function validateLimits(companyId: string, newCategory: string) {
    const profileSnap = await db.collection('business_profiles').doc(companyId).get();
    if (!profileSnap.exists) {
        throw new Error('Empresa no encontrada.');
    }

    const profile = profileSnap.data();
    const plan = (profile?.plan || 'basic') as keyof typeof PLAN_LIMITS;
    
    // Default fallback limits
    let limits = PLAN_LIMITS[plan];

    // Read dynamic limits from system_modules
    try {
        const moduleSnap = await db.collection('system_modules').doc(plan).get();
        if (moduleSnap.exists) {
            const modData = moduleSnap.data();
            const productFicha = modData?.fichas?.productos;
            const categoryFicha = modData?.fichas?.categorias;
            
            if (productFicha && productFicha.enabled) {
                limits.maxProducts = productFicha.maxLimit !== undefined ? productFicha.maxLimit : limits.maxProducts;
            } else if (productFicha && !productFicha.enabled) {
                limits.maxProducts = 0; // Disabled
            }

            if (categoryFicha && categoryFicha.enabled) {
                limits.maxCategories = categoryFicha.maxLimit !== undefined ? categoryFicha.maxLimit : limits.maxCategories;
            }
        }
    } catch (e) {
        console.error("Error reading system_modules limits, falling back to default.", e);
    }

    if (limits.maxProducts === 0) {
        throw new Error('El Plan Básico no incluye Gestor de Productos. Actualiza tu plan.');
    }

    // Get current products
    const productsSnap = await db.collection('business_products').where('companyId', '==', companyId).get();
    const currentProductsCount = productsSnap.size;

    if (currentProductsCount >= limits.maxProducts) {
        throw new Error(`Límite alcanzado: Tu plan ${plan.toUpperCase()} permite un máximo de ${limits.maxProducts} productos.`);
    }

    // Calculate unique categories used
    const categoriesUsed = new Set<string>();
    productsSnap.forEach(doc => {
        const cat = doc.data().category;
        if (cat) categoriesUsed.add(cat);
    });

    categoriesUsed.add(newCategory); // Add the one they are trying to create

    if (categoriesUsed.size > limits.maxCategories) {
        throw new Error(`Límite de categorías: Tu plan permite un máximo de ${limits.maxCategories} categorías distintas.`);
    }

    return true;
}

export async function createProduct(data: Omit<BusinessProduct, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
        if (!data.companyId) throw new Error('Company ID requerido');

        await validateLimits(data.companyId, data.category);

        const newRef = db.collection('business_products').doc();
        
        await newRef.set({
            ...data,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });

        // Trigger n8n webhook simulator
        console.log(`[n8n Hook Triggered] Product Created: ${newRef.id} for company ${data.companyId}`);

        return { success: true, id: newRef.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getProductsByCompany(companyId: string) {
    try {
        const snapshot = await db.collection('business_products')
            .where('companyId', '==', companyId)
            .get();

        const products = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
            };
        });

        // In-memory sort to avoid requiring a Firebase Composite Index
        products.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA; // Descending
        });

        return { success: true, products };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteProduct(productId: string, companyId: string) {
    try {
        const ref = db.collection('business_products').doc(productId);
        const snap = await ref.get();
        
        if (!snap.exists) throw new Error('Producto no encontrado');
        if (snap.data()?.companyId !== companyId) throw new Error('Acceso denegado');

        await ref.delete();

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
