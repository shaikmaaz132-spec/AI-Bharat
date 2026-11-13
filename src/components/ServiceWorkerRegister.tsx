'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[Jan AI PWA] ServiceWorker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[Jan AI PWA] ServiceWorker notice:', err);
        });
    }
  }, []);

  return null;
}

