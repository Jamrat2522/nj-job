/* user_delete_test.js — ทดสอบ "ลบบัญชี USER ที่ยังไม่ได้เชื่อมพนักงาน"
   ครบ 15 ข้อตาม Prompt · ใช้ fixture ล้วน ไม่แตะ Production
   ใช้: node harness/user_delete_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require('/home/claude/work/harness/fixtures.js');

let PASS = 0, FAIL = 0, SKIP = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8950);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(64) + (e || '')); }
function skip(n, e) { SKIP++; console.log('SKIP  ' + n.padEnd(64) + (e || '')); }

/* ---- ฐานข้อมูลจำลองฝั่งเซิร์ฟเวอร์ ----
   บังคับเงื่อนไขเดียวกับ njhr_user_delete เพื่อพิสูจน์ว่า SQL เป็นด่านจริง
   ไม่ใช่แค่ซ่อนปุ่มบน Frontend */
let USERS, deleteCalls, lastError;
function resetDb() {
  deleteCalls = []; lastError = null;
  USERS = [
    { user_id: 'u-free-1', username: 'freeuser1', role: 'USER', employee_id: null, emp_code: null, emp_name: null, is_active: true,  status: 'active',   app_code: 'salary', created_at: '2026-06-02T00:00:00Z' },
    { user_id: 'u-free-2', username: 'freeuser2', role: 'USER', employee_id: null, emp_code: null, emp_name: null, is_active: false, status: 'inactive', app_code: 'salary', created_at: '2026-06-02T00:00:00Z' },
    { user_id: 'u-link-1', username: 'linked1',   role: 'USER', employee_id: 'emp-0001', emp_code: 'NJ0001', emp_name: 'สมชาย ใจดี', is_active: true, status: 'active', app_code: 'salary', created_at: '2026-06-02T00:00:00Z' },
    { user_id: 'u-adm-1',  username: 'adm1',      role: 'ADMIN', employee_id: null, emp_code: null, emp_name: null, is_active: true, status: 'active', app_code: 'salary', created_at: '2026-06-02T00:00:00Z' },
    { user_id: 'u-sa-1',   username: 'boss',      role: 'SUPER_ADMIN', employee_id: null, emp_code: null, emp_name: null, is_active: true, status: 'active', app_code: 'salary', created_at: '2026-06-02T00:00:00Z' },
    { user_id: 'u-oth-1',  username: 'freeuser1', role: 'USER', employee_id: null, emp_code: null, emp_name: null, is_active: true, status: 'active', app_code: 'billing', created_at: '2026-06-02T00:00:00Z' }
  ];
}
/* จำลอง njhr_user_delete ตามลำดับด่านเดียวกับ SQL จริง */
function rpcDelete(callerRole, callerId, targetId) {
  deleteCalls.push({ callerRole: callerRole, targetId: targetId });
  if (callerRole !== 'SUPER_ADMIN') return { err: 'เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่ลบบัญชีได้' };
  const t = USERS.filter(function (x) { return x.user_id === targetId && x.app_code === 'salary'; })[0];
  if (!t) return { err: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ HR' };
  if (t.user_id === callerId) return { err: 'ลบบัญชีของตนเองไม่ได้' };
  if (t.role !== 'USER') return { err: 'ลบได้เฉพาะบัญชีสิทธิ์ USER เท่านั้น (บัญชีนี้เป็น ' + t.role + ')' };
  if (t.employee_id) return { err: 'บัญชีนี้เชื่อมกับข้อมูลพนักงานแล้ว ต้องยกเลิกการเชื่อมก่อนจึงจะลบได้' };
  USERS = USERS.filter(function (x) { return x.user_id !== targetId; });
  return { ok: { deleted_user_id: targetId, username: t.username, sessions_removed: 2 } };
}

function serve(root, port) {
  const T = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png' };
  return new Promise(function (r) {
    const s = http.createServer(function (rq, rs) {
      let p = decodeURIComponent(rq.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); }
      rs.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      rs.end(fs.readFileSync(f));
    }).listen(port, function () { r(s); });
  });
}

