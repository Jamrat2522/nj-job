/* หน้ารวม รับชำระ / ใบเสร็จ */
import { listReceipts, voidReceipt } from './receipt-api.js';
import { masters, customerOpts } from '../master/master-cache.js';
import { esc, money, dmy } from '../core/formatter.js';
import { can, isAdmin } from '../core/permissions.js';
import { renderPagination } from '../components/pagination.js';
import { reasonModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { handleErr } from '../core/error-handler.js';
import { newRequestId, once, nextToken, isCurrent } from '../core/request-manager.js';
import { renderReceiptDoc } from './receipt-form.js';

const st = { customer: '', from: '', to: '', page: 1, size: 20 };

export async function render(cnt) {
  await masters();
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>รับชำระ / ใบเสร็จ</h2></div>
      ${can('receive_payment') ? '<button class="btn btn-p" id="rc-new">+ รับชำระเงิน</button>' : ''}</div>
    <div class="fbar">
      <select class="sel" data-f="customer">${customerOpts(st.customer)}</select>
      <input class="inp" type="date" data-f="from" value="${st.from}">
      <input class="inp" type="date" data-f="to" value="${st.to}">
      <button class="btn btn-o btn-sm" id="rc-go">ค้นหา</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>เลขใบเสร็จ</th><th>วันที่</th><th>ลูกค้า</th><th>ช่องทาง</th>
      <th class="r">ยอดรับ</th><th>INVOICE ที่ตัด</th><th>สถานะ</th><th class="center">จัดการ</th>
    </tr></thead><tbody id="rc-tbody"><tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div><div class="card mt-2" id="rc-pgn"></div>`;

  const nb = cnt.querySelector('#rc-new');
  if (nb) nb.onclick = () => location.hash = '#/receipts/new';

  async function load() {
    const t = nextToken('receipts');
    try {
      const res = await listReceipts({
        p_customer: st.customer || null, p_from: st.from || null, p_to: st.to || null,
        p_page: st.page, p_size: st.size });
      if (!isCurrent('receipts', t)) return;
      const tb = cnt.querySelector('#rc-tbody');
      const rows = res.rows || [];
      tb.innerHTML = rows.length ? rows.map(r => `<tr>
        <td class="t-b">${esc(r.receipt_no)}</td><td>${dmy(r.receipt_date)}</td>
        <td class="ellip" style="max-width:200px">${esc(r.customer_name)}</td>
        <td>${esc(r.method || '-')}</td>
        <td class="r t-b">${money(r.total_received)}</td>
        <td class="t-xs">${(r.invoices || []).map(i => esc(i.invoice_no)).join(', ')}</td>
        <td>${r.status === 'VOID' ? '<span class="bdg bdg-void">VOID</span>' : '<span class="bdg bdg-paid">ISSUED</span>'}</td>
        <td><div class="ch-act">
          <button class="btn btn-o btn-sm" data-print='${JSON.stringify(r).replace(/'/g, "&#39;")}'>พิมพ์</button>
          ${r.status !== 'VOID' && (isAdmin() || can('void')) ?
            `<button class="btn btn-danger btn-sm" data-void="${r.id}" data-no="${esc(r.receipt_no)}">Void</button>` : ''}
        </div></td></tr>`).join('')
        : '<tr><td colspan="8" class="empty">ยังไม่มีใบเสร็จ</td></tr>';
      renderPagination(cnt.querySelector('#rc-pgn'), { page: st.page, size: st.size, total: res.total || 0 },
        ({ page, size }) => { st.page = page; st.size = size; load(); });
    } catch (e) { if (isCurrent('receipts', t)) handleErr(e); }
  }
  cnt.querySelector('#rc-go').onclick = () => {
    cnt.querySelectorAll('[data-f]').forEach(el => st[el.dataset.f] = el.value);
    st.page = 1; load();
  };
  cnt.querySelector('#rc-tbody').addEventListener('click', async (e) => {
    const pb = e.target.closest('[data-print]');
    if (pb) { renderReceiptDoc(JSON.parse(pb.dataset.print)); return; }
    const vb = e.target.closest('[data-void]');
    if (vb) {
      const reason = await reasonModal('Void ใบเสร็จ ' + vb.dataset.no + ' (จะ Void การรับชำระด้วย)');
      if (!reason) return;
      try {
        await once('void-rc-' + vb.dataset.void, () => voidReceipt(vb.dataset.void, reason, newRequestId()));
        toast('Void ใบเสร็จแล้ว — สถานะชำระของ INVOICE ถูกคำนวณใหม่', 'ok'); load();
      } catch (ex) { handleErr(ex); }
    }
  });
  load();
}
