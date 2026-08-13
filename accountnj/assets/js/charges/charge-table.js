/* ตารางรายการ — ลำดับคอลัมน์ LOCK (SERVICE 22 / ADVANCE 21) ห้ามเพิ่ม/ลบ
   SERVICE: Status, Remaining, Date, Invoice No., Customer name, Customer Job No.,
            Company Invoice, House B/L No., Service charge, Advance, VAT 7%, Amount,
            WHT 3%, Total Amount, I BILLING APL, Case, Contact, ETD, ETA, Due Date, NOTE, จัดการ
   ADVANCE: Status, Remaining, Date, Invoice No., Customer name, Customer Job No.,
            Company Invoice, House B/L No., Case, Contact, ETD, ETA, Advance, VAT 7%,
            Amount, WHT 3%, Total Amount, I BILLING APL, Due Date, NOTE, จัดการ

   ความหมายตัวเลข (ดู README ประกอบ):
     Amount       = subtotal (ยอดก่อน VAT) จาก INVOICE ที่ ISSUED หรือจาก snapshot ที่ import มา
     Total Amount = net_payable = Gross(subtotal+VAT) − WHT  ← ความหมายเดียวกับ Billing เดิม
     ไม่มีทั้ง INVOICE และ snapshot → แสดง '-' (ไม่ใช่ 0.00)
   Invoice No.  = เลข INVOICE ของระบบบัญชี · เลขจากไฟล์เดิมแสดงเป็นบรรทัด SRC: แยกชัด
   Due Date     = effective due (ใช้ due ของ INVOICE เมื่อ ISSUED, ไม่งั้นใช้ของงาน) */
import { esc, money, dmy, remainingBadge, statusBadge, payBadge } from '../core/formatter.js';

const SORT_DATE = '<th class="sortable" data-sort="date">Date ⇅</th>';
const SORT_INV = '<th class="sortable" data-sort="invoice_no">Invoice No. ⇅</th>';
const HEAD_COMMON = '<th>Status</th><th>Remaining</th>' + SORT_DATE + SORT_INV +
  '<th>Customer name</th><th>Customer Job No.</th><th>Company Invoice</th><th>House B/L No.</th>';
const MONEY_SVC = '<th class="r">Service charge</th><th class="r">Advance</th><th class="r">VAT 7%</th>' +
  '<th class="r">Amount</th><th class="r">WHT 3%</th>' +
  '<th class="r" title="Net Payable = Gross − WHT">Total Amount</th>';
const MONEY_ADV = '<th class="r">Advance</th><th class="r">VAT 7%</th>' +
  '<th class="r">Amount</th><th class="r">WHT 3%</th>' +
  '<th class="r" title="Net Payable = Gross − WHT">Total Amount</th>';
const CASE_CONTACT = '<th>Case</th><th>Contact</th><th>ETD</th><th>ETA</th>';
const TAIL = '<th>Due Date</th><th>NOTE</th><th class="center col-act">จัดการ</th>';

export function headHTML(charge) {
  return charge === 'SERVICE'
    ? HEAD_COMMON + MONEY_SVC + '<th>I BILLING APL</th>' + CASE_CONTACT + TAIL
    : HEAD_COMMON + CASE_CONTACT + MONEY_ADV + '<th>I BILLING APL</th>' + TAIL;
}
export const COL_COUNT = (charge) => charge === 'SERVICE' ? 22 : 21;

/* Status = Operational (บน) + Accounting (บรรทัดเล็กล่าง) — ไม่รวมเป็น state เดียว */
function statusCell(r) {
  let acc;
  if (!r.invoice_id) acc = '<span class="st-sub st-sub-none">ยังไม่ออก INV</span>';
  else if (r.invoice_status === 'VOID') acc = '<span class="st-sub st-sub-void">VOID</span>';
  else acc = `<span class="st-sub st-sub-${esc((r.payment_status || 'UNPAID').toLowerCase())}">${esc(r.payment_status || 'UNPAID')}</span>`;
  return `<td class="col-status">${statusBadge(r.operational_status)}<div>${acc}</div></td>`;
}

/* Invoice No. — accounting invoice เป็นค่าหลัก · source แสดงเป็น SRC: บรรทัดเล็ก */
function invoiceCell(r) {
  const main = r.invoice_no
    ? `<span class="t-b">${esc(r.invoice_no)}</span>`
    : '<span class="t-3">ยังไม่ออก INV</span>';
  const src = r.source_invoice_no
    ? `<div class="inv-src" title="เลข Invoice จากระบบเดิม/ต้นทาง">SRC: ${esc(r.source_invoice_no)}</div>` : '';
  return `<td class="nowrap col-inv">${main}${src}</td>`;
}

