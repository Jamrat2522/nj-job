/* IMPORT ENGINE ของหน้ารายการ — อ่านไฟล์ที่ผู้ใช้อัปโหลดเท่านั้น (ไม่ query ตาราง BILLING เดิม)
   ส่งเข้า DB เป็น batch (100 แถว/ครั้ง) ผ่าน njacc_* RPC — ไม่ยิงทีละแถว
   Scope charge_type/company_group บังคับจากหน้าที่กด Upload (server ตรวจซ้ำ) */
import { importResolveMasters, importCreateMasters, importJobsBatch,
  accImportResolveMasters, accImportJobsBatch,
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
/* อ่านทั้ง xlsx/xls/csv ผ่าน SheetJS — CSV ใช้ parser ที่รองรับ quoted comma / newline / "" */
export async function readSheet(file) {
  const X = await xlsx();
  const name = (file.name || '').toLowerCase();
  let wb;
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    wb = X.read(await file.text(), { type: 'string', raw: false, cellDates: true });
  } else {
    wb = X.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  }
  const sh = wb.Sheets[wb.SheetNames[0]];
  return X.utils.sheet_to_json(sh, { header: 1, raw: false, defval: '' })
    .map(r => (r || []).map(v => (v == null ? '' : String(v).trim())));
}

/* normalize key ให้ตรงกับ njacc_norm_key ฝั่ง DB (trim + upper + ยุบช่องว่าง + ตัด .0) */
export const normKey = (v) => String(v ?? '').trim().toUpperCase()
  .replace(/\s+/g, ' ').replace(/\.0+$/, '');

/* Credit Term: "30", "30 Days", " 45 ", "60 DAYS" → ตัวเลข · อ่านไม่ได้ → null */
export function parseCreditTerm(v) {
  const s = String(v ?? '').trim();
  if (s === '') return '';
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(d|day|days|วัน)?\.?$/i);
  if (!m) return null;
  return String(Math.round(Number(m[1])));
}

/* หา header row + คืน index ของคอลัมน์ตามชื่อที่รองรับ (ไม่เดา A/B ถ้ามี header จริง) */
export function findHeaderCols(grid, spec, scanRows = 10) {
  for (let i = 0; i < Math.min(scanRows, grid.length); i++) {
    const row = (grid[i] || []).map(c => String(c || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.:]/g, ''));
    const found = {};
    for (const [field, names] of Object.entries(spec)) {
      const idx = row.findIndex(c => names.includes(c));
      if (idx >= 0) found[field] = idx;
    }
    if (Object.keys(found).length === Object.keys(spec).length) return { headerRow: i, cols: found };
  }
  return null;
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
/* ADVANCE safeguard: advance/amount ว่างแต่มี total (vat=0, wht=0) → derive จาก total
   คืน true เมื่อมีการ derive จริง (ใช้ทดสอบ/รายงานได้) */
