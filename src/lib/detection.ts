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
            return 'Hallo! Ich bin DicBot, dein smarter KI-Assistent. Womit kann ich dir heute helfen? Ich lerne noch, aber ich gebe mein Bestes, um dir eine hilfreiche Antwort zu geben.';
        case 'es':
            return '¡Hola! Soy DicBot, tu asistente inteligente. ¿En qué puedo ayudarte hoy? Aún estoy aprendiendo, pero haré lo mejor posible para darte una buena respuesta.';
        default:
            return "Hello! I'm DicBot, your smart AI assistant. How can I help you today? I'm still learning, but I'll do my best to give you a helpful answer.";
    }
}
