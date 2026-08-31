/* Toolbar หน้ารายการ — Functional Coverage เทียบเท่า BILLING เดิม (ไม่มีปุ่มไหนหาย)
   จัดกลุ่มใหม่: Main bar + Tools dropdown + MAERSK-only dropdown + Quick Close (ADVANCE)
   ทุกปุ่มเป็น implementation ใหม่บน njacc_* (charge-import.js / charge-export.js / charge-tools.js) */

const MAIN = [
  { a: 'new-job',      t: '+ เปิดงาน',        perm: 'create', primary: true },
  { a: 'refresh',      t: '↻ Refresh' },
  { a: 'upload',       t: '📁 Upload',        perm: 'edit' },
  { a: 'export-excel', t: '📗 Export Excel',  perm: 'export' },
  { a: 'paste-close',  t: '📋 Paste จบงาน',   perm: 'edit' },
  { a: 'apl-upload',   t: '⬆ APL Billing',   perm: 'edit' },
];

const TOOLS = [
  { a: 'export-all',   t: '📦 Export ทั้งหมด',        perm: 'export' },
  { a: 'export-cust',  t: '👤 Export Customer (ZIP)', perm: 'export' },
  { a: 'export-csv',   t: '⚡ Export Fast CSV',        perm: 'export' },
  { a: 'sum',          t: '🧮 คำนวณยอดรวม' },
  { a: 'upload-19',    t: '⬆ Upload 1.9',             perm: 'edit' },
  { a: 'close-upload', t: '✅ ตัดจบงาน (Upload)',       perm: 'edit' },
];

/* เมนู 🚢 MAERSK ▾ — ชุด Action ของงาน MAERSK (ตาม Billing เดิม)
   *** ไม่ใช่ Hard Gate ของหน้า *** เมนูแสดงที่ ACCOUNTING (SERVICE/ADVANCE) ด้วย
   การกันข้อมูลอยู่ที่ระดับ Record:
     - เติม ETD  -> customer_gate = 'MAERSK LOGISTICS' บังคับฝั่ง DB (RUN-49)
     - Bulk Case -> NJ-prefix filter + match จริงก่อน update
     - Export    -> บังคับเลือก Customer ก่อน */
const MAERSK_ONLY = [
  { a: 'export-case', t: '📄 Export Excel CASE', perm: 'export' },
  { a: 'export-soa',  t: '📄 Export SOA',        perm: 'export' },
  { a: 'bulk-case',   t: '🗂 Bulk Case',         perm: 'edit' },
  { a: 'fill-etd',    t: '🚢 เติม ETD',          perm: 'edit' },
  { a: 'contacts',    t: '📇 Contact List' },
];

/* extra = คลาสเสริมแบบ opt-in — ไม่ส่งมา = markup เดิมทุกตัวอักษร
   (ใช้เฉพาะแถบตัวกรองหน้า DOCUMENT เพื่อไล่สีปุ่ม · Toolbar หน้าอื่นไม่กระทบ) */
const btn = (b, extra = '') => `<button class="btn ${b.primary ? 'btn-p' : 'btn-o'} btn-sm${extra ? ' ' + extra : ''}" data-tool="${b.a}">${b.t}</button>`;
const item = (b) => `<button class="tool-item" data-tool="${b.a}">${b.t}</button>`;

/* ปุ่มที่ซ่อนเฉพาะหน้า DOCUMENT (ตามคำสั่งผู้ใช้) — ACCOUNTING ยังมีครบทุกปุ่ม
   ซ่อนเฉพาะ UI เท่านั้น · ไม่แตะ logic/RPC/ตาราง/สิทธิ์ ของปุ่มเหล่านี้ */
const DOCUMENT_HIDE_MAIN = ['upload', 'paste-close', 'apl-upload'];

/* ปุ่มที่ซ่อนเฉพาะหน้า ACCOUNTING
   งานต้องเปิดจาก DOCUMENT แล้วกด "ปิดงาน" ส่งเข้ามาเท่านั้น
   จึงไม่ควรมีทางเปิดงานใหม่จากหน้า ACCOUNTING
   ── ซ่อนเฉพาะการ render ปุ่มใน Toolbar ──
   ไม่ลบ MAIN entry · ไม่ลบ runTool('new-job') · ไม่ลบ openNewJobModal()
   ไม่ลบ route · ไม่แตะ perm 'create' · DOCUMENT ยังใช้ปุ่มนี้ผ่าน docBarButtonsHTML() ตามเดิม
   ปุ่มไม่ถูก render ออกมาเลย (ไม่ได้ซ่อนด้วย CSS) และ .ch-tools เป็น flex+gap
   -> ไม่เหลือช่องว่างของปุ่มเดิม ปุ่มที่เหลือเลื่อนมาชิดกันเอง */
