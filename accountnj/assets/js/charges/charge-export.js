/* EXPORT ทั้งหมดของหน้ารายการ — อ่านข้อมูลผ่าน njacc_export_charges (server-side filter)
   SheetJS + JSZip โหลดแบบ lazy เฉพาะตอนใช้งาน */
import { exportCharges } from './charge-api.js';
import { loadScript } from '../lazy/lazy-loader.js';
import { toast } from '../components/toast.js';
import { openModal } from '../components/modal.js';
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

/* ชุด Accounting (แยกจาก compatibility — ไม่ปนเลข invoice สองระบบ) */
const ACC_EXTRA = [
  ['invoice_no', 'Accounting Invoice No.'],
  ['invoice_status', 'Invoice Status'],
  ['payment_status', 'Payment Status'],
  ['gross_total', 'Gross Total', 'num'],
  ['job_no', 'Job No'],
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

export async function fetchRows(ctx) {
  const res = await exportCharges({ charge: ctx.charge, group: ctx.group, filters: ctx.filters });
  const rows = res.rows || [];
  if (!rows.length) { toast('ไม่มีข้อมูลตามตัวกรองปัจจุบัน', 'err'); return null; }
  if (rows.length >= (res.cap || 20000))
    toast('ข้อมูลถึงเพดาน ' + res.cap + ' แถว — กรุณาแคบตัวกรองลง', 'err');
  return rows;
}

/* ---------- Export Excel (compatibility 27 คอลัมน์) ---------- */
export async function exportExcel(ctx, withAccounting = false) {
  const rows = await fetchRows(ctx); if (!rows) return;
  const X = await xlsx();
  const cols = withAccounting ? COMPAT_COLS.concat(ACC_EXTRA) : COMPAT_COLS;
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(toAoA(rows, cols)), safeSheet(ctx.charge));
  X.writeFile(wb, fname(ctx, withAccounting ? 'ALL' : 'LIST', 'xlsx'));
  toast(`ส่งออก ${rows.length} แถวแล้ว`, 'ok');
}

/* ---------- Export Fast CSV (ไม่โหลด library) ---------- */
export async function exportCsv(ctx) {
  const rows = await fetchRows(ctx); if (!rows) return;
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '\uFEFF' + toAoA(rows).map(r => r.map(q).join(',')).join('\r\n');
  download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), fname(ctx, 'FAST', 'csv'));
  toast(`ส่งออก CSV ${rows.length} แถว`, 'ok');
}

/* ---------- Export Customer: 1 ไฟล์ต่อ 1 ลูกค้า รวมเป็น ZIP ---------- */
export async function exportByCustomerZip(ctx) {
  const rows = await fetchRows(ctx); if (!rows) return;
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
    X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(toAoA(list)), safeSheet(cust));
    const buf = X.write(wb, { bookType: 'xlsx', type: 'array' });
    zip.file(`${String(cust).replace(/[\\/:*?"<>|]/g, ' ').slice(0, 60)}.xlsx`, buf);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const label = ctx.charge === 'SERVICE' ? 'ServiceCharge' : 'AdvanceCharge';
  download(blob, `${label}_ByCustomer_${stamp()}.zip`);
  toast(`ส่งออก ${byCust.size} ไฟล์ (1 ไฟล์ต่อลูกค้า)`, 'ok');
}

/* ---------- SOA 21 คอลัมน์ · บังคับเลือกลูกค้าก่อน ---------- */
const SOA_HEAD = ['Supplier Name', 'JOB NO.', 'JOB COMPLETED DATE', 'Invoice Number', 'Invoice Date',
  'Amount', 'Local Currency', 'Container Number', 'BOL / AWB Number', 'Payment Terms',
  'Invoice Age', 'PO Number', 'Ageing', 'Kewill / PO Received Date', 'Kewill / PO Requested Date',
  'Period', 'Vendor Comment', 'Contact Person', 'Category', 'AP Comment', 'Remark'];

