/* doc_suspension_pdf_test.js — หนังสือพักงาน: จัดเป็นจดหมายบริษัททางการ + A4 หน้าเดียว
   เนื้อหาสร้างจาก Template จริงของแอป แล้วพิมพ์ผ่าน Print Pipeline เดียวกับ Save as PDF
   ใช้: node harness/doc_suspension_pdf_test.js <ทางโปรเจกต์ absolute> <port> [ไฟล์ PDF ปลายทาง] */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const F = require(__dirname + '/fixtures.js');
const FX = require(__dirname + '/doc_coe_fixture.js');

let PASS = 0, FAIL = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8901);
const OUT = process.argv[4] || path.join(os.tmpdir(), 'njhr-susp-test.pdf');
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(58) + (e || '')); }

const ORG = FX.ORG, PROFILE = FX.PROFILE;
const APPROVER = { employee_id: 'emp-0002', emp_code: '0002', name: 'นางสาวสุนทรี ทิรานุกูล',
  position_name: 'MANAGING DIRECTOR', department: 'MANAGING DIRECTOR' };
const SUBJECT = 'แจ้งคำสั่งพักงานเพื่อสอบสวนข้อเท็จจริง';
const DETAIL = 'การเบิกจ่ายค่าใช้จ่ายในการปฏิบัติงานที่อาจไม่เป็นไปตามระเบียบของบริษัท';

