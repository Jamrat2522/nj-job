/* หัก ณ ที่จ่าย — njacc_create_wht/list_wht/void_wht
   คอลัมน์จริง: document_no, document_date, wht_type, tax_base, rate, amount,
   status, customer_name, invoice_no (จาก invoice_id) · อ้างอิงข้อความอิสระ = reference_no */
import { createWht, listWht, voidWht } from './withholding-api.js';
import { masters, customerOpts } from '../master/master-cache.js';
import { esc, money, dmy, round2, ymd } from '../core/formatter.js';
import { can, isAdmin } from '../core/permissions.js';
import { renderPagination } from '../components/pagination.js';
import { openModal, closeModal, reasonModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { btnBusy } from '../components/loading.js';
import { handleErr } from '../core/error-handler.js';
import { newRequestId, once, nextToken, isCurrent } from '../core/request-manager.js';

const st = { customer: '', from: '', to: '', page: 1, size: 20 };

export async function render(cnt) {
  await masters();
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>หัก ณ ที่จ่าย</h2></div>
      ${(isAdmin() || can('issue_receipt')) ? '<button class="btn btn-p" id="wh-new">+ บันทึกเอกสารหัก ณ ที่จ่าย</button>' : ''}</div>
    <div class="fbar">
      <select class="sel" data-f="customer">${customerOpts(st.customer)}</select>
      <input class="inp" type="date" data-f="from" value="${st.from}">
      <input class="inp" type="date" data-f="to" value="${st.to}">
      <button class="btn btn-o btn-sm" id="wh-go">ค้นหา</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>เลขเอกสาร</th><th>วันที่</th><th>ลูกค้า</th><th>ประเภท</th><th>อ้างอิง INVOICE</th>
      <th class="r">ฐานภาษี</th><th>อัตรา</th><th class="r">ยอดหัก</th><th>สถานะ</th><th class="center">จัดการ</th>
    </tr></thead><tbody id="wh-tbody"><tr><td colspan="10" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div><div class="card mt-2" id="wh-pgn"></div>`;

  async function load() {
    const t = nextToken('wht');
    try {
      const res = await listWht({ p_customer: st.customer || null, p_from: st.from || null,
        p_to: st.to || null, p_page: st.page, p_size: st.size });
      if (!isCurrent('wht', t)) return;
      const rows = res.rows || [];
      cnt.querySelector('#wh-tbody').innerHTML = rows.length ? rows.map(r => `<tr>
        <td class="t-b">${esc(r.document_no)}</td><td>${dmy(r.document_date)}</td>
        <td class="ellip" style="max-width:190px">${esc(r.customer_name)}</td>
        <td>${esc(r.wht_type || '-')}</td><td>${esc(r.invoice_no || '-')}</td>
        <td class="r">${money(r.tax_base)}</td>
        <td><span class="wht-rate-chip">${Number(r.rate)}%</span></td>
        <td class="r t-b">${money(r.amount)}</td>
        <td>${r.status === 'VOID' ? '<span class="bdg bdg-void">VOID</span>' : '<span class="bdg bdg-issued">ISSUED</span>'}</td>
        <td><div class="ch-act">${r.status !== 'VOID' && (isAdmin() || can('void')) ?
          `<button class="btn btn-danger btn-sm" data-void="${r.id}" data-no="${esc(r.document_no)}">Void</button>` : '-'}
        </div></td></tr>`).join('')
        : '<tr><td colspan="10" class="empty">ยังไม่มีเอกสารหัก ณ ที่จ่าย</td></tr>';
      renderPagination(cnt.querySelector('#wh-pgn'), { page: st.page, size: st.size, total: res.total || 0 },
        ({ page, size }) => { st.page = page; st.size = size; load(); });
    } catch (e) { if (isCurrent('wht', t)) handleErr(e); }
  }
  cnt.querySelector('#wh-go').onclick = () => {
    cnt.querySelectorAll('[data-f]').forEach(el => st[el.dataset.f] = el.value);
    st.page = 1; load();
  };
  cnt.querySelector('#wh-tbody').addEventListener('click', async (e) => {
    const vb = e.target.closest('[data-void]'); if (!vb) return;
    const reason = await reasonModal('Void เอกสารหัก ณ ที่จ่าย ' + vb.dataset.no);
    if (!reason) return;
    try {
      await once('void-wht-' + vb.dataset.void, () => voidWht(vb.dataset.void, reason, newRequestId()));
      toast('Void เอกสารแล้ว', 'ok'); load();
    } catch (ex) { handleErr(ex); }
  });

  const nb = cnt.querySelector('#wh-new');
  if (nb) nb.onclick = () => openCreate(load);
  load();
}

function openCreate(onDone) {
  const requestId = newRequestId(); /* คงที่ตลอด modal — กันกดซ้ำสร้างซ้ำ */
  const b = document.createElement('div');
  b.innerHTML = `
    <div class="fgrid">
      <div class="fld"><label>ลูกค้า <span class="req">*</span></label>
        <select class="sel" id="wf-cust">${customerOpts('')}</select></div>
      <div class="fld"><label>วันที่เอกสาร <span class="req">*</span></label>
        <input class="inp" type="date" id="wf-date" value="${ymd(new Date())}"></div>
      <div class="fld"><label>ประเภทการหัก</label>
        <select class="sel" id="wf-type">
          <option value="SERVICE">ค่าบริการ</option><option value="TRANSPORT">ค่าขนส่ง</option>
          <option value="RENT">ค่าเช่า</option><option value="OTHER">อื่น ๆ</option></select></div>
      <div class="fld"><label>เลขอ้างอิง (เช่น INVOICE NO)</label>
        <input class="inp" id="wf-ref" placeholder="เช่น INV26-0001"></div>
      <div class="fld"><label>ฐานภาษี (บาท) <span class="req">*</span></label>
        <input class="inp" type="number" step="0.01" min="0" id="wf-base" style="text-align:right"></div>
      <div class="fld"><label>อัตราหัก (%)</label>
        <input class="inp" type="number" step="0.01" min="0" id="wf-rate" value="3" style="text-align:right"></div>
    </div>
    <div class="jf-due-preview mt-2" id="wf-pv">ยอดหัก: 0.00 บาท (ระบบคำนวณซ้ำฝั่งฐานข้อมูล)</div>`;
  const f = document.createElement('div');
  f.innerHTML = `<button class="btn btn-o" data-close>ยกเลิก</button>
    <button class="btn btn-p" id="wf-save">บันทึก</button>`;
  openModal({ title: 'บันทึกเอกสารหัก ณ ที่จ่าย', body: b, footer: f, large: true });
  const upd = () => {
    const base = Number(b.querySelector('#wf-base').value || 0);
    const rate = Number(b.querySelector('#wf-rate').value || 0);
    b.querySelector('#wf-pv').textContent =
      'ยอดหัก: ' + money(round2(base * rate / 100)) + ' บาท (ระบบคำนวณซ้ำฝั่งฐานข้อมูล)';
  };
  b.addEventListener('input', upd);
  f.querySelector('#wf-save').onclick = async (e) => {
    const cust = b.querySelector('#wf-cust').value;
    const base = Number(b.querySelector('#wf-base').value || 0);
    if (!cust) { toast('เลือกลูกค้า', 'err'); return; }
    if (base <= 0) { toast('ฐานภาษีต้องมากกว่า 0', 'err'); return; }
    btnBusy(e.target, true);
    try {
      const res = await once('create-wht', () => createWht({
        customer_id: cust,
        document_date: b.querySelector('#wf-date').value,
        wht_type: b.querySelector('#wf-type').value,
        reference_no: b.querySelector('#wf-ref').value.trim() || null,
        tax_base: base,
        rate: Number(b.querySelector('#wf-rate').value || 3),
      }, requestId));
      closeModal();
      toast('บันทึกเอกสาร ' + (res?.document_no || '') + ' แล้ว', 'ok');
      onDone();
    } catch (ex) { handleErr(ex); btnBusy(e.target, false); }
  };
}
