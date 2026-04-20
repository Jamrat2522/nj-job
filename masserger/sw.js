// ════════════════════════════════════════════════════════
// NJ Dispatch — Service Worker (iOS-safe version)
// ════════════════════════════════════════════════════════
const BUILD_VERSION = '1775622020-nodepool';
const CACHE_STATIC  = 'nj-static-'  + BUILD_VERSION;
const CACHE_RUNTIME = 'nj-runtime-' + BUILD_VERSION;
const PRECACHE = ['/app.css', '/app.js', '/index.html'];

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
        // ลบ cache เก่าทั้งหมดยกเว้น cache version ปัจจุบัน — ป้องกัน stale UI
        keys.filter(k => k.startsWith('nj-') && k !== CACHE_STATIC && k !== CACHE_RUNTIME)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
     .then(() => {
        // Notify ทุก client ว่า SW ใหม่ active แล้ว → reload อัตโนมัติเพื่อได้ UI ล่าสุด
        return self.clients.matchAll({type:'window'}).then(clients => {
          clients.forEach(c => c.postMessage({type:'SW_UPDATED', version:BUILD_VERSION}));
        });
      })
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;
  // ไม่ cache Supabase API + WebSocket — dynamic data ต้องสด
  if (url.hostname.includes('supabase.co')) return;
  if (url.protocol === 'wss:' || url.protocol === 'ws:') return;

  // app.js → Network-first กับ cache fallback (ไม่ใช้ AbortController — iOS compat)
  // ได้ fresh เมื่อ online / fallback cache เมื่อ offline
  if (url.pathname.endsWith('/app.js')) {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_RUNTIME).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match(req)) // offline → ใช้ cache
    );
    return;
  }

  // CSS + HTML → Stale-while-revalidate (fast + always fresh-ish)
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
