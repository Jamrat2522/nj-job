/* wf_collapse_test.js — ทดสอบซ่อนรายละเอียด Workflow จนกว่าจะกดแก้ไข
   ใช้: node harness/wf_collapse_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require('/home/claude/work/harness/fixtures.js');

let PASS = 0, FAIL = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8980);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(62) + (e || '')); }

/* ชุด Workflow จำลอง — ตรงกับภาพหน้าจอจริง */
const WFS = [
  { workflow_id: 'wf-1', name: 'ACCOUNT', request_type: 'BOTH', active: true,
    step_count: 1, approver_count: 2, scope: 'DEPT', anchor_dept: 'ACCOUNT',
    departments: ['ACCOUNT', 'MAID'] },
  { workflow_id: 'wf-2', name: 'CUSTOMER SERVICE EXPORT', request_type: 'BOTH', active: true,
    step_count: 3, approver_count: 4, scope: 'DEPT', anchor_dept: 'CUSTOMER SERVICE EXPORT',
    departments: ['CUSTOMER SERVICE EXPORT'] }
];
const STEPS = [
  { step_no: 1, title: 'หัวหน้างาน', mode: 'ANY', active: true,
    approvers: [{ name: 'นายจำรัส ผาเทพ' }, { name: 'นางสาวสุนทรี ทิรานุกูล' }] }
];
let stepsCalls = 0;

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
    if (fn === 'njhr_wf_list') out = WFS;
    else if (fn === 'njhr_wf_steps') { stepsCalls++; out = STEPS; }
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

  await page.evaluate(function () { location.hash = '#/approval-settings'; });
  await page.waitForFunction(function () {
    return document.querySelectorAll('.wf-set').length > 0;
  }, { timeout: 25000 }).catch(function () {});
  await page.waitForTimeout(1200);

  function snap() {
    return page.evaluate(function () {
      const list = document.getElementById('as-wflist');
      const cards = [].slice.call(document.querySelectorAll('.wf-set'));
      return {
        cards: cards.length,
        depts: document.querySelectorAll('.wf-set-depts').length,
        timelines: document.querySelectorAll('.wf-set-tl').length,
        openCards: document.querySelectorAll('.wf-set.on').length,
        editBtn: document.querySelectorAll('[data-as-wfedit]').length,
        delBtn: document.querySelectorAll('[data-as-wfdel]').length,
        text: list ? list.innerText.replace(/\s+/g, ' ') : '',
        html: list ? list.innerHTML : ''
      };
    });
  }

  /* ---------- สถานะปกติ: ต้องย่อ ---------- */
  let s = await snap();
  chk('1 · หน้าตั้งค่าการอนุมัติเปิดได้', s.cards === 2, 'การ์ด=' + s.cards);
  chk('2 · ซ่อนแผนก — ไม่มี .wf-set-depts เลย', s.depts === 0, 'พบ ' + s.depts);
  chk('2b · ไม่มีข้อความ "2 แผนก" / ชื่อแผนก',
    s.text.indexOf('2 แผนก') < 0 && s.text.indexOf('MAID') < 0, '');
  chk('3 · ซ่อนผังอนุมัติ — ไม่มี .wf-set-tl เลย', s.timelines === 0, 'พบ ' + s.timelines);
  chk('3b · ไม่มี "ผู้ยื่น" / "สำเร็จ" บนหน้า',
    s.text.indexOf('ผู้ยื่น') < 0 && s.text.indexOf('สำเร็จ') < 0, '');
  chk('3c · ไม่มี ANY / ALL', s.text.indexOf('ANY') < 0 && s.text.indexOf('ALL') < 0, '');
  chk('3d · ไม่มีรายชื่อผู้อนุมัติ', s.text.indexOf('นายจำรัส') < 0, '');
  chk('4 · ไม่ยิง njhr_wf_steps ตอนย่อ', stepsCalls === 0, 'เรียก ' + stepsCalls + ' ครั้ง');

  /* สิ่งที่ต้องเหลืออยู่ */
  chk('5 · ยังแสดงหัวข้อ Workflow',
    s.text.indexOf('ACCOUNT') >= 0 && s.text.indexOf('CUSTOMER SERVICE EXPORT') >= 0, '');
  chk('5b · ยังแสดงประเภท "ลา + OT"', s.text.indexOf('ลา + OT') >= 0, '');
  chk('5c · ยังแสดงสถานะ "เปิดใช้งาน"', s.text.indexOf('เปิดใช้งาน') >= 0, '');
  chk('5d · ยังแสดงจำนวนขั้น', /1 ขั้น/.test(s.text) && /3 ขั้น/.test(s.text), '');
  chk('5e · ยังแสดงจำนวนผู้อนุมัติ',
    /ผู้อนุมัติ 2 คน/.test(s.text) && /ผู้อนุมัติ 4 คน/.test(s.text), '');
  chk('5f · ปุ่มแก้ไข + ลบ ครบทุกการ์ด', s.editBtn === 2 && s.delBtn === 2,
    'แก้ไข=' + s.editBtn + ' ลบ=' + s.delBtn);

  /* ---------- กดแก้ไข: ต้องกาง ---------- */
  await page.evaluate(function () {
    document.querySelector('[data-as-wfedit="wf-1"]').click();
  });
  await page.waitForTimeout(1800);
  s = await snap();
  chk('6 · กด ✏️ แล้วกางรายละเอียด', s.openCards === 1 && s.depts === 1 && s.timelines === 1,
    'เปิด=' + s.openCards + ' depts=' + s.depts + ' tl=' + s.timelines);
  chk('6b · การ์ดที่ไม่ได้กดยังย่ออยู่', s.cards === 2 && s.depts === 1,
    'การ์ดทั้งหมด=' + s.cards + ' กางแค่=' + s.depts);
  chk('6c · แสดงแผนกของชุดที่กาง', s.text.indexOf('MAID') >= 0, '');
  chk('6d · แสดงผังอนุมัติ (ผู้ยื่น → … → สำเร็จ)',
    s.text.indexOf('ผู้ยื่น') >= 0 && s.text.indexOf('สำเร็จ') >= 0, '');
  chk('6e · แสดง ANY/ALL และรายชื่อผู้อนุมัติ',
    s.text.indexOf('ANY') >= 0 && s.text.indexOf('นายจำรัส') >= 0, '');
  chk('6f · ยิง njhr_wf_steps เฉพาะชุดที่กาง', stepsCalls === 1, 'เรียก ' + stepsCalls + ' ครั้ง');

  /* ---------- กดอีกชุด: ชุดเดิมต้องย่อกลับ ---------- */
  await page.evaluate(function () {
    document.querySelector('[data-as-wfedit="wf-2"]').click();
  });
  await page.waitForTimeout(1800);
  s = await snap();
  chk('7 · เปิดชุดใหม่ → ชุดเดิมย่อกลับ (กางได้ทีละชุด)',
    s.openCards === 1 && s.depts === 1 && s.timelines === 1,
    'เปิด=' + s.openCards + ' depts=' + s.depts);
  chk('7b · ชุดเดิม (ACCOUNT) ไม่แสดง MAID แล้ว', s.text.indexOf('MAID') < 0, '');

  /* ---------- ปุ่มลบยังทำงาน ---------- */
  await page.evaluate(function () {
    document.querySelector('[data-as-wfdel="wf-2"]').click();
  });
  await page.waitForTimeout(1200);
  const hasModal = await page.evaluate(function () { return !!document.querySelector('#modal-root .modal'); });
  chk('8 · ปุ่มลบยังกดได้ (เปิดกล่องยืนยัน)', hasModal, '');
  await page.evaluate(function () {
    const c = document.getElementById('cf-no'); if (c) c.click();
    else { const m = document.querySelector('#modal-root .modal'); if (m) m.remove(); }
  });
  await page.waitForTimeout(600);

  /* ---------- Leave / OT ไม่กระทบ ---------- */
  await page.evaluate(function () { location.hash = '#/leave'; });
  await page.waitForTimeout(1500);
  chk('9 · หน้าลางานเปิดได้',
    await page.evaluate(function () { return location.hash === '#/leave'; }), '');
  await page.evaluate(function () { location.hash = '#/ot'; });
  await page.waitForTimeout(1500);
  chk('9b · หน้า OT เปิดได้',
    await page.evaluate(function () { return location.hash === '#/ot'; }), '');
  await page.evaluate(function () { location.hash = '#/approvals'; });
  await page.waitForTimeout(1800);
  chk('9c · หน้าอนุมัติรายการเปิดได้',
    await page.evaluate(function () { return location.hash === '#/approvals'; }), '');

  chk('CONSOLE · ไม่มี unhandled error', errs.length === 0, errs.slice(0, 2).join(' | ') || 'ไม่มี');

  console.log('\n========== สรุป ==========');
  console.log('PASS ' + PASS + ' · FAIL ' + FAIL);
  await b.close(); srv.close();
  process.exit(FAIL ? 1 : 0);
})();
