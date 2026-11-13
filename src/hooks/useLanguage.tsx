'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SUPPORTED_LANGUAGES, Language, getTranslation } from '@/lib/languages';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (langCode: string) => void;
  t: (key: string) => string;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const defaultLang = SUPPORTED_LANGUAGES[0]; // Hindi default

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: defaultLang,
  setLanguage: () => {},
  t: (key: string) => key,
  isModalOpen: false,
  setIsModalOpen: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<Language>(defaultLang);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Check saved language preference in localStorage
    const saved = localStorage.getItem('bharat_language');
    if (saved) {
      const match = SUPPORTED_LANGUAGES.find((l) => l.code === saved);
      if (match) {
        setCurrentLanguageState(match);
        document.documentElement.setAttribute('data-script', match.script);
        document.documentElement.setAttribute('lang', match.code);
        return;
      }
    }

    // Default to Hindi
    document.documentElement.setAttribute('data-script', defaultLang.script);
    document.documentElement.setAttribute('lang', defaultLang.code);
  }, []);

  const setLanguage = (langCode: string) => {
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    if (found) {
      setCurrentLanguageState(found);
      localStorage.setItem('bharat_language', found.code);
      document.documentElement.setAttribute('data-script', found.script);
      document.documentElement.setAttribute('lang', found.code);
    }
  };

  const t = (key: string) => {
    return getTranslation(key, currentLanguage.code);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        isModalOpen,
        setIsModalOpen,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