export function deriveAdvanceFromTotal(charge, money) {
  if (charge !== 'ADVANCE') return false;
  const n = (v) => (v === '' || v === null || v === undefined) ? 0 : Number(v);
  if (!('total_amount' in money)) return false;
  const total = n(money.total_amount);
  if (!(total > 0)) return false;
  if (n(money.vat) !== 0 || n(money.wht) !== 0) return false;
  if (n(money.advance) !== 0) return false;
  money.advance = total;
  if (n(money.amount) === 0) money.amount = total;
  return true;
}

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
  const invalidTerm = [];
  for (let i = hIdx + 1; i < grid.length; i++) {
    const raw = grid[i];
    const key = String(raw[colOf.key] ?? '').trim();
    if (!key) continue;
    const nkey = normKey(key);
    const fields = {};
    let bad = false;
    for (const f of presentFields) {
      let v = String(raw[colOf[f]] ?? '').trim();
      if (DATE_FIELDS.includes(f)) {
        const iso = toISODate(v);
        if (iso === null) { bad = true; break; }
        v = iso;
      } else if (f === 'credit_term_days') {
        const ct = parseCreditTerm(v);
        if (ct === null) { invalidTerm.push(key); v = ''; } else v = ct;
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
    /* ── SAFEGUARD (ADVANCE เท่านั้น) ยกจาก BILLING เดิม ──
       บางไฟล์ต้นทางปล่อย "Advance"/"Amount" ว่าง ใส่ยอดมาแค่ "Total Amout"
       → advance เข้า DB เป็น 0 ทั้งที่ยอดจริงมี
       กฎธุรกิจจากไฟล์จริง: advance == amount == total_amount และ vat=0 wht=0
       เงื่อนไขแคบ: เฉพาะเมื่อ vat==0 && wht==0 && total>0 และ advance ยังว่าง/0
       ─ แถวที่มี advance อยู่แล้ว ไม่ถูกแตะ
       ─ แถวที่มี vat/wht (total ≠ advance) ไม่ถูกแตะ — กันเดา
       ─ ไม่ยุ่ง SERVICE / total_amount / คอลัมน์อื่น */
    if (hasMoney) deriveAdvanceFromTotal(ctx.charge, money);
    const rec = { key, fields, money: hasMoney ? money : null };
    /* ไฟล์เดียวกัน key ซ้ำ → ยึดแถวล่างสุด แต่ต้องรายงาน */
    if (seen.has(nkey)) { dupInFile.push(key); rows[seen.get(nkey)] = rec; }
    else { seen.set(nkey, rows.length); rows.push(rec); }
  }
  if (!rows.length) { toast('ไม่พบแถวข้อมูลที่ใช้ได้ในไฟล์', 'err'); return; }

  /* ── V.298 ── เลือกเส้นทาง RPC ตาม Module ของหน้าที่กด Upload
       ctx.mode = 'accounting'  -> njacc_acc_import_* (RUN-50) UPDATE EXISTING ONLY
       ctx.mode อื่น            -> njacc_import_*     (DOCUMENT Flow เดิม 100%)
     ctx.mode มาจาก charge-page.js:69 (mode || 'document') ผูกกับ route โดยตรง
     -> ไม่ได้เดาจาก charge/group และหน้า DOCUMENT ไม่เปลี่ยนพฤติกรรมแม้แต่นิดเดียว */
  const isAcc = ctx.mode === 'accounting';

  /* ---- Preview: ตรวจ master ก่อน (exact normalized เท่านั้น) ---- */
  const custNames = [...new Set(rows.map(r => r.fields.customer_name).filter(Boolean))];
  const compNames = [...new Set(rows.map(r => r.fields.company_invoice).filter(Boolean))];
  let resolved = { customers: [], companies: [] };
  if (custNames.length || compNames.length) {
    resolved = isAcc
      ? await accImportResolveMasters(ctx.charge, ctx.group, custNames, compNames)
      : await importResolveMasters(ctx.charge, ctx.group, custNames, compNames);
  }
  const missCust = (resolved.customers || []).filter(c => c.status !== 'OK');
  const missComp = (resolved.companies || []).filter(c => c.status !== 'OK');

  const ok = await previewDialog({
    file: file.name, total: rows.length, fields: presentFields, hasMoney,
    dupInFile, invalidDate, invalidTerm, missCust, missComp, ctx, isAcc,
  });
  if (!ok) return;
  /* ACCOUNTING ห้ามสร้าง Master — ปุ่มไม่ถูก render อยู่แล้ว (previewDialog)
     ด่านที่ 2 กันการเรียกจากทางอื่น · ด่านสุดท้ายอยู่ที่ RPC (ADMIN+ เท่านั้น) */
  if (ok === 'create-masters' && isAcc) return;
  if (ok === 'create-masters') {
    await importCreateMasters(missCust.filter(c => c.status === 'NOT_FOUND').map(c => c.name),
      missComp.filter(c => c.status === 'NOT_FOUND').map(c => c.name));
    toast('สร้างข้อมูลหลักที่ขาดแล้ว', 'ok');
  }

  /* ---- ส่งเป็น batch ---- */
  const CHUNK = 100;
  const sum = { inserted: 0, updated: 0, skipped: 0, ambiguous: [], unresolved_master: [], failed: [], invoiced_locked: [], not_found: [] };
  const prog = progressDialog(rows.length);
  try {
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const res = isAcc
        ? await accImportJobsBatch(ctx.charge, ctx.group, chunk)
        : await importJobsBatch(ctx.charge, ctx.group, chunk);
      sum.inserted += res.inserted || 0;
      sum.updated += res.updated || 0;
      sum.skipped += res.skipped || 0;
      sum.ambiguous = sum.ambiguous.concat(res.ambiguous || []);
      sum.unresolved_master = sum.unresolved_master.concat(res.unresolved_master || []);
      sum.failed = sum.failed.concat(res.failed || []);
      sum.invoiced_locked = sum.invoiced_locked.concat(res.invoiced_locked || []);
      /* not_found = ACCOUNTING เท่านั้น (RUN-50) · DOCUMENT ไม่ส่ง key นี้ -> [] */
      sum.not_found = sum.not_found.concat(res.not_found || []);
      prog.update(Math.min(i + CHUNK, rows.length));
    }
  } finally { prog.close(); }

  resultDialog(sum, dupInFile, invalidDate, invalidTerm, isAcc);
  ctx.refresh();
}

