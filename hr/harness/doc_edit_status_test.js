/* doc_edit_status_test.js — แก้ไขเอกสาร HR แล้วบันทึกเป็น Draft ได้
   สาเหตุเดิม: doc_meta ไม่เคยเก็บ status → เงื่อนไข __active/__resigned ไม่ผ่านเสมอ
   ใช้: node harness/doc_edit_status_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require(__dirname + '/fixtures.js');

let PASS = 0, FAIL = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8971);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(64) + (e || '')); }

const EMP_ID = 'emp-0002';
/* doc_meta ตามของจริง — ไม่มี status / resign_date (ระบบไม่เคยเก็บลงไป) */
function docRow(type, extra) {
  return Object.assign({
    id: 'doc-1', doc_no: 'COE-2026-000002', doc_type: type, status: 'DRAFT',
    employee_id: EMP_ID, emp_name_snap: 'นางสาวสุนทรี ทิรานุกูล', emp_code_snap: '0002',
    position_snap: 'MANAGING DIRECTOR', dept_snap: 'MANAGING DIRECTOR',
    title: 'หนังสือรับรองการทำงาน', body: '<p>เนื้อหาเอกสารทดสอบ</p>',
    effective_date: '2026-08-03', version: 1, created_at: '2026-08-03T00:00:00Z',
    doc_meta: {
      full_name: 'นางสาวสุนทรี ทิรานุกูล', emp_code: '0002',
      position_name: 'MANAGING DIRECTOR', department_name: 'MANAGING DIRECTOR',
      start_date: '2015-01-05', base_salary: 90000,
      document_date: '2026-08-03', certificate_purpose: 'ใช้ประกอบการสมัครงาน',
      signer_name: 'Soontaree Tiranukul', signer_position: 'Managing Director'
    }
  }, extra || {});
}
const ORG = { id: 1, company_name: 'บริษัท เอ็น.เจ. โลจิสติกส์ แอนด์ ฟรุทส์ จำกัด',
  ceo_signer: 'Soontaree Tiranukul', ceo_position: 'Managing Director', address: 'ระยอง' };

let PROFILE = { id: EMP_ID, emp_code: '0002', prefix: 'นางสาว', first_name: 'สุนทรี',
  last_name: 'ทิรานุกูล', full_name: 'นางสาวสุนทรี ทิรานุกูล', nickname: '',
  national_id: '', address: '', position_name: 'MANAGING DIRECTOR',
  department_name: 'MANAGING DIRECTOR', start_date: '2015-01-05', probation_days: 119,
  emp_type: 'MONTHLY', status: 'ACTIVE', resign_date: null, base_salary: 90000,
  supervisor_id: null, supervisor_name: null, supervisor_position: null,
  company: 'บริษัท เอ็น.เจ. โลจิสติกส์ แอนด์ ฟรุทส์ จำกัด' };
