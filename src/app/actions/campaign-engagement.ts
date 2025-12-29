'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

/**
 * Procesa un intento de post por parte de un usuario en una campaña.
 * Implementa el "Momento 1": Pago por Creación + Generación de Link.
 */
export async function processCampaignPost(
    userId: string,
    campaignId: string,
    postLanguage: string,
    textLength: number = 0,
    selectedImageUrl: string = ''
) {
    if (!userId || !campaignId) {
        return { success: false, error: 'Faltan datos obligatorios.' };
    }

    const db = getAdminDb();

    try {
        const result = await db.runTransaction(async (t) => {
            // 1. Validaciones Previas (Lecturas)

            // A. Verificar Límite Diario (10 posts por campaña por usuario)
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const linksQuery = db.collection('freelancer_links')
                .where('freelancerId', '==', userId)
                .where('campaignId', '==', campaignId);

            // OPTIMIZATION: Filter by date in memory to avoid "FAILED_PRECONDITION" (Composite Index Requirement)
            // Since max posts is 10/day, fetching all campaign links for this user is manageable, 
            // or we could limit to last 50 and check date. 
            // For now, fetching all for this campaign-user pair is safe given the scale (1user-1campaign).
            const allLinksSnapshot = await t.get(linksQuery);

            const dailyLinksCount = allLinksSnapshot.docs.filter(doc => {
                const data = doc.data();
                return data.createdAt && data.createdAt.toDate() >= todayStart;
            }).length;

            if (dailyLinksCount >= 10) {
                throw new Error("Has alcanzado tu límite diario de 10 posts para esta campaña.");
            }

            // B. Obtener Campaña y Verificar Presupuesto
            const campaignRef = db.collection('campaigns').doc(campaignId);
            const campaignDoc = await t.get(campaignRef);

            if (!campaignDoc.exists) {
                throw new Error("La campaña no existe.");
            }

            const campaignData = campaignDoc.data();
            const budgetRemaining = campaignData?.budget_remaining || 0;

            // Cost Model: 
            // Max potential cost = $0.40 (max text) + $0.10 (max bonus) = $0.50
            // We reserve strict $0.50 to ensure we can always pay the bonus if it happens.
            const costPerStart = 0.50;

            // C. Calcular Recompensa por CREACIÓN (Texto)
            let textReward = 0.00;
            if (textLength >= 600) {
                textReward = 0.40;
            } else if (textLength >= 300) {
                textReward = 0.20;
            } else {
                throw new Error("El texto es demasiado corto (mínimo 300 caracteres).");
            }

            // Validar si hay presupuesto
            if (budgetRemaining < costPerStart) {
                throw new Error("El presupuesto de esta campaña se ha agotado.");
            }

            // 2. Ejecución (Escrituras)

            // A. Descontar Presupuesto de la Campaña (Reservamos el máximo posible: 0.50)
            t.update(campaignRef, {
                budget_remaining: admin.firestore.FieldValue.increment(-costPerStart),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // B. Generar ID de Enlace único
            // Simple random string for ID (safer than external libs in server actions sometimes)
            const linkId = Math.random().toString(36).substring(2, 10); // 8 chars
            const linkRef = db.collection('freelancer_links').doc(linkId);

            // C. Crear registro "Freelancer Link" (La fuente de verdad)
            t.set(linkRef, {
                linkId: linkId,
                freelancerId: userId,
                campaignId: campaignId,

                // Datos de Contenido
                selectedImageUrl: selectedImageUrl,
                messageTextLength: textLength,
                language: postLanguage,

                // Pago 1: Esfuerzo (Texto)
                textRewardAmount: textReward,
                textPaidStatus: true, // Pagado inmediatamente en estapso paso

                // Pago 2: Resultado (Tráfico)
                clickBonusAmount: 0.10,
                bonusPaidStatus: false,
                monetizationActive: true,

                // Analytics
                clickCount: 0,
                // Select language-specific URL if available, otherwise fallback to main URL
                targetUrl: (campaignData?.[`url_${postLanguage}`] as string) || campaignData?.targetUrl || 'https://dicilo.net',

                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // D. Actualizar Billetera del Usuario (Solo pagamos el Text Reward ahora)
            const walletRef = db.collection('wallets').doc(userId);
            t.set(walletRef, {
                balance: admin.firestore.FieldValue.increment(textReward),
                totalEarned: admin.firestore.FieldValue.increment(textReward),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // E. Registrar Transacción en Historial
            const trxRef = db.collection('wallet_transactions').doc();
            t.set(trxRef, {
                userId,
                amount: textReward,
                type: 'CAMPAIGN_REWARD_TEXT',
                description: `Creación Contenido: ${campaignData?.name || 'Campaign'} (${textLength} chars)`,
                campaignId,
                linkId,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                reward: textReward,
                linkId: linkId,
                message: "Post registrado y pagado por creación."
            };
        });

        revalidatePath('/dashboard');
        return result;

    } catch (error: any) {
        console.error('Error procesando post:', error);
        return { success: false, error: error.message || 'Error al procesar el post.' };
    }
}

