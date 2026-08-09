/* selfservice_test.js — ทดสอบ Employee Self Service (USER / ADMIN / SUPER_ADMIN)
   โหลด chunk ที่ build แล้วจริง (views/employees/list.js + views/employees/documents.js)
   ลง jsdom · stub เฉพาะ NJHR.compat.scope ตามสัญญาเดิม · ไม่แตะ Supabase จริง

   ตรวจตามข้อกำหนด:
     ข้อ 2   USER/ADMIN เห็น Employee ตัวเอง 1 คน · ห้าม Query ทั้งบริษัท
     ข้อ 4   แก้ได้เฉพาะ 7 ช่อง
     ข้อ 6   ยังไม่ครบ → บอกว่าขาดช่องใด
     ข้อ 8   ข้อมูลการทำงานไม่นับรวมความครบถ้วน
     ข้อ 9   บันทึกส่ง Payload เฉพาะ 7 field
     ข้อ 11  เอกสารบังคับ 3 รายการ
     ข้อ 13  เอกสารไม่ครบ → บอกว่าขาดรายการใด
     ข้อ 24  ซ่อน Toolbar บริหารทั้งหมด
     ข้อ 25  SUPER_ADMIN ใช้หน้าเดิมครบ

   ต้องมี jsdom:  npm i -D jsdom
   วิธีใช้: node harness/selfservice_test.js [ทางโปรเจกต์]                        */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(process.argv[2] || '.');

const ME_FULL = {
  perm: { role: 'EMPLOYEE', self_role: 'USER', username: 'user1', can_edit_personal: true,
          editable_fields: ['nickname','birth_date','national_id','phone','email','address','emergency_phone'] },
  employee: {
    id: 'emp-0001', emp_code: 'NJ0001', photo_url: null, prefix: 'นาย',
    first_name: 'สมชาย', last_name: 'ใจดี', full_name: 'นายสมชาย ใจดี',
    department_name: 'ขนส่ง', position_name: 'พนักงานขับรถ', level: '',
    start_date: '2020-01-15', emp_type: 'MONTHLY', status: 'ACTIVE',
    work_start: '08:30', work_end: '17:30',
    nickname: 'ชาย', birth_date: '1990-05-01', national_id: '1234567890123',
    phone: '0812345678', email: 'somchai@njl.test', address: '99 หมู่ 1',
    emergency_phone: '0899999999' },
  personal: { complete: true, filled: 7, total: 7, missing: [] },
  documents: { complete: true, filled: 3, total: 3, missing: [],
    items: [ { doc_kind: 'ID_CARD', label: 'บัตรประชาชน', uploaded: true, file: { id: 'f1', file_name: 'idcard.pdf' } },
             { doc_kind: 'HOUSE_REG', label: 'ทะเบียนบ้าน', uploaded: true, file: { id: 'f2', file_name: 'house.pdf' } },
             { doc_kind: 'EDUCATION', label: 'วุฒิการศึกษา', uploaded: true, file: { id: 'f3', file_name: 'edu.pdf' } } ] },
  overall_complete: true
};

function meIncomplete() {
  const d = JSON.parse(JSON.stringify(ME_FULL));
  d.employee.email = ''; d.employee.address = ''; d.employee.emergency_phone = '';
  d.personal = { complete: false, filled: 4, total: 7, missing: [
    { field: 'email', label: 'อีเมล' },
    { field: 'address', label: 'ที่อยู่' },
    { field: 'emergency_phone', label: 'เบอร์โทรติดต่อฉุกเฉิน' } ] };
  d.documents.items[2] = { doc_kind: 'EDUCATION', label: 'วุฒิการศึกษา', uploaded: false, file: null };
  d.documents = Object.assign(d.documents, { complete: false, filled: 2, total: 3, missing: ['วุฒิการศึกษา'] });
  d.overall_complete = false;
  return d;
}

const results = [];
function check(name, cond, detail) {
  results.push({ name, pass: !!cond, detail: detail || '' });
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (detail ? '  · ' + detail : ''));
}
const tick = () => new Promise(r => setTimeout(r, 0));

