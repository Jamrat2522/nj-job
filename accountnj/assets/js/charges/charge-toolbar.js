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
  { a: 'export-soa',   t: '📄 Export SOA',             perm: 'export' },
  { a: 'sum',          t: '🧮 คำนวณยอดรวม' },
  { a: 'upload-19',    t: '⬆ Upload 1.9',             perm: 'edit' },
  { a: 'close-upload', t: '✅ ตัดจบงาน (Upload)',       perm: 'edit' },
  { a: 'bulk-case',    t: '🗂 Bulk Case',              perm: 'edit' },
  { a: 'fill-etd',     t: '🚢 เติม ETD',               perm: 'edit' },
  { a: 'contacts',     t: '📇 Contact List' },
];

/* MAERSK เท่านั้น: Export Excel CASE (ตาม Billing เดิม) */
const MAERSK_ONLY = [
  { a: 'export-case', t: '📄 Export Excel CASE', perm: 'export' },
];

const btn = (b) => `<button class="btn ${b.primary ? 'btn-p' : 'btn-o'} btn-sm" data-tool="${b.a}">${b.t}</button>`;
const item = (b) => `<button class="tool-item" data-tool="${b.a}">${b.t}</button>`;

export function toolbarHTML(charge, group, perms) {
  const allow = (b) => !b.perm || perms[b.perm];
  const main = MAIN.filter(allow).map(btn).join('');
  const tools = TOOLS.filter(allow).map(item).join('');
  const maersk = group === 'MAERSK' ? MAERSK_ONLY.filter(allow).map(item).join('') : '';

  /* ADVANCE: พิมพ์เลข JOB/Invoice แล้วกด ✓ จบงาน (ENTER ได้) */
  const quick = (charge === 'ADVANCE' && perms.edit) ? `
    <div class="quick-close">
      <input class="inp" id="qc-key" placeholder="เลข JOB / Invoice" autocomplete="off">
      <button class="btn btn-green btn-sm" data-tool="quick-close">✓ จบงาน</button>
    </div>` : '';

  return `<div class="ch-tools">
    ${main}
    <div class="tool-menu">
      <button class="btn btn-o btn-sm" data-menu="tools">🧰 เครื่องมือ ▾</button>
      <div class="tool-drop" data-drop="tools">${tools}</div>
    </div>
    ${maersk ? `<div class="tool-menu">
      <button class="btn btn-o btn-sm" data-menu="maersk">🚢 MAERSK ▾</button>
      <div class="tool-drop" data-drop="maersk">${maersk}</div>
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
