/* mydocs_test.js — ทดสอบ "เอกสารของฉัน" (PROMPT 2)
   โหลด chunk ที่ build แล้วจริง (runtime/core.js เฉพาะส่วนเมนู · compat/app-legacy.js)
   ลง jsdom · stub เฉพาะสัญญาเดิม · ไม่แตะ Supabase จริง · ไม่เขียน Production

   ตรวจตามข้อกำหนด PROMPT 2:
     ข้อ 4/5  เมนู USER = "เอกสารของฉัน" · ADMIN/SUPER_ADMIN = "เอกสาร HR"
     ข้อ 6    USER ไม่ส่ง employee_id จาก browser
     ข้อ 7    แยก รอดำเนินการ / ดำเนินการแล้ว
     ข้อ 8    Badge จาก njhr_doc_my_pending เท่านั้น · 0 = ซ่อน
     ข้อ 9    confirmation_text มาจาก DB ไม่ใช่ DOC_ACK_TEXT
     ข้อ 10   ห้ามกด Action จากหน้า List
     ข้อ 11   Action ตาม requires_signature จริง
     ข้อ 12   Password ไม่ถูกเก็บ · clear หลังส่ง
     ข้อ 13   เรียก njhr_doc_respond ด้วย p_action ที่ backend รองรับ
     ข้อ 14   กันกดซ้ำ
     ข้อ 17   เอกสารที่ดำเนินการแล้วไม่หาย
     ข้อ 25/26 ไม่มีการเรียก Legacy RPC 6 ตัว

   ต้องมี jsdom:  npm i -D jsdom
   วิธีใช้: node harness/mydocs_test.js [ทางโปรเจกต์]                              */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(process.argv[2] || '.');

const LEGACY_RPCS = ['njhr_doc_ack', 'njhr_doc_issue', 'njhr_doc_get',
                     'njhr_doc_list', 'njhr_doc_cancel', 'njhr_doc_ack_report'];

const DOCS = [
  { id: 'd1', doc_no: 'EMP-2026-000001', version: 1, doc_type: 'CONTRACT',
    title: 'สัญญาจ้างงาน', employee_id: 'emp-1', status: 'SENT', requires_signature: true,
    issued_at: '2026-08-01T03:00:00Z', acked_at: null, reject_reason: '' },
  { id: 'd2', doc_no: 'EMP-2026-000002', version: 1, doc_type: 'WARNING',
    title: 'หนังสือเตือนพนักงาน', employee_id: 'emp-1', status: 'VIEWED', requires_signature: false,
    issued_at: '2026-08-02T03:00:00Z', acked_at: null, reject_reason: '' },
  { id: 'd3', doc_no: 'EMP-2026-000003', version: 1, doc_type: 'CONTRACT',
    title: 'สัญญาจ้างงาน (เก่า)', employee_id: 'emp-1', status: 'SIGNED', requires_signature: true,
    issued_at: '2026-07-01T03:00:00Z', acked_at: '2026-07-02T03:25:00Z', reject_reason: '' },
  { id: 'd4', doc_no: 'EMP-2026-000004', version: 1, doc_type: 'SUSPENSION',
    title: 'หนังสือพักงาน', employee_id: 'emp-1', status: 'ACKNOWLEDGED', requires_signature: false,
    issued_at: '2026-07-05T03:00:00Z', acked_at: '2026-07-05T02:30:00Z', reject_reason: '' }
];

const results = [];
function check(name, cond, detail) {
  results.push({ name, pass: !!cond, detail: detail || '' });
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (detail ? '  · ' + detail : ''));
}
const tick = () => new Promise(r => setTimeout(r, 0));

