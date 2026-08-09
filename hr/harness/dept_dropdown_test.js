/* dept_dropdown_test.js — ทดสอบ Dropdown แผนกในฟอร์มเพิ่ม/แก้ไขพนักงาน
   โหลดไฟล์ chunk ที่ build แล้วจริง (views/employees/list.js + views/employees/form.js)
   ลง jsdom โดย stub เฉพาะ NJHR.compat.scope ตามสัญญาเดิม ไม่แตะ Supabase จริง
   ใช้ fixture แผนก 10 รายการ · นับจำนวนครั้งที่เรียก njhr_emp_departments ทุกเคส

   ต้องมี jsdom (ไม่ต้องใช้เบราว์เซอร์/Playwright):  npm i -D jsdom
   วิธีใช้: node harness/dept_dropdown_test.js [ทางโปรเจกต์]                      */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(process.argv[2] || '.');
const DEPTS = [];
for (let i = 0; i < 10; i++) {
  DEPTS.push({
    id: 'dept-' + i, code: 'D' + String(i).padStart(2, '0'),
    name: ['ปฏิบัติการ', 'บัญชี', 'ทรัพยากรบุคคล', 'ขนส่ง', 'คลังสินค้า',
           'จัดซื้อ', 'ไอที', 'การตลาด', 'ธุรการ', 'ความปลอดภัย'][i],
    employees: 10 + i, employees_active: 8 + i
  });
}

const results = [];
function check(name, cond, detail) {
  results.push({ name, pass: !!cond, detail: detail || '' });
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (detail ? '  · ' + detail : ''));
}

/* ---------- สร้างสภาพแวดล้อมหนึ่งชุด ---------- */
function makeEnv(opt) {
  opt = opt || {};
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div><div id="modal-root"></div></body></html>');
  const win = dom.window;
  const calls = [];          // ชื่อ RPC ทุกครั้งที่ถูกเรียก
  const deferred = [];       // ตัว resolve ของ njhr_emp_departments (โหมด manual)
  let lastModal = null;
  let lastToast = null;

  function rpcList(fn, body) {
    calls.push(fn);
    if (fn === 'njhr_emp_departments') {
      if (opt.deptFail) return Promise.reject(new Error('RPC 500'));
      if (opt.manualDept) return new Promise(function (res) { deferred.push(function () { res(DEPTS.slice()); }); });
      return Promise.resolve(DEPTS.slice());
    }
    if (fn === 'njhr_emp_list') return Promise.resolve([]);
    return Promise.resolve([]);
  }
  function rpc(fn, body) {
    calls.push(fn);
    if (fn === 'njhr_emp_get') return Promise.resolve({ data: opt.empData || {} });
    return Promise.resolve({});
  }

  const NJHR = {
    state: { currentRoute: '#/employees' },
    router: { navId: function () { return 1; }, moduleMap: {} },
    modules: { isLoaded: function () { return true; }, load: function () { return Promise.resolve(); } },
    features: {}, views: { register: function () {} },
    compat: { scope: {} }
  };
  const esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  Object.assign(NJHR.compat.scope, {
    icon: function () { return ''; }, esc: esc,
    debounce: function (f) { return f; },
    avatarHTML: function () { return ''; },
    emptyState: function (m) { return '<div>' + m + '</div>'; },
    emp: function () { return {}; }, dept: function () { return {}; }, db: {},
    currentUser: function () { return { role: 'SUPER_ADMIN', id: 'u1' }; },
    toast: function (m, t) { lastToast = { msg: m, type: t }; },
    sbReady: function () { return true; },
    sbRpcList: rpcList, sbRpc: rpc, sbToken: function () { return 'tok'; },
    empBE: function (d) { return d || ''; },
    todayISO: function () { return '2026-01-01'; },
    money: function (n) { return String(n); },
    njAsset: function (a) { return a; },
    loadScriptOnce: function () { return Promise.resolve(); },
    withButtonLoading: function (b, t, f) { return f(); },
    ssoBindForm: function () {}, ssoFormPayload: function () { return {}; },
    EMP_STATUS: [['ACTIVE', 'ทำงานอยู่'], ['RESIGNED', 'พ้นสภาพ']],
    EMP_STATUS_MAP: { ACTIVE: 'ทำงานอยู่', RESIGNED: 'พ้นสภาพ' },
    EMP_TYPE_OPTS: ['MONTHLY', 'DAILY'],
    openModal: function (title, body, footer) {
      lastModal = { title: title, body: body, footer: footer };
      win.document.getElementById('modal-root').innerHTML =
        '<div class="modal-body">' + body + '</div><div class="modal-foot">' + footer + '</div>';
    },
    closeModal: function () { lastModal = null; }
  });

  win.NJHR = NJHR;
  const ctx = vm.createContext(win);
  function run(rel) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
  }
  return {
    win: win, NJHR: NJHR, run: run, calls: calls,
    resolveDept: function () { deferred.splice(0).forEach(function (f) { f(); }); },
    modal: function () { return lastModal; },
    toast: function () { return lastToast; }
  };
}

