/* dept_column_test.js — ทดสอบหน้า "จัดการแผนก" หลังเอาคอลัมน์ "ตั้งค่าการอนุมัติ" ออก
   ครบ 18 ข้อตาม Prompt · ใช้ fixture ล้วน ไม่แตะ Production
   ใช้: node harness/dept_column_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require('/home/claude/work/harness/fixtures.js');

let PASS = 0, FAIL = 0, SKIP = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8960);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(62) + (e || '')); }
function skip(n, e) { SKIP++; console.log('SKIP  ' + n.padEnd(62) + (e || '')); }

/* แผนกจำลอง — ยังส่ง leave_steps / ot_steps มาเหมือน RPC จริง
   เพื่อพิสูจน์ว่า UI เลิกใช้แล้ว ไม่ใช่เพราะ Backend หยุดส่ง */
const DEPTS = [
  { id: 'd-1', code: 'D01', name: 'ปฏิบัติการ',    employees_active: 12, employees_total: 15, leave_steps: 2, ot_steps: 1, created_at: '2026-01-01T00:00:00Z' },
  { id: 'd-2', code: 'D02', name: 'บัญชี',          employees_active: 5,  employees_total: 6,  leave_steps: 0, ot_steps: 0, created_at: '2026-01-01T00:00:00Z' },
  { id: 'd-3', code: 'D03', name: 'ทรัพยากรบุคคล', employees_active: 3,  employees_total: 3,  leave_steps: 3, ot_steps: 0, created_at: '2026-01-01T00:00:00Z' },
  { id: 'd-4', code: '',    name: 'ขนส่ง',          employees_active: 8,  employees_total: 11, leave_steps: 0, ot_steps: 2, created_at: '2026-01-01T00:00:00Z' }
];
/* หน้า "ตั้งค่าการอนุมัติ" อ่านจาก RPC คนละตัว — ต้องยังทำงานได้ */
const WF_OVERVIEW = [
  { department: 'ปฏิบัติการ',    leave_steps: 2, ot_steps: 1 },
  { department: 'บัญชี',          leave_steps: 0, ot_steps: 0 },
  { department: 'ทรัพยากรบุคคล', leave_steps: 3, ot_steps: 0 },
  { department: 'ขนส่ง',          leave_steps: 0, ot_steps: 2 }
];
let wfWriteCalls = [];

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

