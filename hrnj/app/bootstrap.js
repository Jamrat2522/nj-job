/* ============================================================
   HR V2 — app/bootstrap.js
   จุดเริ่มระบบ: โหลดชั้นต่าง ๆ แบบ cache-busted ตาม build
   → สร้าง context (ctx) เดียวส่งให้ทุก module (ไม่มี global อื่น)
   → Global Error Boundary: error ใด ๆ ต้องไม่ทำให้ทั้งระบบเป็นหน้าว่าง
   ============================================================ */
const BUILD = window.NJHR_V2_BUILD || 'dev';
/* ตัวโหลดโมดูลกลาง — path ทุกเส้นอิง import.meta.url ของไฟล์นี้ (/hr-v2/app/) เสมอ
   ห้ามใช้ absolute path ที่ชี้ root เพราะ V2 ติดตั้งใต้ /hr-v2/
   เมื่อโหลดไม่สำเร็จ ต้องบอกชื่อโมดูลและ URL เต็มเสมอ */
const load = async (p) => {
  const url = new URL(p + '?v=' + BUILD, import.meta.url).href;
  try {
    return await import(url);
  } catch (e) {
    let extra = '';
    try {
      const r = await fetch(url, { cache: 'no-store' });
      const t = await r.text();
      const ct = r.headers.get('content-type') || '(ไม่มี)';
      extra = ' [HTTP ' + r.status + ' · ' + ct + ']';
      if (r.status === 404) extra += ' ไฟล์ไม่มีบนเซิร์ฟเวอร์ หรือชื่อ/ตัวพิมพ์ไม่ตรง';
      else if (/text\/html/i.test(ct) || /^\s*<(!doctype|html)/i.test(t))
        extra += ' เซิร์ฟเวอร์ส่ง HTML แทน JS — ตรวจ Rewrite Rule';
      else if (!/javascript|ecmascript/i.test(ct)) extra += ' MIME ของ .js ไม่ถูกต้อง';
    } catch (_) { extra = ' [fetch ไม่สำเร็จ — ตรวจเครือข่าย]'; }
    const err = new Error('โหลดโมดูลไม่สำเร็จ: ' + p + ' → ' + url + extra + ' :: ' + (e && e.message));
    err.moduleUrl = url; err.modulePath = p;
    throw err;
  }
};

const appEl = document.getElementById('v2-app');

function fatal(msg, detail) {
  appEl.innerHTML =
    '<div class="v2-fatal"><h2>เกิดข้อผิดพลาด</h2><p>' + msg + '</p>' +
    (detail ? '<p class="v2-fatal-d">' + String(detail).replace(/</g, '&lt;').slice(0, 300) + '</p>' : '') +
    '<button class="btn btn-primary" onclick="location.reload()">โหลดใหม่</button></div>';
}

(async () => {
  try {
    const [{ createClient }, { createSession }, { createToast }, { createModal }, uiStates,
           { createErrorBoundary }, { createVersionGuard }, { ROUTES, ROLE_TH }, { createRouter }] =
      await Promise.all([
        load('../services/supabase-client.js'),
        load('./session.js'),
        load('../components/toast.js'),
        load('../components/modal.js'),
        load('../components/ui-states.js'),
        load('./error-boundary.js'),
        load('./version-guard.js'),
        load('./routes.js'),
        load('./router.js')
      ]);
    const { createRepositories } = await load('../repositories/index.js');

    const client  = createClient(window.NJHR_SUPABASE_URL, window.NJHR_SUPABASE_ANON_KEY);
    const toast   = createToast(document.getElementById('v2-toasts'));
    const modal   = createModal(document.getElementById('v2-modal-root'));
    const session = createSession(client);

    const ctx = {
      BUILD, load, client, session, toast, modal,
      ui: uiStates, ROUTES, ROLE_TH,
      readOnly: false,                       // ตั้งโดย version-guard เมื่อ maintenance mode = readonly
      appEl
    };
    ctx.repo = createRepositories(client, () => session.getToken());

    /* ── Preview Write Lock ─────────────────────────────────────────────
       เงื่อนไขรอบทดสอบ Production Integration: ห้ามบันทึกข้อมูลธุรกิจจริง
       จนกว่าจะทดสอบ RPC/RLS/ข้อมูลจริงของ Module นั้นผ่าน
       ปลดล็อกได้เฉพาะ SUPER_ADMIN · มีผลเฉพาะแท็บนี้ (sessionStorage) · หายเมื่อปิดแท็บ */
    /* assertWrite โยน error แบบ silent เพื่อหยุดการทำงานของคำสั่งเขียนทันที
       ตัวจัดการกลางนี้กลืนเฉพาะ error ที่ทำเครื่องหมาย silent ไว้ (แจ้งผู้ใช้ด้วย toast ไปแล้ว)
       error อื่นยังลอยขึ้นตามปกติเพื่อให้เห็นปัญหาจริง */
    window.addEventListener('unhandledrejection', (ev) => {
      if (ev.reason && ev.reason.silent) ev.preventDefault();
    });
    window.addEventListener('error', (ev) => {
      if (ev.error && ev.error.silent) ev.preventDefault();
    });

    ctx.preview = window.NJHR_V2_PREVIEW === true;
    const LOCK_KEY = 'njhr_v2_write_unlock';
    ctx.isWriteLocked = () => {
      if (window.NJHR_V2_WRITE_LOCK !== true) return false;
      try { return sessionStorage.getItem(LOCK_KEY) !== ctx.BUILD; } catch (_) { return true; }
    };
    ctx.setWriteUnlock = (on) => {
      if (!session.user || session.role !== 'SUPER_ADMIN') return false;   // สิทธิ์จริงตรวจซ้ำที่ RPC ทุกคำสั่งอยู่แล้ว
      try { on ? sessionStorage.setItem(LOCK_KEY, ctx.BUILD) : sessionStorage.removeItem(LOCK_KEY); } catch (_) {}
      return true;
    };
    /* กันการเขียนระหว่าง Read-Only Mode — ทุก module ต้องเรียกก่อนทุกคำสั่งเขียน */
    ctx.assertWrite = () => {
      if (ctx.isWriteLocked()) {
        toast.show('โหมด Preview: ล็อกการบันทึกข้อมูลจริงไว้ — SUPER_ADMIN ปลดล็อกชั่วคราวได้ที่หน้า "สถานะระบบและเวอร์ชัน"', 'warn');
        throw Object.assign(new Error('PREVIEW_WRITE_LOCK'), { silent: true });
      }
      if (ctx.readOnly) {
        toast.show('ระบบอยู่ในโหมดอ่านอย่างเดียว — เพิ่ม/แก้ไข/ลบ/อนุมัติไม่ได้ชั่วคราว', 'warn');
        throw Object.assign(new Error('READONLY'), { silent: true });
      }
    };

    ctx.boundary = createErrorBoundary(ctx);
    ctx.guard    = createVersionGuard(ctx);  // ตรวจ version/maintenance: boot·route·tab active·online·ทุก 3 นาที
    ctx.router   = createRouter(ctx);

    const st = await ctx.guard.checkNow();   // ห้ามเข้าระบบก่อนรู้สถานะเซิร์ฟเวอร์
    if (st.blocked) return;                  // guard render หน้า maintenance เองแล้ว

    await ctx.router.start();
  } catch (e) {
    fatal('เปิดระบบไม่สำเร็จ', e && e.message);
  }
})();
