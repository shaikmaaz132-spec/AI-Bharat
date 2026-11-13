/**
 * Custom Service Worker for AI for Bharat (जन एआई)
 * Offline hardening: Intercepts network requests and serves cached content when offline.
 */

const CACHE_NAME = 'ai-for-bharat-v1';
const STATIC_ASSETS = [
  '/',
  '/chat',
  '/schemes',
  '/eligibility',
  '/grievance',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline application shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore chrome-extension or non-http requests
  if (!url.protocol.startsWith('http')) return;

  // Stale-while-revalidate for API schemes endpoint
  if (url.pathname.startsWith('/api/v1/schemes')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          console.log('[ServiceWorker] Serving schemes from cache:', url.pathname);
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) return cachedResponse;
          throw err;
        }
      })
    );
    return;
  }

  // Network-first with cache fallback for page navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedMatch = await cache.match(event.request);
        if (cachedMatch) return cachedMatch;
        return cache.match('/');
      })
    );
    return;
  }

  // Cache-first for images, fonts and static scripts
  if (
    url.pathname.includes('/_next/static/') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default network fetch with error resilience
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
