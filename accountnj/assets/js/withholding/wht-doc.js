/* Renderer "ข้อมูลหนังสือรับรองหัก ณ ที่จ่ายที่ได้รับ" (50 ทวิ)
   Preview / Print / PDF ชุดเดียวกัน

   ── เอกสารนี้มี 2 ทิศทาง (direction · RUN-09) ────────────────────────────
   ACTING_AGENT = *** หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ) ฉบับจริง ***
       N.J. กระทำการแทนผู้มีหน้าที่หักภาษี -> ออกเอกสารให้ผู้ถูกหักภาษี
       ผู้หัก/ผู้ถูกหัก กรอกจากฟอร์มทั้งคู่ · N.J. อยู่ในช่อง "กระทำการแทนโดย"
       มีช่องลงนาม "ผู้จ่ายเงิน" ครบตามแบบราชการ
       *** ห้ามมีคำว่า INTERNAL RECORD / สำเนาข้อมูลสำหรับบันทึกภายใน ***
   RECEIVED (ของเดิม) = สำเนาข้อมูลที่ N.J. บันทึกจากหนังสือรับรองที่ลูกค้าออกให้
       ต้นฉบับออกและลงนามโดยลูกค้า -> ยังต้องมีข้อความกำกับว่าไม่ใช่ต้นฉบับ
       *** ห้ามแตะพฤติกรรมเดิมของทิศทางนี้ ***
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

/* ── ป้ายของ "แบบที่นำส่ง" และ "วิธีการจ่ายภาษี" (RUN-08) ──────────────────
   เก็บเป็นรหัสใน DB · แปลงเป็นข้อความไทยเฉพาะตอนพิมพ์
   รหัสที่ไม่รู้จัก -> แสดงตามตัวอักษรเดิม ไม่เดา ไม่ทิ้ง */
/* ── ตัวเลือกครบชุดตามแบบ 50 ทวิ ราชการ (ลำดับสำคัญ ห้ามสลับ) ──
   ใช้เป็น "รายการช่องติ๊ก" บนกระดาษ · รหัสตรงกับที่หน้าเว็บส่งมา */
const WHD_FORM_LIST = [
  ['PND1K', '(1) ภ.ง.ด.1ก'], ['PND1K_SPECIAL', '(2) ภ.ง.ด.1ก พิเศษ'],
  ['PND2', '(3) ภ.ง.ด.2'], ['PND3', '(4) ภ.ง.ด.3'],
  ['PND2K', '(5) ภ.ง.ด.2ก'], ['PND3K', '(6) ภ.ง.ด.3ก'], ['PND53', '(7) ภ.ง.ด.53'],
];
/* ══ ผู้จ่ายเงิน — ลำดับและป้ายตามแบบ 50 ทวิ ═══════════════════════════════
   ── FIX (V.192) ── ของเดิมสลับป้ายกัน 2 ตัว:
       ONCE     เคยพิมพ์ว่า "หัก ณ ที่จ่าย"    (ที่ถูกคือ ออกให้ครั้งเดียว)
       WITHHOLD เคยพิมพ์ว่า "ออกให้ครั้งเดียว"  (ที่ถูกคือ หัก ณ ที่จ่าย)
   *** แก้เฉพาะป้ายและลำดับที่แสดง ห้ามแตะรหัสที่เก็บใน pay_method ***
   รหัสเดิมในฐานข้อมูลถูกต้องอยู่แล้ว เพราะหน้ากรอกแสดงป้ายตรงความหมาย
   (ONCE = "ออกภาษีให้ครั้งเดียว") ผู้ใช้จึงเลือกรหัสถูกมาตลอด
   -> *** ไม่ต้อง Migration ข้อมูลเก่า *** ที่ผิดคือเฉพาะป้ายบนกระดาษ */
const WHD_PAYM_LIST = [
  ['WITHHOLD', '(1) หัก ณ ที่จ่าย'], ['FOREVER', '(2) ออกให้ตลอดไป'],
  ['ONCE', '(3) ออกให้ครั้งเดียว'], ['OTHER', '(4) อื่น ๆ (ระบุ)'],
];
const WHD_FORMS = Object.fromEntries(
  WHD_FORM_LIST.map(([k, l]) => [k, l.replace(/^\(\d+\)\s*/, '')]));
const WHD_PAYM = Object.fromEntries(
  WHD_PAYM_LIST.map(([k, l]) => [k, l.replace(/^\(\d+\)\s*/, '')]));
const codeLabel = (map, v) => {
  const k = String(v || '').trim();
  return k ? (map[k] || k) : '';
};

/* ══ แบบ 50 ทวิ ราชการ (RUN-14) ══════════════════════════════════════════
   ต้นแบบ: approve_wh3_081156.pdf — เรียงองค์ประกอบตามเอกสารจริงทุกส่วน
   *** ใช้กับ direction = ACTING_AGENT เท่านั้น ***
   RECEIVED เดิมยังใช้ layout เดิม (ด้านล่าง) ไม่ถูกกระทบแม้แต่ช่องเดียว */

/* หมวดเงินได้ตามแบบ — ลำดับและข้อความตรงต้นฉบับ ห้ามสลับ
   [code, ข้อความ, เป็นหัวข้อย่อยหรือไม่] */
/* ══ รายการย่อยใต้ 4 (ข) — ข้อความตามแบบ 50 ทวิ ═══════════════════════════
   ── NEW (V.193) ── ถอดข้อความมาจาก "แบบอ้างอิงที่ผู้ใช้แนบมา" ตรง ๆ
   *** ไม่ได้พิมพ์ข้อความกฎหมายขึ้นเองจากความจำ ***
   เป็นข้อความบนแบบฟอร์มล้วน ไม่มีการผูกข้อมูล/ไม่มีการคำนวณ
   ช่องเว้นให้กรอกด้วยปากกาใช้ .w50-bl (เส้นประ) ตามแบบ */
const W50_BLANK = '<span class="w50-bl"></span>';
/* ช่องเว้นยาวของ "6. อื่น ๆ (ระบุ)" ตามแบบ — ข้อความที่ผู้ใช้กรอก (w.note)
   ยังพิมพ์ต่อท้ายเหมือนเดิมและผ่าน esc() ทุกครั้ง */
