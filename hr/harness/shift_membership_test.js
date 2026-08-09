/* shift_membership_test.js — จัดการพนักงานในกะ · นำออกจากกะ · ไม่ใช้กะ (K2)
   ตรวจว่า Frontend เรียก RPC ของ K2 ถูกตัว ถูก Parameter และเป็น Batch จริง
   ใช้: node harness/shift_membership_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require(__dirname + '/fixtures.js');

let PASS = 0, FAIL = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8781);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(60) + (e || '')); }

/* ---------- ฐานข้อมูลจำลอง: employee_shifts แบบ append-only ตาม K2 ---------- */
const SHIFTS = [
  { id: 'sh-1', shift_name: 'NJLOGISTIC', start_time: '08:30:00', end_time: '17:30:00',
    break_minutes: 60, late_allow_minutes: 0, is_overnight: false, is_active: true },
  { id: 'sh-2', shift_name: 'ดึก', start_time: '20:00:00', end_time: '05:00:00',
    break_minutes: 60, late_allow_minutes: 0, is_overnight: true, is_active: true }
];
const EMPS = [];
for (let i = 1; i <= 6; i++) {
  EMPS.push({ employee_id: 'e' + i, emp_code: 'NJ000' + i, full_name: 'พนักงาน ทดสอบ' + i,
    nickname: 'ท' + i, department_name: 'ปฏิบัติการ', position_name: 'เจ้าหน้าที่', emp_status: 'ACTIVE' });
}
/* แถวประวัติ: {employee_id, shift_id, effective_date, status} — ไม่ลบ ไม่แก้ทับ */
let HIST = EMPS.slice(0, 4).map(e => ({ employee_id: e.employee_id, shift_id: 'sh-1',
  effective_date: '2026-01-01', status: 'ACTIVE' }));

const calls = [];                                   // บันทึกทุก RPC ที่ Frontend ยิง

