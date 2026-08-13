/* ฟอร์มเปิดงานใหม่ / แก้ไขงาน (ยังไม่มีการเงิน — เกิดตอนออก INVOICE) */
import { saveJob, jobDetail } from './job-api.js';
import { masters, customerOpts, companyOpts } from '../master/master-cache.js';
import { AppState } from '../core/state.js';
import { isAdmin } from '../core/permissions.js';
import { required, isDate, markInvalid, clearInvalid } from '../core/validator.js';
import { ymd, dmy, esc } from '../core/formatter.js';
import { toast } from '../components/toast.js';
import { btnBusy } from '../components/loading.js';
import { handleErr } from '../core/error-handler.js';
import { once } from '../core/request-manager.js';
import { groupLabel, chargeLabel } from '../config/charge-groups.js';

export async function render(cnt, params) {
  await masters();
  const editId = params.id || null;
  let job = { charge_type: params.charge, company_group: params.group, containers: [] };
  if (editId) {
    job = await jobDetail(editId);
    if (job.invoice_id) {
      cnt.innerHTML = '<div class="card card-pad empty">งานนี้ออก INVOICE แล้ว — แก้ไขข้อมูลงานไม่ได้ ต้อง Void INVOICE ก่อน</div>';
      return;
    }
  }
  const charge = job.charge_type, group = job.company_group;
  const custTerm = () => {
    const c = (AppState.masters.customers || []).find(x => x.id === cnt.querySelector('#jf-cust').value);
    return c ? c.credit_term_days : null;
  };

  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>${editId ? 'แก้ไขงาน ' + esc(job.job_no || '') : 'เปิดงานใหม่'}</h2>
      <span class="ch-head-badge service">${chargeLabel(charge)} · ${groupLabel(group)}</span></div>
      <button class="btn btn-o" id="jf-back">← กลับ</button></div>
    <div class="card card-pad">
      <div class="fgrid">
        <div class="fld"><label>ประเภทข้อมูล</label>
          <select class="sel" id="jf-dtype">
            <option value="">—</option>
            <option value="IMPORT" ${job.data_type === 'IMPORT' ? 'selected' : ''}>IMPORT</option>
            <option value="EXPORT" ${job.data_type === 'EXPORT' ? 'selected' : ''}>EXPORT</option>
          </select></div>
        <div class="fld"><label>วันที่อ้างอิง <span class="req">*</span></label>
          <input class="inp" type="date" id="jf-refdate" value="${job.reference_date || ymd(new Date())}"></div>
        <div class="fld"><label>เลขอ้างอิง</label>
          <input class="inp" id="jf-ref" value="${esc(job.reference_no || '')}"></div>
        <div class="fld"><label>บริษัท Invoice</label>
          <div class="row" style="flex-wrap:nowrap;gap:6px">
            <select class="sel" id="jf-comp" style="flex:1">${companyOpts(job.company_invoice_id)}</select>
            ${isAdmin() ? '<button type="button" class="btn btn-o btn-sm" data-master="companies">+ จัดการ</button>' : ''}
          </div></div>
        <div class="fld"><label>ลูกค้า <span class="req">*</span></label>
          <div class="row" style="flex-wrap:nowrap;gap:6px">
            <select class="sel" id="jf-cust" style="flex:1">${customerOpts(job.customer_id)}</select>
            ${isAdmin() ? '<button type="button" class="btn btn-o btn-sm" data-master="customers">+ จัดการ</button>' : ''}
          </div></div>
        <div class="fld"><label>Customer Job No</label>
          <input class="inp" id="jf-cjob" value="${esc(job.customer_job_no || '')}"></div>
      </div>
      <div class="fsec"><div class="fsec-t">ข้อมูลชิปปิ้ง / เอกสาร</div>
      <div class="fgrid">
        <div class="fld"><label>เลขใบขนสินค้า</label>
          <input class="inp" id="jf-decl" value="${esc(job.customs_declaration_no || '')}"></div>
        <div class="fld"><label>Invoice ต้นทาง (Source)</label>
          <input class="inp" id="jf-srcinv" value="${esc(job.source_invoice_no || '')}"></div>
        <div class="fld"><label>House B/L No</label>
          <input class="inp" id="jf-hbl" value="${esc(job.house_bl_no || '')}"></div>
        <div class="fld"><label>Master B/L No</label>
          <input class="inp" id="jf-mbl" value="${esc(job.master_bl_no || '')}"></div>
        <div class="fld"><label>Booking No</label>
          <input class="inp" id="jf-book" value="${esc(job.booking_no || '')}"></div>
        <div class="fld"><label>ชื่อเรือ / Vessel</label>
          <input class="inp" id="jf-vessel" value="${esc(job.vessel_name || '')}"></div>
        <div class="fld"><label>จำนวนตู้</label>
          <input class="inp" type="number" min="0" id="jf-qtyc" value="${job.qty_container ?? ''}"></div>
        <div class="fld"><label>ETD</label>
          <input class="inp" type="date" id="jf-etd" value="${job.etd || ''}"></div>
        <div class="fld"><label>ETA</label>
          <input class="inp" type="date" id="jf-eta" value="${job.eta || ''}"></div>
        <div class="fld"><label>วันส่งมอบ</label>
          <input class="inp" type="date" id="jf-dlv" value="${job.delivery_date || ''}"></div>
        <div class="fld"><label>Case</label>
          <input class="inp" id="jf-case" value="${esc(job.case_no || '')}"></div>
        <div class="fld"><label>Contact</label>
          <input class="inp" id="jf-contact" value="${esc(job.contact || '')}"></div>
        <div class="fld"><label>CS</label>
          <input class="inp" id="jf-cs" value="${esc(job.cs_name || '')}"></div>
        <div class="fld"><label>I BILLING APL</label>
          <input class="inp" id="jf-apl" value="${esc(job.i_billing_apl || '')}"></div>
      </div></div>
      <div class="fsec"><div class="fsec-t">เลขตู้คอนเทนเนอร์</div>
        <div id="jf-cnts"></div>
        <button class="btn btn-o btn-sm" id="jf-addcnt">+ เพิ่มตู้</button></div>
      <div class="fsec"><div class="fsec-t">เครดิตเทอม / กำหนดชำระ</div>
      <div class="fgrid">
        <div class="fld"><label>Credit Term (วัน)</label>
          <input class="inp" type="number" min="0" id="jf-term" value="${job.credit_term_days ?? ''}"
            placeholder="เว้นว่าง = ใช้ค่าของลูกค้า"></div>
        <div class="fld"><label>Due Date</label>
          <input class="inp" type="date" id="jf-due" value="${job.due_date || ''}"
            placeholder="เว้นว่าง = คำนวณจากวันที่+เทอม"></div>
        <div class="fld" style="align-self:end"><div class="jf-due-preview" id="jf-due-pv">—</div></div>
      </div></div>
      <div class="fsec"><div class="fsec-t">หมายเหตุ</div>
        <textarea class="inp w100" id="jf-note">${esc(job.note || '')}</textarea></div>
      <div class="row mt-3">
        <span class="sp"></span>
        <button class="btn btn-o" id="jf-cancel">ยกเลิก</button>
        <button class="btn btn-p" id="jf-save">💾 บันทึกงาน</button></div>
    </div>`;

  /* containers */
  const cntWrap = cnt.querySelector('#jf-cnts');
  function cntRow(c = {}) {
    const d = document.createElement('div');
    d.className = 'jf-cnt-row';
    d.innerHTML = `<input class="inp" data-cn placeholder="เลขตู้" value="${esc(c.container_no || '')}">
      <input class="inp" data-ct placeholder="ประเภทตู้ เช่น 40HC" style="max-width:150px" value="${esc(c.container_type || '')}">
      <button class="btn btn-o btn-sm" data-del>✕</button>`;
    d.querySelector('[data-del]').onclick = () => d.remove();
    cntWrap.appendChild(d);
  }
  (job.containers || []).forEach(cntRow);
  cnt.querySelector('#jf-addcnt').onclick = () => cntRow();

  /* due preview */
  function updDue() {
    const pv = cnt.querySelector('#jf-due-pv');
    const dueManual = cnt.querySelector('#jf-due').value;
    if (dueManual) { pv.textContent = 'Due Date: ' + dmy(dueManual) + ' (กำหนดเอง)'; return; }
    const base = cnt.querySelector('#jf-refdate').value;
    const term = cnt.querySelector('#jf-term').value !== '' ? Number(cnt.querySelector('#jf-term').value) : custTerm();
    if (base && term != null) {
      const d = new Date(base + 'T00:00:00'); d.setDate(d.getDate() + Number(term));
      pv.textContent = 'Due Date (คำนวณ): ' + dmy(ymd(d)) + ' · เทอม ' + term + ' วัน';
      pv.dataset.calc = ymd(d);
    } else { pv.textContent = 'ระบุวันที่ + ลูกค้า/เทอม เพื่อคำนวณ Due Date'; delete pv.dataset.calc; }
  }
  ['#jf-refdate', '#jf-term', '#jf-due', '#jf-cust'].forEach(s =>
    cnt.querySelector(s).addEventListener('input', updDue));
  updDue();

  /* เข้าหน้าจัดการข้อมูลหลักได้จากฟอร์ม โดยไม่เพิ่มเมนูใน Sidebar */
  cnt.addEventListener('click', (e) => {
    const b = e.target.closest('[data-master]');
    if (b) location.hash = '#/masters?tab=' + b.dataset.master;
  });

  const back = () => location.hash = '#/charges/' + charge + '/' + group;
  cnt.querySelector('#jf-back').onclick = back;
  cnt.querySelector('#jf-cancel').onclick = back;

  cnt.querySelector('#jf-save').onclick = async (e) => {
    clearInvalid(cnt);
    const refdate = cnt.querySelector('#jf-refdate');
    const cust = cnt.querySelector('#jf-cust');
    let bad = false;
    if (!required(refdate.value) || !isDate(refdate.value)) { markInvalid(refdate, 'ระบุวันที่'); bad = true; }
    if (!required(cust.value)) { markInvalid(cust, 'เลือกลูกค้า'); bad = true; }
    if (bad) { toast('กรอกข้อมูลที่จำเป็นให้ครบ', 'err'); return; }
    const pv = cnt.querySelector('#jf-due-pv');
    const payload = {
      id: editId, charge_type: charge, company_group: group,
      data_type: cnt.querySelector('#jf-dtype').value || null,
      reference_no: cnt.querySelector('#jf-ref').value.trim() || null,
      reference_date: refdate.value,
      company_invoice_id: cnt.querySelector('#jf-comp').value || null,
      customer_id: cust.value,
      customs_declaration_no: cnt.querySelector('#jf-decl').value.trim() || null,
      source_invoice_no: cnt.querySelector('#jf-srcinv').value.trim() || null,
      house_bl_no: cnt.querySelector('#jf-hbl').value.trim() || null,
      master_bl_no: cnt.querySelector('#jf-mbl').value.trim() || null,
      booking_no: cnt.querySelector('#jf-book').value.trim() || null,
      vessel_name: cnt.querySelector('#jf-vessel').value.trim() || null,
      qty_container: cnt.querySelector('#jf-qtyc').value !== '' ? Number(cnt.querySelector('#jf-qtyc').value) : null,
      etd: cnt.querySelector('#jf-etd').value || null,
      eta: cnt.querySelector('#jf-eta').value || null,
      delivery_date: cnt.querySelector('#jf-dlv').value || null,
      customer_job_no: cnt.querySelector('#jf-cjob').value.trim() || null,
      case_no: cnt.querySelector('#jf-case').value.trim() || null,
      contact: cnt.querySelector('#jf-contact').value.trim() || null,
      cs_name: cnt.querySelector('#jf-cs').value.trim() || null,
      i_billing_apl: cnt.querySelector('#jf-apl').value.trim() || null,
      credit_term_days: cnt.querySelector('#jf-term').value !== '' ? Number(cnt.querySelector('#jf-term').value) : custTerm(),
      due_date: cnt.querySelector('#jf-due').value || pv.dataset.calc || null,
      note: cnt.querySelector('#jf-note').value.trim() || null,
      containers: [...cntWrap.querySelectorAll('.jf-cnt-row')].map(r => ({
        container_no: r.querySelector('[data-cn]').value.trim(),
        container_type: r.querySelector('[data-ct]').value.trim() || null,
      })).filter(c => c.container_no),
    };
    btnBusy(e.target, true);
    try {
      await once('save-job', () => saveJob(payload));
      toast(editId ? 'บันทึกการแก้ไขแล้ว' : 'เปิดงานใหม่แล้ว', 'ok');
      back();
    } catch (ex) { handleErr(ex); btnBusy(e.target, false); }
  };
}
