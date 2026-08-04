/* HR V2 — test/harness.mjs — สภาพแวดล้อม jsdom + login ตาม role สำหรับ Integration Test */
import { JSDOM } from 'jsdom';

export async function makeWorld(server) {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><body><div id="v2-app"></div><div id="v2-modal-root"></div><div id="v2-toasts"></div></body></html>',
    { url: 'https://test.local/hr-v2/', pretendToBeVisual: true });
  const w = dom.window;
  const reloads = [], replaces = [];
  const loc = {
    get hash() { return w.location.hash; }, set hash(v) { w.location.hash = v; },
    get href() { return w.location.href; },
    get search() { return w.location.search; },
    reload() { reloads.push(1); }, replace(u) { replaces.push(String(u)); }, assign() {}
  };
  if (w.HTMLFormElement) w.HTMLFormElement.prototype.submit = function () {};
  w.URL.createObjectURL = () => 'blob:test';       // สำหรับทดสอบ Export CSV
  w.URL.revokeObjectURL = () => {};

  w.fetch = async (url, opt) => {
    const fn = String(url).split('/rpc/')[1];
    const body = JSON.parse(opt.body || '{}');
    let reply;
    try { reply = await server.handle(fn, body); }
    catch (e) { reply = e && e.__error ? e : { __error: e.message, status: 500 }; }
    if (reply && reply.__error) {
      return { ok: false, status: reply.status || 400, json: async () => ({ message: reply.__error }) };
    }
    return { ok: true, status: 200, json: async () => reply };
  };

  for (const k of ['window', 'document', 'navigator', 'sessionStorage', 'localStorage', 'URL']) {
    Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true, writable: false });
  }
  Object.defineProperty(globalThis, 'location', { value: loc, configurable: true, writable: false });
  globalThis.fetch = w.fetch;

  w.NJHR_V2_BUILD = 'v2-preview-1';

  const q = '?t=' + Math.random().toString(36).slice(2);
  const base = new URL('../', import.meta.url).href;      // hr-v2/
  const [{ createClient }, { createSession }, { createToast }, { createModal }, uiStates,
         { createErrorBoundary }, { createVersionGuard }, routes, { createRouter }, { createRepositories }] =
    await Promise.all([
      import(base + 'services/supabase-client.js' + q),
      import(base + 'app/session.js' + q),
      import(base + 'components/toast.js' + q),
      import(base + 'components/modal.js' + q),
      import(base + 'components/ui-states.js' + q),
      import(base + 'app/error-boundary.js' + q),
      import(base + 'app/version-guard.js' + q),
      import(base + 'app/routes.js' + q),
      import(base + 'app/router.js' + q),
      import(base + 'repositories/index.js' + q)
    ]);
  const appEl = w.document.getElementById('v2-app');
  const ctx = {
    BUILD: 'v2-preview-1',
    load: (p) => import(new URL(p + q, base + 'app/').href),
    client: createClient('https://sb.local', 'test-key'),
    toast: createToast(w.document.getElementById('v2-toasts')),
    modal: createModal(w.document.getElementById('v2-modal-root')),
    ui: uiStates, ROUTES: routes.ROUTES, ROLE_TH: routes.ROLE_TH,
    readOnly: false, appEl
  };
  ctx.session = createSession(ctx.client);
  ctx.repo = createRepositories(ctx.client, () => ctx.session.getToken());
  ctx.preview = true;
  const LOCK_KEY = 'njhr_v2_write_unlock';
  ctx.writeLockEnabled = true;                                  // ตรงกับ NJHR_V2_WRITE_LOCK ใน index.html
  ctx.isWriteLocked = () => ctx.writeLockEnabled && w.sessionStorage.getItem(LOCK_KEY) !== ctx.BUILD;
  ctx.setWriteUnlock = (on) => {
    if (!ctx.session.user || ctx.session.role !== 'SUPER_ADMIN') return false;
    on ? w.sessionStorage.setItem(LOCK_KEY, ctx.BUILD) : w.sessionStorage.removeItem(LOCK_KEY);
    return true;
  };
  ctx.assertWrite = () => {
    if (ctx.isWriteLocked()) {
      ctx.toast.show('โหมด Preview: ล็อกการบันทึกข้อมูลจริงไว้', 'warn');
      throw Object.assign(new Error('PREVIEW_WRITE_LOCK'), { silent: true });
    }
    if (ctx.readOnly) {
      ctx.toast.show('ระบบอยู่ในโหมดอ่านอย่างเดียว — เพิ่ม/แก้ไข/ลบ/อนุมัติไม่ได้ชั่วคราว', 'warn');
      throw Object.assign(new Error('READONLY'), { silent: true });
    }
  };
  ctx.boundary = createErrorBoundary(ctx);
  ctx.guard = createVersionGuard(ctx);
  ctx.router = createRouter(ctx);
  return { w, ctx, appEl, reloads, replaces, dom };
}

/* login สำเร็จรูปตาม role แล้วเริ่ม router — คืน world พร้อมใช้งาน */
/* boot(server, token, opts) — opts.writeLock=false เพื่อทดสอบ flow เขียนของแต่ละ Module
   (โหมด Preview จริงล็อกไว้ · SUPER_ADMIN ปลดล็อกรายเซสชันได้ที่ #/system) */
export async function boot(server, token, opts) {
  const world = await makeWorld(server);
  if (!opts || opts.writeLock !== true) world.ctx.writeLockEnabled = false;
  world.w.localStorage.setItem('njhr_v2_token', token);
  await world.ctx.guard.checkNow();
  await world.ctx.router.start();
  await tick(60);
  return world;
}
export const tick = (ms) => new Promise(r => setTimeout(r, ms || 30));
export const outlet = (w) => w.document.getElementById('v2-outlet') || w.document.getElementById('v2-app');
