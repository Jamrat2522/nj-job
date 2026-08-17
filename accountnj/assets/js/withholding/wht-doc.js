/* Renderer "ข้อมูลหนังสือรับรองหัก ณ ที่จ่ายที่ได้รับ" (50 ทวิ)
   Preview / Print / PDF ชุดเดียวกัน

   *** เอกสารนี้ไม่ใช่ต้นฉบับ 50 ทวิ ***
   ต้นฉบับออกและลงนามโดยลูกค้า (ผู้หักภาษี) เท่านั้น
   ที่นี่คือ "สำเนาข้อมูลสำหรับบันทึกภายใน" ของ N.J. ซึ่งเป็นผู้ถูกหัก
   จึงไม่มีช่องลายเซ็นให้ N.J. ลงนามแทนลูกค้า
   ─────────────────────────────────────────────────────────────────────
   *** เอกสารเฉพาะของ REPORT > หัก ณ ที่จ่าย เท่านั้น ***
   คลาสทั้งหมดขึ้นต้น .whd* → ไม่ทับ .ivd* (INVOICE) / .rcd* (RECEIPT) /
   .apd* (ADVANCE) / .cnd* (CREDIT NOTE)

   ไม่เรียก RPC · ไม่เปลี่ยนสถานะ · ไม่ออกเลขเอกสารเอง · ไม่คำนวณภาษีเอง
   ตัวเลขทุกตัวมาจาก njacc_wht_view() ที่ SQL คำนวณไว้แล้ว
   ที่นี่ทำแค่ "จัดรูปแบบเพื่อแสดงผล"

   ── ทิศทางภาษี (สำคัญที่สุด) — RECEIVED WHT ──
     N.J. ออก Invoice ขายบริการให้ Customer -> Customer จ่ายเงินและเป็นผู้หักภาษี
     -> N.J. รับยอด Net -> Customer ออกหนังสือรับรอง 50 ทวิ ให้ N.J.
     ดังนั้น
        ก. ผู้มีหน้าที่หักภาษี ณ ที่จ่าย = Customer  (wht_view.payer)
        ข. ผู้ถูกหักภาษี ณ ที่จ่าย       = N.J.      (ISSUER · Config กลาง)
     *** ห้ามสลับบทบาท ***

   ── Data Mapping (ตรวจจาก sql/RUN-NOW/06_RUN-05_WHT_CERTIFICATE.sql จริง) ──
     ผู้มีหน้าที่หัก : njacc_customers ผ่าน wht_view.payer
                       name / tax_id / branch_code / address / phone
     ผู้ถูกหัก      : ISSUER (assets/js/config/company-doc.js) — Config กลางตัวเดียว
                       *** ไม่ hardcode ข้อมูลบริษัทซ้ำในไฟล์นี้ ***
     เลขหนังสือรับรอง : njacc_withholding_docs.certificate_no
                       *** เลขที่ Customer เป็นผู้ออก · ผู้ใช้กรอกเอง ระบบไม่สร้างให้ ***
     เลขอ้างอิงภายใน : njacc_withholding_docs.document_no (WHT{YY}-#### · ระบบเดิม)
                       แสดงแยกบรรทัด ไม่ใช่เลขบนหนังสือรับรองของ Customer
     วันที่เอกสาร   : document_date · วันที่จ่าย : pay_date
     อ้างอิง        : invoice.invoice_no (FK invoice_id) หรือ reference_no
     รายการเงินได้  : njacc_wht_items (line_no, pay_date, income_type, description,
                                       tax_base, rate, amount)
     ยอดรวม        : njacc_withholding_docs.tax_base / .amount (SQL รวมจาก items)

   *** ฉบับเอกสาร (ข้อ 12) ***
   Data Model เดียว · Renderer เดียว · เปลี่ยนเฉพาะ Label ของฉบับ
   ไม่ duplicate ข้อมูลธุรกิจ */
import { esc, money, dmy } from '../core/formatter.js';
import { openModal } from '../components/modal.js';
import { bahtText } from '../core/baht-text.js';
import { ISSUER } from '../config/company-doc.js';

