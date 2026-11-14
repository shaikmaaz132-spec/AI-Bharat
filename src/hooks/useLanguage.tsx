'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
  setLanguage: () => { },
  t: (key: string) => key,
  isModalOpen: false,
  setIsModalOpen: () => { },
});

function applyToDocument(lang: Language) {
  document.documentElement.setAttribute('data-script', lang.script);
  document.documentElement.setAttribute('lang', lang.code);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<Language>(defaultLang);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bharat_language');
      const match = saved ? SUPPORTED_LANGUAGES.find((l) => l.code === saved) : undefined;
      if (match) {
        setCurrentLanguageState(match);
        applyToDocument(match);
        return;
      }
    } catch {
      // localStorage unavailable
    }
    applyToDocument(defaultLang);
  }, []);

  const setLanguage = (langCode: string) => {
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    if (found) {
      setCurrentLanguageState(found);
      try {
        localStorage.setItem('bharat_language', found.code);
      } catch {
        // ignore
      }
      applyToDocument(found);
    }
  };

  const t = useCallback(
    (key: string) => getTranslation(key, currentLanguage.code),
    [currentLanguage.code]
  );

  return (
    <LanguageContext.Provider
      value={{ currentLanguage, setLanguage, t, isModalOpen, setIsModalOpen }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}