function makeEnv(opt) {
  opt = opt || {};
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div><div id="modal-root"></div></body></html>');
  const win = dom.window;
  const calls = [];
  const payloads = [];
  let lastModal = null, lastToast = null;

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function rpcList(fn, body) { calls.push(fn); payloads.push({ fn, body });
    if (fn === 'njhr_emp_departments') return Promise.resolve([]);
    if (fn === 'njhr_emp_list') return Promise.resolve(opt.empRows || []);
    return Promise.resolve([]); }

  function rpc(fn, body) {
    calls.push(fn); payloads.push({ fn, body });
    if (fn === 'njhr_me_get') {
      if (opt.meFail) return Promise.reject(new Error('เซสชันหมดอายุ'));
      return Promise.resolve({ data: opt.me || ME_FULL });
    }
    if (fn === 'njhr_emp_get') {
      return Promise.resolve({ data: opt.empData || {} });
    }
    if (fn === 'njhr_emp_status') {
      if (opt.statusFail) return Promise.reject(new Error('วันที่ลาออกต้องไม่ก่อนวันที่เริ่มงาน'));
      return Promise.resolve({});
    }
    if (fn === 'njhr_me_save') {
      if (opt.saveFail) return Promise.reject(new Error('เลขบัตรประชาชนนี้ถูกใช้ไปแล้ว'));
      return Promise.resolve({ data: ME_FULL });
    }
    if (fn === 'njhr_empfile_list') {
      return Promise.resolve({ data: {
        employee: { id: 'emp-0001', emp_code: 'NJ0001', full_name: 'นายสมชาย ใจดี',
                    department_name: 'ขนส่ง', position_name: 'พนักงานขับรถ', status: 'ACTIVE' },
        perm: opt.filePerm || { role: 'EMPLOYEE', can_write: true, can_delete: false,
                                is_manager: false, is_owner: true },
        files: [], hr_docs: [] } });
    }
    return Promise.resolve({});
  }

  const NJHR = {
    state: { currentRoute: '#/employees' },
    router: { navId: () => 1, moduleMap: {} },
    modules: { isLoaded: () => true, load: () => Promise.resolve() },
    features: {}, views: { register: () => {} }, compat: { scope: {} }
  };
  Object.assign(NJHR.compat.scope, {
    icon: () => '', esc, debounce: f => f,
    avatarHTML: () => '<span class="avatar"></span>',
    emptyState: m => '<div>' + m + '</div>',
    emp: () => ({}), dept: () => 'ขนส่ง', db: { employees: [] },
    currentUser: () => opt.user || { id: 'u1', username: 'user1', role: 'USER', empId: 'emp-0001' },
    currentEmp: () => ({ id: 'emp-0001' }),
    toast: (m, t) => { lastToast = { msg: m, type: t }; },
    sbReady: () => true, sbRpcList: rpcList, sbRpc: rpc, sbToken: () => 'tok',
    empBE: d => d || '', todayISO: () => '2026-01-01', money: String, njAsset: a => a,
    loadScriptOnce: () => Promise.resolve(), withButtonLoading: (b, t, f) => f(),
    ssoBindForm: () => {}, ssoFormPayload: () => ({}),
    nav: () => {}, docState: {}, docStat: s => ({ t: s, c: '', em: '' }),
    docTypeLabel: t => t,
    EMP_STATUS: [['ACTIVE', 'ทำงานอยู่'], ['RESIGNED', 'พ้นสภาพ']],
    EMP_STATUS_MAP: { ACTIVE: 'ทำงานอยู่', RESIGNED: 'พ้นสภาพ' },
    EMP_TYPE_OPTS: ['MONTHLY', 'DAILY'],
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
    win, NJHR, calls, payloads,
    run: rel => vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }),
    host: () => win.document.getElementById('app'),
    html: () => win.document.getElementById('app').innerHTML,
    modal: () => lastModal,
    // empfRender() เขียน innerHTML ลง #modal-root .modal-body โดยตรง ไม่ผ่าน openModal
    // จึงต้องอ่านจาก DOM จริง ไม่ใช่จาก argument ที่ openModal ได้รับตอนเปิด
    modalBody: () => {
      const b = win.document.querySelector('#modal-root .modal-body');
      return b ? b.innerHTML : '';
    },
    toast: () => lastToast
  };
}

function openEmployees(E) {
  E.run('views/employees/list.js');
  const view = E.NJHR.__view || null;
  // chunk ลงทะเบียน viewEmployees ผ่าน NJHR.views.register — ดักไว้ตอน run
  return view;
}

