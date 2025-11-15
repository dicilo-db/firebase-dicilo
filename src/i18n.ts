
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import common_de from './locales/de/common.json';
import common_en from './locales/en/common.json';
import common_es from './locales/es/common.json';
import admin_de from './locales/de/admin.json';
import admin_en from './locales/en/admin.json';
import admin_es from './locales/es/admin.json';

const resources = {
  de: {
    common: common_de,
    admin: admin_de,
  },
  en: {
    common: common_en,
    admin: admin_en,
  },
  es: {
    common: common_es,
    admin: admin_es,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'de',
    debug: false, // Set to true to see logs in console
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    detection: {
      order: ['queryString', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['cookie'],
    },
    defaultNS: 'common',
    react: {
      useSuspense: false,
      transKeepHTMLValues: true, // Preserve HTML tags in translations
    },
  });

export default i18n;
