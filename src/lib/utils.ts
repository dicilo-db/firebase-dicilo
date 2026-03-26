import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isValidUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

export function getGreeting(lang: string = 'es'): string {
    const hour = new Date().getHours();
    
    switch(lang) {
        case 'en':
            if (hour < 12) return 'Good morning';
            if (hour < 18) return 'Good afternoon';
            return 'Good evening';
        case 'de':
            if (hour < 12) return 'Guten Morgen';
            if (hour < 18) return 'Guten Tag';
            return 'Guten Abend';
        case 'fr':
            if (hour < 18) return 'Bonjour';
            return 'Bonsoir';
        case 'it':
            if (hour < 12) return 'Buongiorno';
            if (hour < 18) return 'Buon pomeriggio';
            return 'Buonasera';
        case 'pt':
            if (hour < 12) return 'Bom dia';
            if (hour < 18) return 'Boa tarde';
            return 'Boa noite';
        case 'es':
        default:
            if (hour < 12) return 'Buenos días';
            if (hour < 20) return 'Buenas tardes';
            return 'Buenas noches';
    }
}
