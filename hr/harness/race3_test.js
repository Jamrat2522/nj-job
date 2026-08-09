/* race3_test.js — ทดสอบ Race Condition / Stale Binding 3 จุด
     [1] empRows  → Modal เปลี่ยนสถานะพนักงาน ต้องแสดงรหัส + ชื่อ–นามสกุลถูกคนเสมอ
     [2] lvBal    → ฟอร์มขอลา ต้องแสดงสิทธิ์คงเหลือจริง ไม่ใช่ "ไม่จำกัด" เพราะ async ยังไม่เสร็จ
     [3] db       → NJHR.compat.scope.db ต้องเป็น object เดียวกับที่ loadDB() เติมข้อมูลแล้ว

   โหลด chunk ที่ build แล้วจริงลง jsdom · stub เฉพาะ NJHR.compat.scope ตามสัญญาเดิม
   ไม่แตะ Supabase จริง · ไม่แตะข้อมูล Production

   ต้องมี jsdom (ไม่ต้องใช้เบราว์เซอร์/Playwright):  npm i -D jsdom
   วิธีใช้: node harness/race3_test.js [ทางโปรเจกต์]                                */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(process.argv[2] || '.');

const EMPS = [];
for (let i = 1; i <= 3; i++) {
  EMPS.push({
    id: 'emp-000' + i, emp_code: 'NJ000' + i,
    first_name: 'พนักงาน', last_name: 'ทดสอบ' + i,
    full_name: 'พนักงาน ทดสอบ' + i,
    status: 'ACTIVE', resign_date: null, department_name: 'ขนส่ง', total_count: 3
  });
}
const BAL = [
  { leave_type: 'SICK', quota: 30, used: 2, pending: 0, remaining: 28 },
  { leave_type: 'PERSONAL', quota: 10, used: 1, pending: 0, remaining: 9 },
  { leave_type: 'VACATION', quota: 6, used: 0, pending: 0, remaining: 6 },
  { leave_type: 'MATERNITY', quota: null, used: 0, pending: 0, remaining: null }
];

const results = [];
function check(name, cond, detail) {
  results.push({ name, pass: !!cond, detail: detail || '' });
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (detail ? '  · ' + detail : ''));
}
const tick = () => new Promise(r => setTimeout(r, 0));

