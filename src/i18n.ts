
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
import pricing_page_de from './locales/de/pricing_page.json';
import pricing_page_en from './locales/en/pricing_page.json';
import pricing_page_es from './locales/es/pricing_page.json';
import about_de from './locales/de/about.json';
import about_en from './locales/en/about.json';
import about_es from './locales/es/about.json';
import directory_de from './locales/de/directory.json';
import directory_en from './locales/en/directory.json';
import directory_es from './locales/es/directory.json';
import impressum_de from './locales/de/impressum.json';
import impressum_en from './locales/en/impressum.json';
import impressum_es from './locales/es/impressum.json';
import privacy_de from './locales/de/privacy.json';
import privacy_en from './locales/en/privacy.json';
import privacy_es from './locales/es/privacy.json';

const resources = {
  de: {
    common: common_de,
    admin: admin_de,
    pricing_page: pricing_page_de,
    about: about_de,
    directory: directory_de,
    impressum: impressum_de,
    privacy: privacy_de,
  },
  en: {
    common: common_en,
    admin: admin_en,
    pricing_page: pricing_page_en,
    about: about_en,
    directory: directory_en,
    impressum: impressum_en,
    privacy: privacy_en,
  },
  es: {
    common: common_es,
    admin: admin_es,
    pricing_page: pricing_page_es,
    about: about_es,
    directory: directory_es,
    impressum: impressum_es,
    privacy: privacy_es,
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
