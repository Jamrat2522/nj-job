/* ══ REPORT — ดึงข้อมูล + สร้าง Excel ═══════════════════════════════════════
   *** ใช้ RPC เดิมทั้งหมด ไม่มี RPC/SQL/Schema ใหม่ ***
     src:'job' -> njacc_export_charges   (ตัวเดียวกับปุ่ม Export ของหน้ารายการ)
     src:'inv' -> njacc_report           (ตัวเดียวกับหน้ารายงานเดิม)

   ── ทำไมต้องวนหลายครั้งเมื่อเลือก “ทุกประเภท / ทุกบริษัท” ──
   njacc_build_charge_set() บังคับ charge_type ∈ (SERVICE,ADVANCE)
   และ company_group ∈ (NJ,DSV,MAERSK,KUEHNE,RHENUS) — ส่งค่าว่างไม่ได้
   จึงวนตามคู่ที่ผู้ใช้ *** มีสิทธิ์ export จริง *** (can('export',charge,group))
   -> ไม่แตะ Policy/สิทธิ์ใด ๆ · คู่ที่ไม่มีสิทธิ์จะถูกข้าม ไม่ยิง RPC ให้ error

   ── V.205 ── แยก "ดึงข้อมูล" ออกจาก "สร้าง Excel"
     loadReport(def, f, onProg) -> { rows, kpi, cols }  ใช้แสดงตารางบนหน้าจอ
     runReport(def, f, onProg)  -> เรียก loadReport แล้วเขียนไฟล์ Excel
   *** ตรรกะดึงข้อมูล/post-filter/คอลัมน์ เป็นชุดเดียวกันทั้งตารางและ Excel ***
   -> ตัวเลขบนจอกับในไฟล์ไม่มีทางไม่ตรงกัน
   ความคืบหน้ารายงานผ่าน callback ที่หน้า REPORT เอาไปแสดงเป็นข้อความบรรทัดเดียว */

import { fetchReport } from './report-api.js';
import { exportCharges } from '../charges/charge-api.js';
import { xlsx, COMPAT_COLS, toAoA } from '../charges/charge-export.js';
import { COMPANY_GROUPS, CHARGE_TYPES } from '../config/charge-groups.js';
import { can } from '../core/permissions.js';
import { dmy, money } from '../core/formatter.js';

/* ── เพดานความปลอดภัย ──
   njacc_report จำกัด size สูงสุด 100/หน้า (least(...,100) ในฟังก์ชันเดิม)
   -> 300 หน้า = 30,000 แถว ถือเป็นเพดานของรายงาน invoice-based
   njacc_export_charges คืน 1,000/หน้า และมี hard limit 100,000 ของ server อยู่แล้ว */
const INV_PAGE = 100;
const INV_MAX_ROWS = 30000;
const JOB_PAGE = 1000;
const JOB_MAX_PAGES = 120;

const stamp = () => new Date().toISOString().slice(0, 10);
const safeSheet = (s) => (String(s || '').replace(/[\\/?*[\]:]/g, ' ').slice(0, 28) || 'DATA');

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 6000);
}

/* ══ 1. รายงานฝั่งงาน (1.1 / 2.1) ═══════════════════════════════════════════ */
async function fetchJobRows(def, f, onProg) {
  const charges = f.charge_type ? [f.charge_type] : CHARGE_TYPES.map(c => c.key);
  const groups = f.company_group ? [f.company_group] : COMPANY_GROUPS.map(g => g.key);
  const all = [];
  let allowed = 0;

  for (const charge of charges) {
    for (const group of groups) {
      if (!can('export', charge, group)) continue;   /* สิทธิ์เดิม ไม่ตั้งเงื่อนไขใหม่ */
      allowed += 1;
      let page = 1;
      for (;;) {
        const res = await exportCharges({
          charge, group, queue: def.queue,
          filters: {
            customer: f.customer_id || null,
            payment_status: f.payment_status || null,
            from: f.from || null, to: f.to || null,
          },
          exportPage: page, exportSize: JOB_PAGE,
        });
        if (res && res.truncated) {
          throw new Error(`ข้อมูลเกิน ${(res.hard_limit || 100000).toLocaleString('th-TH')} รายการ — กรุณาแคบช่วงวันที่`);
        }
        const rows = (res && res.rows) || [];
        all.push(...rows);
        onProg(all.length);
        if (!res || !res.has_more) break;
        page += 1;
        if (page > JOB_MAX_PAGES) throw new Error('ข้อมูลมากเกินไป — กรุณาแคบตัวกรองหรือช่วงวันที่');
      }
    }
  }
  if (!allowed) throw new Error('คุณไม่มีสิทธิ์ส่งออกข้อมูลของประเภท/บริษัทที่เลือก');

  /* สถานะ INVOICE: njacc_build_charge_set ไม่มีพารามิเตอร์นี้ (p.status = operational_status)
     จึงกรองจากคอลัมน์ invoice_status ที่ server ส่งมาแล้ว — ไม่ได้คำนวณสถานะใหม่ */
  return f.status ? all.filter(r => r.invoice_status === f.status) : all;
}

