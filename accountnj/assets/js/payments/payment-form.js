/* รับชำระเงิน: เลือกลูกค้า → เห็น INVOICE คงค้าง → ตัดชำระ → ใบเสร็จ (1 transaction ฝั่ง DB) */
import { openInvoices, receivePayment } from './payment-api.js';
import { autoAllocate, sumAlloc } from './payment-allocation.js';
import { masters, customerOpts } from '../master/master-cache.js';
import { esc, money, dmy, ymd, round2 } from '../core/formatter.js';
import { toast } from '../components/toast.js';
import { confirmModal } from '../components/modal.js';
import { btnBusy } from '../components/loading.js';
import { handleErr } from '../core/error-handler.js';
import { newRequestId, once } from '../core/request-manager.js';

export async function render(cnt) {
  await masters();
  const requestId = newRequestId();
  let invoices = [];

  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>รับชำระเงิน</h2></div>
      <button class="btn btn-o" id="pm-back">← กลับ</button></div>
    <div class="card card-pad mb-2"><div class="fgrid">
      <div class="fld"><label>ลูกค้า <span class="req">*</span></label>
        <select class="sel" id="pm-cust">${customerOpts('')}</select></div>
      <div class="fld"><label>วันที่รับชำระ</label>
        <input class="inp" type="date" id="pm-date" value="${ymd(new Date())}"></div>
      <div class="fld"><label>ยอดเงินที่รับ <span class="req">*</span></label>
        <input class="inp" type="number" step="0.01" min="0" id="pm-amt" style="text-align:right"></div>
      <div class="fld"><label>ช่องทาง</label>
        <select class="sel" id="pm-method">
          <option value="TRANSFER">โอนเงิน</option><option value="CASH">เงินสด</option>
          <option value="CHEQUE">เช็ค</option><option value="OTHER">อื่น ๆ</option></select></div>
      <div class="fld"><label>เลขอ้างอิง</label><input class="inp" id="pm-ref"></div>
      <div class="fld"><label>หมายเหตุ</label><input class="inp" id="pm-note"></div>
    </div></div>
    <div class="card">
      <div class="row" style="padding:12px 14px">
        <h3>INVOICE คงค้างของลูกค้า</h3><span class="sp"></span>
        <button class="btn btn-o btn-sm" id="pm-auto">ตัดชำระอัตโนมัติ (เก่าสุดก่อน)</button></div>
      <div class="tbl-wrap" style="border:none;box-shadow:none">
      <table class="tbl rp-alloc-tbl"><thead><tr>
        <th>INVOICE</th><th>วันที่</th><th>Due</th><th class="r">ยอดรวม</th>
        <th class="r">WHT</th><th class="r">ยอดที่ต้องรับ</th>
        <th class="r">คงค้าง</th><th class="r">ตัดชำระครั้งนี้</th></tr></thead>
        <tbody id="pm-tbody"><tr><td colspan="6" class="empty">เลือกลูกค้าก่อน</td></tr></tbody></table></div>
      <div class="row" style="padding:12px 18px;border-top:1px solid var(--line)">
        <div>ยอดตัดชำระรวม: <b id="pm-sum">0.00</b> · ผลต่างกับยอดรับ:
          <span class="rp-diff" id="pm-diff">0.00</span></div>
        <span class="sp"></span>
        <button class="btn btn-p" id="pm-save">💾 บันทึกรับชำระ + ออกใบเสร็จ</button></div>
    </div>`;

  const tbody = cnt.querySelector('#pm-tbody');
  cnt.querySelector('#pm-back').onclick = () => location.hash = '#/receipts';

  async function loadInv() {
    const cid = cnt.querySelector('#pm-cust').value;
    if (!cid) { invoices = []; tbody.innerHTML = '<tr><td colspan="8" class="empty">เลือกลูกค้าก่อน</td></tr>'; upd(); return; }
    tbody.innerHTML = '<tr><td colspan="8" class="load-row"><div class="spin"></div></td></tr>';
    try {
      /* ── Defense ชั้นสอง ──
         ด่านหลักคือ SQL (njacc_customer_open_invoices + njacc_receive_payment
         ใน RUN-NOW/03) ที่กรอง charge_type='SERVICE' อยู่แล้ว
         ที่นี่กรองซ้ำเผื่อ RPC รุ่นเก่ายังไม่ได้อัปเดต -> ADVANCE จะไม่โผล่ให้เลือก
         ไม่ใช่การกรองแทน Backend · ถ้าหลุดมาถึง RPC จะโดน NJACC_RECEIPT_SERVICE_ONLY */
      const all = await openInvoices(cid);
      invoices = (all || []).filter(i =>
        String(i.charge_type || 'SERVICE').toUpperCase() === 'SERVICE');
      /* แสดง WHT และ Net Receivable ให้เห็นที่มาของยอดคงค้าง (มาจาก RUN-03)
         Outstanding = Net Receivable − ที่รับแล้ว · ไม่ใช่ Gross
         ยังไม่ได้รัน RUN-03 -> ไม่มี wht_amount/net_receivable ในผลลัพธ์ -> แสดง "-" ไม่เดาค่า */
      tbody.innerHTML = invoices.length ? invoices.map(i => `<tr data-inv="${i.id}">
        <td class="t-b">${esc(i.invoice_no)}</td><td>${dmy(i.invoice_date)}</td><td>${dmy(i.due_date)}</td>
        <td class="r">${money(i.total_amount)}</td>
        <td class="r">${i.wht_amount === undefined ? '-' : money(i.wht_amount)}</td>
        <td class="r">${i.net_receivable === undefined ? '-' : money(i.net_receivable)}</td>
        <td class="r money-neg">${money(i.outstanding)}</td>
        <td class="r"><input class="inp" type="number" step="0.01" min="0" max="${i.outstanding}"
          data-alloc value=""></td></tr>`).join('')
        : '<tr><td colspan="8" class="empty">ลูกค้ารายนี้ไม่มี INVOICE บริการคงค้าง (งานสำรองจ่ายใช้เมนู FINANCE &gt; Advance)</td></tr>';
      upd();
    } catch (e) { handleErr(e); }
  }
  cnt.querySelector('#pm-cust').onchange = loadInv;

  function readAllocs() {
    return [...tbody.querySelectorAll('tr[data-inv]')].map(tr => ({
      invoice_id: tr.dataset.inv,
      amount: round2(Number(tr.querySelector('[data-alloc]').value || 0)),
    })).filter(a => a.amount > 0);
  }
  function upd() {
    const amt = round2(Number(cnt.querySelector('#pm-amt').value || 0));
    const s = sumAlloc(readAllocs());
    cnt.querySelector('#pm-sum').textContent = money(s);
    const diff = round2(amt - s);
    const de = cnt.querySelector('#pm-diff');
    de.textContent = money(diff);
    de.className = 'rp-diff ' + (Math.abs(diff) <= 0.005 && amt > 0 ? 'ok' : 'bad');
  }
  tbody.addEventListener('input', upd);
  cnt.querySelector('#pm-amt').addEventListener('input', upd);

  cnt.querySelector('#pm-auto').onclick = () => {
    const amt = round2(Number(cnt.querySelector('#pm-amt').value || 0));
    if (amt <= 0) { toast('ใส่ยอดเงินที่รับก่อน', 'err'); return; }
    const { allocations, leftover } = autoAllocate(invoices, amt);
    tbody.querySelectorAll('tr[data-inv]').forEach(tr => {
      const a = allocations.find(x => x.invoice_id === tr.dataset.inv);
      tr.querySelector('[data-alloc]').value = a ? a.amount : '';
    });
    if (leftover > 0) toast('ยอดรับมากกว่าคงค้างรวม — เหลือ ' + money(leftover) + ' ตัดไม่หมด', 'err');
    upd();
  };

  cnt.querySelector('#pm-save').onclick = async (e) => {
    const cid = cnt.querySelector('#pm-cust').value;
    const amt = round2(Number(cnt.querySelector('#pm-amt').value || 0));
    const allocs = readAllocs();
    if (!cid) { toast('เลือกลูกค้า', 'err'); return; }
    if (amt <= 0) { toast('ยอดเงินที่รับต้องมากกว่า 0', 'err'); return; }
    if (!allocs.length) { toast('ต้องตัดชำระอย่างน้อย 1 INVOICE', 'err'); return; }
    const s = sumAlloc(allocs);
    if (Math.abs(s - amt) > 0.005) { toast('ยอดตัดชำระรวมต้องเท่ากับยอดเงินที่รับ', 'err'); return; }
    for (const a of allocs) {
      const inv = invoices.find(i => i.id === a.invoice_id);
      if (inv && a.amount > Number(inv.outstanding) + 0.005) {
        toast('ยอดตัด ' + esc(inv.invoice_no) + ' เกินยอดคงค้าง', 'err'); return;
      }
    }
    const ok = await confirmModal('ยืนยันรับชำระ',
      `ยอดรับ: <b>${money(amt)}</b> บาท · ตัดชำระ ${allocs.length} INVOICE<br>` +
      `ระบบจะบันทึกการรับชำระและออกใบเสร็จในรายการเดียว`, 'บันทึก');
    if (!ok) return;
    btnBusy(e.target, true);
    try {
      const res = await once('recv-pay', () => receivePayment({
        p_customer: cid, p_amount: amt,
        p_allocations: allocs.map(a => ({ invoice_id: a.invoice_id, amount: a.amount })),
        p_request_id: requestId,
        p_date: cnt.querySelector('#pm-date').value || null,
        p_method: cnt.querySelector('#pm-method').value,
        p_ref: cnt.querySelector('#pm-ref').value.trim() || null,
        p_note: cnt.querySelector('#pm-note').value.trim() || null,
        p_issue_receipt: true,
      }));
      toast('รับชำระแล้ว · ใบเสร็จ ' + (res.receipt_no || '-'), 'ok');
      location.hash = '#/receipts';
    } catch (ex) { handleErr(ex); btnBusy(e.target, false); }
  };
}