const W50_BLANK_LONG = '<span class="w50-bl w50-bl-lg"></span>';
const W50_4B_SUB = `<div class="w50-sl">
  <div class="w50-l1">(1) กรณีผู้ได้รับเงินปันผลได้รับเครดิตภาษี โดยจ่ายจาก
    กำไรสุทธิของกิจการที่ต้องเสียภาษีเงินได้นิติบุคคลในอัตราดังนี้</div>
  <div class="w50-l2">(1.1) อัตราร้อยละ 30 ของกำไรสุทธิ</div>
  <div class="w50-l2">(1.2) อัตราร้อยละ 25 ของกำไรสุทธิ</div>
  <div class="w50-l2">(1.3) อัตราร้อยละ 20 ของกำไรสุทธิ</div>
  <div class="w50-l2">(1.4) อัตราอื่น ๆ (ระบุ) ${W50_BLANK} ของกำไรสุทธิ</div>
  <div class="w50-l1">(2) กรณีผู้ได้รับเงินปันผลไม่ได้รับเครดิตภาษี เนื่องจากจ่ายจาก</div>
  <div class="w50-l2">(2.1) กำไรสุทธิของกิจการที่ได้รับยกเว้นภาษีเงินได้นิติบุคคล</div>
  <div class="w50-l2">(2.2) เงินปันผลหรือเงินส่วนแบ่งของกำไรที่ได้รับยกเว้นไม่ต้องนำมารวม
    คำนวณเป็นรายได้เพื่อเสียภาษีเงินได้นิติบุคคล</div>
  <div class="w50-l2">(2.3) กำไรสุทธิส่วนที่ได้หักผลขาดทุนสุทธิยกมาไม่เกิน 5 ปี
    ก่อนรอบระยะเวลาบัญชีปีปัจจุบัน</div>
  <div class="w50-l2">(2.4) กำไรที่รับรู้ทางบัญชีโดยวิธีส่วนได้เสีย (equity method)</div>
  <div class="w50-l2">(2.5) อื่น ๆ (ระบุ) ${W50_BLANK}</div>
</div>`;

const W50_ROWS = [
  ['M40_1',  '1. เงินเดือน ค่าจ้าง เบี้ยเลี้ยง โบนัส ฯลฯ ตามมาตรา 40 (1)', 0],
  ['M40_2',  '2. ค่าธรรมเนียม ค่านายหน้า ฯลฯ ตามมาตรา 40 (2)', 0],
  ['M40_3',  '3. ค่าแห่งลิขสิทธิ์ ฯลฯ ตามมาตรา 40 (3)', 0],
  ['M40_4A', '4. (ก) ดอกเบี้ย ฯลฯ ตามมาตรา 40 (4) (ก)', 0],
  ['M40_4B', '(ข) เงินปันผล เงินส่วนแบ่งกำไร ฯลฯ ตามมาตรา 40 (4) (ข)', 1, W50_4B_SUB],
  ['SEC3TER', '5. การจ่ายเงินได้ที่ต้องหักภาษี ณ ที่จ่าย ตามคำสั่งกรมสรรพากรที่ออกตามมาตรา '
    + '3 เตรส เช่น รางวัล ส่วนลดหรือประโยชน์ใด ๆ เนื่องจากการส่งเสริมการขาย รางวัล'
    + 'ในการประกวด การแข่งขัน การชิงโชค ค่าแสดงของนักแสดงสาธารณะ ค่าจ้าง'
    + 'ทำของ ค่าโฆษณา ค่าเช่า ค่าขนส่ง ค่าบริการ ค่าเบี้ยประกันวินาศภัย ฯลฯ', 0],
  ['OTHER',  '6. อื่น ๆ (ระบุ)', 0, W50_BLANK_LONG],
];

/* ══ ช่องเลขประจำตัวผู้เสียภาษี — แยกกล่องทีละหลักตามแบบจริง ═══════════════
   ไม่ครบตามจำนวนหลัก -> ช่องที่เหลือว่าง (ไม่เติมเลขมั่ว)

   ── FIX (V.194) ── ตำแหน่งเส้นคั่นกลุ่มเดิมเลื่อนไป 1 ช่อง
   นับจาก approve_wh3_081156.pdf (Master) ได้กลุ่ม 1 | 4 | 5 | 2 | 1
   ของเดิมใส่ช่องว่างที่ index 1,5,10,12 -> กลายเป็น 2 | 4 | 5 | 2
   ที่ถูกคือใส่ที่ "ช่องสุดท้ายของแต่ละกลุ่ม" = index 0,4,9,11
   *** ตัวเลขไม่เคยผิดตำแหน่ง *** ผิดเฉพาะเส้นคั่นที่พิมพ์ออกมา */
const boxRow = (v, len, gaps) => {
  const d = String(v == null ? '' : v).replace(/\D/g, '').slice(0, len).split('');
  let out = '';
  for (let i = 0; i < len; i++) {
    out += `<span class="w50-tb${gaps.includes(i) ? ' w50-tb-gap' : ''}">${
      d[i] ? esc(d[i]) : ''}</span>`;
  }
  return out;
};
/* เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)* — กลุ่ม 1 | 4 | 5 | 2 | 1 */
const taxBoxes = (v) => boxRow(v, 13, [0, 4, 9, 11]);
/* เลขประจำตัวผู้เสียภาษีอากร (ชุดเดิม 10 หลัก) — กลุ่ม 1 | 4 | 4 | 1 */
const taxBoxes10 = (v) => boxRow(v, 10, [0, 4, 8]);

const w50Tick = (on) => on ? '☒' : '☐';

