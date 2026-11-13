'use client';

import React from 'react';
import { WifiOff, Database, RefreshCw } from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';
import { useLanguage } from '@/hooks/useLanguage';

export function OfflineBanner() {
  const { isOffline } = useOffline();
  const { t } = useLanguage();

  if (!isOffline) return null;

  return (
    <div className="offline-banner sticky top-0 z-40 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between transition-all">
      <div className="flex items-center gap-3 max-w-5xl mx-auto w-full">
        <div className="p-1.5 bg-white/20 rounded-full shrink-0 animate-pulse">
          <WifiOff className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-xs sm:text-sm">
          <span className="font-bold mr-2">
            ऑफ़लाइन मोड / Offline Mode:
          </span>
          <span className="opacity-95">{t('offlineBanner')}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs bg-black/20 px-2.5 py-1 rounded-full">
          <Database className="w-3.5 h-3.5" />
          <span>IndexedDB Active</span>
        </div>
      </div>
    </div>
  );
}