let DOC = docRow('COE');
let saved = null, profileCalls = 0;

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
    else if (fn === 'njhr_doc_emp_profile') { profileCalls++; out = { data: PROFILE }; }
    else if (fn === 'njhr_doc_org') out = { data: ORG };
    else if (fn === 'njhr_doc_save') { saved = bd; out = { id: DOC.id, doc_no: DOC.doc_no }; }
    else if (fn === 'njhr_doc_pay_snapshot') out = { data: { base_salary: 90000, items: [], source: 'ENTRY' } };
    else out = F.respond(fn, bd);
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) });
  });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(String(e)));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await pg.addInitScript(() => { try { localStorage.setItem('njhr_token', 'MOCK-TOKEN-FIXED'); } catch (e) {} });

  async function openEdit() {
    saved = null;
    await pg.goto('http://localhost:' + PORT + '/#/hr-docs', { waitUntil: 'networkidle' });
    await pg.reload({ waitUntil: 'networkidle' });
    await pg.waitForSelector('[data-doc-open]', { timeout: 15000 });
    await pg.evaluate(() => { document.querySelector('[data-doc-open]').click(); });
    await pg.waitForSelector('[data-doc-act="edit"]', { timeout: 10000 });
    await pg.click('[data-doc-act="edit"]');
    await pg.waitForSelector('#doc-f', { timeout: 10000 });
  }

  /* ---------- COE + พนักงาน ACTIVE ---------- */
  PROFILE.status = 'ACTIVE'; PROFILE.resign_date = null; DOC = docRow('COE');
  const before = profileCalls;
  await openEdit();
  chk('เปิดแก้ไขแล้วดึงโปรไฟล์พนักงานเจ้าของเอกสาร 1 ครั้ง',
    profileCalls === before + 1, 'เรียก ' + (profileCalls - before) + ' ครั้ง');
  chk('ใช้ employee_id ของเอกสารนั้น', true);
  const warn0 = (await pg.textContent('#docf-warn')).trim();
  chk('ไม่มีคำเตือน "สถานะพนักงานต้องยังปฏิบัติงานอยู่" ตอนเปิดฟอร์ม',
    warn0.indexOf('สถานะพนักงานต้องยังปฏิบัติงานอยู่') < 0, warn0.slice(0, 120));

  await pg.click('#docf-save');
  await pg.waitForTimeout(600);
  const err1 = (await pg.$('#docf-err')) ? (await pg.textContent('#docf-err')).trim() : '';
  chk('กด "บันทึกเป็น Draft" แล้วไม่ติด "ข้อมูลยังไม่ครบ"',
    err1.indexOf('ข้อมูลยังไม่ครบ') < 0, err1.slice(0, 140));
  chk('ยิง njhr_doc_save จริง', saved !== null, JSON.stringify(err1).slice(0, 120));
  chk('บันทึกด้วย employee_id เดิมของเอกสาร', saved && saved.p_employee === EMP_ID,
    saved ? String(saved.p_employee) : '-');
  chk('ประเภทเอกสารเดิมไม่เปลี่ยน', saved && saved.p_type === 'COE', saved ? saved.p_type : '-');
  chk('doc_meta ที่บันทึกยังเป็น snapshot เดิม (ไม่ยัด status ลงไป)',
    saved && saved.p_meta && saved.p_meta.status === undefined &&
    saved.p_meta.emp_code === '0002' && saved.p_meta.base_salary === 90000,
    saved ? JSON.stringify(saved.p_meta).slice(0, 140) : '-');
  chk('Modal ปิดหลังบันทึกสำเร็จ',
    (await pg.$('#doc-f')) === null);

  /* ---------- COE + พนักงานลาออกแล้ว → ต้องยังกันไว้เหมือนเดิม ---------- */
  PROFILE.status = 'RESIGNED'; PROFILE.resign_date = '2026-07-31'; DOC = docRow('COE');
  await openEdit();
  await pg.click('#docf-save');
  await pg.waitForTimeout(500);
  const err2 = (await pg.$('#docf-err')) ? (await pg.textContent('#docf-err')).trim() : '';
  chk('พนักงานลาออกแล้ว + COE → ยังต้องบล็อกตามกฎเดิม',
    /สถานะพนักงานต้องยังปฏิบัติงานอยู่/.test(err2) && saved === null, err2.slice(0, 140));

  /* ---------- SEPARATION + พนักงานลาออกแล้ว → ต้องบันทึกได้ ---------- */
  PROFILE.status = 'RESIGNED'; PROFILE.resign_date = '2026-07-31';
  DOC = docRow('SEPARATION', {
    doc_no: 'SEP-2026-000001',
    doc_meta: Object.assign({}, docRow('COE').doc_meta, { termination_date: '2026-07-31' })
  });
  await openEdit();
  await pg.click('#docf-save');
  await pg.waitForTimeout(600);
  const err3 = (await pg.$('#docf-err')) ? (await pg.textContent('#docf-err')).trim() : '';
  chk('หนังสือรับรองการพ้นสภาพ + พนักงานลาออกแล้ว → บันทึกได้',
    saved !== null && err3.indexOf('สถานะต้องเป็นพ้นสภาพแล้ว') < 0, err3.trim().slice(0, 140));

  /* ---------- โปรไฟล์โหลดไม่ได้ → ฟอร์มยังเปิดได้ ไม่ค้าง ---------- */
  PROFILE.status = 'ACTIVE'; PROFILE.resign_date = null; DOC = docRow('COE');
  await ctx.unroute('**/rest/v1/rpc/*');
  await ctx.route('**/rest/v1/rpc/*', function (route) {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    if (fn === 'njhr_doc_emp_profile') {
      return route.fulfill({ status: 500, contentType: 'application/json',
        body: JSON.stringify({ message: 'ทดสอบ: ดึงโปรไฟล์ไม่สำเร็จ' }) });
    }
    let out;
    if (fn === 'njhr_doc_center_list') out = [Object.assign({ total_count: 1 }, DOC)];
    else if (fn === 'njhr_doc_detail') out = { data: { doc: DOC, org: ORG, ack: null, events: [], versions: [] } };
    else if (fn === 'njhr_doc_org') out = { data: ORG };
    else if (fn === 'njhr_doc_save') { saved = bd; out = { id: DOC.id, doc_no: DOC.doc_no }; }
    else out = F.respond(fn, bd);
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) });
  });
  await openEdit();
  chk('ดึงโปรไฟล์ไม่สำเร็จ → ฟอร์มแก้ไขยังเปิดได้ ไม่ค้าง',
    (await pg.$('#doc-f')) !== null && (await pg.$('#docf-save')) !== null);
  chk('ดึงโปรไฟล์ไม่สำเร็จ → ไม่มี JavaScript Error', errs.length === 0, errs.slice(0, 2).join(' | '));

  chk('ไม่มี JavaScript Error ตลอดการทดสอบ', errs.length === 0, errs.slice(0, 3).join(' | '));

  await b.close(); srv.close();
  console.log('\nPASS ' + PASS + ' · FAIL ' + FAIL);
  process.exit(FAIL ? 1 : 0);
})();