/* ── V.297 ── เพิ่ม 'refresh' ตามสเปก Toolbar สุดท้ายของผู้ใช้:
     Upload | Excel | จบงาน | APL Billing | MAERSK ▾ | Tools ▾
   *** ซ่อนเฉพาะการ render ปุ่มในหน้า ACCOUNTING เท่านั้น ***
     - ไม่ลบ MAIN entry 'refresh' · ไม่ลบ runTool('refresh') -> ctx.refresh()
     - ctx.refresh = load() ของ charge-page.js ยังถูกเรียกโดยทุก Action เหมือนเดิม
       (upload / apl / paste-close / close-upload / bulk-case / fill-etd / quick-close
        / import / แก้ไข / ลบ) -> การ reload หลัง save/update ไม่หาย
     - DOCUMENT ยังมีปุ่ม Refresh ผ่าน DOCUMENT_FBAR_BTNS (คนละฟังก์ชัน) ไม่กระทบ
     - FINANCE > Advance / Close Job ใช้ branch คนละอันด้านบน ไม่กระทบ */
const ACCOUNTING_HIDE_MAIN = ['new-job', 'refresh'];

/* ปุ่มที่ย้ายไปต่อท้าย "ล้างตัวกรอง" ในแถบตัวกรอง (หน้า DOCUMENT)
   ลำดับสุดท้ายบนหน้าจอ:
     ล้างตัวกรอง | Export Excel | Refresh | ⚙ คอลัมน์ | + เปิดงาน
   ── รายการนี้คุมแค่ 2 ปุ่มกลาง (Export Excel · Refresh) ──
      "⚙ คอลัมน์" ถูก append ด้วย components/table.js:initColumns()
      "+ เปิดงาน" ถูก append ต่อท้ายอีกทีใน charge-page.js:mountColBtn()
        (ใช้ docTopButtonHTML() ด้านล่าง — MAIN entry 'new-job' ตัวเดิม)
      *** ห้ามใส่ 'new-job' กลับเข้ารายการนี้ *** จะได้ปุ่มซ้ำ 2 อัน
      และลำดับจะผิด (ไปอยู่ก่อน "⚙ คอลัมน์")
   ใช้ data-tool เดิมทุกตัว → logic/สิทธิ์เดิมไม่เปลี่ยน */
export const DOCUMENT_FBAR_BTNS = ['export-excel', 'refresh'];
export function docBarButtonsHTML(perms) {
  return DOCUMENT_FBAR_BTNS
    .map(a => MAIN.find(b => b.a === a))
    .filter(b => b && (!b.perm || perms[b.perm]))
    /* ── V.280 ── ใส่คลาสสีเฉพาะปุ่มในแถบนี้ (tb-export-excel / tb-refresh)
       *** data-tool · perm · ข้อความ · ขนาด เหมือนเดิมทุกประการ *** */
    .map(b => btn(b, 'tb-btn tb-' + b.a)).join('');
}

/* markup ของปุ่ม "+ เปิดงาน" (หน้า DOCUMENT เท่านั้น)
   ตำแหน่ง render ปัจจุบัน: ท้ายแถบตัวกรอง ต่อจาก "⚙ คอลัมน์"
   (เดิมอยู่มุมขวาบนของ Topbar — ชื่อฟังก์ชันคงไว้เพื่อไม่ให้ต้องแก้จุดเรียกใช้)
   *** Reuse MAIN entry 'new-job' + btn() ตัวเดียวกับ Toolbar เดิมทุกประการ ***
     - class เดิม  : btn btn-p btn-sm  (สีน้ำเงินเดิม · ขนาดเท่าปุ่มอื่นในแถบ)
     - ข้อความเดิม : "+ เปิดงาน"
     - data-tool   : new-job  -> runTool('new-job', ctx) -> openNewJobModal() ชุดเดิม
     - perm เดิม   : perms.create  (ไม่มีสิทธิ์ -> คืน '' ไม่ render ปุ่ม)
   ไม่สร้างปุ่ม/Logic/Modal/Permission ชุดใหม่ · ย้ายเฉพาะ "ตำแหน่งที่ render" */
