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

export function formatPhoneWithCountryCode(phone: string | null | undefined, country: string | null | undefined): string {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/\s+/g, '').replace(/[-()]/g, '');
  if (!cleaned) return '';

  // If it already starts with '+', it's fine.
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If it starts with '00', convert to '+'
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.slice(2);
  }

  const countryName = (country || '').toLowerCase().trim();
  let prefix = '+49'; // Default prefix is +49 (Germany) or +34 (Spain)
  
  if (
    countryName.includes('españa') || 
    countryName.includes('spain') || 
    countryName.includes('es') ||
    cleaned.startsWith('34')
  ) {
    prefix = '+34';
    if (cleaned.startsWith('34') && cleaned.length > 8) {
      cleaned = cleaned.slice(2); // Remove duplicate country code
    }
  } else if (
    countryName.includes('deutschland') || 
    countryName.includes('germany') || 
    countryName.includes('de') ||
    cleaned.startsWith('49')
  ) {
    prefix = '+49';
    if (cleaned.startsWith('49') && cleaned.length > 9) {
      cleaned = cleaned.slice(2); // Remove duplicate country code
    }
  } else if (countryName.includes('venezuela') || countryName.includes('ve') || cleaned.startsWith('58')) {
    prefix = '+58';
    if (cleaned.startsWith('58') && cleaned.length > 9) {
      cleaned = cleaned.slice(2);
    }
  } else if (countryName.includes('colombia') || countryName.includes('co') || cleaned.startsWith('57')) {
    prefix = '+57';
    if (cleaned.startsWith('57') && cleaned.length > 9) {
      cleaned = cleaned.slice(2);
    }
  } else if (countryName.includes('österreich') || countryName.includes('austria') || countryName.includes('at') || cleaned.startsWith('43')) {
    prefix = '+43';
    if (cleaned.startsWith('43') && cleaned.length > 8) {
      cleaned = cleaned.slice(2);
    }
  } else if (countryName.includes('schweiz') || countryName.includes('switzerland') || countryName.includes('ch') || cleaned.startsWith('41')) {
    prefix = '+41';
    if (cleaned.startsWith('41') && cleaned.length > 8) {
      cleaned = cleaned.slice(2);
    }
  } else {
    // If no country matched, let's check the number structure
    // Spanish numbers typically have 9 digits and start with 6, 7, 8 or 9
    if (/^[6789]\d{8}$/.test(cleaned)) {
      prefix = '+34';
    } else {
      prefix = '+49'; // Default
    }
  }

  // Remove leading '0' if present (e.g. 0176... -> +49176...)
  if (cleaned.startsWith('0') && cleaned.length > 1) {
    cleaned = cleaned.slice(1);
  }

  return prefix + cleaned;
}