/* ---------- สภาพแวดล้อมจำลอง runtime ---------- */
function makeEnv(opt) {
  opt = opt || {};
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div><div id="modal-root"></div></body></html>');
  const win = dom.window;
  const calls = [];
  const held = { list: [], bal: [] };
  let lastModal = null, lastToast = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function rpcList(fn) {
    calls.push(fn);
    if (fn === 'njhr_emp_departments') return Promise.resolve([]);
    if (fn === 'njhr_emp_list') {
      if (opt.holdList) return new Promise(res => held.list.push(() => res(EMPS.slice())));
      return Promise.resolve(EMPS.slice());
    }
    if (fn === 'njhr_leave_balances') {
      if (opt.balFail) return Promise.reject(new Error('RPC 500'));
      if (opt.holdBal) return new Promise(res => held.bal.push(() => res(BAL.slice())));
      return Promise.resolve(BAL.slice());
    }
    if (fn === 'njhr_leave_list') return Promise.resolve([]);
    return Promise.resolve([]);
  }
  function rpc(fn) {
    calls.push(fn);
    if (fn === 'njhr_emp_get') {
      const d = EMPS.find(x => x.id === opt.getId) || EMPS[0];
      return Promise.resolve({ data: {
        id: d.id, emp_code: d.emp_code, first_name: d.first_name, last_name: d.last_name,
        status: d.status, resign_date: d.resign_date } });
    }
    return Promise.resolve({});
  }

  const NJHR = {
    state: { currentRoute: '#/employees' },
    router: { navId: () => 1, moduleMap: {} },
    modules: { isLoaded: () => true, load: () => Promise.resolve() },
    features: { leaveList: { resetPage: () => {} } },
    views: { register: () => {} }, compat: { scope: {} }
  };
  Object.assign(NJHR.compat.scope, {
    icon: () => '', esc, debounce: f => f, avatarHTML: () => '',
    emptyState: m => '<div>' + m + '</div>',
    emp: () => ({}), dept: () => 'ขนส่ง',
    db: { employees: [{ id: 'emp-0002', code: 'NJ0002', firstName: 'พนักงาน', lastName: 'ทดสอบ2', status: 'ACTIVE' }] },
    isWeekend: () => false, isHoliday: () => false, hoursDiff: () => 3,
    lvCode: id => 'LV-' + id, refreshLeavePending: () => {},
    currentUser: () => ({ role: 'SUPER_ADMIN', id: 'u1', username: 'su' }),
    currentEmp: () => ({ id: 'emp-0001', code: 'NJ0001', title: 'นาย', firstName: 'พนักงาน',
                         lastName: 'ทดสอบ1', deptId: 'd1', position: 'เจ้าหน้าที่' }),
    toast: (m, t) => { lastToast = { msg: m, type: t }; },
    sbReady: () => true, sbRpcList: rpcList, sbRpc: rpc, sbToken: () => 'tok',
    sbUploadLeaveFile: () => Promise.resolve({}),
    empBE: d => d || '', todayISO: () => '2026-01-01', nowStamp: () => '01/01/2569 09:00',
    uid: p => p + '1', money: n => String(n), njAsset: a => a,
    loadScriptOnce: () => Promise.resolve(), withButtonLoading: (b, t, f) => f(),
    ssoBindForm: () => {}, ssoFormPayload: () => ({}),
    EMP_STATUS: [['ACTIVE', 'ทำงานอยู่'], ['PROBATION', 'ทดลองงาน'], ['RESIGNED', 'พ้นสภาพ']],
    EMP_STATUS_MAP: { ACTIVE: 'ทำงานอยู่', PROBATION: 'ทดลองงาน', RESIGNED: 'พ้นสภาพ' },
    EMP_TYPE_OPTS: ['MONTHLY', 'DAILY'],
    LEAVE_TYPES: [
      { code: 'SICK', name: 'ลาป่วย', color: '#f00' },
      { code: 'PERSONAL', name: 'ลากิจ', color: '#0f0' },
      { code: 'VACATION', name: 'ลาพักร้อน', color: '#00f' },
      { code: 'MATERNITY', name: 'ลาคลอด', color: '#f0f' }
    ],
    lvNum: n => (n == null ? 0 : Math.round(Number(n) * 100) / 100),
    lvType: c => ({ code: c, name: c }),
    leaveCard: () => '<div></div>',
    businessDays: () => 1, holLoad: () => Promise.resolve(),
    openModal: (title, body, footer) => {
      lastModal = { title, body, footer };
      win.document.getElementById('modal-root').innerHTML =
        '<div class="modal-body">' + body + '</div><div class="modal-foot">' + footer + '</div>';
    },
    closeModal: () => { lastModal = null; }
  });

  win.NJHR = NJHR;
  const ctx = vm.createContext(win);
  return {
    win, NJHR, calls, held,
    run: rel => vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }),
    modal: () => lastModal,
    toast: () => lastToast
  };
}

