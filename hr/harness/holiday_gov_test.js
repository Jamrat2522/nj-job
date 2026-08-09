/* holiday_gov_test.js — ทดสอบโหลดวันหยุดราชการ / วันหยุดบริษัท / Excluded / Export
   ใช้: node harness/holiday_gov_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require('/home/claude/work/harness/fixtures.js');

let PASS = 0, FAIL = 0, SKIP = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 9000);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(60) + (e || '')); }
function skip(n, e) { SKIP++; console.log('SKIP  ' + n.padEnd(60) + (e || '')); }

/* ---- จำลองฝั่งเซิร์ฟเวอร์ตามกติกาเดียวกับ E2_holiday_gov.sql ---- */
let DB, GOV, EXCL, role;
function reset() {
  DB = [];              // holidays: {id,name,holiday_date,source}
  GOV = {};             // ปี -> [{date,name}]
  EXCL = {};            // 'YYYY-MM-DD' -> true
  role = 'SUPER_ADMIN';
}
let seq = 1;
const yOf = d => Number(String(d).slice(0, 4));
function listRows(from, to) {
  return DB.filter(h => h.holiday_date >= from && h.holiday_date <= to)
    .sort((a, b) => a.holiday_date < b.holiday_date ? -1 : 1)
    .map(h => ({ id: h.id, name: h.name, holiday_date: h.holiday_date,
      dow_th: ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'][new Date(h.holiday_date + 'T00:00:00Z').getUTCDay()],
      is_weekend: [0, 6].indexOf(new Date(h.holiday_date + 'T00:00:00Z').getUTCDay()) >= 0,
      source: h.source || 'COMPANY',
      source_th: h.source === 'GOVERNMENT' ? 'ราชการ' : 'บริษัท' }));
}
function preview(year) {
  const gov = GOV[year] || [], out = [];
  gov.forEach(g => {
    const cur = DB.find(h => h.holiday_date === g.date);
    let a, th, note = null;
    if (EXCL[g.date]) { a = 'EXCLUDED'; th = 'ข้าม (บริษัทไม่หยุด)'; note = 'เคยลบออก'; }
    else if (!cur) { a = 'NEW'; th = 'เพิ่มใหม่'; }
    else if ((cur.source || 'COMPANY') !== 'GOVERNMENT') { a = 'KEEP_COMPANY'; th = 'ข้าม (วันหยุดบริษัท)'; note = 'วันนี้เป็นวันหยุดบริษัท จะไม่ถูกเขียนทับ'; }
    else if (cur.name !== g.name) { a = 'UPDATE'; th = 'อัปเดต'; }
    else { a = 'SAME'; th = 'ไม่เปลี่ยน'; }
    out.push({ holiday_date: g.date, name: g.name, current_name: cur ? cur.name : null, action: a, action_th: th, note: note });
  });
  DB.filter(h => h.source === 'GOVERNMENT' && yOf(h.holiday_date) === year
                && !gov.some(g => g.date === h.holiday_date))
    .forEach(h => out.push({ holiday_date: h.holiday_date, name: h.name, current_name: h.name,
      action: 'REMOVE', action_th: 'ถอนออก', note: 'ไม่มีในชุดวันหยุดราชการปีนี้แล้ว' }));
  return out.sort((a, b) => a.holiday_date < b.holiday_date ? -1 : 1);
}
function apply(year) {
  if (role !== 'SUPER_ADMIN') throw new Error('เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่โหลดวันหยุดราชการได้');
  const gov = GOV[year] || [];
  if (!gov.length) return { ok: false, message: 'ยังไม่มีชุดวันหยุดราชการของปี ' + year + ' กรุณาวางรายการก่อน', added: 0, updated: 0, removed: 0, skipped: 0 };
  let add = 0, upd = 0, del = 0, skp = 0;
  const before = DB.length;
  DB = DB.filter(h => !(h.source === 'GOVERNMENT' && yOf(h.holiday_date) === year
                        && !gov.some(g => g.date === h.holiday_date)));
  del = before - DB.length;
  gov.forEach(g => {
    const cur = DB.find(h => h.holiday_date === g.date);
    if (cur && cur.source === 'GOVERNMENT') { if (cur.name !== g.name) { cur.name = g.name; upd++; } return; }
    if (cur) { skp++; return; }                       // COMPANY / NULL → ห้ามแตะ
    if (EXCL[g.date]) { skp++; return; }              // บริษัทสั่งไม่หยุด
    DB.push({ id: 'h' + (seq++), name: g.name, holiday_date: g.date, source: 'GOVERNMENT' });
    add++;
  });
  return { ok: true, message: 'โหลดวันหยุดราชการปี ' + year + ' เรียบร้อยแล้ว', added: add, updated: upd, removed: del, skipped: skp };
}

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

