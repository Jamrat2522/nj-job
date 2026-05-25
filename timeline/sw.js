/* TIMELINE NJ — Service Worker · Phase 2
   Features:
   - Versioned caches (auto cleanup of stale versions)
   - SW_UPDATED postMessage broadcast on activate
   - SKIP_WAITING message handler (instant update)
   - Cache-first shell · network-only Supabase · stale-while-revalidate fonts/CDN
   - Offline fallback for navigation
*/
const VERSION = 'v1.2.0-clean';
const SHELL_CACHE   = 'tm-shell-'   + VERSION;
const RUNTIME_CACHE = 'tm-runtime-' + VERSION;

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then(c => c.addAll(SHELL).catch(err => console.warn('[SW] shell pre-cache partial:', err)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      // Delete all caches that don't match current VERSION
      return Promise.all(
        keys.filter(k => !k.endsWith(VERSION)).map(k => {
          console.log('[SW] removing stale cache:', k);
          return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
      .then(() => {
        // Broadcast SW_UPDATED to all clients — page listens and shows refresh prompt
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      }).then(clients => {
        clients.forEach(c => {
          try { c.postMessage({ type: 'SW_UPDATED', version: VERSION }); } catch(_){}
        });
      })
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  // 1) Supabase API → always network (fresh data)
  if (url.hostname.endsWith('supabase.co')) return;

  // 2) Non-GET → bypass
  if (req.method !== 'GET') return;

  // 3) Fonts → stale-while-revalidate
  if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com') {
    e.respondWith(staleWhileRevalidate(req));
    return;
  }

  // 4) CDN scripts → stale-while-revalidate
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(staleWhileRevalidate(req));
    return;
  }

  // 5) Same-origin → cache-first
  if (url.origin === self.location.origin) {
    e.respondWith(cacheFirst(req));
  }
});

async function cacheFirst(req){
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const c = await caches.open(SHELL_CACHE);
      c.put(req, res.clone());
    }
    return res;
  } catch (e) {
    if (req.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    throw e;
  }
}

async function staleWhileRevalidate(req){
  const cached = await caches.match(req);
  const fetchPromise = fetch(req).then(res => {
    if (res.ok) {
      caches.open(RUNTIME_CACHE).then(c => c.put(req, res.clone()));
    }
    return res;
  }).catch(() => cached);
  return cached || fetchPromise;
}

// Allow page to trigger immediate update via SKIP_WAITING
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING' || (e.data && e.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});
