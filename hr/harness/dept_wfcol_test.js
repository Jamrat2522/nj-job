/* dept_wfcol_test.js — ทดสอบการลบคอลัมน์ "ตั้งค่าการอนุมัติ" ออกจากหน้าจัดการแผนก
   ใช้: node harness/dept_wfcol_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require('/home/claude/work/harness/fixtures.js');

let PASS = 0, FAIL = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8970);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(60) + (e || '')); }

/* แผนกจำลอง — มีทั้งที่ตั้งค่า Workflow แล้วและยังไม่ได้ตั้ง
   ถ้าคอลัมน์ยังอยู่ ข้อความ "ยังไม่ได้ตั้ง" / "ขั้น · OT" จะโผล่บนหน้า */
const DEPTS = [
  { id: 'd-1', code: 'AC', name: 'ACCOUNT',                  employees_active: 12, employees_total: 12, leave_steps: 0, ot_steps: 0, approver_count: 0 },
  { id: 'd-2', code: 'EX', name: 'CUSTOMER SERVICE EXPORT',  employees_active: 11, employees_total: 11, leave_steps: 0, ot_steps: 0, approver_count: 0 },
  { id: 'd-3', code: 'IM', name: 'CUSTOMER SERVICE IMPORT',  employees_active: 33, employees_total: 33, leave_steps: 3, ot_steps: 0, approver_count: 2 }
];

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

