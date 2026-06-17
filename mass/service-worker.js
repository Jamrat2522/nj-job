/* ============================================================
   MASSERGER — Service Worker
   ------------------------------------------------------------
   ⚠️ ทุกครั้งที่ deploy index.html ใหม่ → แก้ CACHE_VERSION ด้านล่าง
      ให้ตรงกับ APP_VERSION ใน index.html (เช่น 'v7.53')
      เบราว์เซอร์จะเห็นว่า SW เปลี่ยน → โหลดของใหม่อัตโนมัติ

   กลยุทธ์: NETWORK-FIRST สำหรับไฟล์แอป (same-origin)
     • ออนไลน์  → ได้ index.html ตัวล่าสุดเสมอ (ไม่ค้าง cache เก่า)
     • ออฟไลน์  → fallback ใช้ cache ล่าสุดที่เก็บไว้
     • Supabase / CDN (cross-origin) → ปล่อยผ่าน network ตรง ไม่ cache เด็ดขาด
       (กันไม่ให้ข้อมูล DB / auth ถูก cache)
   ============================================================ */

const CACHE_VERSION = 'v7.80';
const CACHE_NAME    = 'masserger-' + CACHE_VERSION;
const APP_SHELL     = ['./', './index.html', './manifest.json'];

/* ---- install: pre-cache app shell + activate ทันที ---- */
self.addEventListener('install', (event) => {
  self.skipWaiting();   // ติดตั้งเสร็จ activate เลย ไม่รอแท็บเก่าปิด
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // tolerant: asset ไหนโหลดไม่ได้ ก็ไม่ทำให้ install ล้มทั้งก้อน
      Promise.all(APP_SHELL.map((u) => cache.add(u).catch(() => {})))
    )
  );
});

/* ---- activate: ลบ cache เวอร์ชันเก่าทุกตัว + ยึดทุกแท็บทันที ---- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ---- fetch ---- */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // เขียนข้อมูล (POST/PATCH/PUT/DELETE) — ปล่อยผ่าน ไม่แตะ
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // cross-origin (Supabase / CDN icon / ฯลฯ) — ปล่อยผ่าน network ตรง ห้าม cache
  if (url.origin !== self.location.origin) return;

  // same-origin → NETWORK-FIRST
  event.respondWith(
    fetch(req)
      .then((res) => {
        // เก็บสำเนาล่าสุดไว้เผื่อ offline (เฉพาะ response ปกติของ same-origin)
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        // เน็ตหลุด → ใช้ cache · ถ้าเป็นการเปิดหน้า (navigation) fallback ไป index.html
        caches.match(req).then((cached) => cached || caches.match('./index.html'))
      )
  );
});

/* ---- รับคำสั่ง SKIP_WAITING จากหน้าเว็บ (index.html สั่ง activate ทันทีตอนมีเวอร์ชันใหม่) ---- */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