/* ══ เลขประจำตัวบัตรประชาชน กับแบบ 50 ทวิ (V.203) ═════════════════════════
   *** ตรวจ approve_wh3_081156.pdf (Master) แล้ว ***
   กล่องของแต่ละฝ่ายมีช่องเลขแค่ 2 แถว และทั้งคู่ชื่อ "เลขประจำตัวผู้เสียภาษีอากร"
     แถว 1  (13 หลัก)*  -> map กับ payer_tax_id / payee_tax_id (ของเดิม)
     แถว 2  ชุดเดิม 10 หลัก -> map กับ *_tax_id_old (ยังไม่มีคอลัมน์ · เว้นว่าง)
   *** แบบนี้ไม่มีช่องแยกสำหรับเลขประจำตัวบัตรประชาชน ***

   หมายเหตุท้ายแบบระบุ Logic ของแบบเองว่า "กรณีบุคคลธรรมดาไทย ให้ใช้เลข
   ประจำตัวประชาชนของกรมการปกครอง" *** เป็นเลขประจำตัวผู้เสียภาษีอากร 13 หลัก ***
   -> ผู้ใช้ต้องกรอกเลขนั้นลงช่อง "เลขประจำตัวผู้เสียภาษีอากร" เอง
      ระบบ *** ไม่นำ payer/payee_citizen_id ไปแสดงแทน Tax ID โดยอัตโนมัติ ***
      (ข้อกำหนดข้อ 5) และไม่พิมพ์ลงกระดาษเพราะไม่มีตำแหน่งรองรับ
   ค่าที่กรอกยังถูกเก็บครบใน Database / หน้ารายการ / Column Manager */

/* ══ แถวที่ 2 ของแต่ละฝ่าย (V.194 — แก้จาก V.192) ═════════════════════════
   ── ตรวจ approve_wh3_081156.pdf (Master) แล้ว ──
   แถวที่ 2 ของกล่องผู้หัก/ผู้ถูกหัก *** ไม่ใช่ "เลขประจำตัวประชาชน" ***
   ป้ายจริงคือ "เลขประจำตัวผู้เสียภาษีอากร" (ไม่มี "(13 หลัก)" ไม่มีดอกจัน)
   = เลขผู้เสียภาษีชุดเดิม 10 หลัก · นับกล่องจาก PDF ได้ 10 ช่อง กลุ่ม 1|4|4|1
   หมายเหตุท้ายแบบยืนยันซ้ำว่า กรณีบุคคลธรรมดาไทยให้ใช้ "เลขประจำตัวประชาชน"
   เป็นเลขประจำตัวผู้เสียภาษีอากร 13 หลักอยู่แล้ว
   -> *** แบบนี้ไม่มีช่องเลขประจำตัวประชาชนแยกต่างหาก ***

   ระบบยังไม่มีคอลัมน์เก็บเลข 10 หลักชุดเดิม -> พิมพ์เป็นช่องว่างตามแบบ
   (ห้ามเอาเลข 13 หลักมาใส่ซ้ำ) · รับค่าผ่านพารามิเตอร์ไว้ให้แล้ว */
const w50IdRow = (v) => `<div class="w50-ph2">เลขประจำตัวผู้เสียภาษีอากร
    <span class="w50-tboxes">${taxBoxes10(v)}</span></div>`;

/* ── V.222 ── เพิ่ม option `copyLabel` เท่านั้น (ค่าเริ่มต้น '' = ต้นฉบับ)
   ใช้พิมพ์คำว่า "สำเนา 1 / สำเนา 2" มุมขวาบนของกระดาษ
   *** absolute position บน .whd ที่เป็น position:relative อยู่แล้ว ***
   -> ไม่กินพื้นที่ใน flow · Layout 50 ทวิ ทั้ง 4 หน้าจึงเท่ากันเป๊ะ
   ตรรกะเดิมของ copy ('original' = ติ๊กฉบับที่ 1 · อื่น = ติ๊กฉบับที่ 2) ไม่ถูกแตะ */
