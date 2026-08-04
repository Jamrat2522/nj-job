/* HR V2 — smoke-test.mjs
   ทดสอบระดับ Integration ใน DOM จำลอง (jsdom) + จำลอง RPC ตาม signature จริงของ 96_version_control.sql
   ครอบคลุม: boot → login page · feature flag deny · login SUPER_ADMIN · readonly banner ·
   full maintenance (นับถอยหลัง + บล็อก) · version mismatch (force reload + กันลูป) · route guard */
import { JSDOM } from 'jsdom';
import assert from 'node:assert';

const results = [];
function T(name, fn) { results.push({ name, fn }); }

// ── สร้างโลกจำลองใหม่ต่อ 1 เคส ─────────────────────────────
async function makeWorld(server) {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><body><div id="v2-app"></div><div id="v2-modal-root"></div><div id="v2-toasts"></div></body></html>',
    { url: 'https://test.local/hr-v2/', pretendToBeVisual: true });
  const w = dom.window;
  const reloads = [], replaces = [];
  // jsdom ไม่ implement reload/replace → ดักไว้ตรวจ
  // wrapper ของ location: โค้ดแอปอ้าง global `location` — delegate hash/href ไปของจริง (hashchange ยังยิง)
  // แต่ reload/replace เป็น stub เพื่อตรวจนับ (jsdom กำหนดเป็น non-configurable แก้ตรง ๆ ไม่ได้)
  const loc = {
    get hash() { return w.location.hash; }, set hash(v) { w.location.hash = v; },
    get href() { return w.location.href; },
    get search() { return w.location.search; },
    reload() { reloads.push(1); },
    replace(u) { replaces.push(String(u)); },
    assign() {}
  };
  if (w.HTMLFormElement) w.HTMLFormElement.prototype.submit = function () {};

  // fetch จำลอง — ตอบตาม RPC name เหมือนเซิร์ฟเวอร์จริง
  w.fetch = async (url, opt) => {
    const fn = String(url).split('/rpc/')[1];
    const body = JSON.parse(opt.body || '{}');
    const reply = await server(fn, body);
    if (reply && reply.__error) {
      return { ok: false, status: reply.status || 400, json: async () => ({ message: reply.__error }) };
    }
    return { ok: true, status: 200, json: async () => reply };
  };

  for (const k of ['window', 'document', 'navigator', 'sessionStorage', 'localStorage', 'URL']) {
    Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true, writable: false });
  }
  Object.defineProperty(globalThis, 'location', { value: loc, configurable: true, writable: false });
  w.NJHR_V2_BUILD = 'v2-core-0';
  w.NJHR_SUPABASE_URL = 'https://sb.local';
  w.NJHR_SUPABASE_ANON_KEY = 'test-key';
  globalThis.fetch = w.fetch;

  // โหลด core modules สดต่อเคส (query กันแคช module ของ node)
  const q = '?t=' + Math.random().toString(36).slice(2);
  const base = new URL('./hr-v2/', import.meta.url).href;
  const [{ createClient }, { createSession }, { createToast }, { createModal }, uiStates,
         { createErrorBoundary }, { createVersionGuard }, routes, { createRouter }] = await Promise.all([
    import(base + 'services/supabase-client.js' + q),
    import(base + 'app/session.js' + q),
    import(base + 'components/toast.js' + q),
    import(base + 'components/modal.js' + q),
    import(base + 'components/ui-states.js' + q),
    import(base + 'app/error-boundary.js' + q),
    import(base + 'app/version-guard.js' + q),
    import(base + 'app/routes.js' + q),
    import(base + 'app/router.js' + q)
  ]);
  const { createRepositories } = await import(base + 'repositories/index.js' + q);
  const appEl = w.document.getElementById('v2-app');
  const ctx = {
    BUILD: 'v2-core-0',
    load: (p) => import(new URL(p + q, base + 'app/').href),
    client: createClient(w.NJHR_SUPABASE_URL, w.NJHR_SUPABASE_ANON_KEY),
    session: null, toast: createToast(w.document.getElementById('v2-toasts')),
    modal: createModal(w.document.getElementById('v2-modal-root')),
    ui: uiStates, ROUTES: routes.ROUTES, ROLE_TH: routes.ROLE_TH,
    readOnly: false, appEl
  };
  ctx.session = createSession(ctx.client);
  ctx.repo = createRepositories(ctx.client, () => ctx.session.getToken());
  ctx.preview = true;
  ctx.isWriteLocked = () => false;                 // smoke core ทดสอบชั้น version/maintenance ไม่ใช่ชั้น write lock
  ctx.setWriteUnlock = () => true;
  ctx.assertWrite = () => {
    if (ctx.readOnly) throw Object.assign(new Error('READONLY'), { silent: true });
  };
  ctx.boundary = createErrorBoundary(ctx);
  ctx.guard = createVersionGuard(ctx);
  ctx.router = createRouter(ctx);
  return { w, ctx, appEl, reloads, replaces, dom };
}

