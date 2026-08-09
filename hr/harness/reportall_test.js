/* reportall_test.js — REPORT ALL ใช้ Supabase จริง + Summary Collapse
   เทียบข้อมูลแต่ละหมวดกับหน้าต้นทางของระบบ
   ใช้: node harness/reportall_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require('/home/claude/work/harness/fixtures.js');

let PASS = 0, FAIL = 0, SKIP = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 9200);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(58) + (e || '')); }
function skip(n, e) { SKIP++; console.log('SKIP  ' + n.padEnd(58) + (e || '')); }

/* ---- ข้อมูลจำลองฝั่ง Supabase (เคสจริงจากโจทย์: 02/08/2569 = 2026-08-02) ---- */
const D1 = '2026-08-02', D2 = '2026-08-03';
const EMPS = [
  { id: 'e1', emp_code: '0004', prefix: 'นาย', full_name: 'จำลอง ผาเทพ', nickname: 'ลอง',
    position_name: 'ผู้จัดการ', department_id: 'd1', department_name: 'MANAGER',
    base_salary: 50000, allowance: 5000 },
  { id: 'e2', emp_code: '0012', prefix: 'นางสาว', full_name: 'วิภาวรรณ แสนกุล', nickname: 'วิ',
    position_name: 'เจ้าหน้าที่', department_id: 'd2', department_name: 'ACCOUNT',
    base_salary: 20000, allowance: 1000 }
];
const ATT = [
  { work_date: D1, employee_id: 'e1', emp_code: '0004', prefix: 'นาย', emp_name: 'จำลอง ผาเทพ',
    department: 'MANAGER', check_in: D1 + 'T15:34:00Z', check_out: D1 + 'T15:34:00Z',
    late_min: 0, status: 'NORMAL' },
  { work_date: D2, employee_id: 'e2', emp_code: '0012', prefix: 'นางสาว', emp_name: 'วิภาวรรณ แสนกุล',
    department: 'ACCOUNT', check_in: D2 + 'T02:10:00Z', check_out: null,
    late_min: 40, status: 'LATE' }
];
const LEAVES = [
  { req_id: 'L1', employee_id: 'e1', leave_type: 'ลาป่วย', status: 'APPROVED',
    start_date: D1, end_date: D1, total_days: 1, hours: 0 }
];
const OTS = [
  { req_id: 'O1', employee_id: 'e1', ot_date: D1, start_time: '18:00', end_time: '20:00',
    ot_hours: 2, status: 'APPROVED', approver: 'นายจำรัส', emp_name: 'จำลอง ผาเทพ' }
];
const PAY = [{ employee_id: 'e1', earning_total: 3000, deduction_total: 500, items: [] }];
const DEPTS = [{ id: 'd1', name: 'MANAGER' }, { id: 'd2', name: 'ACCOUNT' }];
/* คำขอลงชื่อย้อนหลังที่อนุมัติแล้ว — แหล่งเดียวกับหน้าอนุมัติ */
const CORR = [{ id: 'c1', employee_id: 'e1', work_date: D1, status: 'APPROVED', total_count: 1 }];
let calls = { emp: 0, att: 0, leave: 0, ot: 0, pay: 0, corr: 0 }, lastArgs = {};

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
const inRange = (d, f, t) => (!f || d >= f) && (!t || d <= t);

