'use client';

import React from 'react';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface VoiceRecordButtonProps {
  isRecording: boolean;
  isProcessing?: boolean;
  audioLevel?: number; // 0 to 1
  durationSeconds?: number;
  onStart: () => void;
  onStop: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function VoiceRecordButton({
  isRecording,
  isProcessing = false,
  audioLevel = 0,
  durationSeconds = 0,
  onStart,
  onStop,
  className = '',
  size = 'lg',
}: VoiceRecordButtonProps) {
  const { t } = useLanguage();

  const handlePress = () => {
    // Tactile haptic feedback on supported touch devices
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(40);
    }

    if (isRecording) {
      onStop();
    } else if (!isProcessing) {
      onStart();
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const sizeClasses = {
    sm: 'w-14 h-14 text-sm',
    md: 'w-20 h-20 text-base',
    lg: 'w-24 h-24 sm:w-28 sm:h-28 text-lg',
  }[size];

  // Calculate dynamic scale for the pulsating sound wave ring
  const dynamicScale = 1 + audioLevel * 0.45;

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Radiating Ripple Rings during active recording */}
        {isRecording && (
          <>
            <div
              className="absolute rounded-full bg-red-500 opacity-25 animate-ping pointer-events-none"
              style={{
                width: size === 'lg' ? '140px' : '90px',
                height: size === 'lg' ? '140px' : '90px',
              }}
            />
            <div
              className="absolute rounded-full bg-red-400 opacity-20 pointer-events-none transition-transform duration-75"
              style={{
                width: size === 'lg' ? '160px' : '100px',
                height: size === 'lg' ? '160px' : '100px',
                transform: `scale(${dynamicScale})`,
              }}
            />
          </>
        )}

        {/* Tactile Large Interactive Button */}
        <button
          type="button"
          onClick={handlePress}
          disabled={isProcessing}
          aria-label={isRecording ? 'Stop Recording' : 'Start Voice Recording'}
          className={`
            relative z-10 flex flex-col items-center justify-center rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-4
            ${sizeClasses}
            ${
              isRecording
                ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-red-500/50 ring-red-300 ring-4'
                : isProcessing
                ? 'bg-amber-500 text-white cursor-wait opacity-90'
                : 'bg-gradient-to-tr from-[#FF671F] via-[#E0530C] to-[#046A38] text-white shadow-orange-500/30 hover:scale-105 ring-orange-200'
            }
          `}
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : isRecording ? (
            <div className="flex flex-col items-center">
              <Square className="w-8 h-8 fill-current text-white animate-pulse" />
              <span className="text-xs font-bold tracking-wider mt-1 text-white/90">
                {formatDuration(durationSeconds)}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Mic className="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-md" />
            </div>
          )}
        </button>
      </div>

      {/* Accessible Vernacular Label for Low-Literacy Citizens */}
      <div className="mt-3 text-center">
        {isRecording ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full font-semibold text-sm border border-red-200 animate-pulse">
            <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping inline-block" />
            <span>{t('recording')}</span>
          </div>
        ) : isProcessing ? (
          <span className="text-sm font-medium text-amber-700 animate-pulse">
            प्रक्रिया जारी है... / Processing...
          </span>
        ) : (
          <span className="font-semibold text-slate-800 text-base sm:text-lg flex items-center gap-1.5 bg-white/80 backdrop-blur px-3 py-1 rounded-full shadow-sm border border-slate-200">
            <Volume2 className="w-4 h-4 text-[#FF671F]" />
            {t('tapToSpeak')}
          </span>
        )}
      </div>
    </div>
  );
}
