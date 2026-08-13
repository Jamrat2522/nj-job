import { esc, money, dmy, payBadge } from '../core/formatter.js';
/* แถวจาก njacc_report: invoice-based — invoice_no, invoice_date, due_date, status,
   payment_status, subtotal, vat_amount, wht_amount, total_amount, customer_name,
   job_no, customer_job_no, received, outstanding, overdue */
export function reportRowHTML(r) {
  return `<tr>
    <td class="nowrap">${dmy(r.invoice_date)}</td>
    <td class="t-xs">${esc(r.charge_type)} · ${esc(r.company_group)}</td>
    <td class="t-b">${esc(r.invoice_no)}</td>
    <td class="t-xs">${esc(r.job_no || '-')}</td>
    <td class="ellip" style="max-width:190px">${esc(r.customer_name || '-')}</td>
    <td>${r.status === 'VOID' ? '<span class="bdg bdg-void">VOID</span>' : payBadge(r.payment_status)}</td>
    <td class="r">${money(r.subtotal)}</td>
    <td class="r">${money(r.vat_amount)}</td>
    <td class="r">${money(r.wht_amount)}</td>
    <td class="r t-b">${money(r.total_amount)}</td>
    <td class="r money-pos">${money(r.received)}</td>
    <td class="r money-neg">${money(r.outstanding)}</td>
    <td class="nowrap">${dmy(r.due_date)}${r.overdue ? ' <span class="bdg bdg-due-over">เกิน</span>' : ''}</td></tr>`;
}
/* KPI จาก njacc_report: total_invoice, invoice_amount, received, outstanding,
   overdue, partial, paid, receipt_count */
export function reportKpiHTML(k) {
  const items = [
    ['INVOICE ทั้งหมด', (k?.total_invoice ?? 0).toLocaleString('th-TH'), 'var(--blue-600)'],
    ['ยอดออกบิลรวม', money(k?.invoice_amount), 'var(--cyan-700)'],
    ['รับชำระแล้ว', money(k?.received), 'var(--green-600)'],
    ['คงค้างรวม', money(k?.outstanding), 'var(--red-600)'],
    ['เกินกำหนด', (k?.overdue ?? 0).toLocaleString('th-TH'), 'var(--amber-600)'],
    ['ชำระครบ / บางส่วน', (k?.paid ?? 0) + ' / ' + (k?.partial ?? 0), 'var(--purple-600)'],
  ];
  return '<div class="kpi-row">' + items.map(([lb, v, c]) =>
    `<div class="kpi" style="--kpi-c:${c}"><div class="lb">${lb}</div><div class="v">${v}</div></div>`).join('') + '</div>';
}