/* ---------- ตัวอ่านผลจาก HTML ของฟอร์ม ---------- */
function deptSelectOf(html) {
  const m = /<select name="department_id">([\s\S]*?)<\/select>/.exec(html || '');
  if (!m) return null;
  const opts = [];
  const re = /<option value="([^"]*)"( selected)?>([\s\S]*?)<\/option>/g;
  let x;
  while ((x = re.exec(m[1]))) opts.push({ value: x[1], selected: !!x[2], text: x[3] });
  return opts;
}
const tick = () => new Promise(r => setTimeout(r, 0));

/* ================= เคสทดสอบ ================= */
(async function () {

  /* --- T1 · Refresh แล้วกด "เพิ่มพนักงาน" ทันที ก่อนหน้ารายชื่อโหลดแผนกเสร็จ --- */
  {
    const E = makeEnv({ manualDept: true });
    E.run('views/employees/list.js');
    E.NJHR.views.register = function () {};
    E.NJHR.compat.scope.viewEmployees = null;
    // เปิดหน้ารายชื่อ (RPC แผนกจะยังค้าง ยังไม่ resolve)
    const host = E.win.document.getElementById('app');
    E.win.NJHR.features.employees.refresh(host);
    await tick();
    E.run('views/employees/form.js');
    // กดปุ่มทันทีขณะ RPC ของหน้ารายชื่อยังไม่เสร็จ
    E.NJHR.features.employeesForm.open(null, host);
    await tick(); await tick();
    E.resolveDept();                        // ปล่อยทั้ง RPC ของ List และของฟอร์ม
    await tick(); await tick(); await tick();
    const opts = deptSelectOf(E.modal() && E.modal().body);
    check('T1 · กดเพิ่มพนักงานทันทีก่อน List โหลดแผนกเสร็จ → Dropdown ครบ',
      opts && opts.length === 11, opts ? 'option=' + opts.length + ' (— ไม่ระบุ — + 10 แผนก)' : 'ไม่พบ select');
    check('T1 · ตัวเลือกแรกคือ — ไม่ระบุ —',
      opts && opts[0].value === '' && opts[0].text.indexOf('ไม่ระบุ') >= 0, opts ? opts[0].text : '');
    check('T1 · ชื่อแผนกตรงกับ SQL ทั้ง 10 รายการ',
      opts && opts.length === 11 && DEPTS.every(function (d, i) { return opts[i + 1].value === d.id && opts[i + 1].text === d.name; }),
      opts ? opts.slice(1).map(o => o.text).join(',') : '');
  }

  /* --- T2 · รอหน้ารายชื่อโหลดเสร็จ แล้วค่อยกด "เพิ่มพนักงาน" (ต้องใช้ cache ไม่ยิงซ้ำ) --- */
  {
    const E = makeEnv({});
    E.run('views/employees/list.js');
    const host = E.win.document.getElementById('app');
    E.win.NJHR.features.employees.refresh(host);
    await tick(); await tick(); await tick();
    const before = E.calls.filter(c => c === 'njhr_emp_departments').length;
    E.run('views/employees/form.js');
    E.NJHR.features.employeesForm.open(null, host);
    await tick(); await tick();
    const after = E.calls.filter(c => c === 'njhr_emp_departments').length;
    const opts = deptSelectOf(E.modal() && E.modal().body);
    check('T2 · รอ List เสร็จแล้วกดเพิ่มพนักงาน → Dropdown ครบ',
      opts && opts.length === 11, opts ? 'option=' + opts.length : 'ไม่พบ select');
    check('T2 · ใช้ cache เดิม ไม่ยิง njhr_emp_departments ซ้ำ',
      before === 1 && after === 1, 'ก่อนเปิดฟอร์ม=' + before + ' หลังเปิดฟอร์ม=' + after);
  }

  /* --- T3 · แก้ไขพนักงาน (มี department_id) → เลือกแผนกเดิมถูกต้อง --- */
  {
    const E = makeEnv({ empData: { id: 'emp-0003', emp_code: 'NJ0003', first_name: 'ก', last_name: 'ข',
      department_id: 'dept-3', department_name: 'ขนส่ง', start_date: '2020-01-04' } });
    E.run('views/employees/list.js');
    E.run('views/employees/form.js');
    const host = E.win.document.getElementById('app');
    E.NJHR.features.employeesForm.open('emp-0003', host);
    await tick(); await tick(); await tick();
    const opts = deptSelectOf(E.modal() && E.modal().body);
    const sel = opts && opts.filter(o => o.selected);
    check('T3 · กดแก้ไขโดยไม่ผ่านหน้ารายชื่อ → Dropdown ครบ',
      opts && opts.length === 11, opts ? 'option=' + opts.length : 'ไม่พบ select');
    check('T4 · เลือกแผนกเดิมอัตโนมัติด้วย department_id',
      sel && sel.length === 1 && sel[0].value === 'dept-3', sel && sel.length ? sel[0].text : 'ไม่มีตัวที่ selected');
    check('T4 · โหลดพร้อมกัน njhr_emp_get + njhr_emp_departments',
      E.calls.indexOf('njhr_emp_get') >= 0 && E.calls.indexOf('njhr_emp_departments') >= 0,
      'calls=' + E.calls.join(','));
  }

  /* --- T5 · แก้ไขพนักงานที่มีแต่ department_name (ไม่มี department_id) → fallback ตามชื่อ --- */
  {
    const E = makeEnv({ empData: { id: 'e9', emp_code: 'NJ9', first_name: 'ก', last_name: 'ข',
      department_id: null, department_name: 'ไอที', start_date: '2020-01-01' } });
    E.run('views/employees/list.js');
    E.run('views/employees/form.js');
    E.NJHR.features.employeesForm.open('e9', E.win.document.getElementById('app'));
    await tick(); await tick(); await tick();
    const opts = deptSelectOf(E.modal() && E.modal().body);
    const sel = opts && opts.filter(o => o.selected);
    check('T5 · ไม่มี department_id → fallback เทียบ department_name',
      sel && sel.length === 1 && sel[0].text === 'ไอที', sel && sel.length ? sel[0].text : 'ไม่มีตัวที่ selected');
  }

  /* --- T6 · พนักงานที่ไม่มีแผนก → — ไม่ระบุ — --- */
  {
    const E = makeEnv({ empData: { id: 'e0', emp_code: 'NJ0', first_name: 'ก', last_name: 'ข',
      department_id: null, department_name: null, start_date: '2020-01-01' } });
    E.run('views/employees/list.js');
    E.run('views/employees/form.js');
    E.NJHR.features.employeesForm.open('e0', E.win.document.getElementById('app'));
    await tick(); await tick(); await tick();
    const opts = deptSelectOf(E.modal() && E.modal().body);
    const sel = opts && opts.filter(o => o.selected);
    check('T6 · พนักงานไม่มีแผนก → ไม่มีแผนกใดถูกเลือก (เหลือ — ไม่ระบุ —)',
      opts && opts.length === 11 && sel && sel.length === 0, opts ? 'option=' + opts.length + ' selected=' + (sel || []).length : 'ไม่พบ select');
  }

  /* --- T7 · แผนกเดิมถูกลบไปแล้ว → ยังเตือนเหมือนเดิม (logic เดิมต้องไม่หาย) --- */
  {
    const E = makeEnv({ empData: { id: 'e8', emp_code: 'NJ8', first_name: 'ก', last_name: 'ข',
      department_id: null, department_name: 'แผนกที่ถูกลบ', start_date: '2020-01-01' } });
    E.run('views/employees/list.js');
    E.run('views/employees/form.js');
    E.NJHR.features.employeesForm.open('e8', E.win.document.getElementById('app'));
    await tick(); await tick(); await tick();
    const body = E.modal() && E.modal().body;
    check('T7 · แผนกเดิมไม่มีในระบบแล้ว → ยังเตือนเหมือนเดิม',
      body && body.indexOf('ไม่มีในระบบแล้ว') >= 0, body ? 'มีข้อความเตือน' : 'ไม่พบ modal');
  }

  /* --- T8 · RPC แผนกล้มเหลว → ไม่เปิดฟอร์ม + แจ้ง Error ชัดเจน --- */
  {
    const E = makeEnv({ deptFail: true });
    E.run('views/employees/list.js');
    E.run('views/employees/form.js');
    E.NJHR.features.employeesForm.open(null, E.win.document.getElementById('app'));
    await tick(); await tick(); await tick();
    const t = E.toast();
    check('T8 · โหลดแผนกไม่สำเร็จ → ไม่เปิดฟอร์มว่าง',
      E.modal() === null, E.modal() ? 'เปิดฟอร์มทั้งที่โหลดแผนกไม่สำเร็จ' : 'ไม่เปิดฟอร์ม');
    check('T8 · แจ้งข้อความชัดเจน + เป็น error',
      t && t.type === 'error' && t.msg.indexOf('โหลดรายชื่อแผนกไม่สำเร็จ') >= 0, t ? t.msg : 'ไม่มี toast');
  }

  /* --- T9 · RPC แผนกล้มเหลวตอนแก้ไข → ไม่เปิดฟอร์ม กันบันทึก department_id ผิด --- */
  {
    const E = makeEnv({ deptFail: true, empData: { id: 'e1', department_id: 'dept-1', department_name: 'บัญชี' } });
    E.run('views/employees/list.js');
    E.run('views/employees/form.js');
    E.NJHR.features.employeesForm.open('e1', E.win.document.getElementById('app'));
    await tick(); await tick(); await tick();
    const t = E.toast();
    check('T9 · แก้ไข + โหลดแผนกไม่สำเร็จ → ไม่เปิดฟอร์ม',
      E.modal() === null && t && t.type === 'error', t ? t.msg : 'ไม่มี toast');
  }

  /* --- T10 · เปิดฟอร์มซ้ำหลายครั้ง → ไม่ยิง RPC แผนกซ้ำ --- */
  {
    const E = makeEnv({});
    E.run('views/employees/list.js');
    E.run('views/employees/form.js');
    const host = E.win.document.getElementById('app');
    E.NJHR.features.employeesForm.open(null, host); await tick(); await tick();
    E.NJHR.features.employeesForm.open(null, host); await tick(); await tick();
    E.NJHR.features.employeesForm.open(null, host); await tick(); await tick();
    const n = E.calls.filter(c => c === 'njhr_emp_departments').length;
    const opts = deptSelectOf(E.modal() && E.modal().body);
    check('T10 · เปิดฟอร์ม 3 ครั้ง → ยิง njhr_emp_departments แค่ครั้งเดียว',
      n === 1, 'เรียก ' + n + ' ครั้ง');
    check('T10 · ครั้งที่ 3 ยังได้ Dropdown ครบ', opts && opts.length === 11, opts ? 'option=' + opts.length : '-');
  }

  /* --- T11 · หน้ารายชื่อยังทำงานเหมือนเดิม (ตัวกรองแผนกในหน้า List) --- */
  {
    const E = makeEnv({});
    E.run('views/employees/list.js');
    const host = E.win.document.getElementById('app');
    E.win.NJHR.features.employees.refresh(host);
    await tick(); await tick(); await tick();
    const sel = E.win.document.getElementById('emp-dept');
    const n = sel ? sel.querySelectorAll('option').length : 0;
    check('T11 · ตัวกรองแผนกหน้ารายชื่อยังครบเหมือนเดิม',
      n === 11, 'option=' + n + ' (ทุกแผนก + 10)');
    check('T11 · ยอดรวมในวงเล็บยังคำนวณเหมือนเดิม',
      sel && sel.querySelector('option').textContent.indexOf('(145)') >= 0,
      sel ? sel.querySelector('option').textContent : '-');
  }

  /* --- T12 · empDepts ที่ publish ผ่าน NJHR.compat.scope เป็นตัวเดียวกันจริง --- */
  {
    const E = makeEnv({});
    E.run('views/employees/list.js');
    const published = E.NJHR.compat.scope.empDepts;
    E.win.NJHR.features.employees.refresh(E.win.document.getElementById('app'));
    await tick(); await tick(); await tick();
    check('T12 · NJHR.compat.scope.empDepts สะท้อนข้อมูลหลังโหลดเสร็จ',
      published && published.length === 10, 'length=' + (published ? published.length : 'n/a'));
  }

  /* ---------- สรุป ---------- */
  const pass = results.filter(r => r.pass).length;
  const fail = results.length - pass;
  console.log('\n**PASS ' + pass + ' · FAIL ' + fail + '**');
  process.exit(fail ? 1 : 0);
})();
