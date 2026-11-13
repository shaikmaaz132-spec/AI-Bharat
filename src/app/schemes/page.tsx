'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Languages, Sparkles, Database, WifiOff } from 'lucide-react';
import { SchemeCard } from '@/components/SchemeCard';
import { SchemeRecord } from '@/lib/supabase';
import { cacheSchemes, getCachedSchemes } from '@/lib/idb';
import { useLanguage } from '@/hooks/useLanguage';
import { useOffline } from '@/hooks/useOffline';

export default function SchemesCatalogPage() {
  const { currentLanguage, t } = useLanguage();
  const { isOffline } = useOffline();

  const [schemes, setSchemes] = useState<SchemeRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showVernacularOnly, setShowVernacularOnly] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const categories = [
    { id: 'all', label: 'सभी / All' },
    { id: 'agriculture', label: '🌾 कृषि / Agriculture' },
    { id: 'healthcare', label: '🏥 स्वास्थ्य / Healthcare' },
    { id: 'housing', label: '🏠 आवास / Housing' },
    { id: 'employment', label: '💼 रोजगार / Employment' },
    { id: 'women_welfare', label: '👩 महिला कल्याण / Women' },
    { id: 'social_security', label: '🛡️ सामाजिक सुरक्षा / Pension' },
    { id: 'education', label: '🎓 शिक्षा / Education' },
  ];

  useEffect(() => {
    async function loadSchemes() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/schemes${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`);
        if (res.ok) {
          const json = await res.json();
          const items: SchemeRecord[] = json.data || [];
          setSchemes(items);
          // Cache to IndexedDB for offline hardening
          await cacheSchemes(items);
        } else {
          throw new Error('API returned non-200 status');
        }
      } catch (err) {
        console.warn('Network fetch failed, querying local IndexedDB cache:', err);
        // Fallback to IndexedDB
        const cached = await getCachedSchemes(selectedCategory);
        if (cached && cached.length > 0) {
          setSchemes(cached as SchemeRecord[]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadSchemes();
  }, [selectedCategory]);

  const filteredSchemes = schemes.filter((s) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = s.title.toLowerCase().includes(q);
    const descMatch = s.description.toLowerCase().includes(q);
    const vTitleMatch = Object.values(s.title_translations || {}).some((val) =>
      typeof val === 'string' && val.toLowerCase().includes(q)
    );
    const benefitMatch = s.financial_benefit.toLowerCase().includes(q);

    return titleMatch || descMatch || vTitleMatch || benefitMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header & Vernacular Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              सरकारी कल्याणकारी योजनाएं
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#FF671F]">
              Welfare Catalog
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            प्रत्यक्ष वित्तीय लाभ, सब्सिडी और सामाजिक सुरक्षा योजनाओं की संपूर्ण आधिकारिक सूची।
          </p>
        </div>

        {/* Vernacular Toggle Control */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs self-start md:self-auto">
          <Languages className="w-4 h-4 text-[#FF671F] ml-2" />
          <span className="text-xs font-semibold text-slate-700 mr-2">
            मातृभाषा अनुवाद / Vernacular:
          </span>
          <button
            type="button"
            onClick={() => setShowVernacularOnly(!showVernacularOnly)}
            className={`
              px-3 py-1.5 rounded-xl text-xs font-bold transition-all
              ${
                showVernacularOnly
                  ? 'bg-gradient-to-r from-[#FF671F] to-[#046A38] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600'
              }
            `}
          >
            {showVernacularOnly ? 'चालू / ON' : 'बंद / OFF'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="योजना का नाम, लाभ या कीवर्ड खोजें (जैसे: किसान, ₹6000, आवास, पेंशन, राशन)..."
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#FF671F] shadow-xs"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`
              shrink-0 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-2xs
              ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }
            `}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Schemes Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#FF671F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">योजना सूची लोड हो रही है...</p>
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
          <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">कोई योजना नहीं मिली</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            आपके खोज मापदंड &ldquo;{searchQuery}&rdquo; के लिए कोई योजना नहीं मिली। कृपया अन्य कीवर्ड या श्रेणी चुनें।
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-[#FF671F] text-white rounded-xl text-xs font-bold"
          >
            सभी योजनाएं देखें
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme) => (
            <SchemeCard
              key={scheme.slug}
              scheme={scheme}
              showVernacularOnly={showVernacularOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}