const txt = (v, fb = '-') => {
  const s = (v === null || v === undefined) ? '' : String(v).trim();
  return esc(s || fb);
};
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const r2 = (n) => Math.round((num(n) + Number.EPSILON) * 100) / 100;
const pct = (v) => {
  const n = num(v);
  return (Number.isInteger(n) ? String(n) : String(r2(n))) + '%';
};

/* ประเภทเงินได้ — ป้ายภาษาไทยของค่าที่ระบบเก็บจริงใน wht_type / income_type
   ค่าที่ไม่รู้จักจะถูกแสดงตามตัวอักษรเดิม ไม่แปลงทิ้ง ไม่เดา */
const INCOME_LABEL = {
  SERVICE: 'ค่าบริการ / ค่าจ้างทำของ',
  TRANSPORT: 'ค่าขนส่ง',
  RENT: 'ค่าเช่า',
  OTHER: 'อื่น ๆ',
};
const incomeLabel = (k) => {
  const key = String(k || '').toUpperCase();
  return INCOME_LABEL[key] || String(k || '-');
};

/* ฉบับเอกสาร — Label เท่านั้น ข้อมูลเหมือนกันทุกฉบับ (Data Model เดียว · Renderer เดียว)
   ฝั่งผู้หักเก็บไว้ใช้คำว่า "สำเนาคู่ฉบับ" ไม่เรียก "ฉบับที่ 3" */
export const WHD_COPIES = [
  { key: 'original', label: 'ฉบับที่ 1 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย ใช้แนบพร้อมแบบแสดงรายการภาษี)' },
  { key: 'copy', label: 'ฉบับที่ 2 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย เก็บไว้เป็นหลักฐาน)' },
  { key: 'file', label: 'สำเนาคู่ฉบับ (สำหรับผู้มีหน้าที่หักภาษี ณ ที่จ่ายเก็บไว้เป็นหลักฐาน)' },
];

const ICON = {
  payer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/></svg>',
  payee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.4"/><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M9 11h6M9 15h4"/></svg>',
  abc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 6.6A2.6 2.6 0 0 1 6.6 4h10.8A2.6 2.6 0 0 1 20 6.6v7.2a2.6 2.6 0 0 1-2.6 2.6H9l-5 3.6z"/></svg>',
};
const bub = (k) => `<span class="whd-bub">${ICON[k] || ''}</span>`;

/* ── สรุปยอด ──
   ยึด "ผลรวมของบรรทัดที่แสดงในตาราง" -> ยอดสรุปกับตารางไม่มีทางไม่ตรง
   SQL ก็บังคับให้หัวใบ = ผลรวมรายการอยู่แล้ว (VERIFY V13) */
function summarize(items) {
  let base = 0, tax = 0;
  const rates = new Set();
  for (const it of items) {
    base = r2(base + num(it.tax_base));
    tax = r2(tax + num(it.amount));
    rates.add(num(it.rate));
  }
  return { base, tax, rates: [...rates].sort((a, b) => a - b) };
}

/* แยกที่อยู่เป็นบรรทัด — รองรับทั้ง \n และข้อความยาวบรรทัดเดียว */
const addr = (v) => txt(v, '-');

/* ── วันที่จ่ายเงินจริง ──
   *** ห้าม fallback ไป document_date เด็ดขาด ***
   วันที่ออกหนังสือรับรอง (document_date) กับ วันที่จ่ายเงินจริง (pay_date)
   เป็นคนละข้อมูลทางบัญชี ถ้าเอามาแทนกันเอกสารจะระบุวันจ่ายผิด
   ลำดับ: บรรทัด -> หัวใบ -> ยังไม่ระบุ
   (ใบที่บันทึกจริงจะมีค่าครบเสมอ เพราะ SQL บังคับด้วย
    NJACC_WHT_PAY_DATE_REQUIRED / NJACC_WHT_ITEM_PAY_DATE_REQUIRED) */
