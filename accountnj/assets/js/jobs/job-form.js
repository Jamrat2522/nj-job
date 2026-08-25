/* ฟอร์มเปิดงานใหม่ / แก้ไขงาน (ยังไม่มีการเงิน — เกิดตอนออก INVOICE) */
import { saveJob, jobDetail, saveJobDocFields, postJob } from './job-api.js';
/* ══ V.226 · Idempotency Key ของการ "เปิดงานใหม่" ═══════════════════════════
   1 Intent = 1 request_id = 1 Job = 1 Running Number
   *** สร้างครั้งเดียวต่อการเปิดฟอร์ม 1 รอบ *** และ *** ไม่สร้างใหม่ตอน Retry ***
   -> Timeout / กดซ้ำ / Browser Retry ยังส่ง request_id เดิม
      Backend (RUN-28) จึงคืนงานเดิม + เลขเดิม ไม่สร้างงานใหม่
   ล้างเมื่อ "สร้างงานสำเร็จ" หรือ "เปิดฟอร์มเปล่ารอบใหม่" เท่านั้น
   *** โหมดแก้ไขงานเดิมไม่ใช้ค่านี้ *** (มี id แล้ว Backend ไม่แตะ Counter) */
let CREATE_REQ_ID = null;
const createReqId = () => (CREATE_REQ_ID ||= newRequestId());
const resetCreateReqId = () => { CREATE_REQ_ID = null; };
import { masters, companyOpts, activeCustomers, activeCompanies } from '../master/master-cache.js';
import { comboboxHTML, bindCombobox, comboValue, comboText } from '../components/combobox.js';
import { upsertCustomer, upsertCompany } from '../master/master-api.js';
import { AppState } from '../core/state.js';
import { isAdmin } from '../core/permissions.js';
import { required, isDate, markInvalid, clearInvalid } from '../core/validator.js';
import { ymd, dmy, esc } from '../core/formatter.js';
import { toast } from '../components/toast.js';
import { openModal, closeModal, enableEnterNav, confirmModal } from '../components/modal.js';
import { btnBusy } from '../components/loading.js';
import { handleErr } from '../core/error-handler.js';
import { once, newRequestId } from '../core/request-manager.js';
import { groupLabel, chargeLabel } from '../config/charge-groups.js';

/* ── ปุ่มจัดการ Master ในฟอร์มงาน ──────────────────────────────────────────
   DOCUMENT   : ไม่แสดงปุ่มจัดการข้างช่อง "บริษัท" / "ลูกค้า" (ถอดออกตามข้อกำหนด)
   ACCOUNTING : ยังแสดงเหมือนเดิมทุกประการ
   *** ลบเฉพาะ Element ที่ render ในหน้า DOCUMENT ***
   ไม่ได้ลบ Function / Modal / Route / RPC / Master Data ใด ๆ:
     handler [data-master] ยังอยู่ครบทั้งสองที่ (ACCOUNTING ใช้อยู่)
     SYSTEM > ตั้งค่า (#/settings/customers) และ #/masters ยังเข้าถึงได้ตามเดิม
     njacc_upsert_customer / njacc_upsert_company ไม่ถูกแตะ */

/* ช่อง "ลูกค้า" แสดง "ชื่อบริษัท" (ตามที่ผู้ใช้กำหนด — อ่านง่ายกว่า CODE)
   ค้นหายังใช้ได้ทั้ง CODE และชื่อ · รายการเลือกยังโชว์ CODE นำหน้าเพื่อให้เห็นรหัสด้วย
   ค่าที่บันทึกจริงยังเป็น njacc_customers.id (uuid) เหมือนเดิม — ไม่เปลี่ยน relationship
   ถ้าลูกค้าไม่มีชื่อ (เป็นไปไม่ได้เพราะ NOT NULL) จึง fallback เป็น CODE เพื่อความปลอดภัย */
const CUST_DISPLAY = (it) => (it ? (it.name || it.code) : '');

/* ── "ประเภท" ของงาน (DOCUMENT เท่านั้น) ───────────────────────────────────
   เก็บที่คอลัมน์ njacc_jobs.job_category (text)
     -> sql/RUN-NOW/RUN-04_ADD_JOB_CATEGORY.sql (ต้องรันก่อน Deploy HTML)
   *** คนละความหมายกับ data_type *** ซึ่งเป็น "โหมด" IM (SEA) / EX (AIR) / FORM ...
   ค่าที่บันทึกคือข้อความตรงตามที่แสดง (ไม่แปลงรหัส ไม่ map ค่า ไม่เก็บ Code ภายใน)
     -> คอลัมน์ "ประเภท" ในตารางรายการจึงแสดงข้อความเดียวกับที่ผู้ใช้เลือก
   ค่าว่าง = ยังไม่เลือก -> RPC เก็บเป็น NULL (nullif ใน RUN-04)
   ลำดับใน array = ลำดับที่แสดงใน Dropdown (ห้ามสลับ) */
const JOB_CATS = ['HALF (คีย์)', 'HALF (ปล่อย)', 'FULL (คีย์+ปล่อย)',
  'COUNTER (คีย์)', 'COUNTER (คีย์+ปล่อย)'];
const CAT_PH = '— เลือกประเภท —';   /* ข้อความค่าเริ่มต้น (value = '') */

/* ── "ผ่านหน่วยงาน" / "ชื่อใบอนุญาต" (DOCUMENT เท่านั้น) ────────────────────
   เก็บที่คอลัมน์ใหม่ของ njacc_jobs (RUN-06_ADD_AGENCY_PERMIT.sql)
     agency_via        <- Dropdown "ผ่านหน่วยงาน"
     agency_via_other  <- ช่องกรอกเอง (ใช้เมื่อเลือก "อื่น")
     permit_name       <- Dropdown "ชื่อใบอนุญาต"
     permit_name_other <- ช่องกรอกเอง (ใช้เมื่อเลือก "อื่น")
   *** SERVICE และ ADVANCE ใช้ตาราง/คอลัมน์ชุดเดียวกัน *** แยกด้วย charge_type
   ที่ server เหมือนทุกฟิลด์เดิม -> ข้อมูลไม่ปนกัน
   ค่าที่บันทึกคือข้อความตรงตามที่แสดง (ไม่แปลงรหัส)
   ลำดับใน array = ลำดับที่แสดงใน Dropdown (ห้ามสลับ) */
const OTHER = 'อื่น';   /* ค่าที่ทำให้ช่องกรอกเองโผล่ — ใช้ร่วมกันทั้ง 2 ฟิลด์ */
const JOB_AGENCIES = ['เกษตร', 'อย.', 'ประมง', 'ป่าไม้', 'ปศุสัตว์', OTHER];
const AGENCY_PH = '— เลือกหน่วยงาน —';
const JOB_PERMITS = ['พ.ก', 'สมอ', 'LPI', OTHER];
const PERMIT_PH = '— เลือกใบอนุญาต —';

/* ── Dropdown "ประเภท" แบบ Custom (radio list) ─────────────────────────────
   <select> ของเบราว์เซอร์ไม่รองรับการวาดวงกลม radio / แถบไฮไลต์สีน้ำเงินใน
   <option> (UA เป็นผู้วาดเอง) จึงต้องทำ UI ขึ้นเอง
   ── โครงสร้าง — สำคัญมาก ──
     <select id="nj-cat"> ตัวจริง *** ยังอยู่ครบใน DOM *** (ซ่อนด้วย CSS)
     เป็น Source of Truth เดิม -> Save/Load/RPC/ทดสอบ ไม่ต้องแก้แม้แต่บรรทัดเดียว
       Save : q('#nj-cat').value        (job-form.js เดิม)
       Load : ตั้ง selected ตอน render ตามค่าจาก njacc_job_detail
     UI ที่ผู้ใช้เห็นเป็นแค่ "หน้ากาก" ที่เขียนค่ากลับเข้า <select> ตัวเดิม
   งานเก่าที่บันทึกค่านอกชุดนี้ไว้ -> เติมเป็นรายการเพิ่มให้ (ไม่ Reset · ไม่ล้างค่า) */
/* ── Component กลาง: Dropdown แบบ radio list (.njsel) ─────────────────────
   ใช้ร่วมกันทั้ง "โหมด" (#nj-mode) และ "ประเภท" (#nj-cat) — style/พฤติกรรมชุดเดียว
   ── โครงสร้าง (สำคัญที่สุด) ──
     <select id="{id}"> ตัวจริง *** ยังอยู่ครบใน DOM *** (ซ่อนด้วย .njsel-native)
     เป็น Source of Truth เดิม -> Save / Load / RPC / ตาราง ไม่ต้องแก้อะไรเลย
       Save : q('#nj-mode').value · q('#nj-cat').value   (payload เดิม)
       Load : ตั้ง selected ตอน render จาก njacc_job_detail
     UI ที่ผู้ใช้เห็นเป็น "หน้ากาก" ที่เขียนค่ากลับเข้า <select> ตัวเดิมเมื่อคลิก
   ── รองรับข้อมูลเก่า ──
     ค่าของงานที่ไม่อยู่ใน base list -> เติมเป็นรายการเพิ่มท้ายลิสต์
     ติดป้าย "(ค่าเดิมของงาน)" ให้เห็นชัด -> เปิดงานเก่าได้ · ไม่ Reset · ไม่ล้างค่า
     *** ไม่แปลงค่าอัตโนมัติ *** (เช่น IMPORT ไม่มีข้อมูลว่าเป็น SEA/AIR/TRUCK)
   base = ชุดค่าปัจจุบัน · cur = ค่าที่บันทึกไว้ · cls = class ความกว้างในแถวหัวฟอร์ม */
const njLabelOf = (v, ph, base) =>
  (v || ph) + (v && !base.includes(v) ? ' (ค่าเดิมของงาน)' : '');
