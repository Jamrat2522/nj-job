import { money } from '../core/formatter.js';
/* KPI (aggregate ที่ DB — ไม่ SUM ฝั่ง JS)
   Total Over Due = ลูกหนี้เกินกำหนด (มี INVOICE + ยังไม่ชำระครบ + เลย effective due)
   Total Amount   = Net Payable (Gross − WHT) — ความหมายเดียวกับ Billing เดิม */
export function kpiHTML(k, charge) {
  const n = (v) => (v ?? 0).toLocaleString('th-TH');
  const job = ['Total Job', n(k?.total_job), 'var(--blue-600)', ''];
  const over = ['Total Over Due', n(k?.total_overdue), 'var(--red-600)',
    'ลูกหนี้ที่มี INVOICE และยังค้างชำระ · งานที่ยังไม่ออก INV เลย Due = ' + n(k?.job_overdue_no_invoice)];
  const svc = ['Service Charge', money(k?.service_charge), 'var(--acc-service)', ''];
  const adv = ['Advance Charge', money(k?.advance_charge), 'var(--acc-advance)', ''];
  const vat = ['VAT', money(k?.vat), 'var(--purple-600)', ''];
  const tot = ['Total Amount', money(k?.total_amount), 'var(--green-600)',
    'Net Payable = Gross ' + money(k?.gross_total) + ' − WHT ' + money(k?.wht_total)];
  const items = charge === 'SERVICE' ? [job, over, svc, adv, vat, tot] : [job, adv, vat, tot, over];
  return '<div class="kpi-row">' + items.map(([lb, v, c, tip]) =>
    `<div class="kpi" style="--kpi-c:${c}" title="${tip}"><div class="lb">${lb}</div><div class="v">${v}</div></div>`).join('') + '</div>';
}
export const KPI_COUNT = (charge) => charge === 'SERVICE' ? 6 : 5;
