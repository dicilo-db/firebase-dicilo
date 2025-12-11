import { headers } from 'next/headers';

export function detectLanguage(): string {
    const headersList = headers();

    // 1. Check IP-based location (if deployed on Vercel/Firebase which adds this header)
    const country = headersList.get('x-vercel-ip-country') || headersList.get('x-appengine-country');
    if (country) {
        if (['DE', 'AT', 'CH'].includes(country)) return 'de';
        if (['ES', 'MX', 'AR', 'CO'].includes(country)) return 'es';
    }

    // 2. Check Accept-Language
    const acceptLanguage = headersList.get('accept-language');
    if (acceptLanguage) {
        if (acceptLanguage.startsWith('de')) return 'de';
        if (acceptLanguage.startsWith('es')) return 'es';
    }

    // Default to English
    return 'en';
}

export function getGreeting(lang: string): string {
    switch (lang) {
        case 'de':
            return 'Hallo! Ich bin der Dicilo KI-Assistent. Wie kann ich Ihnen heute helfen?';
        case 'es':
            return '¡Hola! Soy el asistente virtual de Dicilo. ¿En qué puedo ayudarte hoy?';
        default:
            return 'Hello! I am the Dicilo AI assistant. How can I help you today?';
    }
}