const OK_STATUS = { version: 'v2-core-0', maintenance_active: false, maintenance_mode: 'full',
  maintenance_message: '', maintenance_started_at: null, maintenance_ends_at: null,
  server_time: new Date().toISOString() };
const SA = { user_id: 'u1', username: 'jamrat', role: 'SUPER_ADMIN', employee_id: 'e1',
  emp_code: '0001', emp_name: 'นายจำรัส ผาเทพ', session_token: 'tok-sa' };
const EMP = { user_id: 'u2', username: 'somchai', role: 'EMPLOYEE', employee_id: 'e2',
  emp_code: '0050', emp_name: 'สมชาย ใจดี', session_token: 'tok-emp' };

// ── เคสทดสอบ ────────────────────────────────────────────────
T('1. Boot ไม่มี session → แสดงหน้า Login (ไม่มีหน้าว่าง)', async () => {
  const { w, ctx, appEl } = await makeWorld(async (fn) => {
    if (fn === 'njhr_version_status') return OK_STATUS;
    throw new Error('unexpected ' + fn);
  });
  const st = await ctx.guard.checkNow();
  assert.equal(st.blocked, false);
  await ctx.router.start();
  assert.equal(w.location.hash, '#/login');
  assert.ok(appEl.innerHTML.includes('เข้าสู่ระบบ'), 'ต้องเห็นฟอร์ม login');
  assert.ok(appEl.querySelector('#lg-user'), 'มีช่องชื่อผู้ใช้');
});

T('2. Login สำเร็จ (SUPER_ADMIN) → token ถูกเก็บ + reload เริ่ม shell', async () => {
  const calls = [];
  const { w, ctx, appEl, reloads } = await makeWorld(async (fn, body) => {
    calls.push(fn);
    if (fn === 'njhr_version_status') return OK_STATUS;
    if (fn === 'njhr_login') {
      assert.equal(body.p_username, 'jamrat');
      assert.ok(body.p_ua.startsWith('V2 · '));
      return SA;
    }
    if (fn === 'njhr_session_check') return SA;
    if (fn === 'njhr_version_v2_access') return { allowed: true, role: 'SUPER_ADMIN', username: 'jamrat' };
    throw new Error('unexpected ' + fn);
  });
  await ctx.guard.checkNow(); await ctx.router.start();
  appEl.querySelector('#lg-user').value = 'jamrat';
  appEl.querySelector('#lg-pass').value = 'x';
  appEl.querySelector('#lg-form').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await new Promise(r => setTimeout(r, 50));
  assert.equal(w.localStorage.getItem('njhr_v2_token'), 'tok-sa', 'token key แยกจาก V1');
  assert.equal(reloads.length, 1, 'reload เพื่อเริ่ม shell');
  assert.ok(calls.includes('njhr_version_v2_access'), 'ตรวจ feature flag หลัง login');
});

