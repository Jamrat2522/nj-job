/* Service Worker — static asset เท่านั้น · ไม่ cache ข้อมูลส่วนตัว/Supabase
   Cache Version มาจาก build.js เขียนให้อัตโนมัติ (ค่าเดียวกับ app.js/CSS/index.html ใน build เดียวกัน) */
const V = 'njhr-v2-65e2f419';
const BUILD = V.replace('njhr-v2-', '');
const Q = '?v=' + BUILD;

/* A) Core Assets — ต้องอยู่ Build เดียวกันทั้งชุด · build.js เขียนรายการนี้ให้อัตโนมัติ
      URL มี ?v=<hash ของไฟล์นั้น> ติดมาด้วย และการค้นหาใน cache จะเทียบ URL แบบตรงตัว
      ถ้าตัวใดโหลดไม่สำเร็จ ให้ install ล้มเหลวไปเลย จะได้ไม่มี cache ครึ่ง ๆ กลาง ๆ
      รายการนี้มีเฉพาะสิ่งที่ต้องใช้ตั้งแต่หน้า Login: index.html · CSS · โลโก้ ·
      Asset Manifest · Runtime Namespace · Runtime Core
      ห้ามใส่ Feature Module หรือ Compatibility Bundle เด็ดขาด */
const CORE = ["./","./index.html","./asset-manifest.js?v=1ec67a23","./runtime/namespace.js?v=815b8995","./runtime/core.js?v=614ea801","./styles.css?v=f384017b","./mobile.css?v=1936a3b3","./assets/nj-logistic-logo.png"];

/* B) Lazy-loaded static — cache ตอนใช้งานจริง ไม่ดึงตั้งแต่ install
      dashboard.js  → cache ตอนเปิด Dashboard ครั้งแรก (ไม่ precache จึงไม่เพิ่ม Initial Download)
      app-legacy.js → cache ตอนเปิด Feature เดิมครั้งแรกเท่านั้น ห้าม precache
      ที่เหลือโหลดผ่าน loadScriptOnce/loadStyleOnce ซึ่งเติม ?v= ให้แล้ว */
const LAZY_PATHS = ["dashboard.js","emp-meta.js","hr-meta.js","report-export.js","requests.js","leave-meta.js","attachments.js","list.js","main.js","report.js","menu.js","form.js","documents.js","import.js","export.js","correction.js","detail.js","hrdocs.js","app-legacy.js","face.js","face.css","master-salary.js","report-template.js"];

/* C) ห้าม cache เด็ดขาด — config.js · Supabase/RPC · ทุก origin อื่น
      ข้อมูลพนักงาน เงินเดือน ใบหน้า Audit ลงเวลา Signed URL อยู่บน Supabase
      ซึ่งเป็นคนละ origin จึงถูกกันด้วยเงื่อนไข origin ด้านล่างอยู่แล้ว */

/* [Error Monitoring] แจ้ง error สำคัญของ SW ไปให้หน้าเว็บเป็นผู้บันทึก
   SW ไม่มี token/Supabase client จึงไม่ยิง RPC เอง
   ส่งเฉพาะข้อความสั้น ไม่มี URL เต็ม ไม่มีข้อมูลผู้ใช้ · ไม่แตะ Cache Strategy เดิม */
function swReport(scope, msg) {
  try {
    self.clients.matchAll({ includeUncontrolled: true }).then(cs => {
      cs.forEach(c => c.postMessage({ njhrSwError: 1, scope: scope, message: String(msg).slice(0, 300) }));
    });
  } catch (e) {}
}

self.addEventListener('install', e => {
  self.skipWaiting();
  // ไม่มี catch กลืน error — core asset ใดพลาด install ล้มเหลว SW เดิมยังทำงานต่อ
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).catch(err => {
    swReport('install', (err && err.message) || 'addAll failed');
    throw err;                                   // คงพฤติกรรมเดิม: install ต้องล้มเหลวจริง
  }));
});

self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(ks => Promise.all(
      // ลบเฉพาะ cache ของระบบนี้ที่เป็น build เก่า — ไม่แตะ cache ของระบบอื่นบน origin เดียวกัน
      ks.filter(k => k !== V && k.indexOf('njhr-v2-') === 0).map(k => caches.delete(k))))
    .then(() => self.clients.claim())));

/* ================= WEB PUSH =================
   Push ที่ได้รับ "ไม่มี payload" โดยเจตนา — ไม่มี title/body/link ของแจ้งเตือนจริง
   จึงแสดงข้อความกลาง แล้วให้ผู้ใช้กดเข้าแอปไปอ่านเนื้อหาด้วย token ของตัวเอง
   ไม่แตะ Cache Strategy เดิมแม้แต่บรรทัดเดียว */
self.addEventListener('push', e => {
  e.waitUntil(
    self.registration.showNotification('NJ LOGISTIC HR', {
      body: 'คุณมีการแจ้งเตือนใหม่',
      icon: './assets/nj-logistic-logo.png',
      badge: './assets/nj-logistic-logo.png',
      tag: 'njhr-notify',            // รวมเป็นก้อนเดียว ไม่ถล่มหน้าจอ
      renotify: true,
      data: { url: './#/notifications' }
    }).catch(() => {})
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './#/notifications';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      for (const c of cs) {
        if (c.url.indexOf(self.registration.scope) === 0) {
          return c.focus().then(cc => (cc && cc.navigate ? cc.navigate(target) : cc));
        }
      }
      return self.clients.openWindow(target);
    }).catch(() => {})
  );
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.origin !== location.origin) return;                    // ไม่แตะ Supabase/CDN

  if (e.request.mode === 'navigate') {                          // network-first สำหรับหน้าเว็บ
    e.respondWith(fetch(e.request).then(r => r, () => caches.open(V).then(c => c.match('./index.html'))));
    return;
  }
  if (u.pathname.endsWith('/config.js')) {                      // (50.7/50.8) network-only + no-store
    e.respondWith(fetch(e.request, { cache: 'no-store' }));
    return;
  }

  const file = u.pathname.split('/').pop();
  // เทียบด้วย path เต็ม (มีโฟลเดอร์ runtime/ views/ compat/ แล้ว) ไม่ใช่ชื่อไฟล์อย่างเดียว
  const isCore = CORE.some(a => {
    const name = a.replace('./', '').split('?')[0];
    if (!name) return false;
    return u.pathname === '/' + name || u.pathname.endsWith('/' + name);
  });
  const isLazy = LAZY_PATHS.indexOf(file) >= 0;
  if (!isCore && !isLazy) return;                               // ไฟล์อื่นปล่อยผ่าน

  /* เทียบ URL แบบตรงตัวรวม ?v= และค้นเฉพาะ cache ของ build ปัจจุบัน
     cache ของ build เก่าจึงคืน asset ให้ build ใหม่ไม่ได้เลย */
  e.respondWith(caches.open(V).then(c => c.match(e.request).then(hit => {
    if (hit) return hit;
    return fetch(e.request).then(resp => {
      if (resp && resp.ok && (isCore || isLazy)) c.put(e.request, resp.clone());
      return resp;
    });
  })));
});
