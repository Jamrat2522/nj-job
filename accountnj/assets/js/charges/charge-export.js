/* EXPORT ทั้งหมดของหน้ารายการ — อ่านข้อมูลผ่าน njacc_export_charges (server-side filter)
   SheetJS + JSZip โหลดแบบ lazy เฉพาะตอนใช้งาน */
import { exportCharges } from './charge-api.js';
import { loadScript } from '../lazy/lazy-loader.js';
import { toast } from '../components/toast.js';
import { openModal, closeModal } from '../components/modal.js';
import { dmy, esc, money } from '../core/formatter.js';
import { groupLabel, chargeLabel } from '../config/charge-groups.js';
import { AppState } from '../core/state.js';

const XLSX_CDN = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
export async function xlsx() { await loadScript(XLSX_CDN); return window.XLSX; }
async function jszip() { await loadScript(JSZIP_CDN); return window.JSZip; }

/* ── COMPATIBILITY COLUMNS 27 คอลัมน์ ตามไฟล์ BILLING เดิม (ลำดับสำคัญ) ──
   หมายเหตุ: หัวคอลัมน์ "Total Amout" สะกดตามไฟล์เดิมโดยตั้งใจ เพื่อให้ไฟล์เข้ากันได้
   Invoice No. ในชุดนี้ = source_invoice_no (เลขของระบบเดิม) ไม่ใช่ accounting invoice */
export const COMPAT_COLS = [
  ['date', 'Date', 'date'],
  ['_item', 'Item', 'seq'],
  ['source_invoice_no', 'Invoice No.'],
  ['master_bl_no', 'Master'],
  ['house_bl_no', 'House B/l No.'],
  ['data_type', 'Data Type'],
  ['company_invoice', 'Company Invoice'],
  ['customs_declaration_no', 'DCL INV.'],
  ['customer_job_no', 'Customer Job No.'],
  ['service_amount', 'Service charge', 'num'],
  ['advance_amount', 'Advance', 'num'],
  ['vat_amount', 'VAT 7%', 'num'],
  ['subtotal', 'Amount', 'num'],
  ['wht_amount', 'WHT 3%', 'num'],
  ['net_payable', 'Total Amout', 'num'],
  ['credit_term_days', 'Credit Term'],
  ['cs_name', 'Name CS'],
  ['operational_status', 'Status'],
  ['customer_name', 'Customer name'],
  ['i_billing_apl', 'APL Billing'],
  ['due_date', 'Due Date', 'date'],
  ['_remaining', 'Remaining', 'remaining'],
  ['note', 'NOTE'],
  ['case_no', 'CASE'],
  ['eta', 'ETA', 'date'],
  ['etd', 'ETD', 'date'],
  ['contact', 'Contact'],
];

const remainingText = (r) => {
  if (r.invoice_status === 'VOID') return 'VOID';
  if (r.payment_status === 'PAID') return 'ชำระแล้ว';
  if (!r.due_date) return '';
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const d = Math.round((new Date(r.due_date + 'T00:00:00') - t) / 86400000);
  return d < 0 ? 'เกิน ' + Math.abs(d) + ' วัน' : (d === 0 ? 'ครบวันนี้' : 'เหลือ ' + d + ' วัน');
};

function cell(r, def, idx) {
  const [key, , kind] = def;
  if (kind === 'seq') return idx + 1;
  if (kind === 'remaining') return remainingText(r);
  const v = r[key];
  if (v === null || v === undefined || v === '') return '';
  if (kind === 'date') return dmy(v);          // DD/MM/YYYY ตามไฟล์เดิม
  if (kind === 'num') return Number(v);
  return v;
}
export function toAoA(rows, cols = COMPAT_COLS) {
  return [cols.map(c => c[1]), ...rows.map((r, i) => cols.map(c => cell(r, c, i)))];
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 6000);
}
const stamp = () => new Date().toISOString().slice(0, 10);
const fname = (ctx, suffix, ext) => `${ctx.charge}_${ctx.group}_${suffix}_${stamp()}.${ext}`;
const safeSheet = (s) => (String(s || '').replace(/[\\/?*[\]:]/g, ' ').slice(0, 28) || 'DATA');