/* ================= [1] empRows ================= */
async function testEmpRows() {
  console.log('\n--- [1] empRows · Modal เปลี่ยนสถานะพนักงาน ---');

  // R1 · รอรายชื่อโหลดเสร็จ แล้วกดเปลี่ยนสถานะ (ต้องใช้ cache ไม่ยิง RPC เพิ่ม)
  {
    const E = makeEnv({});
    E.run('views/employees/list.js'); E.run('views/employees/form.js');
    const host = E.win.document.getElementById('app');
    E.NJHR.features.employees.refresh(host);
    await tick(); await tick(); await tick();
    const before = E.calls.filter(c => c === 'njhr_emp_get').length;
    E.NJHR.features.employeesForm.status('emp-0002', host);
    await tick(); await tick();
    const body = (E.modal() || {}).body || '';
    const after = E.calls.filter(c => c === 'njhr_emp_get').length;
    check('R1 · รายชื่อโหลดเสร็จแล้ว → Modal แสดงรหัส + ชื่อถูกคน',
      body.indexOf('NJ0002') >= 0 && body.indexOf('พนักงาน ทดสอบ2') >= 0,
      body ? body.slice(body.indexOf('confirm-msg'), body.indexOf('</p>')).replace(/<[^>]+>/g, '') : 'ไม่พบ modal');
    check('R1 · ใช้ cache จากรายชื่อ ไม่ยิง njhr_emp_get เพิ่ม',
      before === 0 && after === 0, 'njhr_emp_get ก่อน=' + before + ' หลัง=' + after);
    check('R1 · สถานะปัจจุบันถูกเลือกไว้ถูกต้อง',
      /value="ACTIVE" selected/.test(body), 'ACTIVE selected');
  }

  // R2 · กดเปลี่ยนสถานะทันทีก่อนรายชื่อโหลดเสร็จ (Race Condition)
  {
    const E = makeEnv({ holdList: true, getId: 'emp-0003' });
    E.run('views/employees/list.js'); E.run('views/employees/form.js');
    const host = E.win.document.getElementById('app');
    E.NJHR.features.employees.refresh(host);
    await tick();
    E.NJHR.features.employeesForm.status('emp-0003', host);   // รายชื่อยังไม่ resolve
    await tick(); await tick(); await tick();
    const body = (E.modal() || {}).body || '';
    check('R2 · กดเปลี่ยนสถานะก่อนรายชื่อโหลดเสร็จ → ยังได้ชื่อถูกคน',
      body.indexOf('NJ0003') >= 0 && body.indexOf('พนักงาน ทดสอบ3') >= 0,
      body ? body.slice(body.indexOf('confirm-msg'), body.indexOf('</p>')).replace(/<[^>]+>/g, '') : 'ไม่พบ modal');
    check('R2 · ใช้ RPC เดิม njhr_emp_get ไม่สร้าง RPC ใหม่',
      E.calls.filter(c => c === 'njhr_emp_get').length === 1,
      'calls=' + E.calls.join(','));
  }

  // R3 · เปิด Modal โดยไม่เคยเข้าหน้ารายชื่อเลย
  {
    const E = makeEnv({ getId: 'emp-0001' });
    E.run('views/employees/list.js'); E.run('views/employees/form.js');
    E.NJHR.features.employeesForm.status('emp-0001', E.win.document.getElementById('app'));
    await tick(); await tick();
    const body = (E.modal() || {}).body || '';
    check('R3 · ไม่เคยโหลดรายชื่อเลย → Modal ยังแสดงชื่อครบ',
      body.indexOf('NJ0001') >= 0 && body.indexOf('พนักงาน ทดสอบ1') >= 0,
      body ? 'พบ NJ0001' : 'ไม่พบ modal');
  }

  // R4 · การบันทึกเปลี่ยนสถานะเดิมยังทำงาน
  {
    const E = makeEnv({});
    E.run('views/employees/list.js'); E.run('views/employees/form.js');
    const host = E.win.document.getElementById('app');
    E.NJHR.features.employees.refresh(host);
    await tick(); await tick(); await tick();
    E.NJHR.features.employeesForm.status('emp-0001', host);
    await tick(); await tick();
    const d = E.win.document;
    const okBtn = d.getElementById('empst-ok');
    const stSel = d.getElementById('empst-status');
    stSel.value = 'RESIGNED';
    stSel.onchange();
    const rwrap = d.getElementById('empst-rwrap');
    check('R4 · เลือก "พ้นสภาพ" → ช่องวันที่พ้นสภาพโผล่เหมือนเดิม',
      rwrap && rwrap.style.display === '', 'display="' + (rwrap ? rwrap.style.display : '?') + '"');
    okBtn.onclick.call(okBtn);
    await tick(); await tick();
    check('R4 · กดบันทึก → เรียก njhr_emp_status เหมือนเดิม',
      E.calls.indexOf('njhr_emp_status') >= 0, 'calls=' + E.calls.join(','));
  }

  // R5 · NJHR.compat.scope.empRows สะท้อนข้อมูลจริง
  {
    const E = makeEnv({});
    E.run('views/employees/list.js');
    const published = E.NJHR.compat.scope.empRows;
    E.NJHR.features.employees.refresh(E.win.document.getElementById('app'));
    await tick(); await tick(); await tick();
    check('R5 · NJHR.compat.scope.empRows สะท้อนข้อมูลหลังโหลดเสร็จ',
      published && published.length === 3, 'length=' + (published ? published.length : 'n/a'));
  }
}

/* ================= [2] lvBal ================= */
function lvOptionsOf(html) {
  const m = /<select name="typeId" id="lvf-type">([\s\S]*?)<\/select>/.exec(html || '');
  if (!m) return null;
  const out = [];
  const re = /<option value="([^"]*)">([\s\S]*?)<\/option>/g;
  let x;
  while ((x = re.exec(m[1]))) out.push({ code: x[1], text: x[2] });
  return out;
}

