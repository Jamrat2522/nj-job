/* report_all_1sheet_test.js — REPORT ALL: Excel 1 Sheet + พนักงานครบ + เงินเดือนจริง
   สร้างไฟล์ .xlsx จริงจากเบราว์เซอร์ แล้วเปิดตรวจด้วย openpyxl
   ใช้: node harness/report_all_1sheet_test.js <ทางโปรเจกต์ absolute> <port> [out.xlsx] */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const F = require(__dirname + '/fixtures.js');

let PASS = 0, FAIL = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8711);
const OUT = process.argv[4] || path.join(os.tmpdir(), 'njhr-report-all.xlsx');
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(56) + (e || '')); }

/* 105 คน — เกินเพดาน 100 ของ njhr_emp_list เดิม */
const N = 105;
const EMPS = [];
for (let i = 1; i <= N; i++) {
  EMPS.push({ id: 'e' + i, emp_code: String(1000 + i), full_name: 'นาย ทดสอบ' + i,
    nickname: '', department_name: i % 2 ? 'ปฏิบัติการ' : 'บัญชี', position_name: 'เจ้าหน้าที่',
    start_date: '2020-01-01', status: 'ACTIVE', salary_type: 'MONTHLY',
    base_salary: 40000, position_allow: 5000, diligence_allow: 400,
    phone_allow: 2000, travel_allow: 0, fuel_allow: 5000, total_count: N });
}
/* งวดนี้คนแรกมีรายการเงินเดือนจริง — ต้องชนะค่า fallback จาก employees */
const PAY = [{ employee_id: 'e1', earning_total: 61000, deduction_total: 1550, items: [
  { code: 'POSITION_ALLOW', name: 'ค่าตำแหน่ง', kind: 'EARNING', amount: 6000 },
  { code: 'FUEL_ALLOW', name: 'ค่าน้ำมัน', kind: 'EARNING', amount: 5500 },
  { code: 'PHONE_ALLOW', name: 'ค่าโทรศัพท์', kind: 'EARNING', amount: 2500 },
  { code: 'DILIGENCE', name: 'เบี้ยขยัน', kind: 'EARNING', amount: 500 },
  { code: 'SHIFT_ALLOW', name: 'ค่ากะ', kind: 'EARNING', amount: 1200 },
  { code: 'BONUS', name: 'โบนัส', kind: 'EARNING', amount: 3000 },
  { code: 'SSO', name: 'ประกันสังคม', kind: 'DEDUCTION', amount: 750 },
  { code: 'STUDENT_LOAN', name: 'กยศ.', kind: 'DEDUCTION', amount: 500 },
  { code: 'LEAVE_PERSONAL', name: 'ลากิจ', kind: 'DEDUCTION', amount: 200 },
  { code: 'LATE', name: 'มาสาย', kind: 'DEDUCTION', amount: 100 }] }];
/* ลาสถานะ COMPLETED — เดิมถูกตัดตั้งแต่ RPC เพราะส่ง p_status='APPROVED' */
const LEAVES = [{ req_id: 'L1', employee_id: 'e1', leave_type: 'ลากิจ', status: 'COMPLETED',
  start_date: '2026-08-03', end_date: '2026-08-03', total_days: 1, hours: 0 },
  { req_id: 'L2', employee_id: 'e2', leave_type: 'ลาป่วย', status: 'APPROVED',
  start_date: '2026-08-04', end_date: '2026-08-05', total_days: 2, hours: 0 },
  { req_id: 'L3', employee_id: 'e3', leave_type: 'ลากิจ', status: 'REJECTED',
  start_date: '2026-08-06', end_date: '2026-08-06', total_days: 1, hours: 0 }];
