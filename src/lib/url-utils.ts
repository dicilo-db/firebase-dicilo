/**
 * Asegura que una URL tenga el protocolo https://.
 * Si no tiene protocolo y empieza con www. o parece un dominio, se le añade https://.
 */
export function ensureHttps(url: string): string {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    // Si ya tiene un protocolo, no hacemos nada
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    // Si empieza con //, asumimos protocolo relativo
    if (trimmed.startsWith('//')) {
        return `https:${trimmed}`;
    }

    // Si parece un handle de email o no tiene puntos, no lo tratamos como URL
    // pero el usuario pidió especificamente para URLs de webs.
    return `https://${trimmed.replace(/^www\./i, 'www.')}`;
}

/**
 * Formatea un handle de red social a su URL completa correspondiente.
 * Si ya es una URL, la deja tal cual o asegura https.
 */
export function formatSocialUrl(value: string, provider: 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'youtube' | 'twitch' | 'pinterest'): string {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';

    // Si ya parece una URL completa
    if (/^https?:\/\//i.test(trimmed) || trimmed.includes('.')) {
        return ensureHttps(trimmed);
    }

    // Quitar el @ si lo pusieron
    const handle = trimmed.startsWith('@') ? trimmed.substring(1) : trimmed;

    const baseUrls: Record<string, string> = {
        facebook: 'https://facebook.com/',
        instagram: 'https://instagram.com/',
        tiktok: 'https://tiktok.com/@',
        twitter: 'https://x.com/',
        linkedin: 'https://linkedin.com/in/',
        youtube: 'https://youtube.com/@',
        twitch: 'https://twitch.tv/',
        pinterest: 'https://pinterest.com/'
    };

    return `${baseUrls[provider] || ''}${handle}`;
}