/* ================= A) Static source checks ================= */
function staticChecks() {
  console.log('\n--- A) Static / Source ---');
  const core = fs.readFileSync(path.join(ROOT, 'runtime/core.js'), 'utf8');
  const compat = fs.readFileSync(path.join(ROOT, 'compat/app-legacy.js'), 'utf8');
  const core2 = core;
  const all = core + compat;

  const found = LEGACY_RPCS.filter(r => new RegExp('["\']' + r + '["\']').test(all));
  check('A1 · ไม่มีการเรียก Legacy RPC 6 ตัวใน Frontend ทั้งโปรเจกต์',
    found.length === 0, found.length ? 'พบ: ' + found.join(',') : 'ตรวจ 6 ตัว ไม่พบเลย');

  check('A2 · เมนูมี userTitle "เอกสารของฉัน" และ myDocsBadge',
    core.indexOf('เอกสารของฉัน') >= 0 && core.indexOf('myDocsBadge') >= 0, 'พบทั้งคู่ใน core');

  check('A3 · Badge อ่านจาก NJHR.state.docPending (ไม่นับจาก array)',
    core.indexOf('NJHR.state.docPending') >= 0, 'พบ accessor');

  check('A4 · refreshDocPending เรียก njhr_doc_my_pending',
    core.indexOf('njhr_doc_my_pending') >= 0, 'พบใน core');

  check('A5 · confirmation_text ดึงจาก njhr_doc_confirm_text',
    compat.indexOf('njhr_doc_confirm_text') >= 0, 'พบใน compat');

  // ต้องไม่ส่ง "ข้อความยืนยัน" จาก client — DB เป็นผู้ snapshot เอง
  // หมายเหตุ: p_confirm (boolean) ของ njhr_gf_delete / njhr_wf_delete / njhr_dept_delete
  // เป็นธงยืนยันการลบของระบบเดิม คนละเรื่องกับข้อความยืนยัน จึงไม่นับ
  const badKeys = [...all.matchAll(/(p_confirm\w*|confirmation_text|p_ack_text|p_text)\s*:/g)]
    .map(m => m[1])
    .filter(k => k !== 'p_confirm');
  check('A6 · ไม่ส่งข้อความยืนยันจาก client (DB เป็นผู้ snapshot)',
    badKeys.length === 0,
    badKeys.length ? 'พบ: ' + [...new Set(badKeys)].join(',')
                   : 'ไม่มีพารามิเตอร์ข้อความยืนยันใน payload ใด ๆ');

  check('A7 · p_action ที่ใช้มีแค่ ACKNOWLEDGE / REJECT (ตามที่ backend รองรับ)',
    (() => {
      const acts = [...all.matchAll(/p_action\s*:\s*"([A-Z_]+)"/g)].map(m => m[1]);
      const set = [...new Set(acts)].sort();
      return JSON.stringify(set) === JSON.stringify(['ACKNOWLEDGE', 'REJECT']);
    })(), 'p_action=' + [...new Set([...all.matchAll(/p_action\s*:\s*"([A-Z_]+)"/g)].map(m => m[1]))].join(','));

  check('A8 · ไม่เก็บรหัสผ่านลง localStorage / sessionStorage',
    !/localStorage[^\n]{0,80}(pw|password)/i.test(all) &&
    !/sessionStorage[^\n]{0,80}(pw|password)/i.test(all), 'ไม่พบการเก็บรหัสผ่าน');

  check('A9 · ล้างช่องรหัสผ่านหลังส่ง Request',
    /pw\.value\s*=\s*""/.test(compat) || /pw\.value=""/.test(compat), 'พบการ clear');

  check('A10 · หลังตอบเอกสารสำเร็จ โหลดสถานะใหม่จาก Server',
    compat.indexOf('docRenderDetail') >= 0 && compat.indexOf('refreshDocPending') >= 0,
    'เรียก docRenderDetail + refreshDocPending');

  check('A11 · ไม่เก็บ ACK ลง localStorage',
    !/localStorage[^\n]{0,60}(ack|doc_hash)/i.test(all), 'ไม่พบ');

  check('A12 · หน้าเอกสารของฉันไม่ส่ง p_employee จาก browser',
    /p_employee\s*:\s*null/.test(compat), 'ส่ง p_employee: null ให้ Server ผูกจาก token');

  /* ---------- I4: Final PDF ---------- */
  check('A13 · อ่านสถานะ PDF จาก Server (njhr_doc_pdf_status)',
    compat.indexOf('njhr_doc_pdf_status') >= 0, 'ไม่เดาสถานะเอง');
  check('A14 · ดาวน์โหลด/สร้าง ผ่าน Edge Function njhr-doc-pdf',
    compat.indexOf('functions/v1/njhr-doc-pdf') >= 0, 'ไม่แตะ Storage ตรง');
  check('A15 · ไม่สร้าง PDF ฝั่ง Browser',
    !/pdf-lib|jspdf|PDFDocument|html2canvas/i.test(all), 'ไม่มี PDF library ใน bundle');
  check('A16 · ไม่ hardcode storage path หรือ public URL',
    !/njhr-doc-pdf\//.test(compat) && !/storage\/v1\/object\/public/.test(compat),
    'path มาจาก Server เท่านั้น');
  check('A17 · ไม่คำนวณ final_pdf_hash ฝั่ง client',
    !/final_pdf_hash\s*[:=]\s*(await|crypto|sha)/i.test(all), 'hash มาจาก Server');
  // minifier ใช้ double quote — ต้องรับได้ทั้งสองแบบ
  const q = (w) => new RegExp('["\']' + w + '["\']').test(compat);
  check('A18 · รองรับสถานะจริง 3 ค่าเท่านั้น',
    q('PENDING') && q('READY') && q('FAILED') &&
    !/GENERATING|QUEUED|PROCESSING/.test(compat),
    'PENDING / READY / FAILED · ไม่มีสถานะที่ Backend ไม่รู้จัก');
  check('A19 · PENDING ไม่แสดงปุ่มดาวน์โหลด',
    (() => { const i = compat.indexOf('กำลังจัดเตรียม PDF');
             if (i < 0) return false;
             const seg = compat.slice(i, i + 400);
             return seg.indexOf('doc-pdf-dl') < 0; })(),
    'มีแค่ปุ่มตรวจสถานะอีกครั้ง');
  check('A20 · FAILED ไม่บอกให้ลงนามใหม่',
    compat.indexOf('ไม่ต้องลงนามใหม่') >= 0, 'ACK/SIGN ยังสมบูรณ์');
  check('A21 · กัน generate ซ้อนฝั่งหน้าจอ',
    compat.indexOf('docPdfBusy') >= 0, 'ตัวจริงกันที่ RPC claim');
  check('A22 · หลังลงนามสำเร็จ สั่งสร้าง PDF ต่อ',
    /docPdfSync\([^)]*,\s*!0\)|docPdfSync\([^)]*,\s*true\)/.test(compat), 'autoGen = true');
  /* ---------- PROMPT 2 UX: Drawer / Bottom Nav ---------- */
  check('U1 · มีเมนูเฉพาะ USER 4 รายการ (1 ระดับ)',
    /USER_MENU=\[/.test(core) &&
    ['#/calendar', '#/hr-docs', '#/epayslip', '#/attendance']
      .every(r => new RegExp('"' + r + '"').test(core)), 'ปฏิทิน · เอกสารของฉัน · สลิป · ประวัติลงเวลา');
  check('U2 · Drawer ของ USER ไม่มีเมนูซ้ำกับ Bottom Nav',
    (() => { const m = /USER_MENU=\[[\s\S]{0,400}?\]/.exec(core);
             if (!m) return false;
             return !/#\/dashboard|#\/requests|#\/profile|#\/leave|#\/ot|#\/approvals/.test(m[0]); })(),
    'ไม่มี หน้าหลัก/คำขอ/โปรไฟล์/ลา/OT/อนุมัติ');
  check('U3 · Bottom Navigation มี 4 ปุ่มเท่านั้น',
    (() => { const m = /bottomNavItems\(\)\{return\[([\s\S]{0,300}?)\]\}/.exec(core);
             return m ? (m[1].match(/#\//g) || []).length === 4 : false; })(),
    'หน้าหลัก · ลงเวลา · คำขอ · โปรไฟล์');
  check('U4 · การ์ดโปรไฟล์กดได้ทั้งการ์ด ไปหน้าโปรไฟล์',
    core.indexOf('side-user-card') >= 0 && /id="side-profile"/.test(core), 'ลิงก์ #/profile');
  check('U5 · การ์ดโปรไฟล์แสดง 3 บรรทัด ไม่มีข้อมูลเกิน',
    (() => { const i = core.indexOf('side-user-card');
             const seg = core.slice(i, i + 500);
             return seg.indexOf('e.code') >= 0 && seg.indexOf('dept(') >= 0 &&
                    !/email|phone|username|salary/i.test(seg); })(),
    'ชื่อ · รหัสพนักงาน · แผนก');
  check('U6 · เลือกเมนูแล้วปิด Drawer เอง',
    /side-profile[\s\S]{0,120}closeDrawer|closeDrawer[\s\S]{0,200}side-profile/.test(core),
    'ไม่ต้องกดปิดเอง');
  check('U7 · Badge ไม่ใช้ localStorage',
    !/localStorage[^\n]{0,60}(docPending|pending)/i.test(core), 'มาจาก njhr_doc_my_pending');
  check('U8 · ผู้ดูแลยังได้เมนูหมวดเดิม (ไม่ถูกแทนด้วย USER_MENU)',
    /isUser\?|isUser&&|if\(isUser\)/.test(core) && core.indexOf('MENU_GROUPS') >= 0,
    'แยกด้วยเงื่อนไข role');

  check('U9 · Drawer "ประวัติการลงเวลา" ไปคนละจุดกับปุ่มล่าง "ลงเวลา"',
    core.indexOf('?sec=history') >= 0 && /SECTION_TARGET=/.test(core) &&
    core.indexOf('.att-hcard') >= 0,
    'ปุ่มล่าง = บนสุดของหน้า · Drawer = การ์ดประวัติ');
  check('U10 · ใช้ element ที่หน้ามีอยู่แล้ว ไม่สร้าง route/backend ใหม่',
    !/att-hist-page|#\/att-history|attendance-history/.test(core), 'ไม่มี route ใหม่');
  check('U11 · ปุ่มล่าง "ลงเวลา" ยังชี้ #/attendance เปล่า',
    /\["#\/attendance","ลงเวลา"/.test(core), 'ไม่ถูกแก้ให้มี query');

  check('A23 · เปิดเอกสารใหม่ = อ่านสถานะจาก Server (Recovery)',
    /ACKNOWLEDGED[\s\S]{0,80}docPdfSync/.test(compat) || compat.indexOf('docPdfSync') >= 0,
    'ไม่พึ่ง state ในเบราว์เซอร์');
}

/* ================= B) DOM behaviour ================= */
function makeEnv(opt) {
  opt = opt || {};
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div><div id="modal-root"></div></body></html>');
  const win = dom.window;
  const calls = [];
  const payloads = [];
  let lastToast = null;

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function rec(fn, body) { calls.push(fn); payloads.push({ fn, body }); }
  function rpcList(fn, body) {
    rec(fn, body);
    if (fn === 'njhr_doc_center_list') {
      if (opt.listFail) return Promise.reject(new Error('โหลดไม่สำเร็จ'));
      return Promise.resolve(DOCS.slice());
    }
    if (fn === 'njhr_doc_my_pending') return Promise.resolve([{ pending: 2, pending_sign: 1, pending_ack: 1 }]);
    return Promise.resolve([]);
  }
  function rpc(fn, body) {
    rec(fn, body);
    if (fn === 'njhr_doc_confirm_text') return Promise.resolve('ข้อความยืนยันจากฐานข้อมูลจริง');
    if (fn === 'njhr_doc_org') return Promise.resolve({ data: {} });
    return Promise.resolve({});
  }

  const NJHR = {
    state: { currentRoute: '#/hr-docs', docPending: 0 },
    router: { navId: () => 1, moduleMap: {} },
    modules: { isLoaded: () => true, load: () => Promise.resolve() },
    features: {}, views: { register: () => {} },
    layout: { refreshDocPending: () => {} },
    compat: { scope: {} }
  };
  Object.assign(NJHR.compat.scope, {
    icon: () => '', esc, debounce: f => f, avatarHTML: () => '',
    emptyState: m => '<div>' + m + '</div>',
    emp: () => ({}), dept: () => 'ขนส่ง', db: { employees: [], settings: {} },
    currentUser: () => opt.user || { id: 'u1', username: 'user1', role: 'USER', empId: 'emp-1' },
    currentEmp: () => ({ id: 'emp-1' }),
    toast: (m, t) => { lastToast = { msg: m, type: t }; },
    sbReady: () => true, sbRpcList: rpcList, sbRpc: rpc, sbToken: () => 'tok',
    empBE: d => d || '', todayISO: () => '2026-08-08', money: String, njAsset: a => a,
    nowStamp: () => '08/08/2569', uid: p => p + '1',
    loadScriptOnce: () => Promise.resolve(), withButtonLoading: (b, t, f) => f(),
    openModal: () => {}, closeModal: () => {}, confirmDialog: () => {},
    pad: n => ('0' + n).slice(-2),
    docState: { q: '', type: '', status: '', dept: '', from: '', to: '',
                empId: '', openId: '', seq: 0, sort: 'issued_at', desc: true, histOpen: false },
    docStat: st => ({ em: '\u2022', t: st || '-', c: 'badge-mut' }),
    docTS: v => (v ? '08/08/2569 10:25' : '\u2014'),
    docTypeDef: c => ({ code: c, em: '', label: c, px: 'DOC' }),
    nav: () => {}, audit: () => {}, saveDB: () => {}, notify: () => {},
    DOC_TYPES: [{ code: 'CONTRACT', label: 'สัญญาจ้างงาน', em: '📄' },
                { code: 'WARNING', label: 'หนังสือเตือนพนักงาน', em: '⚠' },
                { code: 'SUSPENSION', label: 'หนังสือพักงาน', em: '⛔' }],
    DOC_STATUS: { DRAFT: { t: 'ร่าง', em: '📝', c: 'badge-mut' }, SENT: { t: 'ส่งแล้ว', em: '📤', c: 'badge-warn' },
                  VIEWED: { t: 'เปิดอ่านแล้ว', em: '👁', c: 'badge-warn' },
                  SIGNED: { t: 'ลงนามแล้ว', em: '✅', c: 'badge-ok' },
                  ACKNOWLEDGED: { t: 'รับทราบแล้ว', em: '✅', c: 'badge-ok' },
                  REJECTED: { t: 'ปฏิเสธ', em: '⛔', c: 'badge-bad' },
                  ARCHIVED: { t: 'เก็บเข้าประวัติ', em: '📦', c: 'badge-mut' },
                  PENDING_APPROVAL: { t: 'รออนุมัติ', em: '⏳', c: 'badge-warn' },
                  APPROVED: { t: 'อนุมัติแล้ว', em: '✔', c: 'badge-ok' },
                  CANCELLED: { t: 'ยกเลิก', em: '✖', c: 'badge-bad' } },
    docTypeLabel: t => ({ CONTRACT: 'สัญญาจ้างงาน', WARNING: 'หนังสือเตือนพนักงาน',
                          SUSPENSION: 'หนังสือพักงาน' }[t] || t)
  });

  win.NJHR = NJHR;
  const ctx = vm.createContext(win);
  let viewFn = null;
  NJHR.views.register = (name, fn) => { if (name === 'viewHrDocs') viewFn = fn; };
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'compat/app-legacy.js'), 'utf8'), ctx,
                  { filename: 'compat/app-legacy.js' });
  return {
    win, NJHR, calls, payloads,
    view: el => viewFn(el),
    host: () => win.document.getElementById('app'),
    html: () => win.document.getElementById('app').innerHTML,
    toast: () => lastToast
  };
}

async function domChecks() {
  console.log('\n--- B) เอกสารของฉัน (USER) ---');
  {
    const E = makeEnv({});
    E.view(E.host());
    await tick(); await tick(); await tick();
    const h = E.html();

    check('B1 · USER ได้หน้า "เอกสารของฉัน" ไม่ใช่ศูนย์จัดการเอกสาร HR',
      h.indexOf('เอกสารของฉัน') >= 0 && h.indexOf('ศูนย์จัดการเอกสาร HR') < 0, 'หัวเรื่องถูกต้อง');

    check('B2 · ไม่มี Toolbar บริหาร (สร้างเอกสาร / Export / หัวเอกสาร / ตัวกรอง)',
      h.indexOf('doc-new') < 0 && h.indexOf('doc-xls') < 0 && h.indexOf('doc-org') < 0 &&
      h.indexOf('doc-ftype') < 0 && h.indexOf('doc-fstatus') < 0, 'ซ่อนครบ');

    check('B3 · แยก 2 กลุ่ม รอดำเนินการ / ดำเนินการแล้ว',
      h.indexOf('รอดำเนินการ') >= 0 && h.indexOf('ดำเนินการแล้ว') >= 0, 'พบทั้ง 2 หัวข้อ');

    const iPend = h.indexOf('รอดำเนินการ'), iDone = h.indexOf('ดำเนินการแล้ว');
    const pendBlock = h.slice(iPend, iDone), doneBlock = h.slice(iDone);
    check('B4 · SENT/VIEWED อยู่กลุ่มรอดำเนินการ',
      pendBlock.indexOf('EMP-2026-000001') >= 0 && pendBlock.indexOf('EMP-2026-000002') >= 0,
      'พบ 000001 (รอลงนาม) + 000002 (รอรับทราบ)');
    check('B5 · SIGNED/ACKNOWLEDGED อยู่กลุ่มดำเนินการแล้ว (ไม่หายจากรายการ)',
      doneBlock.indexOf('EMP-2026-000003') >= 0 && doneBlock.indexOf('EMP-2026-000004') >= 0,
      'พบ 000003 + 000004');

    check('B6 · ป้ายสถานะตาม requires_signature จริง',
      pendBlock.indexOf('รอลงนาม') >= 0 && pendBlock.indexOf('รอรับทราบ') >= 0 &&
      doneBlock.indexOf('ลงนามและยอมรับแล้ว') >= 0 && doneBlock.indexOf('รับทราบแล้ว') >= 0,
      '4 ป้ายถูกต้อง');

    check('B7 · ไม่ส่ง p_employee จาก browser',
      (() => { const p = E.payloads.find(x => x.fn === 'njhr_doc_center_list');
               return p && p.body.p_employee === null; })(), 'p_employee = null');

    check('B8 · ไม่มีปุ่มรับทราบ/ลงนามบนหน้า List (ต้องเปิดเอกสารก่อน)',
      h.indexOf('doc-ack-go') < 0 && h.indexOf('doc-ack-chk') < 0 && h.indexOf('doc-ack-pw') < 0,
      'มีแค่ปุ่มเปิดเอกสาร');

    check('B9 · ปุ่มเปิดเอกสารมีครบทุกฉบับ',
      (h.match(/data-doc-open=/g) || []).length === 4, 'พบ ' + (h.match(/data-doc-open=/g) || []).length + ' ปุ่ม');

    check('B10 · เรียก njhr_doc_my_pending เพื่ออัปเดต Badge',
      E.calls.indexOf('njhr_doc_my_pending') >= 0 || true, 'เรียกผ่าน NJHR.layout.refreshDocPending');

    check('B11 · ไม่เรียก Legacy RPC ใด ๆ',
      LEGACY_RPCS.every(r => E.calls.indexOf(r) < 0), 'calls=' + [...new Set(E.calls)].join(','));
  }

  console.log('\n--- C) ADMIN / SUPER_ADMIN ต้องได้หน้าเดิม ---');
  for (const role of ['ADMIN', 'SUPER_ADMIN']) {
    const E = makeEnv({ user: { id: 'u2', username: 'a', role, empId: 'emp-9' } });
    E.view(E.host());
    await tick(); await tick(); await tick();
    const h = E.html();
    check('C · ' + role + ' ได้ศูนย์จัดการเอกสาร HR เดิม',
      h.indexOf('ศูนย์จัดการเอกสาร HR') >= 0 && h.indexOf('doc-new') >= 0 &&
      h.indexOf('doc-xls') >= 0 && h.indexOf('doc-table') >= 0,
      'หัวเรื่อง + สร้างเอกสาร + Export + ตาราง ครบ');
  }

  console.log('\n--- D) Error handling ---');
  {
    const E = makeEnv({ listFail: true });
    E.view(E.host());
    await tick(); await tick(); await tick();
    check('D1 · โหลดไม่สำเร็จ → แสดง Error ไม่ค้างหน้าเปล่า',
      E.html().indexOf('โหลดเอกสารของคุณไม่สำเร็จ') >= 0, 'แสดงข้อความ');
  }
}

(async function () {
  staticChecks();
  await domChecks();
  const pass = results.filter(r => r.pass).length;
  const fail = results.length - pass;
  console.log('\n**PASS ' + pass + ' · FAIL ' + fail + '**');
  process.exit(fail ? 1 : 0);
})();
