'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Building,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { SchemeRecord } from '@/lib/supabase';
import { getCachedSchemeBySlug } from '@/lib/idb';
import { useLanguage } from '@/hooks/useLanguage';

export default function SchemeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { currentLanguage } = useLanguage();

  const [scheme, setScheme] = useState<SchemeRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/schemes/${slug}`);
        if (res.ok) {
          const json = await res.json();
          setScheme(json.data);
        } else {
          throw new Error('Not found on API');
        }
      } catch (err) {
        console.warn('API error, reading from IndexedDB:', err);
        const cached = await getCachedSchemeBySlug(slug);
        if (cached) {
          setScheme(cached as SchemeRecord);
        }
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#FF671F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">योजना विवरण लोड हो रहा है...</p>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">योजना विवरण उपलब्ध नहीं है</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          यह योजना डेटाबेस में नहीं मिली या आप ऑफ़लाइन हैं और यह पृष्ठ पहले कैश नहीं हुआ था।
        </p>
        <Link
          href="/schemes"
          className="px-5 py-2.5 bg-[#FF671F] text-white rounded-xl text-sm font-bold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>योजना सूची पर वापस जाएं</span>
        </Link>
      </div>
    );
  }

  const langCode = currentLanguage.code;
  const vernacularTitle = scheme.title_translations?.[langCode] || scheme.title_translations?.['hi'];
  const vernacularDesc = scheme.description_translations?.[langCode] || scheme.description_translations?.['hi'];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 mb-6 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>वापस जाएं / Back to Schemes</span>
      </button>

      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-orange-100 text-[#FF671F] border border-orange-200">
            {scheme.category.replace('_', ' ')}
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {scheme.level === 'central' ? '🏛️ केंद्र सरकार की योजना' : `📍 राज्य योजना (${scheme.state})`}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {vernacularTitle || scheme.title}
        </h1>

        {vernacularTitle && vernacularTitle !== scheme.title && (
          <p className="text-base sm:text-lg text-slate-500 font-medium mt-1">{scheme.title}</p>
        )}

        <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-slate-600">
          <Building className="w-4 h-4 text-slate-400 shrink-0" />
          <span>मंत्रालय / विभाग: <strong className="text-slate-800">{scheme.ministry}</strong></span>
        </div>

        {/* Financial Benefit Highlight Banner */}
        <div className="mt-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-orange-50 via-amber-50 to-emerald-50 border-2 border-orange-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-orange-800 uppercase tracking-wider block mb-1">
              प्रत्यक्ष वित्तीय लाभ / Financial Subsidy & Benefit
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-1.5">
              <span className="text-emerald-700">₹</span>
              <span>{scheme.financial_benefit}</span>
            </p>
          </div>

          <Link
            href="/eligibility"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF671F] to-[#046A38] text-white font-bold text-sm shadow-md hover:opacity-95 transition-all text-center shrink-0 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>पात्रता जांचें / Check Eligibility</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Columns (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>योजना का विवरण / Overview</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed vernacular-content">
              {vernacularDesc || scheme.description}
            </p>
          </div>

          {/* Eligibility Criteria */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>पात्रता मापदंड / Eligibility Criteria</span>
            </h2>

            <div className="space-y-3">
              {Object.entries(scheme.eligibility_criteria || {}).map(([key, val], idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <div className="text-xs sm:text-sm">
                    <span className="font-bold text-slate-800 capitalize">{key.replace(/_/g, ' ')}: </span>
                    <span className="text-slate-600 font-medium">
                      {Array.isArray(val) ? val.join(', ') : String(val)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Application Process */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#FF671F]" />
              <span>आवेदन कैसे करें / Step-by-Step Application</span>
            </h2>
            <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 text-sm text-slate-800 leading-relaxed font-medium">
              {scheme.application_process}
            </div>
          </div>
        </div>

        {/* Sidebar Information (1 col) */}
        <div className="space-y-6">
          {/* Required Documents Checklist */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>आवश्यक दस्तावेज़</span>
            </h3>

            <ul className="space-y-2.5">
              {(scheme.required_documents || []).map((doc, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Official Portal Verification Citation Card */}
          <div className="bg-white rounded-3xl p-6 border-2 border-emerald-200 bg-gradient-to-b from-white to-emerald-50/30 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>सत्यापित सरकारी स्रोत</span>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              यह जानकारी भारत सरकार के आधिकारिक पोर्टल से प्रत्यक्ष सत्यापित है।
            </p>
            <a
              href={scheme.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <span>आधिकारिक पोर्टल खोलें</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
