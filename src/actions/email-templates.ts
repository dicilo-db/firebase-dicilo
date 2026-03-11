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
    rewardAmount?: number;
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
            model: 'googleai/gemini-2.5-flash',
            output: { format: 'json' },
            prompt: `
            ROLE: Professional, Fluent ${targetLangName} Translator.
            TARGET LANGUAGE: ${targetLangName}.
            
            TASK: Translate the content exactly to ${targetLangName}.
            
            STRICT RULES:
            1. Output ONLY a valid JSON object with a single key "translatedText" containing the translation.
            2. Preserve all {{variable}} tags and HTML structure exactly.
            3. Do NOT return Spanish. The result MUST BE in ${targetLangName}.
            
            TEXT TO TRANSLATE:
            ${text}
            `
        });

        try {
            const parsed = JSON.parse(response.text || '{}');
            if (parsed.translatedText) {
                console.log(`[AI Translation] Success for ${targetLangName}`);
                return parsed.translatedText;
            }
        } catch (parseError) {
            console.error("[AI Translation] JSON Parse Error:", parseError, "Raw output:", response.text);
        }

        console.log(`[AI Translation] Fallback reached for ${targetLangName}`);
        return text;
    } catch (error: any) {
        console.error("[AI Translation] Error:", error);
        return text;

    }
}