export function rowHTML(r, charge, perms) {
  const cells = {
    common: statusCell(r) +
      `<td>${remainingBadge(r.due_date, r)}</td>
       <td class="nowrap">${dmy(r.date)}</td>` + invoiceCell(r) +
      `<td class="ellip" style="max-width:180px" title="${esc(r.customer_name || '')}">${esc(r.customer_name || '-')}</td>
       <td>${esc(r.customer_job_no || '-')}</td>
       <td class="ellip" style="max-width:130px" title="${esc(r.company_invoice || '')}">${esc(r.company_invoice || '-')}</td>
       <td>${esc(r.house_bl_no || '-')}</td>`,
    moneySvc: `<td class="r">${money(r.service_amount)}</td>
      <td class="r">${money(r.advance_amount)}</td>
      <td class="r">${money(r.vat_amount)}</td>
      <td class="r">${money(r.subtotal)}</td>
      <td class="r">${money(r.wht_amount)}</td>
      <td class="r t-b" title="Gross ${money(r.gross_total)} − WHT ${money(r.wht_amount)}">${money(r.net_payable)}</td>`,
    moneyAdv: `<td class="r">${money(r.advance_amount)}</td>
      <td class="r">${money(r.vat_amount)}</td>
      <td class="r">${money(r.subtotal)}</td>
      <td class="r">${money(r.wht_amount)}</td>
      <td class="r t-b" title="Gross ${money(r.gross_total)} − WHT ${money(r.wht_amount)}">${money(r.net_payable)}</td>`,
    apl: `<td>${esc(r.i_billing_apl || '-')}</td>`,
    caseContact: `<td>${esc(r.case_no || '-')}</td>
      <td class="ellip" style="max-width:140px" title="${esc(r.contact || '')}">${esc(r.contact || '-')}</td>
      <td class="nowrap">${dmy(r.etd)}</td>
      <td class="nowrap">${dmy(r.eta)}</td>`,
    tail: `<td class="nowrap" title="${r.invoice_status === 'ISSUED' ? 'Due จาก INVOICE' : 'Due จากงาน'}">${dmy(r.due_date)}</td>
      <td class="ch-note"><span class="note-txt ellip" data-act="note" data-id="${r.id}"
        title="${esc(r.note || 'คลิกเพื่อแก้ NOTE')}">${esc(r.note || '＋ NOTE')}</span></td>
      <td class="col-act"><div class="ch-act">${actionsHTML(r, perms)}</div></td>`,
  };
  const body = charge === 'SERVICE'
    ? cells.common + cells.moneySvc + cells.apl + cells.caseContact + cells.tail
    : cells.common + cells.caseContact + cells.moneyAdv + cells.apl + cells.tail;
  return `<tr data-row="${r.id}" data-status="${esc(r.operational_status)}">${body}</tr>`;
}

/* Row actions ตามสถานะ Operational (แยกจากสถานะบัญชีโดยสิ้นเชิง) */
function actionsHTML(r, perms) {
  const a = [`<button class="btn btn-o btn-sm" data-act="view" data-id="${r.id}">ดู</button>`];
  const st = r.operational_status;

  if (st === 'OPEN' || st === 'PROCESSING') {
    if (perms.edit) {
      a.push(`<button class="btn btn-o btn-sm" data-act="edit" data-id="${r.id}">แก้</button>`);
      a.push(`<button class="btn btn-green btn-sm" data-act="close" data-id="${r.id}">จบงาน</button>`);
    }
    if (perms.void) a.push(`<button class="btn btn-danger btn-sm" data-act="cancel" data-id="${r.id}">ยกเลิก</button>`);
  } else if (st === 'CLOSE') {
    if (perms.edit) a.push(`<button class="btn btn-o btn-sm" data-act="reopen" data-id="${r.id}">คืนงาน</button>`);
    if (perms.void) a.push(`<button class="btn btn-danger btn-sm" data-act="cancel" data-id="${r.id}">ยกเลิก</button>`);
  } else if (st === 'CANCELED') {
    if (perms.edit) a.push(`<button class="btn btn-o btn-sm" data-act="undo" data-id="${r.id}">ถอย</button>`);
  }

  if (r.invoice_id) {
    a.push(`<button class="btn btn-o btn-sm" data-act="viewinv" data-inv="${r.invoice_id}">ดู INVOICE</button>`);
  } else if (perms.invoice && st !== 'CANCELED') {
    a.push(`<button class="btn btn-p btn-sm" data-act="invoice" data-id="${r.id}">ออก INVOICE</button>`);
  }
  if (perms.delete && !r.invoice_id)
    a.push(`<button class="btn btn-danger btn-sm" data-act="delete" data-id="${r.id}">ลบ</button>`);
  return a.join('');
}

export const paymentCell = (r) => r.invoice_id
  ? payBadge(r.payment_status) : '<span class="bdg bdg-due-ok">ยังไม่ออก INVOICE</span>';
