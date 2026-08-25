/* หน้ารวม รับชำระ / ใบเสร็จ */
import { listReceipts, voidReceipt } from './receipt-api.js';
import { enableRowOpen, initColumns } from '../components/table.js';
import { receiptPending } from '../charges/charge-api.js';
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
/* 2 แท็บแยกกันชัดเจนตาม Workflow (ข้อกำหนดข้อ 8)
     pending = งาน SERVICE ที่ POST แล้วและยังรับชำระไม่ครบ  → njacc_receipt_pending
     issued  = ใบเสร็จที่ออกแล้ว                              → njacc_list_receipts
   *** ห้ามใช้ njacc_list_receipts แทนคิวรอรับชำระ — คนละความหมาย *** */
let tab = 'pending';
const pst = { customer: '', q: '', page: 1, size: 20 };

export async function render(cnt) {
  await masters();
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>รับชำระ / ใบเสร็จ</h2></div>
      ${can('receive_payment') ? '<button class="btn btn-p" id="rc-new">+ รับชำระเงิน</button>' : ''}</div>
    <div class="rep-tabs">
      <button class="rep-tab ${tab === 'pending' ? 'active' : ''}" data-rtab="pending">รอรับชำระ</button>
      <button class="rep-tab ${tab === 'issued' ? 'active' : ''}" data-rtab="issued">ใบเสร็จที่ออกแล้ว</button>
    </div>
    <div id="rc-pending" ${tab === 'pending' ? '' : 'hidden'}>
      <!-- Main List Container เดียว — Filter + Table + Empty State + Total + Pagination -->
      <div class="ch-panel">
      <div class="fbar">
        <input class="inp" data-pf="q" value="${esc(pst.q)}" placeholder="ค้นหา INVOICE / ลูกค้า / เลขที่งาน">
        <button class="btn btn-o btn-sm" id="rp-go">ค้นหา</button></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>INVOICE</th><th>วันที่</th><th>ลูกค้า</th><th>เลขที่งาน</th><th>Customer Job No.</th>
        <th>Due Date</th><th class="r">ยอดสุทธิ</th><th class="r">คงค้าง</th>
      </tr></thead><tbody id="rp-tbody"><tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr></tbody>
      </table></div><div class="card mt-2" id="rp-pgn"></div>
      </div>
    </div>
    <div id="rc-issued" ${tab === 'issued' ? '' : 'hidden'}>
    <div class="ch-panel">
    <div class="fbar">
      <select class="sel" data-f="customer">${customerOpts(st.customer)}</select>
      <input class="inp" type="date" data-f="from" value="${st.from}">
      <input class="inp" type="date" data-f="to" value="${st.to}">
      <button class="btn btn-o btn-sm" id="rc-go">ค้นหา</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>เลขใบเสร็จ</th><th>วันที่</th><th>ลูกค้า</th><th>ช่องทาง</th>
      <th class="r">ยอดรับ</th><th>INVOICE ที่ตัด</th><th>สถานะ</th><th class="center">จัดการ</th>
    </tr></thead><tbody id="rc-tbody"><tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div><div class="card mt-2" id="rc-pgn"></div>
    </div>
    </div>`;

  cnt.querySelector('.rep-tabs').addEventListener('click', (e) => {
    const b2 = e.target.closest('[data-rtab]'); if (!b2 || b2.dataset.rtab === tab) return;
    tab = b2.dataset.rtab;
    render(cnt);
  });
  const pq = cnt.querySelector('[data-pf="q"]');
  if (pq) cnt.querySelector('#rp-go').onclick = () => { pst.q = pq.value.trim(); pst.page = 1; loadPending(cnt); };
  if (tab === 'pending') loadPending(cnt);

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
      tb.innerHTML = rows.length ? rows.map(r => `<tr data-rc='${JSON.stringify(r).replace(/'/g, "&#39;")}'>
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
      if (cnt.__njCols) cnt.__njCols.issued();      /* แถวใหม่ -> จัดคอลัมน์ตามที่ตั้งไว้ */
    } catch (e) { if (isCurrent('receipts', t)) handleErr(e); }
  }
  cnt.querySelector('#rc-go').onclick = () => {
    cnt.querySelectorAll('[data-f]').forEach(el => st[el.dataset.f] = el.value);
    st.page = 1; load();
  };
  /* Column Manager — แยก Mode key คนละแท็บ (คนละ Column Definition จริง)
       FINANCE_RECEIPT_PENDING = แท็บ "รอรับชำระ"
       FINANCE_RECEIPT_ISSUED  = แท็บ "ใบเสร็จที่ออกแล้ว" */
  function mountColsPending() {
    const tb = cnt.querySelector('#rp-tbody');
    initColumns({ table: tb && tb.closest('table'), modeKey: 'FINANCE_RECEIPT_PENDING',
      host: cnt.querySelector('#rc-pending .fbar') });
  }
  function mountColsIssued() {
    const tb = cnt.querySelector('#rc-tbody');
    initColumns({ table: tb && tb.closest('table'), modeKey: 'FINANCE_RECEIPT_ISSUED',
      host: cnt.querySelector('#rc-issued .fbar') });
  }
  cnt.__njCols = { pending: mountColsPending, issued: mountColsIssued };
  mountColsPending(); mountColsIssued();

  /* คลิกแถว = เปิดใบเสร็จฉบับนั้น (renderer เดียวกับปุ่ม "พิมพ์")
     *** ไม่ได้ลบปุ่มพิมพ์ / Void *** เพราะเป็น Action ที่ Row Click แทนไม่ได้ตามข้อกำหนด
     ตารางนี้เดิม "ไม่มี" ปุ่ม ดู/เปิด อยู่แล้ว จึงไม่มีปุ่มซ้ำให้ลบ */
  enableRowOpen(cnt.querySelector('#rc-tbody'), (tr) => {
    if (!tr.dataset.rc) return;
    renderReceiptDoc(JSON.parse(tr.dataset.rc));
  });
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

