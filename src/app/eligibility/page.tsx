'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  User,
  Briefcase,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EligibilityEvaluateResponse } from '@/lib/schemas';
import { saveEligibilityToIdb } from '@/lib/idb';
import { useLanguage } from '@/hooks/useLanguage';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

// [English, Hindi]. Hindi is shown for Hindi/Bhojpuri; every other language shows English.
const TXT: Record<string, [string, string]> = {
  wizardBadge: ['AI Eligibility Wizard', 'AI पात्रता विज़ार्ड'],
  totalLabel: ['🎉 Your total possible annual government benefit:', '🎉 आपकी कुल संभावित वार्षिक सरकारी सहायता:'],
  recheck: ['Check again', 'दोबारा जांचें'],
  perYear: ['/ per year', '/ प्रति वर्ष'],
  fullyEligible: ['Fully eligible schemes', 'पूर्ण रूप से पात्र योजनाएं'],
  partiallyEligible: ['Partially eligible schemes', 'आंशिक पात्र योजनाएं'],
  eligibleBadge: ['100% Eligible', '100% पात्र'],
  benefitWord: ['benefit', 'लाभ'],
  matchCriteria: ['Why you qualify:', 'पात्रता के कारण:'],
  viewFull: ['View full details →', 'पूर्ण विवरण देखें →'],
  applyNow: ['Apply now', 'आवेदन करें'],
  reviewNeeded: ['Review needed', 'समीक्षा आवश्यक'],
  missing: ['Missing condition or document:', 'अनुपलब्ध शर्त या दस्तावेज़:'],
  checkConditions: ['Check conditions →', 'शर्तें जांचें →'],
  officialPortal: ['Official portal', 'आधिकारिक पोर्टल'],
  step1: ['Step 1: Personal details', 'चरण 1: व्यक्तिगत विवरण'],
  step2: ['Step 2: Occupation, land & income', 'चरण 2: आजीविका, ज़मीन और आय'],
  step3: ['Step 3: Social category & documents held', 'चरण 3: सामाजिक वर्ग और उपलब्ध दस्तावेज़'],
  age: ['Your age (years):', 'आपकी आयु (वर्ष):'],
  state: ['State of residence:', 'निवास का राज्य:'],
  selectState: ['Select state', 'राज्य चुनें'],
  select: ['Select', 'चुनें'],
  gender: ['Gender:', 'लिंग:'],
  female: ['👩 Female', '👩 महिला'],
  male: ['👨 Male', '👨 पुरुष'],
  other: ['Other', 'अन्य'],
  next: ['Next step', 'अगला चरण'],
  back: ['Previous step', 'पिछला चरण'],
  occupation: ['Main occupation:', 'मुख्य व्यवसाय:'],
  land: ['Agricultural land (acres):', 'कृषि भूमि (एकड़):'],
  income: ['Annual family income (₹):', 'वार्षिक पारिवारिक आय (₹):'],
  housing: ['Current housing status:', 'वर्तमान आवास की स्थिति:'],
  category: ['Social category:', 'सामाजिक वर्ग:'],
  docsLabel: ['Government documents you currently hold:', 'आपके पास उपलब्ध सरकारी दस्तावेज़:'],
  evaluating: ['AI is calculating eligibility...', 'AI पात्रता गणना जारी है...'],
  evaluate: ['See eligibility results', 'पात्रता परिणाम देखें'],
  error: ['Eligibility check failed. Please try again.', 'पात्रता जांच में त्रुटि हुई। कृपया पुनः प्रयास करें।'],
};

// [value sent to the server, English label, Hindi label]
const OCCUPATIONS: [string, string, string][] = [
  ['farmer', 'Farmer / Cultivator', 'किसान / कृषक'],
  ['laborer', 'Daily Wage Laborer', 'दैनिक मजदूर'],
  ['artisan', 'Artisan / Vishwakarma', 'कारीगर / शिल्पकार'],
  ['homemaker', 'Homemaker', 'गृहणी'],
  ['self_employed', 'Self Employed / Small Trader', 'स्वरोजगार / छोटा व्यापारी'],
  ['unemployed', 'Unemployed', 'बेरोजगार'],
];

const HOUSING: [string, string, string][] = [
  ['kutcha', 'Kutcha House', 'कच्चा मकान / जर्जर घर'],
  ['homeless', 'Homeless / Rented Room', 'बेघर / किराए का कमरा'],
  ['semi_pucca', 'Semi-Pucca House', 'अर्ध-पक्का मकान'],
  ['pucca', 'Pucca House', 'पक्का मकान'],
];

