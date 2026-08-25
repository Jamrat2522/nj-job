/* ══════════════════════════════════════════════════════════════════════════
   DOCUMENT > Job Form — แบบฟอร์มรายละเอียดงาน A4 (พิมพ์ / Save PDF)

   ── ที่มาของข้อมูล (ตรวจจาก Source จริง ไม่ได้เดาชื่อ field) ──
     jobDetail(id) -> RPC njacc_job_detail  (jobs/job-api.js)
     คืน to_jsonb(njacc_jobs) + customer_name + company_invoice
     คอลัมน์จริงของ njacc_jobs ที่ใช้ในฟอร์มนี้:
       job_no · customer_name · company_invoice · customs_declaration_no
       qty_container · customer_job_no · cs_name
     คอลัมน์เอกสารงาน (เพิ่มโดย RUN-01_ADD_JOB_DOCUMENT_FIELDS.sql):
       lift_on_wharf_flag/note · storage_charge_flag/note ·
       overtime_flag/date/slot_1..3 · truck_card_flag/no/contact ·
       doc_exempt · doc_inspect · cargo_fcl/lcl/fz/fz_fz
       -> ดึงจากงานที่บันทึกไว้ ไม่ต้องกรอกซ้ำในหน้านี้
     *** ไม่สร้าง field / table / RPC ใหม่ · ไม่แตะ SQL ***

   ── ช่องที่ "เว้นว่าง" เพราะฐานข้อมูลยังไม่มี field รองรับ ──
     วันที่ตรวจปล่อย · จ่ายเงินถึงวันที่ · MODE · ตารางค่าใช้จ่าย 12 บรรทัด
     -> ปล่อยว่างให้กรอกด้วยมือบนกระดาษ ตามข้อกำหนด "ห้ามสร้างข้อมูลปลอม"
     (ถ้าต้องการให้ระบบเก็บค่าพวกนี้ ต้องเพิ่มคอลัมน์ใหม่ = ต้องรายงานก่อน)

   ── ไม่กระทบของเดิม ──
     ไม่ import / ไม่แก้ charge-page.js · job-form.js · billing-modal.js
     เป็น route + renderer ใหม่ล้วน
   ══════════════════════════════════════════════════════════════════════════ */
import { jobDetail } from './job-api.js';
import { chargeBundle } from '../charges/charge-api.js';
import { esc, dmy } from '../core/formatter.js';
import { handleErr } from '../core/error-handler.js';
import { openModal, closeModal } from '../components/modal.js';

/* เส้นประสำหรับเติมมือ — ค่าว่าง = ปล่อยว่างจริง ไม่ใส่ '-' */
const fill = (v, cls = '') =>
  `<span class="jfd-fill ${cls}">${v === null || v === undefined || v === '' ? '' : esc(String(v))}</span>`;
/* กล่องติ๊ก — ติ๊กจริงตามค่าที่บันทึกไว้กับ JOB (ไม่ hardcode)
   v !== true = ปล่อยว่างให้ติ๊กบนกระดาษ */
const box = (v) => `<span class="jfd-box${v === true ? ' on' : ''}"></span>`;
/* ── ติ๊กจาก "ข้อมูลจริง" สำหรับ 4 หัวข้อที่ถอด Checkbox ออกจากหน้าเปิดงาน ──
   หน้าเปิดงาน DOCUMENT ไม่มี Checkbox หน้าหัวข้อแล้ว -> flag ถูกคำนวณจากค่าที่กรอก
   ตอน Save · แต่เอกสาร A4 ยังต้องมีกล่องติ๊กตาม Template เดิม
   ที่นี่ใช้ flag ที่บันทึกไว้ OR ข้อมูลจริงในช่อง เพื่อให้ครอบคลุมงานเก่า
   ที่เคยกรอกข้อความไว้แต่ไม่ได้ติ๊ก Checkbox (flag = false/NULL)
   *** เป็นการ OR เพิ่มเท่านั้น — ไม่มีทางทำให้กล่องที่เคยติ๊กกลายเป็นไม่ติ๊ก ***
   ไม่แตะ Template · ไม่ลบหัวข้อ · ไม่ hardcode */
