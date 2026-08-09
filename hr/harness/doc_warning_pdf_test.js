/* doc_warning_pdf_test.js — หนังสือเตือนพนักงาน: เนื้อหาไม่ซ้ำข้อมูลพนักงาน + A4 หน้าเดียว
   เนื้อหาสร้างจาก Template จริงของแอป แล้วพิมพ์ผ่าน Print Pipeline เดียวกับ Save as PDF
   ใช้: node harness/doc_warning_pdf_test.js <ทางโปรเจกต์ absolute> <port> [ไฟล์ PDF ปลายทาง] */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const F = require(__dirname + '/fixtures.js');
const FX = require(__dirname + '/doc_coe_fixture.js');

let PASS = 0, FAIL = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8911);
const OUT = process.argv[4] || path.join(os.tmpdir(), 'njhr-warn-test.pdf');
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(58) + (e || '')); }

const ORG = FX.ORG, PROFILE = FX.PROFILE;
const APPROVER = { employee_id: 'emp-0002', emp_code: '0002', name: 'นางสาวสุนทรี ทิรานุกูล',
  position_name: 'MANAGING DIRECTOR', department: 'MANAGING DIRECTOR' };
const ITEM1 = 'ไม่ปฏิบัติตามคำสั่งของผู้บังคับบัญชา';
const ITEM2 = 'ละเลยต่อหน้าที่และขาดความรับผิดชอบในการปฏิบัติงาน ' +
  'อันส่งผลกระทบและก่อให้เกิดความเสียหายแก่บริษัท';

