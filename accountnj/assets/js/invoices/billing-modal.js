/* ออกวางบิล — หน้าต่างเดียวจบ: DOCUMENT → วางบิล → INVOICE
   ใช้กับ ACCOUNTING > Service และ ACCOUNTING > Advance (โค้ดชุดเดียวกัน)

   ── สิ่งที่ใช้ของเดิมทั้งหมด (ไม่สร้างซ้ำ) ──
   · ข้อมูลงาน      : njacc_job_detail (jobDetail) — Record เดิม ไม่สร้างใหม่
   · คำนวณเงิน      : calcTotals / calcLine ใน invoice-calc.js (สูตรเดิม ไม่แก้)
   · ออก Invoice    : njacc_issue_invoice ผ่าน issueInvoice() — idempotent ด้วย request_id เดิม
   · ลำดับรายการ    : njacc_invoice_items.line_no (มีอยู่แล้ว + UNIQUE(invoice_id,line_no))
   · Modal shell    : components/modal.js (fullscreen + wide) ตัวเดียวกับหน้าอื่น           */

import { jobDetail } from '../jobs/job-api.js';
import { saveInvoiceDraft, invoiceDraftView, postDraftInvoice, unpostToDraft, deleteInvoiceDraft } from './invoice-api.js';
import { calcTotals } from './invoice-calc.js';
import { masters, serviceCodesFor, activeCustomers, vatRateOf, whtRateOf } from '../master/master-cache.js';
import { comboboxHTML, bindCombobox, comboValue } from '../components/combobox.js';
import { AppState } from '../core/state.js';
import { esc, money, ymd, dmy } from '../core/formatter.js';
import { openModal, closeModal, enableEnterNav } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { btnBusy } from '../components/loading.js';
import { handleErr } from '../core/error-handler.js';
import { newRequestId, once } from '../core/request-manager.js';

/* ── ลำดับรายการ = เลขนับต่อเนื่อง 1..N ─────────────────────────────────
   เดิมใช้ระยะห่าง 10 (10/20/30) เพื่อเว้นช่องให้แทรก 15 ได้
   เปลี่ยนเป็นเลขต่อเนื่องตามคำสั่งผู้ใช้ · จัดเลขใหม่ทุกครั้งที่
   เพิ่ม / ลบ / เรียงลำดับ -> ไม่มีเลขขาดช่วงและไม่มีเลขซ้ำได้เลย
   ปลอดภัยกับ DB: njacc_save_invoice_draft ใช้ DELETE ทั้งชุดแล้ว INSERT ใหม่
   (sql/dev/022 บรรทัด 116) จึงไม่ชน UNIQUE(invoice_id,line_no) */
export function renumber(list) {
  list.forEach((it, i) => { it.line_no = i + 1; });
  return list;
}
/* ช่อง CODE แสดงเฉพาะรหัส (เช่น 001) · รายการเลือกโชว์ "CODE | ชื่อบริการ" */
const CODE_DISPLAY = (it) => (it ? (it.code || '') : '');

/* ── ตรวจความถูกต้องของ "ลำดับ" ──
   รับเฉพาะจำนวนเต็มบวก · ห้ามซ้ำใน Invoice เดียวกัน
   คืน { ok, errors[], dupes:Set } — ใช้ทั้งตอนแสดงเตือนและตอนกันไม่ให้ออก Invoice */
export function validateLineNos(items) {
  const errors = [];
  const seen = new Map();
  const dupes = new Set();
  items.forEach((it, i) => {
    const raw = it.line_no;
    const n = Number(raw);
    if (raw === '' || raw == null || !Number.isFinite(n)) {
      errors.push(`แถวที่ ${i + 1}: ลำดับต้องเป็นตัวเลข`);
      return;
    }
    if (!Number.isInteger(n)) { errors.push(`แถวที่ ${i + 1}: ลำดับต้องเป็นจำนวนเต็ม`); return; }
    if (n <= 0) { errors.push(`แถวที่ ${i + 1}: ลำดับต้องมากกว่า 0`); return; }
    if (seen.has(n)) { dupes.add(n); errors.push(`ลำดับ ${n} ซ้ำกัน (แถวที่ ${seen.get(n) + 1} และ ${i + 1})`); }
    else seen.set(n, i);
  });
  return { ok: errors.length === 0, errors: [...new Set(errors)], dupes };
}

/* เรียงตามค่าคอลัมน์ "ลำดับ" น้อย → มาก · ย้ายทั้ง Record ของแถว (ข้อมูลไม่สลับคอลัมน์)
   ค่าที่อ่านไม่ได้ให้ไปท้ายสุด และคงลำดับเดิมภายในกลุ่ม (stable) */
export function sortByLineNo(items) {
  return items
    .map((it, i) => [it, i])
    .sort((a, b) => {
      const x = Number(a[0].line_no), y = Number(b[0].line_no);
      const xf = Number.isFinite(x), yf = Number.isFinite(y);
      if (xf && yf) return x - y || a[1] - b[1];
      if (xf) return -1;
      if (yf) return 1;
      return a[1] - b[1];
    })
    .map(x => x[0]);
}

/* ══ Master Invoice Form — ฟอร์มเดียวของระบบ ══════════════════════════════
   ใช้ทั้ง "ออก INVOICE" (สร้างใหม่) และ "จัดการ > ดู INVOICE" (เปิดใบเดิม)
   *** ไม่มี UI ตัวที่สอง *** — ทุก Action ที่เปิด Record มาที่ฟังก์ชันนี้

   โหมด (ตัดสินจากสถานะจริงที่ Backend คืนมา ไม่เดาฝั่ง browser):
     CREATE        ยังไม่มีใบ            -> ฟอร์มว่าง + ข้อมูลจาก Job
     EDIT_EXISTING มีใบสถานะ DRAFT       -> โหลดข้อมูลเดิมมาแก้ต่อ
     VIEW_POSTED   มีใบสถานะ POSTED      -> โหลดข้อมูลเดิม + ล็อกตาม applyState()

   ของเดิมที่ใช้ต่อทั้งหมด (ไม่สร้างซ้ำ):
     reloadFromBackend() -> njacc_invoice_draft_view (คืนทั้ง DRAFT และ POSTED)
     applyState()        -> สลับปุ่ม/ล็อกฟิลด์ตามสถานะ
     saveInvoiceDraft · postDraftInvoice · unpostToDraft · deleteInvoiceDraft */