export function wht50HTML(w, { copy = 'original', copyLabel = '' } = {}) {
  const items = w.items || [];
  const S = summarize(items);
  const p = {
    name: w.payer_name, tax_id: w.payer_tax_id, address: w.payer_address,
  };
  const q = {
    name: w.payee_name, tax_id: w.payee_tax_id, address: w.payee_address,
  };
  /* ══ มีกระทำการแทนโดยหรือไม่ (V.196) ═══════════════════════════════════
     has_acting_agent = true/false  -> ใช้ค่านั้นตรง ๆ
     has_acting_agent = null/undefined (เอกสารก่อน V.196 · ยังไม่เคยระบุ)
       -> ถอยไปดูว่ามีชื่อผู้กระทำการแทนบันทึกไว้จริงหรือไม่
       *** เอกสารเก่าจึงพิมพ์ออกมาเหมือนเดิมทุกใบ *** ไม่มีใบไหนเสีย */
  const hasAgent = (w.has_acting_agent === true || w.has_acting_agent === false)
    ? w.has_acting_agent
    : !!String(w.agent_name || '').trim();

  /* ── V.215 ── DRAFT บนกระดาษอิง "การมี Reference No." ไม่ใช่ status
     Flow ใหม่ : บันทึกครั้งแรก -> ได้ Reference No. -> พิมพ์เอกสารจริงได้ทันที
     status ใน DB ยังเป็น DRAFT ได้ (Business Flow เดิม ไม่ถูกแตะ ข้อ 13)
     -> มีเลขแล้ว = ไม่มีลายน้ำ DRAFT · ไม่มีคำว่า "ร่าง" บนเอกสาร
     VOID ไม่ถูกแตะ */
  const refNo50 = String(w.reference_no || '').trim();
  const isDraft = String(w.status || '').toUpperCase() === 'DRAFT' && !refNo50;
  const isVoid = String(w.status || '').toUpperCase() === 'VOID';

  /* รวมยอดตามหมวด — *** ใช้ wht_income_category ที่ผู้ใช้เลือกเท่านั้น ***
     ไม่มีหมวด = ไม่ถูกนำไปลงแถวใด (ไม่เดาให้) แต่ยังนับในยอดรวมด้านล่าง */
  const byCat = {};
  for (const it of items) {
    const c = it.wht_income_category;
    if (!c) continue;
    if (!byCat[c]) byCat[c] = { base: 0, tax: 0, date: null };
    byCat[c].base = r2(byCat[c].base + num(it.tax_base));
    byCat[c].tax = r2(byCat[c].tax + num(it.amount));
    if (!byCat[c].date) byCat[c].date = it.pay_date || w.pay_date;
  }

  const rows = W50_ROWS.map(([code, label, sub, extra]) => {
    const v = byCat[code];
    return `<tr>
      ${/* extra = ข้อความย่อยของแบบฟอร์ม (ไม่ใช่ข้อมูลผู้ใช้ จึงไม่ผ่าน esc)
           ข้อมูลผู้ใช้ (w.note) ยัง esc() เหมือนเดิมทุกกรณี */ ''}
      <td class="w50-d${sub ? ' w50-sub' : ''}">${esc(label)}${
        code === 'OTHER' && w.note ? ' ' + esc(w.note) : ''}${extra || ''}</td>
      <td class="w50-c">${v ? esc(dmy(v.date)) : ''}</td>
      <td class="w50-n">${v ? money(v.base) : ''}</td>
      <td class="w50-n">${v ? money(v.tax) : ''}</td>
    </tr>`;
  }).join('');

  /* ══ เงินกองทุน / ประกันสังคม (V.198) ═══════════════════════════════════
     has_fund = true/false -> ใช้ค่านั้นตรง ๆ
     has_fund = null/undefined (เอกสารก่อน V.198) -> ถอยไปดูว่ามียอดจริงหรือไม่
       *** เอกสารเก่าจึงพิมพ์ยอดเดิมออกมาเหมือนเดิมทุกใบ ***
     ไม่ได้เลือก -> ไม่พิมพ์ตัวเลขของเอกสารนั้น (เว้นเส้นประไว้ตามแบบ)
     *** บรรทัด "เงินที่จ่ายเข้า กบข./กสจ./..." เป็นข้อความคงที่ของแบบ 50 ทวิ
         จึงยังพิมพ์เสมอ ไม่ถูกลบ *** ควบคุมเฉพาะ "จำนวนเงินของเอกสาร" */
  const hasFund = (w.has_fund === true || w.has_fund === false)
    ? w.has_fund
    : [w.gpf_amount, w.social_security_amount, w.provident_fund_amount]
        .some(x => x != null && x !== '' && Number(x) !== 0);
  const fund = (v) => (!hasFund || v == null || v === '') ? '' : money(v);

  return `
  <div class="whd w50${isDraft ? ' w50-draft' : ''}">
    ${isDraft ? '<div class="whd-wm whd-wm-d">DRAFT</div>' : ''}
    ${isVoid ? '<div class="whd-wm whd-wm-v">VOID</div>' : ''}
    ${copyLabel ? '<div class="w50-cp">' + esc(copyLabel) + '</div>' : ''}

    <div class="w50-copies">
      <span>${w50Tick(copy === 'original')} ฉบับที่ 1 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย
        ใช้แนบพร้อมกับแบบแสดงรายการภาษี)</span>
      <span>${w50Tick(copy !== 'original')} ฉบับที่ 2 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย
        เก็บไว้เป็นหลักฐาน)</span>
    </div>

    <div class="w50-title">
      <div class="w50-t1">หนังสือรับรองการหักภาษี ณ ที่จ่าย</div>
      <div class="w50-t2">ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร</div>
      <div class="w50-bk">
        <div>เล่มที่ <b>${txt(w.book_no, '')}</b></div>
        <div>เลขที่ <b>${txt(w.certificate_no, '')}</b></div>
      </div>
    </div>

    <section class="w50-party">
      <div class="w50-ph">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย : -
        <span class="w50-tl">เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)*</span>
        <span class="w50-tboxes">${taxBoxes(p.tax_id)}</span></div>
      ${w50IdRow(w.payer_tax_id_old)}
      <div class="w50-row"><span class="w50-lb">ชื่อ</span>
        <span class="w50-v">${txt(p.name, '')}</span></div>
      <div class="w50-hint">(ให้ระบุว่าเป็น บุคคล นิติบุคคล บริษัท สมาคม หรือคณะบุคคล)</div>
      <div class="w50-row"><span class="w50-lb">ที่อยู่</span>
        <span class="w50-v">${txt(p.address, '')}</span></div>
      <div class="w50-hint">(ให้ระบุชื่ออาคาร/หมู่บ้าน ห้องเลขที่ ชั้นที่ เลขที่ ตรอก/ซอย
        หมู่ที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด)</div>
    </section>

    ${/* ── กระทำการแทนโดย (V.192 · เป็นตัวเลือกตั้งแต่ V.196) ──
         Field เดิมของระบบทั้งหมด: agent_name / agent_tax_id / agent_address
         (agent_branch เก็บในระบบแต่แบบราชการไม่มีช่องให้ลง -> ไม่พิมพ์ ไม่เดาตำแหน่ง)
         ตัดบรรทัดคำอธิบายใต้ช่อง (w50-hint) ออกเพื่อคุมความสูงให้ A4 ยังเป็น 1 หน้า

         ── V.196 ── ไม่มีกระทำการแทน -> *** ไม่ render section นี้เลย ***
         ไม่เหลือกรอบ ไม่เหลือช่องว่าง · ผู้มีหน้าที่หักฯ ต่อด้วยผู้ถูกหักฯ ทันที
         (Layout เป็น flow ปกติ จึงยุบขึ้นเองอัตโนมัติ) */ ''}
    ${hasAgent ? `
    <section class="w50-party w50-agent">
      <div class="w50-ph">กระทำการแทนโดย : -
        <span class="w50-tl">เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)*</span>
        <span class="w50-tboxes">${taxBoxes(w.agent_tax_id)}</span></div>
      ${w50IdRow(w.agent_tax_id_old)}
      <div class="w50-row"><span class="w50-lb">ชื่อ</span>
        <span class="w50-v">${txt(w.agent_name, '')}</span></div>
      <div class="w50-row"><span class="w50-lb">ที่อยู่</span>
        <span class="w50-v">${txt(w.agent_address, '')}</span></div>
    </section>` : ''}

    <section class="w50-party">
      <div class="w50-ph">ผู้ถูกหักภาษี ณ ที่จ่าย : -
        <span class="w50-tl">เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)*</span>
        <span class="w50-tboxes">${taxBoxes(q.tax_id)}</span></div>
      ${w50IdRow(w.payee_tax_id_old)}
      <div class="w50-row"><span class="w50-lb">ชื่อ</span>
        <span class="w50-v">${txt(q.name, '')}</span></div>
      <div class="w50-hint">(ให้ระบุว่าเป็น บุคคล นิติบุคคล บริษัท สมาคม หรือคณะบุคคล)</div>
      <div class="w50-row"><span class="w50-lb">ที่อยู่</span>
        <span class="w50-v">${txt(q.address, '')}</span></div>
      <div class="w50-hint">(ให้ระบุชื่ออาคาร/หมู่บ้าน ห้องเลขที่ ชั้นที่ เลขที่ ตรอก/ซอย
        หมู่ที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด)</div>
    </section>

    <section class="w50-seq">
      <span class="w50-seq-l">ลำดับที่ <b>${txt(w.form_seq, '')}</b> ในแบบ</span>
      <span class="w50-seq-o">${WHD_FORM_LIST.map(([k, l]) =>
        `<span>${w50Tick(w.form_type === k)} ${esc(l)}</span>`).join('')}</span>
      <div class="w50-hint">(ให้สามารถอ้างอิงหรือสอบยันกันได้ระหว่างลำดับที่ตามหนังสือรับรองฯ
        กับแบบยื่นรายการภาษีหักที่จ่าย)</div>
    </section>

    <table class="w50-tbl">
      <thead><tr>
        <th>ประเภทเงินได้พึงประเมินที่จ่าย</th>
        <th class="w50-c">วัน เดือน<br>หรือปีภาษี ที่จ่าย</th>
        <th class="w50-n">จำนวนเงินที่จ่าย</th>
        <th class="w50-n">ภาษีที่หัก<br>และนำส่งไว้</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td class="w50-sum">รวมเงินที่จ่ายและภาษีที่หักนำส่ง</td>
          <td class="w50-c"></td>
          <td class="w50-n"><b>${money(S.base)}</b></td>
          <td class="w50-n"><b>${money(S.tax)}</b></td></tr>
        <tr><td class="w50-words" colspan="4">รวมเงินภาษีที่หักนำส่ง (ตัวอักษร)
          <b>${esc(bahtText(S.tax))}</b></td></tr>
      </tfoot>
    </table>

    <div class="w50-fund">เงินที่จ่ายเข้า กบข./กสจ./กองทุนสงเคราะห์ครูโรงเรียนเอกชน
      <u>${fund(w.gpf_amount)}</u> บาท
      กองทุนประกันสังคม <u>${fund(w.social_security_amount)}</u> บาท
      กองทุนสำรองเลี้ยงชีพ <u>${fund(w.provident_fund_amount)}</u> บาท</div>

    <div class="w50-payer">ผู้จ่ายเงิน ${WHD_PAYM_LIST.map(([k, l]) =>
      `<span>${w50Tick(w.pay_method === k)} ${esc(l)}${
        (k === 'OTHER' && w.pay_method === 'OTHER' && w.pay_method_other)
          ? ' ' + esc(w.pay_method_other) : ''}</span>`).join('')}</div>

    ${/* ── V.193 ── คำเตือน (ซ้าย) กับ ขอรับรองฯ+ลงนาม (ขวา) วางเรียงข้างกัน
         ตามแบบอ้างอิง — ประหยัดความสูงด้วย ทำให้ A4 ยังเป็นหน้าเดียว */ ''}
    <section class="w50-bot">
      <div class="w50-warn"><b>คำเตือน</b> ผู้มีหน้าที่ออกหนังสือรับรองการหักภาษี ณ ที่จ่าย
        ฝ่าฝืนไม่ปฏิบัติตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร ต้องรับโทษทางอาญาตามมาตรา 35
        แห่งประมวลรัษฎากร</div>
      <div class="w50-sign">
        <div class="w50-cert">ขอรับรองว่าข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ</div>
        <div class="w50-sign-r">
          <div class="w50-sg">ลงชื่อ <span class="w50-dot"></span> ผู้จ่ายเงิน</div>
          <div class="w50-sn">( ${txt(w.signer_name, '')} )</div>
          <div class="w50-sd">วันที่ <b>${dmy(w.document_date)}</b>
            ที่ออกหนังสือรับรองฯ</div>
        </div>
        <div class="w50-seal">ประทับตรา<br>นิติบุคคล<br>(ถ้ามี)</div>
      </div>
    </section>

    <div class="w50-note"><b>หมายเหตุ</b> เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)* หมายถึง
      1. กรณีบุคคลธรรมดาไทย ให้ใช้เลขประจำตัวประชาชนของกรมการปกครอง
      2. กรณีนิติบุคคล ให้ใช้เลขทะเบียนนิติบุคคลของกรมพัฒนาธุรกิจการค้า
      3. กรณีอื่น ๆ นอกเหนือจาก 1. และ 2. ให้ใช้เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)
      ของกรมสรรพากร</div>
  </div>`;
}