const PAY_NONE = '— ยังไม่ระบุ —';
const payDate = (itemDate, headDate) => {
  if (itemDate) return dmy(itemDate);
  if (headDate) return dmy(headDate);
  return PAY_NONE;
};

export function whtDocHTML(w, { copy = 'original' } = {}) {
  const items = w.items || [];
  const S = summarize(items);
  /* payer = ผู้มีหน้าที่หักภาษี = Customer
     รองรับ payload เก่าที่ยังส่ง payee มา เพื่อไม่ให้เอกสารว่างเปล่า */
  const p = w.payer || w.payee || {};
  const inv = w.invoice || {};
  const status = String(w.status || '').toUpperCase();
  const isDraft = status === 'DRAFT';
  const isVoid = status === 'VOID';

  /* เลขบนหนังสือรับรอง = certificate_no ที่ Customer ออกให้ (ผู้ใช้กรอก)
     ยังไม่ได้รับเอกสารตัวจริง -> ว่างไว้ ไม่เอาเลขภายในมาสวมรอย */
  const certNo = String(w.certificate_no || '').trim() || null;
  /* เลขอ้างอิงภายในของ N.J. — ร่างยังไม่มีเลขจริง จึงไม่โชว์เลขปลอม */
  const noRaw = String(w.document_no || '');
  const internalNo = (isDraft || /^WHTDRAFT-/.test(noRaw)) ? null : (noRaw || null);

  const copyMeta = WHD_COPIES.find(c => c.key === copy) || WHD_COPIES[0];

  const rows = items.length
    ? items.map((it, i) => `<tr>
        <td class="whd-c whd-dim">${it.line_no ?? (i + 1)}</td>
        <td class="whd-c">${esc(payDate(it.pay_date, w.pay_date))}</td>
        <td class="whd-ds">
          <div class="whd-ds-t">${esc(incomeLabel(it.income_type))}</div>
          ${it.description ? `<div class="whd-ds-s">${esc(it.description)}</div>` : ''}
        </td>
        <td class="whd-r">${money(it.tax_base)}</td>
        <td class="whd-c">${esc(pct(it.rate))}</td>
        <td class="whd-r whd-tax">${money(it.amount)}</td>
      </tr>`).join('')
    : '<tr><td colspan="6" class="whd-empty">ยังไม่มีรายการเงินได้ในเอกสารนี้</td></tr>';

  /* อ้างอิงเอกสารต้นทาง — ผูกด้วย invoice_id จริง ถ้าไม่มีจึงใช้ reference_no ที่กรอกเอง */
  const refTxt = inv.invoice_no
    ? esc(inv.invoice_no)
    : (w.reference_no ? esc(w.reference_no) : '-');

  return `
    <div class="whd print-area${isVoid ? ' whd-void' : ''}${isDraft ? ' whd-draft' : ''}">
      ${isVoid ? '<div class="whd-badge whd-badge-v">VOID / ยกเลิก</div>' : ''}
      ${isDraft ? '<div class="whd-badge whd-badge-d">DRAFT / ร่าง — ยังไม่ออกเลขที่เอกสาร</div>' : ''}

      <div class="whd-copy">
        <b>สำเนาข้อมูลสำหรับบันทึกภายใน — ไม่ใช่ต้นฉบับหนังสือรับรอง</b>
        <span>${esc(copyMeta.label)}</span>
      </div>

      <header class="whd-head">
        <img class="whd-logo" src="${ISSUER.logo}" alt="N.J. Logistics">
        <div class="whd-head-t">
          <div class="whd-t1">ข้อมูลหนังสือรับรองหัก ณ ที่จ่ายที่ได้รับ</div>
          <div class="whd-t2">ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร — สำเนาข้อมูลสำหรับบันทึกภายใน</div>
          <div class="whd-t3">RECEIVED WITHHOLDING TAX CERTIFICATE — INTERNAL RECORD</div>
        </div>
        <div class="whd-head-r">
          <div class="whd-nolbl">เล่มที่ / เลขที่ (ผู้หักเป็นผู้ออก)</div>
          <div class="whd-no">${certNo ? esc(certNo)
            : '<span class="whd-pend">ยังไม่ได้รับเลขจากผู้หักภาษี</span>'}</div>
          <div class="whd-dtlbl">วันที่ออกหนังสือรับรอง</div>
          <div class="whd-dt">${dmy(w.document_date)}</div>
          ${internalNo ? `<div class="whd-intlbl">เลขอ้างอิงภายใน</div>
          <div class="whd-int">${esc(internalNo)}</div>` : ''}
        </div>
      </header>
      <div class="whd-band"></div>

      <section class="whd-party">
        <div class="whd-box">
          <div class="whd-box-t">${bub('payer')}<span>ก. ผู้มีหน้าที่หักภาษี ณ ที่จ่าย</span></div>
          <div class="whd-box-b">
            <div class="whd-f"><label>ชื่อ</label><div class="whd-v whd-v-b">${txt(p.name)}</div></div>
            <div class="whd-f whd-f-2">
              <div class="whd-f-c"><label>เลขประจำตัวผู้เสียภาษีอากร</label>
                <div class="whd-v whd-v-tax">${txt(p.tax_id)}</div></div>
              <div class="whd-f-c whd-f-br"><label>สาขา</label>
                <div class="whd-v">${txt(p.branch_code)}</div></div>
            </div>
            <div class="whd-f"><label>ที่อยู่</label>
              <div class="whd-v whd-v-ml">${addr(p.address)}</div></div>
            <div class="whd-f whd-f-last"><label>โทร.</label>
              <div class="whd-v">${txt(p.phone)}</div></div>
          </div>
        </div>

        <div class="whd-box">
          <div class="whd-box-t">${bub('payee')}<span>ข. ผู้ถูกหักภาษี ณ ที่จ่าย</span></div>
          <div class="whd-box-b">
            <div class="whd-f"><label>ชื่อ</label><div class="whd-v whd-v-b">${esc(ISSUER.nameEn)}</div></div>
            <div class="whd-f whd-f-2">
              <div class="whd-f-c"><label>เลขประจำตัวผู้เสียภาษีอากร</label>
                <div class="whd-v whd-v-tax">${esc(ISSUER.taxId)}</div></div>
              <div class="whd-f-c whd-f-br"><label>สาขา</label>
                <div class="whd-v">สำนักงานใหญ่</div></div>
            </div>
            <div class="whd-f"><label>ที่อยู่</label>
              <div class="whd-v whd-v-ml">${esc(ISSUER.address)}</div></div>
            <div class="whd-f whd-f-last"><label>โทร. / โทรสาร</label>
              <div class="whd-v">${esc(ISSUER.tel)} <i>|</i> ${esc(ISSUER.fax)}</div></div>
          </div>
        </div>
      </section>

      <section class="whd-ref">
        <div class="whd-ref-c"><label>อ้างอิงใบแจ้งหนี้ / เลขที่อ้างอิง</label>
          <span class="whd-ref-v">${refTxt}</span></div>
        <div class="whd-ref-c"><label>วันที่จ่ายเงิน</label>
          <span class="whd-ref-v">${esc(payDate(null, w.pay_date))}</span></div>
        ${inv.invoice_date ? `<div class="whd-ref-c"><label>วันที่ใบแจ้งหนี้</label>
          <span class="whd-ref-v">${dmy(inv.invoice_date)}</span></div>` : ''}
      </section>

      <section class="whd-sec">
        <div class="whd-sec-t">ค. รายละเอียดการจ่ายเงินและจำนวนภาษีที่หักและนำส่ง</div>
        <table class="whd-tbl">
          <colgroup><col class="w-no"><col class="w-dt"><col class="w-ds">
            <col class="w-base"><col class="w-rate"><col class="w-tax"></colgroup>
          <thead><tr>
            <th class="whd-c">ลำดับ</th>
            <th class="whd-c">วัน เดือน<br>ปีที่จ่าย</th>
            <th class="whd-c">ประเภทเงินได้พึงประเมินที่จ่าย</th>
            <th class="whd-c">จำนวนเงินที่จ่าย<br>(บาท)</th>
            <th class="whd-c">อัตราภาษี<br>ที่หัก</th>
            <th class="whd-c">ภาษีที่หักและนำส่งไว้<br>(บาท)</th>
          </tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr class="whd-sumrow">
            <td colspan="3" class="whd-r">รวมเงินที่จ่ายและภาษีที่หักนำส่ง</td>
            <td class="whd-r whd-b">${money(S.base)}</td>
            <td></td>
            <td class="whd-r whd-total">${money(S.tax)}</td>
          </tr></tfoot>
        </table>
      </section>

      <section class="whd-words">
        ${bub('abc')}
        <div class="whd-words-b">
          <div class="whd-words-t">รวมเงินภาษีที่หักและนำส่ง (ตัวอักษร)</div>
          <div class="whd-words-v">( ${esc(bahtText(S.tax))} )</div>
        </div>
      </section>

      ${w.note ? `<section class="whd-note">
        <div class="whd-note-t">หมายเหตุ</div>
        <div class="whd-note-v">${esc(w.note)}</div>
      </section>` : ''}

      <section class="whd-declare">
        <div class="whd-dec-t">การอ้างอิงต้นฉบับ</div>
        <p>ข้อมูลข้างต้นบันทึกจากหนังสือรับรองการหักภาษี ณ ที่จ่าย
           ที่ออกและลงนามโดยผู้มีหน้าที่หักภาษี ณ ที่จ่าย (ผู้จ่ายเงิน) ตามรายละเอียดในส่วน ก.
           เอกสารฉบับนี้เป็นสำเนาข้อมูลสำหรับใช้ภายในของผู้ถูกหักภาษีเท่านั้น
           <b>ไม่ใช่ต้นฉบับ และไม่ใช้แทนต้นฉบับ</b></p>
        <div class="whd-rec">
          <div class="whd-rec-c"><label>ต้นฉบับออกและลงนามโดย</label>
            <span>${txt(p.name)}</span></div>
          <div class="whd-rec-c"><label>ผู้บันทึกข้อมูล</label>
            <span>${txt(w.created_by_name)}</span></div>
          <div class="whd-rec-c"><label>วันที่บันทึก</label>
            <span>${dmy(w.document_date)}</span></div>
        </div>
      </section>

      <div class="whd-edge"></div>
    </div>`;
}