/* ══ 2. รายงานฝั่ง INVOICE (2.2 / 2.3 / 3.1 / 3.2 / 3.3 / 3.4) ═════════════ */
async function fetchInvoiceRows(f, onProg) {
  const all = [];
  let page = 1, total = 0, kpi = null;
  for (;;) {
    const res = await fetchReport({
      charge_type: f.charge_type || null, company_group: f.company_group || null,
      customer_id: f.customer_id || null, status: f.status || null,
      payment_status: f.payment_status || null,
      from: f.from || null, to: f.to || null,
      page, size: INV_PAGE,
    });
    total = (res && res.total) || 0;
    if (page === 1) {
      kpi = (res && res.kpi) || {};
      if (total > INV_MAX_ROWS) {
        throw new Error(`ข้อมูล ${total.toLocaleString('th-TH')} รายการ เกินเพดาน `
          + `${INV_MAX_ROWS.toLocaleString('th-TH')} — กรุณาแคบช่วงวันที่`);
      }
    }
    const rows = (res && res.rows) || [];
    all.push(...rows);
    onProg(all.length, total);
    if (!rows.length || all.length >= total) break;
    page += 1;
  }
  if (all.length !== total) throw new Error(`ข้อมูลไม่ครบ (${all.length}/${total}) — ยกเลิกการส่งออก`);
  return { rows: all, kpi: kpi || {} };
}

/* post-filter — ใช้เฉพาะคอลัมน์ที่ njacc_report คำนวณมาแล้ว ไม่คำนวณยอดใหม่ */
const IS_FINAL = (s) => s === 'ISSUED' || s === 'POSTED';   /* = njacc_inv_is_final */
function postFilter(def, rows, f) {
  switch (def.post) {
    case 'billed':                                   /* 2.3 ยอดออกบิลรวม */
      return rows.filter(r => IS_FINAL(r.status));
    case 'outstanding':                              /* 3.2 คงค้าง */
      return rows.filter(r => IS_FINAL(r.status) && Number(r.outstanding) > 0.005);
    case 'overdue':                                  /* 3.3 เกินกำหนด */
      return rows.filter(r => r.overdue === true);
    case 'paid-partial':                             /* 3.4 ชำระครบ / บางส่วน */
      return f.payment_status ? rows
        : rows.filter(r => r.payment_status === 'PAID' || r.payment_status === 'PARTIAL');
    default:
      return rows;
  }
}

/* ══ 3. คอลัมน์ Excel ของรายงาน INVOICE ═══════════════════════════════════ */
const INV_COLS = [
  ['invoice_date', 'วันที่ INVOICE', 'date'],
  ['invoice_no', 'เลขที่ INVOICE'],
  ['charge_type', 'ประเภท'],
  ['company_group', 'บริษัท'],
  ['job_no', 'เลขงาน'],
  ['customer_job_no', 'Customer Job No.'],
  ['customer_name', 'ลูกค้า'],
  ['status', 'สถานะ INVOICE'],
  ['payment_status', 'สถานะชำระ'],
  ['subtotal', 'ก่อน VAT', 'num'],
  ['vat_amount', 'VAT', 'num'],
  ['wht_amount', 'WHT', 'num'],
  ['total_amount', 'ยอดรวม', 'num'],
  ['received', 'รับแล้ว', 'num'],
  ['outstanding', 'คงค้าง', 'num'],
  ['due_date', 'Due Date', 'date'],
  ['overdue', 'เกินกำหนด', 'bool'],
];
const INV_MONEY = ['subtotal', 'vat_amount', 'wht_amount', 'total_amount', 'received', 'outstanding'];

function invCell(r, def) {
  const [key, , kind] = def;
  const v = r[key];
  if (kind === 'bool') return v === true ? 'เกินกำหนด' : '';
  if (v === null || v === undefined || v === '') return '';
  if (kind === 'date') return dmy(v);
  if (kind === 'num') return Number(v);
  return v;
}
const invAoA = (rows) => [INV_COLS.map(c => c[1]), ...rows.map(r => INV_COLS.map(c => invCell(r, c)))];

/* แถว TOTAL — บวกเฉพาะคอลัมน์ที่เป็นตัวเลขจริง (ไม่ SUM ข้อความ) */
function totalRow(rows, cols, moneyKeys, labelKey) {
  const out = cols.map(() => '');
  const i = cols.findIndex(c => c[0] === labelKey);
  out[i >= 0 ? i : 0] = 'TOTAL';
  cols.forEach((c, idx) => {
    if (moneyKeys.includes(c[0])) out[idx] = rows.reduce((s, x) => s + (Number(x[c[0]]) || 0), 0);
  });
  return out;
}

