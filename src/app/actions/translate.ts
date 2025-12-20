'use server';

import { ai } from '@/ai/genkit';

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
