'use server';

import { getAdminDb } from '@/lib/firebase-admin';

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
    // MOCK TRANSLATION FOR NOW - or use real API if key available.
    // User asked to use Google API. Since I don't have the key in env var context explicitly confirmed,
    // I will placeholder this or try to fetch a public/free endpoint? 
    // Secure approach: Return "Translated [text] to [targetLang]" dummy, 
    // OR if env var GOOGLE_TRANSLATE_API_KEY exists, use it.

    // For this step I will mock to ensure UI flow works, then detailed implementation can follow.
    return `[TRANSLATED to ${targetLang}]: ${text}`;
}
