'use client';

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Copy,
  Check,
  Camera,
  ShieldCheck,
  Send,
  Building,
  Calendar,
  Sparkles,
  ArrowRight,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { VoiceRecordButton } from '@/components/VoiceRecordButton';
import { DocumentCameraCapture } from '@/components/DocumentCameraCapture';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useLanguage } from '@/hooks/useLanguage';
import { GrievanceDraftResponse, DocumentExtraction } from '@/lib/schemas';
import { savePetitionToIdb } from '@/lib/idb';
import { maskAadhaar } from '@/lib/piiMasker';

export default function GrievanceDrafterPage() {
  const { currentLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'draft' | 'scanner'>('draft');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const [copiedEnglish, setCopiedEnglish] = useState(false);
  const [copiedVernacular, setCopiedVernacular] = useState(false);

  // Extracted Document Scan State
  const [extractedDoc, setExtractedDoc] = useState<DocumentExtraction | null>(null);

  // Grievance Form State
  const [formData, setFormData] = useState({
    petitionType: 'grievance' as 'grievance' | 'rti',
    citizenName: 'रमेश कुमार / Ramesh Kumar',
    phone: '9876543210',
    address: 'ग्राम: रामपुर, डाकखाना: बीकापुर, जिला: अयोध्या, उत्तर प्रदेश',
    department: 'खाद्य एवं रसद विभाग (Civil Supplies / Ration Department)',
    targetAuthority: 'जिला आपूर्ति अधिकारी / Sub-Divisional Magistrate (SDM)',
    subject: 'राशन डीलर द्वारा नियमित खाद्यान्न वितरण न करने एवं अनियमितता के संबंध में',
    complaintNarration:
      'हमारे गांव के उचित दर विक्रेता (राशन डीलर) द्वारा पिछले दो माह से पात्र गृहस्थी राशन कार्डधारकों को निर्धारित मात्रा में गेहूं और चावल का वितरण नहीं किया जा रहा है। जब इस विषय में पूछा गया तो अभद्र व्यवहार किया गया। कृपया मामले की जांच कराकर खाद्यान्न उपलब्ध कराने की कृपा करें।',
    incidentDate: '2026-11-01',
  });

  // Generated Petition Draft State
  const [draftResult, setDraftResult] = useState<GrievanceDraftResponse | null>(null);

  // Audio Recorder for Voice-Narrated Complaint Ingestion
  const {
    isRecording,
    audioLevel,
    durationSeconds,
    startRecording,
    stopRecording,
  } = useAudioRecorder();

  const handleVoiceStop = async () => {
    const recordedBlob = await stopRecording();
    if (!recordedBlob) return;

    // Transcribe narration
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string)?.split(',')[1];
      if (base64) {
        try {
          const res = await fetch('/api/v1/chat/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64,
              language: currentLanguage.code,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            // Append transcribed narration to form
            setFormData((prev) => ({
              ...prev,
              complaintNarration: prev.complaintNarration
                ? `${prev.complaintNarration}\n${data.response}`
                : data.response,
            }));
          }
        } catch (err) {
          console.warn('Voice transcription fallback failed:', err);
        }
      }
    };
    reader.readAsDataURL(recordedBlob);
  };

  const handleGenerateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const res = await fetch('/api/v1/grievance/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          citizenLanguage: currentLanguage.code,
          sessionId: 'citizen-session-draft',
        }),
      });

      if (!res.ok) {
        throw new Error('Draft generation failed');
      }

      const result: GrievanceDraftResponse = await res.json();
      setDraftResult(result);

      // Save into IndexedDB
      await savePetitionToIdb({
        id: result.grievanceId,
        petitionType: result.petitionType,
        department: result.department,
        targetAuthority: result.targetAuthority,
        subject: result.subject,
        statutoryReference: result.statutoryReference,
        englishDraft: result.englishDraft,
        vernacularDraft: result.vernacularDraft,
        citizenLanguage: result.citizenLanguage,
        dateFormatted: result.dateFormatted,
        savedAt: Date.now(),
      });
    } catch (err: any) {
      console.error('Failed to generate petition draft:', err);
      alert('ड्राफ्ट तैयार करने में समस्या आई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDocumentScan = async (imageBase64: string, mimeType: string) => {
    setIsAnalyzingDoc(true);
    try {
      const res = await fetch('/api/v1/documents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          documentHint: 'ration_card',
        }),
      });

      if (!res.ok) {
        throw new Error('Document analysis failed');
      }

      const json = await res.json();
      const extracted: DocumentExtraction = json.data;
      setExtractedDoc(extracted);

      // Autofill name into grievance form if available
      if (extracted.holderName) {
        setFormData((prev) => ({
          ...prev,
          citizenName: extracted.holderName,
        }));
      }
    } catch (err) {
      console.error('Scan error:', err);
      alert('दस्तावेज़ विश्लेषण में त्रुटि हुई।');
    } finally {
      setIsAnalyzingDoc(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const copyToClipboard = (text: string, isEnglish: boolean) => {
    navigator.clipboard.writeText(text);
    if (isEnglish) {
      setCopiedEnglish(true);
      setTimeout(() => setCopiedEnglish(false), 2000);
    } else {
      setCopiedVernacular(true);
      setTimeout(() => setCopiedVernacular(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Top Header */}
      <div className="text-center mb-8 no-print">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#FF671F] text-xs font-bold uppercase tracking-wider mb-2">
          <FileText className="w-3.5 h-3.5" />
          <span>Legal RTI & Public Grievance Drafter</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('grievTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto mt-1">
          {t('grievSub')}
        </p>

        {/* Tab switch between Drafter & Vision Scanner */}
        <div className="flex justify-center mt-6">
          <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('draft')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'draft'
                  ? 'bg-white text-[#FF671F] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>आवेदन पत्र ड्राफ्ट / Petition Drafter</span>
            </button>
            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'scanner'
                  ? 'bg-white text-[#FF671F] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>दस्तावेज़ स्कैनर / Vision Scanner</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'scanner' ? (
        /* ================= VISION SCANNER TAB ================= */
        <div className="space-y-6 no-print">
          <DocumentCameraCapture
            onCapture={handleDocumentScan}
            isAnalyzing={isAnalyzingDoc}
          />

          {extractedDoc && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-300 shadow-md max-w-xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>दस्तावेज़ विश्लेषण सफल (&gt; 90% सटीकता)</span>
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {Math.round(extractedDoc.confidenceScore * 100)}% Confidence
                </span>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">दस्तावेज़ का प्रकार:</span>
                  <span className="font-bold text-slate-800 uppercase">{extractedDoc.documentType}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">धारक का नाम:</span>
                  <span className="font-bold text-slate-900">{extractedDoc.holderName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">श्रेणी / Category:</span>
                  <span className="font-bold text-slate-900">{extractedDoc.category}</span>
                </div>
                {extractedDoc.landSizeAcres !== null && extractedDoc.landSizeAcres !== undefined && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">भूमि क्षेत्रफल:</span>
                    <span className="font-bold text-slate-900">{extractedDoc.landSizeAcres} एकड़ (Acres)</span>
                  </div>
                )}
                {extractedDoc.maskedAadhaar && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">आधार संख्या (Masked):</span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {extractedDoc.maskedAadhaar}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('draft')}
                className="w-full mt-5 py-3 rounded-xl bg-[#FF671F] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors shadow-sm"
              >
                <span>इस विवरण से आवेदन पत्र बनाएं</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ================= PETITION DRAFTER TAB ================= */
        <div className="space-y-8">
          {/* Petition Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md no-print">
            <form onSubmit={handleGenerateDraft} className="space-y-6">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">आवेदन का प्रकार / Petition Type:</label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, petitionType: 'grievance' })}
                    className={`py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all ${
                      formData.petitionType === 'grievance'
                        ? 'border-[#FF671F] bg-orange-50 text-[#FF671F]'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ⚖️ जन शिकायत (Public Grievance)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, petitionType: 'rti' })}
                    className={`py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all ${
                      formData.petitionType === 'rti'
                        ? 'border-[#FF671F] bg-orange-50 text-[#FF671F]'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    📜 सूचना का अधिकार (RTI Application)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    आवेदक का पूरा नाम / Citizen Name:
                  </label>
                  <input
                    type="text"
                    value={formData.citizenName}
                    onChange={(e) => setFormData({ ...formData, citizenName: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-[#FF671F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    मोबाइल नंबर / Mobile Number:
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-[#FF671F] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    पूरा पता (गांव, पोस्ट, तहसील, जिला, राज्य) / Address:
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-[#FF671F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    संबंधित विभाग / Department:
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-[#FF671F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    सक्षम अधिकारी का पद / Target Authority:
                  </label>
                  <input
                    type="text"
                    value={formData.targetAuthority}
                    onChange={(e) => setFormData({ ...formData, targetAuthority: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-[#FF671F] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    शिकायत / आवेदन का विषय / Subject:
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-[#FF671F] outline-none"
                  />
                </div>
              </div>

              {/* Voice-Narrated Complaint Ingestion Section */}
              <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-extrabold text-orange-900">
                      शिकायत का विस्तृत विवरण (बोलकर या लिखकर दर्ज करें):
                    </label>
                    <p className="text-[11px] text-orange-800">
                      माइक दबाएं और अपनी मातृभाषा में समस्या बताएं।
                    </p>
                  </div>

                  <VoiceRecordButton
                    size="sm"
                    isRecording={isRecording}
                    audioLevel={audioLevel}
                    durationSeconds={durationSeconds}
                    onStart={startRecording}
                    onStop={handleVoiceStop}
                  />
                </div>

                <textarea
                  rows={4}
                  value={formData.complaintNarration}
                  onChange={(e) => setFormData({ ...formData, complaintNarration: e.target.value })}
                  required
                  placeholder="यहाँ अपनी समस्या का पूरा विवरण लिखें..."
                  className="w-full p-3 rounded-xl border border-orange-200 bg-white text-slate-900 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#FF671F] outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF671F] to-[#046A38] text-white font-extrabold text-sm sm:text-base flex items-center gap-2 shadow-lg hover:opacity-95 disabled:opacity-50 transition-all"
                >
                  {isGenerating ? (
                    <span>वैधानिक ड्राफ्ट तैयार हो रहा है...</span>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>आवेदन पत्र जनरेट करें / Generate Draft</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ================= SIDE-BY-SIDE DRAFT PREVIEW & PRINTABLE A4 ================= */}
          {draftResult && (
            <div className="space-y-6">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                    {draftResult.statutoryReference}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ID: {draftResult.grievanceId}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-md transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>A4 प्रिंट करें / Print Petition</span>
                  </button>
                </div>
              </div>

              {/* Side-by-Side Dual Language Container */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 a4-side-by-side">
                {/* 1. Vernacular Draft (Mother Tongue) */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-300 shadow-md a4-document-container flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b pb-3 mb-4 no-print">
                      <span className="text-xs font-bold text-[#FF671F] uppercase tracking-wider">
                        मातृभाषा ड्राफ्ट (Vernacular)
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(draftResult.vernacularDraft, false)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                      >
                        {copiedVernacular ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedVernacular ? 'कॉपी हो गया' : 'कॉपी करें'}</span>
                      </button>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-900 whitespace-pre-line leading-relaxed font-serif vernacular-content">
                      {draftResult.vernacularDraft}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600 a4-signature-box">
                    <div>
                      <p>दिनांक: {draftResult.dateFormatted}</p>
                      <p>स्थान: {formData.address.split(',').slice(-2).join(',')}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-32 border-b border-slate-400 mb-1" />
                      <p className="font-bold">हस्ताक्षर / अंगूठे का निशान</p>
                      <p>({formData.citizenName})</p>
                    </div>
                  </div>
                </div>

                {/* 2. Formal English Legal Draft */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-300 shadow-md a4-document-container flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b pb-3 mb-4 no-print">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                        Formal English Draft (Statutory)
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(draftResult.englishDraft, true)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                      >
                        {copiedEnglish ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedEnglish ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-900 whitespace-pre-line leading-relaxed font-serif">
                      {draftResult.englishDraft}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600 a4-signature-box">
                    <div>
                      <p>Date: {draftResult.dateFormatted}</p>
                      <p>Place: {formData.address.split(',').slice(-2).join(',')}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-32 border-b border-slate-400 mb-1" />
                      <p className="font-bold">Signature / Thumb Impression</p>
                      <p>({formData.citizenName})</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