/* ดึงข้อมูล export แบบแบ่งหน้า จนกว่า has_more=false — ห้าม silent truncate
   ถ้า total เกิน hard limit (100,000) server จะคืน truncated=true → ไม่สร้างไฟล์ */
export async function fetchRows(ctx, onProgress) {
  const PAGE = 1000;
  const all = [];
  let page = 1, total = 0;
  for (;;) {
    const res = await exportCharges({ charge: ctx.charge, group: ctx.group, filters: ctx.filters,
      exportPage: page, exportSize: PAGE });
    total = res.total || 0;
    if (res.truncated) {
      toast(`ข้อมูลเกิน ${(res.hard_limit || 100000).toLocaleString('th-TH')} รายการ กรุณากรองช่วงวันที่`, 'err');
      return null;                       /* ไม่ดาวน์โหลดไฟล์ที่ไม่ครบ */
    }
    all.push(...(res.rows || []));
    if (onProgress) onProgress(all.length, total);
    if (!res.has_more) break;
    page += 1;
    if (page > 200) { toast('ดึงข้อมูลไม่ครบ กรุณาแคบตัวกรอง', 'err'); return null; }
  }
  if (!all.length) { toast('ไม่มีข้อมูลตามตัวกรองปัจจุบัน', 'err'); return null; }
  if (all.length !== total) { toast(`ข้อมูลไม่ครบ (${all.length}/${total}) — ยกเลิกการส่งออก`, 'err'); return null; }
  return all;
}

/* กล่องแสดงความคืบหน้าตอนดึงข้อมูลจำนวนมาก */
function progress(title) {
  const b = document.createElement('div');
  b.innerHTML = `<div class="load-row"><div class="spin"></div><div class="mt-1" id="ex-prog">กำลังดึงข้อมูล…</div></div>`;
  openModal({ title, body: b });
  return {
    set: (n, t) => { const el = document.getElementById('ex-prog'); if (el) el.textContent = `${n.toLocaleString('th-TH')} / ${t.toLocaleString('th-TH')} แถว`; },
    close: () => closeModal(),
  };
}

/* จัดรูปแบบ workbook: ความกว้างคอลัมน์ + number/date format + แถว TOTAL */
const MONEY_COLS = ['service_amount', 'advance_amount', 'vat_amount', 'subtotal', 'wht_amount', 'net_payable'];
function styleSheet(X, aoa, cols) {
  const ws = X.utils.aoa_to_sheet(aoa);
  ws['!cols'] = cols.map(c => ({ wch: Math.max(10, Math.min(28, String(c[1]).length + 4)) }));
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  const range = X.utils.decode_range(ws['!ref']);
  for (let R = 1; R <= range.e.r; R++) {
    for (let C = 0; C <= range.e.c; C++) {
      const cell = ws[X.utils.encode_cell({ r: R, c: C })];
      if (!cell) continue;
      if (typeof cell.v === 'number' && MONEY_COLS.includes(cols[C] && cols[C][0])) {
        cell.t = 'n'; cell.z = '#,##0.00';
      }
    }
  }
  return ws;
}
function totalRow(rows, cols) {
  const r = cols.map(c => '');
  const iLabel = cols.findIndex(c => c[0] === 'customer_job_no');
  r[iLabel >= 0 ? iLabel : 0] = 'TOTAL';
  cols.forEach((c, i) => {
    if (MONEY_COLS.includes(c[0])) {
      r[i] = rows.reduce((s, x) => s + (Number(x[c[0]]) || 0), 0);   /* รวมเฉพาะตัวเลข ไม่ SUM text */
    }
  });
  return r;
}

