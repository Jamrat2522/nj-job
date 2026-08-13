/* เอกสารใบเสร็จสำหรับพิมพ์ */
import { openModal } from '../components/modal.js';
import { esc, money, dmy } from '../core/formatter.js';
export function renderReceiptDoc(r) {
  const b = document.createElement('div');
  b.className = 'print-area';
  b.innerHTML = `<div class="iv-doc" style="padding:10px">
    <div class="iv-doc-h"><div><h2>ใบเสร็จรับเงิน / RECEIPT</h2>
      <div class="t-sm t-2">N.J. Logistics &amp; Fruits Co., Ltd.</div></div>
      <div class="right"><div class="t-b">${esc(r.receipt_no)}</div>
        <div class="t-sm">วันที่: ${dmy(r.receipt_date)}</div>
        ${r.status === 'VOID' ? '<div class="t-b" style="color:var(--red-600)">*** VOID ***</div>' : ''}</div></div>
    <p>ได้รับเงินจาก <b>${esc(r.customer_name)}</b> ช่องทาง ${esc(r.method || '-')}</p>
    <table class="tbl mt-1"><thead><tr><th>INVOICE</th><th class="r">จำนวนเงิน</th></tr></thead>
      <tbody>${(r.invoices || []).map(i =>
        `<tr><td>${esc(i.invoice_no)}</td><td class="r">${money(i.amount)}</td></tr>`).join('')}</tbody></table>
    <div class="iv-sum"><div class="r-line total"><span>รวมรับเงินทั้งสิ้น</span>
      <span>${money(r.total_received)}</span></div></div></div>`;
  const f = document.createElement('div');
  f.innerHTML = `<button class="btn btn-o" data-close>ปิด</button>
    <button class="btn btn-p" id="rcd-print">🖨 พิมพ์</button>`;
  openModal({ title: 'ใบเสร็จ ' + r.receipt_no, body: b, footer: f, large: true });
  f.querySelector('#rcd-print').onclick = () => window.print();
}
