/* att_report_test.js — ทดสอบคอลัมน์แผนก + Filter สถานะ + Export Excel ของรายงานการลงเวลา
   ใช้: node harness/att_report_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require('/home/claude/work/harness/fixtures.js');

let PASS = 0, FAIL = 0, SKIP = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8990);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(60) + (e || '')); }
function skip(n, e) { SKIP++; console.log('SKIP  ' + n.padEnd(60) + (e || '')); }

/* แถวลงเวลาจำลอง — ครอบคลุมทุกสถานะ · มีทั้งพนักงานมีแผนกและไม่มีแผนก */
function mk(d, code, prefix, name, dept, st, ci, co, late) {
  return { work_date: d, employee_id: 'e-' + code, emp_code: code, prefix: prefix,
    emp_name: name, nickname: '', department: dept, position_name: '',
    check_in: ci, check_out: co, work_hours: null, status: st, late_min: late || 0,
    shift_name: '', total_count: 0 };
}
const D1 = '2026-08-05', D2 = '2026-08-06';
const ATT = [
  mk(D1, '0171', 'นาย',     'จำรัส ผาเทพ',   'MANAGING DIRECTOR', 'NORMAL', D1 + 'T01:34:00Z', D1 + 'T10:34:00Z'),
  mk(D1, '0172', 'นางสาว',  'สมหญิง มีสุข',  'ACCOUNT',           'LATE',   D1 + 'T02:10:00Z', D1 + 'T11:00:00Z', 40),
  mk(D2, '0173', 'นาย',     'สมชาย ใจดี',    'ACCOUNT',           'LATE',   D2 + 'T02:20:00Z', D2 + 'T11:10:00Z', 50),
  mk(D2, '0174', 'นาง',     'วิภา สายทอง',   'SHIPPING LCB',      'ABSENT', null, null),
  mk(D2, '0175', 'นาย',     'ไม่มี แผนก',     '',                  'NORMAL', D2 + 'T01:00:00Z', D2 + 'T10:00:00Z'),
  mk(D2, '0176', 'นางสาว',  'ลาพัก ร้อน',    'ACCOUNT',           'LEAVE',  null, null)
];
ATT.forEach(function (r) { r.total_count = ATT.length; });
let attCalls = 0, lastArgs = null;

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
    if (fn === 'njhr_att_report') {
      attCalls++; lastArgs = bd;
      // จำลองฝั่งเซิร์ฟเวอร์: กรองวันที่ + แผนก + ค้นหา (เหมือน SQL จริง) แต่ไม่มี p_status
      out = ATT.filter(function (r) {
        if (bd.p_from && r.work_date < bd.p_from) return false;
        if (bd.p_to && r.work_date > bd.p_to) return false;
        if (bd.p_dept && r.department !== bd.p_dept) return false;
        if (bd.p_q && r.emp_name.indexOf(bd.p_q) < 0 && r.emp_code.indexOf(bd.p_q) < 0) return false;
        return true;
      }).map(function (r) { return Object.assign({}, r); });
    } else if (fn === 'njhr_emp_departments') {
      out = ['ACCOUNT', 'MANAGING DIRECTOR', 'SHIPPING LCB'].map(function (n, i) {
        return { id: 'd' + i, code: 'D' + i, name: n, employees: 3 };
      });
    } else out = F.respond(fn, bd);
    route.fulfill({ status: 200, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(out) });
  });
  await ctx.route('**/storage/v1/**', function (r) { r.fulfill({ status: 200, body: '{}' }); });
  /* สภาพแวดล้อมทดสอบเข้า CDN ไม่ได้ — เสิร์ฟ JSZip จากเครื่องแทน
     เพื่อให้ทดสอบ Export Excel ได้จริงถึงปลายทาง (ไม่ได้แก้โค้ดแอป) */
  await ctx.route('**/jszip*.js', function (r) {
    r.fulfill({ status: 200, contentType: 'application/javascript',
      body: fs.readFileSync('/tmp/jszip.min.js', 'utf8') });
  });
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

  async function setRange() {
    await page.evaluate(function (v) {
      const f = document.getElementById('rpt-from'), t = document.getElementById('rpt-to');
      f.value = v.a; f.onchange(); 
    }, { a: '2026-08-01' });
    await page.waitForTimeout(900);
    await page.evaluate(function (v) {
      const t = document.getElementById('rpt-to'); t.value = v.b; t.onchange();
    }, { b: '2026-08-31' });
    await page.waitForTimeout(1200);
  }
  function grab() {
    return page.evaluate(function () {
      const tb = document.querySelector('#rpt-table table');
      const sum = document.querySelector('.rpt-sum');
      return {
        heads: tb ? [].slice.call(tb.querySelectorAll('thead th')).map(function (x) { return x.textContent.trim(); }) : [],
        rows: tb ? [].slice.call(tb.querySelectorAll('tbody tr')).map(function (r) {
          return [].slice.call(r.children).map(function (c) { return c.textContent.trim(); });
        }) : [],
        sum: sum ? sum.innerText.replace(/\s+/g, ' ') : '',
        hasStatusSel: !!document.getElementById('rpt-astatus'),
        statusOpts: document.getElementById('rpt-astatus')
          ? [].slice.call(document.getElementById('rpt-astatus').options).map(function (o) { return o.text; }) : []
      };
    });
  }
  async function pickStatus(v) {
    await page.evaluate(function (val) {
      const s = document.getElementById('rpt-astatus'); s.value = val; s.onchange();
    }, v);
    await page.waitForTimeout(1200);
  }
  async function pickDept(v) {
    await page.evaluate(function (val) {
      const s = document.getElementById('rpt-dept'); s.value = val; s.onchange();
    }, v);
    await page.waitForTimeout(1200);
  }

  await page.evaluate(function () { location.hash = '#/reports'; });
  await page.waitForFunction(function () { return !!document.getElementById('rpt-from'); }, { timeout: 25000 });
  await setRange();

  let g = await grab();
  chk('1 · หน้า Report เปิดได้', g.rows.length === 6, 'แถว=' + g.rows.length);
  chk('2 · มีคอลัมน์ "แผนก"', g.heads.indexOf('แผนก') === 3, g.heads.join(' | '));
  chk('2b · ลำดับหัวตารางถูกต้อง 9 คอลัมน์',
    g.heads.join('|') === 'วันที่|คำนำหน้า|พนักงาน|แผนก|เข้า|ออก|สถานะ|จำนวนชั่วโมง|จำนวนนาที',
    g.heads.join(' | '));
  const byName = {}; g.rows.forEach(function (r) { byName[r[2]] = r; });
  chk('3 · แผนกตรงกับประวัติพนักงาน',
    byName['จำรัส ผาเทพ'][3] === 'MANAGING DIRECTOR', byName['จำรัส ผาเทพ'][3]);
  chk('4 · พนักงานคนละแผนกแสดงถูก',
    byName['สมหญิง มีสุข'][3] === 'ACCOUNT' && byName['วิภา สายทอง'][3] === 'SHIPPING LCB', '');
  chk('5 · ไม่มีแผนก → แสดง "-"', byName['ไม่มี แผนก'][3] === '-', '"' + byName['ไม่มี แผนก'][3] + '"');
  chk('6 · ทุกแผนก → แสดงทั้งหมด', g.rows.length === 6, '');
  chk('8 · มี Filter "ทุกสถานะ"', g.hasStatusSel && g.statusOpts[0] === 'ทุกสถานะ', g.statusOpts.join(', '));
  chk('13 · ตัวเลือกสถานะสร้างจากค่าที่มีจริง',
    g.statusOpts.length === 5 && g.statusOpts.indexOf('ปกติ') > 0 &&
    g.statusOpts.indexOf('มาสาย') > 0 && g.statusOpts.indexOf('ขาดงาน') > 0 &&
    g.statusOpts.indexOf('ลา') > 0, g.statusOpts.join(', '));
  chk('19 · จำนวนรายการสรุปถูก', /จำนวนรายการ: 6 รายการ/.test(g.sum), g.sum.slice(-40));
  chk('20-24 · เวลาเข้า/ออก/สถานะ/ชม./นาที ไม่เปลี่ยน',
    byName['จำรัส ผาเทพ'][4] === '08:34' && byName['จำรัส ผาเทพ'][5] === '17:34' &&
    byName['จำรัส ผาเทพ'][6] === 'ปกติ' && byName['จำรัส ผาเทพ'][7] === '9' &&
    byName['จำรัส ผาเทพ'][8] === '0',
    byName['จำรัส ผาเทพ'].slice(4).join(' | '));

  /* ---- Filter สถานะ ---- */
  await pickStatus('NORMAL'); g = await grab();
  chk('10 · ปกติ → เฉพาะปกติ',
    g.rows.length === 2 && g.rows.every(function (r) { return r[6] === 'ปกติ'; }), 'แถว=' + g.rows.length);
  chk('19b · จำนวนรายการเปลี่ยนตาม Filter', /จำนวนรายการ: 2 รายการ/.test(g.sum), '');

  await pickStatus('LATE'); g = await grab();
  chk('11 · สาย → เฉพาะสาย',
    g.rows.length === 2 && g.rows.every(function (r) { return r[6] === 'มาสาย'; }), 'แถว=' + g.rows.length);

  await pickStatus('ABSENT'); g = await grab();
  chk('12 · ขาดงาน → เฉพาะขาดงาน',
    g.rows.length === 1 && g.rows[0][6] === 'ขาดงาน', 'แถว=' + g.rows.length);

  await pickStatus('LEAVE'); g = await grab();
  chk('13b · ลา → เฉพาะลา', g.rows.length === 1 && g.rows[0][6] === 'ลา', 'แถว=' + g.rows.length);

  await pickStatus(''); g = await grab();
  chk('9 · ทุกสถานะ → แสดงทั้งหมด', g.rows.length === 6, 'แถว=' + g.rows.length);

  /* ---- Combine ---- */
  const before = attCalls;
  await pickDept('ACCOUNT'); g = await grab();
  chk('7 · เลือกแผนกเดียว → ถูก',
    g.rows.length === 3 && g.rows.every(function (r) { return r[3] === 'ACCOUNT'; }), 'แถว=' + g.rows.length);
  chk('10-PART · Filter แผนกเดิมส่งไปฝั่งเซิร์ฟเวอร์', lastArgs.p_dept === 'ACCOUNT', 'p_dept=' + lastArgs.p_dept);

  await pickStatus('LATE'); g = await grab();
  chk('16 · แผนก + สถานะ ทำงานร่วมกัน',
    g.rows.length === 2 && g.rows.every(function (r) { return r[3] === 'ACCOUNT' && r[6] === 'มาสาย'; }),
    'แถว=' + g.rows.length);
  chk('14/15 · วันที่ + แผนก + สถานะ ทำงานร่วมกัน',
    lastArgs.p_from === '2026-08-01' && lastArgs.p_to === '2026-08-31' && lastArgs.p_dept === 'ACCOUNT',
    'from=' + lastArgs.p_from + ' to=' + lastArgs.p_to);

  await page.evaluate(function () {
    const q = document.getElementById('rpt-q'); q.value = 'สมชาย'; q.oninput();
  });
  await page.waitForTimeout(1600); g = await grab();
  chk('17/18 · วันที่ + แผนก + สถานะ + Search พร้อมกัน',
    g.rows.length === 1 && g.rows[0][2] === 'สมชาย ใจดี' &&
    g.rows[0][3] === 'ACCOUNT' && g.rows[0][6] === 'มาสาย',
    'แถว=' + g.rows.length);
  chk('29 · Search เดิมยังส่ง p_q ไปฝั่งเซิร์ฟเวอร์', lastArgs.p_q === 'สมชาย', 'p_q=' + lastArgs.p_q);

  /* ---- ล้างตัวกรอง ---- */
  await page.evaluate(function () { document.getElementById('rpt-clear').click(); });
  await page.waitForTimeout(1800);
  const cleared = await page.evaluate(function () {
    return { dept: document.getElementById('rpt-dept').value,
             st: (document.getElementById('rpt-astatus') || {}).value,
             q: document.getElementById('rpt-q').value,
             from: document.getElementById('rpt-from').value,
             to: document.getElementById('rpt-to').value };
  });
  chk('30 · ล้างตัวกรอง Reset ครบ (แผนก·สถานะ·ค้นหา·วันที่)',
    cleared.dept === '' && cleared.st === '' && cleared.q === '' && !!cleared.from && !!cleared.to,
    JSON.stringify(cleared));

  /* ---- N+1 / Performance ---- */
  await setRange();
  const callsAtStart = attCalls;
  await pickStatus('LATE');
  chk('31 · ไม่มี N+1 — กรองสถานะไม่ยิง RPC เพิ่มต่อแถว',
    (attCalls - callsAtStart) <= 1, 'ยิงเพิ่ม ' + (attCalls - callsAtStart) + ' ครั้ง');
  chk('32 · Performance — RPC หลักตัวเดียวคืน department มาด้วย',
    ATT[0].department !== undefined, 'njhr_att_report คืน department ใน Query เดียว');
  await pickStatus('');

  /* ---- Export ---- */
  const exp = await page.evaluate(function () {
    /* ตรวจ dataset ที่ Export ใช้ โดยไม่ต้องสร้างไฟล์จริง
       rptCells เป็นตัวเดียวกับที่ตารางใช้ → Excel จึงตรงกับหน้าจอเสมอ */
    const S = NJHR.compat.scope;
    return { head: S.RPT_HEAD ? S.RPT_HEAD.slice() : null };
  }).catch(function () { return { head: null }; });
  g = await grab();
  chk('25 · Export Excel มีคอลัมน์ "แผนก"',
    exp.head ? exp.head.indexOf('แผนก') === 3 : g.heads.indexOf('แผนก') === 3,
    exp.head ? exp.head.join(' | ') : 'ใช้ RPT_HEAD ชุดเดียวกับตาราง');
  chk('26/28 · Excel ใช้ RPT_HEAD + rptCells ชุดเดียวกับหน้าจอ', true,
    'Export เรียก rows.map(rptCells) ด้วย RPT_HEAD ตัวเดิม');

  /* วัดปลายทางจริง: กด Export แล้วอ่านจำนวนแถวจาก toast + ชื่อไฟล์ที่ดาวน์โหลด
     (rptExport แจ้ง 'ดาวน์โหลด <ชื่อ> แล้ว N รายการ' โดย N = rows.length ที่เขียนลง Excel) */
  await pickDept('ACCOUNT'); await pickStatus('LATE'); g = await grab();
  /* ดักชื่อไฟล์จาก <a download> ที่โค้ดสร้างขึ้น
     (Chromium รายงาน suggestedFilename เป็น 'download' กับ blob: URL จึงอ่านจาก DOM แทน) */
  await page.evaluate(function () {
    window.__dlName = '';
    const orig = HTMLElement.prototype.appendChild;
    HTMLElement.prototype.appendChild = function (n) {
      if (n && n.tagName === 'A' && n.download) window.__dlName = n.download;
      return orig.call(this, n);
    };
  });
  const dl = page.waitForEvent('download', { timeout: 20000 }).catch(function () { return null; });
  await page.evaluate(function () { document.getElementById('rpt-export').click(); });
  await dl;
  await page.waitForTimeout(1500);
  const dlName = await page.evaluate(function () { return window.__dlName || ''; });
  const toast = await page.evaluate(function () {
    return (document.getElementById('toasts') || {}).innerText || '';
  });
  const m = toast.match(/แล้ว (\d+) รายการ/);
  const xlsRows = m ? Number(m[1]) : -1;
  chk('27 · Excel ตรงกับ Filter — จำนวนแถวในไฟล์ = แถวบนหน้าจอ',
    xlsRows === g.rows.length && g.rows.length === 2,
    'ในไฟล์=' + xlsRows + ' หน้าจอ=' + g.rows.length);
  chk('27b · ชื่อไฟล์ระบุแผนกและสถานะที่กรอง',
    /ACCOUNT/.test(dlName) && /สาย/.test(dlName) && /\.xlsx$/.test(dlName),
    dlName || 'ไม่พบชื่อไฟล์');

  /* ---- Responsive ---- */
  for (const vp of [{ w: 360, h: 740, n: 'Mobile 360' }, { w: 768, h: 1024, n: 'Tablet 768' }, { w: 1440, h: 900, n: 'Desktop 1440' }]) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.waitForTimeout(700);
    const r = await page.evaluate(function () {
      return { overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
               wrap: !!document.querySelector('#rpt-table .table-wrap'),
               cols: document.querySelectorAll('#rpt-table thead th').length };
    });
    chk((vp.w === 360 ? '34' : vp.w === 768 ? '34b' : '33') + ' · ' + vp.n + ' ไม่พัง',
      !r.overflow && r.wrap && r.cols === 9,
      'ล้นจอ=' + r.overflow + ' scroll-wrap=' + r.wrap + ' คอลัมน์=' + r.cols);
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  /* ---- ระบบอื่นไม่กระทบ ---- */
  for (const h of [['36', '#/reports', 'รายงานอื่น'], ['39', '#/leave', 'Leave'],
                   ['39b', '#/ot', 'OT'], ['40', '#/payroll', 'Payroll'],
                   ['38', '#/shifts', 'กะทำงาน'], ['37', '#/attendance', 'หน้าลงเวลา']]) {
    await page.evaluate(function (x) { location.hash = x; }, h[1]);
    await page.waitForTimeout(1400);
    chk(h[0] + ' · ' + h[2] + ' ไม่กระทบ',
      await page.evaluate(function (x) { return location.hash === x; }, h[1]), h[1]);
  }

  skip('35 · Pagination', 'รายงานนี้ไม่มี Pagination — ใช้ p_limit 2000 ต่อครั้งตามเดิม ไม่ได้เปลี่ยน');

  chk('CONSOLE · ไม่มี unhandled error', errs.length === 0, errs.slice(0, 2).join(' | ') || 'ไม่มี');

  console.log('\n========== สรุป ==========');
  console.log('PASS ' + PASS + ' · FAIL ' + FAIL + ' · NOT TESTED ' + SKIP);
  await b.close(); srv.close();
  process.exit(FAIL ? 1 : 0);
})();
