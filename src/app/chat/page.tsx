'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ShieldCheck, ExternalLink, RefreshCw, AlertCircle, Volume2, User, HelpCircle } from 'lucide-react';
import { VoiceRecordButton } from '@/components/VoiceRecordButton';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useLanguage } from '@/hooks/useLanguage';
import { Citation } from '@/lib/schemas';
import { maskAadhaar } from '@/lib/piiMasker';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  citations?: Citation[];
  grounded?: boolean;
  isRedirect?: boolean;
  timestamp: string;
}

export default function ChatPage() {
  const { currentLanguage, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    isRecording,
    audioLevel,
    durationSeconds,
    startRecording,
    stopRecording,
    audioBase64,
  } = useAudioRecorder();

  // Initialize welcoming message based on language
  useEffect(() => {
    const initialGreeting: Message = {
      id: 'msg-initial',
      role: 'assistant',
      content: currentLanguage.sampleGreeting + ' किसी भी कल्याणकारी योजना, पेंशन, स्वास्थ्य बीमा या सब्सिडी के बारे में बेझिझक पूछें।',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([initialGreeting]);
  }, [currentLanguage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSendMessage = async (text?: string, audioPayload?: string) => {
    const query = text || inputText;
    if (!query.trim() && !audioPayload) return;

    const userMessageText = query.trim() || '🎤 ध्वनि संदेश / Voice query';
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: maskAadhaar(userMessageText),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/v1/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          audioBase64: audioPayload,
          language: currentLanguage.code,
          sessionId: 'citizen-session-web',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve verified response from server.');
      }

      const data = await response.json();

      const assistantMsg: Message = {
        id: `assist-${Date.now()}`,
        role: 'assistant',
        content: maskAadhaar(data.response),
        citations: data.citations || [],
        grounded: data.grounded,
        isRedirect: data.isRedirect,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'सॉफ़्टवेयर सर्वर से संपर्क नहीं हो पा रहा है। आप ऑफ़लाइन मोड में योजना सूची देख सकते हैं।',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceStop = async () => {
    const recordedBlob = await stopRecording();
    if (!recordedBlob) return;

    // Convert blob to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string)?.split(',')[1];
      if (base64) {
        handleSendMessage('', base64);
      }
    };
    reader.readAsDataURL(recordedBlob);
  };

  const quickPrompts = [
    { label: '🌾 PM-Kisan ₹6,000 लाभ', query: 'PM Kisan Yojana का ₹6000 का लाभ कैसे प्राप्त करें?' },
    { label: '🏥 आयुष्मान कार्ड ₹5 लाख', query: 'आयुष्मान भारत PM-JAY योजना में ₹5 लाख तक का मुफ्त इलाज कैसे मिलता है?' },
    { label: '🏠 पक्का मकान PMAY', query: 'प्रधानमंत्री आवास योजना ग्रामीण में घर बनाने के लिए कितना पैसा मिलता है?' },
    { label: '👵 अटल पेंशन योजना', query: 'अटल पेंशन योजना में ₹1,000 से ₹5,000 पेंशन कैसे मिलती है?' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Chat Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF671F] to-[#046A38] text-white flex items-center justify-center font-black shadow-sm">
            AI
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>जन एआई - आवाज़ सहायता</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Zero Hallucination
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              सत्यापित सरकारी योजनाओं पर आधारित सटीक जानकारी ({currentLanguage.nativeName})
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const initialGreeting: Message = {
              id: `msg-${Date.now()}`,
              role: 'assistant',
              content: currentLanguage.sampleGreeting,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages([initialGreeting]);
          }}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          title="Clear Conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-white/70 rounded-3xl border border-slate-200/80 p-4 sm:p-6 overflow-y-auto space-y-4 shadow-inner">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-slate-800 text-white'
                    : 'bg-gradient-to-tr from-[#FF671F] to-[#046A38] text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-3xl px-4 sm:px-5 py-3.5 shadow-xs ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-tr-xs'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                }`}
              >
                {/* Message Body */}
                <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium">
                  {msg.content}
                </div>

                {/* Assistant Audio Player & Source Badges */}
                {!isUser && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                    {/* Audio Playback Control */}
                    <AudioPlayer text={msg.content} audioUrl={msg.audioUrl} />

                    {/* Source Citations Badges */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          सत्यापित स्रोत / Official Verified Citations:
                        </span>

                        <div className="flex flex-wrap gap-2">
                          {msg.citations.map((c, idx) => (
                            <a
                              key={idx}
                              href={c.officialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF671F] text-xs font-semibold border border-orange-200 transition-colors shadow-2xs"
                            >
                              <span>{c.titleVernacular || c.title}</span>
                              <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-emerald-800 border border-emerald-200">
                                {c.financialBenefit.slice(0, 18)}...
                              </span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`text-[10px] mt-1 text-right ${
                    isUser ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-3 text-slate-500 text-sm italic py-2 px-4 bg-white/60 rounded-2xl border border-slate-100 w-fit">
            <span className="w-2 h-2 rounded-full bg-[#FF671F] animate-ping" />
            <span>सत्यापित डेटाबेस में खोज रहे हैं... (Retrieving verified schemes)</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(p.query)}
            disabled={isProcessing || isRecording}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-[#FF671F] transition-all shadow-2xs"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Dock: Pulsating Voice Button & Text Input */}
      <div className="bg-white rounded-3xl p-3 border border-slate-200/90 shadow-lg flex flex-col sm:flex-row items-center gap-3">
        {/* Pulsating Voice Record Button */}
        <div className="shrink-0">
          <VoiceRecordButton
            size="md"
            isRecording={isRecording}
            isProcessing={isProcessing}
            audioLevel={audioLevel}
            durationSeconds={durationSeconds}
            onStart={startRecording}
            onStop={handleVoiceStop}
          />
        </div>

        {/* Text Input & Submit */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex-1 w-full flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-[#FF671F] focus-within:bg-white transition-all"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing || isRecording}
            placeholder="अपनी भाषा में लिखें या माइक दबाकर बोलें..."
            className="flex-1 bg-transparent text-slate-800 text-sm sm:text-base outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing || isRecording}
            className="p-2 rounded-xl bg-[#FF671F] hover:bg-orange-600 disabled:opacity-40 text-white transition-colors"
            aria-label="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
