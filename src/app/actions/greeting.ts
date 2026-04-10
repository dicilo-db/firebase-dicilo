'use server';

import { detectLanguage, getGreeting } from '@/lib/detection';

export async function getGreetingAction() {
    try {
        const lang = detectLanguage();
        return getGreeting(lang);
    } catch (error) {
        console.error('Error in getGreetingAction:', error);
        return 'Hello! I am the Dicilo AI assistant. How can I help you today?';
    }
}
