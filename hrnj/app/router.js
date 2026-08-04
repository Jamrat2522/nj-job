/* ============================================================
   HR V2 — app/router.js
   Hash Router แยกจาก View · โหลด module เฉพาะหน้าที่เปิด (dynamic import)
   ทุกหน้า: Loading → mount(el, ctx) · ออกจากหน้า: unmount() ถอด event/timer/request
   Error ใน module เดียว → Error State เฉพาะหน้านั้น ไม่ทำให้ทั้งระบบเป็นหน้าว่าง
   ============================================================ */
export function createRouter(ctx) {
  let current = null;          // { route, mod, seq }
  let seq = 0;

  const outlet = () => document.getElementById('v2-outlet') || ctx.appEl;

  async function ensureShell() {
    if (document.getElementById('v2-outlet')) return;
    const { mountShell } = await ctx.load('./app-shell.js');
    mountShell(ctx);
  }

  function guardRoute(hash) {
    const def = ctx.ROUTES[hash];
    if (!def) return { redirect: '#/home' };
    if (def.public) return { def };
    if (!ctx.session.user) return { redirect: '#/login' };
    if (def.roles && def.roles.indexOf(ctx.session.role) < 0) {
      return { deny: def };
    }
    return { def };
  }

  async function go(hash) {
    const mySeq = ++seq;
    const g = guardRoute(hash);
    if (g.redirect) { if (location.hash !== g.redirect) { location.hash = g.redirect; return; } }
    const def = g.def || ctx.ROUTES['#/home'];

    /* ปิดหน้าเดิมก่อนเสมอ (ถอด listener/timer/request) */
    if (current && current.mod && current.mod.unmount) {
      try { current.mod.unmount(); } catch (_) {}
    }
    current = null;

    if (g.deny) {
      document.title = 'ไม่มีสิทธิ์เข้าถึง — NJ HR V2';
      ctx.ui.renderError(outlet(), 'บัญชีของคุณไม่มีสิทธิ์เข้าถึงหน้านี้', () => { location.hash = '#/home'; }, 'กลับหน้าหลัก');
      return;
    }

    if (!def.public) await ensureShell();
    document.title = def.title + ' — NJ HR V2';
    ctx.ui.renderLoading(def.public ? ctx.appEl : outlet());

    try {
      const mod = await ctx.load('../modules/' + def.module);
      if (mySeq !== seq) return;                       // ผู้ใช้เปลี่ยนหน้าไปแล้ว — ทิ้งผลนี้
      const target = def.public ? ctx.appEl : outlet();
      await ctx.boundary.run(target, () => mod.mount(target, ctx));
      if (mySeq !== seq) { if (mod.unmount) try { mod.unmount(); } catch (_) {} return; }
      current = { route: hash, mod, seq: mySeq };
      highlightMenu(hash);
    } catch (e) {
      if (mySeq !== seq) return;
      ctx.ui.renderError(def.public ? ctx.appEl : outlet(),
        'โหลดหน้านี้ไม่สำเร็จ (' + def.module + ')', () => go(hash), 'ลองอีกครั้ง',
        (e && e.moduleUrl ? 'URL: ' + e.moduleUrl + ' — ' : '') + (e && e.message));
    }
  }

  function highlightMenu(hash) {
    document.querySelectorAll('.v2-nav a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === hash);
    });
  }

  async function start() {
    /* ตรวจ session กับเซิร์ฟเวอร์ก่อนเข้าระบบ */
    try {
      await ctx.session.check();
      const allowed = await ctx.session.checkV2Access();
      if (!allowed) { location.hash = '#/no-access'; }
      else if (!location.hash || location.hash === '#/login' || location.hash === '#/no-access') {
        location.hash = '#/home';
      }
    } catch (e) {
      if (!e.silent && e.message !== 'NO_SESSION') ctx.toast.show(e.message, 'error');
      location.hash = '#/login';
    }
    window.addEventListener('hashchange', () => go(location.hash || '#/home'));
    await go(location.hash || '#/home');
  }

  return { start, go, nav: (h) => { if (location.hash === h) go(h); else location.hash = h; } };
}