function njSelectHTML(id, ph, base, cur, cls) {
  const list = base.slice();
  if (cur && !list.includes(cur)) list.push(cur);
  const lb = (v) => njLabelOf(v, ph, base);
  const items = [''].concat(list).map(v => `
        <button type="button" class="njsel-item${v === cur ? ' on' : ''}" role="option"
          aria-selected="${v === cur}" data-v="${esc(v)}">
          <span class="njsel-rd" aria-hidden="true"></span>
          <span class="njsel-lb">${esc(lb(v))}</span></button>`).join('');
  return `<div class="njsel ${cls}" id="${id}-wrap">
      <button type="button" class="njsel-btn" id="${id}-btn"
        aria-haspopup="listbox" aria-expanded="false">
        <span class="njsel-txt">${esc(lb(cur))}</span>
        <span class="njsel-car" aria-hidden="true"></span>
      </button>
      <div class="njsel-list" id="${id}-list" role="listbox" hidden>${items}
      </div>
      <select class="sel njsel-native" id="${id}" tabindex="-1" aria-hidden="true">
        <option value="">${esc(ph)}</option>
        ${list.map(v => `<option value="${esc(v)}"${cur === v ? ' selected' : ''}>${esc(lb(v))}</option>`).join('')}
      </select>
    </div>`;
}
/* ── คู่ "Dropdown + ช่องกรอกเอง" สำหรับฟิลด์ที่มีตัวเลือก "อื่น" ────────────
   ใช้ njSelectHTML() component กลางตัวเดิม -> height / font / border / radius /
   spacing เหมือน "โหมด" และ "ประเภท" ทุกประการ (ไม่สร้าง style ชุดใหม่)
   ช่องกรอกเองใช้ .inp กลางตัวเดียวกับฟิลด์อื่นในฟอร์ม
   ซ่อน/แสดงด้วย attribute hidden (ไม่ใช่ display:none ใน JS) -> CSS กลางคุมได้
   เริ่มต้น: แสดงช่องกรอกเมื่อค่าที่บันทึกไว้ = "อื่น" เท่านั้น */
const njSelectOtherHTML = (id, ph, base, cur, cls, other, otherPh) =>
  njSelectHTML(id, ph, base, cur, cls)
  + `<input class="inp njsel-other" id="${id}-other" placeholder="${esc(otherPh)}"
       value="${esc(other || '')}"${cur === OTHER ? '' : ' hidden'}>`;

/* ผูกช่องกรอกเองเข้ากับ Dropdown — โผล่เมื่อเลือก "อื่น" · ซ่อนเมื่อเลือกค่าอื่น
   *** ไม่ล้างค่าที่พิมพ์ไว้ตอนซ่อน *** (ผู้ใช้สลับกลับมาแล้วยังเห็นของเดิม)
   ค่าที่ "ส่งขึ้น Backend" ถูกตัดสินตอน Save ไม่ใช่ตอนซ่อน:
     เลือก "อื่น"     -> ส่งข้อความที่กรอก
     ไม่ได้เลือก "อื่น" -> ส่ง null (ไม่ให้ค่าค้างเก่าไปปนกับตัวเลือกปกติ)
   #{id} เป็น <select> ตัวจริงที่ njSelectHTML สร้าง -> ฟัง 'change' ได้ตามปกติ */
function bindOtherInput(root, id) {
  const sel = root.querySelector('#' + id);
  const box = root.querySelector('#' + id + '-other');
  if (!sel || !box) return;
  const sync = () => { box.hidden = (sel.value !== OTHER); };
  sel.addEventListener('change', sync);
  sync();
}

/* ผูกพฤติกรรม — เรียกหลัง render ฟอร์ม · เลือกได้ครั้งละ 1 ค่า
   (คลิกแล้วปิดรายการทันที · ไม่มี multi-select) · ไม่มี wrap = return ทันที */
function bindNjSelect(root, id) {
  const wrap = root.querySelector('#' + id + '-wrap');
  if (!wrap) return;
  const btn  = wrap.querySelector('#' + id + '-btn');
  const list = wrap.querySelector('#' + id + '-list');
  const txt  = wrap.querySelector('.njsel-txt');
  const nat  = wrap.querySelector('#' + id);
  const close = () => { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = list.hidden;
    list.hidden = !willOpen;
    btn.setAttribute('aria-expanded', String(willOpen));
  });
  list.addEventListener('click', (e) => {
    const it = e.target.closest('.njsel-item');
    if (!it) return;
    nat.value = it.dataset.v || '';       /* *** เขียนกลับ <select> ตัวเดิม *** */
    txt.textContent = it.querySelector('.njsel-lb').textContent;
    list.querySelectorAll('.njsel-item').forEach(x => {
      const on = (x === it);
      x.classList.toggle('on', on);
      x.setAttribute('aria-selected', String(on));
    });
    close();
  });
  /* คลิกนอกกรอบ = ปิดรายการ (รูปแบบเดียวกับ components/combobox.js เดิม)
     guard ด้วย document.body.contains กัน listener ของ Modal เก่าที่ถูกปิดไปแล้ว */
  document.addEventListener('mousedown', (e) => {
    if (!document.body.contains(wrap)) return;
    if (!wrap.contains(e.target)) close();
  });
}

/* ── "โหมด" ของงาน — คอลัมน์เดิม njacc_jobs.data_type (text) ────────────────
   ชุดค่าใหม่ 7 ค่า · ลำดับใน array = ลำดับที่แสดงใน Dropdown (ห้ามสลับ)
   *** ไม่สร้างคอลัมน์ใหม่ *** data_type เป็น text อยู่แล้วและรับค่าใหม่ได้
   ต้องรัน sql/RUN-NOW/RUN-05_JOB_MODE_NEW_VALUES.sql ก่อน Deploy
     - CHECK constraint njacc_jobs_dtype_ck เดิมรับแค่ IMPORT/EXPORT/FORM
     - KPI Total Import/Export เดิมเทียบ data_type = 'IMPORT' ตรง ๆ
   การจัดกลุ่ม Import/Export ที่ Backend ใช้ prefix: LIKE 'IM%' / LIKE 'EX%'
     -> ครอบคลุมทั้งค่าใหม่ (IM (SEA)) และค่าเก่า (IMPORT · IMPORT SEA)
     -> FORM ไม่ขึ้นต้นด้วย IM/EX จึงไม่ถูกนับทั้งสองกลุ่มเหมือนเดิม */
const JOB_MODES = ['IM (SEA)', 'IM (AIR)', 'IM (TRUCK)',
  'EX (SEA)', 'EX (AIR)', 'EX (TRUCK)', 'FORM'];
const MODE_PH = '— เลือกโหมด —';   /* ข้อความค่าเริ่มต้น (value = '') */

/* งานเก่าที่บันทึกค่านอกชุดใหม่ไว้ (IMPORT / EXPORT / IMPORT SEA / ...)
   ต้องเปิดได้และค่าต้องไม่หาย -> เติม <option> ของค่าเดิมเข้าไปให้เลือกค้างไว้
   ผู้ใช้เปลี่ยนเป็นค่าใหม่ได้เอง แต่ถ้าไม่เปลี่ยนแล้วกดบันทึก ค่าเดิมก็ยังอยู่ครบ
   *** ไม่แปลงค่าอัตโนมัติ *** เพราะ IMPORT ไม่มีข้อมูลว่าเป็น SEA/AIR/TRUCK */
