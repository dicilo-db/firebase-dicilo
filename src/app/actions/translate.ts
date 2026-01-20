'use server';

import { ai } from '@/ai/genkit';
import { getAdminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
export async function translateText(text: string, targetLanguage: string = 'Spanish') {
    try {
        const response = await ai.generate({
            prompt: `Translate the following text into ${targetLanguage}. Return ONLY the translated text, nothing else. Text: "${text}"`,
        });

        return { success: true, translation: response.text };
    } catch (error: any) {
        console.error('Translation Error:', error);
        return { success: false, error: 'Translation failed. Please try again.' };
    }
}

/**
 * Obtiene la traducción de una campaña al idioma destino.
 * Primero busca en la base de datos (caché) y si no existe, genera una nueva con IA y la guarda.
 */
export async function getCampaignTranslation(campaignId: string, targetLanguage: string) {
    const db = getAdminDb();

    // 1. Buscar en DB si ya existe
    // Estructura asumida: campaigns/{id}/translations/{langCode}
    // Nota: targetLanguage debería ser un código estándar o nombre consistente (ej. 'English', 'German' o 'en', 'de')
    const translationRef = db.collection('campaigns')
        .doc(campaignId)
        .collection('translations')
        .doc(targetLanguage);

    try {
        const doc = await translationRef.get();
        if (doc.exists) {
            return { success: true, translation: doc.data()?.text, cached: true };
        }

        // 2. Si no existe, obtener texto original y traducir
        const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
        if (!campaignDoc.exists) {
            return { success: false, error: 'Campaña no encontrada' };
        }

        const originalText = campaignDoc.data()?.text || campaignDoc.data()?.description || '';
        if (!originalText) {
            return { success: false, error: 'La campaña no tiene texto para traducir.' };
        }

        // Usar la función existente de IA
        const aiResponse = await translateText(originalText, targetLanguage);

        if (!aiResponse.success || !aiResponse.translation) {
            return { success: false, error: 'Fallo en el servicio de traducción.' };
        }

        // 3. Guardar en DB para el futuro (Caché)
        await translationRef.set({
            text: aiResponse.translation,
            language: targetLanguage,
            originalTextHash: originalText.length, // Simple check, podría ser un hash real
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isAutoTranslated: true
        });

        return { success: true, translation: aiResponse.translation, cached: false };

    } catch (error: any) {
        console.error('Error obtención traducción:', error);
        return { success: false, error: 'Error interno en traducción.' };
    }
}

/**
 * Traduce texto arbitrario del usuario (para recomendaciones personalizadas).
 */
export async function translateUserText(text: string, targetLanguage: string) {
    if (!text) return { success: false, error: 'No text provided' };
    return await translateText(text, targetLanguage);
}
