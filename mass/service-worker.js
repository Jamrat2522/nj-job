/* MASSERGER Service Worker v6.48
   Cache-first for app shell · network-first for Supabase API
   ============================================================ */
const CACHE_VERSION = 'masserger-v6.48';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// v6.48: ใช้ index.html (Cloudflare default) — ไม่ใช่ index-bundle.html
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install — pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET
  if (req.method !== 'GET') return;

  // Skip cross-origin POST/preflight
  if (url.hostname.includes('supabase.co')) {
    // Realtime/REST = always network (never stale data)
    return;
  }

  // CDN libs (cdn.jsdelivr.net, unpkg.com, cdnjs.cloudflare.com) — cache-first
  if (url.hostname.includes('jsdelivr') ||
      url.hostname.includes('unpkg') ||
      url.hostname.includes('cdnjs') ||
      url.hostname.includes('fonts.googleapis') ||
      url.hostname.includes('fonts.gstatic')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req).then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  // App shell — cache-first with background update
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const fetchPromise = fetch(req).then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
  }
});

// Listen for skip-waiting message
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