/* ---------- ดัก viewEmployees ที่ chunk ลงทะเบียน ---------- */
function makeEnvWithView(opt) {
  const E = makeEnv(opt);
  let viewFn = null;
  E.NJHR.views.register = (name, fn) => { if (name === 'viewEmployees') viewFn = fn; };
  E.run('views/employees/list.js');
  E.view = el => viewFn(el);
  return E;
}

(async function () {

  /* ================= USER — Self Service ================= */
  console.log('\n--- USER · Self Service ---');
  {
    const E = makeEnvWithView({});
    E.view(E.host());
    await tick(); await tick();
    const h = E.html();

    check('S1 · USER เข้า #/employees แล้วได้ Self Service ไม่ใช่รายชื่อทั้งบริษัท',
      h.indexOf('นายสมชาย ใจดี') >= 0 && h.indexOf('emp-table') < 0,
      'พบชื่อตัวเอง · ไม่มีตารางรายชื่อ');

    check('S2 · ห้าม Query พนักงานทั้งบริษัท (njhr_emp_list / njhr_emp_departments)',
      E.calls.indexOf('njhr_emp_list') < 0 && E.calls.indexOf('njhr_emp_departments') < 0,
      'calls=' + E.calls.join(','));

    check('S3 · ใช้ njhr_me_get และไม่ส่ง employee_id จาก browser',
      E.calls.indexOf('njhr_me_get') >= 0 &&
      Object.keys(E.payloads.find(p => p.fn === 'njhr_me_get').body).join(',') === 'p_token',
      'params=' + Object.keys(E.payloads.find(p => p.fn === 'njhr_me_get').body).join(','));

    // ข้อ 24 — ซ่อน Toolbar บริหาร
    const banned = [['emp-q','ค้นหา'], ['emp-dept','ตัวกรองแผนก'], ['emp-status','ตัวกรองสถานะ'],
                    ['emp-sort','เรียงลำดับ'], ['emp-add','เพิ่มพนักงาน'], ['emp-import','นำเข้า Excel'],
                    ['emp-export','Export Excel'], ['emp-tpl','ดาวน์โหลดเทมเพลต'], ['emp-pager','แบ่งหน้า']];
    const leaked = banned.filter(b => h.indexOf('id="' + b[0] + '"') >= 0);
    check('S4 · ซ่อน Toolbar บริหารครบทั้ง 9 รายการ',
      leaked.length === 0, leaked.length ? 'หลุด: ' + leaked.map(x => x[1]).join(',') : 'ไม่มีรายการใดหลุด');

    // ข้อ 4 — แก้ได้เฉพาะ 7 ช่อง
    const inputs = [...h.matchAll(/<input[^>]*name="([^"]+)"/g)].map(m => m[1]).sort();
    const expect = ['address','birth_date','email','emergency_phone','national_id','nickname','phone'].sort();
    check('S5 · ฟอร์มมี input เฉพาะ 7 ช่องที่อนุญาต',
      JSON.stringify(inputs) === JSON.stringify(expect), 'input=' + inputs.join(','));

    // ข้อ 7 — ข้อมูลบริษัทต้องไม่มี input
    const locked = ['emp_code','first_name','last_name','department_id','position_name',
                    'start_date','emp_type','status','base_salary','role'];
    const editable = locked.filter(k => h.indexOf('name="' + k + '"') >= 0);
    check('S6 · ข้อมูลบริษัท/เงินเดือนไม่มีช่องกรอกเลย',
      editable.length === 0, editable.length ? 'หลุด: ' + editable.join(',') : 'ไม่มี input ของ field ต้องห้าม');

    check('S7 · ไม่มีปุ่ม "ส่งตรวจ" ตามที่ตกลง',
      h.indexOf('ส่งตรวจ') < 0, 'ไม่พบข้อความ "ส่งตรวจ"');

    check('S8 · ข้อมูลครบ → แสดง ✅ ข้อมูลพนักงานครบถ้วน',
      h.indexOf('ข้อมูลพนักงานครบถ้วน') >= 0 && h.indexOf('ยังไม่ครบถ้วน') < 0, 'แสดงสถานะครบ');
  }

  /* ================= USER — ข้อมูลไม่ครบ ================= */
  console.log('\n--- USER · ข้อมูลยังไม่ครบ ---');
  {
    const E = makeEnvWithView({ me: meIncomplete() });
    E.view(E.host());
    await tick(); await tick();
    const h = E.html();

    check('S9 · บอกชื่อช่องที่ขาดจริง ไม่ใช่แค่ "ข้อมูลไม่ครบ"',
      h.indexOf('อีเมล') >= 0 && h.indexOf('ที่อยู่') >= 0 && h.indexOf('เบอร์โทรติดต่อฉุกเฉิน') >= 0,
      'ระบุครบทั้ง 3 ช่อง');
    check('S10 · แสดงจำนวน 4/7',
      h.indexOf('4/7') >= 0, 'พบ 4/7');
    check('S11 · บอกเอกสารที่ขาดเป็นชื่อรายการ',
      h.indexOf('เอกสารยังไม่ครบ') >= 0 && h.indexOf('วุฒิการศึกษา') >= 0, 'ขาด: วุฒิการศึกษา');
    check('S12 · แสดง ✅/❌ รายเอกสาร',
      h.indexOf('✅ บัตรประชาชน') >= 0 && h.indexOf('❌ วุฒิการศึกษา') >= 0, 'เช็กลิสต์ถูกต้อง');
    check('S13 · ไม่ครบ → แสดง ⚠ ข้อมูลพนักงานยังไม่ครบถ้วน',
      h.indexOf('ยังไม่ครบถ้วน') >= 0, 'แสดงสถานะไม่ครบ');
  }

  /* ================= USER — บันทึก ================= */
  console.log('\n--- USER · บันทึกข้อมูล ---');
  {
    const E = makeEnvWithView({ me: meIncomplete() });
    E.view(E.host());
    await tick(); await tick();
    const d = E.win.document;
    d.querySelector('[name="email"]').value = 'new@njl.test';
    d.querySelector('[name="address"]').value = '  1 ถนนทดสอบ  ';
    d.querySelector('[name="emergency_phone"]').value = '0888888888';
    const btn = d.getElementById('me-save');
    btn.onclick.call(btn);
    await tick(); await tick(); await tick();

    const p = E.payloads.find(x => x.fn === 'njhr_me_save');
    const keys = p ? Object.keys(p.body.p_data).sort() : [];
    const expect = ['address','birth_date','email','emergency_phone','national_id','nickname','phone'].sort();
    check('S14 · Payload มีเฉพาะ 7 key ที่อนุญาต',
      JSON.stringify(keys) === JSON.stringify(expect), 'keys=' + keys.join(','));
    check('S15 · Payload ไม่มี field ต้องห้ามแม้แต่ตัวเดียว',
      p && !['id','emp_code','base_salary','role','department_id','status','employee_id']
              .some(k => k in p.body.p_data), 'ไม่มี field บริษัทหลุด');
    check('S16 · Trim ช่องว่างหัวท้ายก่อนส่ง',
      p && p.body.p_data.address === '1 ถนนทดสอบ', 'address="' + (p ? p.body.p_data.address : '') + '"');
    check('S17 · บันทึกสำเร็จ → แจ้งผู้ใช้',
      E.toast() && E.toast().msg.indexOf('บันทึกข้อมูลส่วนตัวแล้ว') >= 0,
      E.toast() ? E.toast().msg : 'ไม่มี toast');
  }

  /* ================= USER — Validation หน้าจอ ================= */
  console.log('\n--- USER · Validation ---');
  {
    const E = makeEnvWithView({});
    E.view(E.host());
    await tick(); await tick();
    const d = E.win.document;
    d.querySelector('[name="national_id"]').value = '123';
    const btn = d.getElementById('me-save');
    btn.onclick.call(btn);
    await tick();
    check('S18 · เลขบัตรไม่ครบ 13 หลัก → ไม่ยิง RPC',
      E.calls.filter(c => c === 'njhr_me_save').length === 0 &&
      d.getElementById('me-err').textContent.indexOf('13 หลัก') >= 0,
      d.getElementById('me-err').textContent);

    d.querySelector('[name="national_id"]').value = '1234567890123';
    d.querySelector('[name="email"]').value = 'not-an-email';
    btn.onclick.call(btn);
    await tick();
    check('S19 · อีเมลผิดรูปแบบ → ไม่ยิง RPC',
      E.calls.filter(c => c === 'njhr_me_save').length === 0 &&
      d.getElementById('me-err').textContent.indexOf('อีเมล') >= 0,
      d.getElementById('me-err').textContent);
  }

  /* ================= USER — Error ================= */
  /* ================= ปุ่มลบพนักงาน (ใช้ njhr_emp_status เดิม) ================= */
  console.log('\n--- DEL) ลบพนักงาน ---');
  {
    const E = makeEnvWithView({ user: { id: 'u3', username: 'su', role: 'SUPER_ADMIN', empId: 'emp-0002' },
      empRows: [{ id: 'emp-0002', emp_code: 'NJ0002', full_name: 'สมหญิง ดีงาม',
                  department_name: 'บัญชี', start_date: '2020-01-01', emp_type: 'MONTHLY',
                  status: 'ACTIVE', total_count: 1 },
                { id: 'emp-0009', emp_code: 'NJ0009', full_name: 'พ้นสภาพ แล้ว',
                  department_name: 'ขนส่ง', start_date: '2019-01-01', emp_type: 'MONTHLY',
                  status: 'RESIGNED', total_count: 1 }] });
    E.view(E.host());
    await tick(); await tick(); await tick();
    const h = E.html();
    check('DEL1 · มีปุ่มลบในคอลัมน์จัดการ',
      /data-emp-del=/.test(h), 'พบ ' + (h.match(/data-emp-del=/g) || []).length + ' ปุ่ม');
    check('DEL2 · ปุ่มลบอยู่ท้ายสุด (หลังเปลี่ยนสถานะ)',
      (() => { const i = h.indexOf('data-emp-status='), j = h.indexOf('data-emp-del=');
               return i >= 0 && j > i; })(), 'ลำดับถูกต้อง');
    check('DEL3 · Tooltip = "ลบพนักงาน"', /title="ลบพนักงาน"/.test(h), 'มี title');
    check('DEL4 · ใช้ btn-icon เหมือนปุ่มอื่น',
      /class="btn-icon ic-red" data-emp-del=/.test(h), 'ขนาด/ระยะห่างเท่ากัน');
    check('DEL4b · พนักงานที่พ้นสภาพแล้วไม่มีปุ่มลบ',
      h.indexOf('data-emp-del="emp-0009"') < 0 && h.indexOf('data-emp-del="emp-0002"') >= 0,
      'ซ่อนปุ่มสำหรับ RESIGNED');
  }
  {
    const E = makeEnvWithView({ user: { id: 'u3', username: 'su', role: 'SUPER_ADMIN', empId: 'emp-0002' },
                                getId: 'emp-0002',
                                empData: { id: 'emp-0002', emp_code: 'NJ0002',
                                           first_name: 'สมหญิง', last_name: 'ดีงาม' } });
    E.run('views/employees/form.js');
    E.NJHR.features.employeesForm.remove('emp-0002', E.host());
    await tick(); await tick(); await tick();
    const m = E.modal();
    check('DEL5 · Modal หัวข้อ "ยืนยันการลบพนักงาน"',
      m && m.title === 'ยืนยันการลบพนักงาน', m ? m.title : 'ไม่เปิด');
    check('DEL6 · ข้อความมีชื่อและรหัสพนักงาน',
      m && m.body.indexOf('สมหญิง ดีงาม') >= 0 && m.body.indexOf('NJ0002') >= 0, 'ระบุตัวบุคคลชัดเจน');
    check('DEL7 · มีปุ่ม ยกเลิก + ลบพนักงาน สีแดง',
      m && m.footer.indexOf('empdel-cancel') >= 0 && m.footer.indexOf('btn-danger') >= 0, 'btn-danger');
    check('DEL8 · แจ้งว่าข้อมูลเดิมยังอยู่ครบ',
      m && m.body.indexOf('ยังคงอยู่ครบ') >= 0, 'ไม่ทำให้เข้าใจผิด');

    const d = E.win.document, ok = d.getElementById('empdel-ok');
    ok.onclick.call(ok);
    await tick(); await tick(); await tick();
    const p = E.payloads.find(x => x.fn === 'njhr_emp_status');
    check('DEL9 · เรียก RPC เดิม njhr_emp_status', !!p, p ? 'เรียกแล้ว' : 'ไม่ได้เรียก');
    check('DEL10 · ส่ง RESIGNED + วันที่พ้นสภาพ',
      p && p.body.p_status === 'RESIGNED' && !!p.body.p_resign_date,
      p ? 'resign_date=' + p.body.p_resign_date : '-');
    check('DEL11 · ไม่เรียก RPC ลบใด ๆ',
      !E.calls.some(c => /delete|remove|drop/i.test(c)), 'calls=' + [...new Set(E.calls)].join(','));
    check('DEL12 · แจ้ง "ลบพนักงานเรียบร้อยแล้ว"',
      E.toast() && E.toast().msg.indexOf('ลบพนักงานเรียบร้อยแล้ว') >= 0,
      E.toast() ? E.toast().msg : 'ไม่มี toast');
  }
  {
    const E = makeEnvWithView({ user: { id: 'u3', username: 'su', role: 'SUPER_ADMIN', empId: 'emp-0002' },
                                statusFail: true });
    E.run('views/employees/form.js');
    E.NJHR.features.employeesForm.remove('emp-0001', E.host());
    await tick(); await tick(); await tick();
    const d = E.win.document, ok = d.getElementById('empdel-ok');
    ok.onclick.call(ok);
    await tick(); await tick(); await tick();
    check('DEL13 · ล้มเหลว → คืนปุ่ม + แสดง Error',
      ok.disabled === false && d.getElementById('empdel-err').textContent.length > 0,
      d.getElementById('empdel-err').textContent);
    check('DEL14 · Modal ไม่ปิด ข้อมูลบนจอไม่หาย', E.modal() !== null, 'ยังเปิดอยู่');
  }

  console.log('\n--- USER · Error handling ---');
  {
    const E = makeEnvWithView({ meFail: true });
    E.view(E.host());
    await tick(); await tick();
    check('S20 · โหลดไม่สำเร็จ → แสดง Error + ปุ่มลองใหม่',
      E.html().indexOf('เซสชันหมดอายุ') >= 0 && E.html().indexOf('me-retry') >= 0, 'มีปุ่มลองใหม่');
  }
  {
    const E = makeEnvWithView({ saveFail: true });
    E.view(E.host());
    await tick(); await tick();
    const d = E.win.document, btn = d.getElementById('me-save');
    btn.onclick.call(btn);
    await tick(); await tick(); await tick();
    check('S21 · บันทึกไม่สำเร็จ → แสดงข้อความจากเซิร์ฟเวอร์ + คืนสถานะปุ่ม',
      d.getElementById('me-err').textContent.indexOf('ถูกใช้ไปแล้ว') >= 0 && btn.disabled === false,
      'btn.disabled=' + btn.disabled);
  }

  /* ================= ADMIN ================= */
  console.log('\n--- ADMIN · ต้องเหมือน USER ---');
  {
    const E = makeEnvWithView({ user: { id: 'u2', username: 'admin1', role: 'ADMIN', empId: 'emp-0001' } });
    E.view(E.host());
    await tick(); await tick();
    const h = E.html();
    check('A1 · ADMIN ได้ Self Service เหมือน USER',
      h.indexOf('นายสมชาย ใจดี') >= 0 && h.indexOf('emp-table') < 0, 'ไม่ได้รายชื่อทั้งบริษัท');
    check('A2 · ADMIN ไม่เห็นปุ่มเพิ่มพนักงาน / Import / Export',
      h.indexOf('emp-add') < 0 && h.indexOf('emp-import') < 0 && h.indexOf('emp-export') < 0, 'ซ่อนครบ');
    check('A3 · ADMIN ไม่ Query พนักงานทั้งบริษัท',
      E.calls.indexOf('njhr_emp_list') < 0, 'calls=' + E.calls.join(','));
  }

  /* ================= SUPER_ADMIN ================= */
  console.log('\n--- SUPER_ADMIN · ต้องได้หน้าเดิมครบ ---');
  {
    const E = makeEnvWithView({ user: { id: 'u3', username: 'su', role: 'SUPER_ADMIN', empId: 'emp-0002' } });
    E.view(E.host());
    await tick(); await tick(); await tick();
    const h = E.html();
    const need = [['emp-q','ค้นหา'], ['emp-dept','ตัวกรองแผนก'], ['emp-status','ตัวกรองสถานะ'],
                  ['emp-sort','เรียงลำดับ'], ['emp-add','เพิ่มพนักงาน'], ['emp-import','นำเข้า'],
                  ['emp-export','Export'], ['emp-tpl','เทมเพลต'], ['emp-table','ตาราง']];
    const missing = need.filter(n => h.indexOf('id="' + n[0] + '"') < 0);
    check('P1 · SUPER_ADMIN ยังได้ Employee Management เดิมครบ 9 ส่วน',
      missing.length === 0, missing.length ? 'ขาด: ' + missing.map(x => x[1]).join(',') : 'ครบทุกส่วน');
    check('P2 · SUPER_ADMIN ยัง Query รายชื่อทั้งบริษัทได้ตามเดิม',
      E.calls.indexOf('njhr_emp_list') >= 0 && E.calls.indexOf('njhr_emp_departments') >= 0,
      'calls=' + E.calls.join(','));
    check('P3 · SUPER_ADMIN ไม่เรียก njhr_me_get',
      E.calls.indexOf('njhr_me_get') < 0, 'ไม่ปนกับ Self Service');
  }

  /* ================= เอกสารของฉัน ================= */
  console.log('\n--- เอกสาร · เจ้าของเปิดแฟ้มตัวเอง ---');
  {
    const E = makeEnvWithView({});
    E.run('views/employees/documents.js');
    E.NJHR.features.employeesDocs.open('emp-0001');
    await tick(); await tick();
    const b = E.modalBody();
    check('D1 · เจ้าของเปิดแฟ้มเอกสารตัวเองได้',
      b.indexOf('นายสมชาย ใจดี') >= 0, b ? 'เปิดได้' : 'ไม่เปิด');
    check('D2 · เจ้าของมีปุ่มแนบไฟล์ในหมวด PERSONAL',
      b.indexOf('data-ef-add="PERSONAL|ID_CARD"') >= 0 &&
      b.indexOf('data-ef-add="PERSONAL|HOUSE_REG"') >= 0 &&
      b.indexOf('data-ef-add="PERSONAL|EDUCATION"') >= 0, 'ครบทั้ง 3 รายการ');
    check('D3 · เจ้าของแนบหมวด COMPANY ไม่ได้',
      b.indexOf('data-ef-add="COMPANY|') < 0, 'ไม่มีปุ่มแนบหมวด COMPANY');
    check('D4 · เจ้าของไม่มีปุ่มลบ (can_delete = false)',
      b.indexOf('data-ef-del=') < 0, 'ไม่มีปุ่มลบ');
  }
  {
    // ผู้ที่ไม่ใช่เจ้าของและไม่มีสิทธิ์บริหาร → เปิดแฟ้มคนอื่นไม่ได้
    const E = makeEnvWithView({ user: { id: 'u1', username: 'user1', role: 'USER', empId: 'emp-0001' } });
    E.run('views/employees/documents.js');
    E.NJHR.features.employeesDocs.open('emp-9999');
    await tick(); await tick();
    check('D5 · USER เปิดแฟ้มเอกสารคนอื่นไม่ได้',
      E.modal() === null && E.toast() && E.toast().type === 'error',
      E.toast() ? E.toast().msg : 'ไม่มี toast');
  }
  {
    // SUPER_ADMIN → เห็นปุ่มแนบทุกหมวด + ปุ่มลบ
    const E = makeEnvWithView({
      user: { id: 'u3', username: 'su', role: 'SUPER_ADMIN', empId: 'emp-0002' },
      filePerm: { role: 'SUPER_ADMIN', can_write: true, can_delete: true, is_manager: true, is_owner: false } });
    E.run('views/employees/documents.js');
    E.NJHR.features.employeesDocs.open('emp-0001');
    await tick(); await tick();
    const b = E.modalBody();
    check('D6 · SUPER_ADMIN แนบได้ทั้ง PERSONAL และ COMPANY',
      b.indexOf('data-ef-add="PERSONAL|ID_CARD"') >= 0 &&
      b.indexOf('data-ef-add="COMPANY|CONTRACT"') >= 0, 'ครบทั้ง 2 หมวด');
    check('D7 · SUPER_ADMIN ยังไม่เสียสิทธิ์เดิม (แฟ้มพนักงานคนอื่น)',
      b.indexOf('นายสมชาย ใจดี') >= 0, 'เปิดแฟ้มคนอื่นได้');
  }

  const pass = results.filter(r => r.pass).length;
  const fail = results.length - pass;
  console.log('\n**PASS ' + pass + ' · FAIL ' + fail + '**');
  process.exit(fail ? 1 : 0);
})();
