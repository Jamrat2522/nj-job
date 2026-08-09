/* shift_row_test.js — ตั้งค่ากะทำงาน: 1 กะ = 1 แถว · การจัดการรวมในเมนู ⋮
   ใช้: node harness/shift_row_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require(__dirname + '/fixtures.js');

let PASS = 0, FAIL = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8991);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(64) + (e || '')); }

/* กะจำลอง — ตรงกับภาพหน้าจอจริง 4 กะ (OFFICE 105 คน · เช้า 0 · 09.00-18.00 1 · ดึก ข้ามวัน/ปิดใช้งาน) */
const SHIFTS = [
  { id: 'sh-1', shift_name: 'OFFICE', start_time: '08:30:00', end_time: '17:30:00',
    break_minutes: 60, late_allow_minutes: 0, is_overnight: false, is_active: true, employee_count: 105 },
  { id: 'sh-2', shift_name: 'เช้า', start_time: '08:30:00', end_time: '20:00:00',
    break_minutes: 60, late_allow_minutes: 0, is_overnight: false, is_active: true, employee_count: 0 },
  { id: 'sh-3', shift_name: '09.00-18.00', start_time: '09:00:00', end_time: '18:00:00',
    break_minutes: 60, late_allow_minutes: 0, is_overnight: false, is_active: true, employee_count: 1 },
  { id: 'sh-4', shift_name: 'ดึก', start_time: '20:00:00', end_time: '05:00:00',
    break_minutes: 60, late_allow_minutes: 15, is_overnight: true, is_active: false, employee_count: 2 }
];
/* รายชื่อพนักงานต่อกะ — ต้องเท่ากับ employee_count เสมอ */
function empOf(shiftId) {
  const s = SHIFTS.find(x => x.id === shiftId) || { employee_count: 0 };
  const out = [];
  for (let i = 1; i <= s.employee_count; i++) {
    out.push({ employee_id: shiftId + '-e' + i, emp_code: 'NJ' + String(i).padStart(4, '0'),
      full_name: 'พนักงาน ' + shiftId + '-' + i, nickname: '', department_name: 'บัญชี',
      effective_date: '2026-01-01' });
  }
  return out;
}
let empListCalls = [];

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
  const errs = [], net = [];

  async function openShifts(ctx) {
    await ctx.route('**/rest/v1/rpc/*', function (route) {
      const fn = route.request().url().split('/rpc/')[1].split('?')[0];
      let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      let out;
      if (fn === 'njhr_shift_list') out = SHIFTS;
      else if (fn === 'njhr_shift_unassigned_employees') out = [];
      else if (fn === 'njhr_shift_employee_list') { empListCalls.push(bd.p_shift); out = empOf(bd.p_shift); }
      else out = F.respond(fn, bd);
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) });
    });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push(String(e)));
    pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    pg.on('response', r => { if (r.status() >= 400) net.push(r.status() + ' ' + r.url()); });
    await pg.addInitScript(() => { try { localStorage.setItem('njhr_token', 'MOCK-TOKEN-FIXED'); } catch (e) {} });
    await pg.goto('http://localhost:' + PORT + '/#/shifts', { waitUntil: 'networkidle' });
    await pg.waitForSelector('.sh-card', { timeout: 15000 });
    return pg;
  }

  /* ---------- DESKTOP ---------- */
  const ctxD = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  const pg = await openShifts(ctxD);

  const cards = await pg.$$('.sh-card');
  chk('การ์ดกะครบ 4 ใบ', cards.length === 4, 'พบ ' + cards.length);

  /* 1 กะ = 1 แถวเต็มความกว้าง → ทุกการ์ดต้องมี left เท่ากันและ width เท่ากับ grid */
  const geo = await pg.evaluate(() => {
    const g = document.querySelector('.sh-grid').getBoundingClientRect();
    return { grid: { l: Math.round(g.left), w: Math.round(g.width) },
      cards: [].map.call(document.querySelectorAll('.sh-card'), c => {
        const r = c.getBoundingClientRect();
        return { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
      }) };
  });
  chk('ทุกการ์ดชิดซ้ายตำแหน่งเดียวกัน (ไม่มี 2–3 กะในแถวเดียว)',
    geo.cards.every(c => c.l === geo.cards[0].l), JSON.stringify(geo.cards.map(c => c.l)));
  chk('ทุกการ์ดกว้างเต็ม grid', geo.cards.every(c => Math.abs(c.w - geo.grid.w) <= 1),
    'grid ' + geo.grid.w + ' · card ' + geo.cards.map(c => c.w).join(','));
  chk('การ์ดเรียงลงแนวตั้ง (top ต่างกันทุกใบ)',
    geo.cards.every((c, i) => i === 0 || c.t > geo.cards[i - 1].t), JSON.stringify(geo.cards.map(c => c.t)));
  chk('ความสูงการ์ดเป็นแบบแถว (≤ 110px)', geo.cards.every(c => c.h <= 110),
    JSON.stringify(geo.cards.map(c => c.h)));

  /* ห้ามมีชื่อพนักงาน / avatar / +XX คน บนการ์ด */
  const dirty = await pg.evaluate(() => {
    const box = document.querySelector('.sh-grid');
    return {
      people: box.querySelectorAll('.sh-people, .sh-person, .sh-more-people').length,
      avatar: box.querySelectorAll('.avatar').length,
      plusN: /\+\s*\d+\s*คน/.test(box.textContent),
      empName: box.textContent.indexOf('พนักงาน sh-') >= 0
    };
  });
  chk('ไม่มี chip/รายชื่อพนักงานบนการ์ด', dirty.people === 0, 'พบ ' + dirty.people);
  chk('ไม่มี Avatar พนักงานบนการ์ด', dirty.avatar === 0, 'พบ ' + dirty.avatar);
  chk('ไม่มีข้อความ "+XX คน" บนการ์ด', dirty.plusN === false);
  chk('ไม่มีชื่อพนักงานบนการ์ด', dirty.empName === false);

  /* ยังต้องแสดงจำนวนพนักงาน และตรงกับ employee_count เดิม */
  const counts = await pg.evaluate(() => [].map.call(document.querySelectorAll('.sh-card'), c => {
    const m = /พนักงาน\s*(\d+)\s*คน/.exec(c.textContent); return m ? Number(m[1]) : null;
  }));
  chk('การ์ดแสดงจำนวนพนักงานครบทุกใบ', counts.every(x => x !== null), JSON.stringify(counts));
  chk('จำนวนพนักงานตรงกับ employee_count เดิม',
    JSON.stringify(counts) === JSON.stringify(SHIFTS.map(s => s.employee_count)), JSON.stringify(counts));

  /* ข้อมูลกะครบบนการ์ด */
  const first = await pg.evaluate(() => document.querySelector('.sh-card').textContent.replace(/\s+/g, ' '));
  chk('การ์ดแสดง ชื่อกะ · เวลา · พัก · สาย · สถานะ',
    /OFFICE/.test(first) && /08:30\s*–\s*17:30/.test(first) && /พัก\s*60 นาที/.test(first) &&
    /สาย\s*0 นาที/.test(first) && /เปิดใช้งาน/.test(first), first);
  const nightTxt = await pg.evaluate(() => document.querySelectorAll('.sh-card')[3].textContent.replace(/\s+/g, ' '));
  chk('กะข้ามวันแสดงป้าย "ข้ามวัน" และสถานะปิดใช้งาน',
    /ข้ามวัน/.test(nightTxt) && /ปิดใช้งาน/.test(nightTxt), nightTxt);

  /* ปุ่มบนการ์ดเหลือ ⋮ อย่างเดียว */
  const btns = await pg.evaluate(() => {
    const c = document.querySelector('.sh-card');
    return { total: c.querySelectorAll('button').length,
      more: c.querySelectorAll('[data-more]').length,
      labels: [].map.call(c.querySelectorAll('button'), x => x.textContent.trim()) };
  });
  chk('การ์ดมีปุ่มเดียวคือ ⋮', btns.total === 1 && btns.more === 1, JSON.stringify(btns.labels));
  chk('ไม่มีปุ่ม รายชื่อพนักงาน / แก้ไข / ปิดใช้งาน บนการ์ด',
    !/รายชื่อพนักงาน|แก้ไข|ปิดใช้งาน|เปิดใช้งาน/.test(btns.labels.join('|')), JSON.stringify(btns.labels));

  /* เมนู ⋮ — กะเปิดใช้งาน */
  await pg.click('.sh-card [data-more="sh-1"]');
  await pg.waitForSelector('.sh-pop', { timeout: 5000 });
  const m1 = await pg.evaluate(() => [].map.call(document.querySelectorAll('.sh-pop .us-menu-item'), x => {
    const c = x.cloneNode(true), ic = c.querySelector('.us-menu-ic'); if (ic) ic.remove();
    return c.textContent.trim();
  }));
  /* ชื่อเมนูเปลี่ยนเป็น "จัดการพนักงาน" ตั้งแต่รอบ K2 (เปิด Modal ตัวเดิม + เพิ่มนำออกจากกะ) */
  chk('⋮ มี "จัดการพนักงาน"', m1.indexOf('จัดการพนักงาน') >= 0, JSON.stringify(m1));
  chk('⋮ มี "แก้ไข"', m1.indexOf('แก้ไข') >= 0, JSON.stringify(m1));
  chk('⋮ กะเปิดอยู่ → แสดง "ปิดใช้งาน" อย่างเดียว',
    m1.indexOf('ปิดใช้งาน') >= 0 && m1.indexOf('เปิดใช้งาน') < 0, JSON.stringify(m1));
  chk('⋮ ยังมีคำสั่งเดิม คัดลอกกะ / ลบกะ',
    m1.indexOf('คัดลอกกะ') >= 0 && m1.indexOf('ลบกะ') >= 0, JSON.stringify(m1));

  /* เมนูไม่ล้นจอ (Desktop) */
  const fitD = await pg.evaluate(() => {
    const r = document.querySelector('.sh-pop').getBoundingClientRect();
    return { l: r.left, t: r.top, rr: r.right, bb: r.bottom,
      vw: document.documentElement.clientWidth, vh: document.documentElement.clientHeight };
  });
  chk('Desktop: เมนูไม่ล้น Viewport',
    fitD.l >= 0 && fitD.t >= 0 && fitD.rr <= fitD.vw && fitD.bb <= fitD.vh, JSON.stringify(fitD));

  /* เมนู ⋮ — กะปิดใช้งาน */
  await pg.click('body', { position: { x: 5, y: 5 } });
  await pg.click('.sh-card [data-more="sh-4"]');
  await pg.waitForSelector('.sh-pop', { timeout: 5000 });
  const m4 = await pg.evaluate(() => [].map.call(document.querySelectorAll('.sh-pop .us-menu-item'), x => {
    const c = x.cloneNode(true), ic = c.querySelector('.us-menu-ic'); if (ic) ic.remove();
    return c.textContent.trim();
  }));
  chk('⋮ กะปิดอยู่ → แสดง "เปิดใช้งาน" อย่างเดียว',
    m4.indexOf('เปิดใช้งาน') >= 0 && m4.indexOf('ปิดใช้งาน') < 0, JSON.stringify(m4));

  /* รายชื่อพนักงาน — เปิดเฉพาะกะที่กด และจำนวนตรงกับการ์ด */
  await pg.click('body', { position: { x: 5, y: 5 } });
  empListCalls = [];
  await pg.click('.sh-card [data-more="sh-1"]');
  await pg.click('.sh-pop [data-emp="sh-1"]');
  await pg.waitForSelector('#modal-root .list-row', { timeout: 8000 });
  const modal = await pg.evaluate(() => {
    const body = document.querySelector('#modal-root .modal-body');
    const head = document.querySelector('#modal-root .modal-head h3').textContent;
    const m = /·\s*(\d+)\s*คน/.exec(body.querySelector('.confirm-msg').textContent);
    return { head: head, rows: body.querySelectorAll('.list-row').length, stated: m ? Number(m[1]) : null };
  });
  chk('รายชื่อพนักงานเปิดของกะที่กดเท่านั้น (OFFICE)', /OFFICE/.test(modal.head), modal.head);
  chk('เรียก njhr_shift_employee_list เฉพาะกะที่กด',
    empListCalls.length === 1 && empListCalls[0] === 'sh-1', JSON.stringify(empListCalls));
  chk('จำนวนบนการ์ด (105) ตรงกับรายชื่อจริง',
    modal.rows === 105 && modal.stated === 105, 'rows ' + modal.rows + ' · stated ' + modal.stated);

  /* Search / Filter / Sort เดิมยังทำงาน และผลลัพธ์ยังเป็นแนวตั้ง */
  await pg.click('#modal-x');
  await pg.fill('#sh-q', 'ดึก');
  const qN = await pg.$$eval('.sh-card', n => n.length);
  chk('Search เดิมทำงาน (ค้น "ดึก" เหลือ 1 กะ)', qN === 1, 'พบ ' + qN);
  await pg.fill('#sh-q', '');
  await pg.click('#sh-seg [data-shst="false"]');
  const fN = await pg.$$eval('.sh-card', n => n.length);
  chk('Filter เดิมทำงาน (ปิดใช้งาน = 1 กะ)', fN === 1, 'พบ ' + fN);
  await pg.click('#sh-seg [data-shst=""]');
  await pg.selectOption('#sh-sort', 'NAME');
  const sorted = await pg.$$eval('.sh-card .sh-r-name', n => n.map(x => x.textContent));
  const sortGeo = await pg.evaluate(() => [].map.call(document.querySelectorAll('.sh-card'),
    c => Math.round(c.getBoundingClientRect().left)));
  chk('Sort เดิมทำงาน (เรียงตามชื่อกะ)',
    JSON.stringify(sorted) === JSON.stringify(sorted.slice().sort((a, b) => a.localeCompare(b, 'th'))),
    JSON.stringify(sorted));
  chk('หลัง Sort ยังเป็น 1 กะ/แถว', sortGeo.every(l => l === sortGeo[0]), JSON.stringify(sortGeo));
  await pg.selectOption('#sh-sort', 'RECENT');

  /* ไม่มี Horizontal Scroll */
  const hsD = await pg.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  chk('Desktop: ไม่มี Horizontal Scroll', hsD <= 0, 'เกิน ' + hsD + 'px');

  /* ---------- MOBILE ---------- */
  const ctxM = await b.newContext({ viewport: { width: 390, height: 780 }, isMobile: true,
    hasTouch: true, serviceWorkers: 'block' });
  const pgm = await openShifts(ctxM);
  const geoM = await pgm.evaluate(() => [].map.call(document.querySelectorAll('.sh-card'), c => {
    const r = c.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width) };
  }));
  chk('Mobile: 1 กะ = 1 การ์ด เรียงลงแนวตั้ง',
    geoM.every((c, i) => c.l === geoM[0].l && (i === 0 || c.t > geoM[i - 1].t)), JSON.stringify(geoM));
  const mBtn = await pgm.evaluate(() => {
    const r = document.querySelector('.sh-card [data-more]').getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  chk('Mobile: Touch target ปุ่ม ⋮ ≥ 44px', mBtn.w >= 44 && mBtn.h >= 44, JSON.stringify(mBtn));
  const hsM = await pgm.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  chk('Mobile: ไม่มี Horizontal Scroll', hsM <= 0, 'เกิน ' + hsM + 'px');

  /* เมนูมือถือ: ต้องไม่ล้นขอบขวา/ล่าง */
  await pgm.click('.sh-card [data-more="sh-1"]');
  await pgm.waitForSelector('.sh-pop', { timeout: 5000 });
  const fitM = await pgm.evaluate(() => {
    const r = document.querySelector('.sh-pop').getBoundingClientRect();
    return { l: Math.round(r.left), t: Math.round(r.top), rr: Math.round(r.right), bb: Math.round(r.bottom),
      vw: document.documentElement.clientWidth, vh: document.documentElement.clientHeight };
  });
  chk('Mobile: เมนูไม่ล้น Viewport (ซ้าย/ขวา/ล่าง)',
    fitM.l >= 0 && fitM.t >= 0 && fitM.rr <= fitM.vw && fitM.bb <= fitM.vh, JSON.stringify(fitM));

  /* กะสุดท้าย (ใกล้ขอบล่าง) — ต้องพลิกขึ้นไม่ล้นจอ */
  await pgm.click('body', { position: { x: 5, y: 5 } });
  await pgm.evaluate(() => {
    const c = document.querySelectorAll('.sh-card')[3];
    c.scrollIntoView({ block: 'end' });
  });
  await pgm.click('.sh-card [data-more="sh-4"]');
  await pgm.waitForSelector('.sh-pop', { timeout: 5000 });
  const fitM2 = await pgm.evaluate(() => {
    const r = document.querySelector('.sh-pop').getBoundingClientRect();
    return { l: Math.round(r.left), t: Math.round(r.top), rr: Math.round(r.right), bb: Math.round(r.bottom),
      vw: document.documentElement.clientWidth, vh: document.documentElement.clientHeight };
  });
  chk('Mobile: เมนูของกะล่างสุดไม่ถูกตัด',
    fitM2.l >= 0 && fitM2.t >= 0 && fitM2.rr <= fitM2.vw && fitM2.bb <= fitM2.vh, JSON.stringify(fitM2));

  const appErr = errs.filter(e => !/Failed to load resource/.test(e));
  chk('ไม่มี JavaScript Error', appErr.length === 0, appErr.slice(0, 3).join(' | '));
  chk('ไม่มี Request ล้มเหลวของไฟล์แอป',
    net.filter(u => u.indexOf('localhost:') >= 0).length === 0, net.slice(0, 3).join(' | '));
  if (net.length) console.log('  หมายเหตุ Request ภายนอกที่ถูกบล็อกใน Sandbox: ' + net.slice(0, 3).join(' | '));

  await b.close(); srv.close();
  console.log('\nPASS ' + PASS + ' · FAIL ' + FAIL);
  process.exit(FAIL ? 1 : 0);
})();