const hasVal = (v) => v !== null && v !== undefined && String(v).trim() !== '';
const boxOr = (flag, ...vals) => box(flag === true || vals.some(hasVal));

const ROWS = ['Nj advance', 'Service charge', 'Lift on /Lift off', 'Over time',
  'Custom fee', 'Storage charge', 'Demurrage charge', 'Amend entry',
  'Re-fund', 'Check list', 'Other'];

export function docHTML(j) {
  const body = ROWS.map((d, i) => `<tr>
      <td class="c">${i + 1}</td><td class="d">${esc(d)}</td>
      <td></td><td></td><td></td><td></td></tr>`).join('');
  return `
  <div class="print-area">
   <div class="jfd" id="jfd-paper">
    <div class="jfd-top">
      <div class="jfd-jobno">JOB NJ:${fill(j.job_no, 'w-jobno')}</div>
      <div class="jfd-chk">
        <div class="jfd-chk-r1">${box(j.doc_exempt)}<span>ยกเว้น</span>${box(j.doc_inspect)}<span>เปิดตรวจ</span>${box(j.doc_fee)}<span>ค่าธรรมเนียม</span></div>
        <div class="jfd-chk-r2">
          <div>${box(j.cargo_fcl)}<i>FCL</i></div><div>${box(j.cargo_lcl)}<i>LCL</i></div>
          <div>${box(j.cargo_fz)}<i>FZ</i></div><div>${box(j.cargo_fz_fz)}<i>FZ+FZ</i></div>
        </div>
      </div>
    </div>

    <div class="jfd-line"><span class="lb">บริษัท:</span>${fill(j.customer_name, 'gw')}
      <span class="lb">เลขที่ใบขนฯ:</span>${fill(j.customs_declaration_no, 'gs')}</div>

    <div class="jfd-line"><span class="lb">วันที่ตรวจปล่อย:</span>${fill(dmy(j.release_date), 'g1')}
      <span class="lb">จ่ายเงินถึงวันที่:</span>${fill('', 'g1')}</div>

    <div class="jfd-line">${box(j.cargo_fcl)}<span class="lb">FCL จำนวน:</span>${fill(j.qty_container, 'g2')}
      <span class="lb">ตู้</span>${box(j.cargo_lcl)}<span class="lb">LCL</span>
      <span class="lb">MODE:</span>${fill(j.data_type, 'g1')}</div>

    <div class="jfd-line">${boxOr(j.lift_on_wharf_flag, j.lift_on_wharf_note)}<span class="lb">ออกใบเสร็จค่า Lift On/ Wharf ตาม</span>${fill(j.lift_on_wharf_note, 'g1')}</div>
    <div class="jfd-line">${boxOr(j.storage_charge_flag, j.storage_charge_note)}<span class="lb">ออกใบเสร็จค่า Storage Charge ตาม</span>${fill(j.storage_charge_note, 'g1')}</div>

    <div class="jfd-line">${boxOr(j.overtime_flag, j.overtime_date, j.overtime_slot_1 === true ? '1' : '', j.overtime_slot_2 === true ? '1' : '', j.overtime_slot_3 === true ? '1' : '')}<span class="lb">ขอล่วงเวลาวันที่</span>${fill(dmy(j.overtime_date), 'g2')}
      <span class="lb">เวลา</span>${box(j.overtime_slot_1)}<i>08.30-16.30</i>${box(j.overtime_slot_2)}<i>16.30-24.00</i>${box(j.overtime_slot_3)}<i>24.00-08.00</i></div>

    <div class="jfd-line">${boxOr(j.truck_card_flag, j.truck_card_no)}<span class="lb">ให้การ์ดหัวลาก</span>${fill(j.truck_card_no, 'g1')}
      <span class="lb">เบอร์และชื่อโทร</span>${fill(j.truck_card_contact, 'g1')}</div>

    <div class="jfd-line"><span class="lb">สถานที่วางบิล:</span>${fill(j.company_invoice, 'gw')}
      <span class="lb">Customer Job No.:</span>${fill(j.customer_job_no, 'gs')}</div>

    <table class="jfd-tbl">
      <thead><tr>
        <th class="c">Item</th><th class="d">Description</th>
        <th>Nj advance</th><th>Cost Amount</th><th>Receipt Amount</th><th>Tax number</th>
      </tr></thead>
      <tbody>${body}
        <tr><td class="c"></td><td class="d">Total Amount</td>
          <td></td><td></td><td></td><td></td></tr>
      </tbody>
    </table>

    <div class="jfd-sign">
      <div><span class="lb">Name Cs</span>${fill(j.cs_name, 'g1')}</div>
      <div><span class="lb">Name Shipping</span>${fill('', 'g1')}</div>
      <div><span class="lb">Date</span>${fill('', 'g2')}</div>
    </div>
   </div>
  </div>`;
}

