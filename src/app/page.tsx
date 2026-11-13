'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mic,
  Search,
  CheckCircle,
  FileText,
  Camera,
  ShieldCheck,
  Globe,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
} from 'lucide-react';
import { VoiceRecordButton } from '@/components/VoiceRecordButton';
import { useLanguage } from '@/hooks/useLanguage';

export default function HomePage() {
  const router = useRouter();
  const { currentLanguage, setIsModalOpen, t } = useLanguage();

  const handleMicClick = () => {
    router.push('/chat');
  };

  const quickFeatures = [
    {
      title: t('featChatTitle'),
      desc: t('featChatDesc'),
      icon: Mic,
      href: '/chat',
      color: 'from-orange-500 to-amber-600',
    },
    {
      title: t('featEligTitle'),
      desc: t('featEligDesc'),
      icon: CheckCircle,
      href: '/eligibility',
      color: 'from-emerald-600 to-teal-700',
    },
    {
      title: t('featSchemesTitle'),
      desc: t('featSchemesDesc'),
      icon: Search,
      href: '/schemes',
      color: 'from-blue-600 to-indigo-700',
    },
    {
      title: t('featGrievTitle'),
      desc: t('featGrievDesc'),
      icon: FileText,
      href: '/grievance',
      color: 'from-purple-600 to-rose-700',
    },
  ];

  const featuredSchemes = [
    {
      title: t('pmKisanTitle'),
      benefit: t('pmKisanBenefit'),
      desc: t('pmKisanDesc'),
      href: '/schemes/pm-kisan',
    },
    {
      title: t('ayushmanTitle'),
      benefit: t('ayushmanBenefit'),
      desc: t('ayushmanDesc'),
      href: '/schemes/pm-jay',
    },
    {
      title: t('pmayTitle'),
      benefit: t('pmayBenefit'),
      desc: t('pmayDesc'),
      href: '/schemes/pm-awas-gramin',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-12">
      {/* Hero Banner with Integrated Voice Trigger */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#046A38] text-white p-6 sm:p-12 shadow-2xl overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-300 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-sm border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('heroBadge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            {t('heroTitle1')} <br />
            <span className="bg-gradient-to-r from-[#FF9933] via-white to-[#00C853] bg-clip-text text-transparent">
              {t('heroTitle2')}
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 mt-4 leading-relaxed font-normal max-w-2xl">
            {t('heroDesc')}
          </p>

          {/* Quick Voice Trigger Banner */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/15 max-w-xl">
            <div className="shrink-0">
              <VoiceRecordButton
                size="md"
                isRecording={false}
                onStart={handleMicClick}
                onStop={() => {}}
              />
            </div>
            <div className="text-center sm:text-left">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                {t('quickVoiceHeading')}
              </span>
              <p className="text-sm font-semibold text-white">
                {t('quickVoiceSub')}
              </p>
            </div>
          </div>
        </div>

        {/* Decorative Tricolor Gradient Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#FF671F]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#046A38]/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Pillars of Jan AI */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {t('servicesHeading')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('servicesSub')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Link
                key={idx}
                href={feat.href}
                className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feat.color} text-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-[#FF671F] transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#FF671F]">
                  <span>{currentLanguage.code === 'en' ? 'Get Started' : 'शुरू करें'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Featured Central & State Welfare Schemes */}
      <div className="bg-gradient-to-b from-orange-50/50 to-white rounded-3xl p-6 sm:p-8 border border-orange-200/60 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#FF671F] uppercase tracking-wider">
              {currentLanguage.code === 'en' ? 'Verified Schemes' : 'सत्यापित योजनाएं'}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              {t('featuredSchemesHeading')}
            </h2>
          </div>

          <Link
            href="/schemes"
            className="text-xs sm:text-sm font-bold text-[#FF671F] hover:text-orange-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>{currentLanguage.code === 'en' ? 'View all schemes' : 'सभी 12+ योजनाएं देखें'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredSchemes.map((s, idx) => (
            <Link
              key={idx}
              href={s.href}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block mb-2">
                  {s.benefit}
                </span>
                <h3 className="font-bold text-slate-900 text-base">{s.title}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{s.desc}</p>
              </div>
              <span className="text-xs font-bold text-[#FF671F] mt-4 block">{t('viewDetails')} →</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Trust & Acceptance Criteria Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <Globe className="w-6 h-6 text-[#FF671F] mx-auto mb-1.5" />
          <h4 className="font-extrabold text-slate-900 text-sm">
            {currentLanguage.code === 'en' ? '13+ Languages' : '13+ भाषाएं'}
          </h4>
          <p className="text-[11px] text-slate-500">
            {currentLanguage.code === 'en' ? 'Hindi, English, Telugu, Tamil, Bengali' : 'हिंदी, अंग्रेजी, तेलुगु, तमिल, बांग्ला'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
          <h4 className="font-extrabold text-slate-900 text-sm">Zero Hallucination</h4>
          <p className="text-[11px] text-slate-500">
            {currentLanguage.code === 'en' ? '100% Grounded in Official Data' : '100% आधिकारिक डेटा से सत्यापित'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <Cpu className="w-6 h-6 text-blue-600 mx-auto mb-1.5" />
          <h4 className="font-extrabold text-slate-900 text-sm">
            {currentLanguage.code === 'en' ? 'Aadhaar Privacy' : 'आधार गोपनीयता'}
          </h4>
          <p className="text-[11px] text-slate-500">
            {currentLanguage.code === 'en' ? 'Auto XXXX-XXXX-1234 Masking' : 'स्वतः XXXX-XXXX-1234 मास्किंग'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <Layers className="w-6 h-6 text-purple-600 mx-auto mb-1.5" />
          <h4 className="font-extrabold text-slate-900 text-sm">
            {currentLanguage.code === 'en' ? 'Offline PWA' : 'ऑफलाइन PWA'}
          </h4>
          <p className="text-[11px] text-slate-500">
            {currentLanguage.code === 'en' ? 'IndexedDB Local Storage' : 'IndexedDB स्थानीय कैशिंग'}
          </p>
        </div>
      </div>
    </div>
  );
}