const DOC = {
  id: 'doc-3', doc_no: 'WRN-2026-000007', doc_type: 'WARNING', status: 'DRAFT',
  employee_id: 'emp-0004', emp_name_snap: 'นายจำลอง ผาเทพ', emp_code_snap: '0004',
  position_snap: 'GENERAL MANAGER', dept_snap: 'MANAGER',
  title: 'หนังสือเตือนพนักงาน', body: '',
  effective_date: '2026-08-03', issued_at: '2026-08-03', version: 1,
  approver_name: APPROVER.name, requires_signature: false,
  doc_meta: Object.assign({}, FX.DOC.doc_meta, {
    warning_subject: 'การไม่ปฏิบัติตามคำสั่งของผู้บังคับบัญชา',
    incident_date: '2026-07-28', warning_item_1: ITEM1, warning_item_2: ITEM2
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
  await pg.selectOption('#docf-type', 'WARNING');
  await pg.fill('#docf-emp', 'จำลอง');
  await pg.waitForSelector('#docf-emp-ac [data-emp]', { timeout: 8000 });
  await pg.click('#docf-emp-ac [data-emp]');
  await pg.waitForSelector('#docf-extra [name="warning_subject"]', { timeout: 8000 });
  await pg.fill('#docf-extra [name="warning_subject"]', DOC.doc_meta.warning_subject);
  await pg.fill('#docf-extra [name="incident_date"]', DOC.doc_meta.incident_date);
  await pg.fill('#docf-extra [name="warning_item_1"]', ITEM1);
  await pg.fill('#docf-extra [name="warning_item_2"]', ITEM2);
  await pg.waitForFunction(() => {
    const el = document.getElementById('docf-body');
    return el && el.textContent.indexOf('จึงเรียนมาเพื่อทราบ') >= 0;
  }, { timeout: 10000 });
  await pg.waitForTimeout(600);
  DOC.body = await pg.evaluate(() => document.getElementById('docf-body').innerHTML);

  const txtBody = await pg.evaluate(() => document.getElementById('docf-body').textContent);
  chk('ระบบร่างหนังสือเตือนจาก Template จริงได้', txtBody.indexOf('จึงเรียนมาเพื่อทราบ') >= 0);
  chk('BODY ไม่มีข้อมูลพนักงาน 4 บรรทัดซ้ำอีกแล้ว',
    ['ชื่อ–นามสกุล', 'รหัสพนักงาน :', 'ตำแหน่ง :', 'แผนก :'].every(k => txtBody.indexOf(k) < 0) &&
    (txtBody.match(/รหัสพนักงาน/g) || []).length === 1,
    'พบ "รหัสพนักงาน" ' + (txtBody.match(/รหัสพนักงาน/g) || []).length + ' ครั้ง');
  chk('ประโยคเปิดรวมข้อมูลพนักงานไว้ในบรรทัดเดียว',
    /ได้ตรวจสอบการปฏิบัติงานของ[\s\S]{0,120}รหัสพนักงาน[\s\S]{0,60}ตำแหน่ง[\s\S]{0,60}แผนก/.test(txtBody),
    txtBody.slice(txtBody.indexOf('ได้ตรวจสอบ'), txtBody.indexOf('ได้ตรวจสอบ') + 130));
  chk('ข้อมูล Dynamic จาก Record จริง (ชื่อ · รหัส · ตำแหน่ง · แผนก · วันที่เกิดเหตุ)',
    txtBody.indexOf('นายจำลอง ผาเทพ') >= 0 && txtBody.indexOf('0004') >= 0 &&
    txtBody.indexOf('GENERAL MANAGER') >= 0 && txtBody.indexOf('MANAGER') >= 0 &&
    txtBody.indexOf('28 กรกฎาคม 2569') >= 0);
  chk('ไม่มี Placeholder ค้าง {{...}}', txtBody.indexOf('{{') < 0,
    txtBody.slice(txtBody.indexOf('{{'), txtBody.indexOf('{{') + 40));
  chk('ข้อความย่อหน้าใหม่ครบตามที่กำหนด',
    ['ตระหนักถึงหน้าที่และความรับผิดชอบของตน', 'ยุติพฤติการณ์ดังกล่าว',
     'จัดเก็บไว้ในประวัติการทำงานของท่าน', 'จึงเรียนมาเพื่อทราบ'].every(k => txtBody.indexOf(k) >= 0));

  /* ---------- 2) เปิดเอกสารจริงแล้วสั่งพิมพ์ ---------- */
  await pg.goto('http://localhost:' + PORT + '/#/hr-docs', { waitUntil: 'networkidle' });
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForSelector('[data-doc-open]', { timeout: 15000 });
  await pg.evaluate(() => { document.querySelector('[data-doc-open]').click(); });
  await pg.waitForSelector('#doc-a4 .doc-a4-page.doc-t-warning', { timeout: 10000 });

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
      overflowX: Math.round(inner.scrollWidth - inner.clientWidth)
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
    parseFloat(geo.padT) > 0 && parseFloat(geo.padL) > 0);

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
   ['เลขที่เอกสาร + วันที่ออก', info.text.indexOf('WRN-2026-000007') >= 0 && /03\/08\/2569/.test(info.text)],
   ['ชื่อเรื่อง "หนังสือเตือนพนักงาน"', info.norm.indexOf(nmj('หนังสือเตือนพนักงาน')) >= 0],
   ['เรื่อง / เรียน', info.norm.indexOf(nmj('เรื่อง')) >= 0 && info.norm.indexOf(nmj('เรียน')) >= 0],
   ['กล่องข้อมูลพนักงาน 8 ช่อง',
     ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'ตำแหน่ง', 'แผนก', 'วันที่เริ่มงาน', 'ผู้บังคับบัญชา', 'วันที่มีผล', 'บริษัท']
       .every(k => info.norm.indexOf(nmj(k)) >= 0)],
   ['รายการความผิด ข้อ 1 และ 2', info.norm.indexOf(nmj(ITEM1)) >= 0 && info.norm.indexOf(nmj('ละเลยต่อหน้าที่')) >= 0],
   ['ย่อหน้าปิดครบ ไม่ถูกตัด', info.norm.indexOf(nmj('จึงเรียนมาเพื่อทราบ')) >= 0],
   ['ผู้อนุมัติ (จากระบบ ไม่ Hardcode)', info.norm.indexOf(nmj(APPROVER.name)) >= 0],
   ['พนักงานผู้รับทราบ', info.norm.indexOf(nmj('พนักงานผู้รับทราบ')) >= 0 &&
      info.norm.indexOf(nmj('นายจำลอง ผาเทพ')) >= 0],
   ['Footer เลขที่เอกสาร · ฉบับที่ · ระบบ',
     info.text.indexOf('WRN-2026-000007') >= 0 && info.text.indexOf('NJ LOGISTIC HR SYSTEM') >= 0]
  ].forEach(x => chk('PDF — ' + x[0], x[1]));

  chk('PDF ไม่มีข้อมูลพนักงานซ้ำใน BODY',
    (info.norm.match(new RegExp(nmj('รหัสพนักงาน'), 'g')) || []).length <= 2,
    'พบ ' + (info.norm.match(new RegExp(nmj('รหัสพนักงาน'), 'g')) || []).length + ' ครั้ง');
  chk('ภาษาไทยครบ ไม่แตก (ตรวจคำยาวในเนื้อหา)',
    info.norm.indexOf(nmj('ข้อบังคับเกี่ยวกับการทำงาน')) >= 0 &&
    info.norm.indexOf(nmj('ผู้บังคับบัญชา')) >= 0);
  chk('ไม่มี Placeholder ค้างใน PDF', info.text.indexOf('{{') < 0);
  chk('ไม่มี JavaScript Error', errs.length === 0, errs.slice(0, 2).join(' | '));

  console.log('\nไฟล์ PDF ที่สร้าง: ' + OUT);
  await b.close(); srv.close();
  console.log('\nPASS ' + PASS + ' · FAIL ' + FAIL);
  process.exit(FAIL ? 1 : 0);
})();