function stateOf(id) {                              // ตรรกะเดียวกับ njhr_shift_state_at
  const rows = HIST.filter(h => h.employee_id === id)
    .sort((a, b) => a.effective_date < b.effective_date ? 1 : -1);
  return rows[0] || null;
}
function mark(ids, shiftId, status, date) {
  const out = [];
  ids.forEach(id => {
    const e = EMPS.find(x => x.employee_id === id);
    const same = HIST.find(h => h.employee_id === id && h.effective_date === date);
    let result;
    if (same && same.status === status && (same.shift_id || null) === (shiftId || null)) result = 'UNCHANGED';
    else if (same) { same.shift_id = shiftId; same.status = status; result = 'REPLACED'; }
    else { HIST.push({ employee_id: id, shift_id: shiftId, effective_date: date, status: status }); result = 'INSERTED'; }
    out.push({ employee_id: id, emp_code: e ? e.emp_code : id, result: result,
      old_shift_name: null });
  });
  return out;
}
function respond(fn, bd) {
  calls.push({ fn: fn, body: bd });
  if (fn === 'njhr_shift_list') {
    return SHIFTS.map(s => Object.assign({}, s, {
      employee_count: EMPS.filter(e => { const st = stateOf(e.employee_id);
        return st && st.status === 'ACTIVE' && st.shift_id === s.id; }).length,
      updated_at: null, updated_by: null }));
  }
  if (fn === 'njhr_shift_employee_list') {
    return EMPS.filter(e => { const st = stateOf(e.employee_id);
      return st && st.status === 'ACTIVE' && st.shift_id === bd.p_shift; })
      .map(e => Object.assign({}, e, { effective_date: stateOf(e.employee_id).effective_date }));
  }
  if (fn === 'njhr_shift_unassigned_employees') {
    const q = String(bd.p_q || '').toLowerCase();
    return EMPS.filter(e => { const st = stateOf(e.employee_id);
      if (st && st.status === 'NO_SHIFT') return false;
      return !st || st.status !== 'ACTIVE' || !st.shift_id; })
      .filter(e => !q || (e.emp_code + e.full_name + e.nickname + e.department_name).toLowerCase().includes(q));
  }
  if (fn === 'njhr_shift_no_shift_employees') {
    const q = String(bd.p_q || '').toLowerCase();
    return EMPS.filter(e => { const st = stateOf(e.employee_id); return st && st.status === 'NO_SHIFT'; })
      .filter(e => !q || (e.emp_code + e.full_name + e.nickname + e.department_name).toLowerCase().includes(q))
      .map(e => Object.assign({}, e, { effective_date: stateOf(e.employee_id).effective_date }));
  }
  if (fn === 'njhr_shift_assign_many') {
    const before = {};
    bd.p_employees.forEach(id => { const st = stateOf(id);
      const s = st && st.status === 'ACTIVE' && st.shift_id ? SHIFTS.find(x => x.id === st.shift_id) : null;
      before[id] = s ? s.shift_name : null; });
    const out = mark(bd.p_employees, bd.p_shift, 'ACTIVE', bd.p_effective_date);
    out.forEach(o => { o.old_shift_name = before[o.employee_id]; });
    return out;
  }
  if (fn === 'njhr_shift_remove') {
    return mark(bd.p_employees, null, bd.p_no_shift ? 'NO_SHIFT' : 'REMOVED', bd.p_effective_date);
  }
  if (fn === 'njhr_shift_no_shift_set') {
    return mark(bd.p_employees, null, bd.p_on ? 'NO_SHIFT' : 'REMOVED', bd.p_effective_date);
  }
  if (fn === 'njhr_emp_list') return [{ total_count: EMPS.length }];
  return F.respond(fn, bd);
}

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

  async function newCtx(w, h) {
    const ctx = await b.newContext({ viewport: { width: w, height: h },
      isMobile: w < 800, hasTouch: w < 800, serviceWorkers: 'block' });
    await ctx.route('**/rest/v1/rpc/*', function (route) {
      const fn = route.request().url().split('/rpc/')[1].split('?')[0];
      let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(respond(fn, bd)) });
    });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push(String(e)));
    pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await pg.addInitScript(() => { try { localStorage.setItem('njhr_token', 'MOCK-TOKEN-FIXED'); } catch (e) {} });
    return pg;
  }
  async function openShifts(pg) {
    await pg.goto('http://localhost:' + PORT + '/#/shifts', { waitUntil: 'networkidle' });
    await pg.waitForSelector('.sh-card', { timeout: 15000 });
  }
  const kpiUnassigned = pg => pg.evaluate(() => {
    const k = [].find.call(document.querySelectorAll('.sh-kpi'),
      x => x.textContent.indexOf('พนักงานยังไม่มีกะ') >= 0);
    return k ? Number((k.querySelector('b') || {}).textContent) : -1;
  });
  const cardCount = (pg, name) => pg.evaluate(n => {
    const c = [].find.call(document.querySelectorAll('.sh-card'),
      x => x.querySelector('.sh-r-name') && x.querySelector('.sh-r-name').textContent === n);
    if (!c) return -1;
    const m = /พนักงาน\s*(\d+)\s*คน/.exec(c.textContent);
    return m ? Number(m[1]) : -1;
  }, name);

  const pg = await newCtx(1440, 900);
  await openShifts(pg);

  chk('เมนู ⋮ มี "จัดการพนักงาน"', await (async () => {
    await pg.click('.sh-card [data-more="sh-1"]');
    await pg.waitForSelector('.sh-pop', { timeout: 5000 });
    const t = await pg.$$eval('.sh-pop .us-menu-item', ns => ns.map(x => x.textContent));
    return t.some(x => x.indexOf('จัดการพนักงาน') >= 0);
  })());

  chk('เริ่มต้น: NJLOGISTIC 4 คน · ยังไม่มีกะ 2 คน',
    (await cardCount(pg, 'NJLOGISTIC')) === 4 && (await kpiUnassigned(pg)) === 2,
    'กะ ' + (await cardCount(pg, 'NJLOGISTIC')) + ' · unassigned ' + (await kpiUnassigned(pg)));

  /* ---------- A. ACTIVE → REMOVED ---------- */
  await pg.click('.sh-pop [data-emp="sh-1"]');
  await pg.waitForSelector('#shl-list .shl-pick', { timeout: 8000 });
  chk('Modal มีช่อง "วันที่มีผล" ค่าเริ่มต้นเป็นวันที่ไทย', await pg.evaluate(() => {
    const d = document.getElementById('shl-date');
    const bkk = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok',
      year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    return !!d && d.value === bkk;
  }));
  chk('Modal มีปุ่มนำออกจากกะ 2 แบบ',
    (await pg.$('#shl-rm')) !== null && (await pg.$('#shl-ns')) !== null);

  calls.length = 0;
  await pg.check('#shl-list .sh-emp-row:nth-child(1) .shl-pick');
  await pg.check('#shl-list .sh-emp-row:nth-child(2) .shl-pick');
  await pg.click('#shl-rm');
  await pg.waitForSelector('#cf-yes', { timeout: 5000 });
  const cfTxt = await pg.textContent('.confirm-msg');
  chk('Confirm บอกจำนวนคน · ชื่อกะ · วันที่มีผล',
    /2 คน/.test(cfTxt) && /NJLOGISTIC/.test(cfTxt) && /ยังไม่ได้กำหนดกะ/.test(cfTxt), cfTxt.slice(0, 90));
  await pg.click('#cf-yes');
  await pg.waitForTimeout(900);

  const rmCalls = calls.filter(c => c.fn === 'njhr_shift_remove');
  chk('A. เรียก njhr_shift_remove ครั้งเดียวแบบ Batch (ไม่ใช่ N+1)',
    rmCalls.length === 1 && Array.isArray(rmCalls[0].body.p_employees) &&
    rmCalls[0].body.p_employees.length === 2, 'เรียก ' + rmCalls.length + ' ครั้ง');
  chk('A. ส่ง p_no_shift = false', rmCalls.length === 1 && rmCalls[0].body.p_no_shift === false);
  chk('A. ส่ง p_effective_date',
    rmCalls.length === 1 && /^\d{4}-\d{2}-\d{2}$/.test(String(rmCalls[0].body.p_effective_date || '')),
    rmCalls.length ? String(rmCalls[0].body.p_effective_date) : '-');
  chk('A. ประวัติเดิมไม่ถูกลบ (เพิ่มแถวใหม่เท่านั้น)',
    HIST.filter(h => h.effective_date === '2026-01-01').length === 4, HIST.length + ' แถว');
  chk('A. หายจากกะ · ไปอยู่ "ยังไม่ได้กำหนดกะ"',
    (await cardCount(pg, 'NJLOGISTIC')) === 2 && (await kpiUnassigned(pg)) === 4,
    'กะ ' + (await cardCount(pg, 'NJLOGISTIC')) + ' · unassigned ' + (await kpiUnassigned(pg)));
  chk('A. ไม่อยู่ใน "ไม่ใช้กะ"', await pg.evaluate(() => {
    const c = [].find.call(document.querySelectorAll('.sh-ns-card'), x => x);
    return c ? /0 คน/.test(c.querySelector('.badge').textContent) : false;
  }));

  /* ---------- B. REMOVED → ACTIVE (Batch) ---------- */
  calls.length = 0;
  await pg.click('#shu-all');
  await pg.selectOption('#shu-to', 'sh-2');
  await pg.click('#shu-go');
  await pg.waitForSelector('#cf-yes', { timeout: 5000 });
  await pg.click('#cf-yes');
  await pg.waitForTimeout(900);
  const asCalls = calls.filter(c => c.fn === 'njhr_shift_assign_many');
  const oldAssign = calls.filter(c => c.fn === 'njhr_shift_assign');
  chk('B. เรียก njhr_shift_assign_many ครั้งเดียว 4 คน',
    asCalls.length === 1 && asCalls[0].body.p_employees.length === 4, 'เรียก ' + asCalls.length + ' ครั้ง');
  chk('B. ไม่เรียก njhr_shift_assign แบบทีละคนอีกแล้ว', oldAssign.length === 0,
    'พบ ' + oldAssign.length + ' ครั้ง');
  chk('B. เข้ากะใหม่ · หายจาก "ยังไม่ได้กำหนดกะ"',
    (await cardCount(pg, 'ดึก')) === 4 && (await kpiUnassigned(pg)) === 0,
    'ดึก ' + (await cardCount(pg, 'ดึก')) + ' · unassigned ' + (await kpiUnassigned(pg)));

  /* ---------- C. ACTIVE → NO_SHIFT ---------- */
  calls.length = 0;
  await pg.click('.sh-card [data-more="sh-2"]');
  await pg.click('.sh-pop [data-emp="sh-2"]');
  await pg.waitForSelector('#shl-list .shl-pick', { timeout: 8000 });
  await pg.check('#shl-list .sh-emp-row:nth-child(1) .shl-pick');
  await pg.click('#shl-ns');
  await pg.waitForSelector('#cf-yes', { timeout: 5000 });
  const cf2 = await pg.textContent('.confirm-msg');
  chk('C. Confirm ระบุชัดว่าจะกลายเป็น "ไม่ใช้กะ"', /ไม่ใช้กะ/.test(cf2), cf2.slice(0, 80));
  await pg.click('#cf-yes');
  await pg.waitForTimeout(900);
  const nsCalls = calls.filter(c => c.fn === 'njhr_shift_remove');
  chk('C. เรียก njhr_shift_remove · p_no_shift = true',
    nsCalls.length === 1 && nsCalls[0].body.p_no_shift === true);
  chk('C. หายจากกะ · ไม่อยู่ "ยังไม่ได้กำหนดกะ"',
    (await cardCount(pg, 'ดึก')) === 3 && (await kpiUnassigned(pg)) === 0,
    'ดึก ' + (await cardCount(pg, 'ดึก')) + ' · unassigned ' + (await kpiUnassigned(pg)));
  chk('C. อยู่ในส่วน "ไม่ใช้กะ" 1 คน', await pg.evaluate(() =>
    /1 คน/.test(document.querySelector('.sh-ns-card .badge').textContent)));

  /* ---------- D. NO_SHIFT → unassigned ---------- */
  calls.length = 0;
  await pg.click('#shn-toggle');
  await pg.waitForSelector('#shn-list .shn-pick', { timeout: 8000 });
  await pg.click('#shn-all');
  await pg.click('#shn-cancel');
  await pg.waitForSelector('#cf-yes', { timeout: 5000 });
  const cf3 = await pg.textContent('.confirm-msg');
  chk('D. Confirm บอกว่าไม่กลับไปใช้กะเดิมอัตโนมัติ',
    /ไม่กลับไปใช้กะเดิม/.test(cf3), cf3.slice(0, 90));
  await pg.click('#cf-yes');
  await pg.waitForTimeout(900);
  const cxCalls = calls.filter(c => c.fn === 'njhr_shift_no_shift_set');
  chk('D. เรียก njhr_shift_no_shift_set · p_on = false',
    cxCalls.length === 1 && cxCalls[0].body.p_on === false);
  chk('D. ไปอยู่ "ยังไม่ได้กำหนดกะ" · ไม่กลับกะเก่า',
    (await kpiUnassigned(pg)) === 1 && (await cardCount(pg, 'ดึก')) === 3,
    'unassigned ' + (await kpiUnassigned(pg)) + ' · ดึก ' + (await cardCount(pg, 'ดึก')));

  /* ---------- E. ตั้งไม่ใช้กะ จากคนที่ยังไม่มีกะ ---------- */
  calls.length = 0;
  await pg.click('#shu-all');
  await pg.click('#shu-ns');
  await pg.waitForSelector('#cf-yes', { timeout: 5000 });
  await pg.click('#cf-yes');
  await pg.waitForTimeout(900);
  const setCalls = calls.filter(c => c.fn === 'njhr_shift_no_shift_set');
  chk('E. เรียก njhr_shift_no_shift_set · p_on = true (Batch)',
    setCalls.length === 1 && setCalls[0].body.p_on === true &&
    Array.isArray(setCalls[0].body.p_employees));
  chk('E. ตัวเลขอัปเดตทันทีโดยไม่ reload หน้า',
    (await kpiUnassigned(pg)) === 0, 'unassigned ' + (await kpiUnassigned(pg)));

  /* ---------- ไม่มี Assign ซ้ำ ---------- */
  calls.length = 0;
  await pg.click('.sh-card [data-more="sh-2"]');
  await pg.click('.sh-pop [data-emp="sh-2"]');
  await pg.waitForSelector('#shl-list .shl-pick', { timeout: 8000 });
  await pg.check('#shl-list .sh-emp-row:nth-child(1) .shl-pick');
  await pg.selectOption('#shl-to', 'sh-1');
  await pg.click('#shl-move');
  await pg.waitForSelector('#cf-yes', { timeout: 5000 });
  const cf4 = await pg.textContent('.confirm-msg');
  chk('ย้ายกะ: Confirm สรุปกะเดิมและกะใหม่ครั้งเดียว ไม่ถาม 5 รอบ',
    /ปัจจุบันอยู่กะ/.test(cf4) && /ต้องการย้ายไปกะ/.test(cf4), cf4.slice(0, 100));
  await pg.click('#cf-yes');
  await pg.waitForTimeout(900);
  chk('ย้ายกะใช้ Batch ครั้งเดียว',
    calls.filter(c => c.fn === 'njhr_shift_assign_many').length === 1);

  /* ---------- Mobile ---------- */
  for (const w of [360, 390, 768]) {
    const m = await newCtx(w, 800);
    await openShifts(m);
    const hs = await m.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await m.click('.sh-card [data-more="sh-1"]');
    await m.click('.sh-pop [data-emp="sh-1"]');
    await m.waitForSelector('#modal-root .modal-body', { timeout: 8000 });
    const fit = await m.evaluate(() => {
      const md = document.querySelector('#modal-root .modal');
      const r = md.getBoundingClientRect();
      return { l: Math.round(r.left), rr: Math.round(r.right),
        vw: document.documentElement.clientWidth,
        hs2: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    chk('Mobile ' + w + 'px: ไม่มี Horizontal Scroll · Modal ไม่ล้นจอ',
      hs <= 0 && fit.l >= -1 && fit.rr <= fit.vw + 1 && fit.hs2 <= 0,
      'page ' + hs + ' · modal ' + fit.l + '→' + fit.rr + '/' + fit.vw);
    await m.context().close();
  }

  chk('ไม่มี JavaScript Error', errs.length === 0, errs.slice(0, 2).join(' | '));

  await b.close(); srv.close();
  console.log('\nPASS ' + PASS + ' · FAIL ' + FAIL);
  process.exit(FAIL ? 1 : 0);
})();