/* เปิดดูเอกสาร — print=true สั่งพิมพ์ให้เลย
   Preview / Print / PDF ใช้ HTML ชุดเดียวกันทั้งหมด (ไม่มี template แยก)
   ไม่แตะสถานะเอกสารใด ๆ */
export function openWhtDoc(w, { print = false } = {}) {
  const b = document.createElement('div');
  const draw = (k) => { b.innerHTML = whtDocHTML(w, { copy: k }); };
  draw('original');

  const f = document.createElement('div');
  f.innerHTML = `<div class="mf-left">
      <select class="sel" id="whd-copy">${WHD_COPIES.map((c, i) =>
        `<option value="${c.key}" ${i === 0 ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select>
    </div><div class="mf-right">
      <button class="btn btn-print" id="whd-print">🖨 Print / Save PDF</button>
      <button class="btn btn-o" data-close>✕ ปิด</button></div>`;

  const no = String(w.certificate_no || w.document_no || '');
  openModal({
    title: 'ข้อมูลหนังสือรับรองหัก ณ ที่จ่ายที่ได้รับ ' +
      (/^WHTDRAFT-/.test(no) || String(w.status).toUpperCase() === 'DRAFT' ? '(ร่าง)' : no),
    body: b, footer: f, fullscreen: true, wide: true });

  f.querySelector('#whd-copy').onchange = (e) => draw(e.target.value);
  f.querySelector('#whd-print').onclick = () => window.print();
  if (print) setTimeout(() => window.print(), 60);
}