const DOC = {
  id: 'doc-4', doc_no: 'SUS-2026-000003', doc_type: 'SUSPENSION', status: 'DRAFT',
  employee_id: 'emp-0004', emp_name_snap: 'นายจำลอง ผาเทพ', emp_code_snap: '0004',
  position_snap: 'GENERAL MANAGER', dept_snap: 'MANAGER',
  title: 'หนังสือพักงาน', body: '',
  effective_date: '2026-08-03', issued_at: '2026-08-03', version: 1,
  approver_name: APPROVER.name, requires_signature: false,
  doc_meta: Object.assign({}, FX.DOC.doc_meta, {
    suspension_subject: SUBJECT, incident_detail: DETAIL,
    suspension_start: '2026-08-04', suspension_end: '2026-08-10', pay_rate_percent: '50'
  })
};

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
    else if (fn === 'njhr_doc_approvers') out = [APPROVER];
    else out = F.respond(fn, bd);
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) });
  });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(String(e)));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(() => { try { localStorage.setItem('njhr_token', 'MOCK-TOKEN-FIXED'); } catch (e) {} });

  /* ---------- 1) ให้แอปร่างเนื้อหาหนังสือเตือนจาก Template จริง ---------- */
  await pg.goto('http://localhost:' + PORT + '/#/hr-docs', { waitUntil: 'networkidle' });
  await pg.waitForSelector('#doc-new', { timeout: 15000 });
  await pg.click('#doc-new');
  await pg.waitForSelector('#docf-type', { timeout: 10000 });
  await pg.selectOption('#docf-type', 'SUSPENSION');
  await pg.fill('#docf-emp', 'จำลอง');
  await pg.waitForSelector('#docf-emp-ac [data-emp]', { timeout: 8000 });
  await pg.click('#docf-emp-ac [data-emp]');
  await pg.waitForSelector('#docf-extra [name="suspension_subject"]', { timeout: 8000 });
  await pg.fill('#docf-extra [name="suspension_subject"]', SUBJECT);
  await pg.fill('#docf-extra [name="incident_detail"]', DETAIL);
  await pg.fill('#docf-extra [name="suspension_start"]', DOC.doc_meta.suspension_start);
  await pg.fill('#docf-extra [name="suspension_end"]', DOC.doc_meta.suspension_end);
  await pg.fill('#docf-extra [name="pay_rate_percent"]', DOC.doc_meta.pay_rate_percent);
  await pg.waitForFunction(() => {
    const el = document.getElementById('docf-body');
    return el && el.textContent.indexOf('จึงเรียนมาเพื่อทราบและถือปฏิบัติ') >= 0;
  }, { timeout: 10000 });
  await pg.waitForTimeout(600);
  DOC.body = await pg.evaluate(() => document.getElementById('docf-body').innerHTML);

  const txtBody = await pg.evaluate(() => document.getElementById('docf-body').textContent);
  chk('ระบบร่างหนังสือพักงานจาก Template จริงได้',
    txtBody.indexOf('จึงเรียนมาเพื่อทราบและถือปฏิบัติ') >= 0);
  chk('เนื้อหาเดิมครบ ไม่ถูกแก้ (เรื่อง · เรียน · เหตุ · ช่วงพักงาน · อัตราจ่าย · ข้อ 1–4 · ปิดท้าย)',
    [SUBJECT, DETAIL, 'พักงานเป็นการชั่วคราวเพื่อสอบสวนข้อเท็จจริง',
     'ให้ความร่วมมือและเข้าชี้แจงข้อเท็จจริง', 'งดเข้าปฏิบัติงานหรือเข้าสถานที่ทำงาน',
     'งดเข้าถึง ใช้งาน หรือแก้ไขข้อมูล', 'รักษาความลับเกี่ยวกับการสอบสวน',
     'มิได้ถือเป็นการวินิจฉัยว่าท่านได้กระทำความผิดแล้ว'].every(k => txtBody.indexOf(k) >= 0));
  chk('ข้อมูล Dynamic จาก Record จริง (ชื่อ · ช่วงวันที่ · จำนวนวัน · อัตราร้อยละ)',
    txtBody.indexOf('นายจำลอง ผาเทพ') >= 0 && txtBody.indexOf('4 สิงหาคม 2569') >= 0 &&
    txtBody.indexOf('10 สิงหาคม 2569') >= 0 && txtBody.indexOf('ร้อยละ 50') >= 0,
    txtBody.slice(txtBody.indexOf('ตั้งแต่วันที่'), txtBody.indexOf('ตั้งแต่วันที่') + 90));
  chk('ไม่มี Placeholder ค้าง {{...}}', txtBody.indexOf('{{') < 0);

  /* ---------- 2) เปิดเอกสารจริงแล้วสั่งพิมพ์ ---------- */
  await pg.goto('http://localhost:' + PORT + '/#/hr-docs', { waitUntil: 'networkidle' });
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForSelector('[data-doc-open]', { timeout: 15000 });
  await pg.evaluate(() => { document.querySelector('[data-doc-open]').click(); });
  await pg.waitForSelector('#doc-a4 .doc-a4-page.doc-t-suspension', { timeout: 10000 });

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
    const mm = 96 / 25.4, page = document.querySelector('#doc-print-area .doc-a4-page');
    const inner = page.querySelector('.doc-a4');
    const pr = page.getBoundingClientRect(), ir = inner.getBoundingClientRect();
    const body = page.querySelector('.doc-body');
    const foot = page.querySelector('.doc-foot');
    const signs = page.querySelector('.doc-signs');
    const cs = getComputedStyle(page);
    return {
      h: Math.round(pr.height), a4h: Math.round(297 * mm), a4w: Math.round(210 * mm),
      w: Math.round(pr.width), bodyH: Math.round(document.body.getBoundingClientRect().height),
      innerBottom: Math.round(ir.bottom - pr.top), scroll: Math.round(page.scrollHeight),
      padT: cs.paddingTop, padL: cs.paddingLeft,
      bodyAlign: getComputedStyle(body).textAlign,
      signsBottom: signs ? Math.round(signs.getBoundingClientRect().bottom) : 0,
      footTop: foot ? Math.round(foot.getBoundingClientRect().top) : 0,
      overflowX: Math.round(inner.scrollWidth - inner.clientWidth),
      titleSize: getComputedStyle(page.querySelector('.doc-title')).fontSize,
      coSize: getComputedStyle(page.querySelector('.doc-co b')).fontSize,
      bodySize: getComputedStyle(body).fontSize,
      lineH: getComputedStyle(body).lineHeight,
      labelSize: getComputedStyle(page.querySelector('.doc-f small')).fontSize,
      valueSize: getComputedStyle(page.querySelector('.doc-f b')).fontSize,
      liStyle: getComputedStyle(page.querySelector('.doc-body li')).listStylePosition,
      signCols: signs ? getComputedStyle(signs).gridTemplateColumns.split(' ').length : 0,
      signAlign: signs ? getComputedStyle(signs.querySelector('.doc-sign')).textAlign : ''
    };
  });
  chk('A4 Portrait — กว้าง 210mm', Math.abs(geo.w - geo.a4w) <= 2, geo.w + ' / ' + geo.a4w + 'px');
  chk('กล่อง A4 ไม่สูงเกิน 1 หน้า', geo.h <= geo.a4h, geo.h + ' / ' + geo.a4h + 'px');
  chk('ความสูงเอกสารตอนพิมพ์ = 1 หน้า A4', geo.bodyH <= geo.a4h, geo.bodyH + ' / ' + geo.a4h + 'px');
  chk('เนื้อหาไม่ล้นกล่อง (ไม่ถูกตัด)', geo.scroll <= geo.h + 1 && geo.innerBottom <= geo.h,
    'scroll ' + geo.scroll + ' · innerBottom ' + geo.innerBottom + ' · box ' + geo.h);
  chk('ไม่มีข้อความล้นแนวนอน', geo.overflowX <= 0, geo.overflowX + 'px');
  chk('BODY ชิดซ้าย', geo.bodyAlign === 'start' || geo.bodyAlign === 'left', geo.bodyAlign);
  chk('Footer ไม่ทับส่วนลายเซ็น', geo.footTop >= geo.signsBottom,
    'footTop ' + geo.footTop + ' · signsBottom ' + geo.signsBottom);
  chk('Margin A4 สมดุล (บน ' + geo.padT + ' · ซ้าย ' + geo.padL + ')',
    Math.abs(parseFloat(geo.padT) - 16 * 96 / 25.4) < 2 &&
    Math.abs(parseFloat(geo.padL) - 18 * 96 / 25.4) < 2);
  chk('ลำดับความเด่น 4 ระดับต่างกันชัดเจน (ชื่อเอกสาร > ชื่อบริษัท > เนื้อหา > Label)',
    parseFloat(geo.titleSize) > parseFloat(geo.coSize) &&
    parseFloat(geo.coSize) > parseFloat(geo.bodySize) &&
    parseFloat(geo.bodySize) > parseFloat(geo.labelSize),
    [geo.titleSize, geo.coSize, geo.bodySize, geo.labelSize].join(' > '));
  chk('Value ในกล่องพนักงานใหญ่กว่า Label',
    parseFloat(geo.valueSize) > parseFloat(geo.labelSize), geo.valueSize + ' > ' + geo.labelSize);
  chk('line-height เนื้อหาอ่านง่าย', parseFloat(geo.lineH) / parseFloat(geo.bodySize) >= 1.3 &&
    parseFloat(geo.lineH) / parseFloat(geo.bodySize) <= 1.6,
    (parseFloat(geo.lineH) / parseFloat(geo.bodySize)).toFixed(2));
  chk('รายการข้อ 1–4 เป็น Hanging Indent (เลขข้ออยู่นอกข้อความ)',
    geo.liStyle === 'outside', geo.liStyle);
  chk('ผู้อนุมัติ / ผู้รับทราบ จัด 2 คอลัมน์และกึ่งกลางในคอลัมน์ตัวเอง',
    geo.signCols >= 2 && geo.signAlign === 'center', geo.signCols + ' คอลัมน์ · ' + geo.signAlign);

  await pg.pdf({ path: OUT, format: 'A4', printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }, preferCSSPageSize: true });

  /* ---------- 3) เปิด PDF จริง ---------- */
  const info = JSON.parse(require('child_process').execSync(
    'python3 ' + JSON.stringify(__dirname + '/pdf_probe.py') + ' ' + JSON.stringify(OUT)).toString());
  const THAI_MARK = /[\s\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\uF700-\uF71F]/g;
  function nmj(x) { return String(x).replace(/\u0E33/g, '\u0E32').replace(THAI_MARK, ''); }

  chk('PAGE COUNT = 1', info.n === 1, 'พบ ' + info.n + ' หน้า');
  chk('ไม่มี Blank Page', info.blank === 0, 'หน้าว่าง ' + info.blank);
  chk('A4 Portrait 210×297mm',
    Math.abs(info.w - 595.3) < 3 && Math.abs(info.h - 841.9) < 3, info.w + ' × ' + info.h);

  [['ชื่อบริษัท + ที่อยู่', /N\.J\. LOGISTICS & FRUITS CO\., LTD\./.test(info.text) && /Thung Sukhla/.test(info.text)],
   ['เลขที่เอกสาร + วันที่ออก', info.text.indexOf('SUS-2026-000003') >= 0 && /03\/08\/2569/.test(info.text)],
   ['ชื่อเอกสาร "หนังสือพักงาน"', info.norm.indexOf(nmj('หนังสือพักงาน')) >= 0],
   ['เรื่อง / เรียน', info.norm.indexOf(nmj('เรื่อง')) >= 0 && info.norm.indexOf(nmj('เรียน')) >= 0],
   ['กล่องข้อมูลพนักงาน 8 ช่อง',
     ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ตำแหน่ง', 'แผนก', 'วันที่เริ่มงาน', 'ผู้บังคับบัญชา', 'วันที่มีผล', 'บริษัท']
       .every(k => info.norm.indexOf(nmj(k)) >= 0)],
   ['เนื้อหาเดิมครบ ไม่ถูกตัด (ข้อ 1–4 + ย่อหน้าปิด)',
     [ 'ให้ความร่วมมือและเข้าชี้แจงข้อเท็จจริง', 'งดเข้าปฏิบัติงานหรือเข้าสถานที่ทำงาน',
       'งดเข้าถึง ใช้งาน หรือแก้ไขข้อมูล', 'รักษาความลับเกี่ยวกับการสอบสวน',
       'จึงเรียนมาเพื่อทราบและถือปฏิบัติ'].every(k => info.norm.indexOf(nmj(k)) >= 0)],
   ['ตัวเลข/วันที่ไม่ถูกแก้ (ร้อยละ 50 · 4–10 สิงหาคม 2569 · 7 วัน)',
     info.norm.indexOf(nmj('ร้อยละ 50')) >= 0 && info.norm.indexOf(nmj('4 สิงหาคม 2569')) >= 0 &&
     info.norm.indexOf(nmj('10 สิงหาคม 2569')) >= 0],
   ['ผู้อนุมัติ (จากระบบ ไม่ Hardcode)', info.norm.indexOf(nmj(APPROVER.name)) >= 0],
   ['พนักงานผู้รับทราบ', info.norm.indexOf(nmj('พนักงานผู้รับทราบ')) >= 0 &&
      info.norm.indexOf(nmj('นายจำลอง ผาเทพ')) >= 0],
   ['Footer เลขที่เอกสาร · ฉบับที่ · ระบบ',
     info.text.indexOf('SUS-2026-000003') >= 0 && info.text.indexOf('NJ LOGISTIC HR SYSTEM') >= 0]
  ].forEach(x => chk('PDF — ' + x[0], x[1]));

  chk('ภาษาไทยครบ ไม่แตก (ตรวจคำยาวในเนื้อหา)',
    info.norm.indexOf(nmj('ข้อบังคับเกี่ยวกับการทำงาน')) >= 0 &&
    info.norm.indexOf(nmj('พักงานเป็นการชั่วคราวเพื่อสอบสวนข้อเท็จจริง')) >= 0);
  chk('ไม่มี Placeholder ค้างใน PDF', info.text.indexOf('{{') < 0);
  chk('ไม่มี JavaScript Error', errs.length === 0, errs.slice(0, 2).join(' | '));

  console.log('\nไฟล์ PDF ที่สร้าง: ' + OUT);
  await b.close(); srv.close();
  console.log('\nPASS ' + PASS + ' · FAIL ' + FAIL);
  process.exit(FAIL ? 1 : 0);
})();