/* ---------- Export Excel (compatibility 27 คอลัมน์) ----------
   "Export Excel" และ "Export ทั้งหมด" ใช้ชุดคอลัมน์เดียวกันทั้งคู่ (compatibility ล้วน)
   คอลัมน์ฝั่ง Accounting อยู่ที่เมนู ACCOUNTING > Report ไม่ปนในปุ่มของ Billing เดิม */
export async function exportExcel(ctx, allRows = false) {
  const pg = progress(allRows ? 'Export ทั้งหมด' : 'Export Excel');
  let rows;
  try { rows = await fetchRows(ctx, pg.set); } finally { pg.close(); }
  if (!rows) return;
  const X = await xlsx();
  const aoa = toAoA(rows);
  aoa.push([], totalRow(rows, COMPAT_COLS));
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, styleSheet(X, aoa, COMPAT_COLS), safeSheet(ctx.charge));
  X.writeFile(wb, fname(ctx, allRows ? 'ALL' : 'LIST', 'xlsx'));
  toast(`ส่งออก ${rows.length.toLocaleString('th-TH')} แถวแล้ว`, 'ok');
}

/* ---------- Export Fast CSV (ไม่โหลด library) ---------- */
export async function exportCsv(ctx) {
  const pg = progress('Export Fast CSV');
  let rows; try { rows = await fetchRows(ctx, pg.set); } finally { pg.close(); }
  if (!rows) return;
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '\uFEFF' + toAoA(rows).map(r => r.map(q).join(',')).join('\r\n');
  download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), fname(ctx, 'FAST', 'csv'));
  toast(`ส่งออก CSV ${rows.length} แถว`, 'ok');
}

/* ---------- Export Customer: 1 ไฟล์ต่อ 1 ลูกค้า รวมเป็น ZIP ---------- */
export async function exportByCustomerZip(ctx) {
  const pg = progress('Export Customer (ZIP)');
  let rows; try { rows = await fetchRows(ctx, pg.set); } finally { pg.close(); }
  if (!rows) return;
  const X = await xlsx(); const JSZip = await jszip();
  const zip = new JSZip();
  const byCust = new Map();
  rows.forEach(r => {
    const k = r.customer_name || '(ไม่ระบุลูกค้า)';
    if (!byCust.has(k)) byCust.set(k, []);
    byCust.get(k).push(r);
  });
  for (const [cust, list] of byCust) {
    const wb = X.utils.book_new();
    const aoa = toAoA(list); aoa.push([], totalRow(list, COMPAT_COLS));
    X.utils.book_append_sheet(wb, styleSheet(X, aoa, COMPAT_COLS), safeSheet(cust));
    const buf = X.write(wb, { bookType: 'xlsx', type: 'array' });
    zip.file(`${String(cust).replace(/[\\/:*?"<>|]/g, ' ').slice(0, 60)}.xlsx`, buf);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const label = ctx.charge === 'SERVICE' ? 'ServiceCharge' : 'AdvanceCharge';
  download(blob, `${label}_ByCustomer_${stamp()}.zip`);
  toast(`ส่งออก ${byCust.size} ไฟล์ (1 ไฟล์ต่อลูกค้า)`, 'ok');
}

/* ---------- SOA 21 คอลัมน์ (A–U) · บังคับเลือกลูกค้าก่อน ----------
   Mapping ตาม Billing เดิม: Invoice Number = source_invoice_no · Due Date = date + 30
   ช่องที่ New DB ไม่มีข้อมูลจริง (Container / Kewill / Period / Category / Comment) เว้นว่าง ไม่เดา */
const SOA_HEAD = ['Supplier Name', 'JOB NO.', 'JOB COMPLETED DATE', 'Invoice Number', 'Invoice Date',
  'Due Date', 'Amount', 'Local Currency', 'Container number', 'BOL / AWB Number', 'Payment Terms',
  'Invoice Age', 'PO number', 'Ageing', 'Kewill / PO Received Date', 'Kewill / PO requested Date',
  'Period (days)', 'Vendor Comment', 'Contact person', 'Category', 'AP Comment'];

const ageBucket = (d) => {
  if (d === '' || d === null || d === undefined) return '';
  if (d <= 2) return '0-2';
  if (d <= 7) return '3-7';
  if (d <= 15) return '8-15';
  if (d <= 30) return '16-30';
  if (d <= 60) return '31-60';
  if (d <= 90) return '61-90';
  return '>91';
};
const plus30 = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return '';
  d.setDate(d.getDate() + 30);
  return dmy(d.toISOString().slice(0, 10));
};

