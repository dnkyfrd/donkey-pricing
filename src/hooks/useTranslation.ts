import { translations, TranslationKey } from '../locales/translations';

export const useTranslation = (locale?: string) => {
  const currentLocale = locale || 'en';
  
  const t = (key: TranslationKey, params?: Record<string, string | number>, fallback?: string) => {
    const translation = translations[currentLocale as keyof typeof translations]?.[key];
    let result = translation || fallback || key;
    
    // Replace parameters in the translation string
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        result = result.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      });
    }
    
    return result;
  };

  return { t, locale: currentLocale };
};
