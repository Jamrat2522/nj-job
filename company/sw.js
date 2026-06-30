/* EVA Service Worker — NJ ศูนย์รับฟัง & ประกาศบริษัท
   กลยุทธ์:
   - เอกสาร (HTML): network-first → ออนไลน์ได้ของใหม่เสมอ (เหมาะกับงานที่แก้ไฟล์บ่อย), ออฟไลน์ใช้ cache
   - ฟอนต์ / CDN libs: stale-while-revalidate → โหลดซ้ำเร็วขึ้น
   - Supabase (API/realtime): ไม่แตะ ปล่อยผ่าน network ปกติ
   *** เมื่อ deploy เวอร์ชันใหม่ ให้เปลี่ยนเลข CACHE เป็น v2, v3, ... เพื่อล้าง cache เก่า ***
*/
const CACHE = 'eva-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  // อย่าแตะ Supabase (API / auth / realtime / storage) และ websocket
  if (url.hostname.endsWith('supabase.co') || url.protocol === 'ws:' || url.protocol === 'wss:') return;

  const isDoc = req.mode === 'navigate' || req.destination === 'document';

  if (isDoc) {
    // network-first: ของใหม่เสมอเมื่อออนไลน์, fallback เป็น cache เมื่อออฟไลน์
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // อื่น ๆ (fonts, cdn libs ที่ lazy-load): stale-while-revalidate
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((hit) => {
        const net = fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone()).catch(() => {});
            return res;
          })
          .catch(() => hit);
        return hit || net;
      })
    )
  );
});
