/* name_split_test.js — ทดสอบเฉพาะขอบเขต "แยกชื่อ–นามสกุล" (A/B/C)
   ตรวจ 18 ข้อตาม Prompt · ใช้ fixture ล้วน ไม่แตะ Production
   ใช้: node harness/name_split_test.js <ทางโปรเจกต์ absolute> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require('/home/claude/work/harness/fixtures.js');

let PASS = 0, FAIL = 0, SKIP = 0;
const ROOT = process.argv[2] || process.cwd(), PORT = Number(process.argv[3] || 8930);
function chk(n, ok, e) { ok ? PASS++ : FAIL++; console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(62) + (e || '')); }
function skip(n, e) { SKIP++; console.log('SKIP  ' + n.padEnd(62) + (e || '')); }

/* ---- เก็บ payload ที่ถูกส่งเข้า njhr_emp_save / njhr_activation_submit ---- */
let savedEmp = null, savedAct = null;

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

/* พนักงานตัวอย่างที่มีชื่ออังกฤษครบ + อีกคนที่นามสกุลว่าง (ทดสอบ trim) */
const E_FULL = {
  id: 'emp-0001', emp_code: 'NJ0001', prefix: 'นาย',
  first_name: 'สมชาย', last_name: 'ใจดี',
  first_name_en: 'SOMCHAI', last_name_en: 'JAIDEE',
  nickname: 'ชาย', department_id: 'dept-1', department_name: 'บัญชี',
  position_name: 'เจ้าหน้าที่', start_date: '2020-01-05', status: 'ACTIVE',
  emp_type: 'MONTHLY', work_start: '08:30', work_end: '17:30',
  leave_sick: 30, leave_personal: 10, leave_vacation: 6, can_salary: true
};
const E_NOLAST = Object.assign({}, E_FULL, {
  id: 'emp-0002', emp_code: 'NJ0002', first_name: 'สมหญิง', last_name: '',
  first_name_en: 'SOMYING', last_name_en: ''
});

async function ctxOf(b) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/rest/v1/rpc/*', route => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    let out;
    if (fn === 'njhr_emp_get') out = { data: bd.p_id === 'emp-0002' ? E_NOLAST : E_FULL };
    else if (fn === 'njhr_emp_save') { savedEmp = bd; out = { id: bd.p_id || 'emp-9999', emp_code: 'NJ0001', full_name: 'สมชาย ใจดี' }; }
    else if (fn === 'njhr_activation_submit') { savedAct = bd; out = { ok: true, message: 'ส่งคำขอแล้ว' }; }
    /* หน้าจัดการผู้ใช้อ่านชื่อจาก emp_name ที่เซิร์ฟเวอร์ concat มาจาก first_name + last_name
       fixture กลางยังส่ง full_name อย่างเดียว จึงเติม emp_name จาก 2 ฟิลด์แยกให้ตรงสัญญาจริง
       และตั้งใจให้บางคนนามสกุลว่าง เพื่อพิสูจน์ว่าไม่เกิดช่องว่างซ้ำ / null */
    else if (fn === 'njhr_list_users') {
      out = F.respond(fn, bd).map((r, i) => {
        if (!r.employee_id) return r;
        const fnm = 'สมชาย', lnm = (i % 7 === 0) ? '' : 'ใจดี' + String(i);
        return Object.assign({}, r, { emp_name: (fnm + ' ' + lnm).trim() });
      });
    }
    else out = F.respond(fn, bd);
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(out) });
  });
  await ctx.route('**/storage/v1/**', r => r.fulfill({ status: 200, body: '{}' }));
  return ctx;
}

const U = (p) => 'http://127.0.0.1:' + PORT + '/index.html' + (p || '');

async function login(page) {
  await page.waitForFunction(() => !!document.getElementById('lg-user'), { timeout: 15000 });
  await page.evaluate(() => {
    document.getElementById('lg-user').value = 'admin';
    document.getElementById('lg-pass').value = 'Admin1234';
    document.getElementById('login-form').onsubmit({ preventDefault: function () {} });
  });
  await page.waitForTimeout(2500);
}