export async function exportSoa(ctx) {
  if (!ctx.filters.customer) {
    toast('กรุณาเลือก Customer ก่อน Export SOA', 'err');
    return;
  }
  const rows = (await fetchRows(ctx) || []).filter(r => r.invoice_status === 'ISSUED' || r.source_invoice_no);
  if (!rows.length) { toast('ไม่มีรายการสำหรับ SOA ตามตัวกรองนี้', 'err'); return; }
  const custNames = [...new Set(rows.map(r => r.customer_name).filter(Boolean))];
  if (custNames.length > 1) { toast('SOA ต้องเป็นลูกค้าเดียวเท่านั้น — ตรวจตัวกรองอีกครั้ง', 'err'); return; }
  const X = await xlsx();
  const today = new Date();
  const age = (d) => d ? Math.round((today - new Date(d + 'T00:00:00')) / 86400000) : '';
  const supplier = 'N.J. LOGISTICS & FRUITS CO., LTD.';
  const body = rows.map(r => ([
    supplier,
    r.job_no || '',
    r.operational_status === 'CLOSE' ? dmy(r.date) : '',
    r.invoice_no || r.source_invoice_no || '',
    dmy(r.date),
    r.net_payable === null || r.net_payable === undefined ? '' : Number(r.net_payable),
    'THB',
    '',                                   // Container Number — ไม่ดึงต่อแถวเพื่อไม่ให้ query หนัก
    r.house_bl_no || r.master_bl_no || '',
    r.credit_term_days != null ? r.credit_term_days + ' days' : '',
    age(r.date),
    '', // PO Number — ระบบใหม่ยังไม่มีข้อมูลนี้
    age(r.due_date),
    '', '',                               // Kewill dates — ไม่มีข้อมูลใน New DB
    r.date ? String(r.date).slice(0, 7) : '',
    '',                                   // Vendor Comment
    r.contact || '',
    r.charge_type || '',
    '',                                   // AP Comment
    r.note || '',
  ]));
  const aoa = [
    [`STATEMENT OF ACCOUNT — ${chargeLabel(ctx.charge)} / ${groupLabel(ctx.group)}`],
    [`ลูกค้า: ${custNames[0] || '-'}`, '', `พิมพ์เมื่อ ${dmy(stamp())}`],
    [],
    SOA_HEAD,
    ...body,
    [],
    ['', '', '', '', 'รวม', body.reduce((s, r) => s + (Number(r[5]) || 0), 0)],
  ];
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(aoa), 'SOA');
  X.writeFile(wb, `SOA_${safeSheet(custNames[0])}_${stamp()}.xlsx`);
  toast(`ส่งออก SOA ${body.length} รายการ`, 'ok');
}

/* ---------- MAERSK: Export Excel CASE (CASE / NO CASE → ZIP) ---------- */
const CASE_HEAD = ['Item', 'Customer name', 'Case no', 'CM Send Date', 'Supplier Inv No.',
  'Execution Date', 'Booking no./Job no.', 'Kewill no', 'Remark'];

export async function exportMaerskCase(ctx) {
  if (ctx.group !== 'MAERSK') { toast('ฟังก์ชันนี้ใช้ได้เฉพาะ MAERSK', 'err'); return; }
  if (!ctx.filters.customer) { toast('กรุณาเลือก Customer ก่อน Export CASE', 'err'); return; }
  const all = await fetchRows(ctx); if (!all) return;
  /* เอาเฉพาะแถวที่ Customer Job No. ว่างหรือ N/A ตาม Billing เดิม */
  const target = all.filter(r => {
    const v = String(r.customer_job_no || '').trim().toUpperCase();
    return v === '' || v === 'N/A' || v === 'NA' || v === '-';
  });
  if (!target.length) { toast('ไม่มีแถวที่ Customer Job No. ว่าง/N/A ตามตัวกรองนี้', 'err'); return; }
  const withCase = target.filter(r => String(r.case_no || '').trim() !== '');
  const noCase = target.filter(r => String(r.case_no || '').trim() === '');
  const X = await xlsx(); const JSZip = await jszip();
  const mk = (rows) => [CASE_HEAD, ...rows.map((r, i) => ([
    i + 1, r.customer_name || '', r.case_no || '', '', r.source_invoice_no || '',
    dmy(r.date), r.job_no || '', '', r.note || '',
  ]))];
  const zip = new JSZip();
  for (const [name, list] of [['CASE', withCase], ['NO CASE', noCase]]) {
    if (!list.length) continue;
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(mk(list)), safeSheet(name));
    zip.file(`${name}.xlsx`, X.write(wb, { bookType: 'xlsx', type: 'array' }));
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  download(blob, `MAERSK_CASE_${stamp()}.zip`);
  toast(`CASE ${withCase.length} · NO CASE ${noCase.length}`, 'ok');
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