/* ══ V.222 · ชุดพิมพ์ 4 หน้า (กดพิมพ์ครั้งเดียว) ═══════════════════════════
   *** ไม่ Copy HTML 4 ชุด *** เรียก wht50HTML() ตัวเดิมซ้ำ 4 รอบด้วย option
   ต่างกันเท่านั้น -> ข้อมูลทุกหน้ามาจาก Record เดียวกัน (w) จึงเหมือนกัน 100%
     หน้า 1 = copy 'original'            (☒ ฉบับที่ 1 · ☐ ฉบับที่ 2)
     หน้า 2 = copy 'copy'                (☐ ฉบับที่ 1 · ☒ ฉบับที่ 2)
     หน้า 3 = copy 'original' + สำเนา 1  (ติ๊กเหมือนหน้า 1)
     หน้า 4 = copy 'copy'     + สำเนา 2  (ติ๊กเหมือนหน้า 2)
   *** Read-only *** ไม่ยิง RPC · ไม่ Save · ไม่เดิน Counter · ไม่เปลี่ยน Status */
export const WHT50_PRINT_PAGES = [
  { copy: 'original', copyLabel: '' },
  { copy: 'copy', copyLabel: '' },
  { copy: 'original', copyLabel: 'สำเนา 1' },
  { copy: 'copy', copyLabel: 'สำเนา 2' },
];
export function wht50PagesHTML(w) {
  return WHT50_PRINT_PAGES
    .map(o => `<div class="w50-page">${wht50HTML(w, o)}</div>`).join('');
}