function previewDialog(info) {
  return new Promise(res => {
    /* ── V.298 ── ACCOUNTING ห้ามสร้าง Customer/Company Master ไม่ว่า Role ใด
       (แม้ SUPER_ADMIN ที่เปิดหน้า ACCOUNTING) -> ไม่ render ปุ่มนี้เลย
       หน้า DOCUMENT ยังใช้เงื่อนไข isAdmin() เดิมทุกประการ */
    const canCreate = !info.isAcc && isAdmin() &&
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
      ${info.isAcc ? `<p class="t-xs money-neg">โหมด ACCOUNTING: อัปเดตงานที่มีอยู่แล้วเท่านั้น
        — ไม่สร้างงานใหม่ ไม่สร้างข้อมูลลูกค้า/บริษัท · ไม่พบงานจะรายงานเป็น "ไม่พบงานในระบบ"</p>` : ''}
      ${info.dupInFile.length ? `<div class="mt-1"><b>ซ้ำในไฟล์ (${info.dupInFile.length})</b>
        <div class="t-xs t-2">ยึดแถวล่างสุด: ${esc(info.dupInFile.slice(0, 20).join(', '))}</div></div>` : ''}
      ${info.invalidDate.length ? `<div class="mt-1"><b class="money-neg">วันที่ไม่ถูกต้อง (${info.invalidDate.length})</b>
        <div class="t-xs t-2">${esc(info.invalidDate.slice(0, 20).join(', '))}</div></div>` : ''}
      ${(info.invalidTerm || []).length ? `<div class="mt-1"><b class="money-neg">Credit Term อ่านไม่ได้ (${info.invalidTerm.length})</b>
        <div class="t-xs t-2">${esc(info.invalidTerm.slice(0, 20).join(', '))} — ระบบจะไม่เดาค่าให้</div></div>` : ''}
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

function resultDialog(sum, dupInFile, invalidDate, invalidTerm = [], isAcc = false) {
  const line = (lb, arr, cls) => arr.length
    ? `<div class="mt-1"><b class="${cls}">${lb} (${arr.length})</b>
        <div class="t-xs t-2">${esc(arr.slice(0, 25).map(x => typeof x === 'string' ? x : (x.key || JSON.stringify(x))).join(', '))}${arr.length > 25 ? ' …' : ''}</div></div>` : '';
  const b = document.createElement('div');
  b.innerHTML = `
    <table class="tbl">
      ${/* ── V.298 ── ACCOUNTING = UPDATE EXISTING ONLY จึงไม่มีบรรทัด "เพิ่มใหม่"
            (RPC คืน inserted = 0 เสมอ) · DOCUMENT ยังแสดงเหมือนเดิมทุกประการ */''}
      ${isAcc ? '' : `<tr><td>เพิ่มใหม่</td><td class="r t-b money-pos">${sum.inserted}</td></tr>`}
      <tr><td>อัปเดต</td><td class="r t-b">${sum.updated}</td></tr>
      <tr><td>ข้าม</td><td class="r">${sum.skipped}</td></tr>
    </table>
    ${line('ไม่พบงานในระบบ (ไม่สร้างงานใหม่)', (sum.not_found || []), 'money-neg')}
    ${line('ซ้ำในระบบ/กำกวม (ไม่แตะข้อมูล)', sum.ambiguous, 'money-neg')}
    ${line('ข้อมูลหลักไม่ตรง (ข้ามแถว)', sum.unresolved_master, 'money-neg')}
    ${line('ผิดพลาด', sum.failed, 'money-neg')}
    ${line('ซ้ำในไฟล์ (ใช้แถวล่างสุด)', dupInFile, 't-2')}
    ${line('วันที่ไม่ถูกต้อง (ข้าม)', invalidDate, 'money-neg')}
    ${line('Credit Term อ่านไม่ได้ (ไม่บันทึกค่านั้น)', invalidTerm, 'money-neg')}
    ${line('งานที่ออก INVOICE แล้ว — ฟิลด์บัญชีถูกล็อก', (sum.invoiced_locked || []), 'money-neg')}`;
  const f = document.createElement('div');
  f.innerHTML = '<button class="btn btn-p" data-close>ปิด</button>';
  openModal({ title: 'ผลการนำเข้า', body: b, footer: f, large: true });
}

/* ---------- APL BILLING UPLOAD ----------
   Logic ยกมาจาก BILLING เดิม (aplImport) ทุกขั้น:
     - Column K (index 10) = Invoice        → match invoice
     - Column R (index 17) = ชื่อคนรับวางบิล → update i_billing_apl
     - header row ใช้เพื่อ "หาแถวเริ่มข้อมูล" เท่านั้น ห้ามใช้เลือกคอลัมน์
     - normInv: trim + upper + ตัด ".0+" ท้าย (เฉพาะค่าไม่มีช่องว่าง) + ยุบช่องว่าง
     - PREFIX gate: ชื่อคนรับวางบิลต้องขึ้นต้น NJ / NJL / GY / W (case-insensitive)
       ไม่ผ่าน → ข้าม ไม่ update ไม่ล้างค่าเดิม
     - dedupe by normalized invoice (ตัวแรกชนะ)
   Update เฉพาะ i_billing_apl (บังคับซ้ำฝั่ง DB ใน njacc_upload_apl_batch) */
export const APL_COL_K_IDX = 10;   /* Excel column K */
export const APL_COL_R_IDX = 17;   /* Excel column R */
export const APL_PREFIX_RE = /^(NJ|NJL|GY|W)/i;

/* normalize invoice — ตรงกับ normInv() ของ BILLING เดิมทุกขั้น */
export function normInv(v) {
  if (v == null) return '';
  let s = String(v).trim().toUpperCase();
  if (/^\S+\.0+$/.test(s)) s = s.replace(/\.0+$/, '');
  return s.replace(/\s+/g, ' ');
}

const normAplHeader = (s) => String(s || '').toLowerCase().replace(/[\s.\-_%/\\():,]/g, '');

/* หาแถว header — สแกน 20 แถวแรก · ไม่พบ → 0 (ตรงกับ findAplHeaderRow เดิม) */
export function findAplHeaderRow(grid) {
  const limit = Math.min(grid.length, 20);
  for (let i = 0; i < limit; i++) {
    for (const cell of (grid[i] || [])) {
      const raw = String(cell || '');
      if (normAplHeader(cell).indexOf('invoice') >= 0) return i;
      if (raw.indexOf('คนรับวางบิล') >= 0 || raw.indexOf('ผู้รับวางบิล') >= 0) return i;
    }
  }
  return 0;
}

export function parseAplGrid(grid) {
  const hi = findAplHeaderRow(grid);
  const rawHeaders = grid[hi] || [];
  if (rawHeaders.length < 11) return { error: 'ไฟล์มีคอลัมน์น้อยกว่า 11 — ไม่มี column K (Invoice)' };
  if (rawHeaders.length < 18) return { error: 'ไฟล์มีคอลัมน์น้อยกว่า 18 — ไม่มี column R (ชื่อคนรับวางบิล)' };

  const seen = new Set();
  const pairs = [];
  let blankInv = 0;
  const skippedPrefix = [];
  for (let i = hi + 1; i < grid.length; i++) {
    const r = grid[i] || [];
    const inv = normInv(r[APL_COL_K_IDX]);
    const apl = String(r[APL_COL_R_IDX] ?? '').trim();
    if (!inv) { blankInv++; continue; }
    if (!APL_PREFIX_RE.test(apl)) { skippedPrefix.push({ invoice: inv, aplName: apl }); continue; }
    if (seen.has(inv)) continue;
    seen.add(inv);
    pairs.push({ key: inv, value: apl });
  }
  return { headerRow: hi, pairs, blankInv, skippedPrefix };
}

export async function runAplUpload(ctx) {
  const file = await pickFile(); if (!file) return;
  const grid = await readSheet(file);
  const p = parseAplGrid(grid);
  if (p.error) { toast(p.error, 'err'); return; }
  if (!p.pairs.length) {
    toast(`ไม่มี Invoice ที่ผ่านเงื่อนไข — ข้าม prefix ${p.skippedPrefix.length} · invoice ว่าง ${p.blankInv}`, 'err');
    return;
  }
  if (!(await confirmModal('Upload APL Billing',
    `Column K = Invoice · Column R = ชื่อคนรับวางบิล (แถวข้อมูลเริ่มที่ ${p.headerRow + 2})<br>
     อ่านได้ ${p.pairs.length} รายการ · ข้าม prefix ไม่ใช่ NJ/NJL/GY/W ${p.skippedPrefix.length} · invoice ว่าง ${p.blankInv}<br>
     อัปเดตเฉพาะช่อง I BILLING APL เท่านั้น`))) return;
  const { showBulkResult } = await import('./charge-export.js');
  const res = await uploadAplBatch(ctx.charge, ctx.group, p.pairs);
  showBulkResult('ผล Upload APL Billing', res);
  ctx.refresh();
}

/* ---------- ตัดจบงาน (Upload) ----------
   Logic ยกมาจาก BILLING เดิม (bulkClose) ทุกขั้น:
     1) หา header ใน 15 แถวแรก — Invoice No. และ/หรือ Customer Job No.
        normalize header: trim + lower + ตัด [space _ .]
     2) พบอย่างน้อย 1 คอลัมน์ → อ่านเฉพาะคอลัมน์นั้นตั้งแต่ headerRow+1
     3) ไม่พบ header เลย → fallback อ่าน "ทุก cell" ของทุกแถว
     4) เก็บเฉพาะค่าที่ไม่ว่างและยาว ≤ 80 · Set = dedupe
   Match / NOT_FOUND / AMBIGUOUS / CLOSE ซ้ำ / CANCELED จัดการฝั่ง DB
   (njacc_bulk_set_status) — ไม่เดาฝั่ง client */
export const CLOSE_TOKEN_MAX = 80;
const normCloseHeader = (s) => String(s || '').trim().toLowerCase().replace(/[\s_.]+/g, '');
const CLOSE_INV_KEYS = ['invoiceno', 'invoice', 'invno', 'เลขที่ใบแจ้งหนี้'];
const CLOSE_JOB_KEYS = ['customerjobno', 'customerjob', 'jobno', 'job', 'เลขที่งาน'];

export function parseCloseUploadGrid(grid) {
  let invCol = -1, jobCol = -1, headerRow = -1;
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    const r = grid[i] || [];
    for (let c = 0; c < r.length; c++) {
      const h = normCloseHeader(r[c]);
      if (invCol < 0 && CLOSE_INV_KEYS.includes(h)) { invCol = c; headerRow = i; }
      if (jobCol < 0 && CLOSE_JOB_KEYS.includes(h)) { jobCol = c; headerRow = i; }
    }
    if (invCol >= 0 || jobCol >= 0) break;
  }
  const tokens = new Set();
  const add = (v) => {
    const s = String(v == null ? '' : v).trim();
    if (s && s.length <= CLOSE_TOKEN_MAX) tokens.add(s);
  };
  if (invCol >= 0 || jobCol >= 0) {
    for (let i = headerRow + 1; i < grid.length; i++) {
      const r = grid[i] || [];
      if (invCol >= 0) add(r[invCol]);
      if (jobCol >= 0) add(r[jobCol]);
    }
  } else {
    /* fallback: ไม่เจอ header — อ่านทุก cell */
    grid.forEach(r => { if (r) r.forEach(add); });
  }
  return { headerRow, invCol, jobCol, usedHeader: invCol >= 0 || jobCol >= 0, keys: [...tokens] };
}

/* ---------- UPLOAD 1.9 (ETA/ETD เท่านั้น) ----------
   Logic ยกมาจาก BILLING เดิม (upload19):
     1) หา header ใน 15 แถวแรก — เทียบตรงตัว 'invoice no.' / 'invoice no' / 'invoice'
        พบแล้วหา 'eta' / 'etd' ในแถวเดียวกัน
     2) ไม่พบ header เลย → fallback ตำแหน่งคงที่ hi=1 · C(2) / M(12) / N(13)
     3) พบ header แต่ไม่มี eta/etd → ใช้ 12 / 13
     4) normInv + dedupe · ค่าว่าง = ไม่ทับของเดิม (coalesce ฝั่ง DB) */
export const U19_FALLBACK = { headerRow: 1, inv: 2, eta: 12, etd: 13 };

/* DD/MM/YYYY (รองรับ / - .) → YYYY-MM-DD · Excel serial → วันที่ · รูปแบบอื่นคืนค่าเดิม
   (คืนค่าเดิมเพื่อให้ DB รายงานเป็น invalid_date แทนการเงียบ) */
export function toYMD19(v) {
  if (v == null) return '';
  const s = String(v).trim();
  if (!s) return '';
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = parseFloat(s);
    if (n > 20000 && n < 80000) {
      const dt = new Date(Math.round((n - 25569) * 86400000));
      if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    }
  }
  return s;
}

export function parse19Grid(grid) {
  let hi = -1, invCol = -1, etaCol = -1, etdCol = -1;
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    const row = (grid[i] || []).map(c => String(c == null ? '' : c).trim().toLowerCase());
    const ci = row.findIndex(c => c === 'invoice no.' || c === 'invoice no' || c === 'invoice');
    if (ci !== -1) {
      hi = i; invCol = ci;
      etaCol = row.findIndex(c => c === 'eta');
      etdCol = row.findIndex(c => c === 'etd');
      break;
    }
  }
  const usedHeader = hi !== -1;
  if (!usedHeader) { hi = U19_FALLBACK.headerRow; invCol = U19_FALLBACK.inv; etaCol = U19_FALLBACK.eta; etdCol = U19_FALLBACK.etd; }
  if (etaCol === -1) etaCol = U19_FALLBACK.eta;
  if (etdCol === -1) etdCol = U19_FALLBACK.etd;

  const seen = new Set();
  const rows = [];
  let blankInv = 0;
  for (let i = hi + 1; i < grid.length; i++) {
    const r = grid[i] || [];
    const key = normInv(r[invCol]);
    if (!key) { blankInv++; continue; }
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ key, eta: toYMD19(r[etaCol]), etd: toYMD19(r[etdCol]) });
  }
  return { usedHeader, headerRow: hi, invCol, etaCol, etdCol, rows, blankInv };
}