const DOCS: [string, string, string][] = [
  ['Aadhaar Card', 'Aadhaar Card', 'आधार कार्ड'],
  ['Ration Card', 'Ration Card', 'राशन कार्ड'],
  ['Land Passbook (खतौनी/पट्टा)', 'Land Passbook', 'भूमि पासबुक (खतौनी/पट्टा)'],
  ['Bank Passbook', 'Bank Passbook', 'बैंक पासबुक'],
  ['MGNREGA Job Card', 'MGNREGA Job Card', 'मनरेगा जॉब कार्ड'],
  ['Caste Certificate', 'Caste Certificate', 'जाति प्रमाण पत्र'],
  ['Income Certificate', 'Income Certificate', 'आय प्रमाण पत्र'],
];

export default function EligibilityWizardPage() {
  const { currentLanguage, t } = useLanguage();
  const isHi = currentLanguage.code === 'hi' || currentLanguage.code === 'bho';
  const tx = (key: string) => TXT[key][isHi ? 1 : 0];
  const pick = (opt: [string, string, string]) => (isHi ? opt[2] : opt[1]);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<EligibilityEvaluateResponse | null>(null);

  // Every field starts empty
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    state: '',
    occupation: '',
    annualIncome: '',
    landHoldingAcres: '',
    socialCategory: '',
    housingType: '',
    documentsHeld: [] as string[],
  });

  const step1Valid = formData.age !== '' && formData.gender !== '' && formData.state !== '';
  const step2Valid =
    formData.occupation !== '' &&
    formData.landHoldingAcres !== '' &&
    formData.annualIncome !== '' &&
    formData.housingType !== '';
  const step3Valid = formData.socialCategory !== '';

  const toggleDocument = (doc: string) => {
    setFormData((prev) => ({
      ...prev,
      documentsHeld: prev.documentsHeld.includes(doc)
        ? prev.documentsHeld.filter((d) => d !== doc)
        : [...prev.documentsHeld, doc],
    }));
  };

  const handleEvaluate = async () => {
    if (!step1Valid || !step2Valid || !step3Valid) return;
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/v1/eligibility/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: Number(formData.age),
          gender: formData.gender,
          state: formData.state,
          district: '',
          occupation: formData.occupation,
          annualIncome: Number(formData.annualIncome),
          landHoldingAcres: Number(formData.landHoldingAcres),
          socialCategory: formData.socialCategory,
          housingType: formData.housingType,
          documentsHeld: formData.documentsHeld,
          sessionId: 'citizen-web-session',
        }),
      });

      if (!res.ok) {
        throw new Error('Evaluation request failed');
      }

      const result: EligibilityEvaluateResponse = await res.json();
      setEvaluationResult(result);

      await saveEligibilityToIdb(result);

      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF671F', '#FFFFFF', '#046A38', '#FFD700'],
        });
      }
    } catch (err) {
      console.error('Eligibility evaluation error:', err);
      alert(tx('error'));
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetWizard = () => {
    setEvaluationResult(null);
    setCurrentStep(1);
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-[#FF671F] outline-none bg-white';
  const nextBtnClass =
    'px-6 py-3 rounded-xl bg-[#FF671F] text-white font-bold text-sm flex items-center gap-2 hover:bg-orange-600 shadow-md disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Wizard Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#FF671F] text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{tx('wizardBadge')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('eligTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mt-1">{t('eligSub')}</p>
      </div>

      {evaluationResult ? (
        /* ================= RESULTS SCREEN ================= */
        <div className="space-y-8 animate-fadeIn">
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950 text-white shadow-xl border border-emerald-500/30 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 gap-2">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-400">
                  {tx('totalLabel')}
                </span>
                <button
                  onClick={resetWizard}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{tx('recheck')}</span>
                </button>
              </div>

              <div className="text-3xl sm:text-5xl font-black text-white tracking-tight flex items-center gap-2">
                <span className="text-emerald-400">₹</span>
                <span>{evaluationResult.totalAnnualFinancialBenefit.toLocaleString('en-IN')}</span>
                <span className="text-xs sm:text-base font-medium text-slate-400">{tx('perYear')}</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 mt-3">
                {isHi ? (
                  <>
                    आप <strong>{evaluationResult.eligible.length} योजनाओं</strong> के लिए पूर्ण पात्र हैं और{' '}
                    <strong>{evaluationResult.partiallyEligible.length} योजनाओं</strong> के लिए आंशिक पात्र हैं।
                  </>
                ) : (
                  <>
                    You are fully eligible for <strong>{evaluationResult.eligible.length} schemes</strong> and
                    partially eligible for <strong>{evaluationResult.partiallyEligible.length} schemes</strong>.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Fully eligible */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>
                {tx('fullyEligible')} ({evaluationResult.eligible.length})
              </span>
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
                        {tx('eligibleBadge')}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        ₹{item.financialBenefitAmount.toLocaleString('en-IN')} {tx('benefitWord')}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">
                      {isHi ? item.titleVernacular || item.title : item.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.description}</p>

                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                      <span className="text-[11px] font-bold text-emerald-900 block mb-1">
                        {tx('matchCriteria')}
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
                      {tx('viewFull')}
                    </Link>
                    <a
                      href={item.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
                    >
                      <span>{tx('applyNow')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Partially eligible */}
          {evaluationResult.partiallyEligible.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>
                  {tx('partiallyEligible')} ({evaluationResult.partiallyEligible.length})
                </span>
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
                          {tx('reviewNeeded')}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          ₹{item.financialBenefitAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base">
                        {isHi ? item.titleVernacular || item.title : item.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.description}</p>

                      {item.missingCriteria && (
                        <div className="mt-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                          <span className="text-[11px] font-bold text-amber-900 block mb-1">
                            {tx('missing')}
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
                        {tx('checkConditions')}
                      </Link>
                      <a
                        href={item.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200"
                      >
                        <span>{tx('officialPortal')}</span>
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
          {/* Step indicators */}
          <div className="flex items-center justify-between mb-8 max-w-xs mx-auto">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${currentStep === step
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
                    className={`w-14 sm:w-20 h-1 mx-2 rounded-full ${currentStep > step ? 'bg-emerald-600' : 'bg-slate-200'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                <User className="w-5 h-5 text-[#FF671F]" />
                <span>{tx('step1')}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{tx('age')}</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    min="1"
                    max="110"
                    autoComplete="off"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{tx('state')}</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">{tx('selectState')}</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">{tx('gender')}</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['female', 'male', 'other'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g })}
                      className={`py-3 px-4 rounded-2xl border-2 text-xs sm:text-sm font-bold transition-all ${formData.gender === g
                        ? 'border-[#FF671F] bg-orange-50 text-[#FF671F] shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      {tx(g)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!step1Valid}
                  className={nextBtnClass}
                >
                  <span>{tx('next')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                <Briefcase className="w-5 h-5 text-[#FF671F]" />
                <span>{tx('step2')}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{tx('occupation')}</label>
                  <select
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">{tx('select')}</option>
                    {OCCUPATIONS.map((o) => (
                      <option key={o[0]} value={o[0]}>
                        {pick(o)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{tx('land')}</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.landHoldingAcres}
                    onChange={(e) => setFormData({ ...formData, landHoldingAcres: e.target.value })}
                    min="0"
                    max="100"
                    autoComplete="off"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{tx('income')}</label>
                  <input
                    type="number"
                    step="5000"
                    value={formData.annualIncome}
                    onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
                    min="0"
                    autoComplete="off"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{tx('housing')}</label>
                  <select
                    value={formData.housingType}
                    onChange={(e) => setFormData({ ...formData, housingType: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">{tx('select')}</option>
                    {HOUSING.map((h) => (
                      <option key={h[0]} value={h[0]}>
                        {pick(h)}
                      </option>
                    ))}
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
                  <span>{tx('back')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={!step2Valid}
                  className={nextBtnClass}
                >
                  <span>{tx('next')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
                <FileText className="w-5 h-5 text-[#FF671F]" />
                <span>{tx('step3')}</span>
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">{tx('category')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {(['general', 'obc', 'sc', 'st', 'ews'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, socialCategory: cat })}
                      className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold uppercase transition-all ${formData.socialCategory === cat
                        ? 'border-[#FF671F] bg-orange-50 text-[#FF671F]'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">{tx('docsLabel')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DOCS.map((doc) => {
                    const isChecked = formData.documentsHeld.includes(doc[0]);
                    return (
                      <button
                        key={doc[0]}
                        type="button"
                        onClick={() => toggleDocument(doc[0])}
                        className={`p-3 rounded-xl border-2 text-xs sm:text-sm font-semibold flex items-center justify-between text-left transition-all ${isChecked
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-2xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        <span>{pick(doc)}</span>
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
                  <span>{tx('back')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleEvaluate}
                  disabled={isEvaluating || !step3Valid}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF671F] via-[#E0530C] to-[#046A38] text-white font-extrabold text-sm sm:text-base flex items-center gap-2 shadow-lg hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEvaluating ? (
                    <span>{tx('evaluating')}</span>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>{tx('evaluate')}</span>
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
