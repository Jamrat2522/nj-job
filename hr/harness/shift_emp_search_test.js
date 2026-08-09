/* shift_emp_search_test.js — ช่องค้นหาใน Modal "พนักงานในกะ"
   ใช้: node harness/shift_emp_search_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require(__dirname + '/fixtures.js');

let PASS = 0, FAIL = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8961);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(62) + (e || '')); }

const SHIFTS = [
  { id: 'sh-1', shift_name: 'OFFICE', start_time: '08:30:00', end_time: '17:30:00',
    break_minutes: 60, late_allow_minutes: 0, is_overnight: false, is_active: true, employee_count: 105 }
];
/* รายชื่อจำลองตามภาพหน้าจอจริง + เติมให้ครบ 105 คน */
const NAMED = [
  { employee_id: 'e1', emp_code: '0002', full_name: 'นางสาวสุนทรี ทิรานุกูล', nickname: '', department_name: 'MANAGING DIRECTOR' },
  { employee_id: 'e2', emp_code: '0004', full_name: 'นายจำลอง ผาเทพ', nickname: 'จ่อย', department_name: 'MANAGER' },
  { employee_id: 'e3', emp_code: '0048', full_name: 'นายวันชนะ วีระสัย', nickname: '', department_name: 'SHIPPING LBK' },
  { employee_id: 'e4', emp_code: '0063', full_name: 'นายวิศรุต ใจดี', nickname: '', department_name: 'SHIPPING AIRPORT' },
  { employee_id: 'e5', emp_code: '0070', full_name: 'นายปิยบุตร พุ่มชื่น', nickname: '', department_name: 'SHIPPING LCB' },
  { employee_id: 'e6', emp_code: '0088', full_name: 'นายวิศรุต แสงทอง', nickname: '', department_name: 'SHIPPING AIRPORT' },
  { employee_id: 'e7', emp_code: '0099', full_name: 'Somchai Jaidee', nickname: '', department_name: 'SHIPPING AIRPORT' }
];
const EMPS = NAMED.slice();
for (let i = EMPS.length + 1; i <= 105; i++) {
  EMPS.push({ employee_id: 'x' + i, emp_code: 'Z' + String(2000 + i),
    full_name: 'พนักงาน ทั่วไป' + i, nickname: '', department_name: 'ปฏิบัติการ' });
}
EMPS.forEach(e => { e.effective_date = '2026-08-03'; });

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

let empCalls = 0;