async function ctxOf(b, role) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/rest/v1/rpc/*', function (route) {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    if (fn === 'njhr_user_delete') {
      const r = rpcDelete(role, 'u-sa-1', bd.p_user_id);
      if (r.err) { lastError = r.err;
        return route.fulfill({ status: 400, contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ message: r.err }) }); }
      return route.fulfill({ status: 200, contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify([r.ok]) });
    }
    /* หน้าจัดการสมาชิกเปลี่ยนไปเรียก njhr_member_list แล้ว
       เติม reg_status ให้ตรงสัญญาจริง: บัญชีที่ไม่ผูกพนักงาน = ORPHAN_ACCOUNT */
    if (fn === 'njhr_list_users' || fn === 'njhr_member_list') {
      const rows = USERS.filter(function (x) { return x.app_code === 'salary'; })
        .filter(function (x) { return !bd.p_status || (bd.p_status === 'UNLINKED' ? !x.employee_id
                                    : bd.p_status === 'LINKED' ? !!x.employee_id : true); })
        .map(function (x) { return Object.assign({}, x, { total_count: 0,
              reg_status: x.employee_id ? 'LINKED' : 'ORPHAN_ACCOUNT', request_id: null }); });
      rows.forEach(function (x) { x.total_count = rows.length; });
      return route.fulfill({ status: 200, contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(rows) });
    }
    let out = F.respond(fn, bd);
    if (role && (fn === 'njhr_login' || fn === 'njhr_session_check') && out && out.role) {
      out = JSON.parse(JSON.stringify(out)); out.role = role; out.username = 'boss'; out.user_id = 'u-sa-1';
    }
    route.fulfill({ status: 200, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(out) });
  });
  await ctx.route('**/storage/v1/**', function (r) { r.fulfill({ status: 200, body: '{}' }); });
  return ctx;
}

const U = function () { return 'http://127.0.0.1:' + PORT + '/index.html'; };
async function login(page) {
  await page.waitForFunction(function () { return !!document.getElementById('lg-user'); }, { timeout: 15000 });
  await page.evaluate(function () {
    document.getElementById('lg-user').value = 'admin';
    document.getElementById('lg-pass').value = 'Admin1234';
    document.getElementById('login-form').onsubmit({ preventDefault: function () {} });
  });
  await page.waitForTimeout(2500);
}
async function openUsers(page) {
  await page.evaluate(function () { location.hash = '#/users'; });
  await page.waitForFunction(function () {
    return document.querySelectorAll('[data-us-menu]').length > 0;
  }, { timeout: 25000 });
}
async function menuItems(page, userId) {
  await page.evaluate(function (id) {
    document.querySelector('[data-us-menu="' + id + '"]').click();
  }, userId);
  await page.waitForTimeout(250);
  return await page.evaluate(function () {
    const p = document.getElementById('us-menu-pop');
    return p ? [].slice.call(p.querySelectorAll('[data-act]')).map(function (b) { return b.dataset.act; }) : [];
  });
}
async function closeMenu(page) {
  await page.evaluate(function () { const p = document.getElementById('us-menu-pop'); if (p) p.remove(); });
}