const ATT = [{ employee_id: 'e1', work_date: '2026-08-03', check_in: null,
  check_out: '2026-08-03T17:30:00', late_min: 0, status: 'PRESENT' },
  { employee_id: 'e105', work_date: '2026-08-04', check_in: '2026-08-04T09:15:00',
  check_out: null, late_min: 45, status: 'LATE' }];

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
  const errs = [], calls = [];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/*', route => {
    const url = route.request().url();
    /* jszip มาจาก CDN ซึ่งถูก Network Policy ของแซนด์บ็อกซ์บล็อก
       จึงเสิร์ฟไฟล์เดียวกันจาก node_modules แทน (jszip 3.10.1 เวอร์ชันเดียวกับที่โค้ดเรียก) */
    if (/jszip/.test(url) && url.indexOf('localhost:' + PORT) < 0) {
      return route.fulfill({ status: 200, contentType: 'application/javascript',
        body: fs.readFileSync(path.join(ROOT, 'node_modules/jszip/dist/jszip.min.js'), 'utf8') });
    }
    if (url.indexOf('/rest/v1/rpc/') >= 0) {
      const fn = url.split('/rpc/')[1].split('?')[0];
      let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      calls.push({ fn, body: bd });
      let out;
      if (fn === 'njhr_report_all_employees') out = EMPS;
      else if (fn === 'njhr_att_report') out = ATT;
      else if (fn === 'njhr_leave_report') out = LEAVES;
      else if (fn === 'njhr_ot_list') out = [];
      else if (fn === 'njhr_pay_entry_totals') out = PAY;
      else if (fn === 'njhr_att_correction_list') out = [];
      else if (fn === 'njhr_emp_departments') out = [{ id: 'd1', name: 'ปฏิบัติการ' }];
      else if (fn === 'njhr_holiday_list') out = [];
      else out = F.respond(fn, bd);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) });
    }
    if (url.indexOf('localhost:' + PORT) < 0) return route.fulfill({ status: 200, body: '' });
    route.continue();
  });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(String(e)));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(() => {
    try { localStorage.setItem('njhr_token', 'MOCK-TOKEN-FIXED'); } catch (e) {}
    window.__b64 = null;
    const of = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function (blob) {
      const fr = new FileReader();
      fr.onload = () => { window.__b64 = String(fr.result).split(',')[1]; };
      fr.readAsDataURL(blob);
      return of(blob);
    };
  });
  await pg.goto('http://localhost:' + PORT + '/#/reportall', { waitUntil: 'networkidle' });
  await pg.waitForSelector('#rp-from', { timeout: 15000 });
  await pg.fill('#rp-from', '2026-08-01');
  await pg.fill('#rp-to', '2026-08-31');
  await pg.waitForTimeout(1500);

  /* ---------- UI: ตัวกรองอ่านง่าย + การ์ดสรุปแสดงตลอด ---------- */
  const lbl = await pg.$$eval('.rp-filters .rp-f > span', ns => ns.map(x => x.textContent));
  chk('ทุกช่องกรองมี Label กำกับ',
    ['วันที่เริ่มต้น', 'วันที่สิ้นสุด', 'แผนก', 'พนักงาน'].every(x => lbl.indexOf(x) >= 0),
    JSON.stringify(lbl));
  chk('การ์ดสรุปแสดงทันทีโดยไม่ต้องกด "ดูสรุป"',
    (await pg.$$('.rp-kpi')).length >= 6 && (await pg.$('#rp-sumtoggle')) === null,
    (await pg.$$('.rp-kpi')).length + ' การ์ด');
  const kpi = await pg.$$eval('.rp-kpi', ns => ns.map(x => x.querySelector('small').textContent));
  chk('การ์ดสรุปครอบคลุมหมวดหลัก',
    ['พนักงาน', 'รายการลงเวลา', 'วันลารวม', 'ชั่วโมง OT รวม'].every(k => kpi.some(t => t.indexOf(k) >= 0)),
    JSON.stringify(kpi));
  chk('ปุ่ม EXPORT อยู่ในแถบตัวกรอง อ่านออกชัด',
    (await pg.$('.rp-fbtns #rp-export')) !== null);

  /* Chip ตัวกรองที่ใช้อยู่ */
  await pg.selectOption('#rp-dept', 'ปฏิบัติการ');
  await pg.waitForTimeout(1200);
  const chipTxt = await pg.$$eval('.rp-chip', ns => ns.map(x => x.textContent));
  chk('แสดง Chip "ตัวกรองที่ใช้อยู่" พร้อมค่าจริง',
    chipTxt.some(t => t.indexOf('ปฏิบัติการ') >= 0) && chipTxt.some(t => /–/.test(t)),
    JSON.stringify(chipTxt));
  await pg.click('.rp-chip [data-rpclr="dept"]');
  await pg.waitForTimeout(1200);
  chk('กด × ที่ Chip ล้างตัวกรองนั้นได้',
    (await pg.$eval('#rp-dept', n => n.value)) === '',
    await pg.$eval('#rp-dept', n => n.value));

  chk('ใช้ njhr_report_all_employees (ไม่ใช่ njhr_emp_list ที่ติดเพดาน 100)',
    calls.some(c => c.fn === 'njhr_report_all_employees') &&
    !calls.some(c => c.fn === 'njhr_emp_list' && c.body.p_limit === 1000));
  const lv = calls.filter(c => c.fn === 'njhr_leave_report').pop();
  chk('ดึงลาทุกสถานะแล้วกรองฝั่ง Client (p_status = null)',
    lv && lv.body.p_status === null, lv ? String(lv.body.p_status) : '-');

  await pg.click('#rp-export');
  try {
    await pg.waitForFunction(() => window.__b64 !== null, { timeout: 30000 });
  } catch (e) {
    console.log('   STATUS: ' + (await pg.textContent('#rp-status')).slice(0, 200));
    console.log('   ERROR : ' + (await pg.textContent('#rp-err')).slice(0, 300));
    console.log('   JSZip loaded: ' + await pg.evaluate(() => !!window.JSZip));
    console.log('   console errors: ' + errs.slice(0, 3).join(' | '));
    throw e;
  }
  const b64 = await pg.evaluate(() => window.__b64);
  fs.writeFileSync(OUT, Buffer.from(b64, 'base64'));
  const stTxt = await pg.textContent('#rp-status');
  const erTxt = await pg.textContent('#rp-err');
  chk('Export สำเร็จ ไม่มี Error', (erTxt || '').trim() === '', (erTxt || '').slice(0, 120));
  chk('สรุปผลระบุ "จำนวน Sheet: 1"', /จำนวน Sheet: 1/.test(stTxt), stTxt.slice(0, 60));
  chk('สรุปผลระบุจำนวนพนักงาน 105', /จำนวนพนักงาน: 105/.test(stTxt));

  const info = JSON.parse(require('child_process').execSync(
    'python3 ' + JSON.stringify(__dirname + '/xlsx_probe.py') + ' ' + JSON.stringify(OUT)).toString());
  chk('มี Sheet เดียวชื่อ "REPORT ALL"',
    info.sheets.length === 1 && info.sheets[0] === 'REPORT ALL', JSON.stringify(info.sheets));
  chk('35 คอลัมน์ (A–AI)', info.max_col === 35, String(info.max_col));
  chk('แถวข้อมูล 105 แถว + หัว 2 + รวมท้าย 1 = 108', info.max_row === 108, String(info.max_row));
  chk('หัวคอลัมน์ตรงกับแบบทั้ง 35 ช่อง', info.header_ok, info.header_bad || '');
  chk('หัวกลุ่ม 6 กลุ่ม merge ถูกช่วง', info.groups_ok, JSON.stringify(info.groups));
  chk('สีหัวกลุ่มตรงแบบ', info.group_colors_ok, JSON.stringify(info.group_colors));
  chk('Freeze Pane = D3', info.freeze === 'D3', String(info.freeze));
  chk('AutoFilter ครอบ A2:AI107', /^A2:AI107$/.test(info.autofilter || ''), String(info.autofilter));
  chk('Wrap Text ช่องรายละเอียด (X · AD · AE)', info.wrap_ok, JSON.stringify(info.wrap));
  chk('Conditional Formatting 3 ชุด', info.cf === 3, String(info.cf));
  chk('รูปแบบเงิน #,##0.00', info.money_fmt === '#,##0.00', String(info.money_fmt));
  chk('สูตร K/P/Q ถูกต้อง', info.formula_ok, JSON.stringify(info.formulas));
  chk('แถวรวมท้าย merge A:C = "รวมทั้งหมด"', info.total_ok, String(info.total_label));

  /* ข้อมูลจริง */
  chk('พนักงานคนที่ 101–105 อยู่ในไฟล์ (เดิมหายเพราะเพดาน 100)',
    info.last_code === '1105', String(info.last_code));
  chk('งวดมีรายการ → ใช้ยอดจริง (ค่าตำแหน่ง 6000 ไม่ใช่ 5000 จาก employees)',
    info.row3.pos === 6000, String(info.row3.pos));
  chk('เงินเดือนไม่เป็น 0 อีกแล้ว', info.row3.base === 40000, String(info.row3.base));
  chk('ประกันสังคม / กยศ. / ลากิจหักเงิน มาจากรายการจริง',
    info.row3.sso === 750 && info.row3.loan === 500 && info.row3.dleave === 200,
    JSON.stringify(info.row3));
  chk('หักอื่นรวม LATE',
    info.row3.dother === 100, String(info.row3.dother));
  chk('งวดไม่มีรายการ → ใช้ค่าตั้งต้นจาก employees (ค่าตำแหน่ง 5000)',
    info.row4.pos === 5000, String(info.row4.pos));
  chk('ลาสถานะ COMPLETED ถูกนับ (เดิมหาย)', info.row3.leave === 1, String(info.row3.leave));
  chk('ลาสถานะ REJECTED ไม่ถูกนับ', info.row5.leave === 0, String(info.row5.leave));
  chk('1 พนักงาน = 1 แถว ไม่มีรหัสซ้ำ', info.dup === 0, String(info.dup));

  /* ---------- Mobile ---------- */
  for (const w of [360, 390, 768]) {
    const m = await ctx.newPage();
    await m.goto('http://localhost:' + PORT + '/#/reportall', { waitUntil: 'networkidle' });
    await m.setViewportSize({ width: w, height: 800 });
    await m.waitForSelector('#rp-from', { timeout: 15000 });
    await m.fill('#rp-from', '2026-08-01');
    await m.fill('#rp-to', '2026-08-31');
    await m.waitForTimeout(1500);
    const g = await m.evaluate(() => {
      const hs = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const small = [].slice.call(document.querySelectorAll(
        '.rp-filters input, .rp-filters select, .rp-fbtns .btn'))
        .filter(x => x.getBoundingClientRect().height < 44).length;
      const over = [].slice.call(document.querySelectorAll('.rp-filters *, .rp-kpi'))
        .filter(x => x.getBoundingClientRect().right > document.documentElement.clientWidth + 1).length;
      return { hs: hs, small: small, over: over, kpis: document.querySelectorAll('.rp-kpi').length };
    });
    chk('Mobile ' + w + 'px: ไม่มี Horizontal Scroll · ไม่ล้นจอ · Touch ≥ 44px',
      g.hs <= 0 && g.small === 0 && g.over === 0 && g.kpis >= 6, JSON.stringify(g));
    await m.close();
  }

  chk('ไม่มี JavaScript Error', errs.length === 0, errs.slice(0, 2).join(' | '));
  console.log('\nไฟล์ Excel: ' + OUT);
  await b.close(); srv.close();
  console.log('\nPASS ' + PASS + ' · FAIL ' + FAIL);
  process.exit(FAIL ? 1 : 0);
})();
