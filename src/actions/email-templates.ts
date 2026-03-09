'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { ai } from '@/ai/genkit';

const db = getAdminDb();

export type EmailTemplate = {
    id?: string;
    name: string;
    category: 'network_campaigns' | 'email_marketing' | 'referrals' | 'system' | 'marketing' | 'referral';
    versions: {
        [key: string]: {
            subject: string;
            body: string;
        };
    };
    variables: string[];
    imageUrl?: string;
    images?: string[];
    createdAt?: string;
    updatedAt?: string;
};

export async function getTemplates() {
    try {
        const snapshot = await db.collection('email_templates').get();
        const templates: EmailTemplate[] = [];
        snapshot.forEach((doc) => {
            templates.push({ id: doc.id, ...doc.data() } as EmailTemplate);
        });
        return templates;
    } catch (error) {
        console.error('Error fetching templates:', error);
        throw new Error('Failed to fetch templates');
    }
}

export async function getTemplate(id: string) {
    try {
        const doc = await db.collection('email_templates').doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() } as EmailTemplate;
    } catch (error) {
        console.error('Error fetching template:', error);
        throw new Error('Failed to fetch template');
    }
}

export async function saveTemplate(template: EmailTemplate) {
    try {
        const { id, ...data } = template;
        const now = new Date().toISOString();

        if (id) {
            await db.collection('email_templates').doc(id).update({
                ...data,
                updatedAt: now
            });
            return { id, ...data, updatedAt: now };
        } else {
            const res = await db.collection('email_templates').add({
                ...data,
                createdAt: now,
                updatedAt: now
            });
            return { id: res.id, ...data, createdAt: now, updatedAt: now };
        }
    } catch (error) {
        console.error('Error saving template:', error);
        throw new Error('Failed to save template');
    }
}

export async function translateText(text: string, targetLang: string) {
    if (!text) return '';
    
    // Map codes to full names for better AI reliability
    const langNames: Record<string, string> = {
        'es': 'Spanish',
        'en': 'English',
        'de': 'German',
        'fr': 'French',
        'pt': 'Portuguese',
        'it': 'Italian'
    };
    const targetLangName = langNames[targetLang] || targetLang;

    try {
        console.log(`[AI Translation] Translating to ${targetLangName}: "${text.substring(0, 50)}..."`);
        const response = await ai.generate({
            prompt: `
            ROLE: Professional, Fluent ${targetLangName} Translator.
            SOURCE LANGUAGE: Spanish.
            TARGET LANGUAGE: ${targetLangName}.
            
            TASK: Translate the content within <TO_TRANSLATE> tags from Spanish to ${targetLangName} accurately and professionally.
            
            STRICT OUTPUT RULES:
            1. Output ONLY the translated content in ${targetLangName}.
            2. DO NOT include any prefixes, headers, notes, or meta-comments.
            3. DO NOT include strings like "[TRANSLATED to ...]", "Translation:", or "Here is the translation:".
            4. If you cannot translate, return the original text as is, without any added messages.
            5. Preserve all {{variable}} tags and HTML structure exactly.
            
            <TO_TRANSLATE>
            ${text}
            </TO_TRANSLATE>
            `,
        });

        let result = response.text.trim();
        
        // Super aggressive cleaning of common AI noise patterns
        const noisePatterns = [
            /^\[TRANSLATED to [a-zA-Z\s]+\]:?\s*/i,
            /^Translation in [a-zA-Z\s]+:?\s*/i,
            /^Translation:?\s*/i,
            /^Result:?\s*/i,
            /^Here is the translated text:?\s*/i,
            /^Subject:?\s*/i,
            /^Body:?\s*/i
        ];

        let cleaned = result;
        let changed = true;
        while (changed) {
            changed = false;
            for (const pattern of noisePatterns) {
                const newCleaned = cleaned.replace(pattern, '').trim();
                if (newCleaned !== cleaned) {
                    cleaned = newCleaned;
                    changed = true;
                }
            }
        }
        
        // If the AI just returned empty space or failed miserably
        if (!cleaned) return text;

        console.log(`[AI Translation] Cleaned Result for ${targetLangName}: "${cleaned.substring(0, 50)}..."`);
        return cleaned;
    } catch (error: any) {
        console.error("[AI Translation] Error:", error);
        return text;
    }
}