export async function exportSoa(ctx) {
  if (!ctx.filters.customer) { toast('กรุณาเลือก Customer ก่อน Export SOA', 'err'); return; }
  const pg = progress('Export SOA');
  let all; try { all = await fetchRows(ctx, pg.set); } finally { pg.close(); }
  if (!all) return;
  const rows = all.filter(r => r.source_invoice_no || r.invoice_no);
  if (!rows.length) { toast('ไม่มีรายการสำหรับ SOA ตามตัวกรองนี้', 'err'); return; }
  const custNames = [...new Set(rows.map(r => r.customer_name).filter(Boolean))];
  if (custNames.length > 1) { toast('SOA ต้องเป็นลูกค้าเดียวเท่านั้น — ตรวจตัวกรองอีกครั้ง', 'err'); return; }

  const X = await xlsx();
  const today = new Date();
  const ageDays = (d) => d ? Math.round((today - new Date(d + 'T00:00:00')) / 86400000) : '';
  const body = rows.map(r => {
    const cjob = String(r.customer_job_no || '').trim().toUpperCase();
    const noJob = cjob === '' || cjob === 'N/A' || cjob === 'NA' || cjob === '-';
    const age = ageDays(r.date);
    return [
      'N.J.',                                   // A Supplier Name
      '',                                       // B JOB NO. (เว้นตาม compatibility)
      dmy(r.date),                              // C JOB COMPLETED DATE
      r.source_invoice_no || '',                // D Invoice Number (source)
      dmy(r.date),                              // E Invoice Date
      plus30(r.date),                           // F Due Date = date + 30
      r.net_payable === null || r.net_payable === undefined ? '' : Number(r.net_payable), // G Amount
      'THB',                                    // H Local Currency
      '',                                       // I Container number (ไม่มีแหล่งยืนยัน)
      '',                                       // J BOL / AWB (compatibility เดิมเว้นว่าง)
      '30 Days',                                // K Payment Terms
      age,                                      // L Invoice Age
      noJob ? 'Waiting Kewill / PO' : r.customer_job_no,  // M PO number
      ageBucket(age),                           // N Ageing
      dmy(r.etd),                               // O Kewill / PO Received Date
      dmy(r.eta),                               // P Kewill / PO requested Date
      '',                                       // Q Period (days)
      r.case_no || '',                          // R Vendor Comment
      r.contact || '',                          // S Contact person
      '',                                       // T Category
      '',                                       // U AP Comment
    ];
  });
  /* 5 แถวหัวตาม template เดิม (freeze ySplit=5) */
  const aoa = [
    ['STATEMENT OF ACCOUNT'],
    [`ลูกค้า: ${custNames[0] || '-'}`],
    [`${chargeLabel(ctx.charge)} / ${groupLabel(ctx.group)}`, '', `พิมพ์เมื่อ ${dmy(stamp())}`],
    [],
    SOA_HEAD,
    ...body,
    [],
    ['', '', '', '', '', 'TOTAL', body.reduce((s2, r) => s2 + (Number(r[6]) || 0), 0)],
  ];
  const ws = X.utils.aoa_to_sheet(aoa);
  ws['!cols'] = SOA_HEAD.map(h => ({ wch: Math.max(12, Math.min(26, h.length + 4)) }));
  ws['!freeze'] = { xSplit: 0, ySplit: 5 };
  const range = X.utils.decode_range(ws['!ref']);
  for (let R = 5; R <= range.e.r; R++) {                 // คอลัมน์ G = Amount
    const c = ws[X.utils.encode_cell({ r: R, c: 6 })];
    if (c && typeof c.v === 'number') { c.t = 'n'; c.z = '#,##0.00'; }
  }
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, 'SOA_WK9');
  X.writeFile(wb, `SOA_${safeSheet(custNames[0])}_${stamp()}.xlsx`);
  toast(`ส่งออก SOA ${body.length} รายการ`, 'ok');
}