const modeOpts = (cur) => {
  const list = JOB_MODES.slice();
  if (cur && !list.includes(cur)) list.push(cur);
  return list.map(m =>
    `<option value="${esc(m)}"${cur === m ? ' selected' : ''}>${esc(m)}${
      JOB_MODES.includes(m) ? '' : ' (ค่าเดิมของงาน)'}</option>`).join('');
};

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
            ${/* ── V.230 ── ใช้ข้อความมาตรฐานตัวเดียวกับ Modal
                 readonly + disabled -> แก้ไม่ได้ · ไม่ถูกส่งขึ้น payload */ ''}
            <input class="inp" value="${esc((job && job.job_no) || JOB_NO_PLACEHOLDER)}" readonly disabled></div>
          <div class="fld"><label>บริษัท Invoice</label>
            <select class="sel" id="jf-comp">${companyOpts(job.company_invoice_id)}</select>
            ${isAcc && isAdmin() ? '<button type="button" class="jm-link" data-master="companies">+ จัดการ</button>' : ''}</div>
          <div class="fld"><label>ลูกค้า <span class="req">*</span></label>
            ${comboboxHTML('jf-cust', activeCustomers(), job.customer_id, 'พิมพ์ชื่อบริษัท หรือ CODE เพื่อค้นหา', CUST_DISPLAY)}
            ${isAcc && isAdmin() ? '<button type="button" class="jm-link" data-master="customers">+ จัดการ</button>' : ''}</div>
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
    /* ── V.226 ── เปิดงานใหม่เท่านั้นที่ต้องมี request_id (แก้ไขงานเดิมไม่ต้อง)
       ค่าเดิมถูกใช้ซ้ำทุกครั้งที่ Retry -> Backend ไม่สร้างงานใหม่ */
    if (!editId) payload.request_id = createReqId();
    btnBusy(e.target, true);
    try {
      await once('save-job', () => saveJob(payload));
      if (!editId) resetCreateReqId();     /* สำเร็จแล้ว -> รอบหน้าเป็นงานใหม่จริง */
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
/* ══ V.228 · COPY — Field ที่ *** ห้าม *** ติดไปกับงานใหม่ ═══════════════════
   ทุกตัวเป็น Identity / System / Status ของ Record เดิม
   ถ้าติดไปจะทำให้ Save กลายเป็น UPDATE งานเดิม หรือได้เลข/สถานะผิด
   *** ข้อมูลสำหรับกรอกงานทั้งหมดไม่อยู่ในรายการนี้ -> ถูก COPY ครบ *** */
/* ══ V.230 · ข้อความมาตรฐานของ "ช่องเลขงานที่ยังไม่ได้ออกเลข" ═══════════════
   *** ค่าเดียว ใช้ทุกจุดที่ render ช่องเลขงาน *** (Modal + หน้าเปิดงานเต็ม)
   เดิมมี 2 ข้อความไม่ตรงกัน : 'ยังไม่ได้ออกเลข' กับ
   'ระบบออกเลขให้อัตโนมัติเมื่อบันทึก' -> รวมเป็นค่าเดียวเพื่อไม่ให้สับสน
   *** ห้ามแสดงเลขปลอม / Draft ID / UUID / เลขของงานต้นฉบับ ***
   เลขงานจริงออกจาก Backend (njacc_save_job -> njacc_next_month_no) เท่านั้น */
const JOB_NO_PLACEHOLDER = 'ระบบจะออกเลขให้อัตโนมัติเมื่อกดบันทึก';

const COPY_RESET_KEYS = [
  'id', 'job_no', 'open_no',                       /* Identity + Running Number */
  'created_at', 'created_by', 'updated_at', 'updated_by', 'last_updated_at',
  'operational_status', 'job_closed_at', 'job_closed_by', 'job_close_note',
  'invoice_id', 'invoice_no', 'invoice_status', 'payment_status',
  'advance_status', 'settled_at', 'settled_by',
  'request_id',                                     /* Idempotency ของงานเดิม */
];
/* คืน object ใหม่ที่มีแต่ "ข้อมูลกรอกงาน" — ไม่แตะต้นฉบับ */
function stripForCopy(src) {
  const out = {};
  for (const k of Object.keys(src || {})) {
    if (!COPY_RESET_KEYS.includes(k)) out[k] = src[k];
  }
  return out;
}

export async function openNewJobModal({ charge, group, mode, jobId, copyFromId, draft, onSaved }) {
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
  } else if (copyFromId) {
    /* ══ V.228 · COPY — เตรียมข้อมูลอย่างเดียว ═══════════════════════════════
       *** ไม่ INSERT · ไม่ Reserve เลข · ไม่เรียก RPC ที่ออกเลข ***
       jobDetail() เป็น RPC อ่านอย่างเดียว (njacc_job_detail) ตัวเดียวกับที่
       ปุ่ม "แก้ไข" ใช้อยู่แล้ว -> ไม่มีผลข้างเคียงกับ Counter ใด ๆ
       จากนั้นถอด Identity/Status ออกด้วย stripForCopy() แล้วเปิดฟอร์มแบบ
       "เปิดงานใหม่" (isEdit = false) -> Save จะเข้า CREATE flow เสมอ */
    const src = await jobDetail(copyFromId);
    charge = src.charge_type; group = src.company_group;   /* ห้ามข้ามประเภท */
    job = stripForCopy(src);
  } else if (draft) {
    /* ── V.231 ── กลับจาก Preview ของงานที่ยังไม่บันทึก
       ใช้ค่าที่ผู้ใช้กรอกไว้ก่อนกด Preview -> *** ข้อมูลไม่หาย *** (ข้อ 6)
       ยังเป็น CREATE NEW เหมือนเดิม (ไม่มี jobId -> isEdit = false) */
    job = draft;
  }
  /* *** COPY ไม่ใช่ EDIT *** isEdit ผูกกับ jobId เท่านั้น
     -> payload ไม่มี id -> njacc_save_job เข้าเส้นทาง INSERT + ออกเลขใหม่ */
  let isEdit = !!jobId;   /* let: บันทึกงานใหม่สำเร็จแล้วกลายเป็นโหมดแก้ไขทันที */
  /* ── V.229 ── โหมดของฟอร์มมี 3 แบบ ต้องแยกให้ชัด
       NEW  : ไม่มี jobId ไม่มี copyFromId -> ค่าเริ่มต้นของงานใหม่
       EDIT : มี jobId                     -> ค่าเดิมของ Record นั้น
       COPY : มี copyFromId                -> ค่าจากต้นฉบับ แต่ยังเป็น CREATE NEW
     *** isCopy ใช้กับการ Prefill เท่านั้น *** ไม่แตะ isEdit / payload / เลขงาน
     (const ไม่ใช่ let เพราะ COPY ไม่มีทางกลายเป็น EDIT ระหว่างทาง) */
  const isCopy = !isEdit && (!!copyFromId || !!draft);
  /* ── V.232 ── สถานะจริงของงานที่เปิดอยู่ (ใช้ตัดสินปุ่ม ⬆ POST)
     let เพราะบันทึกงานใหม่สำเร็จแล้วกลายเป็น DRAFT ทันที */
  let jobStatus = (job && job.operational_status) || (isEdit ? 'OPEN' : null);
  /* ── V.226 ── เปิดฟอร์ม "เปิดงานใหม่" รอบใหม่ = คนละ Intent -> UUID ใหม่
     (เปิดฟอร์มแก้ไขงานเดิมไม่ล้าง เพราะไม่เกี่ยวกับการออกเลข) */
  if (!isEdit) resetCreateReqId();
  /* ACCOUNTING section แสดงเฉพาะเมื่อเปิดจากหน้า ACCOUNTING เท่านั้น
     (DOCUMENT ไม่แสดง และไม่ส่ง field ฝั่งบัญชีขึ้นไปเลย — ไม่ใช่แค่ซ่อนด้วย CSS) */
  const isAcc = mode === 'accounting';
  /* ก่อนออกเลขจริง — ห้ามแสดงเลขปลอม/Draft ID/UUID
     เลขงานจริงออกจาก Backend (njacc_save_job -> njacc_next_doc_no) เท่านั้น
     รูปแบบจริงของระบบคือ J{S|A}{GG}{YY}-#### เช่น JSNJ26-0001 / JANJ26-0001
     *** ไม่แปลงรูปแบบ ไม่สร้างเลขเองที่ Frontend *** */
  const AUTO = JOB_NO_PLACEHOLDER;
  /* checkbox ของฟิลด์เอกสารงาน — true เท่านั้นที่ติ๊ก (NULL = ยังไม่เคยกรอก) */
  const ck = (j, k) => (j && j[k] === true ? 'checked' : '');
  /* ── ช่วงเวลาล่วงเวลา (เฉพาะ DOCUMENT) — Dropdown เลือกได้ครั้งละ 1 ค่า ──
     *** ใช้คอลัมน์เดิมของ njacc_jobs: overtime_slot_1 / _2 / _3 (boolean) ***
     ไม่เพิ่มคอลัมน์ใหม่ · ไม่แก้ RPC njacc_save_job_doc_fields · ไม่ต้องรัน SQL เพิ่ม
       '1' = 08.30-16.30 · '2' = 16.30-24.00 · '3' = 24.00-08.00 · '' = ยังไม่เลือก
     งานเดิมที่ถูกติ๊กไว้มากกว่า 1 ช่อง (ข้อมูลจาก UI Checkbox ชุดเก่า) ->
     Dropdown แสดงช่วงแรกที่เป็น true เพื่อไม่ Reset เป็น "กรุณาเลือก"
     ค่าเดิมใน DB ไม่ถูกลบจนกว่าผู้ใช้จะกดบันทึกทับเอง */
  const OT_SLOT = !job ? ''
    : (job.overtime_slot_1 === true ? '1'
      : job.overtime_slot_2 === true ? '2'
        : job.overtime_slot_3 === true ? '3' : '');
  const otOpt = (v, lb) => `<option value="${v}"${OT_SLOT === v ? ' selected' : ''}>${lb}</option>`;
  /* ค้นหา element ในฟอร์ม — ค้นใน body ก่อน (พฤติกรรมเดิมทุกประการ)
     ถ้าไม่เจอค่อยค้นทั้ง Modal เพราะ "JOB NJ" + "วันที่งาน" ถูกย้ายไปอยู่ในแถบหัว
     (.modal-h ซึ่งอยู่นอก body) -> q('#nj-autono') / q('#nj-jobdate') ยังทำงานเหมือนเดิม
     *** ไม่เปลี่ยน selector / id / Save-Load logic ใด ๆ *** */
  const q = (sel) => b.querySelector(sel)
    || (document.getElementById('nj-modal') || document).querySelector(sel);
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
     *** ห้ามผูกกับ created_at *** (created_at = เวลาที่ระบบสร้าง Record แก้ไม่ได้)

     ── V.229 ── COPY ต้องได้ "วันที่งาน" จากต้นฉบับเหมือนช่องอื่น
     ROOT CAUSE เดิม : เงื่อนไขผูกกับ isEdit อย่างเดียว แต่ COPY ตั้ง isEdit = false
       -> ตกไปสาขา ymd(new Date()) = วันที่วันนี้ ทั้งที่ job_date ต้นฉบับมีค่าอยู่
       (job_date ไม่อยู่ใน COPY_RESET_KEYS จึงถูกส่งมาถึงตรงนี้อยู่แล้ว)
     *** แก้เฉพาะตัวตัดสินการ Prefill *** ไม่แตะ isEdit / payload / Running Number
     ผู้ใช้ยังแก้วันที่เองก่อน Save ได้ตามปกติ */
  const JOB_DATE = (isEdit || isCopy)
    ? ((job && (job.job_date || job.reference_date)) || '')
    : ymd(new Date());

  const b = document.createElement('div');
  /* ══ Checkbox ชุดเดียวของฟอร์ม — ประกาศครั้งเดียว ใช้ที่เดียว ═════════════
     ยกเว้น · เปิดตรวจ · FCL · LCL · FZ · FZ+FZ · ค่าธรรมเนียม
     *** id / field / ค่าเริ่มต้น ck(job, ...) เดิมทุกตัว *** ไม่แตะ binding
       #nj-exempt  -> doc_exempt      #nj-lcl   -> cargo_lcl
       #nj-inspect -> doc_inspect     #nj-fz    -> cargo_fz
       #nj-fcl     -> cargo_fcl       #nj-fzfz  -> cargo_fz_fz
       #nj-fee     -> doc_fee   (DOCUMENT เท่านั้น)
     ตำแหน่งที่ render:
       DOCUMENT   = ในหัวฟอร์ม .jm-auto ต่อจาก Dropdown "โหมด"
       ACCOUNTING = ตำแหน่งเดิมใต้ฟิลด์เอกสารงาน (ไม่กระทบ)
     ประกาศเป็นตัวแปรเดียว -> เป็นไปไม่ได้ที่จะเกิด Checkbox/ID ซ้ำสองชุด */
  /* ── Checkbox ชุดเดียวของฟอร์ม — ประกาศครั้งเดียว ใช้ที่เดียว ─────────────
     ยกเว้น · เปิดตรวจ | FCL · LCL · FZ · FZ+FZ | ค่าธรรมเนียม
     *** id / field / ค่าเริ่มต้น ck(job, ...) เดิมทุกตัว *** ไม่แตะ binding
       #nj-exempt  -> doc_exempt      #nj-lcl   -> cargo_lcl
       #nj-inspect -> doc_inspect     #nj-fz    -> cargo_fz
       #nj-fcl     -> cargo_fcl       #nj-fzfz  -> cargo_fz_fz
       #nj-fee     -> doc_fee   (DOCUMENT เท่านั้น)
     ── แยกเป็น 3 ท่อน เพื่อครอบเฉพาะกลุ่มประเภทงานด้วย #nj-cargo (DOCUMENT) ──
       ACCOUNTING ต่อ 2 ท่อนแรกตรง ๆ -> DOM เหมือนเดิมทุกตัวอักษร ไม่มี wrapper
     ตำแหน่งที่ render:
       DOCUMENT   = ในหัวฟอร์ม .jm-auto ต่อจาก Dropdown "ประเภท"
       ACCOUNTING = ตำแหน่งเดิมใต้ฟิลด์เอกสารงาน (ไม่กระทบ) */
  const CB_HEAD =
    `<label class="jm-cb"><input type="checkbox" id="nj-exempt" ${ck(job, 'doc_exempt')}><span>ยกเว้น</span></label>`
  + `<label class="jm-cb"><input type="checkbox" id="nj-inspect" ${ck(job, 'doc_inspect')}><span>เปิดตรวจ</span></label>`;
  const CB_CARGO =
    `<label class="jm-cb"><input type="checkbox" id="nj-fcl" ${ck(job, 'cargo_fcl')}><span>FCL</span></label>`
  + `<label class="jm-cb"><input type="checkbox" id="nj-lcl" ${ck(job, 'cargo_lcl')}><span>LCL</span></label>`
  + `<label class="jm-cb"><input type="checkbox" id="nj-fz" ${ck(job, 'cargo_fz')}><span>FZ</span></label>`
  + `<label class="jm-cb"><input type="checkbox" id="nj-fzfz" ${ck(job, 'cargo_fz_fz')}><span>FZ+FZ</span></label>`;
  const CB_FEE =
    `<label class="jm-cb"><input type="checkbox" id="nj-fee" ${ck(job, 'doc_fee')}><span>ค่าธรรมเนียม</span></label>`;
  /* DOCUMENT ครอบ 4 ตัวด้วย #nj-cargo เพื่อใช้เป็นเป้าของ Validate / Highlight / Scroll
     ACCOUNTING = CB_HEAD + CB_CARGO เรียงต่อกันแบบเดิม (ไม่มี wrapper · ไม่มีค่าธรรมเนียม) */
  const CB_ITEMS = isAcc
    ? CB_HEAD + CB_CARGO
    : CB_HEAD + `<span class="jm-cargo" id="nj-cargo">${CB_CARGO}</span>` + CB_FEE;
  b.innerHTML = `
    <div class="jm-auto${isAcc ? '' : ' jm-auto-wrap'}">
      ${isAcc ? `<span class="jm-auto-lb">${charge === 'ADVANCE' ? 'AD:' : 'JOB NJ:'}</span>
      <input class="inp" id="nj-autono" value="${(job && job.job_no) ? esc(job.job_no) : AUTO}" readonly disabled>
      <span class="jm-auto-lb">วันที่งาน</span>
      <input class="inp jm-auto-date" type="date" id="nj-jobdate" value="${JOB_DATE}">` : ''}
      <span class="jm-auto-lb">โหมด</span>
      ${isAcc ? `<select class="sel jm-auto-mode" id="nj-mode">
        <option value="">${MODE_PH}</option>
        ${modeOpts((job && job.data_type) || '')}
      </select>`
      : njSelectHTML('nj-mode', MODE_PH, JOB_MODES, (job && job.data_type) || '', 'jm-auto-mode')}
      ${isAcc ? '' : `<span class="jm-auto-lb">ประเภท</span>
      ${njSelectHTML('nj-cat', CAT_PH, JOB_CATS, (job && job.job_category) || '', 'jm-auto-cat')}
      <span class="jm-auto-lb">ผ่านหน่วยงาน</span>
      ${njSelectOtherHTML('nj-agency', AGENCY_PH, JOB_AGENCIES,
          (job && job.agency_via) || '', 'jm-auto-agency',
          (job && job.agency_via_other) || '', 'กรอกชื่อหน่วยงาน')}
      <span class="jm-auto-lb">ชื่อใบอนุญาต</span>
      ${njSelectOtherHTML('nj-permit', PERMIT_PH, JOB_PERMITS,
          (job && job.permit_name) || '', 'jm-auto-permit',
          (job && job.permit_name_other) || '', 'กรอกชื่อใบอนุญาต')}`}
      ${isAcc ? '' : `<div class="jm-cb-row jm-auto-cb">${CB_ITEMS}</div>`}
    </div>

    <div class="jm-sec jm-doc">
      <div class="jm-sec-t">DOCUMENT</div>
      ${isAcc ? `
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>บริษัท Invoice</label>
          <div class="fld-inline">
            ${comboboxHTML('nj-comp', activeCompanies(), (job && job.company_invoice_id) || '', 'พิมพ์เพื่อค้นหา หรือเลือกจากรายการ')}
            ${isAdmin() ? '<button type="button" class="jm-link" data-master="companies">+ จัดการ</button>' : ''}
          </div></div>
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
      </div>` : /* ══ DOCUMENT Layout — แถว 5 / 5 / 3 คอลัมน์ ══════════════════════
         *** เปลี่ยนเฉพาะ "ป้ายชื่อ" และ "ตำแหน่ง" · id / field / binding เดิมทั้งหมด ***
           บริษัท      = element เดิม #nj-comp   -> njacc_jobs.company_invoice_id
           Invoice No. = element เดิม #nj-srcinv -> njacc_jobs.source_invoice_no
         ช่องชื่อเรือถูกถอดออกจาก UI หน้านี้เท่านั้น (คอลัมน์ vessel_name ยังอยู่ครบ)
           -> ค่าเดิมถูกส่งกลับใน payload แบบ carry-over (ดูส่วน Save) เพราะ
              njacc_save_job UPDATE ตั้ง vessel_name = p->>'vessel_name' แบบไม่มีเงื่อนไข
              ถ้าไม่ส่ง = ข้อมูลเดิมถูกล้างเป็น NULL
         ช่องใหม่: #nj-rel (release_date) · #nj-port (import_port) — RUN-03 */ `
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>บริษัท</label>
          <div class="fld-inline">
            ${comboboxHTML('nj-comp', activeCompanies(), (job && job.company_invoice_id) || '', 'พิมพ์เพื่อค้นหา หรือเลือกจากรายการ')}
          </div></div>
        <div class="fld"><label>เลขใบขนสินค้า</label>
          <input class="inp" id="nj-decl" placeholder="กรอกเลขใบขนสินค้า" value="${job ? esc(job.customs_declaration_no || "") : ""}"></div>
        <div class="fld"><label>Invoice No.</label>
          <input class="inp" id="nj-srcinv" placeholder="กรอก Invoice No." value="${job ? esc(job.source_invoice_no || "") : ""}"></div>
        <div class="fld"><label>House B/L No.</label>
          <input class="inp" id="nj-hbl" placeholder="กรอก House B/L No." value="${job ? esc(job.house_bl_no || "") : ""}"></div>
        <div class="fld"><label>Master B/L No.</label>
          <input class="inp" id="nj-mbl" placeholder="กรอก Master B/L No." value="${job ? esc(job.master_bl_no || "") : ""}"></div>
      </div>
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>Booking No.</label>
          <input class="inp" id="nj-book" placeholder="กรอก Booking No." value="${job ? esc(job.booking_no || "") : ""}"></div>
        <div class="fld"><label>จำนวนตู้</label>
          <input class="inp" type="number" min="0" id="nj-qtyc" placeholder="กรอกจำนวนตู้" value="${job && job.qty_container != null ? job.qty_container : ''}"></div>
        <div class="fld"><label>ETA</label><input class="inp" type="date" id="nj-eta" value="${(job && job.eta) || ''}"></div>
        <div class="fld"><label>ETD</label><input class="inp" type="date" id="nj-etd" value="${(job && job.etd) || ''}"></div>
        <div class="fld"><label>วันที่ตรวจปล่อย</label>
          <input class="inp" type="date" id="nj-rel" value="${(job && job.release_date) || ''}"></div>
      </div>`}

      <!-- ── ข้อมูลเอกสารงาน ────────────────────────────────────────────────
           ทุกช่องผูกกับคอลัมน์จริงใน njacc_jobs (RUN-01_ADD_JOB_DOCUMENT_FIELDS.sql
           + RUN-03_ADD_JOB_DOC_FIELDS_V2.sql) · อ่านค่าจาก njacc_job_detail (to_jsonb)
           *** ไม่ hardcode ค่า · ไม่ใช้ค่าจาก PDF ตัวอย่าง ***
           ACCOUNTING = โครงเดิมทุกประการ (4 ช่อง + แถว Checkbox + ลูกค้า 2 คอลัมน์)
           DOCUMENT   = แถว 5 ช่อง + แถว 4 ช่องบนฐาน Grid 5 คอลัมน์เดียวกัน
                        *** ย้ายตำแหน่ง element เดิมล้วน *** id / binding ไม่เปลี่ยน -->
      ${isAcc ? `
      <div class="jm-grid">
        <div class="fld"><label class="jm-cb">
            <input type="checkbox" id="nj-lift-f" ${ck(job, 'lift_on_wharf_flag')}>
            <span>ออกใบเสร็จค่า LIFT ON / WHARF ตาม</span></label>
          <input class="inp" id="nj-lift-n" placeholder="กรอกตามหมายเหตุ LIFT ON / WHARF"
            value="${job ? esc(job.lift_on_wharf_note || "") : ""}"></div>
        <div class="fld"><label class="jm-cb">
            <input type="checkbox" id="nj-stor-f" ${ck(job, 'storage_charge_flag')}>
            <span>ออกใบเสร็จค่า STORAGE CHARGE ตาม</span></label>
          <input class="inp" id="nj-stor-n" placeholder="กรอกตามหมายเหตุ STORAGE CHARGE"
            value="${job ? esc(job.storage_charge_note || "") : ""}"></div>
        <div class="fld"><label class="jm-cb">
            <input type="checkbox" id="nj-ot-f" ${ck(job, 'overtime_flag')}>
            <span>ขอล่วงเวลาวันที่</span></label>
          <input class="inp" type="date" id="nj-ot-d" value="${(job && job.overtime_date) || ''}">
          <div class="jm-cb-row">
            <label class="jm-cb"><input type="checkbox" id="nj-ot1" ${ck(job, 'overtime_slot_1')}><span>08.30-16.30</span></label>
            <label class="jm-cb"><input type="checkbox" id="nj-ot2" ${ck(job, 'overtime_slot_2')}><span>16.30-24.00</span></label>
            <label class="jm-cb"><input type="checkbox" id="nj-ot3" ${ck(job, 'overtime_slot_3')}><span>24.00-08.00</span></label>
          </div></div>
        <div class="fld"><label class="jm-cb">
            <input type="checkbox" id="nj-card-f" ${ck(job, 'truck_card_flag')}>
            <span>ให้การ์ดหัวลาก</span></label>
          <input class="inp" id="nj-card-n" placeholder="กรอกข้อมูลการ์ดหัวลาก"
            value="${job ? esc(job.truck_card_no || "") : ""}">
          <input class="inp mt-1" id="nj-card-c" placeholder="เบอร์และชื่อโทร"
            value="${job ? esc(job.truck_card_contact || "") : ""}"></div>
      </div>

      <div class="jm-cb-row jm-cb-row-wide">${CB_ITEMS}</div>

      <div class="jm-grid jm-grid-2">
        <div class="fld"><label>ลูกค้า <span class="req">*</span></label>
          <div class="fld-inline">
            ${comboboxHTML('nj-cust', activeCustomers(), (job && job.customer_id) || '', 'พิมพ์ชื่อบริษัท หรือ CODE เพื่อค้นหา', CUST_DISPLAY)}
            ${isAdmin() ? '<button type="button" class="jm-link" data-master="customers">+ จัดการ</button>' : ''}
          </div></div>
        <div class="fld"><label>Customer Job No.</label>
          <input class="inp" id="nj-cjob" placeholder="กรอก Customer Job No." value="${job ? esc(job.customer_job_no || "") : ""}"></div>
      </div>` : `
      <!-- แถว 1 (5 ช่อง) — วันส่งมอบ | ท่านำเข้า | Lift On / Wharf | Storage Charge | การ์ดหัวลาก -->
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>วันส่งมอบ</label>
          <input class="inp" type="date" id="nj-dlv" value="${(job && job.delivery_date) || ''}"></div>
        <div class="fld"><label>ท่านำเข้า</label>
          <input class="inp" id="nj-port" placeholder="กรอกท่านำเข้า" value="${job ? esc(job.import_port || "") : ""}"></div>
        <div class="fld"><label>ออกใบเสร็จค่า Lift On / Wharf</label>
          <input class="inp" id="nj-lift-n" placeholder="กรอกตามหมายเหตุ Lift On / Wharf"
            value="${job ? esc(job.lift_on_wharf_note || "") : ""}"></div>
        <div class="fld"><label>ออกใบเสร็จค่า Storage Charge</label>
          <input class="inp" id="nj-stor-n" placeholder="กรอกตามหมายเหตุ Storage Charge"
            value="${job ? esc(job.storage_charge_note || "") : ""}"></div>
        <div class="fld"><label>ให้การ์ดหัวลาก</label>
          <input class="inp" id="nj-card-n" placeholder="กรอกข้อมูลการ์ดหัวลาก"
            value="${job ? esc(job.truck_card_no || "") : ""}"></div>
      </div>

      <!-- แถว 2 (4 ช่อง บนฐาน Grid 5 คอลัมน์เดียวกัน · คอลัมน์ที่ 5 ปล่อยว่าง)
           -> แนวคอลัมน์ตรงกับแถวบนทุกช่อง ไม่ยืด 4 ช่องให้เต็มความกว้าง -->
      <div class="jm-grid jm-grid-5 jm-row-even">
        <div class="fld jm-ot-fld"><label>ขอล่วงเวลาวันที่</label>
          <div class="jm-ot-row jm-ot-col">
            <input class="inp jm-ot-d" type="date" id="nj-ot-d" value="${(job && job.overtime_date) || ''}">
            <span class="jm-ot-lb">ช่วงเวลา</span>
            <select class="sel jm-ot-s" id="nj-ot-slot">
              <option value="">กรุณาเลือก</option>
              ${otOpt('1', '08.30-16.30')}${otOpt('2', '16.30-24.00')}${otOpt('3', '24.00-08.00')}
            </select>
          </div></div>
        <div class="fld"><label>ลูกค้า <span class="req">*</span></label>
          <div class="fld-inline">
            ${comboboxHTML('nj-cust', activeCustomers(), (job && job.customer_id) || '', 'พิมพ์ชื่อบริษัท หรือ CODE เพื่อค้นหา', CUST_DISPLAY)}
          </div></div>
        <div class="fld"><label>Customer Job No.</label>
          <input class="inp" id="nj-cjob" placeholder="กรอก Customer Job No." value="${job ? esc(job.customer_job_no || "") : ""}"></div>
        <div class="fld"><label>หมายเหตุ</label>
          <textarea class="inp" id="nj-note" placeholder="กรอกหมายเหตุ">${job ? esc(job.note || "") : ""}</textarea></div>
      </div>`}
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
  /* 🖨 Print Preview — เฉพาะ DOCUMENT (SERVICE / ADVANCE) · ACCOUNTING ไม่มีปุ่มนี้
     ยังไม่ได้บันทึก (ไม่มี jobId) -> disabled + บอกเหตุผล
     *** ไม่สร้าง JOB เงียบ ๆ เพียงเพราะกด Preview *** เลขงานยังออกจาก njacc_save_job เท่านั้น */
  /* สีปุ่ม Footer ของ DOCUMENT: Print Preview = เขียว · บันทึกงาน = น้ำเงิน (เดิม) · ปิด = แดง
     ใช้ class สีกลางที่มีอยู่แล้วใน ui.css (.btn-green / .btn-p / .btn-danger)
     ไม่สร้าง class สีใหม่ · ไม่แตะ handler ใด ๆ (id / data-close เหมือนเดิม)
     ── ปุ่มขวาสุดใช้ markup ร่วมกับ ACCOUNTING -> ต้อง gate ด้วย isAcc ──
       DOCUMENT   : "✕ ปิด"     + .btn-danger
       ACCOUNTING : "✕ ยกเลิก"  + .btn-o (ขาว/เทา) — เหมือนเดิมทุกประการ
     *** เปลี่ยนเฉพาะ "ข้อความบนปุ่ม" *** ไม่แตะ data-close
     -> ยังใช้ handler ปิดหน้าต่างเดิมของ components/modal.js:26
        bk.addEventListener('click', e => { ... e.target.closest('[data-close]') -> closeModal() })
        closeModal() = ลบ #nj-modal ออกจาก DOM เฉย ๆ
        *** ไม่ล้างข้อมูล · ไม่ยกเลิกรายการ · ไม่เปลี่ยน Status · ไม่เรียก RPC ใด ๆ *** */
  f.innerHTML = `<div class="mf-left"></div>
    <div class="mf-right">
      ${/* ── V.231 ── ปุ่ม Print Preview กดได้ทุกโหมด (NEW / COPY / EDIT)
           เดิม disabled เมื่อ !isEdit -> COPY กดไม่ได้ทั้งที่ข้อมูลครบแล้ว
           *** Preview เป็นการดูอย่างเดียว *** ไม่บันทึก ไม่ออกเลข ไม่ยิง RPC เขียน */ ''}
      ${/* ── V.232 ── DOCUMENT > SERVICE : ฟอร์ม DRAFT ต้องมี
           📋 COPY · ยกเลิก · 💾 บันทึก · ⬆ POST
           COPY : เปิดฟอร์มใหม่จากข้อมูลใบนี้ — ต้องบันทึกแล้วถึงมีต้นฉบับให้คัดลอก
           POST : ออกเลขงาน — แสดงเฉพาะ SERVICE ที่บันทึกแล้วและยังเป็น DRAFT
                  *** ADVANCE ไม่มีปุ่มนี้ *** (ออกเลขตั้งแต่บันทึกเหมือนเดิม) */ ''}
      ${(!isAcc && charge === 'SERVICE' && jobId)
        ? `<button class="btn btn-o" id="nj-copy">📋 COPY</button>` : ''}
      ${isAcc ? '' : `<button class="btn btn-green" id="nj-preview">🖨 Print Preview</button>`}
      <button class="btn ${isAcc ? 'btn-o' : 'btn-danger'}" data-close>✕ ${isAcc ? 'ยกเลิก' : 'ปิด'}</button>
      <button class="btn btn-p" id="nj-save">💾 บันทึกงาน</button>
      ${(!isAcc && charge === 'SERVICE')
        ? `<button class="btn btn-p" id="nj-post"${(jobId && jobStatus === 'DRAFT') ? ''
            : ' disabled title="บันทึกงานก่อนจึงจะออกเลขได้"'}>⬆ POST</button>` : ''}
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
     ADVANCE · 50 ทวิ · Preview) ไม่ส่ง cls จึงไม่กระทบเลย

     jm-noh = ซ่อน "หัวข้อ" ของ Modal (เปิดงานใหม่ / แก้ไขงาน) เฉพาะ DOCUMENT
       -> ได้ความสูงคืนมาให้เนื้อหาฟอร์ม · ปุ่ม ✕ ยังอยู่มุมขวาบนตามเดิม
       *** ยังส่ง title ขึ้นไปเหมือนเดิม *** (ไม่แก้ components/modal.js)
       เป็นการซ่อนด้วย CSS ที่ scope อยู่ใน .jm-noh เท่านั้น
       ACCOUNTING ไม่ได้รับ class นี้ -> หัวข้อยังแสดงเหมือนเดิมทุกประการ */
  /* ── แถบหัว Modal ของ DOCUMENT ────────────────────────────────────────────
     ย้าย "JOB NJ" + "วันที่งาน" จากแถว .jm-auto ขึ้นมาต่อหลังชื่อหน้า
       DOCUMENT — SERVICE | JOB NJ: [....] | วันที่งาน [dd/mm/yyyy]
     *** ย้าย element เดิมทั้งก้อน *** id / value / binding ไม่เปลี่ยนแม้แต่ตัวเดียว
       #nj-autono  = ช่องเลขงาน readonly disabled (เลขออกจาก Backend เท่านั้น)
       #nj-jobdate = วันที่งาน -> payload job_date (njacc_jobs.job_date)
     ใช้ headExtra ของ components/modal.js (opt-in) -> Modal อื่นไม่กระทบ
     jm-noh  : ยังใส่อยู่ -> ได้ padding หัวกระชับ 6px + กฎ hover/active ของปุ่ม footer
     jm-hd   : เปิด <h3> กลับมาแสดง (ทับ jm-noh) + จัดวางช่องในแถบหัว
     ACCOUNTING : ไม่ส่ง headExtra · title เดิม · ช่องทั้งสองยังอยู่ใน .jm-auto เหมือนเดิม */
  const headExtra = isAcc ? '' : `
      <span class="jm-auto-lb">${charge === 'ADVANCE' ? 'AD:' : 'JOB NJ:'}</span>
      <input class="inp jm-hd-no" id="nj-autono" value="${(job && job.job_no) ? esc(job.job_no) : AUTO}" readonly disabled>
      <span class="jm-auto-lb">วันที่งาน</span>
      <input class="inp jm-hd-date" type="date" id="nj-jobdate" value="${JOB_DATE}">`;
  openModal({
    title: isAcc ? (isEdit ? 'แก้ไขงาน' : 'เปิดงานใหม่')
                 : 'DOCUMENT — ' + charge,
    body: b, footer: f, headExtra,
    fullscreen: true, wide: true, cls: 'modal-flow' + (isAcc ? '' : ' jm-noh jm-hd') });
  /* Enter = ไปช่องถัดไป (helper กลางใน components/modal.js) — ไม่แตะปุ่มบันทึก/Validation */
  enableEnterNav(b);
  /* Dropdown "โหมด" + "ประเภท" แบบ radio list (DOCUMENT เท่านั้น)
     ACCOUNTING ไม่มี -wrap -> bindNjSelect return ทันที ไม่กระทบ */
  bindNjSelect(b, 'nj-mode');
  bindNjSelect(b, 'nj-cat');
  /* 2 ฟิลด์ใหม่ (DOCUMENT เท่านั้น) — ACCOUNTING ไม่มี -wrap -> return ทันที */
  bindNjSelect(b, 'nj-agency');
  bindNjSelect(b, 'nj-permit');
  bindOtherInput(b, 'nj-agency');
  bindOtherInput(b, 'nj-permit');

  /* ── กลุ่มประเภทงาน FCL / LCL / FZ / FZ+FZ (DOCUMENT เท่านั้น) ─────────────
     ── ตรวจ Source/DB จริงก่อนแก้ ──
       UI   : <input type="checkbox"> อิสระ 4 ตัว (id เดิม #nj-fcl/#nj-lcl/#nj-fz/#nj-fzfz)
       DB   : njacc_jobs.cargo_fcl / cargo_lcl / cargo_fz / cargo_fz_fz = boolean 4 คอลัมน์
              *** ไม่มี CHECK constraint ใด ๆ ที่บังคับให้เลือกได้ค่าเดียว ***
              (ตรวจ pg_constraint ของ njacc_jobs แล้วไม่พบเงื่อนไขเกี่ยวกับ cargo)
       ข้อมูลจริงบน Production: ไม่มีงานใดที่ติ๊กมากกว่า 1 ค่า
     -> กติกา "1 ค่า" จึงบังคับที่ UI · *** ไม่แก้ Database / RPC / โครงสร้างข้อมูล ***
        ยังส่งเป็น boolean 4 คอลัมน์เหมือนเดิมทุกประการ
     ── พฤติกรรม ──
       เลือกค่าใหม่ -> ล้างค่าเดิมอัตโนมัติ (เหมือน radio แต่ยัง "ติ๊กซ้ำเพื่อยกเลิก" ได้)
       ไม่ตั้ง Default ให้ค่าใดเลย -> งานใหม่เริ่มต้นว่างเสมอ
       ติ๊กแล้ว -> ลบสถานะ Error ทันที
     ── งานเก่า ──
       ตอน render ใช้ ck(job, ...) เดิม -> ติ๊กตามค่าที่บันทึกไว้จริงทุกตัว
       ถ้างานเก่ามีมากกว่า 1 ค่า จะแสดงครบตามที่บันทึก (ไม่ถูกล้างอัตโนมัติ)
       จะเหลือค่าเดียวก็ต่อเมื่อผู้ใช้กดเลือกใหม่เอง */
  const cargoBox = b.querySelector('#nj-cargo');
  const CARGO_IDS = ['#nj-fcl', '#nj-lcl', '#nj-fz', '#nj-fzfz'];
  const cargoInputs = () => CARGO_IDS.map(id => b.querySelector(id)).filter(Boolean);
  const cargoPicked = () => cargoInputs().some(x => x.checked);
  const clearCargoErr = () => {
    if (cargoBox) cargoBox.classList.remove('is-err');
  };
  if (cargoBox) {
    cargoBox.addEventListener('change', (e) => {
      const t = e.target;
      if (!t || t.type !== 'checkbox') return;
      /* เลือกได้ครั้งละ 1 ค่า — ติ๊กตัวใหม่แล้วยกเลิกตัวอื่นทั้งหมด */
      if (t.checked) cargoInputs().forEach(x => { if (x !== t) x.checked = false; });
      if (cargoPicked()) clearCargoErr();
    });
  }


  /* ── 🖨 Print Preview ────────────────────────────────────────────────────
     Reuse Renderer เดิม docHTML() ของ jobs/job-form-doc.js (ไม่ทำ Template ใหม่)
     openModal() ปิด Modal เดิมก่อนเสมอ -> Preview จึงมาแทนที่หน้าเปิดงาน
     กด "✕ กลับ" = เปิดฟอร์มงานใบเดิมกลับมา (อ่านค่าล่าสุดจาก DB ผ่าน jobDetail)
     กด Preview แล้ว *ไม่* เด้ง Print Dialog — ต้องกด 🖨 Print / 💾 Save PDF เอง */
  /* ══ V.231 · เก็บค่าจากฟอร์ม ณ ปัจจุบันเพื่อ Preview ก่อนบันทึก ═══════════
     อ่านจาก DOM ตรง ๆ *** ไม่แตะ payload ของ Save · ไม่เรียก RPC ***
     ครอบทุก field ที่ docHTML() ใช้จริง (ตรวจจาก Source ของ job-form-doc.js)
     job_no เว้นว่างไว้เสมอ -> Preview แสดงช่องว่าง *** ไม่มีเลขปลอม *** */
  const cv = (id) => { const el = q(id); return el ? (el.value || '').trim() : ''; };
  const cc = (id) => { const el = q(id); return !!(el && el.checked); };
  function draftFromForm() {
    const slot = cv('#nj-ot-slot');
    return {
      job_no: '',                                   /* ยังไม่ออกเลข -> เว้นว่าง */
      data_type: cv('#nj-mode') || null,
      /* comboText(el) คืนข้อความที่แสดงในช่อง (ชื่อลูกค้า/บริษัท) — ไม่ใช่ UUID */
      customer_name: comboText(q('#nj-cust')) || '',
      company_invoice: comboText(q('#nj-comp')) || '',
      customer_job_no: cv('#nj-cjob') || null,
      customs_declaration_no: cv('#nj-decl') || null,
      qty_container: cv('#nj-qtyc') || null,
      /* Modal ของ DOCUMENT ไม่มีช่อง CS / วันที่ปล่อย -> Preview เว้นว่างไว้
         (docHTML() รองรับค่าว่างอยู่แล้ว — fill() คืนช่องว่าง) */
      cs_name: null,
      release_date: null,
      /* ── V.231 ── เก็บ *** ทุกช่องของฟอร์ม *** ไม่ใช่แค่ field ที่ Preview ใช้
         เพราะ draft ตัวนี้ถูกใช้ prefill ตอนกด "✕ กลับ" ด้วย (ข้อ 6)
         ถ้าเก็บไม่ครบ -> กลับมาแล้วข้อมูลหาย
         id ชุดเดียวกับที่ payload ของ Save ใช้ (ตรวจจาก Source แล้ว) */
      job_date: cv('#nj-jobdate') || null,
      company_invoice_id: comboValue(q('#nj-comp')) || null,
      customer_id: comboValue(q('#nj-cust')) || null,
      source_invoice_no: cv('#nj-srcinv') || null,
      house_bl_no: cv('#nj-hbl') || null,
      master_bl_no: cv('#nj-mbl') || null,
      booking_no: cv('#nj-book') || null,
      vessel_name: cv('#nj-vessel') || null,
      etd: cv('#nj-etd') || null,
      eta: cv('#nj-eta') || null,
      delivery_date: cv('#nj-dlv') || null,
      note: cv('#nj-note') || null,
      case_no: cv('#nj-case') || null,
      contact: cv('#nj-contact') || null,
      credit_term_days: cv('#nj-term') || null,
      due_date: cv('#nj-due') || null,
      doc_exempt: cc('#nj-exempt'), doc_inspect: cc('#nj-inspect'), doc_fee: cc('#nj-fee'),
      cargo_fcl: cc('#nj-fcl'), cargo_lcl: cc('#nj-lcl'),
      cargo_fz: cc('#nj-fz'), cargo_fz_fz: cc('#nj-fzfz'),
      lift_on_wharf_flag: cc('#nj-lift-f'), lift_on_wharf_note: cv('#nj-lift-n') || null,
      storage_charge_flag: cc('#nj-stor-f'), storage_charge_note: cv('#nj-stor-n') || null,
      truck_card_flag: cc('#nj-card-f'), truck_card_no: cv('#nj-card-n') || null,
      truck_card_contact: cv('#nj-card-c') || null,
      overtime_flag: cc('#nj-ot-f'), overtime_date: cv('#nj-ot-d') || null,
      overtime_slot_1: slot === '1', overtime_slot_2: slot === '2', overtime_slot_3: slot === '3',
    };
  }

  const pvBtn = f.querySelector('#nj-preview');
  if (pvBtn) {
    pvBtn.onclick = async () => {
      /* ── V.231 ── บันทึกแล้ว -> อ่านจาก Database เหมือนเดิมทุกประการ
         ยังไม่บันทึก (NEW / COPY) -> ใช้ค่าจากฟอร์ม ณ ปัจจุบัน
         *** ไม่มีการ Save / ออกเลข / ยิง RPC เขียนข้อมูลในทั้ง 2 เส้นทาง *** */
      const draft = jobId ? null : draftFromForm();
      /* กลับมาที่ฟอร์มเดิมพร้อมข้อมูลที่กรอกไว้ (ยังไม่บันทึกก็ไม่หาย) */
      const backArgs = jobId
        ? { charge, group, mode, jobId, onSaved }
        : { charge, group, mode, onSaved, draft };
      try {
        const m = await import('./job-form-doc.js');
        await m.openJobFormPreview({
          id: jobId || null,
          data: draft,
          onBack: () => { openNewJobModal(backArgs).catch(handleErr); },
        });
      } catch (ex) { handleErr(ex); }
    };
  }

  /* ══ V.232 · 📋 COPY จากในฟอร์ม ═══════════════════════════════════════════
     ใช้เส้นทางเดียวกับปุ่ม COPY ในตาราง (openNewJobModal({ copyFromId }))
     *** ไม่ INSERT · ไม่ออกเลข *** เลขงานใหม่เกิดตอนกด POST เท่านั้น */
  const cpBtn = f.querySelector('#nj-copy');
  if (cpBtn) cpBtn.onclick = () => {
    openNewJobModal({ charge, group, mode, copyFromId: jobId, onSaved }).catch(handleErr);
  };

  /* ══ V.232 · ⬆ POST — ออก Running Number ของ SERVICE ══════════════════════
     *** จุดเดียวที่ SERVICE ได้เลข *** RPC njacc_post_job (RUN-29)
     idempotent : newRequestId() ต่อ 1 การกดยืนยัน + once() + btnBusy กันกดรัว
     สำเร็จ -> อัปเดตช่องเลขงานจากค่าที่ Backend คืนมา (ไม่คำนวณเองที่ Frontend) */
  const poBtn = f.querySelector('#nj-post');
  if (poBtn) {
    poBtn.onclick = async (e) => {
      if (!jobId) { toast('กรุณาบันทึกงานก่อนจึงจะออกเลขได้', 'err'); return; }
      if (jobStatus !== 'DRAFT') { toast('งานนี้ออกเลขไปแล้ว', 'err'); return; }
      const okc = await confirmModal('ยืนยันออกเลขงาน (POST)',
        'ระบบจะออกเลขงานให้ทันทีและเปลี่ยนสถานะเป็น <b>POSTED</b><br>' +
        '<span class="t-xs t-3">เลขที่ออกแล้วจะไม่ถูกนำกลับมาใช้ซ้ำ</span>', '⬆ POST');
      if (!okc) return;
      btnBusy(e.target, true);
      try {
        const res = await once('post-job-' + jobId, () => postJob(jobId, newRequestId()));
        if (res === null) { btnBusy(e.target, false); return; }
        jobStatus = 'POSTED';
        const noEl = q('#nj-autono');
        if (noEl && res && res.job_no) noEl.value = res.job_no;
        poBtn.disabled = true;
        poBtn.title = 'ออกเลขงานแล้ว';
        toast('ออกเลขงานแล้ว — ' + (res && res.job_no ? res.job_no : ''), 'ok');
        if (onSaved) onSaved();
      } catch (ex) { handleErr(ex, 'ออกเลขงานไม่สำเร็จ'); btnBusy(e.target, false); }
    };
  }

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
    /* ── ต้องเลือกประเภทงานอย่างน้อย 1 ค่าก่อนบันทึก (DOCUMENT เท่านั้น) ──
       ตรวจก่อนสร้าง payload และก่อนเรียก RPC ทุกครั้ง
       ไม่ผ่าน -> return ทันที: ไม่เรียก njacc_save_job / njacc_save_job_doc_fields
       ไม่ปิด Modal · ไม่แตะข้อมูลเดิม · ไฮไลต์กลุ่มเป็นสีแดง + เลื่อนมาที่ตำแหน่ง */
    if (cargoBox && !cargoPicked()) {
      cargoBox.classList.add('is-err');
      try { cargoBox.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (_) { /* jsdom */ }
      const first = b.querySelector('#nj-fcl');
      if (first && first.focus) first.focus();
      toast('⚠ กรุณาเลือกประเภทงาน FCL, LCL, FZ หรือ FZ+FZ ก่อนบันทึกงาน', 'err');
      return;
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
         data_type      : โหมดงาน 7 ค่า (IM/EX (SEA|AIR|TRUCK) · FORM) จาก Dropdown "โหมด"
                          *** ใช้คอลัมน์เดิม njacc_jobs.data_type *** ไม่สร้าง field ใหม่
                          บันทึกค่าตรงตัวตามที่เลือก ไม่แปลงรหัส
                          CHECK ของ DB ต้องรับค่าใหม่ -> sql/RUN-NOW/RUN-05_JOB_MODE_NEW_VALUES.sql
         reference_no   : ไม่มีช่องให้กรอกแล้ว → ส่ง null */
      /* ── ฟิลด์ที่ไม่มีช่องใน UI ──
         เปิดงานใหม่ = null · แก้ไข = คงค่าเดิมของงานไว้ (ไม่ล้างข้อมูลที่มีอยู่) */
      data_type: q('#nj-mode').value || null,
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
      /* ── ชื่อเรือ / Vessel ────────────────────────────────────────────────
         ROOT CAUSE: njacc_save_job (UPDATE) ตั้ง vessel_name = p->>'vessel_name'
         แบบไม่มีเงื่อนไข (ตรวจจาก pg_get_functiondef จริง) -> ถ้าไม่ส่งขึ้นไป
         ค่าเดิมของงานจะถูกล้างเป็น NULL ทันที
         DOCUMENT ถอดช่องนี้ออกจาก UI แล้ว จึง carry ค่าเดิมของงานกลับขึ้นไป
         (รูปแบบเดียวกับ reference_no ด้านบน) -> ข้อมูลเดิมไม่หาย · ไม่ต้องแก้ RPC
         ACCOUNTING ยังมีช่องกรอกเหมือนเดิม จึงอ่านจาก input ตามเดิม */
      vessel_name: isAcc ? (q('#nj-vessel').value.trim() || null)
                         : ((job && job.vessel_name) || null),
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
    /* ── V.226 ── เปิดงานใหม่เท่านั้นที่ต้องมี request_id (ดูหัวไฟล์)
       *** ห้ามสร้าง UUID ใหม่ตอน Retry *** createReqId() คืนค่าเดิมเสมอ
       จนกว่าจะสร้างงานสำเร็จหรือเปิดฟอร์มเปล่ารอบใหม่ */
    if (!isEdit) payload.request_id = createReqId();
    btnBusy(e.target, true);
    try {
      const res = await once((isEdit ? 'edit-job-' + jobId : 'save-job'), () => saveJob(payload));
      /* ── กันคลิกซ้ำ (ชั้นที่ 2) ────────────────────────────────────────────
         core/request-manager.js: once(key, fn) คืน null ทันทีถ้ามี request
         key เดิมค้างอยู่ (in-flight guard · ไม่ cache ผลลัพธ์)
         null = "ไม่ได้ยิงซ้ำ" ไม่ใช่ "บันทึกสำเร็จ"
         -> ห้ามแจ้งสำเร็จ · ห้ามรีเฟรช · ห้ามปิด Modal · คืนปุ่มให้กดใหม่ได้
         (ชั้นที่ 1 คือ btnBusy() ที่ disable ปุ่มไว้ตั้งแต่ก่อนเรียก RPC) */
      if (res === null) { btnBusy(e.target, false); return; }

      /* ── V.226 ── สร้างงานสำเร็จแล้ว -> ล้าง request_id
         การกด "เปิดงานใหม่" ครั้งถัดไปจะได้ UUID ใหม่ = คนละงาน */
      if (!isEdit) resetCreateReqId();

      /* ── เลื่อนสถานะเป็น "แก้ไขงานเดิม" ทันทีที่ njacc_save_job สำเร็จ ──────────
         *** ต้องทำก่อนบันทึกฟิลด์เอกสารงาน *** เพราะถ้า saveJobDocFields ล้มเหลว
         แล้ว return ออกไป ผู้ใช้จะกด "บันทึกงาน" ซ้ำ — ถ้ายังไม่เลื่อน isEdit/jobId
         การกดซ้ำจะกลายเป็น "เปิดงานใหม่" อีกใบ (ออกเลข JOB/AD ใหม่ = งานซ้ำ)
         เลื่อนไว้ตรงนี้ -> กดซ้ำเป็น UPDATE บน record เดิมเสมอ ไม่กินเลขใหม่
         ใช้เลขที่ Backend คืนมาเท่านั้น (res.job_no) ไม่คำนวณเองที่ Frontend
         ถ้า RPC ไม่คืนเลข (โหมดแก้ไข) ให้คงค่าที่แสดงอยู่เดิม ไม่ล้างเป็นว่าง */
      const noEl = q('#nj-autono');
      if (noEl && res && res.job_no) noEl.value = res.job_no;
      if (!isEdit && res && res.id) { isEdit = true; jobId = res.id; }
      /* ── V.232 ── อัปเดตสถานะจากค่าที่ Backend คืนมา (ไม่เดาเอง)
         SERVICE บันทึกใหม่ -> DRAFT -> ปุ่ม ⬆ POST ใช้งานได้ทันที
         ADVANCE -> OPEN (ไม่มีปุ่มนี้อยู่แล้ว) */
      if (res && res.operational_status) jobStatus = res.operational_status;
      if (poBtn) {
        const canPost = !!jobId && jobStatus === 'DRAFT';
        poBtn.disabled = !canPost;
        if (canPost) poBtn.removeAttribute('title');
      }
      if (cpBtn) cpBtn.disabled = !jobId;
      /* Backend คืน JOB ID แล้ว -> เปิดปุ่ม Print Preview ได้ (ก่อนหน้านี้ถูก disabled) */
      if (pvBtn && jobId) { pvBtn.disabled = false; pvBtn.removeAttribute('title'); }

      /* ── ฟิลด์เอกสารงาน — บันทึกด้วย RPC แยก (ไม่แตะ njacc_save_job / เลขงาน) ──
         ใช้ id ที่เพิ่งได้จาก Backend (งานใหม่) หรือ jobId เดิม (แก้ไข) */
      const savedId = (res && res.id) || jobId;
      if (savedId) {
        const cb = (id) => !!q(id).checked;
        /* ── ช่วงเวลาล่วงเวลา -> คอลัมน์เดิม 3 boolean ─────────────────────
           ACCOUNTING : ยังเป็น Checkbox ชุดเดิม -> อ่านค่าเดิมทุกช่อง (ไม่กระทบ)
           DOCUMENT   : Dropdown 1 ค่า -> ช่วงที่เลือก = true · อีก 2 ช่อง = false
                        "กรุณาเลือก" (ค่าว่าง) = false ทั้ง 3 ช่อง
                        (คงพฤติกรรมเดิม: Checkbox ที่ไม่ติ๊กก็ส่ง false ไม่ใช่ null) */
        const otSlots = () => {
          if (isAcc) {
            return { overtime_slot_1: cb('#nj-ot1'), overtime_slot_2: cb('#nj-ot2'), overtime_slot_3: cb('#nj-ot3') };
          }
          const v = q('#nj-ot-slot').value;
          return { overtime_slot_1: v === '1', overtime_slot_2: v === '2', overtime_slot_3: v === '3' };
        };
        try {
          /* ── 4 flag เดิม (lift/storage/overtime/truck_card) ──────────────
             ตรวจการใช้งานจริงของ flag ก่อนแก้:
               job-form-doc.js  : box(j.<flag>)  -> ติ๊กในเอกสาร A4
               charge-table.js  : note || (flag === true ? '✓' : '')  -> ใช้เป็น fallback
               njacc_save_job_doc_fields : เขียนค่าตามที่ client ส่งมา (ไม่คำนวณเอง)
               *** ไม่มี RPC/SQL ใดคำนวณ flag เอง *** -> เป็นค่าที่ฟอร์มเป็นคนกำหนด
             ACCOUNTING : ยังมี Checkbox หน้าหัวข้อ -> อ่านจาก Checkbox เหมือนเดิมทุกประการ
             DOCUMENT   : ถอด Checkbox ออกจาก UI แล้ว -> คำนวณจาก "ค่าของช่องข้อมูล"
                          มีข้อมูล = true · ว่าง = false
                          คอลัมน์ทั้ง 4 ยังอยู่ครบ · ยังส่งเป็น key เดิมใน RPC เดิม
                          -> เอกสาร A4 และคอลัมน์ในรายการยังติ๊ก/แสดงได้ถูกต้อง */
          const has = (sel) => q(sel).value.trim() !== '';
          const otHas = () => q('#nj-ot-d').value !== '' || q('#nj-ot-slot').value !== '';
          await saveJobDocFields({
            id: savedId,
            lift_on_wharf_flag:  isAcc ? cb('#nj-lift-f') : has('#nj-lift-n'),
            lift_on_wharf_note:  q('#nj-lift-n').value.trim() || null,
            storage_charge_flag: isAcc ? cb('#nj-stor-f') : has('#nj-stor-n'),
            storage_charge_note: q('#nj-stor-n').value.trim() || null,
            overtime_flag:       isAcc ? cb('#nj-ot-f') : otHas(),
            overtime_date:       q('#nj-ot-d').value || null,
            ...otSlots(),
            truck_card_flag:     isAcc ? cb('#nj-card-f') : has('#nj-card-n'),
            truck_card_no:       q('#nj-card-n').value.trim() || null,
            /* "เบอร์และชื่อโทร" ถูกถอดออกจาก UI เฉพาะ DOCUMENT — คอลัมน์
               njacc_jobs.truck_card_contact ยังอยู่ครบ · ไม่ DROP · ไม่ DELETE
               ไม่ส่ง key นี้ขึ้นไป -> RPC njacc_save_job_doc_fields ใช้
               CASE WHEN p ? 'truck_card_contact' ... ELSE truck_card_contact END
               => ค่าเดิมของงานเก่าคงอยู่เหมือนเดิม ไม่ถูกล้างเป็น null */
            ...(isAcc ? { truck_card_contact: q('#nj-card-c').value.trim() || null } : {}),
            doc_exempt:          cb('#nj-exempt'),
            doc_inspect:         cb('#nj-inspect'),
            cargo_fcl:           cb('#nj-fcl'),
            cargo_lcl:           cb('#nj-lcl'),
            cargo_fz:            cb('#nj-fz'),
            cargo_fz_fz:         cb('#nj-fzfz'),
            /* ── ฟิลด์ใหม่ของ DOCUMENT — มีเฉพาะฟอร์ม DOCUMENT ─────────────
               njacc_jobs.release_date / import_port / doc_fee
               (เพิ่มโดย sql/RUN-NOW/RUN-03_ADD_JOB_DOC_FIELDS_V2.sql)
               ACCOUNTING ไม่มีช่องเหล่านี้ -> ไม่ส่ง key -> RPC คงค่าเดิมไว้ */
            ...(isAcc ? {} : {
              release_date: q('#nj-rel').value || null,
              import_port:  q('#nj-port').value.trim() || null,
              doc_fee:      cb('#nj-fee'),
              /* ประเภท -> njacc_jobs.job_category (RUN-04) · ค่าว่าง = ยังไม่เลือก
                 ACCOUNTING ไม่มีช่องนี้ -> ไม่ส่ง key -> RPC คงค่าเดิมไว้ */
              job_category: q('#nj-cat').value || null,
              /* ผ่านหน่วยงาน / ชื่อใบอนุญาต -> คอลัมน์ใหม่ (RUN-06)
                 ช่อง "อื่น" ส่งค่าเฉพาะตอนที่ Dropdown = "อื่น" จริง
                 -> ไม่ให้ข้อความค้างเก่าไปปนกับตัวเลือกปกติ
                 ACCOUNTING ไม่มีช่องเหล่านี้ -> ไม่ส่ง key -> RPC คงค่าเดิมไว้ */
              agency_via:        q('#nj-agency').value || null,
              agency_via_other:  q('#nj-agency').value === OTHER
                ? (q('#nj-agency-other').value.trim() || null) : null,
              permit_name:       q('#nj-permit').value || null,
              permit_name_other: q('#nj-permit').value === OTHER
                ? (q('#nj-permit-other').value.trim() || null) : null,
            }),
          });
        } catch (_) {
          /* ── Partial Save = ยังไม่สำเร็จครบ -> ห้ามปิด Modal ────────────────
             njacc_save_job สำเร็จแล้ว แต่ njacc_save_job_doc_fields ล้มเหลว
             (เช่นยังไม่ได้รัน RUN-01/RUN-03/RUN-04 · RPC error · Network error)
             *** ห้ามแจ้งเป็น Success และห้ามปล่อยให้ไหลไปถึง closeModal() ***
             ผู้ใช้ต้องเห็นว่ายังไม่ครบ และกดบันทึกใหม่ได้ทันที
             ตอนกดซ้ำ: isEdit/jobId ถูกเลื่อนไปแล้วด้านบน -> UPDATE งานเดิม
             ไม่สร้าง JOB/AD ใหม่ ไม่กินเลขใหม่
             btnBusy(false) คืนปุ่มก่อน return -> ปุ่มไม่ค้าง disabled */
          toast('บันทึกข้อมูลเอกสารงานไม่สำเร็จ — งานหลักถูกบันทึกแล้ว '
              + 'กรุณากด "บันทึกงาน" อีกครั้ง', 'err');
          btnBusy(e.target, false);
          return;
        }
      }
      toast(isEdit
        ? 'บันทึกการแก้ไขแล้ว' + (res && res.job_no ? ' — ' + res.job_no : '')
        : 'เปิดงานใหม่แล้ว' + (res && res.job_no ? ' — ' + res.job_no : ''), 'ok');
      btnBusy(e.target, false);
      if (typeof onSaved === 'function') onSaved();   /* รีเฟรชรายการจาก server */
      /* ── ปิดหน้าต่างอัตโนมัติเมื่อบันทึกสำเร็จจริง (DOCUMENT เท่านั้น) ──────
         จุดนี้อยู่ "หลัง" ทุกอย่างต่อไปนี้ผ่านครบแล้ว:
           Validate (ลูกค้า · ประเภทงาน FCL/LCL/FZ/FZ+FZ)
           -> saveJob() -> RPC njacc_save_job สำเร็จ (res ไม่ใช่ null)
           -> saveJobDocFields() (ถ้ามี savedId)
           -> อัปเดตเลขงานบน Modal · toast แจ้งสำเร็จ
           -> onSaved() รีเฟรชตารางรายการ
         ถ้า Validate ไม่ผ่าน / RPC error / Network error -> return หรือเข้า catch
         ตั้งแต่ก่อนถึงบรรทัดนี้ -> *** Modal ไม่มีทางถูกปิด *** ข้อมูลที่กรอกยังอยู่ครบ
         ACCOUNTING (isAcc) คงพฤติกรรมเดิม — Modal ยังเปิดอยู่หลังบันทึก
         *** ไม่แตะ Logic เลขงาน / POST / UNPOST / RPC / SQL ใด ๆ *** */
      if (!isAcc) closeModal();
    } catch (ex) { handleErr(ex); btnBusy(e.target, false); }
  };
}
