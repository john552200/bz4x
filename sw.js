const CACHE_NAME = 'bz4x-pwa-v2';
const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];
const INDEX_URL = new URL('./index.html', self.location).href;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all([
      ...keys.filter(key => key.startsWith('bz4x-pwa-') && key !== CACHE_NAME)
        .map(key => caches.delete(key)),
      self.clients.claim()
    ]))
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).then(response => {
      if (response.ok) {
        return caches.open(CACHE_NAME).then(cache =>
          cache.put(request, response.clone()).then(() => response)
        );
      }
      return response;
    }).catch(error => caches.match(request).then(cached => {
      if (cached) return cached;
      if (request.mode === 'navigate') {
        return caches.match(INDEX_URL).then(index => {
          if (index) return index;
          throw error;
        });
      }
      throw error;
    }))
  );
});
