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
        'de': 'German'
    };
    const targetLangName = langNames[targetLang] || targetLang;

    try {
        console.log(`[AI Translation] Translating to ${targetLangName}: "${text.substring(0, 50)}..."`);
        const response = await ai.generate({
            prompt: `
            ROLE: Professional Translator.
            SOURCE LANGUAGE: Spanish.
            TARGET LANGUAGE: ${targetLangName}.
            
            TASK: Translate the content within <TO_TRANSLATE> tags to ${targetLangName}.
            
            STRICT RULES:
            1. Output ONLY the translated text.
            2. ABSOLUTELY NO metadata, NO headers, NO explanations, NO original Spanish.
            3. Provide a high-quality, professional email marketing translation.
            4. Preserve all curly brace variables like {{Name}}, {{RefCode}}, {{Amount}} etc. EXACTLY.
            5. Preserve all HTML structure (<p>, <br>, <a> tags) and line breaks.
            6. If you find the input is already in ${targetLangName}, return it as is. 
            7. MANDATORY: The result MUST BE in ${targetLangName}.
            
            <TO_TRANSLATE>
            ${text}
            </TO_TRANSLATE>
            `,
        });

        let result = response.text.trim();
        
        // Remove common AI noise/prefixes if they appear
        result = result.replace(/^(\[TRANSLATED to [a-zA-Z]+\]:?|Translation:|Result:)/i, '').trim();
        
        // Final fallback: if AI returned nothing or just the prefix, return original
        if (!result) return text;

        console.log(`[AI Translation] Result for ${targetLangName}: "${result.substring(0, 50)}..."`);
        return result;
    } catch (error: any) {
        console.error("[AI Translation] Error:", error);
        return text;
    }
}