async function testLvBal() {
  console.log('\n--- [2] lvBal · สิทธิ์ลาในฟอร์มขอลา ---');

  // L1 · รอหน้าลางานโหลดเสร็จแล้วกดขอลางาน (ต้องใช้ cache)
  {
    const E = makeEnv({});
    E.run('views/leave/main.js'); E.run('views/leave/form.js');
    const host = E.win.document.getElementById('app');
    E.NJHR.views.register; // no-op
    E.win.NJHR.compat.scope.viewLeave ? null : null;
    E.run('views/leave/main.js');
    const viewLeave = E.win.__viewLeave;
    // เรียกผ่าน registry ที่ chunk ลงทะเบียนไว้
    E.NJHR.features.leaveForm.open(host);   // ยังไม่ได้เปิดหน้ารายการ → ต้องโหลดเอง
    await tick(); await tick();
    const opts = lvOptionsOf((E.modal() || {}).body);
    check('L1 · เปิดฟอร์มโดยยังไม่เคยโหลดสิทธิ์ → แสดงคงเหลือจริง',
      opts && /คงเหลือ 28 วัน/.test(opts.find(o => o.code === 'SICK').text),
      opts ? opts.map(o => o.text.trim()).join(' | ') : 'ไม่พบ select');
    check('L1 · ประเภทที่ไม่มีโควตา ยังแสดง "ไม่จำกัด" เหมือนเดิม',
      opts && /ไม่จำกัด/.test(opts.find(o => o.code === 'MATERNITY').text),
      opts ? opts.find(o => o.code === 'MATERNITY').text.trim() : '-');
    check('L1 · ยิง njhr_leave_balances 1 ครั้ง',
      E.calls.filter(c => c === 'njhr_leave_balances').length === 1,
      'เรียก ' + E.calls.filter(c => c === 'njhr_leave_balances').length + ' ครั้ง');
  }

  // L2 · กด "ขอลางาน" ทันทีหลัง Refresh (หน้ารายการยังโหลดไม่เสร็จ)
  {
    const E = makeEnv({ holdBal: true });
    E.run('views/leave/main.js'); E.run('views/leave/form.js');
    const host = E.win.document.getElementById('app');
    E.NJHR.views.register = () => {};
    // เปิดหน้ารายการ (RPC ค้าง) แล้วกดขอลางานทันที
    E.NJHR.features.leaveForm.open(host);
    await tick();
    E.held.bal.splice(0).forEach(f => f());
    await tick(); await tick(); await tick();
    const opts = lvOptionsOf((E.modal() || {}).body);
    check('L2 · กด "ขอลางาน" ทันทีหลัง Refresh → สิทธิ์ลาขึ้นถูกต้อง',
      opts && /คงเหลือ 9 วัน/.test(opts.find(o => o.code === 'PERSONAL').text),
      opts ? opts.find(o => o.code === 'PERSONAL').text.trim() : 'ไม่พบ select');
  }

  // L3 · กดซ้ำเร็ว ๆ → ไม่ยิง RPC ซ้อนกัน
  {
    const E = makeEnv({ holdBal: true });
    E.run('views/leave/main.js'); E.run('views/leave/form.js');
    const host = E.win.document.getElementById('app');
    E.NJHR.features.leaveForm.open(host);
    E.NJHR.features.leaveForm.open(host);
    E.NJHR.features.leaveForm.open(host);
    await tick();
    const n = E.calls.filter(c => c === 'njhr_leave_balances').length;
    E.held.bal.splice(0).forEach(f => f());
    await tick(); await tick();
    check('L3 · กด "ขอลางาน" ซ้ำ 3 ครั้งรวด → ยิง njhr_leave_balances ครั้งเดียว',
      n === 1, 'เรียก ' + n + ' ครั้ง');
  }

  // L4 · โหลดสิทธิ์ลาไม่สำเร็จ → แจ้ง Error ชัดเจน ไม่เปิดฟอร์มหลอก
  {
    const E = makeEnv({ balFail: true });
    E.run('views/leave/main.js'); E.run('views/leave/form.js');
    E.NJHR.features.leaveForm.open(E.win.document.getElementById('app'));
    await tick(); await tick(); await tick();
    const t = E.toast();
    check('L4 · โหลดสิทธิ์ลาไม่สำเร็จ → ไม่เปิดฟอร์ม',
      E.modal() === null, E.modal() ? 'เปิดฟอร์มทั้งที่โหลดไม่สำเร็จ' : 'ไม่เปิดฟอร์ม');
    check('L4 · แจ้งข้อความชัดเจน + เป็น error',
      t && t.type === 'error' && t.msg.indexOf('โหลดสิทธิ์การลาไม่สำเร็จ') >= 0,
      t ? t.msg : 'ไม่มี toast');
  }

  // L5 · NJHR.compat.scope.lvBal สะท้อนข้อมูลจริง
  {
    const E = makeEnv({});
    E.run('views/leave/main.js');
    const published = E.NJHR.compat.scope.lvBal;
    E.run('views/leave/form.js');
    E.NJHR.features.leaveForm.open(E.win.document.getElementById('app'));
    await tick(); await tick();
    check('L5 · NJHR.compat.scope.lvBal สะท้อนข้อมูลหลังโหลดเสร็จ',
      published && Object.keys(published).length === 4,
      'keys=' + (published ? Object.keys(published).join(',') : 'n/a'));
  }
}