T('3. Feature Flag: EMPLOYEE ที่ไม่อยู่ในรายชื่อ → หน้า "ยังไม่เปิดใช้งาน" + เข้า route ตรงไม่ได้', async () => {
  const { w, ctx, appEl } = await makeWorld(async (fn) => {
    if (fn === 'njhr_version_status') return OK_STATUS;
    if (fn === 'njhr_session_check') return EMP;
    if (fn === 'njhr_version_v2_access') return { allowed: false, role: 'EMPLOYEE', username: 'somchai' };
    if (fn === 'njhr_logout') return {};
    throw new Error('unexpected ' + fn);
  });
  w.localStorage.setItem('njhr_v2_token', 'tok-emp');
  await ctx.guard.checkNow(); await ctx.router.start();
  assert.equal(w.location.hash, '#/no-access');
  assert.ok(appEl.innerHTML.includes('ยังไม่เปิดใช้งาน'), 'ข้อความ feature flag');
  // พิมพ์ route ภายในตรง ๆ — #/system จำกัด SUPER_ADMIN
  await ctx.router.go('#/system');
  assert.ok(appEl.innerHTML.includes('ไม่มีสิทธิ์') || !appEl.innerHTML.includes('Deployment Version'),
    'ห้ามเห็นหน้า SUPER_ADMIN');
});

T('4. Read-Only Maintenance → แถบเหลือง + ctx.readOnly=true + ไม่บังคับออก', async () => {
  const { w, ctx } = await makeWorld(async (fn) => {
    if (fn === 'njhr_version_status') return Object.assign({}, OK_STATUS, {
      maintenance_active: true, maintenance_mode: 'readonly',
      maintenance_message: 'ทดสอบ readonly',
      maintenance_ends_at: new Date(Date.now() + 600e3).toISOString() });
    if (fn === 'njhr_session_check') return SA;
    throw new Error('unexpected ' + fn);
  });
  w.localStorage.setItem('njhr_v2_token', 'tok-sa');
  const st = await ctx.guard.checkNow();
  assert.equal(st.blocked, false); assert.equal(st.readOnly, true);
  assert.equal(ctx.readOnly, true);
  const b = w.document.getElementById('v2-ro-banner');
  assert.ok(b && b.textContent.includes('ทดสอบ readonly'), 'แถบประกาศแสดงข้อความจากเซิร์ฟเวอร์');
});

T('5. Full Maintenance (ผู้ใช้ทั่วไป) → เพิกถอน session + หน้านับถอยหลัง + logout ถูกเรียก', async () => {
  const calls = [];
  const ends = new Date(Date.now() + 601e3);
  const { w, ctx, appEl } = await makeWorld(async (fn) => {
    calls.push(fn);
    if (fn === 'njhr_version_status') return Object.assign({}, OK_STATUS, {
      maintenance_active: true, maintenance_mode: 'full',
      maintenance_message: 'ระบบกำลังอัปเดตเวอร์ชันใหม่ กรุณาเข้าสู่ระบบอีกครั้งหลังครบ 10 นาที',
      maintenance_ends_at: ends.toISOString() });
    if (fn === 'njhr_session_check') return EMP;      // ไม่ใช่ SUPER_ADMIN → ห้าม bypass
    if (fn === 'njhr_logout') return {};
    throw new Error('unexpected ' + fn);
  });
  w.localStorage.setItem('njhr_v2_token', 'tok-emp');
  const st = await ctx.guard.checkNow();
  assert.equal(st.blocked, true);
  assert.ok(calls.includes('njhr_logout'), 'เพิกถอน session ฝั่งเซิร์ฟเวอร์');
  assert.equal(w.localStorage.getItem('njhr_v2_token'), null, 'token ถูกล้างจากเครื่อง');
  assert.ok(appEl.innerHTML.includes('ระบบกำลังปรับปรุง'), 'หน้า maintenance');
  const clock = appEl.querySelector('#mt-clock');
  assert.ok(/^(9|10):\d\d$/.test(clock.textContent), 'นับถอยหลังจากเวลาเซิร์ฟเวอร์ ~10 นาที ได้ ' + clock.textContent);
});