export function docTopButtonHTML(perms) {
  const b = MAIN.find(x => x.a === 'new-job');
  return (b && (!b.perm || perms[b.perm])) ? btn(b) : '';
}

export function toolbarHTML(charge, group, perms, mode) {
  const isDoc = mode === 'document';
  /* DOCUMENT: ไม่มีแถบ toolbar แยกแล้ว — ปุ่มย้ายไปอยู่ในแถบตัวกรอง */
  if (isDoc) return '';

  /* ── FINANCE > Advance (mode === 'advance') — เหลือปุ่มเดียว: 📗 Export Excel ──
     เงื่อนไขผูกกับ mode ของ route 'finance/advance' เท่านั้น (routes.js: args.mode='advance')
     ไม่ได้ลบ MAIN / TOOLS / MAERSK_ONLY / quick-close ออกจาก config
     ไม่ได้ลบ runTool() ของปุ่มใด ๆ · ไม่แตะ perm
     -> หน้าอื่นที่ใช้ renderer เดียวกัน (ACCOUNTING, FINANCE > Close Job) ยังได้ toolbar เดิมครบ
     ปุ่มที่เอาออกคือ "ไม่ถูก render" ไม่ได้ซ่อนด้วย CSS และ .ch-tools เป็น flex+gap
     -> ไม่เหลือช่องว่างของปุ่มเดิม
     ปุ่มที่หายไปจากหน้านี้: + เปิดงาน · ↻ Refresh · 📁 Upload · 📋 Paste จบงาน ·
       ⬆ APL Billing · 🧰 เครื่องมือ · 🚢 MAERSK · ช่อง "เลข JOB / Invoice" · ปุ่ม ✓ จบงาน */
  if (mode === 'advance') {
    const ex = MAIN.find(b => b.a === 'export-excel');
    return `<div class="ch-tools">${(!ex.perm || perms[ex.perm]) ? btn(ex) : ''}</div>`;
  }

  /* ── FINANCE > Close Job (mode === 'closed') — ไม่ render Toolbar เลย ──
     เงื่อนไขผูกกับ mode ของ route 'finance/close-job' เท่านั้น
     (routes.js: args = { charge:'SERVICE', group:'NJ', mode:'closed', scope:'all' })
     หน้านี้เป็น "ประวัติงานที่จบครบวงจร" ดูอย่างเดียว จึงไม่ควรมีปุ่มดำเนินการใด ๆ ด้านบน
     คืนค่า '' แบบเดียวกับ mode 'document' -> ไม่มี element .ch-tools เกิดขึ้นใน DOM เลย
     ไม่ได้ซ่อนด้วย CSS จึงไม่เหลือพื้นที่ว่างของ Toolbar
     ไม่ลบ MAIN / TOOLS / MAERSK_ONLY / quick-close / runTool() ของปุ่มใด
     -> ACCOUNTING และ FINANCE > Advance ยังได้ Toolbar ของตัวเองครบเหมือนเดิม
     ปุ่มในคอลัมน์ "จัดการ" ของแต่ละแถว (ดู / ดู INVOICE) อยู่คนละที่ (charge-table.js)
     จึงไม่ถูกกระทบ */
  if (mode === 'closed') return '';

  const isAcc = mode === 'accounting';
  const allow = (b) => (!b.perm || perms[b.perm])
    && !(isDoc && DOCUMENT_HIDE_MAIN.includes(b.a))
    && !(isAcc && ACCOUNTING_HIDE_MAIN.includes(b.a));
  const main = MAIN.filter(allow).map(btn).join('');
  const tools = isDoc ? '' : TOOLS.filter(allow).map(item).join('');
  /* ── V.297 ── เดิม: group === 'MAERSK' เท่านั้น -> หน้า ACCOUNTING (group 'NJ')
     ไม่เห็นเมนูนี้เลย ทำให้ Role ACCOUNT ใช้ Export CASE / SOA / Bulk Case /
     ETD / Contact List ไม่ได้ ตามคำสั่งผู้ใช้ให้เปิดใช้ที่ ACCOUNTING ด้วย
     -> แสดงเมนูเมื่อเป็นหน้า ACCOUNTING หรือกลุ่ม MAERSK
     perm เดิมของแต่ละปุ่มยังบังคับตามเดิมทุกตัว (export / edit) */
  const maersk = (isAcc || group === 'MAERSK') ? MAERSK_ONLY.filter(allow).map(item).join('') : '';

  /* ADVANCE: พิมพ์เลข JOB/Invoice แล้วกด ✓ จบงาน (ENTER ได้)
     ── ไม่แสดงที่ ACCOUNTING > Advance (isAcc) ตามคำสั่งผู้ใช้ ──
     เงื่อนไข !isAcc = mode !== 'accounting' ผูกกับ route 'accounting/advance' เท่านั้น
       (routes.js: R['accounting/advance'] args = { charge:'ADVANCE', group:'NJ', mode:'accounting' })
     ไม่ลบ block นี้ทิ้ง · ไม่ลบ runTool('quick-close') · ไม่ลบ quickCloseLookup() /
     bulkSetStatus() / RPC njacc_quick_close_lookup · ไม่แตะ CSS .quick-close
     -> route เดิม #/charges/ADVANCE/:group ยังใช้ช่องนี้ได้เหมือนเดิมทุกอย่าง
     ทั้ง <input id="qc-key"> และปุ่ม "✓ จบงาน" ถูก "ไม่ render" ไม่ได้ซ่อนด้วย CSS
     และ .ch-tools เป็น flex+gap -> ไม่เหลือพื้นที่ว่าง ปุ่มที่เหลือเรียงต่อกันตามปกติ
     (.quick-close มี margin-left:auto อยู่ เมื่อไม่ render จึงไม่มีช่องว่างดันด้านขวาด้วย)
     หน้า DOCUMENT ไม่แสดงอยู่แล้วผ่าน !isDoc เหมือนเดิม */
  const quick = (charge === 'ADVANCE' && perms.edit && !isDoc && !isAcc) ? `
    <div class="quick-close">
      <input class="inp" id="qc-key" placeholder="เลข JOB / Invoice" autocomplete="off">
      <button class="btn btn-green btn-sm" data-tool="quick-close">✓ จบงาน</button>
    </div>` : '';

  /* ── V.283 ── ACCOUNTING เท่านั้น : ใส่คลาสตัวคุมสีให้แถบเครื่องมือ
     *** เพิ่มคลาสอย่างเดียว *** ไม่แตะปุ่ม/ลำดับ/ข้อความ/ไอคอน/onclick/perm
     -> FINANCE > Advance และหน้าอื่นที่ใช้ .ch-tools เดิม สีไม่เปลี่ยน */
  return `<div class="ch-tools${isAcc ? ' ch-tools-acc' : ''}">
    ${main}
    ${/* ── V.297 ── ลำดับตามสเปกสุดท้าย: … | APL Billing | MAERSK ▾ | Tools ▾
          (เดิม Tools มาก่อน MAERSK) สลับเฉพาะลำดับการ render ไม่แตะรายการในเมนู */''}
    ${maersk ? `<div class="tool-menu">
      <button class="btn btn-o btn-sm" data-menu="maersk">🚢 MAERSK ▾</button>
      <div class="tool-drop" data-drop="maersk">${maersk}</div>
    </div>` : ''}
    ${tools ? `<div class="tool-menu">
      <button class="btn btn-o btn-sm" data-menu="tools">🧰 เครื่องมือ ▾</button>
      <div class="tool-drop" data-drop="tools">${tools}</div>
    </div>` : ''}
    ${quick}
  </div>`;
}

/* ผูก dropdown ของ toolbar */
export function bindToolMenus(root) {
  root.addEventListener('click', (e) => {
    const m = e.target.closest('[data-menu]');
    root.querySelectorAll('.tool-drop.open').forEach(d => {
      if (!m || d.dataset.drop !== m.dataset.menu) d.classList.remove('open');
    });
    if (m) {
      const d = root.querySelector(`[data-drop="${m.dataset.menu}"]`);
      if (d) d.classList.toggle('open');
    }
    if (e.target.closest('.tool-item')) {
      root.querySelectorAll('.tool-drop.open').forEach(d => d.classList.remove('open'));
    }
  });
}
