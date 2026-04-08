// ════════════════════════════════════════════════════════
// NJ Dispatch — Service Worker (iOS-safe version)
// ════════════════════════════════════════════════════════
const BUILD_VERSION = '1775622004';
const CACHE_STATIC  = 'nj-static-'  + BUILD_VERSION;
const CACHE_RUNTIME = 'nj-runtime-' + BUILD_VERSION;
const PRECACHE = ['/app.css', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // ไม่ fail ถ้า precache ไม่ได้
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith('nj-') && k !== CACHE_STATIC && k !== CACHE_RUNTIME)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;
  if (url.protocol === 'wss:' || url.protocol === 'ws:') return;

  // app.js → Network first (ไม่ใช้ AbortController — iOS compat)
  if (url.pathname.endsWith('/app.js')) {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) {
          caches.open(CACHE_RUNTIME).then(c => c.put(req, res.clone()));
        }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // CSS + HTML → Stale-while-revalidate
  if (req.destination === 'style' || req.destination === 'document') {
    e.respondWith(
      caches.open(CACHE_STATIC).then(cache =>
        cache.match(req).then(cached => {
          const fresh = fetch(req).then(res => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => cached);
          return cached || fresh;
        })
      )
    );
    return;
  }

  // Fonts / CDN → Cache first
  if (url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com' ||
      url.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(
      caches.open(CACHE_RUNTIME).then(cache =>
        cache.match(req).then(cached => {
          if (cached) return cached;
          return fetch(req).then(res => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          });
        })
      )
    );
  }
});
