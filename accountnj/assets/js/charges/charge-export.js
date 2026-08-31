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
/* ── ExcelJS: ใช้เฉพาะ Export SOA / Export Excel CASE ที่ต้องคุม style ระดับเซลล์ ──
   SheetJS (Community) เขียน fill/font/border/width/date-cell ไม่ได้ จึงต้องใช้ ExcelJS
   *** pin version ตายตัว *** ห้ามใช้ latest · โหลดตอนกดปุ่มเท่านั้น (ไม่โหลดตอน startup)
   โหลดไม่สำเร็จ = โยน error ออกไปให้ผู้เรียกหยุด export · ห้าม fallback เป็นไฟล์ผิดรูปแบบ */
const EXCELJS_VERSION = '4.4.0';
const EXCELJS_CDN = `https://cdn.jsdelivr.net/npm/exceljs@${EXCELJS_VERSION}/dist/exceljs.min.js`;
export async function xlsx() { await loadScript(XLSX_CDN); return window.XLSX; }
async function jszip() { await loadScript(JSZIP_CDN); return window.JSZip; }
export async function exceljs() {
  try { await loadScript(EXCELJS_CDN); } catch (e) {
    throw new Error(`โหลด ExcelJS ${EXCELJS_VERSION} จาก CDN ไม่สำเร็จ — ยกเลิกการส่งออก (ตรวจอินเทอร์เน็ต/ไฟร์วอลล์)`);
  }
  if (!window.ExcelJS || !window.ExcelJS.Workbook) {
    throw new Error(`ExcelJS ${EXCELJS_VERSION} โหลดมาไม่สมบูรณ์ — ยกเลิกการส่งออก`);
  }
  return window.ExcelJS;
}

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
    const res = await exportCharges({ charge: ctx.charge, group: ctx.group, queue: ctx.queue,
      scope: ctx.scope, filters: ctx.filters, exportPage: page, exportSize: PAGE });
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
/* ---------- Export Fast CSV — ชุดคอลัมน์ตาม BILLING เดิม (exportFastCSV) ----------
   SERVICE 16 คอลัมน์ · ADVANCE 13 คอลัมน์ (ADVANCE ไม่มี Case / ETA / ETD)
   Scope = filtered rows ชุดเดียวกับ Export Excel · BOM \uFEFF ให้ Excel อ่านไทยถูก
   quote เฉพาะเซลล์ที่มี " , CR LF (ตรง _csvCell เดิม) ไม่ quote ทุกช่อง
   Mapping ชื่อฟิลด์ใหม่: invoice_no -> source_invoice_no · customer_job -> customer_job_no
     service_charge/advance/vat/amount/wht/total_amount -> service_amount/advance_amount/
     vat_amount/subtotal/wht_amount/net_payable · status -> operational_status · cs -> cs_name */
export const CSV_HEAD_SC = ['Date', 'Invoice No.', 'Customer name', 'Customer Job No.',
  'Service charge', 'VAT 7%', 'Amount', 'WHT 3%', 'Total Amount', 'I BILLING APL',
  'Case', 'Status', 'Name CS', 'NOTE', 'ETA', 'ETD'];
export const CSV_HEAD_AC = ['Date', 'Invoice No.', 'Customer name', 'Customer Job No.',
  'Advance', 'VAT 7%', 'Amount', 'WHT 3%', 'Total Amount', 'I BILLING APL',
  'Status', 'Name CS', 'NOTE'];