T('6. Full Maintenance + SUPER_ADMIN → bypass ได้ (ตรวจ role กับเซิร์ฟเวอร์)', async () => {
  const { w, ctx } = await makeWorld(async (fn) => {
    if (fn === 'njhr_version_status') return Object.assign({}, OK_STATUS, {
      maintenance_active: true, maintenance_mode: 'full',
      maintenance_ends_at: new Date(Date.now() + 600e3).toISOString() });
    if (fn === 'njhr_session_check') return SA;
    throw new Error('unexpected ' + fn);
  });
  w.localStorage.setItem('njhr_v2_token', 'tok-sa');
  const st = await ctx.guard.checkNow();
  assert.equal(st.blocked, false);
  assert.equal(st.superBypass, true);
  assert.equal(w.localStorage.getItem('njhr_v2_token'), 'tok-sa', 'session SUPER_ADMIN ไม่ถูกเพิกถอน');
});

T('7. Maintenance จบ → เปิดระบบใหม่อัตโนมัติ (reload → บังคับ login ใหม่)', async () => {
  let active = true;
  const { w, ctx, reloads } = await makeWorld(async (fn) => {
    if (fn === 'njhr_version_status') return Object.assign({}, OK_STATUS, {
      maintenance_active: active, maintenance_mode: 'full',
      maintenance_ends_at: new Date(Date.now() + 2e3).toISOString() });
    if (fn === 'njhr_session_check') return EMP;
    if (fn === 'njhr_logout') return {};
    throw new Error('unexpected ' + fn);
  });
  w.localStorage.setItem('njhr_v2_token', 'tok-emp');
  const st1 = await ctx.guard.checkNow();
  assert.equal(st1.blocked, true);
  active = false;                                   // SUPER_ADMIN กดปิด / หมดเวลา
  await ctx.guard.checkNow();
  assert.equal(reloads.length, 1, 'reload อัตโนมัติกลับหน้า login โดยไม่ต้องล้าง cache เอง');
});

T('8. Version ไม่ตรง → เพิกถอน session + force reload พร้อม query ใหม่', async () => {
  const calls = [];
  const { w, ctx, replaces } = await makeWorld(async (fn) => {
    calls.push(fn);
    if (fn === 'njhr_version_status') return Object.assign({}, OK_STATUS, { version: 'v2-core-1' });
    if (fn === 'njhr_logout') return {};
    if (fn === 'njhr_session_check') return SA;
    throw new Error('unexpected ' + fn);
  });
  w.localStorage.setItem('njhr_v2_token', 'tok-sa');
  const st = await ctx.guard.checkNow();
  assert.equal(st.blocked, true);
  assert.equal(replaces.length, 1);
  assert.ok(replaces[0].includes('r=v2-core-1'), 'cache-bust ด้วยเวอร์ชันใหม่: ' + replaces[0]);
  assert.equal(w.localStorage.getItem('njhr_v2_token'), null, 'deploy ใหม่ต้อง login ใหม่');
});

T('9. Deploy ไม่ครบ (ประกาศเวอร์ชันแต่ไฟล์เก่า) → หยุดที่หน้าควบคุม ไม่ลูปรีโหลด', async () => {
  const { w, ctx, appEl, replaces } = await makeWorld(async (fn) => {
    if (fn === 'njhr_version_status') return Object.assign({}, OK_STATUS, { version: 'v2-core-9' });
    if (fn === 'njhr_logout') return {};
    if (fn === 'njhr_session_check') { const e = new Error('NO'); throw e; }
    throw new Error('unexpected ' + fn);
  });
  w.sessionStorage.setItem('njhr_v2_reload_v2-core-9', '2');   // จำลองว่ารีโหลดมาแล้ว 2 ครั้ง
  await ctx.guard.checkNow();
  assert.equal(replaces.length, 0, 'ไม่รีโหลดซ้ำอีก');
  assert.ok(appEl.innerHTML.includes('เวอร์ชันไม่ตรงกัน'), 'หน้าควบคุมเวอร์ชันไม่ตรง');
  assert.ok(appEl.innerHTML.includes('v2-core-9') && appEl.innerHTML.includes(ctx.BUILD),
    'ต้องแสดงทั้งเวอร์ชันเซิร์ฟเวอร์และเวอร์ชันไฟล์ในเครื่อง');
  assert.ok(appEl.querySelector('#vg-admin'), 'ต้องมีทางให้ผู้ดูแลระบบเข้าไปแก้เวอร์ชัน');
});

