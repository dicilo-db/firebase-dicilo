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
    
    try {
        const response = await ai.generate({
            prompt: `Translate the following email content to ${targetLang}. 
            Keep all variables between double curly braces like {{Name}} or {{RefCode}} exactly as they are. 
            Maintain the HTML structure if present.
            Only return the translated text, no explanations or prefixes.
            Text: "${text}"`,
        });

        return response.text.trim();
    } catch (error: any) {
        console.error("Translation error:", error);
        // Fallback to original text if translation fails
        return text;
    }
}