export async function openBillingModal({ jobId, charge, onSaved }) {
  await masters();
  const j = await jobDetail(jobId);

  /* ── แทนที่ guard เดิม `if (j.invoice_id) { toast('งานนี้ออก INVOICE แล้ว'); return; }` ──
     guard เดิมบล็อกทุกงานที่มีใบแล้ว ทำให้ "ดู INVOICE" เปิดฟอร์มนี้ไม่ได้เลย
     ของจริงคือฟอร์มนี้รองรับใบเดิมอยู่แล้ว (reloadFromBackend + applyState)
     จึงเปลี่ยนเป็น "ตัดสินโหมดจากสถานะจริง" แทนการปฏิเสธ

     njacc_invoice_draft_view คืนใบสถานะ DRAFT หรือ POSTED เท่านั้น
     ถ้างานมี invoice_id แต่ RPC คืน null = ใบอยู่สถานะที่ฟอร์มนี้จัดการไม่ได้
     (ISSUED จาก route เดิม njacc_issue_invoice หรือ VOID)
     -> ไม่เปิดฟอร์มเปล่าให้เข้าใจผิด แต่บอกผู้ใช้ตรง ๆ และเปิดหน้าดูใบแทน */
  let existing = null;
  try { existing = await invoiceDraftView(jobId); } catch (_) { existing = null; }
  if (!existing && j.invoice_id) {
    toast('ใบนี้ไม่ได้อยู่สถานะร่าง/POSTED — เปิดแบบดูอย่างเดียว', 'err');
    const m = await import('./invoice-modal.js');
    await m.openInvoiceModal({ id: j.invoice_id, onChanged: onSaved });
    return;
  }

  const vatRate = Number(AppState.masters.vat_rate || 7);
  const requestId = newRequestId();       /* คงที่ตลอดหน้า — กดซ้ำไม่สร้าง Invoice ซ้ำ */
  const kindDefault = (charge || j.charge_type) === 'ADVANCE' ? 'ADVANCE' : 'SERVICE';
  /* Service Item Master กลาง (njacc_service_codes) กรองตาม apply_to ของหน้านี้
     ─ ACCOUNTING > Service  → SERVICE + BOTH
     ─ ACCOUNTING > Advance  → ADVANCE + BOTH
     ไม่มี Master แยกคนละชุด · id ของ combobox ใช้เป็น "code" เพื่อให้อ่านค่าได้ตรง */
  const codeItems = () => serviceCodesFor(kindDefault)
    .map(c => ({ id: c.code, code: c.code, name: c.description }));
  const newItem = (n) => ({
    line_no: n, code: '', description: '', qty: '', price: '',
    amount: '', cost: '', charge: '',
    charge_kind: kindDefault, vat_applicable: true, wht_applicable: false,
  });
  let items = [newItem(1)];

  const ro = (v) => `<input class="inp" value="${esc(v ?? '')}" readonly disabled>`;
  const b = document.createElement('div');
  b.innerHTML = `
    <div class="bm-state is-new" id="bm-state"></div>

    <div class="jm-auto">
      <span class="jm-auto-lb">JOB NJ:</span>
      <input class="inp" id="bm-jobno" value="${esc(j.job_no || '-')}" readonly disabled>
      <span class="jm-auto-lb">${kindDefault === 'ADVANCE' ? 'INVOICE ADV:' : 'INVOICE NJ:'}</span>
      <input class="inp" id="bm-invno" value="ยังไม่ได้ออกเลข" readonly disabled>
      <span class="jm-auto-lb">วันที่วางบิล</span>
      <input class="inp jm-auto-date" id="bm-invdate" value="-" readonly disabled>
    </div>

    <div class="jm-sec jm-doc">
      <button type="button" class="jm-sec-t jm-sec-tg" id="bm-doc-tg"
        aria-expanded="false" aria-controls="bm-doc-body">
        <span class="jm-sec-lb">DOCUMENT</span><span class="jm-cav" aria-hidden="true">▸</span>
      </button>
      <div class="jm-sec-body" id="bm-doc-body" hidden>
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>บริษัท Invoice</label>${ro(j.company_invoice)}</div>
        <div class="fld"><label>ลูกค้า</label>${ro(j.customer_name)}</div>
        <div class="fld"><label>Customer Job No.</label>${ro(j.customer_job_no)}</div>
        <div class="fld"><label>เลขใบขนสินค้า</label>${ro(j.customs_declaration_no)}</div>
        <div class="fld"><label>Invoice ต้นทาง (Source)</label>${ro(j.source_invoice_no)}</div>
      </div>
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>House B/L No.</label>${ro(j.house_bl_no)}</div>
        <div class="fld"><label>Master B/L No.</label>${ro(j.master_bl_no)}</div>
        <div class="fld"><label>Booking No.</label>${ro(j.booking_no)}</div>
        <div class="fld"><label>ชื่อเรือ / Vessel</label>${ro(j.vessel_name)}</div>
        <div class="fld"><label>จำนวนตู้</label>${ro(j.qty_container)}</div>
      </div>
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>ETD</label>${ro(dmy(j.etd))}</div>
        <div class="fld"><label>ETA</label>${ro(dmy(j.eta))}</div>
        <div class="fld"><label>วันส่งมอบ</label>${ro(dmy(j.delivery_date))}</div>
        <div class="fld"><label>หมายเหตุ</label>
          <textarea class="inp" id="bm-note" readonly disabled>${esc(j.note || '')}</textarea></div>
        <div class="fld"><label>วันที่งาน</label>${ro(dmy(j.job_date))}</div>
      </div>
      </div>
    </div>

    <div class="jm-sec jm-acc">
      <div class="jm-sec-t">วางบิล</div>
      <div class="jm-grid jm-grid-5">
        <div class="fld"><label>วันที่วางบิล <span class="req">*</span></label>
          <input class="inp" type="date" id="bm-date" value="${ymd(new Date())}"></div>
        <div class="fld"><label>Case</label>
          <input class="inp" id="bm-case" value="${esc(j.case_no || '')}"></div>
        <div class="fld"><label>Contact</label>
          <input class="inp" id="bm-contact" value="${esc(j.contact || '')}"></div>
        <div class="fld"><label>Credit Term (วัน)</label>
          <input class="inp" type="number" min="0" id="bm-term" value="${j.credit_term_days ?? ''}"
            placeholder="เว้นว่าง = ใช้ค่าของลูกค้า"></div>
        <div class="fld"><label>Due Date</label>
          <input class="inp" type="date" id="bm-due" value="${j.due_date || ''}"></div>
      </div>
      <div class="jm-hint" id="bm-due-pv">ระบุวันที่ + ลูกค้า/เทอม เพื่อคำนวณ Due Date</div>
    </div>

    <div class="jm-sec jm-inv">
      <div class="jm-sec-t">INVOICE</div>
      <div class="row mb-2">
        <button type="button" class="btn btn-p btn-sm" id="bm-add">+ เพิ่มรายการ</button>
        <button type="button" class="btn btn-o btn-sm" id="bm-sort">↕ เรียงน้อย → มาก</button>
        <span class="t-xs t-3">พิมพ์เลขในช่อง “ลำดับ” แล้วกดปุ่มนี้ เพื่อจัดใหม่จากน้อยไปมาก แล้วไล่เลขเป็น 1, 2, 3 …</span>
      </div>
      <div class="bm-err" id="bm-err" hidden></div>
      <div class="bm-locked" id="bm-locked" hidden>
        ใบนี้ POST แล้ว — แก้ไขรายการไม่ได้ ต้องกด UNPOST ก่อน</div>
      <div class="tbl-wrap bm-wrap"><table class="tbl bm-items">
        <colgroup>
          <col class="c-seq"><col class="c-code"><col class="c-desc"><col class="c-kind">
          <col class="c-qty"><col class="c-price"><col class="c-amount"><col class="c-act">
        </colgroup>
        <thead><tr>
        <th class="center">ลำดับ</th><th>CODE</th>
        <th>DESCRIPTION</th><th>ประเภท</th>
        <th class="r">QTY</th><th class="r">PRICE</th>
        <th class="r">AMOUNT</th><th class="center">ลบ</th>
      </tr></thead><tbody id="bm-tbody"></tbody></table></div>
      <div class="bm-sum">
        <div class="r-line"><span>Subtotal</span><span id="bm-sub">0.00</span></div>
        <div class="r-line"><span>VAT ${vatRate}%</span><span id="bm-vat">0.00</span></div>
        <div class="r-line"><span>WHT</span><span id="bm-wht">0.00</span></div>
        <div class="r-line total"><span>Grand Total</span><span id="bm-total">0.00</span></div>
      </div>
    </div>`;

  const f = document.createElement('div');
  f.style.display = 'contents';   /* ให้ปุ่มเป็นลูกของ .modal-f โดยตรง → flex แถวเดียวทำงาน */
  /* ── Footer ──
     ซ้าย : ปุ่ม destructive / ย้อนสถานะ  (ลบร่าง · UNPOST)
     ขวา  : ปุ่มหลักเรียงตามลำดับ         Print Draft -> POST -> บันทึกร่าง
     ✕ ปิด อยู่ขวาสุดตาม Layout เดิมของ Modal

     *** ไม่มีปุ่ม Preview แยกแล้ว ***
     Preview ถูกรวมเข้า Flow ของ Print Draft (กด -> เห็น Preview -> กด Print ในนั้น)
     ฟังก์ชัน Preview เดิม (openDraftDoc) ยังอยู่ ไม่ได้ลบ */
  f.innerHTML = `
    <div class="mf-left">
      <button class="btn btn-del"  id="bm-del"     hidden>🗑 <span>ลบร่าง</span></button>
      <button class="btn btn-unpost" id="bm-unpost" hidden>↩ <span>UNPOST</span></button>
    </div>
    <div class="mf-right">
      <button class="btn btn-prn"  id="bm-print"   disabled>🖨 <span>Print Draft</span></button>
      <button class="btn btn-post" id="bm-post"    disabled>⬆ <span>POST</span></button>
      <button class="btn btn-save" id="bm-draft"          >💾 <span>บันทึกร่าง</span></button>
      <button class="btn btn-gray" data-close             >✕ <span>ปิด</span></button>
    </div>`;
  /* หัวหน้าต่างบอกโหมด — โครงหน้าต่าง/เนื้อหาเหมือนกันทุกโหมด
     *** ต้องอัปเดตได้หลัง POST/UNPOST *** จึงทำเป็นฟังก์ชัน ไม่ใช่ค่าคงที่ตอนเปิด */
  const titleOf = (doc) => !doc ? 'ออกวางบิล'
    : (doc.status === 'POSTED'
        ? 'INVOICE ' + (doc.invoice_no || '') + ' (POSTED)'
        : 'แก้ไขใบวางบิล (ร่าง)');
  /* cls:'modal-flow' = Layout "กรอบเดียว" ชุดกลางตัวเดียวกับ DOCUMENT (job-form.js)
     กรอบหลัก 1 ชั้น · Section ภายในไม่มี Card ซ้อน · Scroll Owner ชุดเดียว (backdrop)
     *** ไม่สร้าง CSS/Renderer ชุดใหม่ *** ใช้ modifier เดิมที่มีอยู่แล้วใน ui.css
     Business Logic / RPC / ปุ่ม POST · UNPOST · บันทึกร่าง · ลบร่าง · Print Draft ไม่เปลี่ยน */
  openModal({ title: titleOf(existing), body: b, footer: f, fullscreen: true, wide: true, cls: 'modal-flow' });
  /* ปุ่มถูก append เข้า .modal-f → ใส่ modifier ที่ตัวจริงเพื่อให้เป็นแถวเดียว */
  document.querySelector('#nj-modal .modal-f').classList.add('mf-row');
  /* เปิด Modal แล้วต้องเห็นส่วน DOCUMENT ก่อนเสมอ — กันกรณี browser คืน scroll ตำแหน่งเดิม
     modal-flow ย้าย Scroll Owner ไปที่ backdrop (#nj-modal) แล้ว จึงรีเซ็ตทั้งสองตัว
     ตัวที่ไม่ได้ scroll การตั้ง scrollTop=0 ไม่มีผลข้างเคียงใด ๆ */
  /* Enter = ไปช่องถัดไป (helper กลางใน components/modal.js) — ไม่แตะ Save Draft / POST */
  enableEnterNav(b);
  const mbk = document.getElementById('nj-modal');
  if (mbk) mbk.scrollTop = 0;
  const mb = document.querySelector('#nj-modal .modal-b');
  if (mb) mb.scrollTop = 0;

  const q = (s) => b.querySelector(s);
  const tbody = q('#bm-tbody');

  /* ── DOCUMENT: พับ/ขยายได้ · Default = พับเสมอ ───────────────────────────
     openBillingModal() ถูกเรียกใหม่ทุกครั้งที่เปิดงาน (เปิดใหม่ / ดู / แก้ไข /
     เปลี่ยนงาน / ปิดแล้วเปิดใหม่) และ markup ตั้ง hidden + aria-expanded="false"
     ไว้ตั้งแต่ต้น -> เข้าใหม่ได้สถานะพับเสมอ
     *** ไม่เก็บสถานะที่ไหนเลย *** ไม่ใช้ localStorage / sessionStorage / module state
     ── พับ = ซ่อนเฉพาะ .jm-sec-body เท่านั้น ──
     หัวข้อ DOCUMENT ยังอยู่ · DOM ของ field ยังอยู่ครบ (ใช้ [hidden] ไม่ได้ถอด node)
     -> ข้อมูลไม่หาย · ไม่ reload · ไม่แตะ payload ของ saveInvoiceDraft/postDraftInvoice
     Section "วางบิล" และ "INVOICE" ไม่มี toggle -> เปิดแสดงตลอดตามข้อกำหนด */
  const docTg = q('#bm-doc-tg'), docBody = q('#bm-doc-body');
  if (docTg && docBody) {
    const setDoc = (open) => {
      docBody.hidden = !open;
      docTg.setAttribute('aria-expanded', open ? 'true' : 'false');
      const cav = docTg.querySelector('.jm-cav');
      if (cav) cav.textContent = open ? '▾' : '▸';
    };
    setDoc(false);                                  /* บังคับพับทุกครั้งที่เปิด */
    docTg.addEventListener('click', () => setDoc(docBody.hidden));
    /* <button> รองรับ Enter/Space เป็นค่าเริ่มต้นของเบราว์เซอร์อยู่แล้ว — ไม่ต้องผูกเพิ่ม */
  }

  /* ── ยืนยันแบบ inline ในตัว Modal เอง ──
     ใช้แทน confirmModal/reasonModal เพราะ openModal() เรียก closeModal() ก่อนเสมอ
     → เปิด modal ซ้อนจะทำให้ Modal ออกวางบิลถูกทำลายทิ้ง
     (ไม่แก้ components/modal.js เพื่อไม่ให้กระทบหน้าอื่นที่ใช้ร่วมกัน) */
  function askInline(msg, { reason = false, okLabel = 'ยืนยัน', danger = false } = {}) {
    return new Promise((res) => {
      const bar = document.createElement('div');
      bar.className = 'bm-ask' + (danger ? ' bm-ask-danger' : '');
      bar.setAttribute('data-enter-skip', '');   /* แถบยืนยัน — ไม่เข้าลำดับ Enter-nav */
      bar.innerHTML = `<div class="bm-ask-msg">${msg}</div>
        ${reason ? '<input class="inp" id="bm-ask-reason" placeholder="ระบุเหตุผล (จำเป็น)">' : ''}
        <div class="bm-ask-act">
          <button class="btn btn-gray btn-sm" data-no>ยกเลิก</button>
          <button class="btn ${danger ? 'btn-del' : 'btn-save'} btn-sm" data-yes>${esc(okLabel)}</button>
        </div>`;
      b.prepend(bar);
      const rIn = bar.querySelector('#bm-ask-reason');
      if (rIn) rIn.focus(); else bar.querySelector('[data-yes]').focus();
      const done = (v) => { bar.remove(); res(v); };
      bar.querySelector('[data-no]').onclick = () => done(null);
      bar.querySelector('[data-yes]').onclick = () => {
        if (reason) {
          const v = (rIn.value || '').trim();
          if (!v) { rIn.classList.add('inp-bad'); rIn.focus(); return; }
          done(v);
        } else done(true);
      };
    });
  }

  /* ── Due Date: วันที่วางบิล + Credit Term ──
     ลำดับความสำคัญตาม logic เดิมของระบบ: กรอก Due เอง > เทอมที่กรอก > Credit Term ของลูกค้า
     (ระบบเดิมอนุญาต Override ด้วยการกรอก Due Date เอง — คงพฤติกรรมนั้นไว้) */
  const custTerm = () => {
    const c = activeCustomers().find(x => x.id === j.customer_id)
      || (AppState.masters.customers || []).find(x => x.id === j.customer_id);
    return c ? c.credit_term_days : null;
  };
  function updDue() {
    const pv = q('#bm-due-pv');
    const manual = q('#bm-due').value;
    if (manual) { pv.textContent = 'Due Date: ' + dmy(manual) + ' (กำหนดเอง)'; delete pv.dataset.calc; return; }
    const base = q('#bm-date').value;
    const term = q('#bm-term').value !== '' ? Number(q('#bm-term').value) : custTerm();
    if (base && term != null) {
      const d = new Date(base + 'T00:00:00'); d.setDate(d.getDate() + Number(term));
      pv.textContent = 'Due Date (คำนวณ): ' + dmy(ymd(d)) + ' · วันที่วางบิล + เทอม ' + term + ' วัน';
      pv.dataset.calc = ymd(d);
    } else { pv.textContent = 'ระบุวันที่ + ลูกค้า/เทอม เพื่อคำนวณ Due Date'; delete pv.dataset.calc; }
  }
  ['#bm-date', '#bm-term', '#bm-due'].forEach(s => q(s).addEventListener('input', updDue));
  /* ผู้ใช้แก้ "วันที่วางบิล" -> แถวหัวต้องสะท้อนค่าที่กรอกจริงทันที (ยังไม่ POST ก็เห็น) */
  q('#bm-date').addEventListener('input', () => {
    const el = b.querySelector('#bm-invdate');
    if (el) el.value = q('#bm-date').value ? dmy(q('#bm-date').value) : '-';
  });
  if (q('#bm-term').value === '' && custTerm() != null) q('#bm-term').value = custTerm();
  updDue();

  /* ── ตารางรายการ ── */
  function rowHTML(it, i, dupes) {
    /* ตัวเลขใช้ class .r (ชิดขวา + tabular-nums จาก CSS) ไม่ใช้ inline style ทับ */
    const num = (k, extra = '') => `<input class="inp r" data-k="${k}" type="number" step="0.01" min="0"
      value="${it[k] ?? ''}" ${extra}>`;
    const bad = dupes.has(Number(it.line_no)) ? ' inp-bad' : '';
    return `<tr data-i="${i}">
      <td class="center"><input class="inp bm-seq${bad}" data-k="line_no" type="number" min="1" step="1"
        value="${it.line_no ?? ''}"></td>
      <td>${comboboxHTML('bm-code-' + i, codeItems(), it.code || '', 'ค้นหา CODE / ชื่อบริการ', CODE_DISPLAY)}</td>
      <td><input class="inp" data-k="description" value="${esc(it.description || '')}"
        placeholder="รายละเอียดบริการ"></td>
      <td><select class="sel" data-k="charge_kind">
        <option value="SERVICE" ${it.charge_kind !== 'ADVANCE' ? 'selected' : ''}>Service</option>
        <option value="ADVANCE" ${it.charge_kind === 'ADVANCE' ? 'selected' : ''}>Receipt</option>
      </select></td>
      <td>${num('qty')}</td>
      <td>${num('price')}</td>
      <td>${num('amount', 'data-calc')}</td>
      <td class="center"><button type="button" class="btn btn-danger-soft btn-sm" data-del title="ลบรายการนี้">🗑</button></td>
    </tr>`;
  }
  function draw() {
    const { dupes } = validateLineNos(items);
    tbody.innerHTML = items.map((it, i) => rowHTML(it, i, dupes)).join('');
    /* ผูก combobox CODE ทีละแถว · เลือกแล้ว Auto-fill Description จาก Master
       Description ยังพิมพ์แก้ได้อิสระ และไม่ย้อนกลับไปแก้ Master */
    items.forEach((it, i) => {
      bindCombobox(tbody, 'bm-code-' + i, {
        getItems: codeItems,
        display: CODE_DISPLAY,
        codeFirst: true,
        canCreate: false,
        emptyHint: 'เพิ่มรายการบริการได้ที่ SYSTEM > ตั้งค่ารายการบริการ',
        onChange: (code) => onCodePicked(i, code),
      });
    });
    recalc();
  }
  /* เลือก CODE → เติม Description จาก Master (ถ้าช่องยังว่าง หรือยังเป็นค่าที่เติมอัตโนมัติ)
     ถ้าผู้ใช้แก้ข้อความเองแล้ว จะไม่ถูกเขียนทับ */
  function onCodePicked(i, code) {
    const tr = tbody.querySelector(`tr[data-i="${i}"]`);
    if (!tr) return;
    const c = serviceCodesFor(kindDefault).find(x => x.code === code);
    if (!c) { recalc(); return; }
    const dsc = tr.querySelector('[data-k="description"]');
    if (!dsc.value.trim() || items[i]?._autoDesc !== false) {
      dsc.value = c.description;
      if (items[i]) items[i]._autoDesc = true;
    }
    /* ── เลือก CODE แล้วเกิดผล 2 อย่าง ──
       1) Description  เติมจาก Service Master
       2) VAT / WHT    ดึงอัตราจาก Service Master มาใช้กับบรรทัดนี้ (Tax Master)
       ── ยังห้ามเติม Qty / Price / Amount / Cost / Charge ── ผู้ใช้กรอกเอง
       → ตัวเลขที่ผู้ใช้กรอกไว้แล้วไม่ถูกเปลี่ยนเมื่อเลือก CODE ใหม่
       อัตราถูกเก็บไว้กับบรรทัด แล้วส่งขึ้น RPC พร้อม payload
       การคำนวณเกิดที่ calcLine() รอบเดียว ไม่คิดซ้ำ */
    if (items[i]) {
      items[i].vat_rate = vatRateOf(c);
      items[i].wht_rate = whtRateOf(c);
      items[i].vat_applicable = items[i].vat_rate > 0;
      items[i].wht_applicable = items[i].wht_rate > 0;
    }
    recalc();
  }
  function readRow(tr, i) {
    const g = (k) => tr.querySelector(`[data-k="${k}"]`);
    const prev = items[i] || {};
    const qty = g('qty').value === '' ? '' : Number(g('qty').value);
    const price = g('price').value === '' ? '' : Number(g('price').value);
    let amount = g('amount').value === '' ? '' : Number(g('amount').value);
    /* Qty × Price → Amount (ตัวช่วยกรอก) · Qty ว่าง = คิดเป็น 1
       ถ้าผู้ใช้พิมพ์ Amount เองจะไม่ทับ
       qty / price ถูกส่งเข้า RPC และเก็บลง njacc_invoice_items.qty / unit_price */
    const qtyCalc = qty === '' ? 1 : qty;
    if (price !== '' && prev._autoAmt !== false) {
      amount = Math.round(qtyCalc * price * 100) / 100;
      /* เขียนค่ากลับลงช่อง Amount ให้ผู้ใช้เห็น (ไม่แตะช่องที่กำลังพิมพ์อยู่) */
      if (g('amount') !== document.activeElement) g('amount').value = amount;
    }
    items[i] = {
      ...prev,
      line_no: g('line_no').value === '' ? '' : Number(g('line_no').value),
      /* CODE อยู่ใน combobox (ไม่มี data-k) → อ่านจาก .cbx-inp ของแถวนั้น */
      code: comboValue(tr.querySelector('.cbx-inp')) || null,
      description: g('description').value.trim(),
      charge_kind: g('charge_kind').value === 'ADVANCE' ? 'ADVANCE' : 'SERVICE',
      qty, price,
      amount: amount === '' ? '' : Number(amount),
      /* Cost / Charge ไม่มีช่องกรอกในตารางแล้ว (ตามสัดส่วนคอลัมน์ที่กำหนด)
         แต่ยังเก็บค่าของแถวไว้และส่งขึ้น RPC เหมือนเดิม — ไม่ล้างข้อมูลทิ้ง */
      cost: prev.cost,
      charge: prev.charge,
      vat_applicable: prev.vat_applicable !== false,
      wht_applicable: !!prev.wht_applicable,
      /* อัตราภาษีของบรรทัด (มาจาก Service Master) — คงไว้ระหว่างพิมพ์/เรียงลำดับ */
      vat_rate: prev.vat_rate,
      wht_rate: prev.wht_rate,
    };
    if (amount !== '' && g('amount').value !== '' && Number(g('amount').value) !== amount)
      items[i]._autoAmt = false;
  }
  function showErrors(list) {
    const box = q('#bm-err');
    if (!list.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.innerHTML = '<b>ตรวจสอบลำดับรายการ</b><ul>' + list.map(e => `<li>${esc(e)}</li>`).join('') + '</ul>';
  }
  function recalc() {
    tbody.querySelectorAll('tr').forEach(tr => readRow(tr, Number(tr.dataset.i)));
    const priced = items.filter(x => Number(x.amount) > 0 || x.description);
    const t = calcTotals(priced.map(x => ({ ...x, amount: Number(x.amount) || 0 })), vatRate);
    q('#bm-sub').textContent = money(t.sub);
    q('#bm-vat').textContent = money(t.vat);
    q('#bm-wht').textContent = money(t.wht);
    q('#bm-total').textContent = money(t.total);
    showErrors(validateLineNos(items).errors);
    return t;
  }
  tbody.addEventListener('input', (e) => {
    if (e.target.closest('[data-k="description"]')) {
      const i = Number(e.target.closest('tr').dataset.i);
      if (items[i]) items[i]._autoDesc = false;   /* พิมพ์เอง → ไม่ถูก Master เขียนทับ */
    }
    if (e.target.closest('[data-k="amount"]')) {
      const i = Number(e.target.closest('tr').dataset.i);
      if (items[i]) items[i]._autoAmt = false;   /* พิมพ์ Amount เอง → หยุดคำนวณจาก Qty×Price */
    }
    recalc();
  });
  tbody.addEventListener('change', () => recalc());
  tbody.addEventListener('click', (e) => {
    const del = e.target.closest('[data-del]'); if (!del) return;
    const i = Number(del.closest('tr').dataset.i);
    tbody.querySelectorAll('tr').forEach(tr => readRow(tr, Number(tr.dataset.i)));
    items.splice(i, 1);
    if (!items.length) items.push(newItem(1));
    renumber(items);                        /* ลบแล้วต้องไม่เหลือเลขขาดช่วง (1,2,4,5 -> 1,2,3,4) */
    draw();
  });

  /* เพิ่มรายการใหม่ = ต่อท้ายด้วยเลขถัดไป (มี 6 รายการ -> รายการใหม่ = 7) */
  q('#bm-add').onclick = () => {
    tbody.querySelectorAll('tr').forEach(tr => readRow(tr, Number(tr.dataset.i)));
    items.push(newItem(items.length + 1));
    renumber(items);                        /* กันกรณีผู้ใช้พิมพ์เลขเองจนไม่ต่อเนื่อง */
    draw();
    const last = tbody.querySelector('tr:last-child [data-k="description"]');
    if (last) last.focus();
  };
  /* เรียงน้อย → มาก แล้วไล่เลขใหม่เป็น 1..N (ปุ่มเดิม #bm-sort · ฟังก์ชันเดิม sortByLineNo) */
  q('#bm-sort').onclick = () => {
    tbody.querySelectorAll('tr').forEach(tr => readRow(tr, Number(tr.dataset.i)));
    const v = validateLineNos(items);
    items = renumber(sortByLineNo(items));
    draw();
    toast(v.ok ? 'เรียงลำดับใหม่เป็น 1–' + items.length + ' แล้ว'
               : 'เรียงและไล่เลขใหม่แล้ว — ตรวจลำดับที่กรอกไว้อีกครั้ง', v.ok ? 'ok' : 'err');
  };

  /* ══ Flow: บันทึกร่าง → Preview → Print Draft → POST ══
     ทุกขั้นเรียก Backend จริง ไม่มีสถานะปลอมใน browser */
  let draftId = null;
  let invStatus = null;
  let lastDoc = existing || null;   /* เอกสารล่าสุดจาก Backend — ใช้ตั้งหัวหน้าต่าง/แถบสถานะ */      /* null = ยังไม่มีใบ · 'DRAFT' · 'POSTED' — มาจาก Backend เท่านั้น */

  const B = (sel) => f.querySelector(sel);

  /* สลับปุ่มตามสถานะจริงของใบ (ไม่เดาสถานะฝั่ง browser)
       DRAFT  : ลบร่าง · บันทึกร่าง · Preview · Print Draft · POST · ปิด
       POSTED : Preview · Print Invoice · ปิด · UNPOST (ขวาสุด)
     ปุ่มที่ไม่ใช่ของสถานะนั้นถูก hidden ไม่ใช่แค่ disabled */
  function applyState(id, status, doc) {
    draftId = id;
    invStatus = status || (id ? 'DRAFT' : null);
    const posted = invStatus === 'POSTED';
    const hasDoc = !!id;

    /* ── ผลลัพธ์ต้องเห็นบนหน้าจอทันทีหลัง POST/UNPOST (ข้อ 5/9) ──
       เดิมหัวหน้าต่างถูกตั้งครั้งเดียวตอนเปิด Modal
       -> POST สำเร็จแล้วหัวยังเขียนว่า "ร่าง" ผู้ใช้จึงเข้าใจว่าไม่มีอะไรเกิดขึ้น
       ตอนนี้อัปเดตทั้งหัวหน้าต่างและแถบสถานะจากข้อมูลจริงที่ Backend คืนมา */
    if (doc !== undefined) lastDoc = doc;
    const h3 = document.querySelector('#nj-modal .modal-h h3');
    if (h3) h3.textContent = titleOf(lastDoc);
    /* ── เลขเอกสาร + วันที่เอกสาร บนหัวฟอร์ม ──────────────────────────────
       เลข: ใช้ doc.invoice_no ที่ Backend คืนมาเท่านั้น
            DRAFT-xxxx = เลขร่างชั่วคราว ไม่ใช่เลขจริง -> ไม่เอามาแสดง
            เลขจริงออกตอน POST: SERVICE = NJ{YYYYMM}-##### · ADVANCE = ADV{YYYYMM}-#####
       วันที่: doc.invoice_date = "วันที่วางบิล" ที่ผู้ใช้กรอก (#bm-date)
               *** ไม่ใช้ posted_at / issued_at / วันปัจจุบัน *** */
    const realNo = lastDoc && lastDoc.invoice_no && !/^DRAFT-/.test(lastDoc.invoice_no)
      ? lastDoc.invoice_no : null;
    const invNoEl = b.querySelector('#bm-invno');
    if (invNoEl) invNoEl.value = realNo || 'ยังไม่ได้ออกเลข';
    const invDtEl = b.querySelector('#bm-invdate');
    if (invDtEl) {
      const d = (lastDoc && lastDoc.invoice_date) || q('#bm-date').value || '';
      invDtEl.value = d ? dmy(d) : '-';
    }
    const bar = b.querySelector('#bm-state');
    if (bar) {
      const no = realNo;
      bar.className = 'bm-state ' + (posted ? 'is-posted' : (hasDoc ? 'is-draft' : 'is-new'));
      bar.innerHTML = posted
        ? `<span class="bm-state-b">POSTED</span>
           <span>เลขที่ INVOICE <b>${esc(no || '-')}</b></span>
           <span class="bm-state-n">เข้าคิว ${kindDefault === 'ADVANCE'
             ? 'FINANCE › Advance (รอจ่าย/เคลียร์)' : 'FINANCE › Receipt (รอรับชำระ)'} แล้ว
             · แก้ไขต่อได้ต้องกด UNPOST ก่อน</span>`
        : (hasDoc
          ? `<span class="bm-state-b">ร่าง</span>
             <span class="bm-state-n">ยังไม่ออกเลข INVOICE จริง · กด POST เพื่อออกเลขและส่งเข้าคิวถัดไป</span>`
          : `<span class="bm-state-b">ยังไม่บันทึก</span>
             <span class="bm-state-n">กรอกรายการแล้วกดบันทึกร่าง</span>`);
    }

    B('#bm-del').hidden = posted || !hasDoc;
    B('#bm-draft').hidden = posted;
    B('#bm-post').hidden = posted;
    B('#bm-unpost').hidden = !posted;

    B('#bm-print').disabled = !hasDoc;
    B('#bm-post').disabled = !hasDoc;

    /* ปุ่มพิมพ์เปลี่ยนป้ายตามสถานะ · ไม่ตรวจว่ามีเครื่องพิมพ์หรือไม่
       ── ต้องเช็ค null ──
       btnBusy() เขียนทับ innerHTML ของปุ่มด้วยข้อความ "กำลังทำรายการ…" ชั่วคราว
       ถ้า applyState ถูกเรียกในจังหวะนั้น (Print -> doSaveDraft -> setDraftState)
       <span> จะยังไม่ถูกคืนค่า -> querySelector('span') เป็น null และ throw
       ป้ายจะถูกตั้งใหม่อีกครั้งเมื่อ btnBusy(btn,false) คืน innerHTML เดิม */
    const prnLabel = B('#bm-print').querySelector('span');
    if (prnLabel) prnLabel.textContent = posted ? 'Print Invoice' : 'Print Draft';

    /* POSTED = แก้ไขรายการไม่ได้แล้ว ต้อง UNPOST ก่อน */
    b.querySelectorAll('#bm-tbody input, #bm-tbody select, #bm-add, #bm-sort')
      .forEach(el => { el.disabled = posted; });
    const hint = b.querySelector('#bm-locked');
    if (hint) hint.hidden = !posted;
  }
  const setDraftState = (id) => applyState(id, 'DRAFT');

  /* เก็บข้อมูลจากฟอร์มเป็น payload ของ njacc_save_invoice_draft */
  function collect(requireItems) {
    recalc();
    const v = validateLineNos(items);
    if (!v.ok) { showErrors(v.errors); toast('แก้ลำดับรายการให้ถูกต้องก่อน', 'err'); return null; }
    if (!q('#bm-date').value) { toast('ระบุวันที่วางบิล', 'err'); return null; }
    const ordered = sortByLineNo(items);
    const valid = ordered.filter(x => x.description && Number(x.amount) > 0);
    const partial = ordered.filter(x => x.description || Number(x.amount) > 0);
    if (valid.length !== partial.length) {
      toast('มีรายการที่กรอกไม่ครบ (ขาดรายละเอียดหรือจำนวนเงิน)', 'err'); return null;
    }
    if (requireItems && !valid.length) {
      toast('ต้องมีรายการอย่างน้อย 1 รายการ', 'err'); return null;
    }
    const due = q('#bm-due').value || q('#bm-due-pv').dataset.calc || null;
    return {
      job_id: jobId,
      invoice_date: q('#bm-date').value || null,
      due_date: due,
      /* Contract ของ njacc_save_invoice_draft(p->'items')
         line_no → line_no · qty → qty · price → unit_price · amount → amount
         vat_rate/wht_rate = snapshot ของบรรทัด (มาจาก Service Master ตอนเลือก CODE) */
      items: valid.map(x => ({
        line_no: Number(x.line_no),
        code: x.code,
        description: x.description,
        qty: x.qty === '' || x.qty == null ? null : Number(x.qty),
        price: x.price === '' || x.price == null ? null : Number(x.price),
        amount: Number(x.amount),
        cost: Number(x.cost) || 0,
        charge: Number(x.charge) || 0,
        charge_kind: x.charge_kind,
        vat_applicable: x.vat_applicable !== false,
        wht_applicable: !!x.wht_applicable,
        vat_rate: x.vat_rate == null || x.vat_rate === '' ? null : Number(x.vat_rate),
        wht_rate: x.wht_rate == null || x.wht_rate === '' ? null : Number(x.wht_rate),
      })),
    };
  }

  async function doSaveDraft(btn, silent) {
    const p = collect(false); if (!p) return null;
    if (btn) btnBusy(btn, true);
    try {
      const res = await saveInvoiceDraft(p);
      setDraftState(res.id);
      if (!silent) toast('บันทึกร่างแล้ว (' + res.items + ' รายการ)', 'ok');
      return res;
    } catch (ex) { handleErr(ex); return null; }
    finally { if (btn) btnBusy(btn, false); }
  }

  f.querySelector('#bm-draft').onclick = (e) => doSaveDraft(e.target, false);

  /* ลบร่าง — ลบจริงที่ Backend แล้วปิด Modal (ใบที่ POST แล้วลบไม่ได้ · RPC บล็อกอีกชั้น) */
  f.querySelector('#bm-del').onclick = async (e) => {
    if (!draftId) return;
    const reason = await askInline('<b>ลบร่างใบแจ้งหนี้</b> — ลบแล้วกู้คืนไม่ได้',
      { reason: true, okLabel: 'ลบร่าง', danger: true });
    if (!reason) return;
    btnBusy(e.target, true);
    try {
      await once('bm-del-' + draftId, () => deleteInvoiceDraft(draftId, reason));
      closeModal();
      toast('ลบร่างแล้ว', 'ok');
      if (typeof onSaved === 'function') onSaved();
    } catch (ex) { handleErr(ex); btnBusy(e.target, false); }
  };

  /* UNPOST — POSTED → DRAFT ที่ Backend จริง แล้วโหลดสถานะกลับมา
     ไม่ปิด Modal · Footer กลับเป็น DRAFT · เลข Invoice เดิมถูกเก็บไว้ */
  f.querySelector('#bm-unpost').onclick = async (e) => {
    if (!draftId) return;
    const reason = await askInline('<b>UNPOST ใบแจ้งหนี้</b> — กลับเป็นร่างเพื่อแก้ไขต่อ ' +
      '(เลข INVOICE เดิมถูกเก็บไว้ · POST อีกครั้งจะใช้เลขเดิม)',
      { reason: true, okLabel: 'UNPOST' });
    if (!reason) return;
    btnBusy(e.target, true);
    try {
      await once('bm-unpost-' + draftId, () => unpostToDraft(draftId, reason, newRequestId()));
      await reloadFromBackend();
      toast('UNPOST แล้ว — กลับเป็นร่าง แก้ไขต่อได้ (เลข INVOICE เดิมถูกเก็บไว้)', 'ok');
      if (typeof onSaved === 'function') onSaved();
    } catch (ex) { handleErr(ex); }
    finally { btnBusy(e.target, false); }
  };

  /* Preview / Print Draft — บันทึกร่างล่าสุดก่อน แล้วอ่านกลับจาก Backend
     ใช้ renderer เดียวกับใบจริง (invoice-doc.js) · ไม่เปลี่ยนสถานะ · ไม่ POST อัตโนมัติ */
  async function openDraftDoc(btn) {
    const posted = invStatus === 'POSTED';
    /* ── ร่าง ──
       บันทึกร่างล่าสุดก่อน เพื่อให้ Preview ตรงกับที่กรอกอยู่บนจอ
       ── POSTED ──
       *** ห้าม Save Draft *** ใบที่ POST แล้วต้องไม่ถูกเขียนกลับเป็นร่าง
       อ่านเอกสารจริงจาก Backend แล้ว Preview ตรง ๆ */
    if (!posted) {
      if (!(await doSaveDraft(btn, true))) return;
    } else if (btn) { btnBusy(btn, true); }
    try {
      const doc = await invoiceDraftView(jobId);
      if (!doc) { toast(posted ? 'ไม่พบเอกสาร' : 'ยังไม่มีร่าง', 'err'); return; }
      const m = await import('./invoice-doc.js');
      /* draft = ตามสถานะจริงของใบ · ไม่ส่ง print -> เห็น Preview ก่อนเสมอ */
      m.openInvoiceDoc(doc, { draft: !posted });
    } catch (ex) { handleErr(ex); }
    finally { if (posted && btn) btnBusy(btn, false); }
  }
  /* Print Draft / Print Invoice — เปิด Preview ก่อนเสมอ
     ผู้ใช้ตรวจเอกสารแล้วจึงกดปุ่ม Print ในหน้า Preview เอง
     *** ไม่ส่ง print:true *** เพื่อไม่ให้ Print Dialog เด้งทันที */
  f.querySelector('#bm-print').onclick = (e) => openDraftDoc(e.target);

  /* POST — atomic + idempotent ที่ Backend · เลข Invoice จริงถูกดึงตอนนี้เท่านั้น */
  f.querySelector('#bm-post').onclick = async (e) => {
    const saved = await doSaveDraft(e.target, true); if (!saved) return;
    if (!saved.items) { toast('ต้องมีรายการอย่างน้อย 1 รายการ', 'err'); return; }
    const ok = await askInline(
      `<b>ยืนยัน POST</b> — ${saved.items} รายการ · Grand Total <b>${money(saved.total_amount)}</b> บาท<br>` +
      `ระบบจะออกเลข INVOICE จริง และงานจะเข้าคิว <b>` +
      (kindDefault === 'ADVANCE' ? 'FINANCE &gt; Advance' : 'FINANCE &gt; Receipt') + '</b>',
      { okLabel: 'POST' });
    if (!ok) return;
    btnBusy(e.target, true);
    try {
      const res = await once('bm-post-' + saved.id, () => postDraftInvoice(saved.id, requestId));
      await reloadFromBackend();
      toast('POST สำเร็จ — INVOICE ' + res.invoice_no + ' · งานเข้าคิว ' +
        (kindDefault === 'ADVANCE' ? 'FINANCE › Advance' : 'FINANCE › Receipt'), 'ok');
      if (typeof onSaved === 'function') onSaved();
    } catch (ex) { handleErr(ex); }
    finally { btnBusy(e.target, false); }
  };

  /* โหลดสถานะและรายการจาก Backend — เรียกตอนเปิด Modal · หลัง POST · หลัง UNPOST
     สถานะที่แสดงมาจาก njacc_invoice_draft_view เท่านั้น ไม่ได้ตั้งเองใน browser
     → Refresh หน้าแล้วสถานะยังถูกต้อง เพราะอ่านจาก DB ใหม่ทุกครั้ง */
  async function reloadFromBackend() {
    try {
      const doc = await invoiceDraftView(jobId);
      if (!doc) { applyState(null, null, null); return; }
      applyState(doc.id, doc.status, doc);
      if (doc.invoice_date) q('#bm-date').value = doc.invoice_date;
      if (doc.due_date) q('#bm-due').value = doc.due_date;
      const list = (doc.items || []).map(x => ({
        line_no: x.line_no, code: x.code, description: x.description,
        qty: x.qty ?? '', price: x.unit_price ?? '', amount: x.amount,
        cost: x.cost, charge: x.charge, charge_kind: x.charge_kind,
        vat_rate: x.vat_rate, wht_rate: x.wht_rate,
        vat_applicable: Number(x.vat_rate) > 0, wht_applicable: Number(x.wht_rate) > 0,
        _autoAmt: false, _autoDesc: false,
      }));
      if (list.length) {
        items = list;
        /* ใบเก่าที่บันทึกไว้เป็น 10/20/30 -> แปลงเป็น 1..N ให้ตรงกติกาใหม่
           *** เฉพาะใบที่ยังแก้ไขได้ (ยังไม่ POST) ***
           ใบที่ POST แล้วเป็นเอกสารที่ออกไปแล้ว ต้องแสดงเลขตรงกับที่เก็บใน DB
           และตรงกับใบที่พิมพ์ออกไป จึงห้ามไล่เลขใหม่ */
        if (doc.status !== 'POSTED') renumber(items);
        draw();
      }
      applyState(doc.id, doc.status, doc);   /* draw() สร้าง input ใหม่ → ต้องล็อกซ้ำถ้า POSTED */
      updDue();
    } catch (ex) { handleErr(ex); }
  }
  reloadFromBackend();

  draw();
}