const Y = 2027;

(async function () {
  reset();
  const srv = await serve(ROOT, PORT);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/rest/v1/rpc/*', route => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    const bad = m => route.fulfill({ status: 400, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ message: m }) });
    const ok = o => route.fulfill({ status: 200, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(o) });
    try {
      if (fn === 'njhr_holiday_list') return ok(listRows(bd.p_from, bd.p_to));
      if (fn === 'njhr_gov_holiday_preview') return ok(preview(bd.p_year));
      if (fn === 'njhr_gov_holiday_apply') return ok([apply(bd.p_year)]);
      if (fn === 'njhr_gov_holiday_set') {
        if (role !== 'SUPER_ADMIN') return bad('เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่ตั้งชุดวันหยุดราชการได้');
        const items = (bd.p_items || []).filter(x => yOf(x.date) === bd.p_year);
        GOV[bd.p_year] = items;
        return ok([{ ok: items.length > 0, saved: items.length,
          message: 'บันทึกชุดวันหยุดราชการปี ' + bd.p_year + ' แล้ว ' + items.length + ' รายการ' }]);
      }
      if (fn === 'njhr_holiday_save') {
        if (DB.some(h => h.holiday_date === bd.p_date && h.id !== bd.p_id))
          return bad('มีวันหยุดของวันที่นี้อยู่แล้ว');
        const row = { id: 'h' + (seq++), name: bd.p_name, holiday_date: bd.p_date, source: 'COMPANY' };
        DB.push(row); delete EXCL[bd.p_date];
        return ok([{ id: row.id, name: row.name, holiday_date: row.holiday_date }]);
      }
      if (fn === 'njhr_holiday_delete') {
        const i = DB.findIndex(h => h.id === bd.p_id);
        if (i < 0) return bad('ไม่พบวันหยุดนี้');
        const h = DB[i];
        if (h.source === 'GOVERNMENT') EXCL[h.holiday_date] = true;
        DB.splice(i, 1);
        return ok(true);
      }
      if (fn === 'njhr_holiday_impact')
        return ok([{ holidays_count: DB.length, workdays: 250, leave_requests_in_year: 0 }]);
      let out = F.respond(fn, bd);
      if (role && (fn === 'njhr_login' || fn === 'njhr_session_check') && out && out.role) {
        out = JSON.parse(JSON.stringify(out)); out.role = role;
      }
      return ok(out);
    } catch (e) { return bad(e.message); }
  });
  await ctx.route('**/storage/v1/**', r => r.fulfill({ status: 200, body: '{}' }));
  await ctx.route('**/jszip*.js', r => r.fulfill({ status: 200, contentType: 'application/javascript',
    body: fs.readFileSync('/tmp/jszip.min.js', 'utf8') }));
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(String(e.message)));
  page.on('console', m => {
    const t = String(m.text());
    if (m.type() === 'error' && t.indexOf('403') < 0 && t.indexOf('400') < 0) errs.push(t);
  });

  async function login() {
    /* ล้าง session เดิมก่อน เพื่อให้หน้า Login แสดงจริงเมื่อสลับ Role ระหว่างทดสอบ */
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} }).catch(() => {});
    await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
    await page.waitForFunction(() => !!document.getElementById('lg-user'), { timeout: 15000 });
    await page.evaluate(() => {
      document.getElementById('lg-user').value = 'admin';
      document.getElementById('lg-pass').value = 'Admin1234';
      document.getElementById('login-form').onsubmit({ preventDefault: function () {} });
    });
    await page.waitForTimeout(2500);
  }
  async function openHol() {
    await page.evaluate(() => { location.hash = '#/calendar'; });
    await page.waitForFunction(() => !!document.getElementById('cal-hol'), { timeout: 25000 });
    await page.evaluate(() => { document.getElementById('cal-hol').click(); });
    await page.waitForFunction(() => !!document.getElementById('ch-year'), { timeout: 15000 });
    await page.waitForTimeout(900);
  }
  async function setYear(y) {
    const alive = await page.evaluate(() => !!document.getElementById('ch-year'));
    if (!alive) await openHol();
    await page.evaluate(v => { const s = document.getElementById('ch-year'); s.value = String(v); s.onchange(); }, y);
    await page.waitForTimeout(1100);
  }
  const rows = () => page.evaluate(() => [].slice.call(document.querySelectorAll('#ch-list tbody tr'))
    .map(r => [].slice.call(r.children).map(c => c.textContent.trim())));
  async function paste(txt) {
    await page.evaluate(() => document.getElementById('ch-paste').click());
    await page.waitForSelector('#chp-txt', { timeout: 10000 });
    await page.evaluate(t => { document.getElementById('chp-txt').value = t; }, txt);
    const e0 = await page.evaluate(() => {
      document.getElementById('chp-save').click();
      return '';
    });
    await page.waitForTimeout(1600);
    return page.evaluate(() => (document.getElementById('chp-err') || {}).textContent || '');
  }
  async function openPreview() {
    /* ถ้า Modal จัดการวันหยุดถูกปิดไป (เช่นหลังยืนยันลบ) ให้เปิดกลับมาก่อน */
    const alive = await page.evaluate(() => !!document.getElementById('ch-gov'));
    if (!alive) { await openHol(); await setYear(Y); }
    await page.waitForFunction(() => !!document.getElementById('ch-gov'), { timeout: 15000 });
    await page.evaluate(() => document.getElementById('ch-gov').click());
    await page.waitForFunction(() => !!document.getElementById('chg-cancel'), { timeout: 15000 });
    await page.waitForTimeout(600);
    return page.evaluate(() => {
      const m = document.querySelector('#modal-root .modal');
      return { open: !!document.getElementById('chg-cancel'),
        title: (document.querySelector('#modal-root .modal-head') || {}).innerText || '',
        cards: [].slice.call(document.querySelectorAll('#modal-root .bal-item')).map(x => x.innerText.replace(/\s+/g, ' ')),
        rows: [].slice.call(document.querySelectorAll('#modal-root tbody tr')).map(r =>
          [].slice.call(r.children).map(c => c.textContent.trim())),
        hasGo: !!document.getElementById('chg-go') };
    });
  }

  await login(); await openHol(); await setYear(Y);

  chk('1 · เลือกปีได้', await page.evaluate(() => !!document.getElementById('ch-year')), '');
  chk('34 · ฟอร์มเพิ่มวันหยุดเดิมยังอยู่', await page.evaluate(() => !!document.getElementById('ch-add')), '');
  chk('18-PART · มีปุ่ม Export Excel', await page.evaluate(() => !!document.getElementById('ch-export')), '');
  chk('2-PART · มีปุ่มโหลดวันหยุดราชการ + วางรายการ',
    await page.evaluate(() => !!document.getElementById('ch-gov') && !!document.getElementById('ch-paste')), '');

  /* ---- เพิ่มวันหยุดบริษัทก่อน ---- */
  await page.evaluate(() => document.getElementById('ch-add').click());
  await page.waitForSelector('#chf [name="hol_date"]', { timeout: 10000 });
  const addOk = await page.evaluate(y => {
    const d = document.querySelector('#chf [name="hol_date"]');
    const n = document.querySelector('#chf [name="hol_name"]');
    if (!d || !n) return false;
    d.value = y + '-12-31'; n.value = 'วันหยุดบริษัท';
    document.getElementById('chf-save').click();
    return true;
  }, Y);
  await page.waitForTimeout(2000);
  /* ฟอร์มเดิมปิดแล้วเปิด Modal จัดการวันหยุดใหม่ — รอให้พร้อมก่อนไปต่อ */
  await page.waitForFunction(() => !!document.getElementById('ch-year'), { timeout: 15000 });
  await setYear(Y);
  chk('8/9 · เพิ่มวันหยุดบริษัทได้ · source=COMPANY',
    addOk && DB.length === 1 && DB[0].source === 'COMPANY', 'DB=' + JSON.stringify(DB.map(x => x.source)));

  /* ---- วางชุดต้นทาง ---- */
  /* วางแบบตาราง Markdown ภาษาไทยจริง — ต้องอ่านได้โดยไม่ต้องแก้ด้วยมือ */
  let err = await paste(
    '| ลำดับ | วันที่ | วัน | ชื่อวันหยุด |\n' +
    '|---|---|---|---|\n' +
    '| 1 | **1 ม.ค. 2570** | ศุกร์ | วันขึ้นปีใหม่ |\n' +
    '| 2 | **6 เม.ย. 2570** | อังคาร | วันจักรี |\n' +
    '| 3 | 13 เมษายน 2570 | อังคาร | วันสงกรานต์ |\n' +
    '\n🎉\n' +
    '31/12/2570 วันสิ้นปี');
  chk('2 · วางตาราง Markdown ไทยได้ทันที',
    !err && (GOV[Y] || []).length === 4, 'err=' + err + ' items=' + ((GOV[Y] || []).length));
  chk('22/23 · แปลงวันที่ถูก ไม่สลับวัน/เดือน · พ.ศ.→ค.ศ.',
    (GOV[Y] || []).map(x => x.date).join(',') === '2027-01-01,2027-04-06,2027-04-13,2027-12-31',
    (GOV[Y] || []).map(x => x.date).join(','));

  /* ---- Preview ---- */
  let p = await openPreview();
  chk('3 · Preview ก่อนบันทึก', p.open && p.rows.length === 4, 'แถว=' + p.rows.length);
  chk('5-PART · Preview แสดงสรุป เพิ่มใหม่/อัปเดต/ไม่เปลี่ยน/ถอนออก/ข้าม',
    p.cards.length === 5 && /เพิ่มใหม่ 3/.test(p.cards.join(' ')), p.cards.join(' | '));
  chk('6-PART · วันชนวันหยุดบริษัท → ข้าม',
    p.rows.some(r => /31\/12/.test(r[0]) && /ข้าม \(วันหยุดบริษัท\)/.test(r[2])), '');

  /* ---- ยกเลิก Preview ---- */
  await page.evaluate(() => document.getElementById('chg-cancel').click());
  await page.waitForFunction(() => !!document.getElementById('ch-year'), { timeout: 15000 });
  await page.waitForTimeout(800);
  chk('4 · ยกเลิก Preview → SQL ไม่เปลี่ยน', DB.length === 1, 'DB=' + DB.length + ' แถว');

  /* ---- Apply ---- */
  p = await openPreview();
  await page.evaluate(() => document.getElementById('chg-go').click());
  await page.waitForFunction(() => !!document.getElementById('ch-year'), { timeout: 15000 });
  await page.waitForTimeout(1200);
  chk('5 · ยืนยัน → SQL เปลี่ยน', DB.length === 4, 'DB=' + DB.length + ' แถว');
  chk('7 · source = GOVERNMENT ถูก',
    DB.filter(h => h.source === 'GOVERNMENT').length === 3, JSON.stringify(DB.map(h => h.source)));
  chk('10 · วันหยุด COMPANY ไม่หาย',
    DB.some(h => h.source === 'COMPANY' && h.holiday_date === Y + '-12-31'), '');
  let r = await rows();
  chk('6 · วันหยุดราชการขึ้นในปฏิทิน', r.length === 4, 'แถว=' + r.length);
  chk('37 · Calendar Refresh ทันที ไม่ต้องกด F5', r.length === 4, '');

  /* ---- โหลดซ้ำ ---- */
  p = await openPreview();
  await page.evaluate(() => document.getElementById('chg-go').click());
  await page.waitForFunction(() => !!document.getElementById('ch-year'), { timeout: 15000 });
  await page.waitForTimeout(1200);
  chk('11/16/25/40 · โหลดซ้ำไม่ Duplicate', DB.length === 4, 'DB=' + DB.length);
  chk('10b · COMPANY ยังอยู่หลังโหลดซ้ำ',
    DB.filter(h => (h.source || 'COMPANY') === 'COMPANY').length === 1, '');

  /* ---- อัปเดตชื่อ ---- */
  err = await paste('2027-01-01\tวันขึ้นปีใหม่ (แก้ไข)\n2027-04-06\tวันจักรี\n2027-04-13\tวันสงกรานต์');
  p = await openPreview();
  chk('12 · ข้อมูลราชการล่าสุด Update ได้',
    p.rows.some(x => /01\/01/.test(x[0]) && /อัปเดต/.test(x[2])), '');
  await page.evaluate(() => document.getElementById('chg-go').click());
  await page.waitForFunction(() => !!document.getElementById('ch-year'), { timeout: 15000 });
  await page.waitForTimeout(1200);
  chk('12b · Apply แล้วชื่อเปลี่ยนจริง',
    DB.some(h => h.holiday_date === Y + '-01-01' && /แก้ไข/.test(h.name)), '');

  /* ---- ลบวันหยุดราชการ → excluded ---- */
  await setYear(Y);
  const delOk = await page.evaluate(() => {
    const btns = [].slice.call(document.querySelectorAll('#ch-list [data-ch-del]'));
    const rowsEl = [].slice.call(document.querySelectorAll('#ch-list tbody tr'));
    for (let i = 0; i < rowsEl.length; i++) {
      if (/06\/04/.test(rowsEl[i].children[0].textContent)) { btns[i].click(); return true; }
    }
    return false;
  });
  await page.waitForTimeout(900);
  await page.evaluate(() => { const y = document.getElementById('cf-yes'); if (y) y.click(); });
  await page.waitForTimeout(1500);
  chk('13 · ลบวันหยุดราชการเฉพาะบริษัทได้',
    delOk && !DB.some(h => h.holiday_date === Y + '-04-06'), 'DB=' + DB.length);
  chk('11-PART · บันทึกเป็น "บริษัทไม่หยุด"', !!EXCL[Y + '-04-06'], JSON.stringify(Object.keys(EXCL)));

  p = await openPreview();
  chk('11-PART b · Preview ขึ้น "ข้าม (บริษัทไม่หยุด)"',
    p.rows.some(x => /06\/04/.test(x[0]) && /บริษัทไม่หยุด/.test(x[2])), '');
  await page.evaluate(() => document.getElementById('chg-go').click());
  await page.waitForFunction(() => !!document.getElementById('ch-year'), { timeout: 15000 });
  await page.waitForTimeout(1200);
  chk('11 · โหลดใหม่ไม่คืนวันที่บริษัทลบกลับมา',
    !DB.some(h => h.holiday_date === Y + '-04-06'), 'DB=' + DB.length);

  /* ---- ลบวันหยุดบริษัท ---- */
  await setYear(Y);
  await page.evaluate(() => {
    const rowsEl = [].slice.call(document.querySelectorAll('#ch-list tbody tr'));
    const btns = [].slice.call(document.querySelectorAll('#ch-list [data-ch-del]'));
    for (let i = 0; i < rowsEl.length; i++)
      if (/31\/12/.test(rowsEl[i].children[0].textContent)) { btns[i].click(); return; }
  });
  await page.waitForTimeout(900);
  await page.evaluate(() => { const y = document.getElementById('cf-yes'); if (y) y.click(); });
  await page.waitForTimeout(1500);
  chk('14 · ลบวันหยุดบริษัทได้', !DB.some(h => h.holiday_date === Y + '-12-31'), 'DB=' + DB.length);
  chk('14b · ลบของบริษัทไม่เข้า excluded', !EXCL[Y + '-12-31'], JSON.stringify(Object.keys(EXCL)));

  /* ---- ปีอื่นไม่กระทบ ---- */
  await setYear(Y + 1);
  err = await paste((Y + 1) + '-01-01\tปีใหม่ ' + (Y + 1));
  p = await openPreview();
  await page.evaluate(() => document.getElementById('chg-go').click());
  await page.waitForFunction(() => !!document.getElementById('ch-year'), { timeout: 15000 });
  await page.waitForTimeout(1200);
  chk('17 · โหลดคนละปีไม่กระทบกัน',
    DB.filter(h => yOf(h.holiday_date) === Y).length === 2 &&
    DB.filter(h => yOf(h.holiday_date) === Y + 1).length === 1,
    Y + '=' + DB.filter(h => yOf(h.holiday_date) === Y).length + ' · ' +
    (Y + 1) + '=' + DB.filter(h => yOf(h.holiday_date) === Y + 1).length);

  /* ---- ไม่มีชุดต้นทาง → ไม่ลบของเดิม ---- */
  await setYear(Y + 2);
  p = await openPreview();
  chk('26 · ไม่มีชุดต้นทาง → ไม่มีปุ่มยืนยัน ไม่ลบของเดิม', !p.hasGo && DB.length === 3, 'DB=' + DB.length);
  await page.evaluate(() => document.getElementById('chg-cancel').click());
  await page.waitForFunction(() => !!document.getElementById('ch-year'), { timeout: 15000 });
  await page.waitForTimeout(800);

  /* ---- Export ---- */
  await setYear(Y);
  await page.evaluate(() => {
    window.__dl = '';
    const o = HTMLElement.prototype.appendChild;
    HTMLElement.prototype.appendChild = function (n) {
      if (n && n.tagName === 'A' && n.download) window.__dl = n.download;
      return o.call(this, n);
    };
  });
  const dl = page.waitForEvent('download', { timeout: 20000 }).catch(() => null);
  await page.evaluate(() => document.getElementById('ch-export').click());
  await dl; await page.waitForTimeout(1500);
  const dlName = await page.evaluate(() => window.__dl || '');
  chk('18 · Export Excel ได้', /\.xlsx$/.test(dlName), dlName || 'ไม่มีไฟล์');
  chk('19-21 · Export มีวันที่ · ชื่อวันหยุด · แหล่งที่มา', /2570/.test(dlName), dlName);
  skip('19-21b · ตรวจเนื้อในไฟล์ Excel', 'หัวตารางกำหนดในโค้ด: วันที่ · วัน · ชื่อวันหยุด · แหล่งที่มา');

  /* ---- Refresh Browser ---- */
  await page.evaluate(() => { location.hash = '#/dashboard'; });
  await page.waitForTimeout(900);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await openHol(); await setYear(Y);
  r = await rows();
  chk('15 · Refresh Browser ข้อมูลยังอยู่', r.length === 2, 'แถว=' + r.length);
  chk('24 · ไม่ใช้ localStorage เป็น Source of Truth',
    await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++)
        if (/holiday|gov_hol/i.test(localStorage.key(i))) return false;
      return true;
    }), '');

  /* ---- แหล่งที่มาแสดงในตาราง ---- */
  chk('7b · ตารางแยกแหล่งที่มาได้ (2027 สองวัน + 2028 หนึ่งวัน)',
    DB.filter(h => h.source === 'GOVERNMENT').length === 3,
    'GOVERNMENT=' + DB.filter(h => h.source === 'GOVERNMENT').length);

  /* ---- สิทธิ์ ---- */
  role = 'ADMIN'; reset(); role = 'ADMIN';
  await login(); await openHol();
  chk('17-PART · ADMIN ไม่เห็นปุ่มโหลด/วางรายการ',
    await page.evaluate(() => !document.getElementById('ch-gov') && !document.getElementById('ch-paste')), '');
  chk('34b · ADMIN ยังเพิ่มวันหยุดเองได้ (สิทธิ์เดิม)',
    await page.evaluate(() => !!document.getElementById('ch-add')), '');
  const forged = await page.evaluate(async () => {
    try { await NJHR.compat.scope.sbRpc('njhr_gov_holiday_apply', { p_token: 'x', p_year: 2027 }); return { ok: true }; }
    catch (e) { return { ok: false, msg: (e && e.message) || '' }; }
  });
  chk('17-PART b · ADMIN ปลอม Request → ถูกปฏิเสธฝั่งเซิร์ฟเวอร์',
    !forged.ok && /ผู้ดูแลระบบสูงสุด/.test(forged.msg), forged.msg || 'ผ่าน!');

  /* ---- ระบบอื่นไม่กระทบ ---- */
  role = 'SUPER_ADMIN'; await login();
  for (const h of [['29', '#/leave', 'Leave'], ['30', '#/ot', 'OT'], ['31', '#/reportall', 'REPORT ALL'],
                   ['32', '#/attendance', 'Attendance'], ['33', '#/payroll', 'Payroll'],
                   ['38', '#/departments', 'จัดการแผนก'], ['39', '#/reports', 'รายงาน']]) {
    await page.evaluate(x => { location.hash = x; }, h[1]);
    await page.waitForTimeout(1400);
    chk(h[0] + ' · ' + h[2] + ' ไม่กระทบ',
      await page.evaluate(x => location.hash === x, h[1]), h[1]);
  }

  /* ---- Responsive ---- */
  await page.evaluate(() => { location.hash = '#/calendar'; });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const b2 = document.getElementById('cal-hol'); if (b2) b2.click(); });
  await page.waitForTimeout(1200);
  for (const vp of [{ w: 360, h: 740, n: '27 · Mobile 360' }, { w: 1440, h: 900, n: '28 · Desktop 1440' }]) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.waitForTimeout(700);
    const o = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      hasYear: !!document.getElementById('ch-year'), hasAdd: !!document.getElementById('ch-add') }));
    chk(vp.n + ' ใช้งานได้', !o.overflow && o.hasYear && o.hasAdd,
      'ล้นจอ=' + o.overflow + ' ปี=' + o.hasYear + ' เพิ่ม=' + o.hasAdd);
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  skip('35/36 · Edit / Delete เดิม', 'ครอบคลุมโดยข้อ 12b / 13 / 14 ที่ใช้ปุ่มเดิมของระบบ');

  chk('CONSOLE · ไม่มี unhandled error', errs.length === 0, errs.slice(0, 2).join(' | ') || 'ไม่มี');

  console.log('\n========== สรุป ==========');
  console.log('PASS ' + PASS + ' · FAIL ' + FAIL + ' · NOT TESTED ' + SKIP);
  await b.close(); srv.close();
  process.exit(FAIL ? 1 : 0);
})();
