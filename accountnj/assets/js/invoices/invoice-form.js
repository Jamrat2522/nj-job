/* ออก INVOICE จากงาน — ยอดจริงคำนวณซ้ำใน DB · idempotent ด้วย request_id */
import { issueInvoice } from './invoice-api.js';
import { jobDetail } from '../jobs/job-api.js';
import { masters, activeServiceCodes } from '../master/master-cache.js';
import { AppState } from '../core/state.js';
import { itemRowHTML } from './invoice-items.js';
import { calcLine, calcTotals } from './invoice-calc.js';
import { esc, money, ymd, dmy } from '../core/formatter.js';
import { toast } from '../components/toast.js';
import { confirmModal } from '../components/modal.js';
import { btnBusy } from '../components/loading.js';
import { handleErr } from '../core/error-handler.js';
import { newRequestId, once } from '../core/request-manager.js';

export async function render(cnt, { jobId }) {
  await masters();
  const j = await jobDetail(jobId);
  const charge = j.charge_type;
  if (j.invoice_id) {
    cnt.innerHTML = '<div class="card card-pad empty">งานนี้ออก INVOICE แล้ว</div>';
    return;
  }
  const vatRate = Number(AppState.masters.vat_rate || 7);
  const newItem = () => ({ code: '', description: '', amount: '', cost: '', charge: '',
    charge_kind: charge === 'ADVANCE' ? 'ADVANCE' : 'SERVICE',
    vat_applicable: true, wht_applicable: false });
  const items = [newItem()];
  const requestId = newRequestId(); /* คงที่ตลอดหน้า — กันกดซ้ำ/สร้างซ้ำ */

  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>ออก INVOICE — งาน ${esc(j.job_no)}</h2></div>
      <button class="btn btn-o" id="iv-back">← กลับ</button></div>
    <div class="card card-pad mb-2">
      <div class="fgrid">
        <div class="fld"><label>ลูกค้า</label><div class="t-b">${esc(j.customer_name || '-')}</div></div>
        <div class="fld"><label>Customer Job No</label><div>${esc(j.customer_job_no || '-')}</div></div>
        <div class="fld"><label>House B/L</label><div>${esc(j.house_bl_no || '-')}</div></div>
        <div class="fld"><label>วันที่ INVOICE</label>
          <input class="inp" type="date" id="iv-date" value="${ymd(new Date())}"></div>
        <div class="fld"><label>Due Date</label>
          <input class="inp" type="date" id="iv-due" value="${j.due_date || ''}"></div>
        <div class="fld"><label>อัตรา VAT</label><div>${vatRate}%</div></div>
      </div></div>
    <div class="card">
      <div class="tbl-wrap" style="border:none;box-shadow:none">
      <table class="tbl iv-items"><thead><tr>
        <th class="center">Item</th><th>Code</th><th>Description</th><th class="r">Amount</th>
        <th class="r">Cost</th><th class="r">Charge</th><th>ประเภท</th>
        <th class="center">VAT</th><th class="center">WHT</th><th class="r">รวมบรรทัด</th><th></th>
      </tr></thead><tbody id="iv-tbody"></tbody></table></div>
      <div class="row" style="padding:10px 14px">
        <button class="btn btn-o btn-sm" id="iv-add">+ เพิ่มรายการ</button>
        <span class="t-xs t-3">กด ENTER ในช่องใดก็ได้เพื่อเพิ่มรายการถัดไป</span><span class="sp"></span></div>
      <div class="iv-sum card-pad">
        <div class="r-line"><span>ยอดก่อน VAT</span><span id="iv-sub">0.00</span></div>
        <div class="r-line"><span>VAT ${vatRate}%</span><span id="iv-vat">0.00</span></div>
        <div class="r-line"><span>หัก ณ ที่จ่าย (แจ้งเพื่อทราบ)</span><span id="iv-wht">0.00</span></div>
        <div class="r-line total"><span>ยอดรวมทั้งสิ้น</span><span id="iv-total">0.00</span></div>
      </div>
      <div class="row" style="padding:14px 18px;border-top:1px solid var(--line)">
        <span class="sp"></span>
        <button class="btn btn-o" id="iv-cancel">ยกเลิก</button>
        <button class="btn btn-p" id="iv-issue">🧾 ออก INVOICE</button></div>
    </div>`;

  const tbody = cnt.querySelector('#iv-tbody');
  function draw() {
    tbody.innerHTML = items.map((it, i) => itemRowHTML(it, i)).join('');
    recalc();
  }
  function readRow(tr, i) {
    const g = (k) => tr.querySelector(`[data-k="${k}"]`);
    items[i] = {
      code: g('code').value || null,
      description: g('description').value.trim(),
      amount: Number(g('amount').value || 0),
      cost: Number(g('cost').value || 0),
      charge: Number(g('charge').value || 0),
      charge_kind: g('charge_kind').value,
      vat_applicable: g('vat_applicable').checked,
      wht_applicable: g('wht_applicable').checked,
    };
  }
  function recalc() {
    tbody.querySelectorAll('tr').forEach((tr) => {
      const i = Number(tr.dataset.i);
      readRow(tr, i);
      tr.querySelector('[data-line]').textContent = money(calcLine(items[i], vatRate).lineTotal);
    });
    const t = calcTotals(items.filter(x => x.amount > 0 || x.description), vatRate);
    cnt.querySelector('#iv-sub').textContent = money(t.sub);
    cnt.querySelector('#iv-vat').textContent = money(t.vat);
    cnt.querySelector('#iv-wht').textContent = money(t.wht);
    cnt.querySelector('#iv-total').textContent = money(t.total);
    return t;
  }
  tbody.addEventListener('input', recalc);
  tbody.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-k="code"]');
    if (sel) {
      const c = activeServiceCodes().find(x => x.code === sel.value);
      if (c) {
        const tr = sel.closest('tr');
        tr.querySelector('[data-k="description"]').value = c.description;
        if (!tr.querySelector('[data-k="amount"]').value)
          tr.querySelector('[data-k="amount"]').value = c.default_charge || '';
        if (!tr.querySelector('[data-k="cost"]').value)
          tr.querySelector('[data-k="cost"]').value = c.default_cost || '';
        if (!tr.querySelector('[data-k="charge"]').value)
          tr.querySelector('[data-k="charge"]').value = c.default_charge || '';
        tr.querySelector('[data-k="vat_applicable"]').checked = c.vat_applicable !== false;
        tr.querySelector('[data-k="wht_applicable"]').checked = !!c.wht_applicable;
      }
    }
    recalc();
  });
  tbody.addEventListener('click', (e) => {
    const del = e.target.closest('[data-del]');
    if (del) {
      const i = Number(del.closest('tr').dataset.i);
      items.splice(i, 1);
      if (!items.length) items.push(newItem());
      draw();
    }
  });
  tbody.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    addRow();
  });
  function addRow() {
    tbody.querySelectorAll('tr').forEach(tr => readRow(tr, Number(tr.dataset.i)));
    items.push(newItem());
    draw();
    const last = tbody.querySelector('tr:last-child [data-k="description"]');
    if (last) last.focus();
  }
  cnt.querySelector('#iv-add').onclick = addRow;
  const back = () => location.hash = '#/job/' + jobId;
  cnt.querySelector('#iv-back').onclick = back;
  cnt.querySelector('#iv-cancel').onclick = back;

  cnt.querySelector('#iv-issue').onclick = async (e) => {
    const t = recalc();
    const valid = items.filter(x => x.description && Number(x.amount) > 0);
    if (!valid.length) { toast('ต้องมีรายการที่มีรายละเอียดและจำนวนเงิน > 0 อย่างน้อย 1 รายการ', 'err'); return; }
    if (valid.length !== items.filter(x => x.description || Number(x.amount) > 0).length) {
      toast('มีรายการที่กรอกไม่ครบ (ขาดรายละเอียดหรือจำนวนเงิน)', 'err'); return;
    }
    const ok = await confirmModal('ยืนยันออก INVOICE',
      `ลูกค้า: <b>${esc(j.customer_name)}</b><br>รายการ: ${valid.length} รายการ<br>` +
      `ยอดรวม: <b>${money(t.total)}</b> บาท<br>Due Date: ${dmy(cnt.querySelector('#iv-due').value) || '-'}<br><br>` +
      `เมื่อออกแล้ว เลข INVOICE จะถูกสร้างโดยระบบและแก้ไขงานไม่ได้จนกว่าจะ Void`, 'ออก INVOICE');
    if (!ok) return;
    btnBusy(e.target, true);
    try {
      const res = await once('issue-inv', () =>
        issueInvoice(jobId, valid, requestId,
          cnt.querySelector('#iv-date').value || null,
          cnt.querySelector('#iv-due').value || null));
      toast('ออก INVOICE ' + res.invoice_no + ' แล้ว', 'ok');
      location.hash = '#/invoice/' + res.id;
    } catch (ex) { handleErr(ex); btnBusy(e.target, false); }
  };
  draw();
}