(async function () {
  const srv = await serve(ROOT, PORT);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const errs = [];

  async function open(ctx) {
    await ctx.route('**/rest/v1/rpc/*', function (route) {
      const fn = route.request().url().split('/rpc/')[1].split('?')[0];
      let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      let out;
      if (fn === 'njhr_shift_list') out = SHIFTS;
      else if (fn === 'njhr_shift_unassigned_employees') out = [];
      else if (fn === 'njhr_shift_employee_list') { empCalls++; out = EMPS; }
      else out = F.respond(fn, bd);
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) });
    });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push(String(e)));
    pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await pg.addInitScript(() => { try { localStorage.setItem('njhr_token', 'MOCK-TOKEN-FIXED'); } catch (e) {} });
    await pg.goto('http://localhost:' + PORT + '/#/shifts', { waitUntil: 'networkidle' });
    await pg.waitForSelector('.sh-card', { timeout: 15000 });
    await pg.click('.sh-card [data-more="sh-1"]');
    await pg.click('.sh-pop [data-emp="sh-1"]');
    await pg.waitForSelector('#shl-list .sh-emp-row', { timeout: 8000 });
    return pg;
  }

  const visible = pg => pg.$$eval('#shl-list .sh-emp-row', ns =>
    ns.filter(n => n.offsetParent !== null).map(n => n.querySelector('b').textContent));

  /* ---------- DESKTOP ---------- */
  const ctxD = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  const pg = await open(ctxD);

  chk('ช่องค้นหาอยู่ใต้บรรทัดจำนวนคน และเหนือรายการ', await pg.evaluate(() => {
    const msg = document.querySelector('#modal-root .confirm-msg');
    const q = document.getElementById('shl-q'), list = document.getElementById('shl-list');
    if (!msg || !q || !list) return false;
    const a = msg.getBoundingClientRect().bottom, c = q.getBoundingClientRect();
    return c.top >= a - 1 && c.bottom <= list.getBoundingClientRect().top + 1;
  }));
  chk('placeholder บอกว่าค้นได้ ชื่อ / รหัส / แผนก',
    /ชื่อ.*รหัสพนักงาน.*แผนก/.test(await pg.getAttribute('#shl-q', 'placeholder')),
    await pg.getAttribute('#shl-q', 'placeholder'));

  const all0 = await visible(pg);
  chk('เริ่มต้นแสดงพนักงานครบทั้ง 105 คน', all0.length === 105, 'พบ ' + all0.length);
  chk('บรรทัดหัวเรื่องยังเป็น 105 คน',
    /·\s*105\s*คน/.test(await pg.textContent('#modal-root .confirm-msg')),
    await pg.textContent('#modal-root .confirm-msg'));

  const before = empCalls;
  await pg.fill('#shl-q', '0063');
  let v = await visible(pg);
  chk('ค้นด้วยรหัส "0063" เจอคนเดียวถูกต้อง',
    v.length === 1 && v[0] === 'นายวิศรุต ใจดี', JSON.stringify(v));

  await pg.fill('#shl-q', 'วิศรุต');
  v = await visible(pg);
  chk('ค้นด้วยชื่อไทย "วิศรุต" เจอ 2 คน', v.length === 2, JSON.stringify(v));

  await pg.fill('#shl-q', 'SHIPPING AIRPORT');
  v = await visible(pg);
  chk('ค้นด้วยแผนก "SHIPPING AIRPORT" เจอเฉพาะแผนกนั้น 3 คน', v.length === 3, JSON.stringify(v));

  await pg.fill('#shl-q', 'shipping airport');
  chk('ไม่สนตัวพิมพ์เล็ก/ใหญ่', (await visible(pg)).length === 3);
  await pg.fill('#shl-q', '   somchai   ');
  v = await visible(pg);
  chk('Trim ช่องว่างหน้า/หลัง + ค้นภาษาอังกฤษได้',
    v.length === 1 && v[0] === 'Somchai Jaidee', JSON.stringify(v));
  await pg.fill('#shl-q', 'จ่อย');
  chk('ค้นด้วยชื่อเล่นได้ (ข้อมูลที่มีในรายการ)', (await visible(pg)).length === 1);
  await pg.fill('#shl-q', 'ผาเทพ');
  chk('ค้นด้วยนามสกุลได้', (await visible(pg)).length === 1);
  await pg.fill('#shl-q', 'จำลอง ผาเทพ');
  chk('ค้นด้วยชื่อ-นามสกุลเต็มได้', (await visible(pg)).length === 1);

  chk('พิมพ์ค้นหาแล้วไม่ยิง RPC ใหม่เลย', empCalls === before, 'เรียกเพิ่ม ' + (empCalls - before) + ' ครั้ง');

  /* ตัวนับ + กรณีไม่พบ */
  await pg.fill('#shl-q', 'SHIPPING AIRPORT');
  chk('แสดง "พบ 3 จาก 105 คน"',
    /พบ\s*3\s*จาก\s*105\s*คน/.test(await pg.textContent('#shl-found')), await pg.textContent('#shl-found'));
  await pg.fill('#shl-q', 'ไม่มีคนนี้แน่นอน');
  v = await visible(pg);
  const noneVisible = await pg.evaluate(() => {
    const n = document.getElementById('shl-none');
    return n && !n.hidden && n.offsetParent !== null ? n.textContent.trim() : '';
  });
  chk('ไม่พบ → ซ่อนทุกแถว', v.length === 0, JSON.stringify(v));
  chk('ไม่พบ → แสดง "ไม่พบพนักงานที่ตรงกับคำค้นหา"',
    noneVisible === 'ไม่พบพนักงานที่ตรงกับคำค้นหา', noneVisible);
  chk('ไม่พบ → Modal ไม่ Error', errs.length === 0, errs.slice(0, 2).join(' | '));

  /* Checkbox */
  await pg.fill('#shl-q', '');
  chk('ล้างคำค้น → กลับมาครบ 105 คน', (await visible(pg)).length === 105);
  const noneAfter = await pg.evaluate(() => document.getElementById('shl-none').hidden);
  chk('ล้างคำค้น → ซ่อนข้อความ "ไม่พบ"', noneAfter === true);
  chk('ล้างคำค้น → ซ่อนตัวนับ', (await pg.textContent('#shl-found')).trim() === '');

  await pg.check('#shl-list .sh-emp-row:nth-child(4) input.shl-pick');   // 0063 วิศรุต ใจดี
  await pg.check('#shl-list .sh-emp-row:nth-child(2) input.shl-pick');   // 0004 จำลอง ผาเทพ
  const sel0 = await pg.$$eval('.shl-pick:checked', n => n.map(x => x.value));
  await pg.fill('#shl-q', 'SHIPPING AIRPORT');
  const selMid = await pg.$$eval('.shl-pick:checked', n => n.map(x => x.value));
  chk('ค้นหาแล้ว Selection เดิมไม่ถูกยกเลิก',
    JSON.stringify(selMid.slice().sort()) === JSON.stringify(sel0.slice().sort()), JSON.stringify(selMid));
  const stillChecked = await pg.evaluate(() =>
    document.querySelector('#shl-list .sh-emp-row:nth-child(4) input.shl-pick').checked);
  chk('แถวที่ยังแสดงอยู่ยังติ๊กค้างไว้', stillChecked === true);
  await pg.fill('#shl-q', '');
  const sel1 = await pg.$$eval('.shl-pick:checked', n => n.map(x => x.value));
  chk('ล้างคำค้น → สถานะ Checkbox กลับมาถูกต้องครบ',
    JSON.stringify(sel1.slice().sort()) === JSON.stringify(sel0.slice().sort()), JSON.stringify(sel1));
  chk('ยังมี Checkbox ครบ 105 ช่อง (ไม่ถูกลบทิ้งตอนกรอง)',
    (await pg.$$eval('#shl-list .shl-pick', n => n.length)) === 105);

  /* ปุ่มย้ายกะเดิมยังอยู่ */
  chk('ปุ่ม "ย้ายกะ" และตัวเลือกกะปลายทางเดิมยังอยู่',
    (await pg.$('#shl-move')) !== null && (await pg.$('#shl-to')) !== null);

  /* ---------- MOBILE ---------- */
  const ctxM = await b.newContext({ viewport: { width: 390, height: 780 }, isMobile: true,
    hasTouch: true, serviceWorkers: 'block' });
  const pgm = await open(ctxM);
  const fit = await pgm.evaluate(() => {
    const q = document.getElementById('shl-q').closest('.search-box').getBoundingClientRect();
    const bd = document.querySelector('#modal-root .modal-body').getBoundingClientRect();
    return { ql: Math.round(q.left), qr: Math.round(q.right), qh: Math.round(q.height),
      bl: Math.round(bd.left), br: Math.round(bd.right) };
  });
  chk('Mobile: ช่องค้นหาไม่ล้น Modal',
    fit.ql >= fit.bl - 1 && fit.qr <= fit.br + 1, JSON.stringify(fit));
  chk('Mobile: ช่องค้นหาสูงพอกดพิมพ์ง่าย (≥ 38px)', fit.qh >= 38, fit.qh + 'px');
  await pgm.fill('#shl-q', '0063');
  chk('Mobile: กรองได้ทันทีขณะพิมพ์', (await visible(pgm)).length === 1);
  const scrollable = await pgm.evaluate(() => {
    const b2 = document.querySelector('#modal-root .modal-body');
    return b2.scrollHeight > b2.clientHeight || document.body.scrollHeight > window.innerHeight;
  });
  await pgm.fill('#shl-q', '');
  chk('Mobile: รายการยัง Scroll ได้ตามเดิม', await pgm.evaluate(() => {
    const b2 = document.querySelector('#modal-root .modal-body');
    return b2.scrollHeight > b2.clientHeight;
  }) || scrollable);
  const hs = await pgm.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  chk('Mobile: ไม่มี Horizontal Scroll', hs <= 0, 'เกิน ' + hs + 'px');

  chk('ไม่มี JavaScript Error', errs.length === 0, errs.slice(0, 3).join(' | '));

  await b.close(); srv.close();
  console.log('\nPASS ' + PASS + ' · FAIL ' + FAIL);
  process.exit(FAIL ? 1 : 0);
})();