export async function runUpload19(ctx) {
  const file = await pickFile('.xlsx,.xls,.csv'); if (!file) return;
  const grid = await readSheet(file);
  const p = parse19Grid(grid);
  if (!p.rows.length) { toast(`ไม่พบ Invoice ในไฟล์ (invoice ว่าง ${p.blankInv})`, 'err'); return; }
  const colName = (i) => String.fromCharCode(65 + i);
  if (!(await confirmModal('Upload 1.9',
    `${p.usedHeader ? `อ่านตามหัวตาราง (แถว ${p.headerRow + 1})` : 'ไม่พบหัวตาราง — ใช้ตำแหน่งคงที่'}
     · Invoice=${colName(p.invCol)} · ETA=${colName(p.etaCol)} · ETD=${colName(p.etdCol)}<br>
     พบ ${p.rows.length} รายการ — อัปเดตเฉพาะ ETA / ETD (ค่าว่างจะไม่ทับของเดิม)`))) return;
  const { showBulkResult } = await import('./charge-export.js');
  const res = await upload19Batch(ctx.charge, ctx.group, p.rows);
  showBulkResult('ผล Upload 1.9', res);
  ctx.refresh();
}

/* ---------- CONTACT LIST (LIST NAME.xlsx): Company Invoice → Contact ---------- */
export async function runContactUpload() {
  const file = await pickFile(); if (!file) return;
  const grid = await readSheet(file);
  const hit = findHeaderCols(grid, {
    company: ['company invoice', 'company', 'บริษัท', 'บริษัท invoice'],
    contact: ['contact', 'contact person', 'ผู้ติดต่อ', 'ชื่อผู้ติดต่อ'],
  });
  const pairs = [];
  const start = hit ? hit.headerRow + 1 : 0;
  const cIdx = hit ? hit.cols.company : 0;
  const nIdx = hit ? hit.cols.contact : 1;
  for (let i = start; i < grid.length; i++) {
    const company = String(grid[i][cIdx] ?? '').trim();
    const contact = String(grid[i][nIdx] ?? '').trim();
    if (!company) continue;
    if (!hit && /^(company|บริษัท)/i.test(company)) continue;
    pairs.push({ company, contact });
  }
  if (!pairs.length) { toast('ไม่พบคอลัมน์ Company Invoice / Contact ในไฟล์', 'err'); return; }
  if (!(await confirmModal('อัปโหลด LIST NAME',
    `พบ ${pairs.length} รายการ${hit ? ' (อ่านตามหัวตารางในไฟล์)' : ' (ไม่พบหัวตาราง — ใช้คอลัมน์ A/B)'}<br>
     อัปเดต Contact ของ Company Invoice (ข้อมูลหลัก)`))) return;
  const { showBulkResult } = await import('./charge-export.js');
  const res = await uploadContactList(pairs);
  showBulkResult('ผลอัปเดต Contact List', res);
}
