'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, CheckCircle2, ArrowRight, ShieldCheck, IndianRupee } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { SchemeRecord } from '@/lib/supabase';

interface SchemeCardProps {
  scheme: SchemeRecord;
  showVernacularOnly?: boolean;
}

export function SchemeCard({ scheme, showVernacularOnly = false }: SchemeCardProps) {
  const { currentLanguage } = useLanguage();

  const langCode = currentLanguage.code;
  const vernacularTitle = scheme.title_translations?.[langCode] || scheme.title_translations?.['hi'];
  const displayTitle = showVernacularOnly && vernacularTitle ? vernacularTitle : scheme.title;

  const vernacularDesc = scheme.description_translations?.[langCode] || scheme.description_translations?.['hi'];
  const displayDesc = showVernacularOnly && vernacularDesc ? vernacularDesc : scheme.description;

  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    agriculture: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    healthcare: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    housing: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    employment: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
    women_welfare: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    social_security: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
    education: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  };

  const style = categoryColors[scheme.category] || {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-slate-200',
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      <div className="p-5 sm:p-6">
        {/* Badges Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span
            className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}
          >
            {scheme.category.replace('_', ' ')}
          </span>

          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {scheme.level === 'central' ? '🏛️ केंद्र सरकार / Central' : `📍 ${scheme.state}`}
          </span>
        </div>

        {/* Title */}
        <Link href={`/schemes/${scheme.slug}`}>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-[#FF671F] transition-colors leading-snug">
            {displayTitle}
          </h3>
          {vernacularTitle && vernacularTitle !== displayTitle && (
            <p className="text-sm font-semibold text-slate-600 mt-1">{vernacularTitle}</p>
          )}
        </Link>

        {/* Financial Benefit Callout */}
        <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-emerald-50 border border-orange-200/60">
          <span className="text-xs font-semibold text-orange-800 uppercase tracking-wider block mb-0.5">
            वित्तीय लाभ / Direct Benefit
          </span>
          <p className="text-base font-extrabold text-slate-900 flex items-start gap-1">
            <span className="text-emerald-700 font-black">₹</span>
            <span>{scheme.financial_benefit}</span>
          </p>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 mt-3 line-clamp-3 leading-relaxed">
          {displayDesc}
        </p>

        {/* Required Documents Summary */}
        {scheme.required_documents && scheme.required_documents.length > 0 && (
          <div className="mt-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              आवश्यक दस्तावेज़ / Required Documents:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {scheme.required_documents.slice(0, 3).map((doc, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate max-w-[150px]">{doc}</span>
                </span>
              ))}
              {scheme.required_documents.length > 3 && (
                <span className="text-[11px] font-medium px-1.5 py-0.5 text-slate-500">
                  +{scheme.required_documents.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
        <a
          href={scheme.official_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-slate-600 hover:text-[#FF671F] flex items-center gap-1 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>आधिकारिक पोर्टल / Official Portal</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <Link
          href={`/schemes/${scheme.slug}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#FF671F] hover:text-orange-700 transition-colors"
        >
          <span>विवरण देखें</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