T('9ก. เซิร์ฟเวอร์เก่ากว่าไฟล์ (อัปโหลดแล้วยังไม่ประกาศเวอร์ชัน) → ผู้ดูแลระบบเข้าระบบไปแก้ได้ ไม่ตันถาวร', async () => {
  const { w, ctx, appEl, replaces, reloads } = await makeWorld(async (fn) => {
    if (fn === 'njhr_version_status') return Object.assign({}, OK_STATUS, { version: 'v2-legacy-0' });
    if (fn === 'njhr_logout') return {};
    if (fn === 'njhr_session_check') { throw new Error('NO'); }
    throw new Error('unexpected ' + fn);
  });
  w.sessionStorage.setItem('njhr_v2_reload_v2-legacy-0', '2');
  await ctx.guard.checkNow();
  appEl.querySelector('#vg-admin').click();                       // ผู้ดูแลระบบเลือกเข้าไปแก้เวอร์ชัน
  assert.equal(w.sessionStorage.getItem('njhr_v2_version_override'), 'v2-legacy-0|' + ctx.BUILD,
    'ต้องบันทึกสถานะโหมดแก้ไขเวอร์ชันเฉพาะคู่เวอร์ชันนี้');
  const st = await ctx.guard.checkNow();
  assert.equal(st.blocked, false, 'หลังเลือกโหมดแก้ไข ต้องใช้งานต่อได้เพื่อไปตั้งเวอร์ชัน');
  assert.equal(st.versionMismatch, true);
  assert.ok(w.document.getElementById('v2-ver-banner'), 'ต้องมีแถบเตือนค้างไว้');
  assert.equal(replaces.length, 0, 'ห้าม force-reload อัตโนมัติซ้ำ (การรีโหลดครั้งนี้ผู้ใช้กดเอง)');
  assert.equal(reloads.length, 1, 'กดปุ่มแล้วรีโหลด 1 ครั้งเพื่อเข้าโหมดแก้ไขเวอร์ชัน');
});

T('9ข. โหมดแก้ไขเวอร์ชันใช้ได้เฉพาะคู่เวอร์ชันเดิม · ตั้งเวอร์ชันตรงแล้วแถบเตือนหาย', async () => {
  let ver = 'v2-legacy-0';
  const { w, ctx, appEl } = await makeWorld(async (fn) => {
    if (fn === 'njhr_version_status') return Object.assign({}, OK_STATUS, { version: ver });
    if (fn === 'njhr_logout') return {};
    if (fn === 'njhr_session_check') { throw new Error('NO'); }
    throw new Error('unexpected ' + fn);
  });
  w.sessionStorage.setItem('njhr_v2_version_override', 'v2-legacy-0|' + ctx.BUILD);
  assert.equal((await ctx.guard.checkNow()).versionMismatch, true);
  ver = 'v2-legacy-7';                                            // เซิร์ฟเวอร์เปลี่ยนเป็นเวอร์ชันอื่น
  w.sessionStorage.setItem('njhr_v2_reload_v2-legacy-7', '0');
  const st2 = await ctx.guard.checkNow();
  assert.equal(st2.blocked, true, 'เวอร์ชันคู่ใหม่ต้องไม่ถูกข้ามด้วย override เดิม');
  ver = ctx.BUILD;                                                // ผู้ดูแลระบบตั้งเวอร์ชันให้ตรงไฟล์แล้ว
  const st3 = await ctx.guard.checkNow();
  assert.equal(st3.blocked, false);
  assert.equal(w.sessionStorage.getItem('njhr_v2_version_override'), null, 'ต้องล้างสถานะโหมดแก้ไข');
  assert.ok(!w.document.getElementById('v2-ver-banner'), 'แถบเตือนต้องหาย');
});

