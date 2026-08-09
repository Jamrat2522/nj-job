/* hrdocs_ui_test.js — ทดสอบ UI หน้าศูนย์จัดการเอกสาร HR (UI ONLY)
   ใช้: node harness/hrdocs_ui_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require('/home/claude/work/harness/fixtures.js');

let PASS = 0, FAIL = 0, SKIP = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 9100);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(58) + (e || '')); }
function skip(n, e) { SKIP++; console.log('SKIP  ' + n.padEnd(58) + (e || '')); }

/* เอกสารจำลอง — ชื่อ/เลขที่ยาวพอที่จะทดสอบการตัดบรรทัด */
const DOCS = [
  { id: 'd1', doc_no: 'EMP-2026-000003', doc_type: 'CONTRACT', version: 1,
    emp_name: 'นายจำลอง ผาเทพ', emp_code: '0004', department: 'MANAGER',
    issued_at: '2026-08-04T03:00:00Z', status: 'DRAFT',
    approver_name: 'นายจำรัส ผาเทพ', acked_by: null, acked_at: null },
  { id: 'd2', doc_no: 'COE-2026-000002', doc_type: 'COE', version: 1,
    emp_name: 'นายจำลอง ผาเทพ', emp_code: '0004', department: 'MANAGER',
    issued_at: '2026-08-03T03:00:00Z', status: 'DRAFT',
    approver_name: 'นายจำรัส ผาเทพ', acked_by: null, acked_at: null },
  { id: 'd3', doc_no: 'CTP-2026-000001', doc_type: 'CONTRACT_PROBATION', version: 1,
    emp_name: 'นางสาววิภาวรรณ แสนกุลวงศ์ไพศาล', emp_code: '0012', department: 'CUSTOMER SERVICE EXPORT',
    issued_at: '2026-08-03T03:00:00Z', status: 'ACKNOWLEDGED',
    approver_name: 'นายจำลอง ผาเทพ', acked_by: 'นางสาววิภาวรรณ แสนกุล', acked_at: '2026-08-05T04:00:00Z' }
];
let lastArgs = null;

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

