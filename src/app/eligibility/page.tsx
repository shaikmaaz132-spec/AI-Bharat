'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  IndianRupee,
  RefreshCw,
  ExternalLink,
  User,
  Briefcase,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EligibleSchemeItem, EligibilityEvaluateResponse } from '@/lib/schemas';
import { saveEligibilityToIdb } from '@/lib/idb';
import { useLanguage } from '@/hooks/useLanguage';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh'
];

export default function EligibilityWizardPage() {
  const { currentLanguage, t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<EligibilityEvaluateResponse | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    age: 38,
    gender: 'female' as 'male' | 'female' | 'other',
    state: 'Uttar Pradesh',
    district: '',
    occupation: 'farmer',
    annualIncome: 85000,
    landHoldingAcres: 1.5,
    socialCategory: 'obc' as 'general' | 'obc' | 'sc' | 'st' | 'ews',
    housingType: 'kutcha' as 'homeless' | 'kutcha' | 'semi_pucca' | 'pucca',
    documentsHeld: ['Aadhaar Card', 'Ration Card', 'Bank Passbook'],
  });

  const toggleDocument = (doc: string) => {
    setFormData((prev) => ({
      ...prev,
      documentsHeld: prev.documentsHeld.includes(doc)
        ? prev.documentsHeld.filter((d) => d !== doc)
        : [...prev.documentsHeld, doc],
    }));
  };

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/v1/eligibility/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sessionId: 'citizen-web-session',
        }),
      });

      if (!res.ok) {
        throw new Error('Evaluation request failed');
      }

      const result: EligibilityEvaluateResponse = await res.json();
      setEvaluationResult(result);

      // Save to IndexedDB offline history
      await saveEligibilityToIdb(result);

      // Trigger festive celebration confetti
      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF671F', '#FFFFFF', '#046A38', '#FFD700'],
        });
      }
    } catch (err: any) {
      console.error('Eligibility evaluation error:', err);
      alert('पात्रता जांच में त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetWizard = () => {
    setEvaluationResult(null);
    setCurrentStep(1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Wizard Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#FF671F] text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Eligibility Wizard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('eligTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mt-1">
          {t('eligSub')}
        </p>
      </div>

      {evaluationResult ? (
        /* ================= RESULTS SCREEN ================= */
        <div className="space-y-8 animate-fadeIn">
          {/* Total Financial Benefit Card */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950 text-white shadow-xl border border-emerald-500/30 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-400">
                  🎉 आपकी कुल संभावित वार्षिक सरकारी सहायता:
                </span>
                <button
                  onClick={resetWizard}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>दोबारा जांचें</span>
                </button>
              </div>

              <div className="text-3xl sm:text-5xl font-black text-white tracking-tight flex items-center gap-2">
                <span className="text-emerald-400">₹</span>
                <span>{evaluationResult.totalAnnualFinancialBenefit.toLocaleString('en-IN')}</span>
                <span className="text-xs sm:text-base font-medium text-slate-400">/ प्रति वर्ष</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 mt-3">
                आप <strong>{evaluationResult.eligible.length} योजनाओं</strong> के लिए पूर्ण पात्र हैं और{' '}
                <strong>{evaluationResult.partiallyEligible.length} योजनाओं</strong> के लिए आंशिक पात्र हैं।
              </p>
            </div>
          </div>

          {/* Section 1: Eligible Schemes (Green) */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>पूर्ण रूप से पात्र योजनाएं ({evaluationResult.eligible.length})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evaluationResult.eligible.map((item) => (
                <div
                  key={item.slug}
                  className="bg-white rounded-3xl p-5 border-2 border-emerald-200/90 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        100% Eligible
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        ₹{item.financialBenefitAmount.toLocaleString('en-IN')} लाभ
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{item.titleVernacular || item.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.description}</p>

                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                      <span className="text-[11px] font-bold text-emerald-900 block mb-1">
                        पात्रता के कारण / Match Criteria:
                      </span>
                      <ul className="text-xs text-emerald-800 space-y-1">
                        {item.reasons.map((r, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/schemes/${item.slug}`}
                      className="text-xs font-bold text-[#FF671F] hover:underline"
                    >
                      पूर्ण विवरण देखें →
                    </Link>
                    <a
                      href={item.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
                    >
                      <span>आवेदन करें</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Partially Eligible Schemes (Yellow/Amber) */}
          {evaluationResult.partiallyEligible.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>आंशिक पात्र योजनाएं ({evaluationResult.partiallyEligible.length})</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evaluationResult.partiallyEligible.map((item) => (
                  <div
                    key={item.slug}
                    className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          समीक्षा आवश्यक / Review Needed
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          ₹{item.financialBenefitAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base">{item.titleVernacular || item.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.description}</p>

                      {item.missingCriteria && (
                        <div className="mt-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                          <span className="text-[11px] font-bold text-amber-900 block mb-1">
                            अनुपलब्ध शर्त या दस्तावेज़:
                          </span>
                          <ul className="text-xs text-amber-800 space-y-1">
                            {item.missingCriteria.map((m, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                                <span>{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href={`/schemes/${item.slug}`}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900"
                      >
                        शर्तें जांचें →
                      </Link>
                      <a
                        href={item.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200"
                      >
                        <span>आधिकारिक पोर्टल</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= STEP-BY-STEP WIZARD FORM ================= */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md">
          {/* Step Progress Indicators */}
          <div className="flex items-center justify-between mb-8 max-w-xs mx-auto">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                    currentStep === step
                      ? 'bg-[#FF671F] text-white ring-4 ring-orange-200 shadow-md'
                      : currentStep > step
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-14 sm:w-20 h-1 mx-2 rounded-full ${
                      currentStep > step ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* STEP 1: Personal Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                <User className="w-5 h-5 text-[#FF671F]" />
                <span>चरण 1: व्यक्तिगत विवरण (Demographics)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Age Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    आपकी आयु (वर्ष) / Age:
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    min="1"
                    max="110"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-[#FF671F] outline-none"
                  />
                </div>

                {/* State Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    निवास का राज्य / State:
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-[#FF671F] outline-none bg-white"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gender Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">लिंग / Gender:</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['female', 'male', 'other'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g })}
                      className={`py-3 px-4 rounded-2xl border-2 text-xs sm:text-sm font-bold capitalize transition-all ${
                        formData.gender === g
                          ? 'border-[#FF671F] bg-orange-50 text-[#FF671F] shadow-sm'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {g === 'female' ? '👩 महिला / Female' : g === 'male' ? '👨 पुरुष / Male' : 'अन्य / Other'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 rounded-xl bg-[#FF671F] text-white font-bold text-sm flex items-center gap-2 hover:bg-orange-600 shadow-md"
                >
                  <span>अगला चरण</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Occupation, Land & Income */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                <Briefcase className="w-5 h-5 text-[#FF671F]" />
                <span>चरण 2: आजीविका, ज़मीन और आय (Income & Land)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Occupation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    मुख्य व्यवसाय / Occupation:
                  </label>
                  <select
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-[#FF671F] outline-none bg-white"
                  >
                    <option value="farmer">किसान / कृषक (Farmer / Cultivator)</option>
                    <option value="laborer">दैनिक मजदूर (Daily Wage Laborer)</option>
                    <option value="artisan">कारीगर / शिल्पकार (Artisan / Vishwakarma)</option>
                    <option value="homemaker">गृहणी (Homemaker)</option>
                    <option value="self_employed">स्वरोजगार / छोटा व्यापारी (Self Employed)</option>
                    <option value="unemployed">बेरोजगार (Unemployed)</option>
                  </select>
                </div>

                {/* Land Holding */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    कृषि भूमि (एकड़) / Land Holding (Acres):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.landHoldingAcres}
                    onChange={(e) => setFormData({ ...formData, landHoldingAcres: Number(e.target.value) })}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-[#FF671F] outline-none"
                  />
                </div>

                {/* Annual Income */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    वार्षिक पारिवारिक आय (₹) / Annual Family Income:
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={formData.annualIncome}
                    onChange={(e) => setFormData({ ...formData, annualIncome: Number(e.target.value) })}
                    min="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-[#FF671F] outline-none"
                  />
                </div>

                {/* Housing Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    वर्तमान आवास की स्थिति / Housing Status:
                  </label>
                  <select
                    value={formData.housingType}
                    onChange={(e) => setFormData({ ...formData, housingType: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-[#FF671F] outline-none bg-white"
                  >
                    <option value="kutcha">कच्चा मकान / जर्जर घर (Kutcha House)</option>
                    <option value="homeless">बेघर / किराए का कमरा (Homeless)</option>
                    <option value="semi_pucca">अर्ध-पक्का मकान (Semi-Pucca)</option>
                    <option value="pucca">पक्का मकान (Pucca House)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm flex items-center gap-2 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>पिछला चरण</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 rounded-xl bg-[#FF671F] text-white font-bold text-sm flex items-center gap-2 hover:bg-orange-600 shadow-md"
                >
                  <span>अगला चरण</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Social Category & Documents Held */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                <FileText className="w-5 h-5 text-[#FF671F]" />
                <span>चरण 3: सामाजिक वर्ग और उपलब्ध दस्तावेज़ (Documents Held)</span>
              </h2>

              {/* Social Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">सामाजिक वर्ग / Category:</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {(['general', 'obc', 'sc', 'st', 'ews'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, socialCategory: cat })}
                      className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold uppercase transition-all ${
                        formData.socialCategory === cat
                          ? 'border-[#FF671F] bg-orange-50 text-[#FF671F]'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Documents Held Selection Pills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  आपके पास उपलब्ध सरकारी दस्तावेज़ (Documents you currently hold):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    'Aadhaar Card',
                    'Ration Card',
                    'Land Passbook (खतौनी/पट्टा)',
                    'Bank Passbook',
                    'MGNREGA Job Card',
                    'Caste Certificate',
                    'Income Certificate',
                  ].map((doc) => {
                    const isChecked = formData.documentsHeld.includes(doc);
                    return (
                      <button
                        key={doc}
                        type="button"
                        onClick={() => toggleDocument(doc)}
                        className={`p-3 rounded-xl border-2 text-xs sm:text-sm font-semibold flex items-center justify-between text-left transition-all ${
                          isChecked
                            ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{doc}</span>
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm flex items-center gap-2 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>पिछला चरण</span>
                </button>
                <button
                  type="button"
                  onClick={handleEvaluate}
                  disabled={isEvaluating}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF671F] via-[#E0530C] to-[#046A38] text-white font-extrabold text-sm sm:text-base flex items-center gap-2 shadow-lg hover:opacity-95 disabled:opacity-50"
                >
                  {isEvaluating ? (
                    <span>AI पात्रता गणना जारी है...</span>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>पात्रता परिणाम देखें / Evaluate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
