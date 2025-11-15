// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import common_de from './locales/de/common.json';
import common_en from './locales/en/common.json';
import common_es from './locales/es/common.json';
import admin_de from './locales/de/admin.json';
import admin_en from './locales/en/admin.json';
import admin_es from './locales/es/admin.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: false,
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    resources: {
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
    },
  });

export default i18n;