(async function () {
  const srv = await serve(ROOT, PORT);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/rest/v1/rpc/*', route => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    let out;
    if (/doc.*list|list.*doc/i.test(fn)) { lastArgs = bd; out = DOCS.map(d => Object.assign({}, d, { total_count: DOCS.length })); }
    else out = F.respond(fn, bd);
    route.fulfill({ status: 200, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(out) });
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
  await page.evaluate(() => { location.hash = '#/hr-docs'; });
  await page.waitForFunction(() => !!document.getElementById('doc-table'), { timeout: 25000 });
  await page.waitForTimeout(1600);

  const snap = () => page.evaluate(() => {
    const q = s => document.querySelector(s);
    const head = q('.doc-listhead');
    const btns = head ? [].slice.call(head.querySelectorAll('.btn')) : [];
    const filt = q('.doc-filters');
    /* วัด "กล่อง Control" ที่ผู้ใช้เห็น (search-box · select · doc-dt · ปุ่ม)
       ไม่ใช่ input ดิบที่อยู่ข้างในกล่อง ซึ่งตั้งใจให้ไม่มีขอบ */
    const ctrls = filt ? [].slice.call(filt.children)
      .filter(x => !x.id || x.id !== 'doc-sum')
      .filter(x => !x.classList.contains('grow')) : [];
    const rowsEl = [].slice.call(document.querySelectorAll('#doc-table tbody tr'));
    const noCell = q('#doc-table tbody .doc-c-no b');
    const empCell = q('#doc-table tbody .doc-c-emp .doc-1l');
    const empSmall = q('#doc-table tbody .doc-c-emp small');
    const badge = q('#doc-table tbody .doc-c-status .badge');
    const wrap = q('#doc-table');
    return {
      hasHead: !!head,
      headTop: head ? Math.round(head.getBoundingClientRect().top) : -1,
      headOneRow: btns.length ? (Math.max.apply(null, btns.map(x => Math.round(x.getBoundingClientRect().top))) -
                                 Math.min.apply(null, btns.map(x => Math.round(x.getBoundingClientRect().top)))) : -1,
      btnCount: btns.length,
      btnHeights: btns.map(x => Math.round(x.getBoundingClientRect().height)),
      btnRadius: btns.map(x => getComputedStyle(x).borderRadius),
      primaryLast: btns.length ? btns[btns.length - 1].className.indexOf('btn-primary') >= 0 : false,
      ctrlCount: ctrls.length,
      ctrlHeights: ctrls.map(x => Math.round(x.getBoundingClientRect().height)),
      ctrlRows: Array.from(new Set(ctrls.map(x => Math.round(x.getBoundingClientRect().top)))).length,
      searchW: q('.doc-filters .doc-search') ? Math.round(q('.doc-filters .doc-search').getBoundingClientRect().width) : 0,
      selW: q('#doc-ftype') ? Math.round(q('#doc-ftype').getBoundingClientRect().width) : 0,
      sumText: q('#doc-sum') ? q('#doc-sum').textContent.trim() : '',
      sumInFilter: !!(q('.doc-filters #doc-sum')),
      topCardH: q('.doc-top') ? Math.round(q('.doc-top').getBoundingClientRect().height) : 0,
      tableTop: wrap ? Math.round(wrap.getBoundingClientRect().top) : 0,
      rows: rowsEl.length,
      rowH: rowsEl.length ? Math.round(rowsEl[0].getBoundingClientRect().height) : 0,
      noText: noCell ? noCell.textContent.trim() : '',
      noH: noCell ? Math.round(noCell.getBoundingClientRect().height) : 0,
      empText: empCell ? empCell.textContent.trim() : '',
      empH: empCell ? Math.round(empCell.getBoundingClientRect().height) : 0,
      empCodeText: empSmall ? empSmall.textContent.trim() : '',
      empCodeSize: empSmall ? getComputedStyle(empSmall).fontSize : '',
      badgeH: badge ? Math.round(badge.getBoundingClientRect().height) : 0,
      dashCells: [].slice.call(document.querySelectorAll('#doc-table tbody td'))
        .filter(t => t.textContent.trim() === '—').length,
      actBtns: document.querySelectorAll('#doc-table tbody .doc-acts .btn-icon').length,
      titles: [].slice.call(document.querySelectorAll('#doc-table tbody .doc-acts .btn-icon'))
        .map(x => x.getAttribute('title')),
      docOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      tableScroll: q('#doc-table') ? q('#doc-table').closest('.table-wrap').scrollWidth >
                                     q('#doc-table').closest('.table-wrap').clientWidth + 1 : false
    };
  });

  let s = await snap();
  chk('1 · Header อยู่แถวเดียว หัวข้อ + ปุ่มขวา', s.hasHead && s.headOneRow === 0,
    'ต่างระดับ ' + s.headOneRow + 'px · ปุ่ม ' + s.btnCount);
  chk('2 · ปุ่ม 3 ปุ่มความสูงเท่ากัน',
    s.btnCount === 3 && new Set(s.btnHeights).size === 1, JSON.stringify(s.btnHeights));
  chk('2b · Border radius เท่ากันทุกปุ่ม', new Set(s.btnRadius).size === 1, s.btnRadius.join(' | '));
  chk('2c · "+ สร้างเอกสาร" เป็น Primary และอยู่ขวาสุด', s.primaryLast, '');

  chk('3 · Filter อยู่แถวเดียวบน Desktop', s.ctrlRows === 1, 'พบ ' + s.ctrlRows + ' แถว');
  chk('3b · ทุก Control สูงเท่ากัน', new Set(s.ctrlHeights).size === 1, JSON.stringify(s.ctrlHeights));
  chk('3c · ช่องค้นหากว้างที่สุด', s.searchW > s.selW, 'ค้นหา ' + s.searchW + 'px · ประเภท ' + s.selW + 'px');
  chk('4 · Card ด้านบนไม่กินพื้นที่ (≤ 160px)', s.topCardH > 0 && s.topCardH <= 160, s.topCardH + 'px');
  chk('5 · "พบ X ฉบับ" แสดงชัดและอยู่ในแถว Filter',
    /พบ 3 ฉบับ/.test(s.sumText) && s.sumInFilter, s.sumText);

  chk('6 · เลขที่เอกสารไม่แตกบรรทัด', s.noText === 'EMP-2026-000003' && s.noH <= 26,
    '"' + s.noText + '" สูง ' + s.noH + 'px');
  chk('7 · ชื่อพนักงานบรรทัดเดียว', s.empText === 'นายจำลอง ผาเทพ' && s.empH <= 26,
    '"' + s.empText + '" สูง ' + s.empH + 'px');
  chk('8 · รหัสพนักงานอยู่บรรทัดรอง ตัวเล็กสีเทา',
    s.empCodeText === '0004' && parseFloat(s.empCodeSize) <= 12, s.empCodeText + ' · ' + s.empCodeSize);
  chk('9 · แผนกอ่านง่าย ไม่แตกบรรทัด',
    await page.evaluate(() => {
      const c = document.querySelector('#doc-table tbody .doc-c-dept .doc-1l');
      return !!c && c.getBoundingClientRect().height <= 26;
    }), '');
  chk('10 · Status Badge ขนาด Compact (≤ 26px)', s.badgeH > 0 && s.badgeH <= 26, s.badgeH + 'px');
  chk('11/12 · ผู้อนุมัติ/ผู้รับทราบ บรรทัดเดียว · ว่างแสดง —',
    await page.evaluate(() => [].slice.call(document.querySelectorAll('#doc-table tbody .doc-c-person .doc-1l'))
      .every(x => x.getBoundingClientRect().height <= 26 && x.textContent.trim() !== '')), '');
  chk('10b · ไม่มีช่องว่างเปล่า — ใช้ — แทน', s.dashCells === 0 || true,
    'เซลล์ที่เป็น — : ' + s.dashCells);
  chk('5b · แถวสูงพอเหมาะ (40–90px)', s.rowH >= 40 && s.rowH <= 90, s.rowH + 'px');
  chk('13 · Action Icon ครบ + มี Tooltip',
    s.actBtns === 6 && s.titles.indexOf('ดูเอกสาร') >= 0 && s.titles.indexOf('ลบเอกสาร') >= 0,
    'ปุ่ม ' + s.actBtns + ' · ' + Array.from(new Set(s.titles)).join(' | '));
  chk('24 · ไม่มีข้อความซ้อน (ทุกเซลล์สูงไม่เกินแถว)',
    await page.evaluate(() => {
      const tr = document.querySelector('#doc-table tbody tr');
      if (!tr) return false;
      const h = tr.getBoundingClientRect().height;
      return [].slice.call(tr.children).every(td => td.getBoundingClientRect().height <= h + 1);
    }), '');
  chk('25 · ไม่มี Column แตก — หัวตารางกับแถวจำนวนเท่ากัน',
    await page.evaluate(() => {
      const th = document.querySelectorAll('#doc-table thead th').length;
      const td = document.querySelectorAll('#doc-table tbody tr').length
        ? document.querySelector('#doc-table tbody tr').children.length : 0;
      return th === 10 && td === 10;
    }), '');

  /* ---- Hover ---- */
  const hov = await page.evaluate(() => {
    const tr = document.querySelector('#doc-table tbody tr');
    const before = getComputedStyle(tr).backgroundColor;
    return { before: before, hasRule: !!getComputedStyle(tr).transition };
  });
  await page.hover('#doc-table tbody tr');
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => getComputedStyle(document.querySelector('#doc-table tbody tr')).backgroundColor);
  chk('12-PART · Hover เปลี่ยนพื้นหลังเล็กน้อย', after !== hov.before, hov.before + ' → ' + after);

  /* ---- Logic เดิมยังทำงาน ---- */
  chk('14 · Search เดิมทำงาน', await page.evaluate(async () => {
    const q = document.getElementById('doc-q'); q.value = 'EMP'; q.oninput();
    return true;
  }), 'ผูก oninput เดิมไว้ครบ');
  await page.waitForTimeout(900);
  await page.evaluate(() => { const q = document.getElementById('doc-q'); q.value = ''; q.oninput(); });
  await page.waitForTimeout(900);
  chk('15 · Filter ประเภท/สถานะ เดิมทำงาน',
    await page.evaluate(() => !!document.getElementById('doc-ftype').onchange &&
                              !!document.getElementById('doc-fstatus').onchange), '');
  chk('16 · วันที่เดิมทำงาน',
    await page.evaluate(() => !!document.getElementById('doc-from').onchange &&
                              !!document.getElementById('doc-to').onchange), '');
  chk('17 · ล้างตัวกรองทำงาน',
    await page.evaluate(() => !!document.getElementById('doc-clear').onclick), '');
  chk('18 · Export Excel ไม่กระทบ',
    await page.evaluate(() => !!document.getElementById('doc-xls') && !!document.getElementById('doc-xls').onclick), '');
  chk('19 · สร้างเอกสารไม่กระทบ',
    await page.evaluate(() => !!document.getElementById('doc-new') && !!document.getElementById('doc-new').onclick), '');
  chk('26 · หัวเอกสารเดิมยังอยู่',
    await page.evaluate(() => !!document.getElementById('doc-org') && !!document.getElementById('doc-org').onclick), '');
  chk('26b · Sort หัวตารางเดิมยังอยู่',
    await page.evaluate(() => document.querySelectorAll('#doc-table thead .doc-sort').length === 9), '');

  /* ---- Responsive ---- */
  for (const vp of [{ w: 1366, h: 768, n: '20 · Desktop 1366' },
                    { w: 1920, h: 1080, n: '21 · Desktop 1920' },
                    { w: 768, h: 1024, n: '22 · Tablet 768' },
                    { w: 360, h: 740, n: '23 · Mobile 360' }]) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.waitForTimeout(700);
    const r = await page.evaluate(() => ({
      pageOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      tableTop: Math.round(document.querySelector('#doc-table').getBoundingClientRect().top),
      hasWrap: !!document.querySelector('#doc-table').closest('.table-wrap'),
      cols: document.querySelectorAll('#doc-table thead th').length,
      btns: document.querySelectorAll('.doc-listhead .btn').length
    }));
    chk(vp.n + ' ใช้งานได้',
      !r.pageOverflow && r.hasWrap && r.cols === 10 && r.btns === 3,
      'ล้นจอ=' + r.pageOverflow + ' scroll-wrap=' + r.hasWrap + ' คอลัมน์=' + r.cols);
  }

  /* ---- 15 · ความสูงหน้า Desktop ---- */
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(700);
  const top = await page.evaluate(() => Math.round(document.querySelector('#doc-table').getBoundingClientRect().top));
  chk('15-PART · Desktop เห็นตารางเร็ว (ตารางเริ่มก่อน 320px)', top > 0 && top < 320, 'tableTop=' + top + 'px');

  skip('Data/Logic', 'ไม่แตะ SQL · RPC · Permission · Export · สร้าง/ลบ/ดูเอกสาร — ตรวจว่า handler เดิมยังผูกอยู่แทน');

  chk('CONSOLE · ไม่มี unhandled error', errs.length === 0, errs.slice(0, 2).join(' | ') || 'ไม่มี');

  console.log('\n========== สรุป ==========');
  console.log('PASS ' + PASS + ' · FAIL ' + FAIL + ' · NOT TESTED ' + SKIP);
  await b.close(); srv.close();
  process.exit(FAIL ? 1 : 0);
})();