export function csvCell(v) {
  if (v === null || v === undefined) return '';
  let s = String(v);
  if (/["\,\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}
export function csvRow(r, isSC) {
  const base = [
    r.date, r.source_invoice_no, r.customer_name, r.customer_job_no,
    isSC ? r.service_amount : r.advance_amount,
    r.vat_amount, r.subtotal, r.wht_amount, r.net_payable, r.i_billing_apl,
  ];
  if (isSC) base.push(r.case_no || '');
  base.push(r.operational_status, r.cs_name, r.note);
  if (isSC) base.push(r.eta, r.etd);
  return base;
}
export function buildFastCsv(rows, isSC) {
  const head = isSC ? CSV_HEAD_SC : CSV_HEAD_AC;
  const lines = [head.map(csvCell).join(',')];
  for (const r of rows) lines.push(csvRow(r, isSC).map(csvCell).join(','));
  return lines.join('\r\n');
}

export async function exportCsv(ctx) {
  const pg = progress('Export Fast CSV');
  let rows; try { rows = await fetchRows(ctx, pg.set); } finally { pg.close(); }
  if (!rows) return;
  const isSC = ctx.charge !== 'ADVANCE';
  const csv = '\uFEFF' + buildFastCsv(rows, isSC);
  download(new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    `${isSC ? 'ServiceCharge' : 'AdvanceCharge'}_FAST_${stamp()}.csv`);
  toast(`ส่งออก CSV ${rows.length.toLocaleString('th-TH')} รายการ (filtered)`, 'ok');
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

/* ══════════════════════════════════════════════════════════════════════════
   SOA EXPORT — สร้างด้วย ExcelJS ให้ตรงไฟล์ต้นฉบับ SOA_CHB_.xlsx
   โครงไฟล์ (ตาม buildSOAWorkbook_SC ของ BILLING เดิม):
     Sheet 'SOA_WK9' · 21 คอลัมน์ (A–U) · freeze ySplit 5
     Row 1   หัว legacy (สีน้ำเงิน/เหลือง/เขียว/เขียวอ่อน/ส้ม) สูง 40.5 · font 10
     Row 2-3 แถวตัวอย่าง ABC (ค่านิ่ง) · font 9
     Row 4   ว่าง สูง 12.6
     Row 5   หัวสะอาด · font 9 · สูง 24
     Row 6+  ข้อมูล · Tahoma 9 · border thin · G ชิดขวา
   Mapping ฟิลด์ระบบใหม่ (ชื่อเปลี่ยน ความหมายเดิม):
     legacy invoice_no    -> source_invoice_no   (Invoice No. ของไฟล์เดิม)
     legacy total_amount  -> net_payable         (Total Amout ของไฟล์เดิม)
     legacy customer_job  -> customer_job_no
     legacy contactFor()  -> company_contact     (LIST NAME ที่ผูกกับ Company Invoice)
   ══════════════════════════════════════════════════════════════════════════ */
const SOA_SHEET = 'SOA_WK9';
const SOA_WIDTHS = [9.0001, 10.109375, 15.33203125, 15, 13.77734375, 10.33203125, 10.21875, 11,
  26.109375, 11.109375, 13.33203125, 11.6640625, 32.109375, 14.77734375, 15.77734375, 8.43, 8.43,
  29.77734375, 27.21875, 9.109375, 24.6640625];
const SOA_HDR1 = ['Supplier Name', 'JOB NO.', 'JOB COMPLETED DATE', 'Invoice Number',
  'Invoi+E2393+E:M+E:O+E2+E:P', ' ', 'Amount', 'Local Currency', 'Container number',
  'BOL / AWB Number', 'Payment Terms', 'Invoice Age', 'PO number', 'Ageing',
  'Kewill / PO Received Date', 'Kewill / PO requested Date', 'Period (days)',
  'Vendor Comment', 'Contact person', 'Category', 'AP Com+O527+E:U'];
const SOA_HEAD = ['Supplier Name', 'JOB NO.', 'JOB COMPLETED DATE', 'Invoice Number', 'Invoice Date',
  'Due Date', 'Amount', 'Local Currency', 'Container number', 'BOL / AWB Number', 'Payment Terms',
  'Invoice Age', 'PO number', 'Ageing', 'Kewill / PO Received Date', 'Kewill / PO requested Date',
  'Period (days)', 'Vendor Comment', 'Contact person', 'Category', 'AP Comment'];

/* Ageing bucket — ข้อความตรงต้นฉบับ (มีคำว่า days) */
export function soaAgeing(days) {
  const a = Math.abs(days);
  if (a < 3) return '0 - 2 days';
  if (a < 8) return '3 - 7 days';
  if (a < 16) return '8 - 15 days';
  if (a < 31) return '16 - 30 days';
  if (a < 61) return '31-60 days';
  if (a < 91) return '61-90 days';
  return '>91 days';
}
/* 'YYYY-MM-DD...' -> Date UTC midnight (ไม่มีเวลา) · ไม่ใช่วันที่ -> null */
export function soaDate(v) {
  if (v === null || v === undefined || v === '') return null;
  const m = String(v).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  let y = +m[1]; if (y >= 2500) y -= 543;
  return new Date(Date.UTC(y, (+m[2]) - 1, +m[3]));
}
const soaPlus30 = (iso) => {
  const d = soaDate(iso);
  if (!d) return null;
  d.setUTCDate(d.getUTCDate() + 30);
  return d;
};
/* PO number: ว่าง หรือ 'N/A' -> 'Waiting Kewill / PO' (ตรงต้นฉบับ ไม่รวม 'NA'/'-') */
export function soaPO(v) {
  const s = String(v || '').trim();
  return (s === '' || s.toUpperCase() === 'N/A') ? 'Waiting Kewill / PO' : v;
}

export async function buildSoaWorkbook(ExcelJS, rows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Billing System';
  wb.created = new Date();
  const ws = wb.addWorksheet(SOA_SHEET);
  SOA_WIDTHS.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  ws.views = [{ state: 'frozen', ySplit: 5 }];

  const FONT = 'Calibri';
  const HFILL = {}, HFONT = {}, HBOLD = {};
  const setH = (cols, fill, font, bold) => cols.forEach(c => { HFILL[c] = fill; HFONT[c] = font; HBOLD[c] = bold; });
  setH([1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 'FF002060', 'FFFFFFFF', true);
  setH([2, 3], 'FFFFFF00', 'FF000000', true);
  setH([15, 16, 17], 'FF92D050', 'FF000000', false);
  setH([18, 19], 'FFC5E0B4', 'FF000000', false);
  setH([20, 21], 'FFFFC000', 'FF000000', false);
  const styleHeaderRow = (rowIdx, txt, size, height) => {
    const row = ws.getRow(rowIdx);
    row.height = height;
    for (let c = 1; c <= 21; c++) {
      const cell = row.getCell(c);
      cell.value = txt[c - 1];
      cell.font = { name: FONT, size, bold: HBOLD[c], color: { argb: HFONT[c] } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HFILL[c] } };
      cell.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
    }
  };
  styleHeaderRow(1, SOA_HDR1, 10, 40.5);
  ws.getRow(1).getCell(1).border = { top: { style: 'medium' }, left: { style: 'medium' } };

  const ACCT_FMT = '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)';
  const D = (y, m, d) => new Date(y, m - 1, d);
  const ABC = [
    ['ABC', 'ML180524', D(2018, 7, 5), '02/0185', D(2018, 7, 13), D(2018, 8, 12), 105600, 'THB', null, null,
      '30 Days', 2867, 9104493972, '>91 days', D(2018, 7, 14), D(2018, 7, 7), null, null, null, 'Invoice Paid 07.08.18', null],
    ['ABC', 'ML180712', D(2018, 7, 10), '05/1234', D(2018, 7, 15), D(2018, 8, 14), 1502, 'THB', null, null,
      '30 Days', 2865, 9104491234, '>91 days', null, D(2018, 7, 11), null, 'Waiting Kewill / PO', 'K.XXX', 'Missing Invoice ', null],
  ];
  ABC.forEach((arr, idx) => {
    const row = ws.getRow(2 + idx);
    row.height = idx === 0 ? 15 : 15.75;
    for (let c = 1; c <= 21; c++) {
      const cell = row.getCell(c);
      const v = arr[c - 1];
      if (v !== null && v !== undefined) cell.value = v;
      cell.font = { name: FONT, size: 9, bold: false };
      cell.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
      if ([3, 5, 6, 15, 16].includes(c)) cell.numFmt = 'mm/dd/yy';
      if (c === 7) cell.numFmt = ACCT_FMT;
    }
  });
  ws.getRow(4).height = 12.6;
  styleHeaderRow(5, SOA_HEAD, 9, 24);

  const AMT_FMT = '#,##0.00_);(#,##0.00)';
  const THIN = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
  rows.forEach((r, i) => {
    const dC = soaDate(r.date) || '-';
    const dE = soaDate(r.date) || '-';
    const dF = soaPlus30(r.date) || '-';
    const dEd = soaDate(r.date);
    const ageL = dEd ? Math.round((todayMid - dEd) / 86400000) : '';
    const ageN = (ageL === '') ? '' : soaAgeing(ageL);
    const amtG = (r.net_payable === null || r.net_payable === undefined || r.net_payable === '')
      ? null : Number(r.net_payable);
    const vals = [
      'N.J.',                                 /* A Supplier Name */
      '',                                     /* B JOB NO. */
      dC,                                     /* C JOB COMPLETED DATE */
      r.source_invoice_no || '',              /* D Invoice Number */
      dE,                                     /* E Invoice Date */
      dF,                                     /* F Due Date = date + 30 */
      amtG,                                   /* G Amount */
      'THB',                                  /* H Local Currency */
      '',                                     /* I Container number */
      '',                                     /* J BOL / AWB Number */
      '30 Days',                              /* K Payment Terms */
      ageL,                                   /* L Invoice Age */
      soaPO(r.customer_job_no),               /* M PO number */
      ageN,                                   /* N Ageing */
      soaDate(r.etd) || '-',                  /* O Kewill / PO Received Date <- ETD */
      soaDate(r.eta) || '-',                  /* P Kewill / PO requested Date <- ETA */
      '',                                     /* Q Period (days) */
      r.case_no || '',                        /* R Vendor Comment = CASE */
      r.company_contact || '',                /* S Contact person <- LIST NAME */
      '',                                     /* T Category */
      '',                                     /* U AP Comment */
    ];
    const row = ws.getRow(6 + i);
    row.height = 15;
    for (let c = 1; c <= 21; c++) {
      const cell = row.getCell(c);
      const v = vals[c - 1];
      if (v !== null && v !== undefined && v !== '') cell.value = v;
      cell.font = { name: 'Tahoma', size: 9, bold: false, color: { argb: 'FF000000' } };
      cell.alignment = { horizontal: (c === 7 ? 'right' : 'center'), vertical: 'center', wrapText: true };
      cell.border = THIN;
      if ([3, 5, 6, 15, 16].includes(c)) cell.numFmt = 'mm/dd/yy';
      if (c === 7) cell.numFmt = AMT_FMT;
    }
  });
  return wb;
}

/* ชื่อไฟล์ปลอดภัย — คงอักษรไทย/ตัวเลข/ขีดล่าง ตรงกับ safeCust ของต้นฉบับ */
export const safeCust = (s) => (String(s || '').replace(/[^\w\u0E00-\u0E7F]+/g, '_')
  .replace(/^_+|_+$/g, '').slice(0, 40) || 'CUSTOMER');

/* ── V.298 ── หาชื่อลูกค้าจริงจาก Rows ที่กำลังส่งออก (ใช้ตั้งชื่อไฟล์)
   ctx.filters.customer เป็น customer_id (uuid) จึงใช้ตั้งชื่อไฟล์ไม่ได้
   คืน { name } เมื่อมีลูกค้าเดียวและมีชื่อ · คืน { error } ในกรณีอื่น
   *** ห้าม fallback ไปใช้ customer_id เงียบ ๆ *** (แนวเดียวกับ exportSoa) */
export function resolveExportCustomerName(rows) {
  const names = [...new Set((rows || []).map(r => r && r.customer_name).filter(Boolean))];
  if (names.length > 1) return { error: 'MULTIPLE_CUSTOMERS', names };
  if (!names.length) return { error: 'NO_CUSTOMER_NAME', names };
  return { name: names[0] };
}

export async function exportSoa(ctx) {
  if (!ctx.filters.customer) { toast('กรุณาเลือก Customer ก่อน Export SOA', 'err'); return; }
  const pg = progress('Export SOA');
  let all; try { all = await fetchRows(ctx, pg.set); } finally { pg.close(); }
  if (!all) return;
  const rows = all.filter(r => r.source_invoice_no || r.invoice_no);
  if (!rows.length) { toast('ไม่มีรายการสำหรับ SOA ตามตัวกรองนี้', 'err'); return; }
  const custNames = [...new Set(rows.map(r => r.customer_name).filter(Boolean))];
  if (custNames.length > 1) { toast('SOA ต้องเป็นลูกค้าเดียวเท่านั้น — ตรวจตัวกรองอีกครั้ง', 'err'); return; }

  let ExcelJS;
  try { ExcelJS = await exceljs(); } catch (e) { toast(e.message, 'err'); return; }
  const wb = await buildSoaWorkbook(ExcelJS, rows);
  /* กันตกหล่น: แถวข้อมูลจริงในชีท (rowCount − 5 หัว) ต้องเท่าจำนวนที่กรองได้ */
  const ws = wb.getWorksheet(SOA_SHEET);
  const dataRows = Math.max((ws.rowCount || 0) - 5, 0);
  if (dataRows !== rows.length) {
    toast(`❌ Export SOA Failed : Row Count Validation (${dataRows} ≠ ${rows.length}) — ไม่ดาวน์โหลดไฟล์`, 'err');
    return;
  }
  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `SOA_CHB_${safeCust(custNames[0])}_${stamp()}.xlsx`);
  toast(`ส่งออก SOA ${rows.length} รายการ`, 'ok');
}

/* ══════════════════════════════════════════════════════════════════════════
   MAERSK: Export Excel CASE (CASE / NO CASE -> ZIP) — ExcelJS ตามต้นฉบับ
   Mapping (ชื่อฟิลด์ระบบใหม่):
     Customer name -> company_invoice · Case no -> case_no · CM Send Date -> etd
     Supplier Inv No. -> source_invoice_no · Execution Date -> etd
     Booking no./Job no. -> house_bl_no · Kewill no -> customer_job_no · Remark -> ว่าง
   กรอง: เอาเฉพาะแถวที่ Customer Job No. ว่าง หรือ N/A (normalize ตัด space . / -)
   แยกไฟล์: normalize(case_no) === 'NO CASE' -> NO CASE.xlsx · ที่เหลือ -> CASE.xlsx
   ══════════════════════════════════════════════════════════════════════════ */
const CASE_HEAD = ['Item', 'Customer name', 'Case no', 'CM Send Date', 'Supplier Inv No.',
  'Execution Date', 'Booking no./Job no.', 'Kewill no', 'Remark'];

/* 'N/A' 'N / A' 'N.A.' 'NA' '' -> true (ตรง _jobEmptyOrNA ของต้นฉบับ) */
export function caseJobEmptyOrNA(v) {
  if (v === null || v === undefined) return true;
  const s = String(v).trim();
  if (s === '') return true;
  return s.toUpperCase().replace(/[\s./\-]/g, '') === 'NA';
}
export const caseNormCase = (v) => String(v == null ? '' : v).trim().replace(/\s+/g, ' ').toUpperCase();
/* ETD -> dd/MM/yyyy (ค.ศ.) · ปี ≥ 2500 ลบ 543 · ว่าง=ว่าง · ไม่ใช่วันที่=คืนค่าดิบ */
export function caseFmtDate(v) {
  if (v === null || v === undefined || v === '') return '';
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  let y = parseInt(m[1], 10); if (y >= 2500) y -= 543;
  return `${m[3]}/${m[2]}/${y}`;
}

export async function buildCaseWorkbook(ExcelJS, rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('CASE');
  ws.addRow(CASE_HEAD);
  const V = (v) => (v === null || v === undefined) ? '' : v;
  rows.forEach((r, i) => {
    ws.addRow([
      i + 1,
      V(r.company_invoice),
      V(r.case_no),
      caseFmtDate(r.etd),
      V(r.source_invoice_no),
      caseFmtDate(r.etd),
      V(r.house_bl_no),
      V(r.customer_job_no),
      '',
    ]);
  });
  const hdr = ws.getRow(1);
  hdr.font = { bold: true };
  hdr.eachCell(c => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: CASE_HEAD.length } };
  ws.columns.forEach((col, idx) => {
    let max = CASE_HEAD[idx].length;
    col.eachCell({ includeEmpty: false }, c => {
      const l = String(c.value == null ? '' : c.value).length; if (l > max) max = l;
    });
    col.width = Math.min(Math.max(max + 2, 8), 45);
  });
  const bd = { style: 'thin', color: { argb: 'FF000000' } };
  for (let rr = 1; rr <= ws.rowCount; rr++) {
    for (let cc = 1; cc <= CASE_HEAD.length; cc++) {
      ws.getCell(rr, cc).border = { top: bd, left: bd, bottom: bd, right: bd };
    }
  }
  return wb;
}

export async function exportMaerskCase(ctx) {
  if (!ctx.filters.customer) { toast('กรุณาเลือก Customer ก่อน Export CASE', 'err'); return; }
  const pg = progress('Export Excel CASE');
  let all; try { all = await fetchRows(ctx, pg.set); } finally { pg.close(); }
  if (!all) return;
  const fetched = all.length;
  const target = all.filter(r => caseJobEmptyOrNA(r.customer_job_no));
  if (!target.length) { toast('ไม่มีแถวที่ Customer Job No. ว่าง/N/A ตามตัวกรองนี้', 'err'); return; }

  /* ── V.298 ── ชื่อไฟล์ต้องเป็น customer_name จริง ไม่ใช่ ctx.filters.customer
     ctx.filters.customer = customer_id (uuid จาก dropdown ตัวกรอง)
     -> เดิมได้ ExportCase_<uuid>_SC_<date>.zip ผิดจาก Reference
     ใช้แนวเดียวกับ exportSoa(): ดึงชื่อจาก Rows ที่กำลัง Export จริง
     หลายลูกค้า / ไม่มีชื่อ -> หยุดและแจ้ง Error ห้าม fallback เป็น id เงียบ ๆ */
  const cust = resolveExportCustomerName(target);
  if (cust.error === 'MULTIPLE_CUSTOMERS') {
    toast('Export CASE ต้องเป็นลูกค้าเดียวเท่านั้น — ตรวจตัวกรองอีกครั้ง', 'err'); return;
  }
  if (cust.error) {
    toast('❌ Export CASE Failed : ไม่พบชื่อลูกค้า (customer_name) ในข้อมูลที่จะส่งออก', 'err'); return;
  }

  const noCase = [], withCase = [];
  target.forEach(r => { (caseNormCase(r.case_no) === 'NO CASE' ? noCase : withCase).push(r); });
  if (noCase.length + withCase.length !== target.length) {
    toast('❌ Export Failed : Case Split Validation Error', 'err'); return;
  }

  let ExcelJS;
  try { ExcelJS = await exceljs(); } catch (e) { toast(e.message, 'err'); return; }
  const JSZip = await jszip();
  const noWb = await buildCaseWorkbook(ExcelJS, noCase);
  const caseWb = await buildCaseWorkbook(ExcelJS, withCase);
  /* กันตกหล่นปลายทาง: นับแถวจริงในชีท (rowCount − 1 header) ต้องเท่ากับหลังกรอง */
  const wsRows = (wb) => { try { return Math.max((wb.getWorksheet('CASE').rowCount || 0) - 1, 0); } catch (e) { return -1; } };
  const xlNo = wsRows(noWb), xlCase = wsRows(caseWb);
  if (xlNo < 0 || xlCase < 0 || (xlNo + xlCase) !== target.length) {
    console.error('[ExportCase] row count mismatch', { fetched, filtered: target.length, xlNo, xlCase });
    toast(`❌ Export Failed : Row Count Validation Error (${xlNo + xlCase} ≠ ${target.length}) — ไม่ดาวน์โหลดไฟล์`, 'err');
    return;
  }
  const [noBuf, caseBuf] = await Promise.all([noWb.xlsx.writeBuffer(), caseWb.xlsx.writeBuffer()]);
  const zip = new JSZip();
  zip.file('NO CASE.xlsx', noBuf);          /* สร้างทั้ง 2 ไฟล์เสมอ แม้ว่าง */
  zip.file('CASE.xlsx', caseBuf);
  const blob = await zip.generateAsync({ type: 'blob' });
  const tag = ctx.charge === 'ADVANCE' ? 'AC' : 'SC';
  download(blob, `ExportCase_${safeCust(cust.name)}_${tag}_${stamp()}.zip`);
  toast(`Export Excel CASE · NO CASE ${noCase.length.toLocaleString('th-TH')} · CASE ${withCase.length.toLocaleString('th-TH')} รายการ`, 'ok');
}

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
