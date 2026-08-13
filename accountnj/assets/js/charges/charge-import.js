/* IMPORT ENGINE ของหน้ารายการ — อ่านไฟล์ที่ผู้ใช้อัปโหลดเท่านั้น (ไม่ query ตาราง BILLING เดิม)
   ส่งเข้า DB เป็น batch (100 แถว/ครั้ง) ผ่าน njacc_* RPC — ไม่ยิงทีละแถว
   Scope charge_type/company_group บังคับจากหน้าที่กด Upload (server ตรวจซ้ำ) */
import { importResolveMasters, importCreateMasters, importJobsBatch,
  uploadAplBatch, upload19Batch, uploadContactList } from './charge-api.js';
import { xlsx } from './charge-export.js';
import { openModal, closeModal, confirmModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { esc } from '../core/formatter.js';
import { isAdmin } from '../core/permissions.js';

/* ---------- file helpers ---------- */
export function pickFile(accept = '.csv,.txt,.xlsx,.xls') {
  return new Promise(res => {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = accept;
    i.onchange = () => res(i.files && i.files[0] ? i.files[0] : null);
    i.click();
  });
}
export async function readSheet(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    const text = await file.text();
    return text.split(/\r?\n/).filter(l => l.trim() !== '')
      .map(l => l.split(/[,;\t]/).map(s => s.trim().replace(/^"|"$/g, '')));
  }
  const X = await xlsx();
  const wb = X.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const sh = wb.Sheets[wb.SheetNames[0]];
  return X.utils.sheet_to_json(sh, { header: 1, raw: false, defval: '' })
    .map(r => (r || []).map(v => (v == null ? '' : String(v).trim())));
}

