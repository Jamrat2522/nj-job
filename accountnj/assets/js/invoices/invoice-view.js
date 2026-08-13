/* ดู INVOICE + พิมพ์ + Void */
import { invoiceView, voidInvoice } from './invoice-api.js';
import { esc, money, dmy, payBadge } from '../core/formatter.js';
import { can } from '../core/permissions.js';
import { reasonModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { handleErr } from '../core/error-handler.js';
import { newRequestId, once } from '../core/request-manager.js';
import { groupLabel, chargeLabel } from '../config/charge-groups.js';

export async function render(cnt, { id }) {
  const inv = await invoiceView(id);
  const isVoid = inv.status === 'VOID';
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>INVOICE ${esc(inv.invoice_no)}</h2>
      ${isVoid ? '<span class="bdg bdg-void">VOID</span>' : payBadge(inv.payment_status)}</div>
      <div class="row">
        <button class="btn btn-o" id="ivv-print">🖨 พิมพ์</button>
        ${!isVoid && can('void', inv.charge_type, inv.company_group) && Number(inv.paid) === 0
          ? '<button class="btn btn-danger" id="ivv-void">Void</button>' : ''}
        <button class="btn btn-o" id="ivv-back">← กลับ</button></div></div>
    <div class="card iv-doc print-area">
      <div class="iv-doc-h">
        <div><h2>ใบแจ้งหนี้ / INVOICE</h2>
          <div class="t-sm t-2">N.J. Logistics &amp; Fruits Co., Ltd.</div>
          <div class="t-xs t-3">${chargeLabel(inv.charge_type)} · ${groupLabel(inv.company_group)}</div></div>
        <div class="right">
          <div class="t-b">${esc(inv.invoice_no)}</div>
          <div class="t-sm">วันที่: ${dmy(inv.invoice_date)}</div>
          <div class="t-sm">ครบกำหนด: ${dmy(inv.due_date)}</div>
          ${isVoid ? '<div class="t-b" style="color:var(--red-600)">*** VOID ***</div>' : ''}</div></div>
      <div class="fgrid mb-2">
        <div class="fld"><label>ลูกค้า</label><div class="t-b">${esc(inv.customer?.name || '-')}</div>
          <div class="t-xs t-2">${esc(inv.customer?.address || '')}</div>
          <div class="t-xs t-2">เลขผู้เสียภาษี: ${esc(inv.customer?.tax_id || '-')}
            ${inv.customer?.branch_code ? ' สาขา ' + esc(inv.customer.branch_code) : ''}</div></div>
        <div class="fld"><label>อ้างอิงงาน</label>
          <div>เลขงาน: ${esc(inv.job?.job_no || '-')}</div>
          <div class="t-sm t-2">Job No ลูกค้า: ${esc(inv.job?.customer_job_no || '-')}</div>
          <div class="t-sm t-2">House B/L: ${esc(inv.job?.house_bl_no || '-')}</div></div></div>
      <table class="tbl"><thead><tr>
        <th>Item</th><th>Code</th><th>Description</th><th>ประเภท</th><th class="r">Amount</th>
        <th class="r">VAT</th><th class="r">รวม</th></tr></thead><tbody>
        ${(inv.items || []).map(it => `<tr>
          <td>${it.line_no}</td><td>${esc(it.code || '-')}</td><td>${esc(it.description)}</td>
          <td class="t-xs">${esc(it.charge_kind || 'SERVICE')}</td>
          <td class="r">${money(it.amount)}</td><td class="r">${money(it.vat_amount)}</td>
          <td class="r">${money(it.line_total)}</td></tr>`).join('')}
      </tbody></table>
      <div class="iv-sum">
        ${Number(inv.service_amount) > 0 ? `<div class="r-line"><span>Service charge</span><span>${money(inv.service_amount)}</span></div>` : ''}
        ${Number(inv.advance_amount) > 0 ? `<div class="r-line"><span>Advance charge</span><span>${money(inv.advance_amount)}</span></div>` : ''}
        <div class="r-line"><span>ยอดก่อน VAT</span><span>${money(inv.subtotal)}</span></div>
        <div class="r-line"><span>VAT ${Number(inv.vat_rate)}%</span><span>${money(inv.vat_amount)}</span></div>
        ${Number(inv.wht_amount) > 0 ? `<div class="r-line"><span>หัก ณ ที่จ่าย</span><span>${money(inv.wht_amount)}</span></div>` : ''}
        <div class="r-line total"><span>ยอดรวมทั้งสิ้น</span><span>${money(inv.total_amount)}</span></div>
        ${Number(inv.paid) > 0 ? `<div class="r-line"><span>รับชำระแล้ว</span><span class="money-pos">${money(inv.paid)}</span></div>
          <div class="r-line"><span>คงค้าง</span><span class="money-neg">${money(inv.total_amount - inv.paid)}</span></div>` : ''}
      </div>
      ${isVoid ? `<div class="mt-2 t-sm" style="color:var(--red-600)">Void โดย: ${dmy(inv.voided_at)} · เหตุผล: ${esc(inv.void_reason || '-')}</div>` : ''}
    </div>`;
  cnt.querySelector('#ivv-back').onclick = () =>
    location.hash = '#/charges/' + inv.charge_type + '/' + inv.company_group;
  cnt.querySelector('#ivv-print').onclick = () => window.print();
  const vb = cnt.querySelector('#ivv-void');
  if (vb) vb.onclick = async () => {
    const reason = await reasonModal('Void INVOICE ' + inv.invoice_no + ' (ต้องระบุเหตุผล)');
    if (!reason) return;
    try {
      await once('void-inv-' + id, () => voidInvoice(id, reason, newRequestId()));
      toast('Void INVOICE แล้ว — งานกลับไปสถานะยังไม่ออก INVOICE', 'ok');
      render(cnt, { id });
    } catch (e) { handleErr(e); }
  };
}
