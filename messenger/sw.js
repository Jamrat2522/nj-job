// ════════════════════════════════════════════════════════
// NJ Dispatch — Versioned Service Worker
// Cache strategy: CSS/HTML stale-while-revalidate, JS network-first
// Update: bump BUILD_VERSION on every deploy
// ════════════════════════════════════════════════════════
const BUILD_VERSION = '1775614314';           // AUTO: change on every deploy
const CACHE_STATIC  = 'nj-static-'  + BUILD_VERSION;
const CACHE_RUNTIME = 'nj-runtime-' + BUILD_VERSION;

// Files to pre-cache at install time
const PRECACHE = ['/app.css', '/index.html'];

// ── Install: pre-cache static assets ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: delete old versioned caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('nj-') && k !== CACHE_STATIC && k !== CACHE_RUNTIME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: strategy per resource type ──
self.addEventListener('fetch', e => {
  const {request} = e;
  const url = new URL(request.url);

  // Skip: non-GET, Supabase API, WebSocket
  if (request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;
  if (url.protocol === 'wss:') return;

  // app.js → Network-first (always get latest logic)
  if (url.pathname.endsWith('/app.js')) {
    e.respondWith(networkFirst(request, CACHE_RUNTIME, 4000));
    return;
  }

  // CSS + HTML → Stale-while-revalidate (fast + fresh)
  if (request.destination === 'style' || request.destination === 'document') {
    e.respondWith(staleWhileRevalidate(request, CACHE_STATIC));
    return;
  }

  // Google Fonts CSS → Cache-first (immutable)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(cacheFirst(request, CACHE_RUNTIME));
    return;
  }

  // Chart.js CDN → Cache-first (versioned URL)
  if (url.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(cacheFirst(request, CACHE_RUNTIME));
    return;
  }
});

// ── Cache strategies ──
async function networkFirst(req, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), timeoutMs);
    const res  = await fetch(req, {signal: ctrl.signal});
    clearTimeout(tid);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    return cached || new Response('Offline', {status: 503});
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fresh  = fetch(req).then(res => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fresh;
}

async function cacheFirst(req, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}