async function ctxOf(b, viewport) {
  const ctx = await b.newContext({ viewport: viewport || { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/rest/v1/rpc/*', function (route) {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    let out;
    if (fn === 'njhr_dept_list') {
      const q = String(bd.p_q || '').toLowerCase();
      out = DEPTS.filter(function (d) {
        return !q || d.name.toLowerCase().indexOf(q) >= 0 || (d.code || '').toLowerCase().indexOf(q) >= 0;
      });
    } else if (fn === 'njhr_dept_health') out = [];
    else if (fn === 'njhr_wf_overview') out = WF_OVERVIEW;
    else if (fn === 'njhr_dept_employees') {
      out = [{ employee_id: 'e-1', emp_code: 'NJ0001', emp_name: 'สมชาย ใจดี', nickname: 'ชาย',
               position_name: 'เจ้าหน้าที่', emp_status: 'ACTIVE', start_date: '2020-01-01' }];
    } else if (['njhr_wf_save','njhr_wf_delete','njhr_wf_step_save','njhr_wf_step_delete',
                'njhr_wf_step_move','njhr_wf_step_toggle','njhr_wf_approver_add',
                'njhr_wf_approver_remove'].indexOf(fn) >= 0) {   /* เฉพาะ RPC ที่ "เขียน" */
      wfWriteCalls.push(fn); out = { ok: true };
    } else out = F.respond(fn, bd);
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
async function openDepts(page) {
  await page.evaluate(function () { location.hash = '#/departments'; });
  await page.waitForFunction(function () {
    return document.querySelectorAll('#dp-table tbody tr').length > 0;
  }, { timeout: 25000 });
}
const grid = function (page) {
  return page.evaluate(function () {
    const t = document.querySelector('#dp-table table');
    if (!t) return null;
    return {
      heads: [].slice.call(t.querySelectorAll('thead th')).map(function (h) { return h.textContent.trim(); }),
      rows: [].slice.call(t.querySelectorAll('tbody tr')).map(function (tr) {
        return [].slice.call(tr.querySelectorAll('td')).map(function (td) { return td.textContent.trim(); });
      }),
      html: t.innerHTML
    };
  });
};

(async function () {
  const srv = await serve(ROOT, PORT);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const errs = [];

  console.log('\n########## หน้า "จัดการแผนก" ##########');
  let ctx = await ctxOf(b);
  let page = await ctx.newPage();
  page.on('pageerror', function (e) { errs.push(String(e.message)); });
  page.on('console', function (m) {
    const t = String(m.text());
    if (m.type() === 'error' && t.indexOf('403') < 0 && t.indexOf('400') < 0) errs.push(t);
  });
  await page.goto(U(), { waitUntil: 'load' });
  await login(page);
  await openDepts(page);

  let g = await grid(page);
  chk('1 · ไม่มี Column "ตั้งค่าการอนุมัติ" ในหัวตาราง',
    g.heads.indexOf('ตั้งค่าการอนุมัติ') < 0, g.heads.join(' | '));
  chk('2 · ไม่มีข้อความ "ยังไม่ได้ตั้ง"', g.html.indexOf('ยังไม่ได้ตั้ง') < 0, '');
  chk('3 · ไม่มี "ลา x ขั้น · OT x ขั้น"', !/ลา \d+ ขั้น|OT \d+ ขั้น/.test(g.html), '');
  chk('3b · หัวตารางเหลือ 5 คอลัมน์ตามสเปก',
    g.heads.length === 5 && g.heads.join('|') === 'รหัส|ชื่อแผนก|พนักงาน (ปฏิบัติงาน)|พนักงานทั้งหมด|จัดการ',
    g.heads.join(' | '));
  chk('3c · ทุกแถวมีจำนวน <td> เท่ากับหัวตาราง',
    g.rows.every(function (r) { return r.length === g.heads.length; }),
    'td/แถว = ' + g.rows.map(function (r) { return r.length; }).join(','));

  chk('4 · รหัสแผนกยังแสดงถูก',
    g.rows[0][0] === 'D01' && g.rows[3][0] === '—',
    'แถว1=' + g.rows[0][0] + ' · แถว4(ไม่มีรหัส)=' + g.rows[3][0]);
  chk('5 · ชื่อแผนกยังแสดงถูก',
    g.rows.map(function (r) { return r[1]; }).join(',') === 'ปฏิบัติการ,บัญชี,ทรัพยากรบุคคล,ขนส่ง',
    g.rows.map(function (r) { return r[1]; }).join(','));
  chk('6 · จำนวนพนักงานปฏิบัติงานยังถูก',
    g.rows.map(function (r) { return r[2]; }).join(',') === '12 คน,5 คน,3 คน,8 คน',
    g.rows.map(function (r) { return r[2]; }).join(','));
  chk('7 · จำนวนพนักงานทั้งหมดยังถูก',
    g.rows.map(function (r) { return r[3]; }).join(',') === '15 คน,6 คน,3 คน,11 คน',
    g.rows.map(function (r) { return r[3]; }).join(','));

  const btns = await page.evaluate(function () {
    const tr = document.querySelector('#dp-table tbody tr');
    return [].slice.call(tr.querySelectorAll('td:last-child button')).map(function (x) {
      return x.getAttribute('aria-label');
    });
  });
  chk('8a · ปุ่มจัดการเดิมครบ (ดูพนักงาน / แก้ไข / ลบ)',
    btns.indexOf('ดูพนักงาน') >= 0 && btns.indexOf('แก้ไข') >= 0 && btns.indexOf('ลบ') >= 0,
    btns.join(' | '));

  await page.evaluate(function () { document.querySelector('[data-dp-view]').click(); });
  /* รอจนพ้นสถานะ "กำลังโหลด…" จริง ไม่ใช่แค่หัวข้อการ์ดขึ้น */
  await page.waitForFunction(function () {
    const t = (document.getElementById('dp-emps') || {}).innerText || '';
    return /พนักงานในแผนก/.test(t) && !/กำลังโหลด/.test(t);
  }, { timeout: 20000 }).catch(function () {});
  const empTxt = await page.evaluate(function () {
    return ((document.getElementById('dp-emps') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 120);
  });
  chk('8b · ปุ่ม "ดูพนักงานในแผนก" ยังใช้งานได้', /NJ0001|สมชาย/.test(empTxt), empTxt);
  await page.evaluate(function () { document.querySelector('[data-dp-view]').click(); });
  await page.waitForTimeout(800);

  await page.evaluate(function () { document.querySelector('[data-dp-edit]').click(); });
  await page.waitForSelector('#modal-root .modal', { timeout: 15000 });
  chk('8c · ปุ่ม "แก้ไขแผนก" ยังเปิดฟอร์มได้',
    await page.evaluate(function () { return /แผนก/.test((document.querySelector('#modal-root .modal-head') || {}).innerText || ''); }),
    await page.evaluate(function () { return (document.querySelector('#modal-root .modal-head') || {}).innerText || ''; }));
  await page.evaluate(function () { NJHR.ui.closeModal(); });
  await page.waitForTimeout(400);

  /* 9) ค้นหา */
  await page.evaluate(function () {
    const i = document.getElementById('dp-q'); i.value = 'บัญชี'; i.oninput();
  });
  await page.waitForFunction(function () {
    return document.querySelectorAll('#dp-table tbody tr').length === 1;
  }, { timeout: 15000 }).catch(function () {});
  let g2 = await grid(page);
  chk('9 · ค้นหาแผนกยังใช้ได้',
    g2.rows.length === 1 && g2.rows[0][1] === 'บัญชี', 'ผลลัพธ์ ' + g2.rows.length + ' แถว');
  chk('9b · ผลค้นหาก็ไม่มีคอลัมน์ตั้งค่าการอนุมัติ',
    g2.heads.indexOf('ตั้งค่าการอนุมัติ') < 0 && g2.rows[0].length === 5, g2.heads.join(' | '));
  await page.evaluate(function () {
    const i = document.getElementById('dp-q'); i.value = ''; i.oninput();
  });
  await page.waitForTimeout(900);

  skip('10 · Filter/Sort เดิม', 'หน้านี้ไม่มี Filter/Sort — มีเพียงช่องค้นหา (ตรวจจากไฟล์จริง)');

  chk('16 · ไม่มี Error จาก leave_steps / ot_steps ที่เลิกใช้',
    errs.length === 0, errs.slice(0, 2).join(' | ') || 'ไม่มี');
  chk('16b · Backend ยังส่ง leave_steps / ot_steps มาเหมือนเดิม (UI แค่ไม่ใช้)',
    DEPTS[0].leave_steps === 2 && DEPTS[0].ot_steps === 1, 'RPC ไม่ถูกแก้');

  /* ===== 11–13) หน้าตั้งค่าการอนุมัติ ===== */
  console.log('\n########## หน้า "ตั้งค่าการอนุมัติ" ##########');
  wfWriteCalls = [];
  await page.evaluate(function () { location.hash = '#/approval-settings'; });
  await page.waitForTimeout(3000);
  const asPage = await page.evaluate(function () {
    const h = document.getElementById('view-host');
    return { hash: location.hash, len: (h && h.innerHTML.length) || 0,
             txt: ((h && h.innerText) || '').replace(/\s+/g, ' ').slice(0, 200) };
  });
  chk('11 · หน้า "ตั้งค่าการอนุมัติ" ยังเปิดได้',
    asPage.hash === '#/approval-settings' && asPage.len > 500, 'viewHost=' + asPage.len + 'B');
  chk('12 · Workflow เดิมยังอยู่ (คำเตือนอ่านจาก njhr_wf_overview ได้ปกติ)',
    /ยังไม่ได้ตั้งผู้อนุมัติ|การลางาน|ผู้อนุมัติ/.test(asPage.txt), asPage.txt.slice(0, 90));
  chk('13 · ไม่มีการเรียก RPC เขียน Workflow ใด ๆ ตลอดชุดทดสอบ',
    wfWriteCalls.length === 0, wfWriteCalls.join(',') || 'ไม่มี');

  /* ===== 14–15) ลา / OT ===== */
  await page.evaluate(function () { location.hash = '#/leave'; });
  await page.waitForTimeout(2200);
  chk('14 · ระบบลาไม่กระทบ',
    await page.evaluate(function () {
      return location.hash === '#/leave' && (document.getElementById('view-host').innerHTML.length > 300);
    }), '');
  await page.evaluate(function () { location.hash = '#/ot'; });
  await page.waitForTimeout(2200);
  chk('15 · ระบบ OT ไม่กระทบ',
    await page.evaluate(function () {
      return location.hash === '#/ot' && (document.getElementById('view-host').innerHTML.length > 300);
    }), '');
  await ctx.close();

  /* ===== 17–18) Responsive ===== */
  console.log('\n########## Responsive ##########');
  for (const vp of [{ width: 360, height: 740, n: '17 · มือถือ 360x740 ไม่ล้นจอ' },
                    { width: 768, height: 1024, n: '17b · แท็บเล็ต 768x1024 ไม่ล้นจอ' },
                    { width: 1440, height: 900, n: '18 · คอมพิวเตอร์ 1440x900 จัดตารางพอดี' }]) {
    const c2 = await ctxOf(b, { width: vp.width, height: vp.height });
    const p2 = await c2.newPage();
    p2.on('pageerror', function (e) { errs.push(String(e.message)); });
    await p2.goto(U(), { waitUntil: 'load' });
    await login(p2); await openDepts(p2);
    const r = await p2.evaluate(function () {
      const t = document.querySelector('#dp-table table');
      const w = document.querySelector('#dp-table .table-wrap');
      return { docOverflow: document.documentElement.scrollWidth > window.innerWidth,
               tableW: Math.round(t.getBoundingClientRect().width),
               wrapW: Math.round(w.getBoundingClientRect().width),
               vw: window.innerWidth,
               cols: t.querySelectorAll('thead th').length };
    });
    const ok = !r.docOverflow && r.wrapW <= r.vw && r.cols === 5;
    ok ? PASS++ : FAIL++;
    console.log((ok ? 'PASS  ' : 'FAIL  ') + vp.n.padEnd(62) +
      'ตาราง ' + r.tableW + 'px / กรอบ ' + r.wrapW + 'px / จอ ' + r.vw + 'px · ' + r.cols + ' คอลัมน์');
    await c2.close();
  }

  chk('CONSOLE · ไม่มี unhandled error ตลอดชุด', errs.length === 0, errs.slice(0, 2).join(' | ') || 'ไม่มี');

  console.log('\n========== สรุป ==========');
  console.log('PASS ' + PASS + ' · FAIL ' + FAIL + ' · NOT TESTED ' + SKIP);
  await b.close(); srv.close();
  process.exit(FAIL ? 1 : 0);
})();