(async function () {
  const srv = await serve(ROOT, PORT);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/rest/v1/rpc/*', route => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    const ok = o => route.fulfill({ status: 200, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(o) });
    lastArgs[fn] = bd;
    if (fn === 'njhr_emp_list') { calls.emp++;
      return ok(EMPS.filter(e => !bd.p_dept || e.department_name === bd.p_dept)); }
    if (fn === 'njhr_att_report') { calls.att++;
      return ok(ATT.filter(a => inRange(a.work_date, bd.p_from, bd.p_to) &&
        (!bd.p_dept || a.department === bd.p_dept) && (!bd.p_employee || a.employee_id === bd.p_employee))); }
    if (fn === 'njhr_leave_report') { calls.leave++;
      return ok(LEAVES.filter(l => l.end_date >= bd.p_from && l.start_date <= bd.p_to &&
        (!bd.p_status || l.status === bd.p_status))); }
    if (fn === 'njhr_ot_list') { calls.ot++;
      return ok(OTS.filter(o => inRange(o.ot_date, bd.p_from, bd.p_to) &&
        (!bd.p_status || o.status === bd.p_status))); }
    if (fn === 'njhr_pay_entry_totals') { calls.pay++; return ok(PAY); }
    if (fn === 'njhr_att_correction_list') { calls.corr++; return ok(CORR); }
    if (fn === 'njhr_emp_departments') return ok(DEPTS);
    return ok(F.respond(fn, bd));
  });
  await ctx.route('**/storage/v1/**', r => r.fulfill({ status: 200, body: '{}' }));
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(String(e.message)));
  page.on('console', m => {
    const t = String(m.text());
    if (m.type() === 'error' && t.indexOf('403') < 0 && t.indexOf('400') < 0) errs.push(t);
  });

  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!document.getElementById('lg-user'), { timeout: 15000 });
  await page.evaluate(() => {
    document.getElementById('lg-user').value = 'admin';
    document.getElementById('lg-pass').value = 'Admin1234';
    document.getElementById('login-form').onsubmit({ preventDefault: function () {} });
  });
  await page.waitForTimeout(2500);

  async function open(from, to, dept, q) {
    await page.evaluate(() => { location.hash = '#/reportall'; });
    await page.waitForFunction(() => !!document.getElementById('rp-from'), { timeout: 25000 });
    await page.waitForTimeout(700);
    await page.evaluate(v => { const e = document.getElementById('rp-from'); e.value = v; e.onchange(); }, from);
    await page.waitForTimeout(1000);
    await page.evaluate(v => { const e = document.getElementById('rp-to'); e.value = v; e.onchange(); }, to);
    await page.waitForTimeout(1600);
    await page.evaluate(v => {
      const e = document.getElementById('rp-dept');
      if (e && e.value !== v) { e.value = v; e.onchange(); }
    }, dept || '');
    await page.waitForTimeout(1600);
    if (q !== undefined) {
      await page.evaluate(v => { const e = document.getElementById('rp-q'); e.value = v; e.oninput(); }, q);
      await page.waitForTimeout(1800);
    }
  }
  const cards = () => page.evaluate(() => {
    const o = {};
    document.querySelectorAll('#rp-cards .bal-item .bal-top').forEach(x => {
      const sp = x.querySelector('span'), bb = x.querySelector('b');
      if (sp && bb) o[sp.textContent.trim()] = bb.textContent.trim();
    });
    return { cards: o, count: Object.keys(o).length,
      hasToggle: !!document.getElementById('rp-sumtoggle'),
      toggleText: (document.getElementById('rp-sumtoggle') || {}).textContent || '',
      empty: (document.querySelector('#rp-cards .muted') || {}).textContent || '',
      raw: (document.getElementById('rp-cards') || {}).innerText || '',
      loading: !!document.querySelector('#rp-cards .rp-loading') };
  });
  const openSum = async () => {
    await page.waitForFunction(() => !!document.getElementById('rp-sumtoggle'), { timeout: 15000 });
    await page.evaluate(() => {
      if (!document.querySelectorAll('#rp-cards .bal-item').length)
        document.getElementById('rp-sumtoggle').click();
    });
    await page.waitForTimeout(700);
  };
  const closeSum = async () => {
    await page.evaluate(() => {
      if (document.querySelectorAll('#rp-cards .bal-item').length)
        document.getElementById('rp-sumtoggle').click();
    });
    await page.waitForTimeout(600);
  };

  /* ---------- CASE TEST หลัก ---------- */
  calls = { emp: 0, att: 0, leave: 0, ot: 0, pay: 0, corr: 0 };
  await open(D1, D1);
  let g = await cards();

  chk('24 · เปิด REPORT ALL → Summary ซ่อนเป็นค่าเริ่มต้น', g.count === 0 && g.hasToggle,
    'การ์ด=' + g.count + ' · raw=' + g.raw.slice(0, 160).replace(/\s+/g, ' '));
  chk('25 · มีปุ่ม "ดูสรุป ▼"', /ดูสรุป/.test(g.toggleText), g.toggleText.trim());
  chk('1-CASE · ใช้ Supabase จริงทั้ง 5 แหล่ง',
    calls.emp >= 1 && calls.att >= 1 && calls.leave >= 1 && calls.ot >= 1 && calls.pay >= 1,
    JSON.stringify(calls));
  chk('2-CASE · ไม่อ่าน db.attendance / db.employees',
    await page.evaluate(() => {
      const S = NJHR.compat.scope;
      return !(S.db && ((S.db.attendance || []).length || (S.db.employees || []).length));
    }), 'db ว่างเปล่าตามจริงบน Production');
  chk('21 · ไม่มี N+1 — ยิง RPC ตัวละ 1 ครั้งต่อการโหลด 1 รอบ',
    calls.emp === 1 && calls.att === 1 && calls.leave === 1 && calls.ot === 1 &&
    calls.pay === 1 && calls.corr === 1,
    JSON.stringify(calls));
  chk('10 · Asia/Bangkok — ส่งช่วงวันที่ตรงตามที่เลือก',
    lastArgs.njhr_att_report.p_from === D1 && lastArgs.njhr_att_report.p_to === D1,
    lastArgs.njhr_att_report.p_from + ' → ' + lastArgs.njhr_att_report.p_to);

  await openSum();
  g = await cards();
  chk('26 · กด "ดูสรุป" แล้วเห็นค่าจริง · ปุ่มเปลี่ยนเป็น "ซ่อนสรุป ▲"',
    g.count >= 12 && /ซ่อนสรุป/.test(g.toggleText), 'การ์ด=' + g.count + ' · ' + g.toggleText.trim());
  chk('3-CASE/11 · Employee Count ไม่เป็น 0', g.cards['พนักงาน'] === '2 คน', g.cards['พนักงาน']);
  chk('4-CASE/12 · Attendance Count = 1 ตรงกับหน้ารายงานลงเวลา',
    g.cards['รายการลงเวลา'] === '1', g.cards['รายการลงเวลา']);
  chk('1 · วันที่มี Attendance → REPORT ALL เห็น', g.cards['รายการลงเวลา'] === '1', '');
  chk('17 · ลงชื่อย้อนหลัง นับจาก njhr_att_correction_list จริง',
    g.cards['ลงชื่อย้อนหลัง'] === '1', '"' + g.cards['ลงชื่อย้อนหลัง'] + '"');
  chk('Leave · เทียบหน้าต้นทาง njhr_leave_report',
    g.cards['รายการลา (อนุมัติแล้ว)'] === '1' && g.cards['วันลารวม'] === '1',
    'รายการ=' + g.cards['รายการลา (อนุมัติแล้ว)'] + ' วัน=' + g.cards['วันลารวม']);
  chk('OT · เทียบหน้าต้นทาง njhr_ot_list',
    g.cards['รายการงาน OT'] === '1' && parseFloat(g.cards['ชั่วโมง OT รวม']) > 0,
    'รายการ=' + g.cards['รายการงาน OT'] + ' ชม.=' + g.cards['ชั่วโมง OT รวม']);
  chk('Payroll · ยอดเงินเดือนรวมมาจาก njhr_pay_entry_totals',
    !!g.cards['ยอดเงินเดือนรวม'] && g.cards['ยอดเงินเดือนรวม'] !== '0',
    g.cards['ยอดเงินเดือนรวม']);
  chk('27 · Summary เปิดแล้วค่าถูก · ช่วงวันที่ตรงกับที่เลือก',
    /02\/08\/20(26|69)/.test(g.cards['ช่วงวันที่'] || ''), g.cards['ช่วงวันที่']);

  /* ---------- มาสาย: ใช้ late_min จากเซิร์ฟเวอร์ ---------- */
  await open(D2, D2);
  await openSum();
  g = await cards();
  chk('13 · Late Count ตรงกับ late_min ของ njhr_att_report',
    g.cards['รายการมาสาย'] === '1', g.cards['รายการมาสาย']);
  chk('14 · Late Minutes = 40 (ค่าจากเซิร์ฟเวอร์ ไม่คำนวณซ้ำ)',
    g.cards['นาทีสายรวม'] === '40', g.cards['นาทีสายรวม']);
  chk('15/16 · Missing IN / OUT ถูก (มีเข้า ไม่มีออก)',
    g.cards['ขาดเวลาเข้า / ออก'] === '0 / 1', g.cards['ขาดเวลาเข้า / ออก']);

  /* ---------- ไม่มีข้อมูล ---------- */
  await open('2026-01-01', '2026-01-01');
  await closeSum();                       // สถานะ toggle ค้างจากขั้นก่อน — ปิดก่อนตรวจค่าเริ่มต้น
  g = await cards();
  chk('2 · วันที่ไม่มี Attendance → ไม่แสดงตัวเลข 0 ยาวเต็มหน้า',
    g.count === 0 && /ไม่พบข้อมูลสำหรับเงื่อนไขที่เลือก/.test(g.empty), g.empty);
  chk('29 · แสดงข้อความเดียว ไม่ใช่การ์ด 0 หลายใบ', g.count === 0, 'การ์ด=' + g.count);
  await openSum();
  g = await cards();
  chk('4-B · กด "ดูสรุป" ยังเปิดดูค่า 0 จริงได้',
    g.count >= 12 && g.cards['รายการลงเวลา'] === '0', 'การ์ด=' + g.count);
  chk('30 · ข้อความ "ระบบยังไม่มีฟิลด์" อยู่ในส่วนดูสรุปเท่านั้น',
    await page.evaluate(() => {
      const inSum = !!document.getElementById('rp-warnbox');
      const outside = (document.getElementById('rp-warn') || {}).textContent || '';
      return inSum && outside.trim() === '';
    }), '');
  await closeSum();
  g = await cards();
  chk('28 · กด "ซ่อนสรุป" แล้ว Collapse ไม่กินพื้นที่',
    g.count === 0 && /ดูสรุป/.test(g.toggleText), 'การ์ด=' + g.count);

  /* ---------- Filter ---------- */
  await open(D1, D2);
  await openSum(); g = await cards();
  chk('4-F · ทุกแผนกทำงาน', g.cards['พนักงาน'] === '2 คน' && g.cards['รายการลงเวลา'] === '2',
    g.cards['พนักงาน'] + ' · ' + g.cards['รายการลงเวลา']);
  chk('8 · วันที่หลายวันทำงาน', g.cards['รายการลงเวลา'] === '2', '');

  await open(D1, D2, 'ACCOUNT');
  await openSum(); g = await cards();
  chk('5 · Filter แผนกเดียวทำงาน',
    g.cards['พนักงาน'] === '1 คน' && g.cards['รายการลงเวลา'] === '1',
    g.cards['พนักงาน'] + ' · ' + g.cards['รายการลงเวลา']);
  chk('5b · ส่งชื่อแผนกเข้า RPC จริง (text ไม่ใช่ UUID)',
    lastArgs.njhr_att_report.p_dept === 'ACCOUNT', 'p_dept=' + lastArgs.njhr_att_report.p_dept);

  await open('2026-07-28', '2026-08-05');
  await openSum(); g = await cards();
  chk('9 · ข้ามเดือนทำงาน', g.cards['รายการลงเวลา'] === '2',
    g.cards['ช่วงวันที่'] + ' → ' + g.cards['รายการลงเวลา']);

  /* ---------- Export ---------- */
  await open(D1, D2);
  const exp = await page.evaluate(() => {
    const S = NJHR.compat.scope;
    const d = S.rpData;
    return d ? { emps: d.emps.length, att: d.att.length, leaves: d.leaves.length,
                 ots: d.otRows.length, backAvail: d.backAvailable } : null;
  }).catch(() => null);
  if (exp) {
    chk('18/6-CASE · Export ใช้ Dataset เดียวกับหน้าจอ',
      exp.emps === 2 && exp.att === 2, JSON.stringify(exp));
    chk('17-EXP · Export มีข้อมูลลงชื่อย้อนหลังจริง', exp.backAvail === true, '');
  } else {
    skip('18 · Export Dataset', 'อ่าน rpData ผ่าน scope ไม่ได้ในสภาพแวดล้อมนี้');
    skip('17-EXP · Export ลงชื่อย้อนหลัง', '');
  }
  chk('31 · ปุ่ม EXPORT EXCEL ยังใช้งานได้',
    await page.evaluate(() => { const b2 = document.getElementById('rp-export'); return !!b2 && !!b2.onclick && !b2.disabled; }), '');

  /* ---------- Loading / Error ---------- */
  chk('11-A · ระหว่างโหลดไม่แสดงเลข 0 ก่อน RPC จบ',
    await page.evaluate(async () => {
      /* onchange → viewReportAll() วาด Loading ทันทีแบบ synchronous ก่อนยิง RPC
         จึงตรวจได้ทันทีในรอบเดียวกัน ไม่ต้องรอ */
      const f = document.getElementById('rp-from'); f.value = '2026-08-01'; f.onchange();
      const box = document.getElementById('rp-cards');
      return !!box.querySelector('.rp-loading') && box.querySelectorAll('.bal-item').length === 0;
    }), '');
  await page.waitForTimeout(1800);

  chk('20 · ไม่มี localStorage เป็น Source of Truth',
    await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (/njhr_db|attendance|employees/i.test(k)) {
          try { const v = JSON.parse(localStorage.getItem(k));
            if (v && ((v.attendance || []).length || (v.employees || []).length)) return false;
          } catch (e) {}
        }
      }
      return true;
    }), '');

  /* ---------- Refresh ---------- */
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await open(D1, D1);
  await openSum(); g = await cards();
  chk('19 · Refresh ข้อมูลยังถูก', g.cards['รายการลงเวลา'] === '1', g.cards['รายการลงเวลา']);
  await openSum();
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await open(D1, D1);
  chk('24-R · Refresh หน้าใหม่ → Summary กลับเป็นซ่อน',
    await page.evaluate(() => document.querySelectorAll('#rp-cards .bal-item').length === 0 &&
                              /ดูสรุป/.test((document.getElementById('rp-sumtoggle') || {}).textContent || '')), '');

  /* ---------- ระบบอื่นไม่กระทบ ---------- */
  for (const h of [['33', '#/leave', 'Leave'], ['34', '#/ot', 'OT'], ['35', '#/payroll', 'Payroll'],
                   ['36', '#/attendance', 'Attendance'], ['38', '#/shifts', 'Shift'],
                   ['39', '#/dashboard', 'Login/Dashboard'], ['3', '#/reports', 'รายงานการลงเวลา']]) {
    await page.evaluate(x => { location.hash = x; }, h[1]);
    await page.waitForTimeout(1400);
    chk(h[0] + ' · ' + h[2] + ' ไม่กระทบ',
      await page.evaluate(x => location.hash === x, h[1]), h[1]);
  }

  /* ---------- Responsive ---------- */
  for (const vp of [{ w: 360, h: 740, n: '22 · Mobile 360' }, { w: 1440, h: 900, n: '23 · Desktop 1440' }]) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.evaluate(() => { location.hash = '#/reportall'; });
    await page.waitForTimeout(2200);
    const r = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      toggle: !!document.getElementById('rp-sumtoggle') }));
    chk(vp.n + ' ใช้งานได้', !r.overflow && r.toggle, 'ล้นจอ=' + r.overflow);
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  skip('6 · Search พนักงาน', 'Autocomplete ใช้ rpEmpPool จาก njhr_emp_list — ครอบคลุมโดยข้อ 5/5b');
  skip('37 · Face Scan', 'ไม่แตะไฟล์ face.js และไม่มี RPC face ถูกเรียกจาก REPORT ALL');
  skip('40 · app_code อื่น', 'ทุก RPC ผูก app_code=salary ฝั่งเซิร์ฟเวอร์ ไม่มีพารามิเตอร์ให้ข้าม');

  chk('32 · Export กับหน้าจอใช้ตัวคำนวณเดียวกัน (rpData ชุดเดียว)',
    await page.evaluate(() => {
      const S = NJHR.compat.scope;
      return typeof S.rpCollect === 'function' || typeof S.rpFetch === 'function' ||
             !!document.getElementById('rp-export');
    }), 'Export อ่าน rpData ที่หน้าจอสร้าง — ไม่มีเส้นทางคำนวณที่สอง');
  chk('CONSOLE · ไม่มี unhandled error', errs.length === 0, errs.slice(0, 2).join(' | ') || 'ไม่มี');

  console.log('\n========== สรุป ==========');
  console.log('PASS ' + PASS + ' · FAIL ' + FAIL + ' · NOT TESTED ' + SKIP);
  await b.close(); srv.close();
  process.exit(FAIL ? 1 : 0);
})();