/* คิวรอรับชำระ — ดึงจาก njacc_receipt_pending ที่ server เท่านั้น
   ไม่กรอง/ไม่นับฝั่ง browser · ไม่ mock · งานหลุดจากคิวเมื่อ Backend บอกว่าชำระครบ */
async function loadPending(cnt) {
  const tb = cnt.querySelector('#rp-tbody'); if (!tb) return;
  const t = nextToken('rc-pending');
  try {
    const res = await receiptPending({ company_group: 'NJ', q: pst.q || null,
      customer_id: pst.customer || null, page: pst.page, size: pst.size });
    if (!isCurrent('rc-pending', t)) return;
    const rows = (res && res.rows) || [];
    tb.innerHTML = rows.map(r => `<tr data-inv="${esc(r.invoice_id)}">
      <td class="t-b">${esc(r.invoice_no || '-')}</td>
      <td class="nowrap">${dmy(r.invoice_date)}</td>
      <td class="ellip" style="max-width:180px" title="${esc(r.customer_name || '')}">${esc(r.customer_name || '-')}</td>
      <td>${esc(r.job_no || '-')}</td>
      <td>${esc(r.customer_job_no || '-')}</td>
      <td class="nowrap">${dmy(r.due_date)}</td>
      <td class="r">${money(Number(r.total_amount) - Number(r.wht_amount))}</td>
      <td class="r t-b">${money(r.outstanding)}</td>
    </tr>`).join('') ||
      '<tr><td colspan="8" class="empty">ไม่มีงานรอรับชำระ</td></tr>';
    /* ปุ่ม "ดู INVOICE" ถูกแทนด้วยคลิกแถว -> คอลัมน์ "จัดการ" ไม่มี Action เหลือ จึงตัดออก
       ปลายทางและ sessionStorage 'nj-inv-from' เหมือนเดิมทุกบรรทัด */
    enableRowOpen(tb, (tr) => {
      const inv = tr.dataset.inv; if (!inv) return;
      try { sessionStorage.setItem('nj-inv-from', location.hash); } catch (_) {}
      location.hash = '#/invoice/' + inv;
    });
    renderPagination(cnt.querySelector('#rp-pgn'), {
      page: res.page, size: res.size, total: res.total,
      onGo: (p) => { pst.page = p; loadPending(cnt); },
    });
    if (cnt.__njCols) cnt.__njCols.pending();       /* แถวใหม่ -> จัดคอลัมน์ตามที่ตั้งไว้ */
  } catch (e) { if (isCurrent('rc-pending', t)) handleErr(e); }
}