/* ── ตัวเลือกงาน (เมื่อเข้าจากเมนู Sidebar ที่ยังไม่รู้ว่าเป็นงานไหน) ──
   ใช้ RPC เดิม njacc_charge_page_bundle ตัวเดียวกับหน้ารายการ ไม่สร้าง RPC ใหม่ */
async function pickerHTML(cnt, q) {
  const list = [];
  for (const charge of ['SERVICE', 'ADVANCE']) {
    try {
      const res = await chargeBundle({ charge, group: 'NJ', mode: 'document',
        filters: { q: q || '' }, page: 1, size: 10, withKpi: false });
      (res && res.rows ? res.rows : []).forEach(r => list.push(r));
    } catch (_) { /* ไม่มีสิทธิ์ใน charge นั้น -> ข้ามไป ไม่ทำให้หน้าพัง */ }
  }
  cnt.querySelector('#jfd-list').innerHTML = list.length
    ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>
        <th>เลขที่งาน</th><th>ลูกค้า</th><th>Customer Job No.</th><th>เลขใบขนสินค้า</th>
      </tr></thead><tbody>${list.map(r => `<tr data-job="${esc(r.id)}">
        <td class="t-b">${esc(r.job_no || '')}</td><td>${esc(r.customer_name || '')}</td>
        <td>${esc(r.customer_job_no || '')}</td><td>${esc(r.customs_declaration_no || '')}</td>
      </tr>`).join('')}</tbody></table></div>`
    : '<p class="t-sm t-3">ไม่พบงานตามเงื่อนไข</p>';
  const tb = cnt.querySelector('#jfd-list tbody');
  if (tb) {
    tb.closest('table').classList.add('rowclick');
    tb.addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-job]');
      if (tr) location.hash = '#/job-form/' + tr.dataset.job;
    });
  }
}

export async function render(cnt, { id } = {}) {
  if (!id) {
    cnt.innerHTML = `
      <div class="page-head"><div class="page-title"><span class="dot"></span>
        <h2>DOCUMENT — Job Form</h2></div></div>
      <div class="ch-panel">
        <div class="fbar">
          <input class="inp" id="jfd-q" placeholder="ค้นหา เลขที่งาน / ลูกค้า / Customer Job No.">
          <button class="btn btn-o btn-sm" id="jfd-go">ค้นหา</button>
        </div>
        <div id="jfd-list"><p class="t-sm t-3 p-2">กำลังโหลด…</p></div>
      </div>`;
    const go = () => pickerHTML(cnt, cnt.querySelector('#jfd-q').value.trim()).catch(handleErr);
    cnt.querySelector('#jfd-go').onclick = go;
    cnt.querySelector('#jfd-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    await go();
    return;
  }

  const j = await jobDetail(id);
  cnt.innerHTML = `
    <div class="page-head jfd-bar"><div class="page-title"><span class="dot"></span>
      <h2>Job Form — ${esc(j.job_no || '')}</h2></div>
      <div class="row">
        <button class="btn btn-o" id="jfd-pdf">💾 Save PDF</button>
        <button class="btn btn-print" id="jfd-print">🖨 Print</button>
        <button class="btn btn-o" id="jfd-back">← กลับ</button></div></div>
    ${docHTML(j)}`;

  cnt.querySelector('#jfd-back').onclick = () => history.back();

  /* Print — ใช้ window.print() ตัวเดียวกับเอกสารอื่นของระบบ (invoice/receipt/credit note)
     .print-area + @media print ของ invoice.css ซ่อน Sidebar/Header/ปุ่มให้อยู่แล้ว */
  cnt.querySelector('#jfd-print').onclick = () => window.print();

  /* Save PDF — ไม่เพิ่ม PDF library ใหม่ (โปรเจกต์ไม่มี jsPDF/html2canvas อยู่เลย)
     ใช้ Print to PDF ของเบราว์เซอร์ = เนื้อหาตรงกับที่เห็นบนจอ 100%
     ตั้ง document.title ชั่วคราวเพื่อให้ชื่อไฟล์เริ่มต้นเป็น JOB-NJ_<JOB_NO>.pdf
     แล้วคืนค่าเดิมหลังพิมพ์เสร็จ (afterprint) */
  cnt.querySelector('#jfd-pdf').onclick = () => {
    const prev = document.title;
    document.title = 'JOB-NJ_' + (j.job_no || 'JOB');
    const restore = () => { document.title = prev; window.removeEventListener('afterprint', restore); };
    window.addEventListener('afterprint', restore);
    window.print();                 /* บล็อกจนปิดกล่องพิมพ์ในเบราว์เซอร์ทั่วไป */
    restore();                      /* คืนค่าทันที ไม่ต้องรอ afterprint */
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   Print Preview — เปิด Job Form A4 เป็น Modal จากหน้า "+ เปิดงาน / แก้ไขงาน"
   (DOCUMENT — SERVICE / ADVANCE เท่านั้น · ACCOUNTING ไม่มีปุ่มนี้)

   ── Reuse ของเดิมทั้งหมด ──
     Template/Renderer  : docHTML() ตัวเดียวกับ route #/job-form/:id (ไม่ทำใหม่)
     ข้อมูล             : jobDetail(id) -> RPC njacc_job_detail (to_jsonb ของงานจริง)
     Print / Save PDF   : window.print() แบบเดียวกับเอกสารอื่นของระบบ
                          (ไม่เพิ่ม PDF library ใหม่)
     ซ่อน Sidebar/Header/ปุ่ม/Modal: กฎ @media print เดิมใน invoice.css
       body *{visibility:hidden} + .print-area{visible}
       #nj-modal .modal-h/.modal-f{display:none}  -> พิมพ์เฉพาะ A4 Job Form

   ── หมายเหตุสำคัญ ──
     openModal() ปิด Modal เดิมก่อนเสมอ (ระบบไม่รองรับ Modal ซ้อน)
     Preview จึงมาแทนที่ฟอร์มเปิดงาน · ปุ่ม "✕ กลับ" เรียก onBack() เพื่อเปิด
     ฟอร์มงานใบเดิมกลับมา (โหลดค่าล่าสุดจาก DB ใหม่ ไม่ใช่ค่าค้างใน DOM)
     กด Preview แล้ว *ไม่* สั่งพิมพ์ทันที — ผู้ใช้ต้องกด 🖨 Print / 💾 Save PDF เอง
   ══════════════════════════════════════════════════════════════════════════ */
/* ── FIT A4 TO SCREEN — คำนวณอัตราย่อของ "หน้าจอ" เท่านั้น ────────────────
   แยกเป็นฟังก์ชันบริสุทธิ์เพื่อให้ทดสอบได้โดยไม่ต้องพึ่ง layout จริงของเบราว์เซอร์
   scale = min(availW/paperW, availH/paperH, 1)
     - เพดาน 1 = ไม่ขยายเกินขนาดจริง (จอใหญ่มากก็ยังเป็น A4 100%)
     - min ของสองแกน = รักษาสัดส่วน A4 · ไม่ตัดขอบ · ไม่มี Scroll ทั้งสองแกน
   ค่าที่ไม่สมเหตุผล (0 / ติดลบ / NaN — เช่นตอน jsdom ที่ไม่มี layout) -> คืน 1
   *** ไม่ hardcode ค่าใด ๆ *** ทุกค่ามาจากการวัดพื้นที่จริงตอน runtime */
export function jfdFitScale({ availW, availH, paperW, paperH }) {
  const n = [availW, availH, paperW, paperH].map(Number);
  if (n.some(v => !Number.isFinite(v) || v <= 0)) return 1;
  return Math.min(n[0] / n[2], n[1] / n[3], 1);
}

/* ══ V.231 · Preview ก่อนบันทึก (Draft Preview) ═════════════════════════════
   เดิมรับได้เฉพาะ id -> ต้องมี Record ใน Database ก่อนถึงจะ Preview ได้
   ตอนนี้รับ `data` (ค่าจากฟอร์ม ณ ปัจจุบัน) ได้ด้วย
     มี id   -> อ่านจาก Database เหมือนเดิมทุกประการ (พฤติกรรมเดิมไม่เปลี่ยน)
     มี data -> ใช้ค่าที่ส่งมาเลย *** ไม่ยิง RPC · ไม่บันทึก · ไม่ออกเลข ***
   *** ใช้ Renderer docHTML() ตัวเดิม *** ไม่ทำ Template ใหม่ */
export async function openJobFormPreview({ id, data, onBack } = {}) {
  if (!id && !data) throw new Error('NJACC_JOB_ID_REQUIRED');
  const j = data || await jobDetail(id);

  const b = document.createElement('div');
  /* ── Wrapper เฉพาะ Screen Preview ──────────────────────────────────────────
     .jfd-stage = พื้นที่ "หลังย่อ" (จองที่เท่าขนาดจริงหลัง scale)
     .jfd-scale = ตัวที่ถูก transform:scale() (transform-origin:top center)
     .print-area / .jfd ข้างในเป็นเอกสารต้นฉบับ A4 210mm × 297mm *** ไม่ถูกแตะ ***
     ต้องมี stage เพราะ transform ไม่ลดพื้นที่ที่ Browser จองไว้ (ยังจอง 297mm เดิม)
     -> ถ้าไม่มี stage จะเหลือช่องว่างใต้กระดาษและเกิด Scroll
     ตอนพิมพ์: กฎ @media print ใน job-form-doc.css ยกเลิก transform และคืนขนาด auto
     -> Print ได้ A4 100% เหมือนเดิมทุกประการ */
  b.innerHTML = `<div class="jfd-stage"><div class="jfd-scale">${docHTML(j)}</div></div>`;

  const f = document.createElement('div');
  f.innerHTML = `<div class="mf-left"></div>
    <div class="mf-right">
      <button class="btn btn-print" id="jfp-print">🖨 Print</button>
      <button class="btn btn-p" id="jfp-pdf">💾 Save PDF</button>
      <button class="btn btn-o" id="jfp-back">✕ กลับ</button>
    </div>`;

  /* ── cls: 'jfd-modal' เท่านั้น — *** ไม่ใช้ modal-flow *** ────────────────
     ROOT CAUSE ของกรอบขาวใหญ่เต็มพื้นที่:
       ui.css  .modal-fs .modal.modal-w80.modal-flow{position:relative;inset:auto;
                 width:100%;height:auto}
               .modal-bk.modal-bk-w80.modal-flow{place-items:start stretch;
                 padding:var(--modal-gap)}
       -> modal-flow ออกแบบมาสำหรับ "ฟอร์มเปิดงาน" ที่การ์ดต้องกว้างเต็ม Content Area
          แต่ Job Form เป็นเอกสาร A4 ความกว้างตายตัว 210mm
          การ์ดจึงถูกยืดเป็นพื้นที่ขาวกว้างกว่ากระดาษมาก
     แก้: ถอด modal-flow ออกจาก Preview ตัวนี้ตัวเดียว แล้วคุมขนาดด้วย .jfd-modal
     *** ไม่แตะพฤติกรรมของ modal-flow กลาง *** (ฟอร์มเปิดงาน/ออกวางบิล ยังใช้อยู่)
     ยังส่ง fullscreen+wide เหมือนเดิม -> backdrop ยังจำกัดอยู่ในพื้นที่ Content Area
     (ไม่ทับ Sidebar / Topbar) ตามกฎ .modal-bk-w80 เดิม */
  openModal({ title: 'Print Preview — Job Form ' + (j.job_no || ''),
    body: b, footer: f, fullscreen: true, wide: true, cls: 'jfd-modal' });

  /* ── วัดพื้นที่จริงแล้วย่อให้ A4 ทั้งแผ่นพอดีจอ (Desktop) ────────────────────
     วัดจาก backdrop (#nj-modal) ซึ่งเป็นพื้นที่ Content Area จริง
       availW = clientWidth  - padding ซ้าย/ขวา ของ backdrop
       availH = clientHeight - padding บน/ล่าง - ความสูง Footer (ปุ่ม Print/Save/กลับ)
     paperW/paperH ใช้ offsetWidth/offsetHeight ของ .jfd
       (offset* เป็นค่า layout — *** ไม่ถูก transform:scale กระทบ *** จึงวัดซ้ำได้เสมอ)
     ≤1100px (Tablet/Mobile) : ไม่บังคับย่อ -> k = 1 แล้วเลื่อนดูตามพฤติกรรมเดิม
     Recalculate: ตอนเปิด Preview · ตอน window resize
     ถอด listener อัตโนมัติเมื่อ Modal ถูกปิด (ตรวจด้วย document.body.contains) */
  const stage = b.querySelector('.jfd-stage');
  const scaleEl = b.querySelector('.jfd-scale');
  const fitA4 = () => {
    const bk = document.getElementById('nj-modal');
    const paper = b.querySelector('.jfd');
    if (!bk || !stage || !scaleEl || !paper) return;
    let k = 1;
    if (window.innerWidth > 1100) {
      const cs = window.getComputedStyle(bk);
      const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      const foot = bk.querySelector('.modal-f');
      k = jfdFitScale({
        availW: bk.clientWidth - padX,
        availH: bk.clientHeight - padY - (foot ? foot.offsetHeight : 0),
        paperW: paper.offsetWidth,
        paperH: paper.offsetHeight,
      });
    }
    scaleEl.style.setProperty('--jfd-k', String(k));
    /* จองพื้นที่เท่าขนาดหลังย่อ — ใช้ CSS var เพื่อให้ @media print ยกเลิกได้ง่าย */
    stage.style.setProperty('--jfd-sw', Math.ceil(paper.offsetWidth * k) + 'px');
    stage.style.setProperty('--jfd-sh', Math.ceil(paper.offsetHeight * k) + 'px');
  };
  const onResize = () => {
    if (!document.body.contains(stage)) { window.removeEventListener('resize', onResize); return; }
    fitA4();
  };
  fitA4();
  window.addEventListener('resize', onResize);

  f.querySelector('#jfp-print').onclick = () => window.print();

  /* Save PDF — Print to PDF ของเบราว์เซอร์ (วิธีเดิมของ route #/job-form/:id)
     ตั้ง document.title ชั่วคราวเพื่อให้ชื่อไฟล์เริ่มต้นเป็น JOB-NJ_<JOB_NO>.pdf */
  f.querySelector('#jfp-pdf').onclick = () => {
    const prev = document.title;
    document.title = 'JOB-NJ_' + (j.job_no || 'JOB');
    const restore = () => { document.title = prev; window.removeEventListener('afterprint', restore); };
    window.addEventListener('afterprint', restore);
    window.print();
    restore();
  };

  f.querySelector('#jfp-back').onclick = () => {
    window.removeEventListener('resize', onResize);
    closeModal();
    if (typeof onBack === 'function') onBack();
  };
  return b;
}