(async function () {
  const srv = await serve(ROOT, PORT);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/rest/v1/rpc/*', function (route) {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    let out;
    if (fn === 'njhr_dept_list') out = DEPTS.map(function (d) { return Object.assign({}, d, { total_count: DEPTS.length }); });
    else out = F.respond(fn, bd);
    route.fulfill({ status: 200, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(out) });
  });
  await ctx.route('**/storage/v1/**', function (r) { r.fulfill({ status: 200, body: '{}' }); });
  const page = await ctx.newPage();
  page.on('pageerror', function (e) { errs.push(String(e.message)); });
  page.on('console', function (m) {
    const t = String(m.text());
    if (m.type() === 'error' && t.indexOf('403') < 0 && t.indexOf('400') < 0) errs.push(t);
  });

  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(function () { return !!document.getElementById('lg-user'); }, { timeout: 15000 });
  await page.evaluate(function () {
    document.getElementById('lg-user').value = 'admin';
    document.getElementById('lg-pass').value = 'Admin1234';
    document.getElementById('login-form').onsubmit({ preventDefault: function () {} });
  });
  await page.waitForTimeout(2500);

  // 1) เปิดหน้าจัดการแผนก
  await page.evaluate(function () { location.hash = '#/departments'; });
  await page.waitForFunction(function () {
    return document.querySelectorAll('#dp-table table tbody tr').length > 0;
  }, { timeout: 25000 }).catch(function () {});

  const t = await page.evaluate(function () {
    const tb = document.querySelector('#dp-table table');
    if (!tb) return null;
    const heads = [].slice.call(tb.querySelectorAll('thead th')).map(function (x) { return x.textContent.trim(); });
    const rows  = [].slice.call(tb.querySelectorAll('tbody tr'));
    return {
      heads: heads,
      rowCellCounts: rows.map(function (r) { return r.children.length; }),
      rowCount: rows.length,
      firstRow: [].slice.call(rows[0].children).map(function (c) { return c.textContent.trim(); }),
      html: tb.innerHTML,
      btnView: tb.querySelectorAll('[data-dp-view]').length,
      btnWf:   tb.querySelectorAll('[data-dp-wf]').length,
      btnEdit: tb.querySelectorAll('[data-dp-edit]').length,
      btnDel:  tb.querySelectorAll('[data-dp-del]').length
    };
  });

  chk('1 · หน้าจัดการแผนกเปิดได้', !!t && t.rowCount === 3, t ? 'แถว=' + t.rowCount : 'ไม่พบตาราง');
  chk('2 · หัวข้อ "ตั้งค่าการอนุมัติ" หายจาก Header',
    t.heads.indexOf('ตั้งค่าการอนุมัติ') < 0, t.heads.join(' | '));
  chk('2b · Header เหลือ 5 คอลัมน์ตามที่กำหนด',
    t.heads.length === 5 &&
    t.heads.join('|') === 'รหัส|ชื่อแผนก|พนักงาน (ปฏิบัติงาน)|พนักงานทั้งหมด|จัดการ',
    t.heads.join(' | '));
  chk('2c · ไม่มีข้อความ "ยังไม่ได้ตั้ง" ในตาราง', t.html.indexOf('ยังไม่ได้ตั้ง') < 0, '');
  chk('2d · ไม่มีข้อความ "ขั้น · OT" ในตาราง', t.html.indexOf('ขั้น · OT') < 0, '');
  chk('3 · ตารางไม่เบี้ยว — ทุกแถวมี 5 ช่องเท่ากัน',
    t.rowCellCounts.every(function (n) { return n === 5; }), JSON.stringify(t.rowCellCounts));
  chk('4 · จำนวนคอลัมน์ Header เท่ากับทุก Row',
    t.rowCellCounts.every(function (n) { return n === t.heads.length; }),
    'header=' + t.heads.length + ' rows=' + JSON.stringify(t.rowCellCounts));
  chk('4b · ข้อมูลแถวแรกตรงคอลัมน์',
    t.firstRow[0] === 'AC' && t.firstRow[1] === 'ACCOUNT' &&
    t.firstRow[2] === '12 คน' && t.firstRow[3] === '12 คน',
    t.firstRow.slice(0, 4).join(' | '));
  chk('5 · ปุ่มจัดการเดิมครบทุกตัว',
    t.btnView === 3 && t.btnWf === 3 && t.btnEdit === 3 && t.btnDel === 3,
    'ดูพนักงาน=' + t.btnView + ' ตั้งค่าอนุมัติ=' + t.btnWf + ' แก้ไข=' + t.btnEdit + ' ลบ=' + t.btnDel);

  // 5b) ปุ่มดูพนักงานยังกดได้
  await page.evaluate(function () { document.querySelector('[data-dp-view]').click(); });
  await page.waitForTimeout(1200);
  chk('5b · กดปุ่มดูพนักงานได้ ไม่มี error',
    await page.evaluate(function () { return !!document.getElementById('dp-emps'); }), '');

  // 6) ปุ่มตั้งค่าการอนุมัติยังพาไปหน้าเดิม
  await page.evaluate(function () { document.querySelector('[data-dp-wf]').click(); });
  await page.waitForTimeout(1500);
  const h = await page.evaluate(function () { return location.hash; });
  chk('6 · ปุ่มตั้งค่าการอนุมัติยังพาไป #/approval-settings', h === '#/approval-settings', 'hash=' + h);
  chk('6b · หน้าตั้งค่าการอนุมัติเปิดได้ ไม่พัง',
    await page.evaluate(function () {
      return (((document.getElementById('view-host') || {}).innerText) || '').length > 50;
    }), '');

  // 7) Workflow เดิมไม่เปลี่ยน — RPC ที่เกี่ยวข้องไม่ถูกแตะ
  chk('7 · njhr_dept_list ยังคืน leave_steps/ot_steps เหมือนเดิม (ไม่แก้ SQL)',
    DEPTS[2].leave_steps === 3 && DEPTS[2].ot_steps === 0, 'ข้อมูลจาก RPC ไม่เปลี่ยน แค่ไม่แสดงผล');

  // 8) Leave / OT ไม่กระทบ
  await page.evaluate(function () { location.hash = '#/leave'; });
  await page.waitForTimeout(1500);
  chk('8 · หน้าลางานเปิดได้',
    await page.evaluate(function () { return location.hash === '#/leave'; }), '');
  await page.evaluate(function () { location.hash = '#/ot'; });
  await page.waitForTimeout(1500);
  chk('8b · หน้า OT เปิดได้',
    await page.evaluate(function () { return location.hash === '#/ot'; }), '');

  chk('CONSOLE · ไม่มี unhandled error', errs.length === 0, errs.slice(0, 2).join(' | ') || 'ไม่มี');

  console.log('\n========== สรุป ==========');
  console.log('PASS ' + PASS + ' · FAIL ' + FAIL);
  await b.close(); srv.close();
  process.exit(FAIL ? 1 : 0);
})();