T('10. Error ใน module เดียว → Error State ไม่ใช่หน้าว่าง (Error Boundary)', async () => {
  const { w, ctx, appEl } = await makeWorld(async (fn) => {
    if (fn === 'njhr_version_status') return OK_STATUS;
    throw new Error('unexpected ' + fn);
  });
  const el = w.document.createElement('div'); appEl.appendChild(el);
  await ctx.boundary.run(el, () => { throw new Error('บึ้มทดสอบ'); });
  assert.ok(el.innerHTML.includes('เกิดข้อผิดพลาดในหน้านี้'), 'มี Error State');
  assert.ok(el.innerHTML.includes('บึ้มทดสอบ'), 'แสดง detail');
  assert.ok(el.querySelector('#v2-retry'), 'มีปุ่มลองใหม่');
});

T('11. Login ถูกบล็อกระหว่าง Full Maintenance', async () => {
  const { w, ctx, appEl } = await makeWorld(async (fn) => {
    if (fn === 'njhr_version_status') return Object.assign({}, OK_STATUS, {
      maintenance_active: true, maintenance_mode: 'full',
      maintenance_ends_at: new Date(Date.now() + 600e3).toISOString() });
    if (fn === 'njhr_session_check') { throw Object.assign(new Error('NO_SESSION'), {}); }
    if (fn === 'njhr_login') { throw new Error('ห้ามถึงจุดนี้ — login ต้องถูกบล็อกก่อน'); }
    if (fn === 'njhr_logout') return {};
    throw new Error('unexpected ' + fn);
  });
  // จำลองอยู่หน้า login แล้วกด submit ระหว่าง maintenance
  const mod = await ctx.load('../modules/login/login.js');
  const host = w.document.createElement('div'); appEl.appendChild(host);
  mod.mount(host, ctx);
  host.querySelector('#lg-user').value = 'somchai';
  host.querySelector('#lg-pass').value = 'x';
  host.querySelector('#lg-form').dispatchEvent(new w.Event('submit', { cancelable: true }));
  await new Promise(r => setTimeout(r, 50));
  assert.equal(w.localStorage.getItem('njhr_v2_token'), null, 'ไม่มี token — login ไม่ผ่าน');
  assert.ok(appEl.innerHTML.includes('ระบบกำลังปรับปรุง'), 'ถูกพาไปหน้า maintenance');
});

// ── รัน ─────────────────────────────────────────────────────
let pass = 0, fail = 0;
const realSetInterval = globalThis.setInterval, realSetTimeout = globalThis.setTimeout;
for (const t of results) {
  const ids = [];
  globalThis.setInterval = (...a) => { const id = realSetInterval(...a); ids.push(['i', id]); return id; };
  globalThis.setTimeout  = (...a) => { const id = realSetTimeout(...a);  ids.push(['t', id]); return id; };
  try { await t.fn(); console.log('PASS  ' + t.name); pass++; }
  catch (e) { console.log('FAIL  ' + t.name + '\n      → ' + e.message); fail++; }
  finally {
    globalThis.setInterval = realSetInterval; globalThis.setTimeout = realSetTimeout;
    ids.forEach(([k, id]) => (k === 'i' ? clearInterval(id) : clearTimeout(id)));
  }
}
console.log('\nสรุป: ' + pass + ' PASS · ' + fail + ' FAIL จาก ' + results.length + ' เคส');
process.exit(fail ? 1 : 0);