function styleSheet(X, aoa, cols, moneyKeys) {
  const ws = X.utils.aoa_to_sheet(aoa);
  ws['!cols'] = cols.map(c => ({ wch: Math.max(10, Math.min(30, String(c[1]).length + 6)) }));
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  const range = X.utils.decode_range(ws['!ref']);
  for (let R = 1; R <= range.e.r; R++) {
    for (let C = 0; C <= range.e.c; C++) {
      const cel = ws[X.utils.encode_cell({ r: R, c: C })];
      if (!cel) continue;
      if (typeof cel.v === 'number' && moneyKeys.includes(cols[C] && cols[C][0])) {
        cel.t = 'n'; cel.z = '#,##0.00';
      }
    }
  }
  return ws;
}

/* แผ่นสรุปของ 2.3 — ใช้ KPI ที่ njacc_report คืนมา ไม่ได้คำนวณเอง */
function summaryAoA(kpi, rows) {
  return [
    ['รายการ', 'ค่า'],
    ['จำนวน INVOICE (มีผลทางบัญชี)', Number(kpi.total_invoice || 0)],
    ['ยอดออกบิลรวม', Number(kpi.invoice_amount || 0)],
    ['รับชำระแล้ว', Number(kpi.received || 0)],
    ['คงค้างรวม', Number(kpi.outstanding || 0)],
    ['เกินกำหนด (ใบ)', Number(kpi.overdue || 0)],
    ['ชำระครบ (ใบ)', Number(kpi.paid || 0)],
    ['ชำระบางส่วน (ใบ)', Number(kpi.partial || 0)],
    [],
    ['จำนวนแถวในไฟล์นี้', rows.length],
  ];
}

/* ══ 4. ดึงข้อมูลตาม Report + ตัวกรอง (ใช้ร่วมกันทั้งตารางและ Excel) ═══════ */
export const JOB_MONEY = ['service_amount', 'advance_amount', 'vat_amount',
                          'subtotal', 'wht_amount', 'net_payable'];

export async function loadReport(def, f, onProg) {
  const prog = onProg || (() => {});
  if (def.src === 'job') {
    const rows = await fetchJobRows(def, f, prog);
    return { rows, kpi: null, cols: COMPAT_COLS, money: JOB_MONEY, src: 'job' };
  }
  const { rows: raw, kpi } = await fetchInvoiceRows(f, prog);
  return { rows: postFilter(def, raw, f), kpi, cols: INV_COLS, money: INV_MONEY, src: 'inv' };
}

/* ══ 5. Entry point ของปุ่ม Export Excel ═══════════════════════════════════ */
export async function runReport(def, f, onProg) {
  const prog = onProg || (() => {});

  if (def.src === 'job') {
    const rows = await fetchJobRows(def, f, prog);
    if (!rows.length) return { rows: 0 };
    const X = await xlsx();
    const aoa = toAoA(rows, COMPAT_COLS);
    aoa.push([], totalRow(rows, COMPAT_COLS,
      ['service_amount', 'advance_amount', 'vat_amount', 'subtotal', 'wht_amount', 'net_payable'],
      'customer_job_no'));
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, styleSheet(X, aoa, COMPAT_COLS,
      ['service_amount', 'advance_amount', 'vat_amount', 'subtotal', 'wht_amount', 'net_payable']),
      safeSheet(def.no.replace('.', '_')));
    X.writeFile(wb, `REPORT_${def.no}_${def.key}_${stamp()}.xlsx`);
    return { rows: rows.length };
  }

  const { rows: raw, kpi } = await fetchInvoiceRows(f, prog);
  const rows = postFilter(def, raw, f);
  if (!rows.length) return { rows: 0 };
  const X = await xlsx();
  const aoa = invAoA(rows);
  aoa.push([], totalRow(rows, INV_COLS, INV_MONEY, 'customer_name'));
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, styleSheet(X, aoa, INV_COLS, INV_MONEY), safeSheet(def.no.replace('.', '_')));
  if (def.summary) {
    const sws = X.utils.aoa_to_sheet(summaryAoA(kpi, rows));
    sws['!cols'] = [{ wch: 34 }, { wch: 20 }];
    X.utils.book_append_sheet(wb, sws, 'SUMMARY');
  }
  X.writeFile(wb, `REPORT_${def.no}_${def.key}_${stamp()}.xlsx`);
  return { rows: rows.length };
}

/* ── ค่าที่จะแสดงในเซลล์ (ใช้ทั้งตารางบนหน้าจอและไฟล์ Excel) ──
   job: ใช้ toAoA/COMPAT_COLS ของ charge-export.js ตัวเดิม (ไม่เขียน renderer ใหม่)
   inv: ใช้ invCell() ตัวเดียวกับที่สร้าง Excel */
export { invCell };
export const fmtMoney = money;
