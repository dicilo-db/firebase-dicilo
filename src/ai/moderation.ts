import { ai } from './genkit';
import { z } from 'genkit';

/**
 * Diccionario muy básico y universal para respuestas ultrarrápidas.
 * Evita llamar a la IA de Google si el término es patentemente obsceno.
 * (Escrito en Lowercase sin comillas o tildes)
 */
const UNIVERSAL_HARD_BANNED_WORDS = [
    // Spanish
    'puto', 'puta', 'mierda', 'cojon', 'cabron', 'malnacido', 'hdp', 'pendejo', 'zorra', 'maricon', 'follar',
    // English
    'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'cock', 'pussy', 'nigger', 'faggot', 'slut', 'whore',
    // German
    'scheisse', 'arschloch', 'hurensohn', 'fotze', 'schlampe', 'wichser'
];

/**
 * Helper: Sanitiza un texto para limpiar tildes y caracteres extraños de forma local
 */
function normalizeText(text: string): string {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Skill de Moderación Automática Textual
 * Capaz de evaluar reseñas para identificar lenguaje tóxico, odio, material ilegal, o insultos locales.
 * Si detecta algo, sugiere rechazo o censura.
 */
export async function moderateContentSkill(text: string): Promise<{ isSafe: boolean; reason?: string; cleanedText?: string }> {
    if (!text || text.trim().length === 0) {
        return { isSafe: true, cleanedText: text };
    }

    const normalizedStr = normalizeText(text);

    // 1. FAST-PATH SHIELD: Escaneo de diccionario rápido
    for (const badword of UNIVERSAL_HARD_BANNED_WORDS) {
        // Regex de frontera de palabra para no chocar con letras en el medio de una palabra normal
        const regex = new RegExp(`\\b${badword}\\b`, 'gi');
        if (regex.test(normalizedStr)) {
            // Immediate Reject
            return {
                isSafe: false,
                reason: `Lenguaje inapropiado o violento detectado de forma automatizada (Infracción de Reglas Dicilo)`,
                cleanedText: text.replace(regex, '****')
            };
        }
    }

    // 2. AI SEMANTIC FILTER: Moderación Semántica en 12 Idiomas
    try {
        const response = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            prompt: `
As a strictly professional Content Moderator for Dicilo.net (a local business recommendation platform like Yelp / Trustpilot). 
Your task is to analyze the following User Review text.
Languages supported: DE, EN, ES, FR, IT, PT, etc. (12+ languages).
Determine if the review contains:
1. Offensive language, profanity, or insults.
2. Hate speech, discrimination, or racism.
3. Illegal mentions (drugs, violence, explicit adult content).

If the text contains ANY of those, it must be marked as UNSAFE. 

User Review Text:
"""
${text}
"""
`,
            output: {
                schema: z.object({
                    isSafe: z.boolean().describe("True si el texto es profesional y seguro, False si contiene palabras soeces o lenguaje de odio en cualquier idioma."),
                    reason: z.string().optional().describe("La razón precisa si el texto es inseguro (ej. 'Contiene insulto leve en Alemán', 'Discurso de odio'). Déjalo vacío si es Safe."),
                    cleanedText: z.string().describe("El mismo texto, pero con asteriscos (***) reemplazando cualquier palabra grotescamente ofensiva si existiera. Si es seguro o no se requiere asteriscar, pásalo tal cual.")
                })
            }
        });

        // @ts-ignore
        const result = response.output;
        
        return {
            isSafe: result?.isSafe ?? true,
            reason: result?.reason,
            // If model somehow strips all text, fallback to original
            cleanedText: result?.cleanedText && result.cleanedText.length > 2 ? result.cleanedText : text 
        };
    } catch (error) {
        console.error("AI Moderation failed. Falling back to optimistic acceptance:", error);
        // Fallback in case Gemini API is down, to not block the platform
        return { isSafe: true, cleanedText: text };
    }
}
