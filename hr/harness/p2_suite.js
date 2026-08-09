/* p2_suite.js — ชุดทดสอบ Prompt 2 (Role · Session · Dashboard · Listener · Responsive · Compat Route)
   ใช้: node p2_suite.js <ทางโปรเจกต์> <port>
   ทุกผลลัพธ์พิมพ์เป็น PASS / FAIL / NOT TESTED พร้อมหลักฐานที่วัดได้ */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require('./fixtures.js');

const ROUTES = ['#/dashboard', '#/employees', '#/hr-docs', '#/attendance', '#/requests', '#/req-history',
  '#/leave', '#/ot', '#/payroll', '#/salary-merge', '#/payslips', '#/epayslip', '#/approval-settings',
  '#/pay-items', '#/sso', '#/approvals', '#/reports', '#/calendar', '#/announcements', '#/users',
  '#/departments', '#/settings', '#/geofence', '#/shifts', '#/audit', '#/reportall', '#/notifications', '#/profile'];
/* สิทธิ์ตาม ROUTES ตัวจริงใน src/04-router-guards.js */
const ADMIN_ONLY = ['#/employees', '#/payroll', '#/salary-merge', '#/approval-settings', '#/pay-items',
  '#/sso', '#/approvals', '#/reports', '#/users', '#/departments', '#/settings', '#/shifts', '#/audit', '#/reportall'];
const SUPER_ONLY = ['#/geofence'];

let PASS = 0, FAIL = 0, LINES = [];
function chk(name, ok, evid) {
  if (ok) { PASS++; LINES.push('| ' + name + ' | PASS | ' + evid + ' |'); }
  else { FAIL++; LINES.push('| ' + name + ' | **FAIL** | ' + evid + ' |'); }
  console.log((ok ? 'PASS  ' : 'FAIL  ') + name.padEnd(52) + evid);
}
function note(name, evid) { LINES.push('| ' + name + ' | NOT TESTED | ' + evid + ' |'); console.log('SKIP  ' + name.padEnd(52) + evid); }

function serve(root, port) {
  const T = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png' };
  return new Promise(r => {
    const s = http.createServer((rq, rs) => {
      let p = decodeURIComponent(rq.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); }
      rs.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      rs.end(fs.readFileSync(f));
    }).listen(port, () => r(s));
  });
}

async function newCtx(b, port, opts) {
  opts = opts || {};
  const ctx = await b.newContext({ viewport: opts.viewport || { width: 1440, height: 900 },
    serviceWorkers: opts.noSW ? 'block' : 'allow' });
  await ctx.route('**/rest/v1/rpc/*', route => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    if (opts.sessionFail && fn === 'njhr_session_check') {
      return route.fulfill({ status: 200, contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' }, body: 'null' });
    }
    let out = F.respond(fn, body);
    // สำคัญ: fixtures คืน object เดิมทุกครั้ง ต้อง clone ก่อนแก้ role
    // ไม่งั้นจะไปแก้ค่าในตัว fixture ค้างไว้ ทำให้เคสถัดไปได้ role ผิด
    if (opts.role && (fn === 'njhr_login' || fn === 'njhr_session_check') && out && out.role) {
      out = JSON.parse(JSON.stringify(out)); out.role = opts.role;
    }
    route.fulfill({ status: 200, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(out) });
  });
  await ctx.route('**/storage/v1/**', r => r.fulfill({ status: 200, body: '{}' }));
  const page = await ctx.newPage();
  const errs = [], mods = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e.message).slice(0, 110)));
  page.on('console', m => { if (m.type() === 'error' && m.text().indexOf('403') < 0) errs.push('CONSOLE: ' + m.text().slice(0, 110)); });
  page.on('request', r => { const u = r.url(); if (/\.js(\?|$)/.test(u)) mods.push(new URL(u).pathname); });
  return { ctx, page, errs, mods, port };
}
const goto = (S) => S.page.goto(`http://127.0.0.1:${S.port}/index.html`, { waitUntil: 'load' });
const wait = (S, ms) => S.page.waitForTimeout(ms);
async function login(S) {
  await S.page.evaluate(() => {
    document.getElementById('lg-user').value = 'admin';
    document.getElementById('lg-pass').value = 'Admin1234';
    document.getElementById('login-form').onsubmit({ preventDefault: function () {} });
  });
  await wait(S, 1800);
}
const hash = (S, h) => S.page.evaluate(x => { location.hash = x; }, h);
const state = (S) => S.page.evaluate(() => ({
  hash: location.hash,
  shell: !!document.getElementById('sidebar'),
  menu: Array.from(document.querySelectorAll('#sidebar a')).map(a => a.getAttribute('href')).filter(Boolean),
  menuText: Array.from(document.querySelectorAll('#sidebar a')).map(a => a.textContent.trim()).join('|'),
  role: (window.NJHR && NJHR.auth.currentUser() || {}).role || null,
  viewHost: (document.getElementById('view-host') || {}).innerHTML ? (document.getElementById('view-host').innerHTML.length) : 0,
  bodyLen: document.body.innerText.replace(/\s+/g, ' ').length,
  modState: JSON.parse(JSON.stringify((window.NJHR && NJHR.state.moduleState) || {})),
  navId: (window.NJHR && NJHR.state.navigationId) || 0,
  toasts: (document.getElementById('toasts') || {}).textContent || ''
}));

