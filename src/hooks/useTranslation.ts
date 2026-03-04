import { translations, TranslationKey } from '../locales/translations';

export const useTranslation = (locale?: string) => {
  const currentLocale = locale || 'en';
  
  const t = (key: TranslationKey, fallback?: string) => {
    const translation = translations[currentLocale as keyof typeof translations]?.[key];
    return translation || fallback || key;
  };

  return { t, locale: currentLocale };
};
