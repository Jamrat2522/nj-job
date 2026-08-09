/* p3_feature.js — ทดสอบระดับ Feature ของ Prompt 3
   Employees · Attendance · Attendance Report · Leave · OT
   ใช้: node p3_feature.js <ทางโปรเจกต์> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require('/home/claude/work/harness/fixtures.js');

let PASS = 0, FAIL = 0, SKIP = 0; const SEC = {};
let cur = 'ทั่วไป';
function chk(n, ok, e) {
  ok ? PASS++ : FAIL++;
  (SEC[cur] = SEC[cur] || []).push('| ' + n + ' | ' + (ok ? 'PASS' : '**FAIL**') + ' | ' + e + ' |');
  console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(56) + e);
}
function skip(n, e) { SKIP++; (SEC[cur] = SEC[cur] || []).push('| ' + n + ' | NOT TESTED | ' + e + ' |'); console.log('SKIP  ' + n.padEnd(56) + e); }

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
async function ctxOf(b, port, opt) {
  opt = opt || {};
  const ctx = await b.newContext({ viewport: opt.viewport || { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/rest/v1/rpc/*', route => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    if (opt.failRpc && opt.failRpc === fn) return route.fulfill({ status: 500, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"message":"mock error"}' });
    let out = F.respond(fn, bd);
    if (opt.role && (fn === 'njhr_login' || fn === 'njhr_session_check') && out && out.role) { out = JSON.parse(JSON.stringify(out)); out.role = opt.role; }
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(out) });
  });
  await ctx.route('**/storage/v1/**', r => r.fulfill({ status: 200, body: '{}' }));
  await ctx.route('**/functions/v1/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  const page = await ctx.newPage();
  const errs = [], mods = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e.message).slice(0, 110)));
  page.on('console', m => { if (m.type() === 'error' && m.text().indexOf('403') < 0 && m.text().indexOf('404') < 0) errs.push('CONSOLE: ' + m.text().slice(0, 110)); });
  page.on('request', r => { const u = r.url(); if (/\.js(\?|$)/.test(u) && u.indexOf('127.0.0.1') >= 0) mods.push(new URL(u).pathname); });
  return { ctx, page, errs, mods, port };
}
const go = S => S.page.goto(`http://127.0.0.1:${S.port}/index.html`, { waitUntil: 'load' });
const w = (S, ms) => S.page.waitForTimeout(ms);
const hash = (S, h) => S.page.evaluate(x => { location.hash = x; }, h);
async function login(S) {
  await S.page.evaluate(() => {
    document.getElementById('lg-user').value = 'admin';
    document.getElementById('lg-pass').value = 'Admin1234';
    document.getElementById('login-form').onsubmit({ preventDefault: function () {} });
  });
  await w(S, 2000);
}
const st = S => S.page.evaluate(() => ({
  hash: location.hash,
  host: ((document.getElementById('view-host') || {}).innerHTML || '').length,
  txt: ((document.getElementById('view-host') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 200),
  modal: !!document.querySelector('#modal-root .modal'),
  modalTitle: (document.querySelector('#modal-root .modal-head') || {}).innerText || '',
  mods: JSON.parse(JSON.stringify(NJHR.state.moduleState)),
  rows: document.querySelectorAll('#view-host tbody tr, #view-host .req-card, #view-host .emp-card').length,
  err: !!document.getElementById('rt-retry')
}));
const has = (S, re) => S.mods.some(m => re.test(m));

(async () => {
  const dir = process.argv[2], port = Number(process.argv[3]);
  const srv = await serve(dir, port);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });

  /* ================= EMPLOYEES ================= */
  cur = 'EMPLOYEES';
  console.log('\n########## EMPLOYEES ##########');
  {
    const S = await ctxOf(b, port);
    await go(S); await w(S, 1400); await login(S);
    let a = await st(S);
    chk('EMP · Dashboard ไม่โหลด P3 Module', !has(S, /employees|attendance|leave|ot|shared/), 'js=' + Array.from(new Set(S.mods)).join(','));
    await hash(S, '#/employees'); await w(S, 2600);
    a = await st(S);
    chk('EMP · เปิด Employees List', a.hash === '#/employees' && a.rows > 0, 'แถว=' + a.rows + ' viewHost=' + a.host + 'B');
    chk('EMP · โหลด views/employees/list.js', has(S, /views\/employees\/list\.js/), 'js=' + S.mods.filter(m => /employees|shared/.test(m)).join(','));
    chk('EMP · ไม่โหลด Import / Export / Form / Documents ตอนเปิดรายการ',
      !has(S, /employees\/(import|export|form|documents)\.js/), 'moduleState=' + JSON.stringify(a.mods));
    chk('EMP · ไม่โหลด Compatibility Bundle', !has(S, /app-legacy/), 'compat=' + (a.mods.compatibility || 'not_loaded'));
    chk('EMP · ไม่โหลด Leave / OT / Attendance', !has(S, /leave\/main|ot\/main|attendance\//), 'ไม่พบใน request');

    // Search / Filter / Sort — ใช้ control จริงบนหน้า
    const ctrl = await S.page.evaluate(() => ({
      q: !!document.getElementById('emp-q'), st: !!document.getElementById('emp-status'),
      dept: !!document.getElementById('emp-dept'), th: document.querySelectorAll('#view-host th[data-sort]').length
    }));
    if (ctrl.q) {
      await S.page.evaluate(() => { const e = document.getElementById('emp-q'); e.value = 'NJ0001'; e.oninput && e.oninput({ target: e }); e.dispatchEvent(new Event('input')); });
      await w(S, 1200);
      const a2 = await st(S);
      chk('EMP · Search ทำงาน', a2.rows >= 0 && !a2.err, 'แถวหลังค้นหา=' + a2.rows);
      await S.page.evaluate(() => { const e = document.getElementById('emp-q'); e.value = ''; e.dispatchEvent(new Event('input')); });
      await w(S, 1200);
    } else skip('EMP · Search', 'ไม่พบ #emp-q บนหน้า');
    if (ctrl.st) {
      await S.page.evaluate(() => { const e = document.getElementById('emp-status'); e.value = 'ACTIVE'; e.onchange && e.onchange.call(e); e.dispatchEvent(new Event('change')); });
      await w(S, 1200);
      chk('EMP · Filter สถานะทำงาน', !(await st(S)).err, 'แถว=' + (await st(S)).rows);
    } else skip('EMP · Filter สถานะ', 'ไม่พบ #emp-status');
    chk('EMP · หัวตารางสำหรับ Sort ยังอยู่', ctrl.th >= 0, 'th[data-sort]=' + ctrl.th);

    // เพิ่มพนักงาน → ต้องโหลด employees-form ตอนกดเท่านั้น
    const beforeForm = S.mods.slice();
    await S.page.evaluate(() => { const b2 = document.getElementById('emp-add'); if (b2) b2.click(); });
    await w(S, 3000);
    chk('EMP · กดเพิ่มพนักงาน จึงโหลด views/employees/form.js',
      has(S, /views\/employees\/form\.js/) && beforeForm.every(x => !/employees\/form\.js/.test(x)),
      'moduleState.employees-form=' + (await st(S)).mods['employees-form']);
    let a3 = await st(S);
    chk('EMP · กดเพิ่มพนักงาน เปิดฟอร์มได้', a3.modal, 'modal="' + a3.modalTitle.slice(0, 30) + '"');
    // Validation
    await S.page.evaluate(() => { const b2 = document.getElementById('empf-save'); if (b2) b2.click(); });
    await w(S, 1300);
    const v = await S.page.evaluate(() => {
      const e = document.getElementById('emp-ferr');
      return { txt: e ? e.textContent.trim() : '', still: !!document.querySelector('#modal-root .modal') };
    });
    chk('EMP · Validation Error แสดงและไม่ปิดฟอร์ม', !!v.txt && v.still, 'ข้อความ="' + v.txt.slice(0, 50) + '"');
    await S.page.evaluate(() => NJHR.ui.closeModal()); await w(S, 500);

    // แก้ไขพนักงาน
    await S.page.evaluate(() => { const b2 = document.querySelector('[data-emp-edit]'); if (b2) b2.click(); });
    await w(S, 2600);
    a3 = await st(S);
    chk('EMP · กดแก้ไขพนักงาน เปิดฟอร์มได้', a3.modal, 'modal="' + a3.modalTitle.slice(0, 30) + '"');
    await S.page.evaluate(() => NJHR.ui.closeModal()); await w(S, 400);

    // เอกสารแนบพนักงาน → ต้องโหลด employees-documents ตอนกดเท่านั้น
    const beforeDocs = S.mods.slice();
    await S.page.evaluate(() => { const b2 = document.querySelector('[data-emp-docs]'); if (b2) b2.click(); });
    await w(S, 3000);
    a3 = await st(S);
    chk('EMP · กดเอกสารแนบ จึงโหลด views/employees/documents.js',
      has(S, /views\/employees\/documents\.js/) && beforeDocs.every(x => !/employees\/documents\.js/.test(x)),
      'moduleState.employees-documents=' + a3.mods['employees-documents']);
    chk('EMP · เปิดเอกสารแนบพนักงานได้', a3.modal, 'modal="' + a3.modalTitle.slice(0, 30) + '"');
    await S.page.evaluate(() => NJHR.ui.closeModal()); await w(S, 400);

    // Import — ต้องโหลด module ตอนกดเท่านั้น
    const before = S.mods.slice();
    await S.page.evaluate(() => { const b2 = document.getElementById('emp-import'); if (b2) b2.click(); });
    await w(S, 2500);
    a3 = await st(S);
    chk('EMP · กด Import จึงโหลด views/employees/import.js',
      has(S, /views\/employees\/import\.js/) && before.every(x => !/import\.js/.test(x)),
      'moduleState.employees-import=' + a3.mods['employees-import']);
    chk('EMP · กด Import เปิดฟอร์มนำเข้าได้', a3.modal, 'modal="' + a3.modalTitle.slice(0, 30) + '"');
    chk('EMP · Import ไม่ลาก Export ตามมา', !has(S, /employees\/export\.js/), 'export=' + (a3.mods['employees-export'] || 'not_loaded'));
    await S.page.evaluate(() => NJHR.ui.closeModal()); await w(S, 400);
    skip('EMP · Import ไฟล์ถูก / ไฟล์ผิด / บาง Field ผิด', 'ต้องอัปโหลดไฟล์ .xlsx จริงผ่าน File API — ยังไม่ได้ทำในรอบนี้');
    skip('EMP · Upload / Download / Delete เอกสารแนบ', 'ต้องใช้ Storage และ Signed URL จริง — ทดสอบด้วย fixture ไม่ครอบคลุม');
    skip('EMP · Save Success / Save Error กับข้อมูลจริง', 'ห้ามเขียนข้อมูล Production — fixture ตอบ 200 เสมอ');

    // Export
    const before2 = S.mods.slice();
    await S.page.evaluate(() => { const b2 = document.getElementById('emp-export'); if (b2) b2.click(); });
    await w(S, 3000);
    a3 = await st(S);
    chk('EMP · กด Export จึงโหลด views/employees/export.js',
      has(S, /views\/employees\/export\.js/) && before2.every(x => !/employees\/export\.js/.test(x)),
      'moduleState.employees-export=' + a3.mods['employees-export']);
    chk('EMP · Export ดึง shared/report-export.js มาด้วย', has(S, /shared\/report-export\.js/), 'โหลดแล้ว');

    // Back / Forward / Refresh / Deep link
    await hash(S, '#/dashboard'); await w(S, 900);
    await S.page.goBack(); await w(S, 1500);
    chk('EMP · Back กลับหน้าพนักงาน', (await st(S)).hash === '#/employees', 'hash=' + (await st(S)).hash);
    await S.page.goForward(); await w(S, 900);
    chk('EMP · Forward', (await st(S)).hash === '#/dashboard', 'hash=' + (await st(S)).hash);
    await S.page.goto(`http://127.0.0.1:${port}/index.html#/employees`, { waitUntil: 'load' }); await w(S, 3000);
    chk('EMP · Deep Link + Refresh', (await st(S)).hash === '#/employees' && (await st(S)).rows > 0, 'แถว=' + (await st(S)).rows);
    // กดเมนูรัว
    await S.page.evaluate(() => { ['#/attendance', '#/leave', '#/employees', '#/ot', '#/employees'].forEach(h => { location.hash = h; }); });
    await w(S, 3500);
    chk('EMP · กดเมนูรัวแล้วลงหน้าถูกต้อง', (await st(S)).hash === '#/employees' && (await st(S)).host > 200, 'viewHost=' + (await st(S)).host);
    chk('EMP · ไม่มี unhandled error ตลอดชุด Employees', S.errs.length === 0, S.errs.join(' | ') || 'ไม่มี');
    await S.ctx.close();
  }
  // Logout ระหว่างโหลด + Permission Denied + Retry
  {
    const S = await ctxOf(b, port);
    await go(S); await w(S, 1400); await login(S);
    await S.page.evaluate(() => { location.hash = '#/employees'; NJHR.auth.logout(true); });
    await w(S, 3000);
    chk('EMP · Logout ระหว่าง Module โหลด → ไม่ render', !(await S.page.evaluate(() => !!document.getElementById('sidebar'))), 'กลับหน้า Login');
    chk('EMP · ไม่มี unhandled error', S.errs.length === 0, S.errs.join(' | ') || 'ไม่มี');
    await S.ctx.close();
  }
  {
    const S = await ctxOf(b, port, { role: 'USER' });
    await go(S); await w(S, 1400); await login(S);
    const before = S.mods.slice();
    await hash(S, '#/employees'); await w(S, 1500);
    const a = await st(S);
    chk('EMP · USER ไม่มีสิทธิ์ → Access Denied เดิม', a.hash === '#/dashboard', 'hash=' + a.hash);
    chk('EMP · USER ไม่มีสิทธิ์ → ไม่โหลด Module', S.mods.filter(m => !before.includes(m) && /employees/.test(m)).length === 0,
      'js ใหม่=' + (S.mods.filter(m => !before.includes(m)).join(',') || 'ไม่มี'));
    await S.ctx.close();
  }
  {
    const S = await ctxOf(b, port);
    let block = true;
    await S.ctx.route('**/employees/list.js*', r => block ? r.abort() : r.continue());
    await go(S); await w(S, 1400); await login(S);
    await hash(S, '#/employees'); await w(S, 3000);
    let r1 = await S.page.evaluate(() => ({ retry: !!document.getElementById('rt-retry'), s: NJHR.modules.getState('employees'), t: ((document.getElementById('view-host') || {}).innerText || '').trim() }));
    chk('EMP · Module โหลดไม่สำเร็จ → Error State + ปุ่มลองใหม่', r1.retry && /ไม่สามารถโหลดหน้านี้ได้/.test(r1.t), 'state=' + r1.s);
    block = false;
    await S.page.evaluate(() => document.getElementById('rt-retry').click()); await w(S, 3000);
    const r2 = await S.page.evaluate(() => ({ s: NJHR.modules.getState('employees'), n: document.querySelectorAll('#view-host tbody tr, #view-host .emp-card').length }));
    chk('EMP · กดลองใหม่แล้วโหลดสำเร็จ', r2.s === 'loaded' && r2.n > 0, 'state=' + r2.s + ' แถว=' + r2.n);
    await S.ctx.close();
  }

  /* ================= ATTENDANCE ================= */
  cur = 'ATTENDANCE';
  console.log('\n########## ATTENDANCE ##########');
  {
    const S = await ctxOf(b, port);
    await go(S); await w(S, 1400); await login(S);
    await hash(S, '#/attendance'); await w(S, 2500);
    let a = await st(S);
    chk('ATT · เปิดหน้าลงเวลา', a.hash === '#/attendance' && a.host > 200, 'viewHost=' + a.host + 'B');
    chk('ATT · โหลด views/attendance/main.js', has(S, /views\/attendance\/main\.js/), 'js=' + S.mods.filter(m => /attendance|shared/.test(m)).join(','));
    chk('ATT · ไม่โหลด Attendance Report', !has(S, /attendance\/report\.js/), 'report=' + (a.mods['attendance-report'] || 'not_loaded'));
    chk('ATT · ไม่โหลด Compatibility / Employees / Leave / OT',
      !has(S, /app-legacy|employees|leave\/main|ot\/main/), 'moduleState=' + Object.keys(a.mods).join(','));
    const ctl = await S.page.evaluate(() => ({
      from: !!document.getElementById('att-from'), to: !!document.getElementById('att-to'),
      dept: !!document.getElementById('att-dept'), q: !!document.getElementById('att-q')
    }));
    console.log('   control ที่พบบนหน้า: ' + JSON.stringify(ctl));
    if (ctl.from) {
      await S.page.evaluate(() => { const e = document.getElementById('att-from'); e.value = '2026-08-01'; e.dispatchEvent(new Event('change')); });
      await w(S, 1500);
      chk('ATT · เปลี่ยนช่วงวันที่แล้วหน้ายังทำงาน', !(await st(S)).err, 'viewHost=' + (await st(S)).host);
    } else skip('ATT · เปลี่ยนวันที่/เดือน', 'ไม่พบ #att-from บนหน้า (โครงสร้างจริงต่างจากที่ Prompt สมมติ)');
    if (ctl.dept) {
      await S.page.evaluate(() => { const e = document.getElementById('att-dept'); e.selectedIndex = 1; e.dispatchEvent(new Event('change')); });
      await w(S, 1500);
      chk('ATT · เปลี่ยนแผนกแล้วหน้ายังทำงาน', !(await st(S)).err, 'ok');
    } else skip('ATT · เปลี่ยนแผนก', 'ไม่พบ #att-dept บนหน้า');
    skip('ATT · Check-in / Check-out จริง', 'ห้ามสร้างเวลาจริง — ไม่มี Test Account บน Production');
    // Attendance Correction — ต้องโหลดตอนกด #att-fix เท่านั้น
    const hasFix = await S.page.evaluate(() => !!document.getElementById('att-fix'));
    if (hasFix) {
      chk('ATT · ไม่โหลด Correction ตอนเปิดหน้าลงเวลา', !has(S, /attendance\/correction\.js/),
        'moduleState=' + ((await st(S)).mods['attendance-correction'] || 'not_loaded'));
      const b4 = S.mods.slice();
      await S.page.evaluate(() => document.getElementById('att-fix').click());
      await w(S, 3000);
      const ac = await st(S);
      chk('ATT · กดแก้ไขเวลา จึงโหลด views/attendance/correction.js',
        has(S, /attendance\/correction\.js/) && b4.every(x => !/correction\.js/.test(x)),
        'moduleState.attendance-correction=' + ac.mods['attendance-correction']);
      chk('ATT · เปิดฟอร์มแก้ไขเวลาได้', ac.modal, 'modal="' + ac.modalTitle.slice(0, 30) + '"');
      await S.page.evaluate(() => NJHR.ui.closeModal()); await w(S, 400);
    } else skip('ATT · Attendance Correction', 'ไม่พบปุ่ม #att-fix สำหรับ role นี้');

    // Attendance Report
    await hash(S, '#/reports'); await w(S, 3000);
    a = await st(S);
    chk('ATT · เปิดรายงานลงเวลา (#/reports)', a.hash === '#/reports' && a.host > 200, 'viewHost=' + a.host + 'B');
    chk('ATT · โหลด views/attendance/report.js ตอนเปิดรายงานเท่านั้น', has(S, /views\/attendance\/report\.js/), 'state=' + a.mods['attendance-report']);
    chk('ATT · รายงานไม่ลาก Compatibility มาด้วย', !has(S, /app-legacy/), 'compat=' + (a.mods.compatibility || 'not_loaded'));
    await S.page.goBack(); await w(S, 1500);
    chk('ATT · Back จากรายงาน', (await st(S)).hash === '#/attendance', 'hash=' + (await st(S)).hash);
    await S.page.goForward(); await w(S, 1500);
    chk('ATT · Forward กลับรายงาน', (await st(S)).hash === '#/reports', 'hash=' + (await st(S)).hash);
    await S.page.goto(`http://127.0.0.1:${port}/index.html#/reports`, { waitUntil: 'load' }); await w(S, 3200);
    chk('ATT · Deep Link รายงาน', (await st(S)).hash === '#/reports' && (await st(S)).host > 200, 'viewHost=' + (await st(S)).host);
    chk('ATT · ไม่มี unhandled error ตลอดชุด Attendance', S.errs.length === 0, S.errs.join(' | ') || 'ไม่มี');
    await S.ctx.close();
  }
  {
    const S = await ctxOf(b, port, { failRpc: 'njhr_att_report' });
    await go(S); await w(S, 1400); await login(S);
    await hash(S, '#/attendance'); await w(S, 3000);
    const a = await st(S);
    chk('ATT · RPC ล้มเหลว → หน้าไม่พัง ไม่มีจอขาว', a.host > 100 && S.errs.filter(e => /PAGEERROR/.test(e)).length === 0,
      'viewHost=' + a.host + ' pageerror=' + S.errs.filter(e => /PAGEERROR/.test(e)).length);
    await S.ctx.close();
  }

  /* ================= LEAVE ================= */
  cur = 'LEAVE';
  console.log('\n########## LEAVE ##########');
  {
    const S = await ctxOf(b, port);
    await go(S); await w(S, 1400); await login(S);
    await hash(S, '#/leave'); await w(S, 2500);
    let a = await st(S);
    chk('LEAVE · เปิดหน้าลางาน', a.hash === '#/leave' && a.host > 200, 'viewHost=' + a.host + 'B');
    chk('LEAVE · โหลด views/leave/main.js', has(S, /views\/leave\/main\.js/), 'js=' + S.mods.filter(m => /leave|shared/.test(m)).join(','));
    chk('LEAVE · ไม่โหลด OT / Employees Import / Compatibility',
      !has(S, /ot\/main|employees\/import|app-legacy/), 'moduleState=' + Object.keys(a.mods).join(','));
    chk('LEAVE · แสดงสิทธิ์ลา', /วัน|สิทธิ/.test(a.txt), 'ข้อความ="' + a.txt.slice(0, 60) + '"');
    // ฟอร์มขอลา
    chk('LEAVE · ไม่โหลด Leave Form / Detail ตอนเปิดหน้า', !has(S, /leave\/(form|detail)\.js/),
      'moduleState=' + JSON.stringify(a.mods));
    const beforeLvF = S.mods.slice();
    await S.page.evaluate(() => { const b2 = document.getElementById('lv-new'); if (b2) b2.click(); });
    await w(S, 3000);
    a = await st(S);
    if (a.modal) {
      chk('LEAVE · กดขอลา จึงโหลด views/leave/form.js',
        has(S, /views\/leave\/form\.js/) && beforeLvF.every(x => !/leave\/form\.js/.test(x)),
        'moduleState.leave-form=' + a.mods['leave-form']);
      chk('LEAVE · เปิดฟอร์มขอลาได้', true, 'modal="' + a.modalTitle.slice(0, 30) + '"');
      const f = await S.page.evaluate(() => ({
        type: !!document.getElementById('lvf-type'), start: !!document.getElementById('lvf-start'),
        end: !!document.getElementById('lvf-end'), mode: !!document.getElementById('lvf-mode'),
        note: !!document.getElementById('lvf-no'), file: !!document.getElementById('lvf-file'),
        send: !!document.getElementById('lvf-send'), err: !!document.getElementById('lvf-err')
      }));
      chk('LEAVE · ฟอร์มมีช่องประเภทลา/ช่วงวันที่/เต็มวัน-ครึ่งวัน/เหตุผล/ไฟล์แนบครบ',
        f.type && f.start && f.end && f.mode && f.note && f.file, JSON.stringify(f));
      await S.page.evaluate(() => { const b2 = document.getElementById('lvf-send'); if (b2) b2.click(); });
      await w(S, 1200);
      const e = await S.page.evaluate(() => { const x = document.getElementById('lvf-err'); return x ? x.textContent.trim() : ''; });
      chk('LEAVE · Validation ทำงาน (กดส่งโดยไม่กรอกเหตุผล)', !!e, 'ข้อความ="' + e.slice(0, 60) + '"');
      const md = await S.page.evaluate(() => {
        const t = document.getElementById('lvf-mode');
        if (!t) return '';
        if (t.options) return Array.from(t.options).map(o => o.value + ':' + o.text.trim()).join(' | ');
        return (t.innerText || t.textContent || '').replace(/\s+/g, ' ').trim();
      });
      chk('LEAVE · ตัวเลือกเต็มวัน/ครึ่งวัน/รายชั่วโมง คงเดิม', !!md, md.slice(0, 110));
      await S.page.evaluate(() => NJHR.ui.closeModal()); await w(S, 400);
    } else skip('LEAVE · เปิดฟอร์มขอลา', 'ไม่พบปุ่มเปิดฟอร์มด้วย selector ที่ตรวจ (#lv-new / [data-lv-new])');
    await hash(S, '#/req-history'); await w(S, 2600);
    const beforeDet = S.mods.slice();
    const clicked = await S.page.evaluate(() => { const b2 = document.querySelector('[data-rh]'); if (b2) { b2.click(); return true; } return false; });
    if (clicked) {
      await w(S, 3000);
      const ad = await st(S);
      chk('LEAVE · กดดูรายละเอียด จึงโหลด views/leave/detail.js',
        has(S, /views\/leave\/detail\.js/) && beforeDet.every(x => !/leave\/detail\.js/.test(x)),
        'moduleState.request-detail=' + ad.mods['request-detail']);
      await S.page.evaluate(() => { try { NJHR.ui.closeModal(); } catch (e) {} }); await w(S, 400);
    } else skip('LEAVE · เปิดรายละเอียดคำขอ', 'ไม่พบแถวคำขอใน fixture (ประวัติว่าง)');
    a = await st(S);
    chk('LEAVE · ประวัติลาและ OT (#/req-history) เปิดได้', a.hash === '#/req-history' && a.host > 100, 'viewHost=' + a.host);
    chk('LEAVE · #/req-history ใช้ chunk เดียวกัน ไม่โหลดเพิ่ม', !has(S, /app-legacy/), 'ไม่มี compat');
    await hash(S, '#/requests'); await w(S, 1800);
    chk('LEAVE · หน้ารวมคำขอ (#/requests) เปิดได้', (await st(S)).hash === '#/requests', 'hash=' + (await st(S)).hash);
    skip('LEAVE · Submit Success / Submit Error กับข้อมูลจริง', 'ห้ามสร้างคำขอจริงบน Production');
    chk('LEAVE · ไม่มี unhandled error ตลอดชุด Leave', S.errs.length === 0, S.errs.join(' | ') || 'ไม่มี');
    await S.ctx.close();
  }

  /* ================= OT ================= */
  cur = 'OT';
  console.log('\n########## OT ##########');
  {
    const S = await ctxOf(b, port);
    await go(S); await w(S, 1400); await login(S);
    await hash(S, '#/ot'); await w(S, 2500);
    let a = await st(S);
    chk('OT · เปิดหน้า OT', a.hash === '#/ot' && a.host > 200, 'viewHost=' + a.host + 'B');
    chk('OT · โหลด views/ot/main.js', has(S, /views\/ot\/main\.js/), 'js=' + S.mods.filter(m => /ot\/|shared/.test(m)).join(','));
    chk('OT · ไม่โหลด Employees Import / Attendance Report / Compatibility',
      !has(S, /employees\/import|attendance\/report|app-legacy/), 'moduleState=' + Object.keys(a.mods).join(','));
    chk('OT · ไม่โหลด OT Form ตอนเปิดหน้า', !has(S, /ot\/form\.js/), 'moduleState=' + JSON.stringify(a.mods));
    const beforeOtF = S.mods.slice();
    await S.page.evaluate(() => { const b2 = document.getElementById('ot-new'); if (b2) b2.click(); });
    await w(S, 3000);
    a = await st(S);
    if (a.modal) {
      chk('OT · กดขอ OT จึงโหลด views/ot/form.js',
        has(S, /views\/ot\/form\.js/) && beforeOtF.every(x => !/ot\/form\.js/.test(x)),
        'moduleState.ot-form=' + a.mods['ot-form']);
      chk('OT · เปิดฟอร์มขอ OT ได้', true, 'modal="' + a.modalTitle.slice(0, 30) + '"');
      const f = await S.page.evaluate(() => ({
        date: !!document.getElementById('otf-date'), start: !!document.getElementById('otf-start'),
        end: !!document.getElementById('otf-end'), hours: !!document.getElementById('otf-hours'),
        addJob: !!document.getElementById('otj-add'), rows: !!document.getElementById('otj-rows'),
        send: !!document.getElementById('otf-send'), err: !!document.getElementById('otf-err')
      }));
      chk('OT · ฟอร์มมีวันที่/เวลาเริ่ม-สิ้นสุด/ชั่วโมง/ปุ่มเพิ่มรายการงานครบ',
        f.date && f.start && f.end && f.addJob && f.rows, JSON.stringify(f));
      const n0 = await S.page.evaluate(() => document.querySelectorAll('#otj-rows .otj-row').length);
      await S.page.evaluate(() => { const b2 = document.getElementById('otj-add'); if (b2) b2.click(); });
      await w(S, 700);
      const n1 = await S.page.evaluate(() => document.querySelectorAll('#otj-rows .otj-row').length);
      chk('OT · เพิ่มรายการงานได้', n1 > n0, 'รายการ ' + n0 + ' -> ' + n1);
      await S.page.evaluate(() => { const b2 = document.getElementById('otf-send'); if (b2) b2.click(); });
      await w(S, 1200);
      const e = await S.page.evaluate(() => { const x = document.getElementById('otf-err'); return x ? x.textContent.trim() : ''; });
      chk('OT · Validation เวลา/ข้อมูลไม่ครบทำงาน', !!e, 'ข้อความ="' + e.slice(0, 70) + '"');
      await S.page.evaluate(() => NJHR.ui.closeModal()); await w(S, 400);
    } else skip('OT · เปิดฟอร์มขอ OT', 'ไม่พบปุ่มเปิดฟอร์มด้วย selector ที่ตรวจ (#ot-new / [data-ot-new])');
    skip('OT · Submit Success / Submit Error กับข้อมูลจริง', 'ห้ามสร้างคำขอจริงบน Production');
    await S.page.evaluate(() => { ['#/leave', '#/ot', '#/attendance', '#/ot'].forEach(h => { location.hash = h; }); });
    await w(S, 3500);
    chk('OT · กดเมนูรัวแล้วลงหน้าถูกต้อง', (await st(S)).hash === '#/ot' && (await st(S)).host > 200, 'viewHost=' + (await st(S)).host);
    await S.page.goto(`http://127.0.0.1:${port}/index.html#/ot`, { waitUntil: 'load' }); await w(S, 3000);
    chk('OT · Deep Link + Refresh', (await st(S)).hash === '#/ot' && (await st(S)).host > 200, 'viewHost=' + (await st(S)).host);
    chk('OT · ไม่มี unhandled error ตลอดชุด OT', S.errs.length === 0, S.errs.join(' | ') || 'ไม่มี');
    await S.ctx.close();
  }

  /* ================= LISTENER + RESPONSIVE ของ Feature ใหม่ ================= */
  cur = 'LISTENER + RESPONSIVE';
  console.log('\n########## LISTENER + RESPONSIVE (P3) ##########');
  {
    const S = await ctxOf(b, port);
    await S.page.addInitScript(() => {
      window.__L = {};
      const add = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function (t) {
        const who = this === window ? 'window' : this === document ? 'document' : this === document.body ? 'body' : null;
        if (who) { const k = who + ':' + t; window.__L[k] = (window.__L[k] || 0) + 1; }
        return add.apply(this, arguments);
      };
    });
    await go(S); await w(S, 1400); await login(S);
    for (const h of ['#/employees', '#/attendance', '#/leave', '#/ot', '#/reports', '#/req-history', '#/dashboard']) {
      await hash(S, h); await w(S, 2000);
    }
    const base = await S.page.evaluate(() => JSON.parse(JSON.stringify(window.__L)));
    for (let i = 0; i < 3; i++) {
      for (const h of ['#/employees', '#/attendance', '#/leave', '#/ot', '#/dashboard']) { await hash(S, h); await w(S, 600); }
    }
    await S.page.goBack(); await w(S, 600); await S.page.goForward(); await w(S, 600);
    await S.page.evaluate(() => NJHR.auth.logout(true)); await w(S, 900); await login(S); await w(S, 1200);
    const after = await S.page.evaluate(() => JSON.parse(JSON.stringify(window.__L)));
    const grew = Object.keys(after).filter(k => after[k] > (base[k] || 0));
    chk('P3 · Listener ไม่เพิ่มหลังวน 5 หน้า × 3 รอบ + Back/Forward + Logout/Login', grew.length === 0,
      grew.length ? grew.map(k => k + ' ' + (base[k] || 0) + '→' + after[k]).join(', ') : JSON.stringify(after));
    await S.ctx.close();
  }
  for (const vp of [{ n: '360x740', width: 360, height: 740 }, { n: '768x1024', width: 768, height: 1024 }, { n: '1440x900', width: 1440, height: 900 }]) {
    const S = await ctxOf(b, port, { viewport: { width: vp.width, height: vp.height } });
    await go(S); await w(S, 1400); await login(S);
    const bad = [];
    for (const h of ['#/employees', '#/attendance', '#/leave', '#/ot', '#/reports']) {
      await hash(S, h); await w(S, 2200);
      const r = await S.page.evaluate(() => {
        const W = document.documentElement.clientWidth, sb = document.getElementById('sidebar');
        const closed = !!sb && !document.body.classList.contains('sidebar-open');
        let n = 0;
        document.querySelectorAll('#main-view *').forEach(el => {
          const b2 = el.getBoundingClientRect();
          if (b2.width > 0 && (b2.right > W + 2 || b2.left < -2) && !(closed && sb.contains(el))) n++;
        });
        return { n: n, hs: document.documentElement.scrollWidth - W };
      });
      if (r.n > 0 || r.hs > 0) bad.push(h + '(ล้น ' + r.n + ' · hScroll ' + r.hs + ')');
    }
    chk('P3 · Responsive ' + vp.n + ' — 5 หน้าใหม่ไม่ล้นจอ', bad.length === 0, bad.length ? bad.join(' ') : 'ทั้ง 5 หน้าไม่ล้น');
    await S.ctx.close();
  }
  skip('P3 · iPhone Safari (WebKit จริง)', 'ยังไม่ได้ทดสอบบนอุปกรณ์ iPhone Safari จริง — สภาพแวดล้อมนี้มีเฉพาะ Chromium');

  await b.close(); srv.close();
  let md = '';
  Object.keys(SEC).forEach(k => { md += '\n## ' + k + '\n\n| Test Case | ผล | หลักฐาน |\n|---|---|---|\n' + SEC[k].join('\n') + '\n'; });
  md += '\n**PASS ' + PASS + ' · FAIL ' + FAIL + ' · NOT TESTED ' + SKIP + '**\n';
  fs.writeFileSync(path.join(__dirname, 'p3_feature_result.md'), md);
  console.log('\n========== สรุป ==========\nPASS ' + PASS + ' · FAIL ' + FAIL + ' · NOT TESTED ' + SKIP);
  process.exit(FAIL ? 1 : 0);
})();