export function whtDocHTML(w, { copy = 'original' } = {}) {
  /* ACTING_AGENT -> แบบ 50 ทวิ ราชการ (ต้นแบบ approve_wh3_081156.pdf)
     RECEIVED -> layout เดิมของระบบ (ไม่ถูกกระทบ) */
  if (String(w.direction || '').toUpperCase() === 'ACTING_AGENT') {
    return wht50HTML(w, { copy });
  }
  const items = w.items || [];
  const S = summarize(items);
  /* ── ก. ผู้มีหน้าที่หักภาษี ─────────────────────────────────────────────
     ใช้ snapshot ที่บันทึกไว้ตอนออกเอกสารก่อน (payer_* · RUN-08)
     ไม่มี snapshot (เอกสารเก่า) -> ถอยไปใช้ข้อมูลสดจาก Customer Master
     -> *** เอกสาร RECEIVED เดิมพิมพ์ออกมาเหมือนเดิมทุกช่อง *** */
  const pm = w.payer || w.payee || {};
  const p = {
    name: w.payer_name || pm.name,
    tax_id: w.payer_tax_id || pm.tax_id,
    branch_code: w.payer_branch || pm.branch_code,
    address: w.payer_address || pm.address,
    phone: pm.phone,
  };
  /* ── ข. ผู้ถูกหักภาษี ──────────────────────────────────────────────────
     ISSUED : ใช้ payee_* ที่กรอกไว้ (Supplier / ลูกค้า B)
     RECEIVED เดิม : ไม่มี payee_* -> ถอยไปใช้ Company Config เหมือนเดิมเป๊ะ */
  /* ── ทิศทางเอกสาร — ตัวกำหนดว่าเป็น 50 ทวิ ฉบับจริง หรือสำเนาภายใน ──
     ACTING_AGENT (RUN-09) = ฉบับจริงที่ N.J. กระทำการแทน
     ไม่มีค่า / RECEIVED = ของเดิม -> ทุกอย่างเหมือนเดิมทุกตัวอักษร */
  const isAgent = String(w.direction || '').toUpperCase() === 'ACTING_AGENT';

  const hasPayee = !!String(w.payee_name || '').trim();
  const pe = hasPayee
    ? { name: w.payee_name, tax_id: w.payee_tax_id,
        branch_code: w.payee_branch || 'สำนักงานใหญ่', address: w.payee_address, tel: '' }
    : { name: ISSUER.nameEn, tax_id: ISSUER.taxId,
        branch_code: 'สำนักงานใหญ่', address: ISSUER.address,
        tel: ISSUER.tel + ' | ' + ISSUER.fax };
  /* กระทำการแทนโดย — Optional · ไม่มีข้อมูลก็ไม่แสดงบล็อกนี้เลย */
  const agentName = String(w.agent_name || '').trim();
  const inv = w.invoice || {};
  const status = String(w.status || '').toUpperCase();
  const isVoid = status === 'VOID';
  /* ── V.207 ── FLOW ใหม่: "บันทึก" ออก Reference No. ให้ทันที แต่ status ใน DB
     ยังเป็น DRAFT (จงใจ — เพื่อให้กลับมาแก้แล้วบันทึกซ้ำได้ ข้อ 5)
     ดังนั้น *** เกณฑ์ความเป็นร่างบนกระดาษคือ "ยังไม่มีเลข" ไม่ใช่ status ***
       ไม่มี reference_no -> ยังเป็นร่าง  -> ป้าย + ลายน้ำ DRAFT เหมือนเดิม
       มี   reference_no -> ออกเลขแล้ว   -> ไม่มีลายน้ำ และโชว์เลขอ้างอิง
     VOID ไม่ถูกแตะ · Layout / CSS / ตำแหน่งทุกจุดเหมือนเดิมทุกประการ */
  const refNo = String(w.reference_no || '').trim();
  const isDraft = status === 'DRAFT' && !refNo;

  /* เลขบนหนังสือรับรอง = certificate_no ที่ Customer ออกให้ (ผู้ใช้กรอก)
     ยังไม่ได้รับเอกสารตัวจริง -> ว่างไว้ ไม่เอาเลขภายในมาสวมรอย */
  const certNo = String(w.certificate_no || '').trim() || null;
  /* เลขอ้างอิงภายในของ N.J. — ร่างยังไม่มีเลขจริง จึงไม่โชว์เลขปลอม
     ── V.207 ── ลำดับความสำคัญ *** เอกสารเก่าต้องไม่เปลี่ยนสิ่งที่พิมพ์ออกมา ***
       1) document_no จริง (WHT{YY}-####) จากการ POST -> ใช้ตัวนี้ก่อนเสมอ
          -> ใบที่เคย POST ไปแล้วพิมพ์ได้เลขเดิมเป๊ะ ไม่มีอะไรเปลี่ยน
       2) ไม่มี -> ใช้ reference_no ที่ออกตอนบันทึก (WHT{YYYYMM}-#####)
       3) ไม่มีทั้งคู่ -> ไม่โชว์ (ร่างจริง ๆ) */
  const noRaw = String(w.document_no || '');
  const postedNo = /^WHTDRAFT-/.test(noRaw) ? null : (noRaw || null);
  const internalNo = postedNo || (refNo || null);

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
      ${/* ── Watermark — DRAFT / VOID เท่านั้น · POSTED (ISSUED) ไม่มี ──
           วางเป็น element เดียวทับกลางกระดาษ (CSS .whd-wm) ไม่กระทบ Layout
           ไม่ขวางการอ่าน (opacity ต่ำ · pointer-events:none) */ ''}
      ${isDraft ? '<div class="whd-wm whd-wm-d">DRAFT</div>' : ''}
      ${isVoid ? '<div class="whd-wm whd-wm-v">VOID</div>' : ''}

      <div class="whd-copy">
        <b>${isAgent
          ? 'หนังสือรับรองการหักภาษี ณ ที่จ่าย ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร'
          : 'สำเนาข้อมูลสำหรับบันทึกภายใน — ไม่ใช่ต้นฉบับหนังสือรับรอง'}</b>
        <span>${esc(copyMeta.label)}</span>
      </div>

      <header class="whd-head">
        <img class="whd-logo" src="${ISSUER.logo}" alt="N.J. Logistics">
        <div class="whd-head-t">
          <div class="whd-t1">${isAgent
            ? 'หนังสือรับรองการหักภาษี ณ ที่จ่าย (กระทำการแทน)'
            : 'ข้อมูลหนังสือรับรองหัก ณ ที่จ่ายที่ได้รับ'}</div>
          <div class="whd-t2">ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร${isAgent
            ? '' : ' — สำเนาข้อมูลสำหรับบันทึกภายใน'}</div>
          <div class="whd-t3">${isAgent
            ? 'WITHHOLDING TAX CERTIFICATE'
            : 'RECEIVED WITHHOLDING TAX CERTIFICATE — INTERNAL RECORD'}</div>
        </div>
        <div class="whd-head-r">
          <div class="whd-nolbl">เล่มที่${w.book_no ? '' : ' / เลขที่'}</div>
          <div class="whd-no">${w.book_no
            ? esc(w.book_no) + ' <span class="whd-dim">/</span> ' +
              (certNo ? esc(certNo) : '<span class="whd-pend">—</span>')
            : (certNo ? esc(certNo) : '<span class="whd-pend">ยังไม่ได้รับเลขจากผู้หักภาษี</span>')}</div>
          <div class="whd-dtlbl">วันที่ออกหนังสือรับรอง</div>
          <div class="whd-dt">${dmy(w.document_date)}</div>
          ${w.ref_date ? `<div class="whd-intlbl">Ref. Date</div>
          <div class="whd-int">${dmy(w.ref_date)}</div>` : ''}
          ${w.job_no ? `<div class="whd-intlbl">เลขที่งาน</div>
          <div class="whd-int">${esc(w.job_no)}</div>` : ''}
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
            <div class="whd-f"><label>ชื่อ</label><div class="whd-v whd-v-b">${txt(pe.name)}</div></div>
            <div class="whd-f whd-f-2">
              <div class="whd-f-c"><label>เลขประจำตัวผู้เสียภาษีอากร</label>
                <div class="whd-v whd-v-tax">${txt(pe.tax_id)}</div></div>
              <div class="whd-f-c whd-f-br"><label>สาขา</label>
                <div class="whd-v">${txt(pe.branch_code)}</div></div>
            </div>
            <div class="whd-f${pe.tel ? '' : ' whd-f-last'}"><label>ที่อยู่</label>
              <div class="whd-v whd-v-ml">${addr(pe.address)}</div></div>
            ${pe.tel ? `<div class="whd-f whd-f-last"><label>โทร. / โทรสาร</label>
              <div class="whd-v">${esc(pe.tel)}</div></div>` : ''}
          </div>
        </div>
      </section>

      ${agentName ? `<section class="whd-agent">
        <div class="whd-agent-t">กระทำการแทนโดย</div>
        <div class="whd-agent-b">
          <div class="whd-agent-c"><label>ชื่อ</label><span class="whd-b">${esc(agentName)}</span></div>
          <div class="whd-agent-c"><label>เลขประจำตัวผู้เสียภาษีอากร</label>
            <span>${txt(w.agent_tax_id)}</span></div>
          <div class="whd-agent-c"><label>สาขา</label><span>${txt(w.agent_branch)}</span></div>
          <div class="whd-agent-c whd-agent-w"><label>ที่อยู่</label>
            <span>${txt(w.agent_address)}</span></div>
        </div>
      </section>` : ''}

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

      ${isAgent ? `<section class="whd-form whd-form-official">
        ${/* ── แบบราชการ: แสดง "ทุกตัวเลือก" พร้อมช่องติ๊ก ──
             ไม่ใช่แสดงเฉพาะค่าที่เลือก เพราะแบบ 50 ทวิ จริงต้องเห็นครบทุกช่อง
             ค่าที่เลือกจึงติ๊ก ☒ · ที่เหลือ ☐ */ ''}
        <div class="whd-form-c whd-form-w">
          <div class="whd-form-t">ผู้จ่ายเงินได้นำส่งภาษีตามแบบ</div>
          <div class="whd-cbs">${WHD_FORM_LIST.map(([k, l]) =>
            `<span class="whd-cb${w.form_type === k ? ' on' : ''}">${
              w.form_type === k ? '☒' : '☐'} ${esc(l)}</span>`).join('')}</div>
          <div class="whd-form-s">ลำดับที่ ${w.form_seq
            ? esc(w.form_seq) : '<span class="whd-dot">.........</span>'} ในแบบยื่นรายการ</div>
        </div>
        <div class="whd-form-c whd-form-w">
          <div class="whd-form-t">ผู้จ่ายเงิน</div>
          <div class="whd-cbs">${WHD_PAYM_LIST.map(([k, l]) =>
            `<span class="whd-cb${w.pay_method === k ? ' on' : ''}">${
              w.pay_method === k ? '☒' : '☐'} ${esc(l)}${
              (k === 'OTHER' && w.pay_method === 'OTHER' && w.pay_method_other)
                ? ' ' + esc(w.pay_method_other) : ''}</span>`).join('')}</div>
        </div>
      </section>` : ((w.form_type || w.pay_method) ? `<section class="whd-form">
        <div class="whd-form-c">
          <div class="whd-form-t">ผู้จ่ายเงินได้นำส่งภาษีตามแบบ</div>
          <div class="whd-form-v">${codeLabel(WHD_FORMS, w.form_type)
            ? esc(codeLabel(WHD_FORMS, w.form_type)) : '<span class="whd-pend">—</span>'}
            ${w.form_seq ? `<span class="whd-form-s">ลำดับที่ ${esc(w.form_seq)}</span>` : ''}</div>
        </div>
        <div class="whd-form-c">
          <div class="whd-form-t">วิธีการจ่ายเงินภาษี</div>
          <div class="whd-form-v">${codeLabel(WHD_PAYM, w.pay_method)
            ? esc(codeLabel(WHD_PAYM, w.pay_method)) : '<span class="whd-pend">—</span>'}
            ${w.pay_method_other ? `<span class="whd-form-s">${esc(w.pay_method_other)}</span>` : ''}</div>
        </div>
      </section>` : '')}

      ${w.note ? `<section class="whd-note">
        <div class="whd-note-t">หมายเหตุ / ข้อความอื่น ๆ</div>
        <div class="whd-note-v">${esc(w.note)}</div>
      </section>` : ''}

      ${isAgent ? `<section class="whd-declare">
        <div class="whd-dec-t">คำรับรอง</div>
        <p>ขอรับรองว่าข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ</p>
        <div class="whd-sign">
          <div class="whd-sign-l">
            <div class="whd-sign-line"></div>
            <div class="whd-sign-lb">ลงชื่อ ผู้จ่ายเงิน</div>
            <div class="whd-sign-nm">( ${txt(w.signer_name, '&nbsp;')} )</div>
            <div class="whd-sign-ps">ตำแหน่ง ${txt(w.signer_position, '&nbsp;')}</div>
          </div>
          <div class="whd-sign-r">
            <div class="whd-sign-lb">วันที่ออกหนังสือรับรอง</div>
            <div class="whd-sign-dt">${dmy(w.document_date)}</div>
          </div>
        </div>
      </section>` : `<section class="whd-declare">
        <div class="whd-dec-t">การอ้างอิงต้นฉบับ</div>
        <p>ข้อมูลข้างต้นบันทึกจากหนังสือรับรองการหักภาษี ณ ที่จ่าย
           ที่ออกและลงนามโดยผู้มีหน้าที่หักภาษี ณ ที่จ่าย (ผู้จ่ายเงิน) ตามรายละเอียดในส่วน ก.
           เอกสารฉบับนี้เป็นสำเนาข้อมูลสำหรับใช้ภายในของผู้ถูกหักภาษีเท่านั้น
           <b>ไม่ใช่ต้นฉบับ และไม่ใช้แทนต้นฉบับ</b></p>
        <div class="whd-rec">
          <div class="whd-rec-c"><label>ผู้จ่ายเงิน / ผู้ลงนาม</label>
            <span>${txt(w.signer_name || p.name)}</span></div>
          <div class="whd-rec-c"><label>ตำแหน่ง</label>
            <span>${txt(w.signer_position)}</span></div>
          <div class="whd-rec-c"><label>ผู้บันทึกข้อมูล</label>
            <span>${txt(w.created_by_name)}</span></div>
          <div class="whd-rec-c"><label>วันที่ออกหนังสือรับรอง</label>
            <span>${dmy(w.document_date)}</span></div>
        </div>
      </section>`}

      <div class="whd-edge"></div>
    </div>`;
}

/* เปิดดูเอกสาร — print=true สั่งพิมพ์ให้เลย
   Preview / Print / PDF ใช้ HTML ชุดเดียวกันทั้งหมด (ไม่มี template แยก)
   ไม่แตะสถานะเอกสารใด ๆ */
export function openWhtDoc(w, { print = false } = {}) {
  /* ── V.222 ── แบบ 50 ทวิ (ACTING_AGENT) = พิมพ์ครั้งเดียวได้ 4 หน้า
     -> เรนเดอร์ครบ 4 หน้าลง Modal เลย · ไม่มี Dropdown ให้เลือกทีละฉบับอีก
     เอกสาร RECEIVED (Layout เดิมของระบบ) ยังใช้ Dropdown เดิมทุกประการ */
  const is50 = String(w.direction || '').toUpperCase() === 'ACTING_AGENT';
  const b = document.createElement('div');
  const draw = (k) => { b.innerHTML = whtDocHTML(w, { copy: k }); };
  if (is50) b.innerHTML = wht50PagesHTML(w); else draw('original');

  const f = document.createElement('div');
  f.innerHTML = `<div class="mf-left">
      ${is50
        ? '<span class="t-xs t-3">พิมพ์ครั้งเดียวได้ 4 หน้า — ฉบับที่ 1 · ฉบับที่ 2 · สำเนา 1 · สำเนา 2</span>'
        : `<select class="sel" id="whd-copy">${WHD_COPIES.map((c, i) =>
            `<option value="${c.key}" ${i === 0 ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select>`}
    </div><div class="mf-right">
      <button class="btn btn-print" id="whd-print">🖨 Print / Save PDF</button>
      <button class="btn btn-o" data-close>✕ ปิด</button></div>`;

  /* ── V.215 ── หัวหน้าต่างต้องไม่ขึ้น "(ร่าง)" เมื่อเอกสารมี Reference No. แล้ว
     มีเลขแล้ว -> โชว์เลขอ้างอิง (Reference No. ก่อน · ไม่มีจึงใช้เลขที่/เลขภายใน) */
  const refNoTitle = String(w.reference_no || '').trim();
  const no = String(w.certificate_no || w.document_no || '');
  const titleNo = refNoTitle
    || ((/^WHTDRAFT-/.test(no) || String(w.status).toUpperCase() === 'DRAFT') ? '(ร่าง)' : no);
  openModal({
    title: 'ข้อมูลหนังสือรับรองหัก ณ ที่จ่ายที่ได้รับ ' + titleNo,
    body: b, footer: f, fullscreen: true, wide: true });

  /* ── V.222 ── โหมด 50 ทวิ ไม่มี #whd-copy แล้ว -> ต้อง guard ไม่งั้น throw */
  const cpSel = f.querySelector('#whd-copy');
  if (cpSel) cpSel.onchange = (e) => draw(e.target.value);
  f.querySelector('#whd-print').onclick = () => window.print();
  if (print) setTimeout(() => window.print(), 60);
}
