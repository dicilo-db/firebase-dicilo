// Force reload of translations
// Updated translations
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
import faq_de from './locales/de/faq.json';
import faq_en from './locales/en/faq.json';
import faq_es from './locales/es/faq.json';
import register_de from './locales/de/register.json';
import register_en from './locales/en/register.json';
import register_es from './locales/es/register.json';
import form_de from './locales/de/form.json';
import form_en from './locales/en/form.json';
import form_es from './locales/es/form.json';
import legal_de from './locales/de/legal.json';
import legal_en from './locales/en/legal.json';
import legal_es from './locales/es/legal.json';
import login_de from './locales/de/login.json';
import login_en from './locales/en/login.json';
import login_es from './locales/es/login.json';
import social_de from './locales/de/social.json';
import social_en from './locales/en/social.json';
import social_es from './locales/es/social.json';
import client_de from './locales/de/client.json';
import client_en from './locales/en/client.json';
import client_es from './locales/es/client.json';

const resources = {
  de: {
    common: common_de,
    admin: admin_de,
    pricing_page: pricing_page_de,
    about: about_de,
    directory: directory_de,
    impressum: impressum_de,
    privacy: privacy_de,
    faq: faq_de,
    register: register_de,
    form: form_de,
    legal: legal_de,
    login: login_de,
    social: social_de,
    client: client_de,
  },
  en: {
    common: common_en,
    admin: admin_en,
    pricing_page: pricing_page_en,
    about: about_en,
    directory: directory_en,
    impressum: impressum_en,
    privacy: privacy_en,
    faq: faq_en,
    register: register_en,
    form: form_en,
    legal: legal_en,
    login: login_en,
    social: social_en,
    client: client_en,
  },
  es: {
    common: common_es,
    admin: admin_es,
    pricing_page: pricing_page_es,
    about: about_es,
    directory: directory_es,
    impressum: impressum_es,
    privacy: privacy_es,
    faq: faq_es,
    register: register_es,
    form: form_es,
    legal: legal_es,
    login: login_es,
    social: social_es,
    client: client_es,
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
    },
  });

export default i18n;