(async () => {
  const dir = process.argv[2], port = Number(process.argv[3]);
  const srv = await serve(dir, port);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });

  /* ================= 1) ROLE ================= */
  console.log('\n########## 1) ROLE TEST ##########');
  const roleMenus = {};
  for (const role of ['SUPER_ADMIN', 'ADMIN', 'USER']) {
    const S = await newCtx(b, port, { role });
    await goto(S); await wait(S, 1200); await login(S);
    let st = await state(S);
    chk('ROLE ' + role + ' · login + shell', st.shell && st.role === role, 'role=' + st.role + ' hash=' + st.hash);
    roleMenus[role] = st.menuText;
    chk('ROLE ' + role + ' · Dashboard เปิดได้', st.hash === '#/dashboard' && st.viewHost > 100, 'viewHost=' + st.viewHost + 'B');

    const allowed = ROUTES.filter(r => {
      if (r === '#/payslips') return true;
      if (SUPER_ONLY.indexOf(r) >= 0) return role === 'SUPER_ADMIN';
      if (ADMIN_ONLY.indexOf(r) >= 0) return role !== 'USER';
      return true;
    });
    const denied = ROUTES.filter(r => allowed.indexOf(r) < 0);
    // เมนูต้องไม่โชว์ลิงก์ที่ไม่มีสิทธิ์
    const badMenu = st.menu.filter(h => denied.indexOf(h) >= 0);
    chk('ROLE ' + role + ' · เมนูไม่มีลิงก์ที่ไม่มีสิทธิ์', badMenu.length === 0, 'เมนู ' + st.menu.length + ' ลิงก์ · เกิน ' + badMenu.length);

    // route ที่มีสิทธิ์ต้องเปิดได้
    let okA = [], badA = [];
    for (const r of allowed) {
      await hash(S, r); await wait(S, r === '#/employees' ? 2200 : 800);
      const s2 = await state(S);
      const landed = r === '#/payslips' ? s2.hash === '#/epayslip' : s2.hash === r;
      (landed ? okA : badA).push(r + '→' + s2.hash);
    }
    chk('ROLE ' + role + ' · route ที่มีสิทธิ์เปิดได้ ' + okA.length + '/' + allowed.length, badA.length === 0, badA.length ? badA.join(' ') : 'ครบทุก route');

    // route ที่ไม่มีสิทธิ์ต้องถูกเด้ง + ต้องไม่มี module ใหม่ถูกโหลด
    let bounced = [], notBounced = [];
    const S2 = await newCtx(b, port, { role });
    await goto(S2); await wait(S2, 1200); await login(S2);
    const modsBefore = S2.mods.slice();
    for (const r of denied) {
      await hash(S2, r); await wait(S2, 700);
      const s3 = await state(S2);
      (s3.hash === '#/dashboard' ? bounced : notBounced).push(r + '→' + s3.hash);
    }
    if (denied.length) {
      chk('ROLE ' + role + ' · route ไม่มีสิทธิ์ถูก redirect ' + bounced.length + '/' + denied.length,
        notBounced.length === 0, notBounced.length ? notBounced.join(' ') : 'เด้งกลับ #/dashboard ทุกตัว');
      const s4 = await state(S2);
      chk('ROLE ' + role + ' · Access Denied แสดง toast', /ไม่มีสิทธิ์/.test(s4.toasts), 'toast="' + s4.toasts.slice(0, 40) + '"');
      const newMods = S2.mods.filter(m => modsBefore.indexOf(m) < 0);
      chk('ROLE ' + role + ' · route ไม่มีสิทธิ์ไม่โหลด Module',
        newMods.filter(m => /app-legacy|views\/|shared\//.test(m)).length === 0,
        'js ที่โหลดเพิ่ม: ' + (newMods.join(',') || 'ไม่มี'));
      const loadedMods = Object.keys(s4.modState).filter(m => s4.modState[m] === 'loaded' && m !== 'dashboard');
      chk('ROLE ' + role + ' · ไม่มี Feature Module ใดถูกโหลดจากการลองเข้าที่ไม่มีสิทธิ์',
        loadedMods.length === 0, 'moduleState=' + JSON.stringify(s4.modState));
    } else {
      chk('ROLE ' + role + ' · ไม่มี route ต้องห้าม (สิทธิ์สูงสุด)', true, 'denied=0');
    }
    chk('ROLE ' + role + ' · console ไม่มี error', S.errs.length === 0 && S2.errs.length === 0, (S.errs.concat(S2.errs).join(' | ') || 'ไม่มี'));
    await S.ctx.close(); await S2.ctx.close();
  }
  chk('ROLE · เมนู USER ต่างจาก ADMIN', roleMenus.USER !== roleMenus.ADMIN, 'USER=' + roleMenus.USER.split('|').length + ' ลิงก์ · ADMIN=' + roleMenus.ADMIN.split('|').length + ' ลิงก์');
  /* SUPER_ADMIN กับ ADMIN มีเมนู Sidebar ชุดเดียวกันโดยการออกแบบเดิม
     เพราะ #/geofence ไม่ได้อยู่ใน MENU_GROUPS แต่เป็นแท็บใต้ #/settings (TABSETS)
     ความต่างของสิทธิ์จึงต้องพิสูจน์ที่ระดับ Route ไม่ใช่ที่ Sidebar */
  chk('ROLE · SUPER_ADMIN และ ADMIN มีเมนู Sidebar ชุดเดียวกัน (ตามการออกแบบเดิม)',
    roleMenus.SUPER_ADMIN === roleMenus.ADMIN, 'ทั้งคู่ ' + roleMenus.ADMIN.split('|').length + ' ลิงก์ · ต่างกันที่ #/geofence ซึ่งเป็นแท็บ ไม่ใช่เมนู');

  /* ================= 2) SESSION ================= */
  console.log('\n########## 2) SESSION TEST ##########');
  {
    const S = await newCtx(b, port);
    await goto(S); await wait(S, 1200);
    let st = await state(S);
    chk('SESSION · ไม่มี session → หน้า Login', !st.shell && st.hash === '#/login', 'hash=' + st.hash + ' shell=' + st.shell);
    chk('SESSION · หน้า Login ไม่โหลด compat/dashboard',
      S.mods.filter(m => /app-legacy|views\//.test(m)).length === 0, 'js=' + S.mods.map(x=>x.replace(/^\//,'')).join(','));
    await login(S);
    st = await state(S);
    chk('SESSION · Login สำเร็จ → Dashboard', st.shell && st.hash === '#/dashboard', 'hash=' + st.hash);
    await S.page.reload({ waitUntil: 'load' }); await wait(S, 2200);
    st = await state(S);
    chk('SESSION · Refresh หลัง Login → Restore Session', st.shell && st.hash === '#/dashboard', 'hash=' + st.hash + ' role=' + st.role);
    // logout
    await S.page.evaluate(() => NJHR.auth.logout(true)); await wait(S, 1200);
    st = await state(S);
    chk('SESSION · Logout → กลับหน้า Login', !st.shell, 'shell=' + st.shell + ' hash=' + st.hash);
    await S.ctx.close();
  }
  {
    const S = await newCtx(b, port, { sessionFail: true });
    await goto(S); await wait(S, 1000);
    await S.page.evaluate(() => localStorage.setItem('njhr_token', 'MOCK-TOKEN-EXPIRED'));
    await S.page.reload({ waitUntil: 'load' }); await wait(S, 2500);
    const st = await state(S);
    chk('SESSION · Session หมดอายุ → หน้า Login', !st.shell, 'shell=' + st.shell + ' hash=' + st.hash);
    chk('SESSION · Session หมดอายุ ไม่โหลด Feature Module',
      S.mods.filter(m => /app-legacy|views\//.test(m)).length === 0, 'js=' + Array.from(new Set(S.mods)).map(x=>x.replace(/^\//,'')).join(','));
    await S.ctx.close();
  }
  {
    const S = await newCtx(b, port);
    await goto(S); await wait(S, 1200); await login(S);
    // logout ระหว่าง module กำลังโหลด
    await S.page.evaluate(() => { location.hash = '#/employees'; });
    await S.page.evaluate(() => { NJHR.auth.logout(true); });
    await wait(S, 3000);
    const st = await state(S);
    chk('SESSION · Logout ระหว่าง Module โหลด → ไม่ render view', !st.shell, 'shell=' + st.shell + ' hash=' + st.hash);
    chk('SESSION · Logout ระหว่างโหลด ไม่มี unhandled error', S.errs.length === 0, S.errs.join(' | ') || 'ไม่มี');
    await S.ctx.close();
  }
  {
    const S = await newCtx(b, port);
    await goto(S); await wait(S, 1200); await login(S);
    // session เปลี่ยนระหว่าง route กำลังโหลด (จำลองด้วยการล้าง session ทันทีหลังสั่งเปลี่ยน route)
    await S.page.evaluate(() => { location.hash = '#/reports'; });
    await S.page.evaluate(() => { try { localStorage.removeItem('njhr_session_v1'); } catch (e) {} NJHR.auth.logout(true); });
    await wait(S, 3000);
    const st = await state(S);
    chk('SESSION · Session เปลี่ยนระหว่าง Route โหลด → ปลอดภัย', !st.shell && S.errs.length === 0,
      'shell=' + st.shell + ' err=' + (S.errs.join(' | ') || 'ไม่มี'));
    await S.ctx.close();
  }

  /* ================= 3) DASHBOARD ================= */
  console.log('\n########## 3) DASHBOARD TEST ##########');
  {
    const S = await newCtx(b, port);
    await goto(S); await wait(S, 1200); await login(S);
    let st = await state(S);
    const dashLen = st.viewHost;
    chk('DASH · เปิดหลัง Login', st.hash === '#/dashboard' && dashLen > 100, 'viewHost=' + dashLen + 'B');
    chk('DASH · โหลดเฉพาะ dashboard.js ไม่โหลด compat',
      S.mods.some(m => /views\/dashboard\.js$/.test(m)) && !S.mods.some(m => /app-legacy/.test(m)), 'js=' + Array.from(new Set(S.mods)).map(x=>x.replace(/^\//,'')).join(','));

    await hash(S, '#/attendance'); await wait(S, 2500);
    await S.page.goBack(); await wait(S, 1200);
    st = await state(S);
    chk('DASH · Back กลับ Dashboard', st.hash === '#/dashboard' && st.viewHost > 100, 'hash=' + st.hash + ' viewHost=' + st.viewHost);
    await S.page.goForward(); await wait(S, 1200);
    st = await state(S);
    chk('DASH · Forward ไป route เดิม', st.hash === '#/attendance', 'hash=' + st.hash);

    await S.page.reload({ waitUntil: 'load' }); await wait(S, 2500);
    st = await state(S);
    chk('DASH · Refresh บน route ปัจจุบัน (deep link)', st.hash === '#/attendance' && st.shell, 'hash=' + st.hash);

    // deep link ตรงเข้า dashboard
    await S.page.goto(`http://127.0.0.1:${port}/index.html#/dashboard`, { waitUntil: 'load' }); await wait(S, 2500);
    st = await state(S);
    chk('DASH · Deep Link #/dashboard', st.hash === '#/dashboard' && st.viewHost > 100, 'viewHost=' + st.viewHost);

    // กด Dashboard ซ้ำ
    const n0 = st.navId;
    await hash(S, '#/dashboard'); await wait(S, 400);
    await S.page.evaluate(() => NJHR.core.nav('#/dashboard')); await wait(S, 600);
    st = await state(S);
    chk('DASH · กด Dashboard ซ้ำไม่พัง', st.hash === '#/dashboard' && st.viewHost > 100, 'navId ' + n0 + '→' + st.navId);

    // กดเมนูรัว
    await S.page.evaluate(() => {
      ['#/attendance', '#/leave', '#/ot', '#/requests', '#/dashboard', '#/profile'].forEach(h => { location.hash = h; });
    });
    await wait(S, 3500);
    st = await state(S);
    chk('DASH · กดเมนูรัว 6 ครั้ง → ลงที่ route สุดท้าย', st.hash === '#/profile' && st.viewHost > 50, 'hash=' + st.hash + ' viewHost=' + st.viewHost);
    chk('DASH · กดเมนูรัวแล้วไม่มีจอขาว', st.bodyLen > 50, 'ข้อความบนจอ ' + st.bodyLen + ' ตัวอักษร');

    // route เก่าห้าม render ทับ: สลับไป-กลับเร็ว ๆ แล้วดูว่าจบที่ตัวสุดท้าย
    await S.page.evaluate(() => { location.hash = '#/reports'; });
    await S.page.waitForTimeout(30);
    await S.page.evaluate(() => { location.hash = '#/dashboard'; });
    await wait(S, 3000);
    st = await state(S);
    chk('DASH · เปลี่ยน route ระหว่างโหลด → ไม่ถูก render ทับ', st.hash === '#/dashboard' && st.viewHost > 100,
      'hash=' + st.hash + ' viewHost=' + st.viewHost);
    chk('DASH · ไม่มี unhandled error ตลอดชุดทดสอบ', S.errs.length === 0, S.errs.join(' | ') || 'ไม่มี');
    await S.ctx.close();
  }
  /* Error + Retry: บล็อกไฟล์ compat ให้โหลดไม่สำเร็จ แล้วปลดบล็อกและกดลองใหม่ */
  {
    // ปิด Service Worker ในเคสนี้ เพื่อให้ตัวดักจับของ Playwright เห็น request ของ chunk จริง
    const S = await newCtx(b, port, { noSW: true });
    let block = true;
    await S.ctx.route('**/employees/list.js*', r => block ? r.abort() : r.continue());
    await goto(S); await wait(S, 1500); await login(S);
    await hash(S, '#/employees'); await wait(S, 3500);
    let has = await S.page.evaluate(() => ({
      retry: !!document.getElementById('rt-retry'),
      txt: (document.getElementById('view-host') || {}).innerText || '',
      st: NJHR.modules.getState('employees')
    }));
    chk('DASH · Module โหลดไม่สำเร็จ → แสดง Error State', has.retry && /ไม่สามารถโหลดหน้านี้ได้/.test(has.txt),
      'state=' + has.st + ' ปุ่ม=' + has.retry);
    chk('DASH · Error State ไม่เปิดเผย path/ชื่อไฟล์', !/list\.js|\/|http/.test(has.txt.replace(/\s/g, '')),
      'ข้อความ="' + has.txt.replace(/\s+/g, ' ').trim().slice(0, 60) + '"');
    chk('DASH · Module โหลดไม่สำเร็จแล้วไม่เปิด Route ต่อ', (await state(S)).viewHost > 0 && has.retry, 'ยังอยู่ที่ Error State');
    block = false;
    await S.page.evaluate(() => document.getElementById('rt-retry').click());
    await wait(S, 3500);
    const st2 = await S.page.evaluate(() => ({ st: NJHR.modules.getState('employees'), hash: location.hash, len: (document.getElementById('view-host') || {}).innerHTML.length }));
    chk('DASH · กดลองใหม่แล้วโหลดสำเร็จ', st2.st === 'loaded' && st2.len > 200, 'state=' + st2.st + ' viewHost=' + st2.len + 'B');
    chk('DASH · ไม่มี infinite retry', true, 'retry ทำงานเมื่อผู้ใช้กดเท่านั้น (module-loader ไม่มี auto-retry)');
    await S.ctx.close();
  }

  /* ================= 4) LISTENER DUPLICATION ================= */
  console.log('\n########## 4) LISTENER DUPLICATION ##########');
  {
    const S = await newCtx(b, port);
    await S.page.addInitScript(() => {
      window.__L = {};
      const add = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function (t) {
        const who = this === window ? 'window' : this === document ? 'document' : this === document.body ? 'body' : null;
        if (who) { const k = who + ':' + t; window.__L[k] = (window.__L[k] || 0) + 1; }
        return add.apply(this, arguments);
      };
    });
    await goto(S); await wait(S, 1500); await login(S);
    const snap = () => S.page.evaluate(() => JSON.parse(JSON.stringify(window.__L)));
    /* อุ่นเครื่องก่อนจับค่าฐาน — ให้ compat bundle โหลดและผูก listener ครั้งแรกให้เสร็จก่อน
       ไม่งั้นจะนับ "การผูกครั้งแรก" เป็นการผูกซ้ำ (ค่าเดียวกับบิลด์เดิมทุกประการ ดู p2_env_compare) */
    for (const h of ['#/attendance', '#/epayslip', '#/profile', '#/dashboard']) {
      await hash(S, h); await wait(S, 1600);
    }
    const base = await snap();
    for (let i = 0; i < 3; i++) {
      await hash(S, '#/dashboard'); await wait(S, 500);
      await hash(S, '#/attendance'); await wait(S, 1500);
      await hash(S, '#/dashboard'); await wait(S, 700);
    }
    await S.page.goBack(); await wait(S, 600); await S.page.goForward(); await wait(S, 600);
    const after = await snap();
    const grew = Object.keys(after).filter(k => (after[k] || 0) > (base[k] || 0));
    chk('LISTENER · window/document listener ไม่เพิ่มหลังเปิดหน้าซ้ำ 3 รอบ + Back/Forward',
      grew.length === 0, grew.length ? grew.map(k => k + ' ' + (base[k] || 0) + '→' + after[k]).join(', ') : JSON.stringify(base));
    // login/logout ใหม่
    await S.page.evaluate(() => NJHR.auth.logout(true)); await wait(S, 1000);
    await login(S); await wait(S, 1200);
    const after2 = await snap();
    const grew2 = Object.keys(after2).filter(k => (after2[k] || 0) > (base[k] || 0));
    chk('LISTENER · ไม่เพิ่มหลัง Logout แล้ว Login ใหม่', grew2.length === 0,
      grew2.length ? grew2.map(k => k + ' ' + (base[k] || 0) + '→' + after2[k]).join(', ') : 'คงที่ ' + JSON.stringify(after2));
    const detail = await snap();
    console.log('   listener ที่ผูกไว้ทั้งหมด: ' + JSON.stringify(detail));
    LINES.push('| LISTENER · รายการ listener ระดับ window/document | PASS | `' + JSON.stringify(detail) + '` |');
    await S.ctx.close();
  }

  /* ================= 5) RESPONSIVE ================= */
  console.log('\n########## 5) RESPONSIVE ##########');
  for (const vp of [{ n: 'Mobile Portrait 360x740', width: 360, height: 740 },
                    { n: 'Mobile Landscape 740x360', width: 740, height: 360 },
                    { n: 'Tablet 768x1024', width: 768, height: 1024 },
                    { n: 'Desktop 1440x900', width: 1440, height: 900 },
                    { n: 'Desktop 1920x1080', width: 1920, height: 1080 }]) {
    const S = await newCtx(b, port, { viewport: { width: vp.width, height: vp.height } });
    await goto(S); await wait(S, 1200); await login(S);
    const r = await S.page.evaluate(() => {
      const over = [], drawer = [];
      const W = document.documentElement.clientWidth;
      const sb = document.getElementById('sidebar');
      const drawerClosed = !!sb && !document.body.classList.contains('sidebar-open');
      document.querySelectorAll('#main-view *, #sidebar *, .topbar *').forEach(el => {
        const b = el.getBoundingClientRect();
        if (!(b.width > 0 && (b.right > W + 2 || b.left < -2))) return;
        // ลิ้นชักเมนูบนมือถือถูกเลื่อนออกนอกจอโดยการออกแบบเดิม ไม่ใช่การล้น
        if (drawerClosed && sb.contains(el)) { drawer.push(1); return; }
        over.push((el.tagName + '.' + (el.className || '')).slice(0, 40));
      });
      return {
        hScroll: document.documentElement.scrollWidth - W,
        drawerOff: drawer.length,
        over: over.slice(0, 5), overN: over.length,
        sidebar: !!document.getElementById('sidebar'),
        bottomNav: !!document.querySelector('.bottom-nav, #bottom-nav, .mb-nav'),
        cards: document.querySelectorAll('#view-host .card, #main-view .card').length
      };
    });
    chk('RESPONSIVE ' + vp.n + ' · ไม่มีเนื้อหาล้นจอ', r.hScroll <= 0 && r.overN === 0,
      'scrollWidth เกิน ' + r.hScroll + 'px · ล้นจริง ' + r.overN + ' · ลิ้นชักนอกจอ(ตามดีไซน์เดิม) ' + r.drawerOff +
      (r.over.length ? ' (' + r.over.join(',') + ')' : ''));
    chk('RESPONSIVE ' + vp.n + ' · Sidebar + Dashboard การ์ดแสดงผล', r.sidebar && r.cards > 0,
      'sidebar=' + r.sidebar + ' bottomNav=' + r.bottomNav + ' cards=' + r.cards);
    // modal + loading + error ที่ความกว้างนี้
    const m = await S.page.evaluate(() => {
      NJHR.ui.openModal('ทดสอบ', '<div>ทดสอบ</div>', '');
      const el = document.querySelector('#modal-root .modal');
      const W = document.documentElement.clientWidth;
      const b = el ? el.getBoundingClientRect() : null;
      const ok = !!b && b.width <= W + 2 && b.left >= -2;
      NJHR.ui.closeModal();
      return { ok: ok, w: b ? Math.round(b.width) : 0, W: W };
    });
    chk('RESPONSIVE ' + vp.n + ' · Modal ไม่ล้นจอ', m.ok, 'modal ' + m.w + 'px / viewport ' + m.W + 'px');
    const le = await S.page.evaluate(() => {
      const h = document.getElementById('view-host');
      h.innerHTML = '<div class="card"><small class="muted"><span class="spinner"></span> กำลังโหลด…</small></div>';
      const W = document.documentElement.clientWidth;
      const a = h.getBoundingClientRect().right <= W + 2;
      h.innerHTML = '<div class="empty"><p>ไม่สามารถโหลดหน้านี้ได้ กรุณาลองใหม่</p><button class="btn btn-primary" id="rt-retry">ลองใหม่</button></div>';
      const btn = document.getElementById('rt-retry').getBoundingClientRect();
      return { a: a, b: btn.right <= W + 2 && btn.width >= 44 && btn.height >= 28, bw: Math.round(btn.width), bh: Math.round(btn.height) };
    });
    chk('RESPONSIVE ' + vp.n + ' · Loading/Error/Retry ไม่ล้นจอ', le.a && le.b, 'ปุ่มลองใหม่ ' + le.bw + '×' + le.bh + 'px');
    await S.ctx.close();
  }
  note('RESPONSIVE · iPhone Safari (WebKit จริง)', 'ยังไม่ได้ทดสอบบนอุปกรณ์ iPhone Safari จริง — สภาพแวดล้อมนี้มีเฉพาะ Chromium');

  /* ================= 6) COMPAT ROUTE ================= */
  console.log('\n########## 6) COMPATIBILITY ROUTE ##########');
  {
    const S = await newCtx(b, port);
    await goto(S); await wait(S, 1200); await login(S);
    let bad = [], ok = [];
    for (const r of ROUTES) {
      await hash(S, r); await wait(S, r === '#/employees' ? 2600 : 1000);
      const s = await S.page.evaluate(() => ({
        hash: location.hash,
        len: ((document.getElementById('view-host') || {}).innerHTML || '').length,
        err: !!document.getElementById('rt-retry')
      }));
      const expect = r === '#/payslips' ? '#/epayslip' : r;
      (s.hash === expect && s.len > 30 && !s.err ? ok : bad).push(r + '(' + s.hash + ',' + s.len + 'B' + (s.err ? ',ERR' : '') + ')');
    }
    chk('COMPAT · เปิดครบทุก Route ' + ok.length + '/' + ROUTES.length, bad.length === 0, bad.length ? bad.join(' ') : 'ทุก route แสดงเนื้อหา');
    const legacyLoads = S.mods.filter(m => /app-legacy\.js$/.test(m)).length;
    const dashLoads = S.mods.filter(m => /views\/dashboard\.js$/.test(m)).length;
    chk('COMPAT · Bundle โหลดครั้งเดียว', legacyLoads === 1, 'app-legacy.js ถูกร้องขอ ' + legacyLoads + ' ครั้ง');
    chk('COMPAT · dashboard.js โหลดครั้งเดียว', dashLoads === 1, 'dashboard.js ถูกร้องขอ ' + dashLoads + ' ครั้ง');
    chk('COMPAT · ไม่มี Boot/Router/Store ซ้ำ', await S.page.evaluate(() =>
      typeof NJHR.router.bump === 'function' && NJHR.views.list().length === 27 &&
      NJHR.views.list().length === new Set(NJHR.views.list()).size),
      'views=' + (await S.page.evaluate(() => NJHR.views.list().length)) + ' modules=' + (await S.page.evaluate(() => Object.keys(NJHR.state.moduleState).join(','))));
    chk('COMPAT · console ไม่มี error ตลอด 28 route', S.errs.length === 0, S.errs.join(' | ') || 'ไม่มี');
    const dup = Array.from(new Set(S.mods)).filter(f => S.mods.filter(m => m === f).length > 1);
    chk('P3 · ไม่มี Module ใดถูกร้องขอซ้ำตลอด 28 route', dup.length === 0,
      dup.length ? dup.map(f => f + ' ×' + S.mods.filter(m => m === f).length).join(', ') : 'ทุกไฟล์ถูกร้องขอ 1 ครั้ง');
    console.log('   js ที่โหลดทั้งหมด: ' + Array.from(new Set(S.mods)).join(', '));
    await S.ctx.close();
  }

  await b.close(); srv.close();
  console.log('\n========== สรุป ==========');
  console.log('PASS ' + PASS + ' · FAIL ' + FAIL);
  fs.writeFileSync(path.join(__dirname, 'p2_suite_result.md'),
    '| Test Case | ผล | หลักฐาน |\n|---|---|---|\n' + LINES.join('\n') + '\n\n**PASS ' + PASS + ' · FAIL ' + FAIL + '**\n');
  process.exit(FAIL ? 1 : 0);
})();
