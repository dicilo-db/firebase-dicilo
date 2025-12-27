'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

/**
 * Procesa un intento de post por parte de un usuario en una campaña.
 * Valida límites diarios (Fair Play) y presupuesto de la campaña.
 * Ejecuta la transacción monetaria ocultando los márgenes de beneficio.
 */
/**
 * Procesa un intento de post por parte de un usuario en una campaña.
 * Valida límites diarios (Fair Play) y presupuesto de la campaña.
 * Ejecuta la transacción monetaria ocultando los márgenes de beneficio.
 */
export async function processCampaignPost(userId: string, campaignId: string, postLanguage: string, textLength: number = 0) {
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

            const actionsQuery = db.collection('user_campaign_actions')
                .where('userId', '==', userId)
                .where('campaignId', '==', campaignId)
                .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(todayStart));

            const dailyActions = await t.get(actionsQuery);
            if (dailyActions.size >= 10) {
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
            const costPerAction = campaignData?.cost_per_action || 0.60; // Costo base para anunciante

            // C. Calcular Recompensa Dinámica
            let rewardPerAction = 0;
            if (textLength >= 800) {
                rewardPerAction = 0.40;
            } else if (textLength >= 600) {
                rewardPerAction = 0.20;
            } else {
                // Si el texto es muy corto, tal vez no damos recompensa o damos una mínima
                // Por ahora asumimos 0 o bloqueamos en frontend.
                // Pero el usuario dijo "por 600 caracteres gana 0,20".
                // Dejaremos 0 si es menor.
                rewardPerAction = 0;
            }

            if (rewardPerAction === 0) {
                throw new Error("El texto es demasiado corto para generar ganancias (min 600 caracteres).");
            }

            // Validar si hay presupuesto para pagar esta acción (usando el costo, no el reward)
            if (budgetRemaining < costPerAction) {
                throw new Error("El presupuesto de esta campaña se ha agotado.");
            }

            // 2. Ejecución (Escrituras)

            // A. Descontar Presupuesto de la Campaña (Costo Total)
            t.update(campaignRef, {
                budget_remaining: admin.firestore.FieldValue.increment(-costPerAction),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // B. Registrar Acción del Usuario (Solo mostramos lo que gana)
            const actionRef = db.collection('user_campaign_actions').doc();
            t.set(actionRef, {
                userId,
                campaignId,
                language: postLanguage,
                textLength,
                rewardAmount: rewardPerAction,
                hasCommentsBonus: false, // Default false, will be updated via async job or reviews view logic
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // C. Actualizar Billetera del Usuario
            const walletRef = db.collection('wallets').doc(userId);
            t.set(walletRef, {
                balance: admin.firestore.FieldValue.increment(rewardPerAction),
                totalEarned: admin.firestore.FieldValue.increment(rewardPerAction),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // D. Registrar Transacción en Historial
            const trxRef = db.collection('wallet_transactions').doc();
            t.set(trxRef, {
                userId,
                amount: rewardPerAction,
                type: 'CAMPAIGN_REWARD',
                description: `Post Campaign: ${campaignData?.name || 'Campaign'} (${textLength} chars)`,
                campaignId,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                reward: rewardPerAction,
                message: "Post procesado con éxito."
            };
        });

        revalidatePath('/dashboard');
        return result;

    } catch (error: any) {
        console.error('Error procesando post:', error);
        return { success: false, error: error.message || 'Error al procesar el post.' };
    }
}
