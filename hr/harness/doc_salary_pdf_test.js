/* doc_salary_pdf_test.js — หนังสือรับรองเงินเดือน: ตำแหน่งวันที่/ลายเซ็น + ไม่มี Footer + A4 หน้าเดียว
   เนื้อหาเอกสารสร้างจาก Template จริงของแอป (เปิดฟอร์ม "สร้างเอกสาร" แล้วอ่านค่าที่ระบบร่างให้)
   ใช้: node harness/doc_salary_pdf_test.js <ทางโปรเจกต์ absolute> <port> [ไฟล์ PDF ปลายทาง] */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const F = require(__dirname + '/fixtures.js');
const FX = require(__dirname + '/doc_coe_fixture.js');

let PASS = 0, FAIL = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8931);
const OUT = process.argv[4] || path.join(os.tmpdir(), 'njhr-sal-test.pdf');
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(56) + (e || '')); }

const ORG = FX.ORG, DOC = JSON.parse(JSON.stringify(FX.SAL_DOC)), PROFILE = FX.PROFILE;

/* ค่าที่วัดจาก PDF ตัวอย่างที่ผู้ใช้อนุมัติ (หน้า 1 · กว้าง 594.96pt · ขอบเนื้อหา 56.7–538.3pt) */
const REF = { dateX: 149.9, signX: 336.4, left: 56.7, right: 538.3, tol: 26 };

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
    if (fn === 'njhr_doc_center_list') out = [Object.assign({ total_count: 1 }, DOC)];
    else if (fn === 'njhr_doc_detail') out = { data: { doc: DOC, org: ORG, ack: null, events: [], versions: [] } };
    else if (fn === 'njhr_doc_org') out = { data: ORG };
    else if (fn === 'njhr_doc_emp_profile') out = { data: PROFILE };
    else if (fn === 'njhr_emp_list') out = [Object.assign({ total_count: 1 }, PROFILE)];
    else if (fn === 'njhr_doc_salary_items')
      out = { data: { base_salary: 40000, items: [], source: 'ENTRY' } };
    else out = F.respond(fn, bd);
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) });
  });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(String(e)));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(() => { try { localStorage.setItem('njhr_token', 'MOCK-TOKEN-FIXED'); } catch (e) {} });

  /* ---------- 1) ให้แอปร่างเนื้อหาจาก Template จริง ---------- */
  await pg.goto('http://localhost:' + PORT + '/#/hr-docs', { waitUntil: 'networkidle' });
  await pg.waitForSelector('#doc-new', { timeout: 15000 });
  await pg.click('#doc-new');
  await pg.waitForSelector('#docf-type', { timeout: 10000 });
  await pg.selectOption('#docf-type', 'SALARY_CERT');
  await pg.fill('#docf-emp', 'จำลอง');
  await pg.waitForSelector('#docf-emp-ac [data-emp]', { timeout: 8000 });
  await pg.click('#docf-emp-ac [data-emp]');
  await pg.waitForFunction(() => {
    const el = document.getElementById('docf-body');
    return el && el.innerHTML.indexOf('ลงชื่อ') >= 0;
  }, { timeout: 10000 });
  DOC.body = await pg.evaluate(() => document.getElementById('docf-body').innerHTML);
  chk('ระบบร่างเนื้อหาจาก Template จริงได้', DOC.body.indexOf('ลงชื่อ') >= 0);
  chk('วันที่เป็นย่อหน้าแยก ไม่รวมใน Block ลายเซ็น',
    /margin-left:\s*14%\s*"?\s*>\s*ออกให้ ณ วันที่/.test(DOC.body) &&
    /margin-left:\s*14%;\s*text-align:\s*center[^>]*>\s*ลงชื่อ/.test(DOC.body),
    DOC.body.slice(DOC.body.lastIndexOf('ออกให้ ณ') - 40, DOC.body.lastIndexOf('ออกให้ ณ') + 40));

  /* ---------- 2) เปิดเอกสารจริงแล้วสั่งพิมพ์ ---------- */
  await pg.goto('http://localhost:' + PORT + '/#/hr-docs', { waitUntil: 'networkidle' });
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForSelector('[data-doc-open]', { timeout: 15000 });
  await pg.evaluate(() => { document.querySelector('[data-doc-open]').click(); });
  await pg.waitForSelector('#doc-a4 .doc-a4-page.doc-t-salary_cert', { timeout: 10000 });

  const footVisible = await pg.evaluate(() => {
    const f = document.querySelector('#doc-a4 .doc-a4-page .doc-foot');
    return f ? getComputedStyle(f).display !== 'none' : false;
  });
  chk('Preview: ไม่มี Footer (เลขที่เอกสาร · ข้อความระบบ · เส้นคั่น)', footVisible === false);

  await pg.evaluate(() => {
    const rp = window.print; window.print = function () {};
    document.getElementById('doc-print').click(); window.print = rp;
  });
  await pg.waitForFunction(() => {
    const a = document.getElementById('doc-print-area');
    return a && a.querySelector('.doc-a4-page') && document.body.classList.contains('printing-doc');
  }, { timeout: 5000 });
  await pg.waitForTimeout(400);

  await pg.emulateMedia({ media: 'print' });
  const geo = await pg.evaluate(() => {
    const mm = 96 / 25.4, el = document.querySelector('#doc-print-area .doc-a4-page');
    return { h: Math.round(el.getBoundingClientRect().height), a4h: Math.round(297 * mm),
      bodyH: Math.round(document.body.getBoundingClientRect().height) };
  });
  chk('กล่อง A4 ไม่สูงเกิน 1 หน้า', geo.h <= geo.a4h, geo.h + ' / ' + geo.a4h + 'px');
  chk('ความสูงเอกสารตอนพิมพ์ = 1 หน้า A4', geo.bodyH <= geo.a4h, geo.bodyH + ' / ' + geo.a4h + 'px');

  /* พิสูจน์การจัดกึ่งกลางจาก DOM จริง (แม่นกว่าการเดาความกว้างข้อความจาก PDF) */
  const sigBox = await pg.evaluate(() => {
    const ps = [].slice.call(document.querySelectorAll('#doc-print-area .doc-body p'));
    const sig = ps.slice(-4);   // 4 ย่อหน้าท้ายสุด = ลงชื่อ · ชื่อ · ตำแหน่ง · บริษัท
    if (sig.length < 4) return { ok: false, n: sig.length };
    const align = sig.map(p => getComputedStyle(p).textAlign);
    const left = sig.map(p => Math.round(p.getBoundingClientRect().left));
    const right = sig.map(p => Math.round(p.getBoundingClientRect().right));
    return { ok: align.every(a => a === 'center') &&
      left.every(v => v === left[0]) && right.every(v => v === right[0]),
      n: sig.length, align: align[0], left: left[0], right: right[0] };
  });

  await pg.pdf({ path: OUT, format: 'A4', printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }, preferCSSPageSize: true });

  /* ---------- 3) เปิด PDF จริงแล้ววัดตำแหน่ง ---------- */
  const info = JSON.parse(require('child_process').execSync(
    'python3 ' + JSON.stringify(__dirname + '/pdf_probe.py') + ' ' + JSON.stringify(OUT)).toString());

  chk('PAGE COUNT = 1', info.n === 1, 'พบ ' + info.n + ' หน้า');
  chk('ไม่มีหน้า Blank', info.blank === 0, 'หน้าว่าง ' + info.blank);
  chk('A4 Portrait 210×297mm',
    Math.abs(info.w - 595.3) < 3 && Math.abs(info.h - 841.9) < 3, info.w + ' × ' + info.h);

  var THAI_MARK = /[\s\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\uF700-\uF71F]/g;
  function nmj(x) { return String(x).replace(/\u0E33/g, '\u0E32').replace(THAI_MARK, ''); }
  function find(key, afterY) {
    for (const r of info.rows) {
      if (afterY != null && r.y <= afterY) continue;
      if (r.t.indexOf(key) >= 0) return r;
    }
    return null;
  }
  const dateRow = find(nmj('ออกให้ ณ วันที่'));
  const signRow = find(nmj('ลงชื่อ'), dateRow ? dateRow.y : 0);
  const dy = dateRow ? dateRow.y : 0;
  const nameRow = find('Soontaree', dy);
  const posRow = find('ManagingDirector', dy);
  const coRow = find(nmj('โลจิสติกส์'), signRow ? signRow.y : dy);

  if (process.env.NJHR_DUMP) info.rows.filter(r => r.y > 480).forEach(r =>
    console.log('   ROW y=' + r.y + ' x=' + r.x + '  ' + r.t.slice(0, 46)));
  chk('พบบรรทัด "ออกให้ ณ วันที่ …"', !!dateRow, dateRow ? 'x=' + dateRow.x + ' y=' + dateRow.y : '-');
  chk('วันที่อยู่กลางค่อนไปทางซ้าย ตรงกับ PDF ตัวอย่าง (x ≈ ' + REF.dateX + 'pt)',
    !!dateRow && Math.abs(dateRow.x - REF.dateX) <= REF.tol,
    dateRow ? 'x = ' + dateRow.x + 'pt' : '-');
  chk('วันที่ไม่ชิดซ้ายและไม่ชิดขวา',
    !!dateRow && dateRow.x > REF.left + 40 && dateRow.x < 300, dateRow ? 'x = ' + dateRow.x : '-');

  chk('พบบรรทัด "ลงชื่อ …"', !!signRow, signRow ? JSON.stringify(signRow) : '-');
  chk('ลายเซ็นอยู่กลางค่อนไปทางขวา ตรงกับ PDF ตัวอย่าง (x ≈ ' + REF.signX + 'pt)',
    !!signRow && Math.abs(signRow.x - REF.signX) <= REF.tol,
    signRow ? 'x = ' + signRow.x + 'pt' : '-');
  chk('ลายเซ็นอยู่ขวากว่าวันที่อย่างชัดเจน (≥ 120pt)',
    !!signRow && !!dateRow && (signRow.x - dateRow.x) >= 120,
    signRow && dateRow ? (Math.round(signRow.x - dateRow.x)) + 'pt' : '-');

  chk('ชื่อผู้ลงนาม · ตำแหน่ง · บริษัท จัดกึ่งกลางในบล็อกเดียวกับเส้นลายเซ็น',
    sigBox.ok, JSON.stringify(sigBox));

  /* ระยะแนวตั้ง — เทียบกับตัวอย่าง (วันที่ → ลายเซ็น ≈ 71pt) */
  const gap = signRow && dateRow ? Math.round(signRow.y - dateRow.y) : 0;
  chk('ระยะวันที่ → ลายเซ็น ใกล้เคียงตัวอย่าง (71pt)', gap >= 45 && gap <= 100, gap + 'pt');
  const g2 = nameRow && signRow ? Math.round(nameRow.y - signRow.y) : 0;
  const g3 = posRow && nameRow ? Math.round(posRow.y - nameRow.y) : 0;
  const g4 = coRow && posRow ? Math.round(coRow.y - posRow.y) : 0;
  chk('ระยะภายในบล็อกลายเซ็นสั้นและสม่ำเสมอ',
    [g2, g3, g4].every(g => g >= 14 && g <= 34), JSON.stringify([g2, g3, g4]));

  /* Footer ต้องหายไปจาก PDF */
  chk('PDF ไม่มี "SAL-2026-000004 · ฉบับที่ 1" ท้ายหน้า',
    !/SAL-2026-000004\s*·/.test(info.text), 'พบ');
  chk('PDF ไม่มี "NJ LOGISTIC HR SYSTEM"', info.text.indexOf('NJ LOGISTIC HR SYSTEM') < 0);

  /* ส่วนบนต้องไม่เปลี่ยน */
  [['ชื่อบริษัท + ที่อยู่', /N\.J\. LOGISTICS & FRUITS CO\., LTD\./.test(info.text) && /Thung Sukhla/.test(info.text)],
   ['เลขที่เอกสาร + วันที่ออก', info.text.indexOf('SAL-2026-000004') >= 0 && /03\/08\/2569/.test(info.text)],
   ['ชื่อเรื่อง "หนังสือรับรองเงินเดือน"', info.norm.indexOf(nmj('หนังสือรับรองเงินเดือน')) >= 0],
   ['Employee Card', ['รหัสพนักงาน','ชื่อ-นามสกุล','ตำแหน่ง','แผนก','วันที่เริ่มงาน','ผู้บังคับบัญชา','วันที่มีผล','บริษัท']
      .every(k => info.norm.indexOf(nmj(k)) >= 0)],
   /* หมายเหตุ: ตัวเลขเงินเดือนถูกแทนค่าตอนบันทึกเอกสารจริง ชุดทดสอบนี้อ่านร่างจาก RTE
      จึงตรวจได้เฉพาะว่าแถวรายการยังอยู่ตำแหน่งเดิม ไม่ได้ตรวจตัวเลข */
   ['รายการเงินเดือน (แถวและลำดับเดิม)', info.norm.indexOf(nmj('เงินเดือนพื้นฐาน')) >= 0 &&
      info.norm.indexOf(nmj('รวมรายได้ประจำทั้งสิ้น')) >= 0]
  ].forEach(x => chk('ส่วนบนเดิมไม่เปลี่ยน — ' + x[0], x[1]));

  chk('ไม่มี JavaScript Error', errs.length === 0, errs.slice(0, 2).join(' | '));

  console.log('\nไฟล์ PDF ที่สร้าง: ' + OUT);
  await b.close(); srv.close();
  console.log('\nPASS ' + PASS + ' · FAIL ' + FAIL);
  process.exit(FAIL ? 1 : 0);
})();
