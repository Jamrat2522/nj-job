/* ฟอร์มเปิดงานใหม่ / แก้ไขงาน (ยังไม่มีการเงิน — เกิดตอนออก INVOICE) */
import { saveJob, jobDetail } from './job-api.js';
import { masters, companyOpts, activeCustomers, activeCompanies } from '../master/master-cache.js';
import { comboboxHTML, bindCombobox, comboValue, comboText } from '../components/combobox.js';
import { upsertCustomer, upsertCompany } from '../master/master-api.js';
import { AppState } from '../core/state.js';
import { isAdmin } from '../core/permissions.js';
import { required, isDate, markInvalid, clearInvalid } from '../core/validator.js';
import { ymd, dmy, esc } from '../core/formatter.js';
import { toast } from '../components/toast.js';
import { openModal, closeModal, enableEnterNav } from '../components/modal.js';
import { btnBusy } from '../components/loading.js';
import { handleErr } from '../core/error-handler.js';
import { once } from '../core/request-manager.js';
import { groupLabel, chargeLabel } from '../config/charge-groups.js';

/* ช่อง "ลูกค้า" แสดง "ชื่อบริษัท" (ตามที่ผู้ใช้กำหนด — อ่านง่ายกว่า CODE)
   ค้นหายังใช้ได้ทั้ง CODE และชื่อ · รายการเลือกยังโชว์ CODE นำหน้าเพื่อให้เห็นรหัสด้วย
   ค่าที่บันทึกจริงยังเป็น njacc_customers.id (uuid) เหมือนเดิม — ไม่เปลี่ยน relationship
   ถ้าลูกค้าไม่มีชื่อ (เป็นไปไม่ได้เพราะ NOT NULL) จึง fallback เป็น CODE เพื่อความปลอดภัย */
const CUST_DISPLAY = (it) => (it ? (it.name || it.code) : '');