/* ---------- MAERSK: Export Excel CASE (CASE / NO CASE → ZIP) ----------
   Mapping ตาม Billing เดิม:
     Customer name → company_invoice · Case no → case_no · CM Send Date → ETD
     Supplier Inv No. → source_invoice_no · Execution Date → ETD
     Booking no./Job no. → house_bl_no · Kewill no → customer_job_no · Remark → ว่าง
   Split: normalize(case_no) === 'NO CASE' → NO CASE.xlsx · ที่เหลือทั้งหมด (รวม blank) → CASE.xlsx */
const CASE_HEAD = ['Item', 'Customer name', 'Case no', 'CM Send Date', 'Supplier Inv No.',
  'Execution Date', 'Booking no./Job no.', 'Kewill no', 'Remark'];

export async function exportMaerskCase(ctx) {
  if (ctx.group !== 'MAERSK') { toast('ฟังก์ชันนี้ใช้ได้เฉพาะ MAERSK', 'err'); return; }
  if (!ctx.filters.customer) { toast('กรุณาเลือก Customer ก่อน Export CASE', 'err'); return; }
  const pg = progress('Export Excel CASE');
  let all; try { all = await fetchRows(ctx, pg.set); } finally { pg.close(); }
  if (!all) return;
  /* เฉพาะแถวที่ Customer Job No. ว่างหรือ N/A ตาม Billing เดิม */
  const target = all.filter(r => {
    const v = String(r.customer_job_no || '').trim().toUpperCase();
    return v === '' || v === 'N/A' || v === 'NA' || v === '-';
  });
  if (!target.length) { toast('ไม่มีแถวที่ Customer Job No. ว่าง/N/A ตามตัวกรองนี้', 'err'); return; }

  const isNoCase = (r) => String(r.case_no || '').trim().toUpperCase().replace(/\s+/g, ' ') === 'NO CASE';
  const noCase = target.filter(isNoCase);
  const withCase = target.filter(r => !isNoCase(r));
  if (noCase.length + withCase.length !== target.length) { toast('การแยก CASE ไม่สมดุล — ยกเลิก', 'err'); return; }

  const X = await xlsx(); const JSZip = await jszip();
  const mk = (rows) => [CASE_HEAD, ...rows.map((r, i) => ([
    i + 1,
    r.company_invoice || '',      // Customer name ← Company Invoice
    r.case_no || '',
    dmy(r.etd),                   // CM Send Date ← ETD
    r.source_invoice_no || '',    // Supplier Inv No.
    dmy(r.etd),                   // Execution Date ← ETD
    r.house_bl_no || '',          // Booking no./Job no.
    r.customer_job_no || '',      // Kewill no
    '',                           // Remark
  ]))];
  const zip = new JSZip();
  for (const [name, list] of [['CASE', withCase], ['NO CASE', noCase]]) {
    if (!list.length) continue;
    const wb = X.utils.book_new();
    const ws = X.utils.aoa_to_sheet(mk(list));
    ws['!cols'] = CASE_HEAD.map(h => ({ wch: Math.max(12, h.length + 4) }));
    X.utils.book_append_sheet(wb, ws, safeSheet(name));
    zip.file(`${name}.xlsx`, X.write(wb, { bookType: 'xlsx', type: 'array' }));
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  download(blob, `MAERSK_CASE_${stamp()}.zip`);
  toast(`รวม ${target.length} แถว → CASE ${withCase.length} · NO CASE ${noCase.length}`, 'ok');
}

/* ---------- ส่งออกรายการที่ไม่พบจาก Bulk tools ---------- */
export async function exportNotFound(list, title) {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '\uFEFF' + [['KEY'], ...list.map(k => [k])].map(r => r.map(q).join(',')).join('\r\n');
  download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${title}_${stamp()}.csv`);
}

/* ---------- แสดงผลลัพธ์ Bulk แบบละเอียด ---------- */
export function showBulkResult(title, res) {
  const nf = res.not_found || [], amb = res.ambiguous || [];
  const same = res.skipped_same_status || [], can = res.skipped_canceled || [];
  const bad = res.invalid_date || [];
  const line = (lb, arr, cls) => arr.length
    ? `<div class="mt-1"><b class="${cls}">${lb} (${arr.length})</b>
        <div class="t-xs t-2 ellip" title="${esc(arr.join(', '))}">${esc(arr.slice(0, 30).join(', '))}${arr.length > 30 ? ' …' : ''}</div></div>` : '';
  const b = document.createElement('div');
  b.innerHTML = `
    <div class="row"><span>สำเร็จ</span><span class="sp"></span><b class="money-pos">${res.matched ?? 0}</b>
      <span class="t-3">/ ${res.requested ?? 0} รายการ</span></div>
    ${line('ไม่พบในระบบ', nf, 'money-neg')}
    ${line('ซ้ำ/กำกวม (ไม่แตะข้อมูล)', amb, 'money-neg')}
    ${line('ข้ามเพราะสถานะเดิมอยู่แล้ว', same, 't-2')}
    ${line('ข้ามเพราะถูกยกเลิก', can, 't-2')}
    ${line('วันที่ไม่ถูกต้อง', bad, 'money-neg')}`;
  const f = document.createElement('div');
  const all = nf.concat(amb);
  f.innerHTML = `${all.length ? '<button class="btn btn-o" id="bk-exp">⬇ ส่งออกรายการที่ไม่สำเร็จ</button>' : ''}
    <button class="btn btn-p" data-close>ปิด</button>`;
  openModal({ title, body: b, footer: f });
  const ex = f.querySelector('#bk-exp');
  if (ex) ex.onclick = () => exportNotFound(all, 'not_found');
}

/* ---------- คำนวณยอดรวม ---------- */
export function showTotals(k, ctx) {
  openModal({
    title: 'ยอดรวมตามตัวกรองปัจจุบัน',
    body: `<table class="tbl">
      <tr><td>จำนวนงาน</td><td class="r t-b">${(k.total_job || 0).toLocaleString('th-TH')}</td></tr>
      <tr><td>Service charge</td><td class="r">${money(k.service_charge)}</td></tr>
      <tr><td>Advance charge</td><td class="r">${money(k.advance_charge)}</td></tr>
      <tr><td>VAT</td><td class="r">${money(k.vat)}</td></tr>
      <tr><td>Gross (subtotal + VAT)</td><td class="r">${money(k.gross_total)}</td></tr>
      <tr><td>WHT</td><td class="r">${money(k.wht_total)}</td></tr>
      <tr><td class="t-b">Total Amount (Net = Gross − WHT)</td><td class="r t-b">${money(k.total_amount)}</td></tr>
      <tr><td>ลูกหนี้เกินกำหนด</td><td class="r">${(k.total_overdue || 0).toLocaleString('th-TH')} ใบ</td></tr>
      <tr><td>งานเลย Due แต่ยังไม่ออก INV</td><td class="r">${(k.job_overdue_no_invoice || 0).toLocaleString('th-TH')} งาน</td></tr>
    </table><p class="t-xs t-3 mt-1">* คำนวณจากฐานข้อมูล (${chargeLabel(ctx.charge)} / ${groupLabel(ctx.group)}) ไม่ได้รวมฝั่งเบราว์เซอร์</p>`,
    footer: Object.assign(document.createElement('div'),
      { innerHTML: '<button class="btn btn-p" data-close>ปิด</button>' }),
  });
  void AppState;
}
