/* TRANSPORT NJ — Service Worker (scope /transportnj/)
   - cache name bound to APP_VERSION (from config.js) → every release = new cache, old tnj-* caches removed
   - index.html / config.js / sw.js: NETWORK-FIRST (never served stale when online)
   - other same-origin app assets: network-first with cache fallback (offline start)
   - CDN libraries (versioned URLs): cache-first
   - API calls (supabase.co) are never cached */
importScripts('assets/js/config.js');
const VERSION = (self.TNJ_CONFIG && self.TNJ_CONFIG.APP_VERSION) || 'dev';
const CACHE = 'tnj-' + VERSION;
const CDN = ['cdn.jsdelivr.net', 'unpkg.com', 'cdn.sheetjs.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const PRECACHE = ['index.html', 'assets/css/app.css', 'assets/js/core.js', 'assets/js/office.js', 'assets/js/driver.js', 'assets/img/icon-192.png', 'manifest.webmanifest'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE.map((p) => new Request(p, { cache: 'reload' }))).catch(() => null)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('tnj-') && k !== CACHE).map((k) => caches.delete(k))); // only this app's caches
    await self.clients.claim();
    const cs = await self.clients.matchAll({ type: 'window' }); cs.forEach((c) => c.postMessage({ type: 'TNJ_NEW_SW', version: VERSION }));
  })());
});
self.addEventListener('message', (e) => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co') || url.hostname.endsWith('openstreetmap.org') || url.hostname.endsWith('google.com')) return; // never cache API / tiles
  if (CDN.includes(url.hostname)) { e.respondWith(caches.open(CACHE).then(async (c) => { const hit = await c.match(req); if (hit) return hit; const res = await fetch(req); if (res && res.ok) c.put(req, res.clone()); return res; }).catch(() => fetch(req))); return; }
  if (url.origin !== location.origin) return;
  // same-origin: network-first, fall back to cache (offline)
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try { const res = await fetch(req, { cache: 'no-store' }); if (res && res.ok && !url.pathname.endsWith('sw.js')) c.put(req, res.clone()); return res; }
    catch (_) { const hit = await c.match(req, { ignoreSearch: true }); if (hit) return hit; if (req.mode === 'navigate') { const idx = await c.match('index.html', { ignoreSearch: true }); if (idx) return idx; } throw _; }
  })());
});