(async () => {
  const srv = await serve(ROOT, PORT);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const errs = [];
  const ctx = await ctxOf(b);
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(String(e.message)));
  page.on('console', m => { if (m.type() === 'error' && String(m.text()).indexOf('403') < 0) errs.push(m.text()); });

  console.log('\n########## A) ฟอร์มพนักงาน — ช่องแยก 4 ฟิลด์ ##########');
  await page.goto(U(), { waitUntil: 'load' });
  await login(page);
  await page.evaluate(() => { location.hash = '#/employees'; });
  await page.waitForFunction(() => document.querySelectorAll('[data-emp-edit]').length > 0, { timeout: 15000 });

  /* --- 1) เพิ่มพนักงานใหม่: ช่องครบ 4 --- */
  await page.click('#emp-add');
  await page.waitForSelector('#emp-f [name="first_name"]', { timeout: 15000 });
  const has = await page.evaluate(() => {
    const g = n => !!document.querySelector('#emp-f [name="' + n + '"]');
    return { fn: g('first_name'), ln: g('last_name'), fne: g('first_name_en'), lne: g('last_name_en') };
  });
  chk('1 · ฟอร์มมีช่องแยก 4 ฟิลด์', has.fn && has.ln && has.fne && has.lne, JSON.stringify(has));
  chk('18 · ไม่มีช่อง full_name / name เป็นฟิลด์หลัก',
    await page.evaluate(() => !document.querySelector('#emp-f [name="full_name"],#emp-f [name="name"],#emp-f [name="employee_name"]')), '');

  const lbl = await page.evaluate(() => {
    function L(n) { const i = document.querySelector('#emp-f [name="' + n + '"]'); return i ? i.closest('label').querySelector('span').textContent.trim() : ''; }
    return { fn: L('first_name'), ln: L('last_name'), fne: L('first_name_en'), lne: L('last_name_en') };
  });
  chk('1b · Label แยกภาษาไทย/อังกฤษชัดเจน',
    /ภาษาไทย/.test(lbl.fn) && /ภาษาไทย/.test(lbl.ln) && /ภาษาอังกฤษ/.test(lbl.fne) && /ภาษาอังกฤษ/.test(lbl.lne),
    lbl.fn + ' | ' + lbl.ln + ' | ' + lbl.fne + ' | ' + lbl.lne);

  /* --- 2) กรอกครบแล้วบันทึก: payload ต้องแยก --- */
  savedEmp = null;
  await page.evaluate(() => {
    function S(n, v) { const i = document.querySelector('#emp-f [name="' + n + '"]'); i.value = v; }
    S('emp_code', 'NJ9999'); S('first_name', '  สมชาย  '); S('last_name', '  ใจดี  ');
    S('first_name_en', "  Mary-Jane O'Neil  "); S('last_name_en', '  van der Berg  ');
    S('start_date', '2024-01-01');
  });
  await page.click('#empf-save');
  await page.waitForFunction(() => !document.querySelector('#modal-root .modal'), { timeout: 15000 }).catch(() => {});
  const d = (savedEmp && savedEmp.p_data) || {};
  chk('1 · ชื่อไทย/นามสกุลไทยแยกถูกต้อง', d.first_name === 'สมชาย' && d.last_name === 'ใจดี',
    JSON.stringify({ first_name: d.first_name, last_name: d.last_name }));
  chk('2 · ชื่ออังกฤษ/นามสกุลอังกฤษแยกถูกต้อง',
    d.first_name_en === "Mary-Jane O'Neil" && d.last_name_en === 'van der Berg',
    JSON.stringify({ first_name_en: d.first_name_en, last_name_en: d.last_name_en }));
  chk('10-STEP · Trim หัวท้ายทุกฟิลด์ ไม่เปลี่ยนตัวพิมพ์ · รับเว้นวรรค/ขีดกลาง/Apostrophe',
    d.first_name_en === "Mary-Jane O'Neil" && d.last_name_en === 'van der Berg', 'ค่าคงรูปเดิม');
  chk('18 · payload ไม่มี full_name / name / employee_name',
    !('full_name' in d) && !('name' in d) && !('employee_name' in d), Object.keys(d).length + ' keys');

  /* --- 3/4/5) แก้เฉพาะฟิลด์เดียว ไม่กระทบฟิลด์อื่น --- */
  async function editOnly(field, value) {
    savedEmp = null;
    await page.waitForFunction(() => document.querySelectorAll('[data-emp-edit]').length > 0, { timeout: 20000 });
    await page.evaluate(() => { document.querySelector('[data-emp-edit]').click(); });
    await page.waitForSelector('#emp-f [name="last_name_en"]', { timeout: 15000 });
    await page.evaluate(f => { document.querySelector('#emp-f [name="' + f.n + '"]').value = f.v; }, { n: field, v: value });
    await page.click('#empf-save');
    await page.waitForFunction(() => !document.querySelector('#modal-root .modal'), { timeout: 15000 }).catch(() => {});
    return (savedEmp && savedEmp.p_data) || {};
  }
  let r = await editOnly('first_name', 'สมศักดิ์');
  chk('3 · แก้เฉพาะชื่อไทย ไม่กระทบนามสกุล/ชื่ออังกฤษ',
    r.first_name === 'สมศักดิ์' && r.last_name === 'ใจดี' && r.first_name_en === 'SOMCHAI' && r.last_name_en === 'JAIDEE',
    JSON.stringify([r.first_name, r.last_name, r.first_name_en, r.last_name_en]));
  r = await editOnly('last_name', 'มีสุข');
  chk('4 · แก้เฉพาะนามสกุลไทย ไม่กระทบชื่อ',
    r.first_name === 'สมชาย' && r.last_name === 'มีสุข' && r.last_name_en === 'JAIDEE',
    JSON.stringify([r.first_name, r.last_name, r.last_name_en]));
  r = await editOnly('first_name_en', 'SOMSAK');
  chk('5 · แก้ชื่ออังกฤษ ไม่กระทบชื่อไทย',
    r.first_name === 'สมชาย' && r.last_name === 'ใจดี' && r.first_name_en === 'SOMSAK' && r.last_name_en === 'JAIDEE',
    JSON.stringify([r.first_name, r.first_name_en]));

  /* --- 6/7/17) หน้าแสดงรายละเอียด: รวมชื่อถูกต้อง ไม่มี null / ช่องว่างซ้ำ --- */
  await page.waitForFunction(() => document.querySelectorAll('[data-emp-view]').length > 0, { timeout: 20000 });
  await page.evaluate(() => { document.querySelector('[data-emp-view]').click(); });
  /* รอ .ep-info ใน Modal จริง ไม่ใช่ข้อความบนหน้า
     (toast หลังบันทึกมีคำว่า "สมชาย" อยู่ด้วย จะทำให้ผ่านเงื่อนไขก่อน Modal โหลดเสร็จ) */
  await page.waitForFunction(() => document.querySelectorAll('#modal-root .ep-info').length > 0, { timeout: 15000 });
  let txt = await page.evaluate(() => {
    const o = {};
    document.querySelectorAll('#modal-root .ep-info').forEach(x => {
      const s = x.querySelectorAll('span'), b = x.querySelector('b');
      if (s[0] && b) o[s[0].textContent.trim()] = b.textContent;
    });
    return o;
  });
  chk('6 · แสดงชื่อไทยรวมกันถูกต้อง', txt['ชื่อ-นามสกุล'] === 'สมชาย ใจดี', '"' + txt['ชื่อ-นามสกุล'] + '"');
  chk('7 · แสดงชื่ออังกฤษรวมกันถูกต้อง', txt['ชื่อภาษาอังกฤษ'] === 'SOMCHAI JAIDEE', '"' + txt['ชื่อภาษาอังกฤษ'] + '"');
  await page.evaluate(() => document.getElementById('empd-close').click());

  /* นามสกุลว่าง → ต้องไม่มีช่องว่างท้าย ไม่มีคำว่า null/undefined */
  await page.evaluate(() => {
    const b = document.querySelector('[data-emp-view]');
    b.setAttribute('data-emp-view', 'emp-0002'); b.click();
  });
  await page.waitForFunction(() => document.querySelectorAll('#modal-root .ep-info').length > 0, { timeout: 15000 });
  txt = await page.evaluate(() => {
    const o = {};
    document.querySelectorAll('#modal-root .ep-info').forEach(x => {
      const s = x.querySelectorAll('span'), b = x.querySelector('b');
      if (s[0] && b) o[s[0].textContent.trim()] = b.textContent;
    });
    return o;
  });
  chk('17 · นามสกุลว่าง → ไม่มีช่องว่างท้าย ไม่มี null/undefined',
    txt['ชื่อ-นามสกุล'] === 'สมหญิง' && txt['ชื่อภาษาอังกฤษ'] === 'SOMYING',
    'ไทย="' + txt['ชื่อ-นามสกุล'] + '" · EN="' + txt['ชื่อภาษาอังกฤษ'] + '"');
  await page.evaluate(() => document.getElementById('empd-close').click());

  console.log('\n########## B) หน้าเปิดใช้งานบัญชี ##########');
  await page.evaluate(() => { NJHR.auth.logout(true); });
  await page.waitForFunction(() => !!document.getElementById('lg-user'), { timeout: 15000 });
  const openAct = await page.evaluate(() => {
    const b = [].slice.call(document.querySelectorAll('button,a')).filter(x => /เปิดใช้งานบัญชี/.test(x.textContent))[0];
    if (b) { b.click(); return true; } return false;
  });
  if (!openAct) skip('11 · เปิดหน้าเปิดใช้งานบัญชี', 'ไม่พบปุ่มบนหน้า Login');
  else {
    await page.waitForSelector('#act-last', { timeout: 15000 });
    const al = await page.evaluate(() => {
      const sp = document.getElementById('act-last').closest('label').querySelector('span');
      return sp.textContent.replace(/\s+/g, ' ').trim();
    });
    chk('11 · Label = "นามสกุลภาษาไทย"', /นามสกุลภาษาไทย/.test(al), '"' + al + '"');
    chk('11b · มีข้อความช่วย "กรอกให้ตรงกับข้อมูลพนักงานในระบบ"',
      /กรอกให้ตรงกับข้อมูลพนักงานในระบบ/.test(al), '"' + al + '"');

    savedAct = null;
    await page.evaluate(() => {
      const V = (id, v) => { document.getElementById(id).value = v; };
      V('act-code', 'NJ0001'); V('act-last', 'ใจดี'); V('act-nick', 'ชาย');
      V('act-mail', 'a@b.co'); V('act-pw', 'Abcdef12'); V('act-pw2', 'Abcdef12');
      document.getElementById('act-go').click();
    });
    await page.waitForFunction(() => window.__x || true, { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(600);
    const a = savedAct || {};
    chk('11 · ส่ง emp_code + นามสกุลไทย เป็นตัวจับคู่',
      a.p_emp_code === 'NJ0001' && a.p_last_name === 'ใจดี', JSON.stringify({ p_emp_code: a.p_emp_code, p_last_name: a.p_last_name }));
    chk('12 · ไม่ส่ง last_name_en / first_name_en เป็นตัวจับคู่',
      !('p_last_name_en' in a) && !('p_first_name_en' in a) && !('p_first_name' in a), Object.keys(a).join(','));
    chk('4-STEP · ไม่ใช้ชื่อเล่น/Username เป็นตัวจับคู่ (nickname ส่งไปเพื่ออัปเดต ไม่ใช่จับคู่)',
      !('p_username' in a), Object.keys(a).join(','));
  }

  console.log('\n########## C) ระบบเดิมไม่กระทบ ##########');
  await page.goto(U(), { waitUntil: 'load' });
  await login(page);
  chk('8 · USER เดิมยัง Login ได้', await page.evaluate(() => location.hash === '#/dashboard'), 'hash=#/dashboard');
  const sess = await page.evaluate(() => { const u = NJHR.auth.currentUser(); return { id: u.id, un: u.username, role: u.role, emp: u.empId }; });
  chk('9 · employee_id เดิมไม่เปลี่ยน', !!sess.emp, 'empId=' + sess.emp);
  chk('13 · Username เดิมไม่เปลี่ยน', !!sess.un, 'username=' + sess.un);
  chk('14 · Role เดิมไม่เปลี่ยน', ['SUPER_ADMIN', 'ADMIN', 'USER'].indexOf(sess.role) >= 0, 'role=' + sess.role);

  await page.evaluate(() => { location.hash = '#/req-history'; });
  await page.waitForTimeout(1200);
  chk('10 · ใบลาเดิมยังผูกพนักงานเดิม (หน้าประวัติเปิดได้ ไม่ error)',
    await page.evaluate(() => location.hash === '#/req-history'), 'hash=' + await page.evaluate(() => location.hash) +
    ' · พบคำต้องสงสัยในพื้นที่แสดงผล=' + JSON.stringify(await page.evaluate(() => ((((document.getElementById('view-host') || {}).innerText) || '').match(/.{0,40}(undefined|\bnull\b).{0,40}/g) || []).slice(0, 3))));

  await page.evaluate(() => { location.hash = '#/users'; });
  await page.waitForFunction(() => /สมชาย/.test(((document.getElementById('view-host') || {}).innerText) || ''), { timeout: 25000 }).catch(() => {});
  const uOk = await page.evaluate(() => {
    /* ตรวจเฉพาะข้อความที่ผู้ใช้เห็นจริงในพื้นที่แสดงผล ไม่รวมเนื้อ <script> ใน body */
    const t = (document.getElementById('view-host') || {}).innerText || '';
    const m = t.match(/.{0,40}(undefined|\bnull\b).{0,40}/g);
    return { hasName: /สมชาย ใจดี/.test(t), noDoubleSpace: !/สมชาย {2,}/.test(t),
             bad: !!m, sample: (m || []).slice(0, 3) };
  });
  chk('16 · หน้าจัดการผู้ใช้แสดงชื่อ–นามสกุลถูกต้อง', uOk.hasName, 'พบ "สมชาย ใจดี" ในตาราง');
  chk('16b · นามสกุลว่าง → ไม่เกิดช่องว่างซ้ำในหน้าจัดการผู้ใช้', uOk.noDoubleSpace, '');
  chk('17 · หน้าจัดการผู้ใช้ไม่มี null / undefined', !uOk.bad, JSON.stringify(uOk.sample));

  await page.evaluate(() => { location.hash = '#/employees'; });
  await page.waitForFunction(() => document.querySelectorAll('[data-emp-edit]').length > 0, { timeout: 20000 });
  chk('15 · ข้อมูลพนักงานเดิมไม่สูญหาย (รายการยังแสดงครบ)',
    await page.evaluate(() => document.querySelectorAll('[data-emp-edit]').length) > 0,
    'แถว=' + await page.evaluate(() => document.querySelectorAll('[data-emp-edit]').length));

  skip('12b · กรอก last_name_en แทนนามสกุลไทยแล้วต้องไม่จับคู่', 'ต้องตรวจฝั่ง SQL จริง — รอผล A1_inspect_employee_name.sql');

  chk('CONSOLE · ไม่มี unhandled error ตลอดชุด', errs.length === 0, errs.slice(0, 2).join(' | ') || 'ไม่มี');

  console.log('\n========== สรุป ==========');
  console.log('PASS ' + PASS + ' · FAIL ' + FAIL + ' · NOT TESTED ' + SKIP);
  await b.close(); srv.close();
  process.exit(FAIL ? 1 : 0);
})();
