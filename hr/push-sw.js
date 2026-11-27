/* MASSERGER · push-sw.js (local369 NJL SMART JOB ALERT)
   Service Worker สำหรับรับ Web Push "อย่างเดียว" — ไม่มี fetch handler · ไม่ใช้ Cache Storage · ไม่แตะไฟล์/ข้อมูลของแอป
   จึงไม่กระทบระบบ Version / Force Update / Cache-control เดิม (HTML/JS/CSS/version.json โหลดจากเครือข่ายตามเดิม)
   แตะการแจ้งเตือน → เปิด/โฟกัสแอป แล้วไปเมนู WORK → กำลังดำเนินการ หรือ DOCUMENT → ดำเนินตรวจปล่อย */
const NAVS = ["going", "doc-received"];
self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });

function safeUrl(u, nav) {
  const scope = self.registration.scope;
  try {
    const x = new URL(String(u || ""), scope);
    if (x.href.indexOf(scope) === 0 && NAVS.indexOf(x.searchParams.get("nav")) >= 0) return x.href;
  } catch (_) { /* ignore */ }
  return NAVS.indexOf(nav) >= 0 ? scope + "?nav=" + nav : scope;
}

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = {}; }
  const n = (d && d.notification) || {};
  const nav = n.data && NAVS.indexOf(n.data.nav) >= 0 ? n.data.nav : "";
  const title = String(n.title || "🔔 MASSERGER — รอปิดงาน").slice(0, 120);
  const opts = {
    body: String(n.body || "แตะเพื่อเปิดรายการงานที่รอปิด").slice(0, 1200),
    tag: String(n.tag || "nj-pc369"),
    renotify: true,
    icon: n.icon || undefined,
    badge: n.icon || undefined,
    data: { url: safeUrl(n.navigate, nav), nav },
  };
  e.waitUntil((async () => {
    await self.registration.showNotification(title, opts);
    try {
      const b = Number(d && d.app_badge);
      if (self.navigator && "setAppBadge" in self.navigator && isFinite(b)) {
        if (b > 0) await self.navigator.setAppBadge(b); else await self.navigator.clearAppBadge();
      }
    } catch (_) { /* ignore */ }
  })());
});

self.addEventListener("notificationclick", (e) => {
  const data = (e.notification && e.notification.data) || {};
  e.notification.close();
  const url = safeUrl(data.url, data.nav);
  let nav = data.nav;
  try { nav = new URL(url).searchParams.get("nav") || nav; } catch (_) { /* ignore */ }
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) {
      if (c.url && c.url.indexOf(self.registration.scope) === 0) {
        try { await c.focus(); } catch (_) { /* ignore */ }
        try { c.postMessage({ type: "pc369-nav", nav }); } catch (_) { /* ignore */ }
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
