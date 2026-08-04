/* Service Worker — static asset เท่านั้น · ไม่ cache ข้อมูลส่วนตัว/Supabase */
const V = 'njhr-v2-v111';  // bump: ฟอร์มพนักงาน+หน้าประกันสังคม ตั้งค่า AUTO/MANUAL/ปิด
const ASSETS = ['./', './index.html', './styles.css', './app.js', './assets/nj-logistic-logo.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS).catch(()=>{}))); });
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.origin !== location.origin) return;                    // ไม่แตะ Supabase/CDN
  if (e.request.mode === 'navigate') {                          // network-first สำหรับหน้าเว็บ
    e.respondWith(fetch(e.request).catch(() => caches.match('./index.html')));
    return;
  }
  if (u.pathname.endsWith('/config.js')) {                      // (50.7/50.8) ไฟล์ตั้งค่า: network-only + no-store
    e.respondWith(fetch(e.request, { cache: 'no-store' }));
    return;
  }
  if (!ASSETS.some(a => u.pathname.endsWith(a.replace('./','')))) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
