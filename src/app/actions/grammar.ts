'use server';

import { ai } from '@/ai/genkit';

interface CorrectionResult {
    success: boolean;
    correctedText?: string;
    originalText?: string;
    wasCorrected?: boolean;
    explanation?: string;
    error?: string;
}

/**
 * Corrige gramática, ortografía y estilo del texto proporcionado utilizando IA.
 * @param text Texto a corregir
 * @param languageContext (Opcional) Contexto del idioma, e.g., 'Spanish', 'German'. Si no se da, la IA lo detecta.
 */
export async function correctText(text: string, languageContext?: string): Promise<CorrectionResult> {
    try {
        if (!text || text.trim().length < 5) {
            return { success: true, correctedText: text, wasCorrected: false, explanation: 'Texto muy corto para corregir.' };
        }

        const prompt = `
        Act as a professional copy editor. Review the following text for grammar, spelling, and stylistic improvements to make it sound professional yet natural for social media promotion.
        
        Input Text: "${text}"
        ${languageContext ? `Language Context: ${languageContext}` : ''}

        Rules:
        1. Correct any grammar and spelling errors.
        2. Improve flow and clarity without changing the original meaning.
        3. Return a JSON object with this structure: { "corrected": "string", "changed": boolean, "changes_summary": "string" }
        4. ONLY return the JSON.
        `;

        const response = await ai.generate({
            prompt: prompt,
            output: { format: 'json' }
        });

        // Parseamos la respuesta, asumiendo que Genkit devuelve un objeto o string JSON válido
        let output: any = response.output;

        // Si por alguna razón output no es el objeto directo (depende de la config de Genkit), intentamos parsear text
        if (!output && response.text) {
            try {
                // Limpiar bloques de código markdown si los hay
                const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                output = JSON.parse(cleanJson);
            } catch (e) {
                console.warn('Fallo parseo JSON manual en correctText', e);
                // Fallback: Si no es JSON, asumimos que el texto es la corrección
                return { success: true, correctedText: response.text, wasCorrected: true };
            }
        }

        return {
            success: true,
            correctedText: output.corrected || text,
            originalText: text,
            wasCorrected: output.changed || false,
            explanation: output.changes_summary
        };

    } catch (error: any) {
        console.error('AI Copy Editor Error:', error);
        return { success: false, error: 'Failed to process text correction.' };
    }
}