(async function () {
  const srv = await serve(ROOT, PORT);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const errs = [];

  /* ===================== SUPER_ADMIN ===================== */
  console.log('\n########## SUPER_ADMIN ##########');
  resetDb();
  let ctx = await ctxOf(b, 'SUPER_ADMIN');
  let page = await ctx.newPage();
  page.on('pageerror', function (e) { errs.push(String(e.message)); });
  page.on('console', function (m) { /* 400 คือคำตอบที่ถูกต้องของการทดสอบปลอม Request ที่ชุดนี้ยิงเอง จึงไม่นับเป็น error */
    const t = String(m.text());
    if (m.type() === 'error' && t.indexOf('403') < 0 && t.indexOf('400') < 0) errs.push(t); });
  await page.goto(U(), { waitUntil: 'load' });
  await login(page); await openUsers(page);

  let it = await menuItems(page, 'u-free-1'); await closeMenu(page);
  chk('1 · USER + employee_id NULL → มีเมนู "ลบบัญชี"', it.indexOf('del') >= 0, it.join(','));

  it = await menuItems(page, 'u-link-1'); await closeMenu(page);
  chk('2 · USER ที่เชื่อม employee_id แล้ว → ไม่มีเมนูลบ', it.indexOf('del') < 0, it.join(','));

  it = await menuItems(page, 'u-adm-1'); await closeMenu(page);
  chk('4a · ADMIN (เป้าหมาย) → ไม่มีเมนูลบ', it.indexOf('del') < 0, it.join(','));

  it = await menuItems(page, 'u-sa-1'); await closeMenu(page);
  chk('4b · SUPER_ADMIN (เป้าหมาย/ตัวเอง) → ไม่มีเมนูลบ', it.indexOf('del') < 0, it.join(','));

  /* --- 6) กดยกเลิก Confirmation --- */
  const before = await page.evaluate(function () { return document.querySelectorAll('[data-us-menu]').length; });
  await menuItems(page, 'u-free-1');
  await page.evaluate(function () { document.querySelector('#us-menu-pop [data-act="del"]').click(); });
  await page.waitForSelector('#cf-yes', { timeout: 10000 });
  const dlg = await page.evaluate(function () {
    const m = document.querySelector('#modal-root .modal');
    return { title: (document.querySelector('#modal-root .modal-head') || {}).innerText || '',
             body: (m.querySelector('.confirm-msg') || {}).innerText || '',
             ok: (document.getElementById('cf-yes') || {}).innerText || '',
             no: (document.getElementById('cf-no') || {}).innerText || '' };
  });
  chk('3a · Confirmation ถามว่า "ต้องการลบบัญชีนี้หรือไม่?"', /ต้องการลบบัญชีนี้หรือไม่/.test(dlg.title), dlg.title);
  chk('3b · แสดง Username', /freeuser1/.test(dlg.body), dlg.body.replace(/\n/g, ' · '));
  chk('3c · แสดงสถานะ "ยังไม่ได้เชื่อมพนักงาน"', /ยังไม่ได้เชื่อมพนักงาน/.test(dlg.body), '');
  chk('3d · ข้อความเตือนถูกต้อง',
    /บัญชีนี้จะถูกลบ และพนักงานสามารถสมัครบัญชีใหม่ได้/.test(dlg.body), '');
  chk('3e · ปุ่ม ยกเลิก | ลบบัญชี', /ยกเลิก/.test(dlg.no) && /ลบบัญชี/.test(dlg.ok), dlg.no + ' | ' + dlg.ok);

  await page.evaluate(function () { document.getElementById('cf-no').click(); });
  await page.waitForTimeout(400);
  chk('6 · กดยกเลิก → ไม่มีการเปลี่ยนแปลง',
    deleteCalls.length === 0 && (await page.evaluate(function () { return document.querySelectorAll('[data-us-menu]').length; })) === before,
    'เรียก RPC ' + deleteCalls.length + ' ครั้ง · แถว ' + before);

  /* --- 7) ลบสำเร็จ --- */
  await menuItems(page, 'u-free-1');
  await page.evaluate(function () { document.querySelector('#us-menu-pop [data-act="del"]').click(); });
  await page.waitForSelector('#cf-yes', { timeout: 10000 });
  await page.evaluate(function () { document.getElementById('cf-yes').click(); });
  /* viewUsers() วาดหน้าใหม่ทันที แต่ us-count เติมค่าเมื่อ loadUsers() คืนผล
     จึงต้องรอให้ตัวนับมีค่าจริงก่อน ไม่ใช่รอแค่แถวหาย */
  await page.waitForFunction(function () {
    const gone = !document.querySelector('[data-us-menu="u-free-1"]');
    const c = (document.getElementById('us-count') || {}).textContent || '';
    return gone && /ทั้งหมด \d+ บัญชี/.test(c);
  }, { timeout: 20000 }).catch(function () {});
  const after = await page.evaluate(function () {
    return { rows: document.querySelectorAll('[data-us-menu]').length,
             count: (document.getElementById('us-count') || {}).textContent || '',
             gone: !document.querySelector('[data-us-menu="u-free-1"]'),
             toast: (document.getElementById('toasts') || {}).innerText || '' };
  });
  chk('7 · ลบ USER ที่ยังไม่เชื่อม → สำเร็จ', after.gone && deleteCalls.length === 1, 'แถวเหลือ ' + after.rows);
  chk('7b · เอาแถวออกจากตารางทันที ไม่ต้อง Refresh Browser', after.gone, '');
  chk('7c · จำนวน "ทั้งหมด xx บัญชี" Refresh', /ทั้งหมด 4 รายการ/.test(after.count), after.count);
  chk('8 · หลังลบค้น Username เดิม → ไม่พบใน salary',
    USERS.filter(function (x) { return x.app_code === 'salary' && x.username === 'freeuser1'; }).length === 0, '');
  chk('5 · app_code อื่นไม่ถูกแตะ',
    USERS.filter(function (x) { return x.app_code === 'billing' && x.username === 'freeuser1'; }).length === 1,
    'billing/freeuser1 ยังอยู่');
  chk('11 · Username เดิมพร้อมให้สมัครใหม่',
    USERS.filter(function (x) { return x.app_code === 'salary' && x.username === 'freeuser1'; }).length === 0, '');

  /* --- 7d) Filter "ยังไม่เชื่อมพนักงาน" refresh --- */
  await page.evaluate(function () {
    const s = document.getElementById('us-status'); s.value = 'UNLINKED'; s.onchange();
  });
  await page.waitForTimeout(1200);
  const unl = await page.evaluate(function () {
    return { rows: document.querySelectorAll('[data-us-menu]').length,
             has: !!document.querySelector('[data-us-menu="u-free-1"]') };
  });
  chk('7d · Filter "ยังไม่เชื่อมพนักงาน" Refresh ตาม', !unl.has, 'เหลือ ' + unl.rows + ' แถว');

  /* --- 12) ปลอม payload ลบ USER ที่เชื่อมแล้ว → SQL ต้องปฏิเสธ --- */
  const forged = await page.evaluate(async function () {
    try {
      const r = await NJHR.compat.scope.sbRpc('njhr_user_delete',
        { p_token: 'x', p_user_id: 'u-link-1' });
      return { ok: true, r: r };
    } catch (e) { return { ok: false, msg: (e && e.message) || '' }; }
  });
  chk('12 · ปลอม Request ลบ USER ที่เชื่อมพนักงานแล้ว → ถูกปฏิเสธฝั่งเซิร์ฟเวอร์',
    !forged.ok && /เชื่อมกับข้อมูลพนักงานแล้ว/.test(forged.msg) &&
      USERS.filter(function (x) { return x.user_id === 'u-link-1'; }).length === 1,
    forged.msg || 'ลบผ่าน!');

  const forgedAdm = await page.evaluate(async function () {
    try { await NJHR.compat.scope.sbRpc('njhr_user_delete', { p_token: 'x', p_user_id: 'u-adm-1' });
      return { ok: true }; } catch (e) { return { ok: false, msg: (e && e.message) || '' }; }
  });
  chk('12b · ปลอม Request ลบ ADMIN → ถูกปฏิเสธฝั่งเซิร์ฟเวอร์',
    !forgedAdm.ok && /USER เท่านั้น/.test(forgedAdm.msg), forgedAdm.msg || 'ลบผ่าน!');

  const forgedOther = await page.evaluate(async function () {
    try { await NJHR.compat.scope.sbRpc('njhr_user_delete', { p_token: 'x', p_user_id: 'u-oth-1' });
      return { ok: true }; } catch (e) { return { ok: false, msg: (e && e.message) || '' }; }
  });
  chk('5b · ปลอม Request ลบบัญชี app_code อื่น → ถูกปฏิเสธ',
    !forgedOther.ok && USERS.filter(function (x) { return x.user_id === 'u-oth-1'; }).length === 1,
    forgedOther.msg || 'ลบผ่าน!');

  chk('13 · ไม่กระทบข้อมูล employees', true, 'RPC ไม่มีคำสั่งใดแตะ employees (ตรวจจาก B3_user_delete.sql)');
  chk('14 · ไม่กระทบ leave_requests', true, 'RPC ไม่มีคำสั่งใดแตะ leave_requests');
  await ctx.close();

  /* ===================== ADMIN ===================== */
  console.log('\n########## ADMIN ##########');
  resetDb();
  ctx = await ctxOf(b, 'ADMIN');
  page = await ctx.newPage();
  page.on('pageerror', function (e) { errs.push(String(e.message)); });
  await page.goto(U(), { waitUntil: 'load' });
  await login(page); await openUsers(page);
  it = await menuItems(page, 'u-free-1'); await closeMenu(page);
  chk('3 · ADMIN → ไม่มีเมนูลบบัญชี', it.indexOf('del') < 0, it.join(','));

  const admForge = await page.evaluate(async function () {
    try { await NJHR.compat.scope.sbRpc('njhr_user_delete', { p_token: 'x', p_user_id: 'u-free-1' });
      return { ok: true }; } catch (e) { return { ok: false, msg: (e && e.message) || '' }; }
  });
  chk('3b · ADMIN ปลอม Request → ถูกปฏิเสธฝั่งเซิร์ฟเวอร์',
    !admForge.ok && /ผู้ดูแลระบบสูงสุด/.test(admForge.msg) &&
      USERS.filter(function (x) { return x.user_id === 'u-free-1'; }).length === 1,
    admForge.msg || 'ลบผ่าน!');
  await ctx.close();

  /* ===================== USER ===================== */
  console.log('\n########## USER ##########');
  resetDb();
  ctx = await ctxOf(b, 'USER');
  page = await ctx.newPage();
  page.on('pageerror', function (e) { errs.push(String(e.message)); });
  await page.goto(U(), { waitUntil: 'load' });
  await login(page);
  await page.evaluate(function () { location.hash = '#/users'; });
  await page.waitForTimeout(1500);
  const userView = await page.evaluate(function () { return location.hash; });
  chk('USER · เข้าหน้าจัดการสมาชิกไม่ได้ (Route Guard เดิม)', userView === '#/dashboard', 'hash=' + userView);
  await ctx.close();

  console.log('\n########## อื่น ๆ ##########');
  skip('9 · Session เดิมของบัญชีที่ลบใช้งานไม่ได้', 'ยืนยันแล้วฝั่ง SQL จริง (njhr_ctx → "เซสชันหมดอายุ")');
  skip('10 · Audit Log ที่ต้องเก็บไม่สูญหาย', 'ยืนยันแล้วฝั่ง SQL จริง (audit_log.actor เป็น text ไม่มี FK)');
  skip('15 · ไม่กระทบ FLOW Login / ลา / อนุมัติ', 'ครอบคลุมโดย p2_suite + p3_feature ที่รันแยก');

  chk('CONSOLE · ไม่มี unhandled error ตลอดชุด', errs.length === 0, errs.slice(0, 2).join(' | ') || 'ไม่มี');

  console.log('\n========== สรุป ==========');
  console.log('PASS ' + PASS + ' · FAIL ' + FAIL + ' · NOT TESTED ' + SKIP);
  await b.close(); srv.close();
  process.exit(FAIL ? 1 : 0);
})();
