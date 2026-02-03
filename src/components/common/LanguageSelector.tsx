import React, { useState } from 'react';
import { useI18n, getAvailableLanguages } from '@/i18n/i18nContext';
import { useUIStore } from '@/stores';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useI18n();
  const { darkMode } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);

  const languages = getAvailableLanguages();
  const currentLanguage = languages.find((l) => l.code === language);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
          darkMode
            ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
        }`}
        aria-label={t('common.language')}
      >
        <Globe size={18} />
        <span className="text-sm font-medium">{currentLanguage?.name}</span>
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-48 rounded-lg border shadow-lg z-50 ${
            darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                language === lang.code
                  ? darkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-600 font-medium'
                  : darkMode
                  ? 'text-gray-200 hover:bg-gray-700'
                  : 'text-gray-900 hover:bg-gray-100'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
