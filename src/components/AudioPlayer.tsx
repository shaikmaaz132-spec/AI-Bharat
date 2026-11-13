'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface AudioPlayerProps {
  text: string;
  audioUrl?: string;
  autoPlay?: boolean;
  className?: string;
}

export function AudioPlayer({ text, audioUrl, autoPlay = false, className = '' }: AudioPlayerProps) {
  const { currentLanguage } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setHasSpeechSupport(true);
    }
  }, []);

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const startPlayback = () => {
    stopPlayback();

    // Priority 1: Audio URL if available
    if (audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
      } else {
        audioRef.current.src = audioUrl;
      }
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        fallbackToSpeechSynthesis();
      };
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        fallbackToSpeechSynthesis();
      });
      return;
    }

    // Priority 2: Browser native SpeechSynthesis in vernacular
    fallbackToSpeechSynthesis();
  };

  const fallbackToSpeechSynthesis = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Clean markdown symbols from text before speaking
    const cleanText = text
      .replace(/[*_#`\[\]]/g, '')
      .replace(/https?:\/\/\S+/g, 'वेबसाइट लिंक')
      .slice(0, 1000); // Limit length for crisp audio response

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = currentLanguage.voiceCode;
    utterance.rate = playbackRate;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const cycleSpeed = () => {
    const speeds = [0.8, 1.0, 1.25];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);

    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
    if (isPlaying) {
      startPlayback();
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-orange-50/80 border border-orange-200/80 text-orange-900 ${className}`}
    >
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-[#FF671F] hover:bg-orange-600 text-white flex items-center justify-center shadow-xs transition-transform active:scale-90"
        aria-label={isPlaying ? 'Pause Speech' : 'Play Speech'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Pulsing Audio Waves Indicator */}
      {isPlaying ? (
        <div className="flex items-center gap-1 h-4 px-1">
          <span className="w-1 bg-[#FF671F] rounded-full animate-wave" style={{ animationDelay: '0ms' }} />
          <span className="w-1 bg-[#FF671F] rounded-full animate-wave" style={{ animationDelay: '150ms' }} />
          <span className="w-1 bg-[#FF671F] rounded-full animate-wave" style={{ animationDelay: '300ms' }} />
          <span className="w-1 bg-[#FF671F] rounded-full animate-wave" style={{ animationDelay: '450ms' }} />
        </div>
      ) : (
        <span className="text-xs font-semibold flex items-center gap-1 text-slate-700">
          <Volume2 className="w-3.5 h-3.5 text-[#FF671F]" />
          <span>आवाज़ में सुनें / Listen</span>
        </span>
      )}

      {/* Speed Selector Toggle */}
      <button
        type="button"
        onClick={cycleSpeed}
        className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white border border-orange-200 text-orange-800 hover:bg-orange-100/60 transition-colors"
        title="Change Speech Speed"
      >
        {playbackRate}x
      </button>
    </div>
  );
}
