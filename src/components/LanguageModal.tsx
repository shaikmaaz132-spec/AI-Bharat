'use client';

import React, { useState } from 'react';
import { X, Check, Globe, Search, Volume2 } from 'lucide-react';
import { SUPPORTED_LANGUAGES, Language } from '@/lib/languages';
import { useLanguage } from '@/hooks/useLanguage';

export function LanguageModal() {
  const { currentLanguage, setLanguage, isModalOpen, setIsModalOpen } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isModalOpen) return null;

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang.code);
    setIsModalOpen(false);

    // Provide pleasant speech sample if supported in browser SpeechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(lang.sampleGreeting);
      utterance.lang = lang.voiceCode;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-orange-50 via-white to-emerald-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FF671F]/10 text-[#FF671F] rounded-2xl">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                अपनी भाषा चुनें / Select Language
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                13+ भारतीय भाषाएँ समर्थित / 13+ Official Indian Languages Supported
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close language selector"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="भाषा खोजें / Search language (e.g. Hindi, Telugu, தமிழ்)..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF671F]"
            />
          </div>
        </div>

        {/* Language Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
          {filteredLanguages.map((lang) => {
            const isSelected = currentLanguage.code === lang.code;

            return (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang)}
                className={`
                  text-left p-4 rounded-2xl border-2 transition-all flex items-start justify-between group
                  ${
                    isSelected
                      ? 'border-[#FF671F] bg-orange-50/50 shadow-md ring-2 ring-orange-200'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                  }
                `}
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-slate-900 group-hover:text-[#FF671F] transition-colors">
                      {lang.nativeName}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {lang.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1 flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    &ldquo;{lang.sampleGreeting}&rdquo;
                  </p>
                </div>

                <div className="shrink-0 mt-1">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-[#FF671F] text-white flex items-center justify-center shadow-sm">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-slate-300" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
          चयन करते ही संपूर्ण इंटरफ़ेस तुरंत नई भाषा और लिपि में बदल जाएगा।
        </div>
      </div>
    </div>
  );
}
