import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enCommon from '../locales/en/common.json';
import daCommon from '../locales/da/common.json';

// Get saved language from localStorage or default to English
const savedLanguage = localStorage.getItem('prism-language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
      },
      da: {
        common: daCommon,
      },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
