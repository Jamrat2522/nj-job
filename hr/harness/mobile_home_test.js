/* mobile_home_test.js — หน้าหลักมือถือของพนักงาน (USER) ตามภาพอ้างอิง
   ใช้: node harness/mobile_home_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require(__dirname + '/fixtures.js');
let PASS = 0, FAIL = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8691);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(58) + (e || '')); }

const EMP = 'emp-1';
const TODAY = new Date().toISOString().slice(0, 10);
const M = TODAY.slice(0, 8);
const ATT = [];
for (let i = 1; i <= 7; i++) ATT.push({ work_date: M + String(i).padStart(2, '0'), employee_id: EMP,
  emp_code: '0004', check_in: M + String(i).padStart(2, '0') + 'T08:20:00', late_min: 0 });
ATT.push({ work_date: M + '08', employee_id: EMP, emp_code: '0004',
  check_in: M + '08T09:15:00', late_min: 22 });
const LEAVES = [
  { req_id: 'L1', employee_id: EMP, emp_code: '0004', leave_type: 'ลาป่วย', status: 'APPROVED',
    start_date: M + '05', end_date: M + '05', total_days: 1 },
  { req_id: 'L2', employee_id: EMP, emp_code: '0004', leave_type: 'ลาป่วย', status: 'PENDING',
    start_date: M + '10', end_date: M + '10', total_days: 1 },
  { req_id: 'L3', employee_id: EMP, emp_code: '0004', leave_type: 'ลากิจ', status: 'REJECTED',
    start_date: M + '11', end_date: M + '11', total_days: 1 }];
const OTS = [
  { id: 'O1', employee_id: EMP, emp_code: '0004', ot_date: M + '06', hours: 4, status: 'APPROVED' },
  { id: 'O2', employee_id: EMP, emp_code: '0004', ot_date: M + '09', hours: 2, status: 'PENDING' }];
const CORR = [{ id: 'C1', employee_id: EMP, emp_code: '0004', work_date: M + '07',
  new_check_in: M + '07T08:35:00', status: 'PENDING' }];
const ANN = [{ id: 'A1', title: 'วันหยุดบริษัท 12 สิงหาคม 2569', content: '', priority: 'NORMAL',
  is_important: false, is_read: false, unread_count: 1, total_count: 1 }];

function serve(root, port) {
  const T = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png' };
  return new Promise(r => { const s = http.createServer((rq, rs) => {
    let p = decodeURIComponent(rq.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); }
    rs.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    rs.end(fs.readFileSync(f));
  }).listen(port, () => r(s)); });
}
(async function () {
  const srv = await serve(ROOT, PORT);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const errs = [], calls = [];
  async function open(w, h) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: true,
      hasTouch: true, serviceWorkers: 'block' });
    await ctx.route('**/rest/v1/rpc/*', route => {
      const fn = route.request().url().split('/rpc/')[1].split('?')[0];
      let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      calls.push(fn);
      let out;
      if (fn === 'njhr_session_check' || fn === 'njhr_login') {
        // บังคับ role USER เพื่อทดสอบหน้าหลักของพนักงาน (fixture ปกติเป็น SUPER_ADMIN)
        const base = F.respond(fn, bd);
        const one = Array.isArray(base) ? base[0] : base;
        out = Object.assign({}, one, { role: 'USER', employee_id: EMP, emp_code: '0004',
          emp_name: 'นายจำลอง ผาเทพ', department_name: 'MANAGER' });
      }
      else if (fn === 'njhr_att_today') out = [];
      else if (fn === 'njhr_att_report') out = ATT;
      else if (fn === 'njhr_leave_report') out = LEAVES;
      else if (fn === 'njhr_ot_list') out = OTS;
      else if (fn === 'njhr_att_correction_list') out = CORR;
      else if (fn === 'njhr_ann_feed') out = ANN;
      else out = F.respond(fn, bd);
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(out) });
    });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push(String(e)));
    pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await pg.addInitScript(() => {
      try {
        localStorage.setItem('njhr_token', 'MOCK-TOKEN-FIXED');
      } catch (e) {}
    });
    await pg.goto('http://localhost:' + PORT + '/#/dashboard', { waitUntil: 'networkidle' });
    return pg;
  }
  const pg = await open(390, 844);
  const has = await pg.$('#mh-root');
  chk('หน้าหลักมือถือ (.mh) ถูก render', has !== null);
  if (!has) { console.log('\nPASS ' + PASS + ' · FAIL ' + (FAIL + 1)); await b.close(); srv.close(); process.exit(1); }

  await pg.waitForFunction(() => {
    const b2 = document.querySelector('#mh-stats .mh-st b');
    return b2 && b2.textContent.trim() !== '—';
  }, { timeout: 15000 });

  chk('การ์ดพนักงานมี รูป · ชื่อ · รหัส · แผนก · คำทักทาย', await pg.evaluate(() => {
    const s = document.querySelector('.mh-emp');
    return !!s && !!s.querySelector('.avatar') && !!s.querySelector('b') &&
      /รหัสพนักงาน/.test(s.textContent) && /แผนก/.test(s.textContent) && /สวัสดี/.test(s.textContent);
  }));
  const stats = await pg.$$eval('.mh-st', ns => ns.map(x =>
    x.querySelector('small').textContent + '=' + x.querySelector('b').textContent.trim()));
  chk('รายงานของฉัน 4 ช่อง ตามลำดับภาพ',
    stats.length === 4 && /^มาทำงาน=/.test(stats[0]) && /^มาสาย=/.test(stats[1]) &&
    /^ลางาน=/.test(stats[2]) && /^OT=/.test(stats[3]), JSON.stringify(stats));
  chk('มาทำงาน 8 วัน (นับจาก check_in จริง)', /^มาทำงาน=8/.test(stats[0]), stats[0]);
  chk('มาสาย 1 ครั้ง (late_min > 0)', /^มาสาย=1/.test(stats[1]), stats[1]);
  chk('ลางาน 1 วัน (นับเฉพาะ APPROVED ไม่นับ PENDING/REJECTED)', /^ลางาน=1/.test(stats[2]), stats[2]);
  chk('OT 4 ชม. (นับเฉพาะ APPROVED)', /^OT=4/.test(stats[3]), stats[3]);

  chk('สถานะวันนี้: เวลาเด่น + วันที่ + สถานะ', await pg.evaluate(() => {
    const t = document.querySelector('.mh-today');
    return !!t && /^\d{2}:\d{2}$/.test(t.querySelector('.mh-clock').textContent) &&
      !!t.querySelector('.mh-date').textContent.trim() &&
      /ยังไม่ได้ลงเวลา/.test(t.querySelector('#mh-st').textContent);
  }));
  const pend = await pg.$$eval('.mh-pd', ns => ns.map(x => x.textContent.replace(/\s+/g, ' ')));
  chk('รายการรออนุมัติ 3 รายการ (ลา + OT + ลงชื่อย้อนหลัง)', pend.length === 3, JSON.stringify(pend));
  chk('ทุกรายการเป็น "รออนุมัติ" เท่านั้น',
    pend.every(t => /รออนุมัติ/.test(t)) &&
    !pend.some(t => /อนุมัติแล้ว|ไม่อนุมัติ/.test(t)), JSON.stringify(pend));
  chk('มีปุ่ม "ดูทั้งหมด" ไปหน้าคำขอ',
    (await pg.$eval('.mh-more', n => n.getAttribute('href'))) === '#/requests');
  chk('ประกาศล่าสุดจากข้อมูลจริง',
    /วันหยุดบริษัท 12 สิงหาคม 2569/.test(await pg.textContent('#mh-ann')));

  chk('หน้าหลักไม่มีปุ่มเข้างาน/ออกงาน/ขอลา/ขอ OT/ลงชื่อย้อนหลัง', await pg.evaluate(() => {
    const vis = [].slice.call(document.querySelectorAll('#main-view button, #main-view a'))
      .filter(x => x.offsetParent !== null)
      .map(x => x.textContent.replace(/\s+/g, ''));
    return !vis.some(t => /^เข้างาน$|^ออกงาน$|^ขอลางาน$|^ขอOT$|^ลงชื่อย้อนหลัง$/.test(t));
  }));
  chk('เมนูล่าง 4 ปุ่ม และ "หน้าหลัก" เป็นสีแดง (active)', await pg.evaluate(() => {
    const it = document.querySelectorAll('#bottom-nav .bn-item');
    return it.length === 4 && it[0].classList.contains('active') &&
      ['หน้าหลัก', 'ลงเวลา', 'คำขอ', 'โปรไฟล์'].every((t, i) => it[i].textContent.trim() === t);
  }));
  const rpc = {};
  calls.forEach(c => { rpc[c] = (rpc[c] || 0) + 1; });
  chk('ไม่ยิง RPC ซ้ำซ้อน (แต่ละตัวไม่เกิน 2 ครั้ง)',
    Object.keys(rpc).every(k => rpc[k] <= 2), JSON.stringify(rpc));
  await pg.close();

  for (const [w, h] of [[360, 740], [375, 812], [390, 844], [430, 932], [768, 1024]]) {
    const m = await open(w, h);
    await m.waitForSelector('#mh-root', { timeout: 15000 });
    await m.waitForTimeout(900);
    const g = await m.evaluate(() => {
      const nav = document.getElementById('bottom-nav').getBoundingClientRect();
      const last = document.querySelector('#mh-ann').getBoundingClientRect();
      const small = [].slice.call(document.querySelectorAll('#bottom-nav .bn-item, .mh-pd, .mh-ann'))
        .filter(x => x.getBoundingClientRect().height < 44).length;
      const over = [].slice.call(document.querySelectorAll('.mh *'))
        .filter(x => x.getBoundingClientRect().right > document.documentElement.clientWidth + 1).length;
      return { hs: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        small: small, over: over, navTop: Math.round(nav.top), lastBottom: Math.round(last.bottom),
        scrollable: document.documentElement.scrollHeight > window.innerHeight };
    });
    chk('Mobile ' + w + '×' + h + ': ไม่มี Horizontal Scroll · ไม่ล้น · Touch ≥ 44px',
      g.hs <= 0 && g.small === 0 && g.over === 0, JSON.stringify(g));
    await m.close();
  }
  chk('ไม่มี JavaScript Error / Unhandled Rejection', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close(); srv.close();
  console.log('\nPASS ' + PASS + ' · FAIL ' + FAIL);
  process.exit(FAIL ? 1 : 0);
})();