export async function render(cnt, params) {
  await masters();
  const editId = params.id || null;
  /* mode มาจาก query string ของ route (#/job/:id/edit?mode=accounting) — router รวม params ให้แล้ว
     DOCUMENT = เห็นเฉพาะ DOCUMENT · ACCOUNTING = เห็น DOCUMENT + ACCOUNTING (ตาม Requirement 15)
     ค่าเริ่มต้น 'document' → route เดิมที่ไม่ส่ง mode ยังทำงานเหมือนเดิม */
  const isAcc = params.mode === 'accounting';
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
    const c = (AppState.masters.customers || []).find(x => x.id === comboValue(cnt.querySelector('#jf-cust')));
    return c ? c.credit_term_days : null;
  };

  /* Full-Screen shell: Header (ติดบน) / Body (scroll) / Footer (ติดล่าง) — ใช้ CSS ชุดเดียวกับ modal-fs
     ประเภทงาน / ประเภทข้อมูล / วันที่อ้างอิง / เลขอ้างอิง = ไม่แสดงใน UI (ตาม Requirement)
     แต่ค่าเดิมของงานถูกเก็บใน hidden input → payload ที่ส่ง njacc_save_job เหมือนเดิมทุก field
     (ไม่ล้างข้อมูลเดิมของงาน และไม่ DROP คอลัมน์ใด ๆ ใน DB) */
  cnt.innerHTML = `
    <div class="fs-page">
      <div class="fs-head"><div class="fs-title"><span class="dot"></span>
        <h2>${editId ? 'แก้ไขงาน' : 'เปิดงานใหม่'} (${isAcc ? 'ACCOUNTING' : 'DOCUMENT'} - ${chargeLabel(charge)})</h2>
        <span class="ch-head-badge service">${groupLabel(group)}</span></div>
        <button class="btn-icon" id="jf-back" aria-label="ปิด">✕</button></div>
      <div class="fs-body">
      <input type="hidden" id="jf-dtype" value="${esc(job.data_type || '')}">
      <input type="hidden" id="jf-refdate" value="${job.reference_date || ymd(new Date())}">
      <input type="hidden" id="jf-ref" value="${esc(job.reference_no || '')}">

      <div class="jm-sec jm-doc">
        <div class="jm-sec-t">DOCUMENT</div>
        <div class="jm-grid">
          <div class="fld"><label>เลขงาน</label>
            <input class="inp" value="${esc(job.job_no || 'ระบบออกเลขให้อัตโนมัติเมื่อบันทึก')}" readonly disabled></div>
          <div class="fld"><label>บริษัท Invoice</label>
            <select class="sel" id="jf-comp">${companyOpts(job.company_invoice_id)}</select>
            ${isAdmin() ? '<button type="button" class="jm-link" data-master="companies">+ จัดการ</button>' : ''}</div>
          <div class="fld"><label>ลูกค้า <span class="req">*</span></label>
            ${comboboxHTML('jf-cust', activeCustomers(), job.customer_id, 'พิมพ์ชื่อบริษัท หรือ CODE เพื่อค้นหา', CUST_DISPLAY)}
            ${isAdmin() ? '<button type="button" class="jm-link" data-master="customers">+ จัดการ</button>' : ''}</div>
          <div class="fld"><label>Customer Job No.</label>
            <input class="inp" id="jf-cjob" value="${esc(job.customer_job_no || '')}"></div>
        </div>
        <div class="jm-grid">
          <div class="fld"><label>เลขใบขนสินค้า</label>
            <input class="inp" id="jf-decl" value="${esc(job.customs_declaration_no || '')}"></div>
          <div class="fld"><label>Invoice ต้นทาง (Source)</label>
            <input class="inp" id="jf-srcinv" value="${esc(job.source_invoice_no || '')}"></div>
          <div class="fld"><label>House B/L No.</label>
            <input class="inp" id="jf-hbl" value="${esc(job.house_bl_no || '')}"></div>
          <div class="fld"><label>Master B/L No.</label>
            <input class="inp" id="jf-mbl" value="${esc(job.master_bl_no || '')}"></div>
        </div>
        <div class="jm-grid jm-grid-5">
          <div class="fld"><label>Booking No.</label>
            <input class="inp" id="jf-book" value="${esc(job.booking_no || '')}"></div>
          <div class="fld"><label>ชื่อเรือ / Vessel</label>
            <input class="inp" id="jf-vessel" value="${esc(job.vessel_name || '')}"></div>
          <div class="fld"><label>จำนวนตู้</label>
            <input class="inp" type="number" min="0" id="jf-qtyc" value="${job.qty_container ?? ''}"></div>
          <div class="fld"><label>ETD</label>
            <input class="inp" type="date" id="jf-etd" value="${job.etd || ''}"></div>
          <div class="fld"><label>ETA / วันส่งมอบ</label>
            <input class="inp" type="date" id="jf-eta" value="${job.eta || ''}"></div>
        </div>
      </div>

      ${isAcc ? `<div class="jm-sec jm-acc">
        <div class="jm-sec-t">ACCOUNTING</div>
        <div class="jm-grid">
          <div class="fld"><label>Case</label>
            <input class="inp" id="jf-case" value="${esc(job.case_no || '')}"></div>
          <div class="fld"><label>Contact</label>
            <input class="inp" id="jf-contact" value="${esc(job.contact || '')}"></div>
          <div class="fld"><label>Credit Term (วัน)</label>
            <input class="inp" type="number" min="0" id="jf-term" value="${job.credit_term_days ?? ''}"
              placeholder="เว้นว่าง = ใช้ค่าของลูกค้า"></div>
          <div class="fld"><label>Due Date</label>
            <input class="inp" type="date" id="jf-due" value="${job.due_date || ''}"></div>
        </div>
        <div class="jm-hint" id="jf-due-pv">ระบุวันที่ + ลูกค้า/เทอม เพื่อคำนวณ Due Date</div>
      </div>` : `
        <input type="hidden" id="jf-case" value="${esc(job.case_no || '')}">
        <input type="hidden" id="jf-contact" value="${esc(job.contact || '')}">
        <input type="hidden" id="jf-term" value="${job.credit_term_days ?? ''}">
        <input type="hidden" id="jf-due" value="${job.due_date || ''}">
        <div id="jf-due-pv" hidden></div>`}

      <div class="jm-sec">
        <div class="jm-sec-t">ข้อมูลเพิ่มเติม</div>
        <div class="jm-grid">
          <div class="fld"><label>วันส่งมอบ</label>
            <input class="inp" type="date" id="jf-dlv" value="${job.delivery_date || ''}"></div>
          <div class="fld"><label>CS</label>
            <input class="inp" id="jf-cs" value="${esc(job.cs_name || '')}"></div>
          <div class="fld"><label>I BILLING APL</label>
            <input class="inp" id="jf-apl" value="${esc(job.i_billing_apl || '')}"></div>
        </div>
        <div class="fld"><label>เลขตู้คอนเทนเนอร์</label>
          <div id="jf-cnts"></div>
          <button type="button" class="btn btn-o btn-sm mt-1" id="jf-addcnt">+ เพิ่มตู้</button></div>
        <div class="fld mt-2"><label>หมายเหตุ</label>
          <textarea class="inp w100" id="jf-note">${esc(job.note || '')}</textarea></div>
      </div>
      </div>
      <div class="fs-foot">
        <div class="mf-left">
          ${isAcc ? `<button class="btn btn-p" id="jf-post" disabled
            title="รอ RPC njacc_post_invoice (atomic DRAFT→POSTED) — sql/dev/011 ยังไม่ได้รัน">⇧ POST</button>
          <button class="btn btn-o" id="jf-unpost" disabled
            title="ต้อง POST ก่อนจึงจะ UNPOST ได้ — sql/dev/011 ยังไม่ได้รัน">⇩ UNPOST</button>` : ''}
        </div>
        <div class="mf-right">
          <button class="btn btn-p" id="jf-save">💾 ${isAcc ? 'บันทึก' : 'บันทึกงาน'}</button>
          ${isAcc ? `<button class="btn btn-print" id="jf-print" disabled
            title="ใช้ renderer เดียวกับ Preview — sql/dev/011 ยังไม่ได้รัน">🖨 Print Draft</button>` : ''}
          <button class="btn btn-o" id="jf-cancel">✕ ยกเลิก</button>
        </div>
      </div>
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
  ['#jf-refdate', '#jf-term', '#jf-due'].forEach(s =>
    cnt.querySelector(s).addEventListener('input', updDue));
  /* ลูกค้า = Customer Master กลาง (njacc_customers) ตัวเดียวกับ SYSTEM > ตั้งค่าลูกค้า
     แสดง CODE ในช่อง · ค้นได้ทั้ง CODE และชื่อบริษัท · เพิ่มใหม่ต้องไปทำที่หน้า Master */
  bindCombobox(cnt, 'jf-cust', {
    getItems: activeCustomers,
    display: CUST_DISPLAY,
    codeFirst: true,
    canCreate: false,
    emptyHint: 'เพิ่มลูกค้าใหม่ได้ที่ SYSTEM > ตั้งค่าลูกค้า',
    onChange: () => updDue(),
  });
  updDue();

  /* เข้าหน้าจัดการข้อมูลหลักได้จากฟอร์ม โดยไม่เพิ่มเมนูใน Sidebar */
  cnt.addEventListener('click', (e) => {
    const b = e.target.closest('[data-master]');
    if (b) location.hash = b.dataset.master === 'customers' ? '#/settings/customers' : '#/masters?tab=' + b.dataset.master;
  });

  /* กลับไปหน้าที่เปิดฟอร์มมาจริง (DOCUMENT หรือ ACCOUNTING) — ถ้าไม่ระบุ mode ใช้ route เดิม */
  const back = () => location.hash = params.mode
    ? '#/' + params.mode + '/' + String(charge).toLowerCase()
    : '#/charges/' + charge + '/' + group;
  cnt.querySelector('#jf-back').onclick = back;
  cnt.querySelector('#jf-cancel').onclick = back;

  cnt.querySelector('#jf-save').onclick = async (e) => {
    clearInvalid(cnt);
    const refdate = cnt.querySelector('#jf-refdate');
    const cust = cnt.querySelector('#jf-cust');
    let bad = false;
    if (!required(refdate.value) || !isDate(refdate.value)) { markInvalid(refdate, 'ระบุวันที่'); bad = true; }
    if (!required(comboValue(cust))) {
      markInvalid(cust, comboText(cust) ? 'ยังไม่ได้เลือกลูกค้าจากรายการ' : 'เลือกลูกค้า');
      bad = true;
    }
    if (bad) { toast('กรอกข้อมูลที่จำเป็นให้ครบ', 'err'); return; }
    const pv = cnt.querySelector('#jf-due-pv');
    const payload = {
      id: editId, charge_type: charge, company_group: group,
      data_type: cnt.querySelector('#jf-dtype').value || null,
      reference_no: cnt.querySelector('#jf-ref').value.trim() || null,
      reference_date: refdate.value,
      company_invoice_id: cnt.querySelector('#jf-comp').value || null,
      customer_id: comboValue(cust),
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


/* ─────────────────────────────────────────────────────────────
   Modal "เปิดงานใหม่" — ใช้ร่วมกันทั้ง 4 หน้า
   (DOCUMENT Service/Advance และ ACCOUNTING Service/Advance)
   ─ Field mapping / validator / Due Date / saveJob(njacc_save_job) = ของเดิมทั้งหมด
   ─ เลขที่งานออกจาก DB (njacc_next_doc_no · atomic) → ฟอร์มไม่ส่งเลขใด ๆ ขึ้นไป
   ─ ประเภทงาน (Service/Advance) ล็อกตามหน้าที่เข้ามา (charge จาก route)
   ───────────────────────────────────────────────────────────── */
export async function openNewJobModal({ charge, group, mode, jobId, onSaved }) {
  await masters();
  /* ── โหมดแก้ไข: โหลด Job เดิมมาเติมในฟอร์ม "ชุดเดียวกับตอนเปิดงาน" ──
     ไม่มีฟอร์มคนละชุดอีกต่อไป · บันทึกทับ Record เดิมด้วย id เดิม */
  let job = null;
  if (jobId) {
    job = await jobDetail(jobId);
    if (job.invoice_id) {
      toast('งานนี้ออก INVOICE แล้ว — แก้ไขข้อมูลงานไม่ได้ ต้อง Void INVOICE ก่อน', 'err');
      return;
    }
    charge = job.charge_type; group = job.company_group;
  }
  let isEdit = !!jobId;   /* let: บันทึกงานใหม่สำเร็จแล้วกลายเป็นโหมดแก้ไขทันที */
  /* ACCOUNTING section แสดงเฉพาะเมื่อเปิดจากหน้า ACCOUNTING เท่านั้น
     (DOCUMENT ไม่แสดง และไม่ส่ง field ฝั่งบัญชีขึ้นไปเลย — ไม่ใช่แค่ซ่อนด้วย CSS) */
  const isAcc = mode === 'accounting';
  /* ก่อนออกเลขจริง — ห้ามแสดงเลขปลอม/Draft ID/UUID
     เลขงานจริงออกจาก Backend (njacc_save_job -> njacc_next_doc_no) เท่านั้น
     รูปแบบจริงของระบบคือ J{S|A}{GG}{YY}-#### เช่น JSNJ26-0001 / JANJ26-0001
     *** ไม่แปลงรูปแบบ ไม่สร้างเลขเองที่ Frontend *** */
  const AUTO = 'ยังไม่ได้ออกเลข';
  const q = (sel) => b.querySelector(sel);
  /* วันที่อ้างอิง: เปิดงานใหม่ = วันนี้ · แก้ไข = คงวันที่เดิมของงาน (ไม่รีเซ็ต) */
  const REF_DATE = (job && job.reference_date) || ymd(new Date());
  /* ── วันที่งาน (njacc_jobs.job_date) ────────────────────────────────────
     *** ใช้คอลัมน์เดิมที่มีอยู่แล้ว ไม่สร้าง field ใหม่ ***
       sql/001_njacc_schema.sql:111   job_date date  -- "วันที่ JOB · ผู้ใช้แก้ได้"
       sql/008_njacc_features_v11.sql njacc_save_job รับ p->>'job_date' ทั้ง INSERT/UPDATE
       njacc_job_detail ใช้ to_jsonb(j) -> คืน job_date มาอยู่แล้ว
     เปิดงานใหม่ = วันที่ปัจจุบันของเครื่องผู้ใช้
     แก้ไขงานเดิม = ค่าที่บันทึกไว้ · ถ้าเป็นงานเก่าที่ยังไม่มี job_date ให้ใช้
     reference_date (วันที่ของ Record นั้น) แทน — ไม่ใช่วันนี้ จึงไม่เกิดการ Reset
     *** ห้ามผูกกับ created_at *** (created_at = เวลาที่ระบบสร้าง Record แก้ไม่ได้) */
  const JOB_DATE = isEdit
    ? ((job && (job.job_date || job.reference_date)) || '')
    : ymd(new Date());

  const b = document.createElement('div');
  b.innerHTML = `
    <div class="jm-auto">
      <span class="jm-auto-lb">${charge === 'ADVANCE' ? 'AD:' : 'JOB NJ:'}</span>
      <input class="inp" id="nj-autono" value="${(job && job.job_no) ? esc(job.job_no) : AUTO}" readonly disabled>
      <span class="jm-auto-lb">วันที่งาน</span>
      <input class="inp jm-auto-date" type="date" id="nj-jobdate" value="${JOB_DATE}">
    </div>

    <div class="jm-sec jm-doc">
      <div class="jm-sec-t">DOCUMENT</div>
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>บริษัท Invoice</label>
          <div class="fld-inline">
            ${comboboxHTML('nj-comp', activeCompanies(), (job && job.company_invoice_id) || '', 'พิมพ์เพื่อค้นหา หรือเลือกจากรายการ')}
            ${isAdmin() ? '<button type="button" class="jm-link" data-master="companies">+ จัดการ</button>' : ''}
          </div></div>
        <div class="fld"><label>ลูกค้า <span class="req">*</span></label>
          <div class="fld-inline">
            ${comboboxHTML('nj-cust', activeCustomers(), (job && job.customer_id) || '', 'พิมพ์ชื่อบริษัท หรือ CODE เพื่อค้นหา', CUST_DISPLAY)}
            ${isAdmin() ? '<button type="button" class="jm-link" data-master="customers">+ จัดการ</button>' : ''}
          </div></div>
        <div class="fld"><label>Customer Job No.</label>
          <input class="inp" id="nj-cjob" placeholder="กรอก Customer Job No." value="${job ? esc(job.customer_job_no || "") : ""}"></div>
        <div class="fld"><label>เลขใบขนสินค้า</label>
          <input class="inp" id="nj-decl" placeholder="กรอกเลขใบขนสินค้า" value="${job ? esc(job.customs_declaration_no || "") : ""}"></div>
        <div class="fld"><label>Invoice ต้นทาง (Source)</label>
          <input class="inp" id="nj-srcinv" placeholder="กรอก Invoice ต้นทาง" value="${job ? esc(job.source_invoice_no || "") : ""}"></div>
      </div>
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>House B/L No.</label>
          <input class="inp" id="nj-hbl" placeholder="กรอก House B/L No." value="${job ? esc(job.house_bl_no || "") : ""}"></div>
        <div class="fld"><label>Master B/L No.</label>
          <input class="inp" id="nj-mbl" placeholder="กรอก Master B/L No." value="${job ? esc(job.master_bl_no || "") : ""}"></div>
        <div class="fld"><label>Booking No.</label>
          <input class="inp" id="nj-book" placeholder="กรอก Booking No." value="${job ? esc(job.booking_no || "") : ""}"></div>
        <div class="fld"><label>ชื่อเรือ / Vessel</label>
          <input class="inp" id="nj-vessel" placeholder="กรอกชื่อเรือ / Vessel" value="${job ? esc(job.vessel_name || "") : ""}"></div>
        <div class="fld"><label>จำนวนตู้</label>
          <input class="inp" type="number" min="0" id="nj-qtyc" placeholder="กรอกจำนวนตู้" value="${job && job.qty_container != null ? job.qty_container : ''}"></div>
      </div>
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>ETD</label><input class="inp" type="date" id="nj-etd" value="${(job && job.etd) || ''}"></div>
        <div class="fld"><label>ETA</label><input class="inp" type="date" id="nj-eta" value="${(job && job.eta) || ''}"></div>
        <div class="fld"><label>วันส่งมอบ</label><input class="inp" type="date" id="nj-dlv" value="${(job && job.delivery_date) || ''}"></div>
        <div class="fld"><label>หมายเหตุ</label>
          <textarea class="inp" id="nj-note" placeholder="กรอกหมายเหตุ">${job ? esc(job.note || "") : ""}</textarea></div>
      </div>
    </div>

    ${isAcc ? `<div class="jm-sec jm-acc">
      <div class="jm-sec-t">ACCOUNTING</div>
      <div class="jm-grid">
        <div class="fld"><label>Case</label>
          <input class="inp" id="nj-case" placeholder="กรอก Case" value="${job ? esc(job.case_no || "") : ""}"></div>
        <div class="fld"><label>Contact</label>
          <input class="inp" id="nj-contact" placeholder="กรอก Contact" value="${job ? esc(job.contact || "") : ""}"></div>
        <div class="fld"><label>Credit Term (วัน)</label>
          <input class="inp" type="number" min="0" id="nj-term" placeholder="เว้นว่าง = ใช้ค่าของลูกค้า" value="${job && job.credit_term_days != null ? job.credit_term_days : ''}"></div>
        <div class="fld"><label>Due Date</label>
          <input class="inp" type="date" id="nj-due" value="${(job && job.due_date) || ''}"></div>
      </div>
      <div class="jm-hint" id="nj-due-pv">ระบุวันที่ + ลูกค้า/เทอม เพื่อคำนวณ Due Date</div>
    </div>` : ''}`;

  const f = document.createElement('div');
  /* Footer — โครงเดียวกับ Modal "ออกวางบิล" (mf-left / mf-right)
     หน้าเปิดงานใหม่ไม่มี POST/PRINT ตามที่กำหนด → ฝั่งซ้ายว่างไว้
     ยกเลิก = Secondary · บันทึกงาน = Primary Blue */
  f.innerHTML = `<div class="mf-left"></div>
    <div class="mf-right">
      <button class="btn btn-p" id="nj-save">💾 บันทึกงาน</button>
      <button class="btn btn-o" data-close>✕ ยกเลิก</button>
    </div>`;
  /* modal-flow = Layout "กรอบเดียว" + ฟอร์มไหลต่อเนื่อง (Scroll Owner ตัวเดียว)
     ปุ่มบันทึก/ยกเลิกเป็นส่วนท้ายของฟอร์มจริง ไม่ใช่ Footer ตรึง

     ใช้กับทุกโหมดของฟอร์มงาน (Layout Rule ชุดเดียวกันทั้ง 4 หน้า):
       DOCUMENT   > SERVICE / ADVANCE
       ACCOUNTING > SERVICE / ADVANCE
     ─ เดิมส่ง cls เฉพาะ mode==='document' -> ACCOUNTING ยังได้กรอบซ้อน + scroll ซ้อน
     ─ mode เป็น Layout Gate เท่านั้น · ไม่ได้เปลี่ยนเงื่อนไข Visibility/Payload ใด ๆ
       (Section ACCOUNTING ยังผูกกับ isAcc เหมือนเดิมทุกประการ)
     Modal อื่นที่ใช้ fullscreen+wide (INVOICE · RECEIPT · CREDIT NOTE ·
     ADVANCE · 50 ทวิ · Preview) ไม่ส่ง cls จึงไม่กระทบเลย */
  openModal({ title: isEdit ? 'แก้ไขงาน' : 'เปิดงานใหม่', body: b, footer: f,
    fullscreen: true, wide: true, cls: 'modal-flow' });
  /* Enter = ไปช่องถัดไป (helper กลางใน components/modal.js) — ไม่แตะปุ่มบันทึก/Validation */
  enableEnterNav(b);

  /* ── Combobox: พิมพ์ค้นหา + เลือกจากรายการ ในช่องเดียว ──
     ค่าที่บันทึกจริงคือ UUID (njacc_jobs.company_invoice_id / customer_id เป็น uuid + FK)
     การเพิ่มรายการใหม่ใช้ RPC เดิม njacc_upsert_company / njacc_upsert_customer
     ซึ่ง DB บังคับ role SUPER_ADMIN/ADMIN อยู่แล้ว → ผูก canCreate กับ isAdmin() ให้ตรงกัน
     (ไม่สร้างตาราง/master ใหม่ และไม่แตะ business logic อื่น) */
  const refreshMasters = () => masters(true);
  bindCombobox(b, 'nj-comp', {
    getItems: activeCompanies,
    canCreate: isAdmin(),
    onCreate: async (name) => {
      try {
        const id = await upsertCompany({ company_name: name });
        await refreshMasters();
        toast('เพิ่มบริษัท Invoice “' + name + '” แล้ว', 'ok');
        return id;
      } catch (ex) { handleErr(ex); return null; }
    },
  });
  /* ลูกค้า = อ่านจาก Customer Master กลางอย่างเดียว · ห้ามพิมพ์สร้างใหม่ในหน้าเปิดงาน
     (กัน Customer Master ซ้ำ) → ไปเพิ่มที่ SYSTEM > ตั้งค่าลูกค้า ซึ่งเป็นตารางเดียวกัน */
  bindCombobox(b, 'nj-cust', {
    getItems: activeCustomers,
    display: CUST_DISPLAY,
    codeFirst: true,
    canCreate: false,
    emptyHint: 'เพิ่มลูกค้าใหม่ได้ที่ SYSTEM > ตั้งค่าลูกค้า',
    onChange: () => updDue(),
  });

  /* Due Date — ใช้สูตรเดิมของฟอร์มเต็มทุกประการ */
  const custTermM = () => {
    const c = (AppState.masters.customers || []).find(x => x.id === comboValue(q('#nj-cust')));
    return c ? c.credit_term_days : null;
  };
  function updDue() {
    const pv = q('#nj-due-pv');
    if (!pv) return;                       /* DOCUMENT ไม่มี section นี้ */
    const manual = q('#nj-due').value;
    if (manual) { pv.textContent = 'Due Date: ' + dmy(manual) + ' (กำหนดเอง)'; delete pv.dataset.calc; return; }
    const base = REF_DATE;
    const term = q('#nj-term').value !== '' ? Number(q('#nj-term').value) : custTermM();
    if (base && term != null) {
      const d = new Date(base + 'T00:00:00'); d.setDate(d.getDate() + Number(term));
      pv.textContent = 'Due Date (คำนวณ): ' + dmy(ymd(d)) + ' · เทอม ' + term + ' วัน';
      pv.dataset.calc = ymd(d);
    } else { pv.textContent = 'ระบุวันที่ + ลูกค้า/เทอม เพื่อคำนวณ Due Date'; delete pv.dataset.calc; }
  }
  ['#nj-term', '#nj-due'].forEach(sel => {
    const el = q(sel); if (el) el.addEventListener('input', updDue);
  });
  updDue();

  b.addEventListener('click', (e) => {
    const m = e.target.closest('[data-master]');
    if (m) { closeModal(); location.hash = m.dataset.master === 'customers' ? '#/settings/customers' : '#/masters?tab=' + m.dataset.master; }
  });

  f.querySelector('#nj-save').onclick = async (e) => {
    clearInvalid(b);
    let bad = false;
    /* ต้องเป็นลูกค้าที่มีอยู่จริง — customer_id เป็น uuid + FK njacc_customers(id)
       พิมพ์ชื่อใหม่แล้วยังไม่กด "＋ เพิ่ม" → ยังไม่มี id → บันทึกไม่ได้ (DB จะ reject อยู่ดี) */
    const custEl = q('#nj-cust');
    if (!required(comboValue(custEl))) {
      markInvalid(custEl, comboText(custEl) ? 'ยังไม่ได้เลือกลูกค้าจากรายการ' : 'เลือกลูกค้า');
      bad = true;
    }
    if (bad) { toast('กรอกข้อมูลให้ครบก่อนบันทึก', 'err'); return; }

    const pv = q('#nj-due-pv');
    const acc = isAcc ? {
      case_no: q('#nj-case').value.trim() || null,
      contact: q('#nj-contact').value.trim() || null,
      credit_term_days: q('#nj-term').value !== '' ? Number(q('#nj-term').value) : custTermM(),
      due_date: q('#nj-due').value || pv.dataset.calc || null,
    } : {};
    const payload = {
      /* โหมดแก้ไข: ส่ง id เดิม → njacc_save_job อัปเดตทับ Record เดิม ไม่สร้างงานใหม่ */
      ...(isEdit ? { id: jobId } : {}),
      charge_type: charge, company_group: group,          /* ล็อกตามหน้าที่เข้ามา */
      /* ── ฟิลด์ที่ถอดออกจาก UI แต่ backend ยังใช้ (ไม่ลบคอลัมน์ใน DB) ──
         reference_date : ใช้เป็น "วันที่" ของรายการและฐานคำนวณ Due Date → ตั้งเป็นวันที่ปัจจุบัน
         data_type      : ไม่มีช่องให้เลือกแล้ว → ส่ง null (คอลัมน์ยังอยู่ · แก้ภายหลังได้จากฟอร์มเต็ม)
         reference_no   : ไม่มีช่องให้กรอกแล้ว → ส่ง null */
      /* ── ฟิลด์ที่ไม่มีช่องใน UI ──
         เปิดงานใหม่ = null · แก้ไข = คงค่าเดิมของงานไว้ (ไม่ล้างข้อมูลที่มีอยู่) */
      data_type: (job && job.data_type) || null,
      reference_date: REF_DATE,
      reference_no: (job && job.reference_no) || null,
      /* วันที่งาน — คอลัมน์เดิม njacc_jobs.job_date (ไม่ใช่ created_at) */
      job_date: q('#nj-jobdate').value || null,
      company_invoice_id: comboValue(q('#nj-comp')) || null,
      customer_id: comboValue(q('#nj-cust')),
      customer_job_no: q('#nj-cjob').value.trim() || null,
      customs_declaration_no: q('#nj-decl').value.trim() || null,
      source_invoice_no: q('#nj-srcinv').value.trim() || null,
      house_bl_no: q('#nj-hbl').value.trim() || null,
      master_bl_no: q('#nj-mbl').value.trim() || null,
      booking_no: q('#nj-book').value.trim() || null,
      vessel_name: q('#nj-vessel').value.trim() || null,
      qty_container: q('#nj-qtyc').value !== '' ? Number(q('#nj-qtyc').value) : null,
      etd: q('#nj-etd').value || null,
      eta: q('#nj-eta').value || null,
      delivery_date: q('#nj-dlv').value || null,
      /* หมายเหตุ — คอลัมน์เดิม njacc_jobs.note (type text · ไม่จำกัดความยาว)
         เดิม Modal ไม่มีช่องนี้จึงไม่ส่งขึ้นไป ตอนนี้ส่งค่าจริงของฟอร์ม
         ไม่ตัดข้อความ (trim = ตัดช่องว่างหัว-ท้ายเท่านั้น เหมือน field อื่นทุกช่อง) */
      note: q('#nj-note').value.trim() || null,
      ...acc,
    };
    btnBusy(e.target, true);
    try {
      const res = await once((isEdit ? 'edit-job-' + jobId : 'save-job'), () => saveJob(payload));
      /* ── อัปเดตเลขงานบน Modal ทันที ไม่ต้องปิดแล้วเปิดใหม่ ──
         ใช้เลขที่ Backend คืนมาเท่านั้น (res.job_no) ไม่คำนวณเองที่ Frontend
         ถ้า RPC ไม่คืนเลข (เช่นโหมดแก้ไข) ให้คงค่าที่แสดงอยู่เดิม ไม่ล้างเป็นว่าง */
      const noEl = q('#nj-autono');
      if (noEl && res && res.job_no) noEl.value = res.job_no;
      /* งานใหม่ที่บันทึกแล้ว = มี id จริงแล้ว -> กดบันทึกซ้ำต้องอัปเดต Record เดิม
         ไม่ใช่เปิดงานใหม่ซ้ำอีกใบ (ใช้ id ที่ Backend คืนมา) */
      if (!isEdit && res && res.id) { isEdit = true; jobId = res.id; }
      toast(isEdit
        ? 'บันทึกการแก้ไขแล้ว' + (res && res.job_no ? ' — ' + res.job_no : '')
        : 'เปิดงานใหม่แล้ว' + (res && res.job_no ? ' — ' + res.job_no : ''), 'ok');
      btnBusy(e.target, false);
      if (typeof onSaved === 'function') onSaved();   /* รีเฟรชรายการเบื้องหลัง · Modal ยังเปิดอยู่ */
    } catch (ex) { handleErr(ex); btnBusy(e.target, false); }
  };
}
