import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enKE from '../locales/en-ke.json';
import sw from '../locales/sw.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'en-KE': {
        translation: enKE
      },
      sw: {
        translation: sw
      }
    },
    fallbackLng: 'en-KE',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;