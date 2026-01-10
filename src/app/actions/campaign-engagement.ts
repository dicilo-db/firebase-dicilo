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
    selectedImageUrl: string = '',
    assetId: string = '',
    existingLinkId: string = '', // New optional param
    targetUrl: string = '' // NEW: Explicit target URL selected by user
) {
    if (!userId || !campaignId) {
        return { success: false, error: 'Faltan datos obligatorios.' };
    }

    const db = getAdminDb();

    try {
        const result = await db.runTransaction(async (t) => {
            // ... (validations remain same) ...

            // 1. Validaciones Previas (Lecturas)
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const linksQuery = db.collection('freelancer_links')
                .where('freelancerId', '==', userId)
                .where('campaignId', '==', campaignId);

            const allLinksSnapshot = await t.get(linksQuery);
            // Count "Active" posts only to enforce limit? Or all?
            // If we have drafts, we shouldn't count them against the limit unless they are turned into posts.
            // Drafts usually have status='draft' or monetizationActive=false. 
            // We should filter 'valid' posts.
            // Assuming previous logic counted ALL, which might include drafts if we don't differentiate.
            // Let's filter by timestamps or status if possible.
            // For now, keep existing logic but be aware drafts might clutter if not careful.
            // Ideally existing logic checks created_at. Drafts have created_at too.
            // We should probably filter out status='draft' logic if we want to be precise, 
            // but let's stick to simple count for now or filter in memory.
            const dailyLinksCount = allLinksSnapshot.docs.filter(doc => {
                const data = doc.data();
                // Ignore drafts in daily count? Yes.
                if (data.status === 'draft') return false;
                return data.createdAt && data.createdAt.toDate() >= todayStart;
            }).length;

            if (dailyLinksCount >= 10) {
                throw new Error("Has alcanzado tu límite diario de 10 posts para esta campaña.");
            }

            // ... (Campaign & Budget Checks remain same) ...
            const campaignRef = db.collection('campaigns').doc(campaignId);
            const campaignDoc = await t.get(campaignRef);

            if (!campaignDoc.exists) {
                throw new Error("La campaña no existe.");
            }

            const campaignData = campaignDoc.data();
            const budgetRemaining = campaignData?.budget_remaining || 0;
            const costPerStart = 0.50;
            const textReward = 0.40;

            if (budgetRemaining < costPerStart) {
                throw new Error("El presupuesto de esta campaña se ha agotado.");
            }

            // 2. Ejecución (Escrituras)
            t.update(campaignRef, {
                budget_remaining: admin.firestore.FieldValue.increment(-costPerStart),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // B. Determine Link ID (Reuse draft or create new)
            let linkId = existingLinkId;
            let linkRef;

            if (linkId) {
                linkRef = db.collection('freelancer_links').doc(linkId);
                const draftDoc = await t.get(linkRef);
                // Verify ownership to prevent hijacking
                if (!draftDoc.exists || draftDoc.data()?.freelancerId !== userId) {
                    // Fallback to new ID if invalid/hacked
                    linkId = Math.random().toString(36).substring(2, 10);
                    linkRef = db.collection('freelancer_links').doc(linkId);
                }
            } else {
                linkId = Math.random().toString(36).substring(2, 10);
                linkRef = db.collection('freelancer_links').doc(linkId);
            }

            // C. Create or Update "Freelancer Link" (Activate it)
            // We use set with merge: true to keep creation time of draft if desired, OR overwrite.
            // Better to overwrite status but keep ID.
            t.set(linkRef, {
                linkId: linkId,
                freelancerId: userId,
                campaignId: campaignId,
                selectedImageUrl: selectedImageUrl,
                assetId: assetId,
                messageTextLength: textLength,
                language: postLanguage,
                textRewardAmount: textReward,
                textPaidStatus: true,
                clickBonusAmount: 0.10,
                bonusPaidStatus: false,
                monetizationActive: true, // ACTIVATE
                status: 'active', // ACTIVATE
                paymentModel: 'fixed_plus_bonus',
                clickCount: 0, // Reset or keep? Keep if 0.
                clickCount: 0, // Reset or keep? Keep if 0.
                targetUrl: targetUrl || (campaignData?.[`url_${postLanguage}`]) || campaignData?.targetUrl || 'https://dicilo.net',
                createdAt: admin.firestore.FieldValue.serverTimestamp() // Update timestamp to Post Time
                createdAt: admin.firestore.FieldValue.serverTimestamp() // Update timestamp to Post Time
            }, { merge: true });

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
                description: `Creación Contenido: ${campaignData?.companyName || 'Campaign'}`,
                campaignId,
                linkId,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            // F. Registrar Acción para Estadísticas (Dashboard Stats relies on this)
            const actionRef = db.collection('user_campaign_actions').doc();
            t.set(actionRef, {
                userId,
                campaignId,
                freelancerId: userId,
                actionType: 'post_creation_v2',
                status: 'approved',
                rewardAmount: textReward,
                companyName: campaignData?.companyName || 'Unknown',
                campaignTitle: campaignData?.title || '',
                linkId: linkId,
                created_at: admin.firestore.FieldValue.serverTimestamp() // Snake case consistent with stats query
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