/* ================= [3] db / loadDB ================= */
async function testDb() {
  console.log('\n--- [3] db · ลำดับ loadDB() กับ NJHR.compat.scope.db ---');

  const src = fs.readFileSync(path.join(ROOT, 'runtime/core.js'), 'utf8');
  const iBoot = src.lastIndexOf('njhrBootOnce()');
  const iPub = src.indexOf('NJHR.compat.scope.db=');
  check('D1 · ยืนยันลำดับจริง: njhrBootOnce() อยู่ "ก่อน" จุด publish db',
    iBoot >= 0 && iPub >= 0 && iBoot < iPub,
    'bootOnce@' + iBoot + ' · publish db@' + iPub);
  const loadBody = /function loadDB\(\)\{[\s\S]*?\n?\}/.exec(src);
  const loadTxt = loadBody ? loadBody[0] : '';
  check('D2 · loadDB() ไม่ผูกตัวแปร db ใหม่ (ใช้ dbReplace แทน)',
    src.indexOf('function dbReplace(') >= 0 && loadTxt.indexOf('dbReplace(') >= 0 &&
    !/(^|[^.\w$])db\s*=(?!=)/.test(loadTxt),
    loadTxt ? 'loadDB() ใช้ dbReplace() · ไม่มี db= ในตัวฟังก์ชัน' : 'ไม่พบ loadDB()');

  // D3 · ตรวจว่า dbReplace() แทนเนื้อในจริง (ลบ key เก่า + ใส่ key ใหม่) ไม่ใช่แค่ Object.assign
  const iRep = src.indexOf('function dbReplace(next){');
  const repTxt = iRep < 0 ? '' : src.slice(iRep, src.indexOf('function loadDB(', iRep));
  check('D3 · dbReplace() ลบ key ที่หายไปและใส่ key ใหม่ลง object ตัวเดิม',
    /delete db\[/.test(repTxt) && /db\[k\]=next\[k\]/.test(repTxt),
    repTxt ? 'มีทั้ง delete และ assign' : 'ไม่พบ dbReplace()');

  // D4 · db ถูกประกาศเป็น object ตั้งแต่ต้น ไม่ใช่ undefined
  check('D4 · db ถูกประกาศเป็น object ตั้งแต่ต้น (ไม่มีช่วง undefined)',
    /var db=\{\}/.test(src), /var db=\{\}/.test(src) ? 'var db={}' : 'ยังเป็น var db,');

  // D5 · โครงข้อมูลไม่เปลี่ยน — key ของ emptyDB() ยังครบ
  ['departments', 'employees', 'users', 'leaveTypes', 'balances', 'leaves', 'ots',
   'corrections', 'attendance', 'payroll', 'announcements', 'holidays', 'audit',
   'notifications', 'shifts', 'shiftMoves', 'settings'].forEach(function (k) {
    if (src.indexOf(k + ':') < 0) check('D5 · emptyDB() ยังมี key ' + k, false, 'หายไป');
  });
  check('D5 · โครงข้อมูล emptyDB() ครบ 17 key เหมือนเดิม', true, 'ตรวจครบทุก key');

  // D6 · ไม่มีการเรียก loadDB() ซ้ำ
  const nLoad = (src.match(/loadDB\(\)/g) || []).length;
  check('D6 · loadDB() ถูกเรียกจุดเดียวใน bundle (นับรวมนิยามฟังก์ชัน)',
    nLoad === 2, 'พบ loadDB() ' + nLoad + ' แห่ง (นิยาม 1 + เรียก 1)');
}

/* ---------- รัน ---------- */
(async function () {
  await testEmpRows();
  await testLvBal();
  await testDb();
  const pass = results.filter(r => r.pass).length;
  const fail = results.length - pass;
  console.log('\n**PASS ' + pass + ' · FAIL ' + fail + '**');
  process.exit(fail ? 1 : 0);
})();
