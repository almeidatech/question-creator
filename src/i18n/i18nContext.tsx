import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ptBR from './translations/pt-BR.json';
import en from './translations/en.json';
import es from './translations/es.json';

export type Language = 'pt-BR' | 'en' | 'es';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations = {
  'pt-BR': ptBR,
  'en': en,
  'es': es,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('pt-BR');

  // Load language from localStorage on mount (client-side only)
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language | null;
    const browserLanguage = navigator.language.split('-')[0];

    let detectedLanguage: Language = 'pt-BR';

    if (savedLanguage && ['pt-BR', 'en', 'es'].includes(savedLanguage)) {
      detectedLanguage = savedLanguage;
    } else if (browserLanguage === 'pt') {
      detectedLanguage = 'pt-BR';
    } else if (browserLanguage === 'es') {
      detectedLanguage = 'es';
    }

    setLanguageState(detectedLanguage);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // Nested key access: "auth.login" => translations[language].auth.login
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Dev mode warning for missing translations
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Missing translation key: "${key}" for language: ${language}`);
        }
        return key;
      }
    }

    let result = typeof value === 'string' ? value : key;

    // Interpolate parameters
    if (params && typeof result === 'string') {
      result = result.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
        return String(params[paramKey] ?? `{{${paramKey}}}`);
      });
    }

    return result;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

// Custom hook to use i18n
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};

// Utility to get all available languages
export const getAvailableLanguages = (): { code: Language; name: string }[] => [
  { code: 'pt-BR', name: 'Português (BR)' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
];