/* ---------- value parsers ---------- */
const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.:]/g, '');
export function toISODate(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  let m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);      // DD/MM/YYYY
  if (m) {
    let y = Number(m[3]); if (y < 100) y += 2000; if (y > 2400) y -= 543;
    return `${y}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
  }
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);                   // YYYY-MM-DD
  if (m) return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  const d = new Date(s);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);         // null = แปลงไม่ได้
}
const toNum = (v) => {
  const s = String(v ?? '').replace(/[, ฿]/g, '').trim();
  if (s === '' || s === '-') return null;
  const n = Number(s);
  return isNaN(n) ? null : n;
};

/* ---------- header mapping (ตามไฟล์ BILLING เดิม) ---------- */
const HEADER_MAP = {
  'date': 'reference_date',
  'invoice no': 'key',                       // Invoice No. ของไฟล์เดิม → source_invoice_no
  'invoice': 'key',
  'master': 'master_bl_no',
  'house b/l no': 'house_bl_no', 'house b/l': 'house_bl_no', 'house bl no': 'house_bl_no',
  'data type': 'data_type',
  'company invoice': 'company_invoice',
  'dcl inv': 'customs_declaration_no', 'dcl': 'customs_declaration_no',
  'customer job no': 'customer_job_no', 'customer job': 'customer_job_no',
  'service charge': 'm_service_charge',
  'advance': 'm_advance',
  'vat 7%': 'm_vat', 'vat': 'm_vat',
  'amount': 'm_amount',
  'wht 3%': 'm_wht', 'wht': 'm_wht',
  'total amount': 'm_total', 'total amout': 'm_total',
  'credit term': 'credit_term_days',
  'name cs': 'cs_name', 'cs': 'cs_name',
  'status': 'operational_status',
  'customer name': 'customer_name', 'customer': 'customer_name',
  'apl billing': 'i_billing_apl', 'apl': 'i_billing_apl',
  'due date': 'due_date',
  'remaining': '_ignore',
  'item': '_ignore',
  'note': 'note',
  'case': 'case_no',
  'eta': 'eta',
  'etd': 'etd',
  'contact': 'contact',
};
const DATE_FIELDS = ['reference_date', 'due_date', 'eta', 'etd'];
const MONEY_FIELDS = { m_service_charge: 'service_charge', m_advance: 'advance', m_vat: 'vat',
  m_amount: 'amount', m_wht: 'wht', m_total: 'total_amount' };
const STATUS_MAP = { 'pending': 'OPEN', 'open': 'OPEN', 'processing': 'PROCESSING',
  'close': 'CLOSE', 'closed': 'CLOSE', 'canceled': 'CANCELED', 'cancelled': 'CANCELED' };

/* ---------- MAIN IMPORT ---------- */
export async function runMainImport(ctx) {
  const file = await pickFile(); if (!file) return;
  const grid = await readSheet(file);
  if (grid.length < 2) { toast('ไฟล์ว่างหรืออ่านไม่ได้', 'err'); return; }

  /* หา header row (แถวแรกที่มี Invoice No. หรือ Date) */
  let hIdx = grid.findIndex(r => r.some(c => ['invoice no', 'invoice', 'date'].includes(norm(c))));
  if (hIdx < 0) hIdx = 0;
  const header = grid[hIdx].map(norm);
  const colOf = {};
  header.forEach((h, i) => {
    const f = HEADER_MAP[h];
    if (f && f !== '_ignore' && colOf[f] === undefined) colOf[f] = i;
  });
  if (colOf.key === undefined) { toast('ไม่พบคอลัมน์ Invoice No. ในไฟล์', 'err'); return; }

  /* fields ที่ไฟล์มี authority (มีใน header เท่านั้น) */
  const presentFields = Object.keys(colOf).filter(k => k !== 'key' && !k.startsWith('m_'));
  const hasMoney = Object.keys(MONEY_FIELDS).some(k => colOf[k] !== undefined);

  const rows = [];
  const seen = new Map();
  const dupInFile = [];
  const invalidDate = [];
  for (let i = hIdx + 1; i < grid.length; i++) {
    const raw = grid[i];
    const key = String(raw[colOf.key] ?? '').trim();
    if (!key) continue;
    const fields = {};
    let bad = false;
    for (const f of presentFields) {
      let v = String(raw[colOf[f]] ?? '').trim();
      if (DATE_FIELDS.includes(f)) {
        const iso = toISODate(v);
        if (iso === null) { bad = true; break; }
        v = iso;
      } else if (f === 'credit_term_days') {
        const n = toNum(v); v = n === null ? '' : String(Math.round(n));
      } else if (f === 'operational_status') {
        v = STATUS_MAP[norm(v)] || '';
      }
      fields[f] = v;
    }
    if (bad) { invalidDate.push(key); continue; }
    const money = {};
    if (hasMoney) {
      for (const [src, dst] of Object.entries(MONEY_FIELDS)) {
        if (colOf[src] !== undefined) {
          const n = toNum(raw[colOf[src]]);
          money[dst] = n === null ? '' : n;
        }
      }
    }
    const rec = { key, fields, money: hasMoney ? money : null };
    /* ไฟล์เดียวกัน key ซ้ำ → ยึดแถวล่างสุด แต่ต้องรายงาน */
    if (seen.has(key)) { dupInFile.push(key); rows[seen.get(key)] = rec; }
    else { seen.set(key, rows.length); rows.push(rec); }
  }
  if (!rows.length) { toast('ไม่พบแถวข้อมูลที่ใช้ได้ในไฟล์', 'err'); return; }

  /* ---- Preview: ตรวจ master ก่อน (exact normalized เท่านั้น) ---- */
  const custNames = [...new Set(rows.map(r => r.fields.customer_name).filter(Boolean))];
  const compNames = [...new Set(rows.map(r => r.fields.company_invoice).filter(Boolean))];
  let resolved = { customers: [], companies: [] };
  if (custNames.length || compNames.length) {
    resolved = await importResolveMasters(ctx.charge, ctx.group, custNames, compNames);
  }
  const missCust = (resolved.customers || []).filter(c => c.status !== 'OK');
  const missComp = (resolved.companies || []).filter(c => c.status !== 'OK');

  const ok = await previewDialog({
    file: file.name, total: rows.length, fields: presentFields, hasMoney,
    dupInFile, invalidDate, missCust, missComp, ctx,
  });
  if (!ok) return;
  if (ok === 'create-masters') {
    await importCreateMasters(missCust.filter(c => c.status === 'NOT_FOUND').map(c => c.name),
      missComp.filter(c => c.status === 'NOT_FOUND').map(c => c.name));
    toast('สร้างข้อมูลหลักที่ขาดแล้ว', 'ok');
  }

  /* ---- ส่งเป็น batch ---- */
  const CHUNK = 100;
  const sum = { inserted: 0, updated: 0, skipped: 0, ambiguous: [], unresolved_master: [], failed: [] };
  const prog = progressDialog(rows.length);
  try {
    for (let i = 0; i < rows.length; i += CHUNK) {
      const res = await importJobsBatch(ctx.charge, ctx.group, rows.slice(i, i + CHUNK));
      sum.inserted += res.inserted || 0;
      sum.updated += res.updated || 0;
      sum.skipped += res.skipped || 0;
      sum.ambiguous = sum.ambiguous.concat(res.ambiguous || []);
      sum.unresolved_master = sum.unresolved_master.concat(res.unresolved_master || []);
      sum.failed = sum.failed.concat(res.failed || []);
      prog.update(Math.min(i + CHUNK, rows.length));
    }
  } finally { prog.close(); }

  resultDialog(sum, dupInFile, invalidDate);
  ctx.refresh();
}

function previewDialog(info) {
  return new Promise(res => {
    const canCreate = isAdmin() &&
      (info.missCust.some(c => c.status === 'NOT_FOUND') || info.missComp.some(c => c.status === 'NOT_FOUND'));
    const listOf = (arr, lb) => arr.length
      ? `<div class="mt-1"><b class="money-neg">${lb} (${arr.length})</b>
         <div class="t-xs t-2">${esc(arr.slice(0, 20).map(x => x.name + ' [' + x.status + ']').join(', '))}${arr.length > 20 ? ' …' : ''}</div></div>` : '';
    const b = document.createElement('div');
    b.innerHTML = `
      <p>ไฟล์: <b>${esc(info.file)}</b> · ${info.total} แถว</p>
      <p class="t-sm t-2">นำเข้าที่: <b>${esc(info.ctx.charge)} / ${esc(info.ctx.group)}</b>
        (ระบบบังคับ scope นี้ ไม่ใช้ค่ากลุ่มจากไฟล์)</p>
      <p class="t-xs t-3">คอลัมน์ที่ไฟล์มีสิทธิ์แก้: ${esc(info.fields.join(', ') || '-')}
        ${info.hasMoney ? ' · + ยอดเงิน (เก็บเป็น snapshot ไม่สร้าง INVOICE)' : ''}</p>
      <p class="t-xs t-3">คอลัมน์ที่ไม่มีใน header จะไม่ถูกแก้ไข</p>
      ${info.dupInFile.length ? `<div class="mt-1"><b>ซ้ำในไฟล์ (${info.dupInFile.length})</b>
        <div class="t-xs t-2">ยึดแถวล่างสุด: ${esc(info.dupInFile.slice(0, 20).join(', '))}</div></div>` : ''}
      ${info.invalidDate.length ? `<div class="mt-1"><b class="money-neg">วันที่ไม่ถูกต้อง (${info.invalidDate.length})</b>
        <div class="t-xs t-2">${esc(info.invalidDate.slice(0, 20).join(', '))}</div></div>` : ''}
      ${listOf(info.missCust, 'ลูกค้าที่ยังไม่มีในระบบ/กำกวม')}
      ${listOf(info.missComp, 'บริษัท Invoice ที่ยังไม่มีในระบบ/กำกวม')}
      ${(info.missCust.length || info.missComp.length)
        ? '<p class="t-xs t-3 mt-1">แถวที่ระบุชื่อไม่ตรงจะถูกข้าม (unresolved) — ระบบไม่เดาชื่อให้</p>' : ''}`;
    const f = document.createElement('div');
    f.innerHTML = `<button class="btn btn-o" data-close>ยกเลิก</button>
      ${canCreate ? '<button class="btn btn-o" id="im-create">สร้างข้อมูลหลักที่ขาด แล้วนำเข้า</button>' : ''}
      <button class="btn btn-p" id="im-go">นำเข้า</button>`;
    const m = openModal({ title: 'ตรวจสอบก่อนนำเข้า', body: b, footer: f, large: true });
    f.querySelector('#im-go').onclick = () => { closeModal(); res(true); };
    const c = f.querySelector('#im-create');
    if (c) c.onclick = () => { closeModal(); res('create-masters'); };
    m.addEventListener('click', e => {
      if (e.target === m || e.target.closest('[data-close]')) res(false);
    });
  });
}

function progressDialog(total) {
  const b = document.createElement('div');
  b.innerHTML = `<div class="load-row"><div class="spin"></div>
    <div class="mt-1" id="im-prog">0 / ${total}</div></div>`;
  openModal({ title: 'กำลังนำเข้าข้อมูล', body: b });
  return {
    update: (n) => { const el = document.getElementById('im-prog'); if (el) el.textContent = `${n} / ${total}`; },
    close: () => closeModal(),
  };
}

function resultDialog(sum, dupInFile, invalidDate) {
  const line = (lb, arr, cls) => arr.length
    ? `<div class="mt-1"><b class="${cls}">${lb} (${arr.length})</b>
        <div class="t-xs t-2">${esc(arr.slice(0, 25).map(x => typeof x === 'string' ? x : (x.key || JSON.stringify(x))).join(', '))}${arr.length > 25 ? ' …' : ''}</div></div>` : '';
  const b = document.createElement('div');
  b.innerHTML = `
    <table class="tbl">
      <tr><td>เพิ่มใหม่</td><td class="r t-b money-pos">${sum.inserted}</td></tr>
      <tr><td>อัปเดต</td><td class="r t-b">${sum.updated}</td></tr>
      <tr><td>ข้าม</td><td class="r">${sum.skipped}</td></tr>
    </table>
    ${line('ซ้ำในระบบ/กำกวม (ไม่แตะข้อมูล)', sum.ambiguous, 'money-neg')}
    ${line('ข้อมูลหลักไม่ตรง (ข้ามแถว)', sum.unresolved_master, 'money-neg')}
    ${line('ผิดพลาด', sum.failed, 'money-neg')}
    ${line('ซ้ำในไฟล์ (ใช้แถวล่างสุด)', dupInFile, 't-2')}
    ${line('วันที่ไม่ถูกต้อง (ข้าม)', invalidDate, 'money-neg')}`;
  const f = document.createElement('div');
  f.innerHTML = '<button class="btn btn-p" data-close>ปิด</button>';
  openModal({ title: 'ผลการนำเข้า', body: b, footer: f, large: true });
}

/* ---------- APL BILLING UPLOAD ---------- */
export async function runAplUpload(ctx) {
  const file = await pickFile(); if (!file) return;
  const grid = await readSheet(file);
  const pairs = [];
  for (const r of grid) {
    const key = String(r[0] ?? '').trim();
    const val = String(r[1] ?? '').trim();
    if (!key || /^(invoice|เลข)/i.test(key)) continue;   // ข้ามหัวตาราง
    pairs.push({ key, value: val });
  }
  if (!pairs.length) { toast('ไฟล์ต้องมี 2 คอลัมน์: Invoice | ชื่อผู้รับวางบิล', 'err'); return; }
  if (!(await confirmModal('Upload APL Billing',
    `พบ ${pairs.length} รายการ — อัปเดตเฉพาะช่อง I BILLING APL เท่านั้น`))) return;
  const { showBulkResult } = await import('./charge-export.js');
  const res = await uploadAplBatch(ctx.charge, ctx.group, pairs);
  showBulkResult('ผล Upload APL Billing', res);
  ctx.refresh();
}

/* ---------- UPLOAD 1.9 (ETA/ETD เท่านั้น · Invoice=C, ETA=M, ETD=N) ---------- */
export async function runUpload19(ctx) {
  const file = await pickFile('.xlsx,.xls,.csv'); if (!file) return;
  const grid = await readSheet(file);
  const rows = [];
  for (const r of grid) {
    const key = String(r[2] ?? '').trim();          // Column C
    if (!key || /^(invoice|inv)/i.test(key)) continue;
    const eta = String(r[12] ?? '').trim();         // Column M
    const etd = String(r[13] ?? '').trim();         // Column N
    const etaI = eta ? toISODate(eta) : '';
    const etdI = etd ? toISODate(etd) : '';
    rows.push({ key, eta: etaI === null ? 'x' : etaI, etd: etdI === null ? 'x' : etdI });
  }
  if (!rows.length) { toast('ไม่พบข้อมูลในคอลัมน์ C/M/N ของไฟล์', 'err'); return; }
  if (!(await confirmModal('Upload 1.9',
    `พบ ${rows.length} รายการ — อัปเดตเฉพาะ ETA / ETD (ค่าว่างจะไม่ทับของเดิม)`))) return;
  const { showBulkResult } = await import('./charge-export.js');
  const res = await upload19Batch(ctx.charge, ctx.group, rows);
  showBulkResult('ผล Upload 1.9', res);
  ctx.refresh();
}

/* ---------- CONTACT LIST (LIST NAME.xlsx): Company Invoice → Contact ---------- */
export async function runContactUpload() {
  const file = await pickFile(); if (!file) return;
  const grid = await readSheet(file);
  const pairs = [];
  for (const r of grid) {
    const company = String(r[0] ?? '').trim();
    const contact = String(r[1] ?? '').trim();
    if (!company || /^(company|บริษัท)/i.test(company)) continue;
    pairs.push({ company, contact });
  }
  if (!pairs.length) { toast('ไฟล์ต้องมี 2 คอลัมน์: Company Invoice | Contact', 'err'); return; }
  if (!(await confirmModal('อัปโหลด LIST NAME',
    `พบ ${pairs.length} รายการ — อัปเดต Contact ของ Company Invoice (ข้อมูลหลัก)`))) return;
  const { showBulkResult } = await import('./charge-export.js');
  const res = await uploadContactList(pairs);
  showBulkResult('ผลอัปเดต Contact List', res);
}
