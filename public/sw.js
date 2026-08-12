const CACHE = 'nabdh-shell-v4';
const SHELL = ['/', '/index.html', '/style.css', '/glass.css', '/app.js', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.all(
    SHELL.map(url => fetch(url, { cache: 'reload' }).then(response => cache.put(url, response)))
  )));
  self.skipWaiting();
});
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim())
));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Measurement endpoints must always use the live network, never cached data.
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Network-first ensures deployed design updates appear immediately; cache is offline fallback only.
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/index.html'))));
});
