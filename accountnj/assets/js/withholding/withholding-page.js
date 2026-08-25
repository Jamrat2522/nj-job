/* REPORT > หัก ณ ที่จ่าย — ระบบออกหนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)
   ─────────────────────────────────────────────────────────────────────
   เดิมเป็น Modal เล็ก 6 ช่อง (ลูกค้า/วันที่/ประเภท/อ้างอิง/ฐานภาษี/อัตรา)
   บันทึกแล้วได้แค่แถวในตาราง ไม่มีเอกสารให้พิมพ์

   Flow: เปิดงานใหม่ -> กรอก -> บันทึกร่าง -> Preview -> POST -> Print/PDF -> UNPOST -> Export Excel

   ── สิ่งที่หน้านี้ "ไม่ทำ" ──
     ✗ ไม่แก้/ไม่เขียนทับ Invoice ต้นฉบับ (อ่านผ่าน njacc_wht_invoice_options เท่านั้น)
     ✗ ไม่ออกเลขหนังสือรับรองแทนผู้หัก — certificate_no ผู้ใช้กรอกเองล้วน
       เลข WHT{YY}-#### ที่ SQL ออกให้คือ "เลขอ้างอิงภายใน" ของ N.J. เท่านั้น
     ✗ ไม่คำนวณภาษีเป็นตัวเลขจริงเอง — SQL คำนวณ amount = base × rate/100 ซ้ำเสมอ
       (ตัวเลขบนฟอร์มคือ "ตัวอย่างระหว่างกรอก")
     ✗ ไม่ hardcode 3% — อัตรามาจาก Invoice ที่เลือก หรือผู้ใช้กรอกเอง
       ไม่ส่ง rate มา SQL จะโยน NJACC_WHT_RATE_REQUIRED (ไม่เดาให้เป็น 3%)
     ✗ ไม่แตะ Permission — ใช้ can('issue_receipt') / can('void') / isAdmin() เดิม

   ── ทิศทางภาษี — RECEIVED WHT ──
     N.J. ออก Invoice ขายบริการ -> Customer จ่ายเงินและเป็นผู้หักภาษี
     -> Customer ออกหนังสือรับรอง 50 ทวิ ให้ N.J.
        ก. ผู้มีหน้าที่หักภาษี = Customer (เลือกในฟอร์ม)
        ข. ผู้ถูกหักภาษี      = N.J. (Config กลาง · ไม่ต้องเลือก)
     เลขหนังสือรับรองเป็นเลขที่ "ผู้หัก" ออก -> ผู้ใช้กรอกเอง ระบบไม่สร้างให้

   Backend: sql/RUN-NOW/06_RUN-05_WHT_CERTIFICATE.sql (ยังไม่ได้รัน)
            ยังไม่รัน -> หน้านี้แสดงกล่อง BACKEND REQUIRED ไม่แสดงปุ่มหลอก */
import { listWht, voidWht, whtInvoiceOptions, saveWhtDraft, postWht, whtView,
         deleteWhtDraft, unpostWht, isWhtBackendMissing, whtErrMessage,
         whtPartySearch, whtPartyUpsert,
         WHT_DIR_AGENT } from './withholding-api.js';
import { whtExportExcel } from './wht-export.js';
/* ── V.206 ── ไฮไลต์ช่องที่ซ้ำในฟอร์ม "เพิ่มข้อมูลใหม่ใน Master"
   ใช้ตัวกลางเดิมของระบบ (.fld.invalid + .err-msg) ไม่สร้าง UI แจ้ง error ใหม่ */
import { markInvalid, clearInvalid } from '../core/validator.js';
/* ── V.195 ── หน้ากรอกไม่ render แบบฟอร์ม 50 ทวิ อีกแล้ว
   *** ไม่ลบ wht-doc.js / wht50HTML() / whtDocHTML() / CSS ของเอกสาร ***
   openWhtDoc() ยังเป็นทางเดียวที่เปิดเอกสาร A4 (Preview/Print/PDF)
   จึงเหลือ import แค่ตัวเดียว — Template ของเอกสารยังมีชุดเดียวเหมือนเดิม */
import { openWhtDoc } from './wht-doc.js';
import { openModal, closeModal } from '../components/modal.js';
import { bahtText } from '../core/baht-text.js';
import { enableRowOpen, initColumns } from '../components/table.js';
import { masters, customerOpts, activeCustomers } from '../master/master-cache.js';
import { esc, money, dmy, round2, ymd } from '../core/formatter.js';
import { ISSUER } from '../config/company-doc.js';
import { can, isAdmin } from '../core/permissions.js';
import { renderPagination } from '../components/pagination.js';
import { confirmModal, reasonModal, enableEnterNav } from '../components/modal.js';
import { toast } from '../components/toast.js';
/* ── V.216 ── btnBusy = Loading/Double-Click Guard ตัวกลางเดิมของระบบ
   (assets/js/components/loading.js) *** ไม่เขียน Guard ใหม่ *** */
import { btnBusy } from '../components/loading.js';
import { handleErr } from '../core/error-handler.js';
/* ── V.225 ── cancelDebounce = ยกเลิก timer ที่ค้าง (Map เดิมของ request-manager)
   ใช้ตอนผู้ใช้สั่งค้นเอง เพื่อไม่ให้ debounce เดิมยิง RPC ซ้ำ */
import { newRequestId, once, nextToken, isCurrent, debounce,
         cancelDebounce } from '../core/request-manager.js';

const SQL_FILE = 'sql/RUN-NOW/06_RUN-05_WHT_CERTIFICATE.sql';

const st = { customer: '', from: '', to: '', page: 1, size: 20 };
const pk = { q: '', page: 1, size: 10 };
let ed = null;   /* เอกสารที่กำลังแก้ */

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const pct = (v) => { const n = num(v); return (Number.isInteger(n) ? String(n) : String(round2(n))) + '%'; };

/* ประเภทเงินได้ — ค่าที่ระบบเก็บจริงใน wht_type / income_type (ของเดิม 4 ค่า) */
/* ══ หมวดเงินได้ตามแบบ 50 ทวิ (RUN-14) ═══════════════════════════════════
   *** คนละอย่างกับ INCOME_TYPES *** ซึ่งเป็นประเภทเชิงธุรกิจของระบบ (คงไว้ ห้ามลบ)
   ค่าตรงกับ CHECK njacc_wht_items_category_ck
   Default: SERVICE/TRANSPORT/RENT -> SEC3TER (ข้อ 5 ม.3 เตรส)
            OTHER -> '' (ผู้ใช้เลือกเอง *** ระบบไม่เดา ***)
   ผู้ใช้เปลี่ยนได้ทุกรายการ ไม่ว่า income_type จะเป็นอะไร */
const WHT50_CATS = [
  ['M40_1',   '1. เงินเดือน ค่าจ้าง ฯลฯ (ม.40(1))'],
  ['M40_2',   '2. ค่าธรรมเนียม ค่านายหน้า ฯลฯ (ม.40(2))'],
  ['M40_3',   '3. ค่าแห่งลิขสิทธิ์ ฯลฯ (ม.40(3))'],
  ['M40_4A',  '4.(ก) ดอกเบี้ย ฯลฯ (ม.40(4)(ก))'],
  ['M40_4B',  '4.(ข) เงินปันผล เงินส่วนแบ่งกำไร ฯลฯ (ม.40(4)(ข))'],
  ['SEC3TER', '5. หักตามคำสั่งกรมสรรพากร (ม.3 เตรส)'],
  ['OTHER',   '6. อื่น ๆ'],
];
const CAT_LABEL = Object.fromEntries(WHT50_CATS);
/* Default ตามที่ผู้ใช้กำหนด — OTHER ต้องเลือกเอง จึงคืนค่าว่าง */
const defaultCat = (incomeType) =>
  ['SERVICE', 'TRANSPORT', 'RENT'].includes(String(incomeType || '').toUpperCase())
    ? 'SEC3TER' : '';
const catOpts = (sel) => '<option value="">— เลือกหมวด —</option>' +
  WHT50_CATS.map(([v, l]) =>
    `<option value="${v}" ${sel === v ? 'selected' : ''}>${esc(l)}</option>`).join('');

const INCOME_TYPES = [
  ['SERVICE', 'ค่าบริการ / ค่าจ้างทำของ'],
  ['TRANSPORT', 'ค่าขนส่ง'],
  ['RENT', 'ค่าเช่า'],
  ['OTHER', 'อื่น ๆ'],
];
const incomeOpts = (sel) => INCOME_TYPES.map(([v, l]) =>
  `<option value="${v}" ${v === sel ? 'selected' : ''}>${esc(l)}</option>`).join('');

/* ══ อัตราภาษีคงที่ตามประเภทเงินได้ (V.206) ═══════════════════════════════
   Mapping จาก *** CODE จริงที่ระบบเก็บ *** (income_type) ไม่ใช่ข้อความไทยบนจอ
     SERVICE   -> 3   · TRANSPORT -> 1   · RENT -> 5
     OTHER     -> ไม่มีใน map = ผู้ใช้กรอกเอง (ช่องแก้ไขได้)
   ใช้เฉพาะ 3 จังหวะ: ผู้ใช้เปลี่ยน dropdown · กด "+ เพิ่มรายการ" · เอกสารใหม่ว่าง
   *** ไม่แตะรายการที่โหลดจาก DB และไม่แตะ Auto-Fill จาก Invoice ***
   (เอกสารย้อนหลัง/Snapshot ต้องคงอัตราเดิมเสมอ — ข้อ 10) */
const FIXED_RATE = { SERVICE: 3, TRANSPORT: 1, RENT: 5 };
const fixedRateOf = (t) => FIXED_RATE[String(t == null ? '' : t).toUpperCase()];
const isFixedRateType = (t) => fixedRateOf(t) !== undefined;
/* ── ล็อกช่องอัตรา % เมื่อไหร่ ────────────────────────────────────────────
   ล็อกเฉพาะแถวที่ "อัตราตรงกับอัตรามาตรฐานของประเภทนั้นอยู่แล้ว"
   -> ผู้ใช้เลือกประเภทเอง = ได้อัตรามาตรฐาน + ล็อก (กันพิมพ์ผิด)
   -> แถวที่อัตราไม่ตรง (Auto-Fill Invoice ที่ไม่มี WHT = 0 · เอกสารเก่าที่
      บันทึกอัตราอื่นไว้) *** ไม่ล็อก *** ผู้ใช้แก้ได้ตรง ๆ ไม่ต้องสลับประเภทไป-กลับ
   ยังคงข้อ 10: ไม่มีจุดไหนเขียนทับอัตราของข้อมูลเดิมเอง */
const isRateLocked = (l) => isFixedRateType(l && l.income_type)
  && num(l.rate) === fixedRateOf(l.income_type);

/* ══ CODE Master — ป้องกันข้อมูลซ้ำ (V.206) ═══════════════════════════════
   Normalize ให้ตรงกับ UNIQUE INDEX ฝั่ง DB เป๊ะ (RUN-21 ข้อ 2.1/2.2)
     CODE       -> lower + trim
     Tax/Citizen-> ตัดอักขระที่ไม่ใช่ตัวเลข/ตัวอักษร
     สาขา       -> trim · NULL กับ '' ถือเป็นค่าเดียวกัน
   *** ค่าว่างไม่ถูกนำไปตรวจซ้ำ *** (ข้อกำหนดข้อ 6) */
const dupCode = (v) => String(v == null ? '' : v).trim().toLowerCase();
const dupId = (v) => String(v == null ? '' : v).replace(/[^0-9A-Za-z]/g, '');
const dupBranch = (v) => String(v == null ? '' : v).trim();
/* ป้ายกำกับรายการที่ชน — ใช้ต่อท้ายข้อความแจ้งเตือน (ข้อกำหนดข้อ 10) */
const dupWho = (code, name) => {
  const c = String(code || '').trim(); const n = String(name || '').trim();
  if (!c && !n) return '';
  return ' (CODE: ' + (c || '-') + ' | ชื่อ: ' + (n || '-') + ')';
};
/* แปลง error จาก RPC 'NJACC_PARTY_X_DUPLICATE|CODE|ชื่อ' -> ข้อความ + ช่องที่ต้องไฮไลต์ */
const PARTY_DUP_MSG = {
  NJACC_PARTY_CODE_DUPLICATE:
    ['whp-nc', 'ไม่สามารถบันทึกได้ — CODE นี้มีอยู่ใน Master แล้ว'],
  NJACC_PARTY_TAXBRANCH_DUPLICATE:
    ['whp-nt', 'ไม่สามารถบันทึกได้ — เลขประจำตัวผู้เสียภาษีอากรและสาขานี้มีอยู่ใน Master แล้ว'],
  NJACC_PARTY_CITIZEN_DUPLICATE:
    ['whp-ni', 'ไม่สามารถบันทึกได้ — เลขประจำตัวบัตรประชาชนนี้มีข้อมูลอยู่ใน Master แล้ว'],
};
function parsePartyDup(ex) {
  const raw = String((ex && (ex.message || ex.hint || ex.details)) || '');
  for (const key of Object.keys(PARTY_DUP_MSG)) {
    if (!raw.includes(key)) continue;
    const seg = raw.slice(raw.indexOf(key)).split('|');
    const [field, msg] = PARTY_DUP_MSG[key];
    return { field, msg: msg + dupWho(seg[1], seg[2]) };
  }
  /* ชนกันตอนกดพร้อมกัน — UNIQUE INDEX ที่ DB เป็นด่านสุดท้าย */
  if (raw.includes('NJACC_PARTY_DUPLICATE_RACE'))
    return { field: 'whp-nc',
      msg: 'ไม่สามารถบันทึกได้ — มีผู้อื่นเพิ่งบันทึกข้อมูลที่ซ้ำกัน กรุณาค้นหาใหม่' };
  return null;
}

/* ── §7 แบบที่นำส่ง — ป้ายตรงตามแบบราชการ · เลือกได้ครั้งละ 1 ค่า ──
   เก็บเป็นรหัสในคอลัมน์ form_type (RUN-08) · ป้ายไทยอยู่ฝั่ง UI เท่านั้น */
const FORM_TYPES = [
  ['PND1K', '(1) ภ.ง.ด.1ก'],
  ['PND1K_SPECIAL', '(2) ภ.ง.ด.1ก พิเศษ'],
  ['PND2', '(3) ภ.ง.ด.2'],
  ['PND3', '(4) ภ.ง.ด.3'],
  ['PND2K', '(5) ภ.ง.ด.2ก'],
  ['PND3K', '(6) ภ.ง.ด.3ก'],
  ['PND53', '(7) ภ.ง.ด.53'],
];
/* ── §7 วิธีการจ่ายภาษี — เลือกได้ครั้งละ 1 ค่า · "อื่น ๆ" เปิดช่องกรอกเอง ── */
const PAY_METHOD_OTHER = 'OTHER';
/* ── FIX (V.192) ── ลำดับและป้ายให้ตรงแบบ 50 ทวิ และตรงกับเอกสารที่พิมพ์ออก
   *** สลับเฉพาะลำดับที่แสดง + เลขในวงเล็บ *** รหัสที่เก็บลง pay_method เท่าเดิม
   (WITHHOLD / FOREVER / ONCE / OTHER) -> ข้อมูลเก่าไม่ได้รับผลกระทบ */
/* ── V.214 ── ค่าเริ่มต้นของ "เอกสารใหม่" เท่านั้น
   *** ใช้รหัสที่มีอยู่แล้วใน FORM_TYPES / PAY_METHODS *** ไม่สร้างค่าใหม่ */
const DEFAULT_FORM_TYPE = 'PND53';      /* = (7) ภ.ง.ด.53 */
const DEFAULT_PAY_METHOD = 'WITHHOLD';  /* = (1) หัก ณ ที่จ่าย */
const PAY_METHODS = [
  ['WITHHOLD', '(1) หัก ณ ที่จ่าย'],
  ['FOREVER', '(2) ออกให้ตลอดไป'],
  ['ONCE', '(3) ออกให้ครั้งเดียว'],
  [PAY_METHOD_OTHER, '(4) อื่น ๆ (ระบุ)'],
];
/* ป้ายสั้นสำหรับตารางรายการ — สร้างจาก FORM_TYPES ชุดเดียวกัน (ตัดเลขข้อหน้าออก)
   -> ชื่อในตารางกับในหน้าเปิดงานมาจากแหล่งเดียว ไม่มีทางไม่ตรงกัน */
/* ══ คอลัมน์หน้ารายการ — แหล่งเดียว (หัวตาราง + แถว ใช้ชุดนี้ร่วมกัน) ═══════
   [label, hidden?, cellFn, thClass]
   *** ค่าเริ่มต้น = แสดงทุกคอลัมน์ (hidden = false ทั้งหมด) ***
   ผู้ใช้เลือกซ่อนเองได้ที่ ⚙ คอลัมน์ และค่าที่ตั้งจะถูกจำไว้
   (เดิม V.169 ตั้ง hidden = true ไว้ 24 คอลัมน์ ทำให้เปิดมาแล้วเห็นไม่ครบ)
   ค่าที่ใช้ทั้งหมดมาจาก njacc_list_wht (RUN-12 ต่อสายให้ครบแล้ว)
   หัวตารางกับแถวสร้างจาก array เดียวกัน -> จำนวนคอลัมน์ไม่มีทางไม่ตรงกัน
   และ Column Manager (components/table.js) อ่าน label จาก th.textContent
   -> ชื่อในตารางกับในหน้าต่างจัดการคอลัมน์ตรงกันเสมอ */
const WHT_COLS = [
  ['เลขที่หนังสือรับรอง', false, (r, x) => x.certCell, 't-b'],
  ['วันที่ออกเอกสาร',     false, (r) => dmy(r.document_date)],
  ['วันที่จ่าย',          false, (r) => dmy(r.pay_date)],
  ['Ref. Date',           false,  (r) => dmy(r.ref_date)],
  ['เล่มที่',             false,  (r) => esc(r.book_no || '-')],
  ['เลขที่งาน',           false,  (r) => esc(r.job_no || '-')],
  ['Reference No.',       false,  (r) => esc(r.reference_no || '-')],
  ['Invoice No.',         false, (r) => esc(r.invoice_no_text || r.invoice_no || '-'), 't-b'],
  /* ── V.204 ── CODE ของ Master (ไม่ใส่ข้อมูลละเอียดเกินจำเป็นลงหน้ารายการ) */
  ['CODE ผู้มีหน้าที่หักภาษี', false, (r) => esc(r.payer_code || '-')],
  ['ก. ผู้มีหน้าที่หักภาษี', false, (r) => esc(r.payer_name || r.customer_name || '-'), 'ellip'],
  ['Tax ID ผู้หัก',        false,  (r) => esc(r.payer_tax_id || '-')],
  /* ── V.203 ── เลขบัตรประชาชน · ข้อมูลบุคคล -> ตั้ง hidden = true (ซ่อนเริ่มต้น)
     ผู้ใช้เปิดเองได้ที่ ⚙ คอลัมน์ · ค่ามาจาก njacc_list_wht (RUN-19) */
  ['เลขบัตรประชาชนผู้มีหน้าที่หักภาษี', true, (r) => esc(r.payer_citizen_id || '-')],
  ['สาขาผู้หัก',           false,  (r) => esc(r.payer_branch || '-')],
  ['ที่อยู่ผู้หัก',         false,  (r) => esc(r.payer_address || '-'), 'ellip'],
  ['CODE ผู้ถูกหักภาษี',    false,  (r) => esc(r.payee_code || '-')],
  ['ข. ผู้ถูกหักภาษี',     false, (r) => esc(r.payee_name || '-'), 'ellip'],
  ['Tax ID ผู้ถูกหัก',     false,  (r) => esc(r.payee_tax_id || '-')],
  ['เลขบัตรประชาชนผู้ถูกหักภาษี', true, (r) => esc(r.payee_citizen_id || '-')],
  ['สาขาผู้ถูกหัก',        false,  (r) => esc(r.payee_branch || '-')],
  ['ที่อยู่ผู้ถูกหัก',      false,  (r) => esc(r.payee_address || '-'), 'ellip'],
  ['กระทำการแทนโดย',      false,  (r) => esc(r.agent_name || '-'), 'ellip'],
  ['Tax ID ผู้กระทำการแทน', false, (r) => esc(r.agent_tax_id || '-')],
  ['ประเภทเงินได้',        false,  (r) => esc(INCOME_LABEL[r.wht_type] || r.wht_type || '-')],
  ['จำนวนเงินที่จ่าย',     false, (r) => money(r.tax_base), 'r'],
  ['อัตรา',               false, (r) => `<span class="wht-rate-chip">${esc(pct(r.rate))}</span>`, 'center'],
  ['ภาษีที่หัก',           false, (r) => money(r.amount), 'r t-b'],
  ['แบบที่นำส่ง',          false,  (r) => esc(FORM_LABEL[r.form_type] || r.form_type || '-')],
  ['ลำดับที่ในแบบ',        false,  (r) => esc(r.form_seq || '-')],
  ['วิธีการจ่ายภาษี',      false,  (r) => esc(PAY_LABEL[r.pay_method] || r.pay_method || '-')],
  ['ระบุ (อื่น ๆ)',        false,  (r) => esc(r.pay_method_other || '-')],
  ['ผู้ลงนาม',            false,  (r) => esc(r.signer_name || '-')],
  ['ตำแหน่ง',             false,  (r) => esc(r.signer_position || '-')],
  ['ผู้จ่ายเงิน (อื่นๆ)',   false,  (r) => esc(r.payment_by || '-')],
  ['หมายเหตุ',            false,  (r) => esc(r.note || '-'), 'ellip'],
  ['เลขอ้างอิงภายใน',      false,  (r, x) => x.internalNo],
  ['จำนวนรายการ',          false,  (r) => esc(String(r.item_count == null ? '-' : r.item_count)), 'center'],
  /* ── V.223 ── เหตุผล/วันเวลายกเลิก — ซ่อนเริ่มต้น (hidden = true)
     เปิดดูย้อนหลังได้ที่ ⚙ คอลัมน์ (Column Manager เดิม ไม่ได้สร้างใหม่)
     *** คนละช่องกับ "หมายเหตุ" ของเอกสาร (w.note) *** Audit แยกกันชัดเจน (ข้อ 18) */
  ['เหตุผลยกเลิก',         true,  (r) => esc(r.void_reason || '-'), 'ellip'],
  ['วันเวลาที่ยกเลิก',      true,  (r) => esc(r.voided_at ? dmy(r.voided_at) : '-')],
  /* ── V.221 ── ถอดคอลัมน์ "สถานะ" ออกจากหน้ารายการ
     Flow ใหม่ไม่มี POST แล้ว ผู้ใช้จึงไม่ต้องรับรู้ DRAFT / ISSUED
     *** ถอดจาก Column Definition ที่เดียว *** -> หัวตาราง · แถวข้อมูล ·
     ⚙ คอลัมน์ (Column Manager สร้างจาก <th> ชุดนี้) หายพร้อมกันทั้งหมด
     saved layout เก่าถูกทิ้งเองโดย sigOf(defs) ใน table.js -> ไม่มี ghost column
     *** ไม่แตะ Database *** คอลัมน์ status / njacc_post_wht / njacc_unpost_wht
     ยังอยู่ครบใน Production (ซ่อนจาก Frontend เท่านั้น ตามข้อ 3) */
  ['จัดการ',              false, (r, x) => x.act, 'center'],
];

/* ป้ายประเภทเงินได้ — จาก INCOME_TYPES ชุดเดียวกับ dropdown ในฟอร์ม */
const INCOME_LABEL = Object.fromEntries(INCOME_TYPES);

/* ป้ายวิธีการจ่ายภาษีสำหรับตาราง — สร้างจาก PAY_METHODS ชุดเดียว ไม่เขียนซ้ำ */
const PAY_LABEL = Object.fromEntries(
  PAY_METHODS.map(([v, l]) => [v, l.replace(/^\(\d+\)\s*/, '')]));

const FORM_LABEL = Object.fromEntries(
  FORM_TYPES.map(([v, l]) => [v, l.replace(/^\(\d+\)\s*/, '')]));

/* radio ชุดเดียวใช้ทั้ง 2 กลุ่ม — ป้ายและค่าเก็บแยกกันชัดเจน ไม่ปนกัน */
const radioRow = (name, list, sel) => list.map(([v, l]) =>
  `<label class="whp-rd"><input type="radio" name="${name}" value="${esc(v)}"
     ${v === sel ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('');

/* สถานะ — ใช้ของเดิมของระบบ ไม่สร้างสถานะใหม่
   DRAFT = ร่าง · ISSUED = ออกจริงแล้ว · VOID = ยกเลิก */
const ST_BDG = {
  DRAFT: ['bdg-due-ok', 'ร่าง'],
  ISSUED: ['bdg-issued', 'บันทึกแล้ว'],
  VOID: ['bdg-void', 'VOID'],
};
const stBadge = (s) => {
  const [c, t] = ST_BDG[String(s || '').toUpperCase()] || ['bdg-due-ok', s || '-'];
  return `<span class="bdg ${c}">${esc(t)}</span>`;
};

function backendPanel(cnt) {
  cnt.innerHTML = `
    ${/* ถอดหัวข้อชุดเดียวกันออก — ชื่อหน้าแสดงที่ Topbar แล้ว */ ''}
    <div class="card card-pad whp-req">
      <h3 class="t-b">BACKEND REQUIRED — ยังใช้งานไม่ได้</h3>
      <p class="t-2 mt-1">ตรวจกับฐานข้อมูลจริงแล้ว ระบบยังไม่มีโครงสร้างของหนังสือรับรอง 50 ทวิ</p>
      <ul class="whp-req-l">
        <li>ไม่มีตาราง <code>njacc_wht_items</code> — เก็บได้ 1 รายการต่อ 1 ใบเท่านั้น</li>
        <li>สถานะยังไม่รองรับ <code>DRAFT</code> — บันทึกร่างแล้วกลับมาแก้ไม่ได้</li>
        <li><code>njacc_list_wht</code> ยังไม่คืน เลขผู้เสียภาษี / สาขา / ที่อยู่ ของผู้หักภาษี</li>
        <li>ไม่มี RPC สำหรับเลือก INVOICE มาอ้างอิงพร้อมอัตรา WHT และวันที่จ่ายเงินจริง</li>
        <li>ไม่มีคอลัมน์ <code>certificate_no</code> — แยกเลขหนังสือรับรองของผู้หัก
            ออกจากเลขอ้างอิงภายในไม่ได้</li>
        <li><code>njacc_create_wht</code> เดิมยังเปิดให้ยิงตรงและมี Default 3%</li>
      </ul>
      <p class="t-sm t-3 mt-2">ให้รันไฟล์นี้บน Supabase ก่อน แล้วรีเฟรชหน้านี้อีกครั้ง:</p>
      <p class="whp-req-f"><code>${esc(SQL_FILE)}</code></p>
      <p class="t-sm t-3 mt-2">ระหว่างที่ยังไม่รัน หน้าอื่นทั้งหมดของระบบทำงานตามปกติ
        — ไฟล์ SQL นี้ไม่แตะ INVOICE / RECEIPT / CREDIT NOTE / สิทธิ์ผู้ใช้เดิม</p>
    </div>`;
}

export async function render(cnt) {
  ed = null;
  await masters();
  await renderList(cnt);
}

/* ══════════════════════════════════════════════════════════════════
   1 · หน้ารายการ
   ══════════════════════════════════════════════════════════════════ */
async function renderList(cnt) {
  const mayIssue = isAdmin() || can('issue_receipt');
  cnt.innerHTML = `
    ${/* ── ถอดหัวข้อหน้าออกตามคำสั่ง ─────────────────────────────────────
         เดิมเป็น .page-head ที่มี <h2>REPORT — ใบหัก ณ ที่จ่าย · หนังสือรับรอง…</h2>
         ชื่อหน้ายังแสดงที่ Topbar อยู่แล้ว (routes.js: title 'REPORT — ใบหัก ณ ที่จ่าย'
         -> setTitle) จึงไม่ได้เสียข้อมูลอะไร แค่ตัดข้อความซ้ำบนเนื้อหาออก
         *** ปุ่ม ＋ เปิดงานใหม่ ต้องไม่หายไปด้วย *** ย้ายมาไว้ท้ายแถบตัวกรอง
         id / class / handler เดิมทุกตัวอักษร (#wh-new -> openEditor) */ ''}
    <div class="fbar">
      <select class="sel" data-f="customer">${customerOpts(st.customer)}</select>
      <input class="inp" type="date" data-f="from" value="${st.from}">
      <input class="inp" type="date" data-f="to" value="${st.to}">
      <button class="btn btn-o btn-sm" id="wh-go">ค้นหา</button>
      ${can('export') || isAdmin()
        ? '<button class="btn btn-o btn-sm" id="wh-xls">📗 Export Excel</button>' : ''}
      ${/* ＋ เปิดงานใหม่ ถูก append ใน mountCols() หลัง initColumns()
           เพราะปุ่ม "⚙ คอลัมน์" ไม่ได้อยู่ใน markup — components/table.js
           สร้างด้วย JS แล้ว append เข้า .fbar ตอน initColumns()
           ถ้าใส่ไว้ตรงนี้ ปุ่มคอลัมน์จะไปต่อท้ายเสมอ -> ลำดับผิดสเปก */ ''}</div>
    ${/* หัวตารางสร้างจาก WHT_COLS ชุดเดียวกับแถวข้อมูล
         data-col-default="hidden" -> components/table.js ตั้งเป็นซ่อนเริ่มต้น
         ผู้ใช้เปิด/ปิด/ลากสลับได้ที่ ⚙ คอลัมน์ (บันทึกต่อ User + REPORT_WHT) */ ''}
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      ${WHT_COLS.map(([label, hidden, , cls]) =>
        `<th${cls ? ` class="${cls.replace('ellip', '')}"`.replace(' class=""', '') : ''}${
          hidden ? ' data-col-default="hidden"' : ''}>${esc(label)}</th>`).join('')}
    </tr></thead><tbody id="wh-tbody">
      <tr><td colspan="${WHT_COLS.length}" class="load-row"><div class="spin"></div></td></tr>
    </tbody></table></div>
    <div class="card mt-2" id="wh-pgn"></div>`;

  /* ── "+ เปิดงานใหม่" -> เปิดฟอร์มทันที ────────────────────────────────────
     เดิมเรียก renderPick() ก่อน ทำให้ต้องผ่านหน้า "เลือก INVOICE ต้นทาง"
     แล้วกด "ข้าม — กรอกเองทั้งหมด" ถึงจะเห็นฟอร์ม -> ตัด Gate นั้นออก
     renderPick() *** ไม่ถูกลบ *** ยังเรียกได้จากปุ่ม "ดึงข้อมูลจาก INVOICE"
     ที่อยู่ในฟอร์ม (Optional Helper) */
  /* #wh-new ถูกสร้างและผูก onclick ใน mountCols() (ต้อง append หลังปุ่มคอลัมน์)
     จึงไม่ผูกที่นี่อีก — ไม่งั้นหา element ไม่เจอเพราะยังไม่ถูกสร้าง */
  /* ── 📗 Export Excel ────────────────────────────────────────────────────
     ใช้ Filter ปัจจุบันของหน้า (ลูกค้า/ช่วงวันที่) — *** ทุก Record ตาม Filter ***
     ไม่ใช่เฉพาะ 20 แถวที่แสดงอยู่ (RPC njacc_wht_export ไม่แบ่งหน้า)
     ExcelJS โหลดตอนกดเท่านั้น (lazy) -> ไม่เพิ่มขนาด Initial Bundle */
  const xb = cnt.querySelector('#wh-xls');
  if (xb) xb.onclick = (e) => whtExportExcel({
    from: st.from || null, to: st.to || null,
    customer: st.customer || null, direction: WHT_DIR_AGENT,
  }, e.target);

  cnt.querySelector('#wh-go').onclick = () => {
    cnt.querySelectorAll('[data-f]').forEach(el => { st[el.dataset.f] = el.value; });
    st.page = 1; load();
  };
  cnt.querySelector('#wh-tbody').addEventListener('click', (e) => onRowAction(e, cnt, load));
  /* คลิกแถว = เปิดหนังสือรับรองฉบับนั้น (แทนปุ่ม "ดู / พิมพ์" เดิม — renderer ตัวเดียวกัน
     ซึ่งมีปุ่มพิมพ์อยู่ข้างใน) · ปุ่ม แก้ไขร่าง / POST / UNPOST / ลบร่าง / Void ยังอยู่ครบ */
  /* Column Manager — Mode key REPORT_WHT */
  function mountCols() {
    const host = cnt.querySelector('.fbar');
    initColumns({ table: cnt.querySelector('#wh-tbody') && cnt.querySelector('#wh-tbody').closest('table'),
      modeKey: 'REPORT_WHT', host });
    /* ── ＋ เปิดงานใหม่ ต่อท้าย "⚙ คอลัมน์" ────────────────────────────────
       ต้อง append "หลัง" initColumns() เพราะปุ่มคอลัมน์ถูกสร้างด้วย JS ตอนนั้น
       -> ลำดับสุดท้าย: ลูกค้า | วันที่ | วันที่ | ค้นหา | Export Excel | ⚙ คอลัมน์ | ＋ เปิดงานใหม่
       *** ปุ่มเดิมทั้งดุ้น *** id / class / ข้อความ / สิทธิ์ / handler ไม่เปลี่ยน
       กันปุ่มซ้ำด้วย #wh-new — mountCols() ถูกเรียกซ้ำทุกครั้งที่โหลดแถวใหม่ */
    if (host && mayIssue && !host.querySelector('#wh-new')) {
      host.insertAdjacentHTML('beforeend',
        '<button class="btn btn-p btn-sm" id="wh-new">＋ เปิดงานใหม่</button>');
      const b = host.querySelector('#wh-new');
      if (b) b.onclick = () => openEditor(cnt, {});   /* handler เดิมทุกตัวอักษร */
    }
  }
  mountCols();
  enableRowOpen(cnt.querySelector('#wh-tbody'), async (tr) => {
    const id = tr.dataset.whtid; if (!id) return;
    try { openWhtDoc(await whtView(id)); }
    catch (ex) { isWhtBackendMissing(ex) ? backendPanel(cnt) : toast(whtErrMessage(ex), 'err'); }
  });

  async function load() {
    const t = nextToken('wht');
    const tb = cnt.querySelector('#wh-tbody'); if (!tb) return;
    try {
      /* หน้านี้เป็นทะเบียน "ใบหัก กระทำการแทน" -> ดึงเฉพาะ ACTING_AGENT
         ใบ RECEIVED เดิมยังอยู่ครบใน DB แค่ไม่แสดงในหน้านี้ (RUN-09: p_direction) */
      const res = await listWht({ p_customer: st.customer || null, p_from: st.from || null,
        p_to: st.to || null, p_page: st.page, p_size: st.size,
        p_direction: WHT_DIR_AGENT });
      if (!isCurrent('wht', t)) return;
      const rows = res.rows || [];
      /* RPC รุ่นเก่ายังไม่คืน item_count -> แปลว่ายังไม่ได้รัน 06_RUN-05 */
      if (rows.length && rows[0].item_count === undefined) { backendPanel(cnt); return; }
      tb.innerHTML = rows.length ? rows.map(r => {
        const s = String(r.status || '').toUpperCase();
        const no = String(r.document_no || '');
        const isDraft = s === 'DRAFT' || /^WHTDRAFT-/.test(no);
        /* ── V.223 ── เอกสารที่ถูกยกเลิกแล้ว (Soft Cancel) */
        const isVoid = s === 'VOID';
        const cert = String(r.certificate_no || '').trim();
        /* ── ค่าที่ต้องประกอบก่อน (ใช้ในหลายคอลัมน์) ──
           ส่งเข้า cellFn ผ่าน x เพื่อไม่ต้องคำนวณซ้ำในแต่ละช่อง */
        const x = {
          /* ── V.221 ── ไม่แสดงคำว่า "ร่าง" ในหน้ารายการอีก (ข้อ 2 / TEST-03)
             ยังไม่กรอกเลขที่ -> ขีดกลางเฉย ๆ (ความหมายเดิม: ยังไม่มีค่า) */
          certCell: cert ? esc(cert) : '<span class="t-3">-</span>',
          internalNo: (!isDraft && no) ? esc(no) : '<span class="t-3">-</span>',
          badge: stBadge(s),
          act: `<div class="ch-act">
          ${/* ── V.223 ── Flow ใหม่เหลือ 3 ปุ่ม : 🖨 พิมพ์ · ✏️ แก้ไข · 🚫 ยกเลิก
               *** ถอด ⬆ POST · ↩ UNPOST · 🗑 ลบร่าง ออกจาก UI ***
               *** ถอดเฉพาะปุ่ม *** handler + RPC เดิมยังอยู่ครบ ไม่ถูกลบ (ข้อ 2)
               พิมพ์   : มี Reference No. เท่านั้น (ไม่ผูกกับ status === 'ISSUED')
                        เอกสารที่ยกเลิกแล้วยังพิมพ์ได้ตาม Business Logic เดิม
                        (แบบ 50 ทวิ มีลายน้ำ VOID ของตัวเองอยู่แล้ว — ข้อ 13)
               แก้ไข   : เฉพาะที่ยัง *** ไม่ถูกยกเลิก *** (ข้อ 12)
               ยกเลิก : Soft Cancel ผ่าน njacc_void_wht เดิม · กดซ้ำไม่ได้ (ข้อ 17)
                        ใช้ Permission Gate เดิมของ VOID (can('void') / ADMIN) */ ''}
          ${(String(r.reference_no || '').trim() && (isAdmin() || can('view')))
            ? `<button class="btn btn-o btn-sm" data-print="${r.id}">🖨 พิมพ์</button>` : ''}
          ${isVoid
            ? '<span class="bdg bdg-void">ยกเลิกแล้ว</span>'
            : `${(isAdmin() || can('issue_receipt'))
                 ? `<button class="btn btn-o btn-sm" data-edit="${r.id}">✏️ แก้ไข</button>` : ''}
               ${(isAdmin() || can('void'))
                 ? `<button class="btn btn-danger btn-sm" data-cancel="${r.id}"
                      data-ref="${esc(r.reference_no || '')}">🚫 ยกเลิก</button>` : ''}`}
        </div>`,
        };
        /* แถวสร้างจาก WHT_COLS ชุดเดียวกับหัวตาราง -> จำนวนช่องตรงกันเสมอ
           .ellip ใส่ max-width เพื่อไม่ให้ข้อความยาวดันตารางบาน */
        return `<tr data-whtid="${esc(r.id)}">${
          WHT_COLS.map(([, , fn, cls]) =>
            `<td${cls ? ` class="${cls}"` : ''}${
              (cls || '').includes('ellip') ? ' style="max-width:190px"' : ''}>${
              fn(r, x)}</td>`).join('')}</tr>`; }).join('')
        : `<tr><td colspan="${WHT_COLS.length}" class="empty">ยังไม่มีหนังสือรับรองหัก ณ ที่จ่าย</td></tr>`;
      renderPagination(cnt.querySelector('#wh-pgn'),
        { page: st.page, size: st.size, total: res.total || 0 },
        ({ page, size }) => { st.page = page; st.size = size; load(); });
      mountCols();                       /* จัดคอลัมน์ตามที่ผู้ใช้ตั้งไว้ (แถวใหม่ทุกครั้ง) */
    } catch (e) {
      if (!isCurrent('wht', t)) return;
      if (isWhtBackendMissing(e)) { backendPanel(cnt); return; }
      tb.innerHTML = `<tr><td colspan="${WHT_COLS.length}" class="empty">โหลดรายการไม่สำเร็จ</td></tr>`;
      handleErr(e);
    }
  }
  await load();
}

async function onRowAction(e, cnt, reload) {
  const doc = e.target.closest('[data-doc]');
  if (doc) {
    try { openWhtDoc(await whtView(doc.dataset.doc)); }
    catch (ex) { isWhtBackendMissing(ex) ? backendPanel(cnt) : toast(whtErrMessage(ex), 'err'); }
    return;
  }
  const eb = e.target.closest('[data-edit]');
  if (eb) { openEditor(cnt, { whtId: eb.dataset.edit }); return; }

  /* ── V.215 ── 🖨 พิมพ์ จากหน้ารายการ — ใช้เส้นทางเดิม whtView -> openWhtDoc
     *** ไม่สร้าง Logic พิมพ์ใหม่ *** และไม่แตะเลขใด ๆ */
  const pb2 = e.target.closest('[data-print]');
  if (pb2) {
    try { openWhtDoc(await whtView(pb2.dataset.print)); }
    catch (ex) { toast(whtErrMessage(ex), 'err'); }
    return;
  }

  const pb = e.target.closest('[data-post]');
  if (pb) {
    if (!await confirmModal('ยืนยัน POST หนังสือรับรองการหักภาษี ณ ที่จ่าย?',
      'ระบบจะออกเลขอ้างอิงภายในและล็อกเอกสารไว้<br>' +
      'หลัง POST แก้ไขข้อมูลไม่ได้ — ต้องกด <b>↩ UNPOST</b> ก่อน<br>' +
      'INVOICE ต้นฉบับจะไม่ถูกแก้ไขใด ๆ', 'POST')) return;
    try {
      const r = await once('post-wht-' + pb.dataset.post, () => postWht(pb.dataset.post, newRequestId()));
      /* ── V.207 ── ต่อท้ายด้วย Reference No. ที่ RPC เพิ่งออกให้
         *** ข้อความเดิม (เลขอ้างอิงภายใน = document_no) ยังอยู่ครบ ***
         เอกสารเก่า/RPC เก่าที่ไม่คืน reference_no -> ไม่ต่อท้าย ไม่พัง */
      if (r) toast('POST สำเร็จ — เลขอ้างอิงภายใน ' + (r.document_no || '')
        + (r.reference_no ? ' · Reference No. ' + r.reference_no : ''), 'ok');
      reload();
    } catch (ex) { toast(whtErrMessage(ex), 'err'); }
    return;
  }
  /* ↩ UNPOST จากหน้ารายการ — เส้นทางเดียวกับปุ่มในฟอร์ม (RPC เดิมตัวเดียว) */
  const upb = e.target.closest('[data-unpost]');
  if (upb) {
    const reason = await reasonModal('UNPOST หนังสือรับรอง — กลับเป็นร่างเพื่อแก้ไข ' +
      '(เลขเดิมถูกเก็บไว้ · POST อีกครั้งจะใช้เลขเดิม)');
    if (!reason) return;
    try {
      const r = await once('unpost-wht-' + upb.dataset.unpost,
        () => unpostWht(upb.dataset.unpost, reason));
      toast('UNPOST แล้ว — กลับเป็นร่าง เลขเดิม ' + ((r && r.document_no) || ''), 'ok');
      reload();
    } catch (ex) { toast(whtErrMessage(ex), 'err'); }
    return;
  }
  /* ══ V.223 · 🚫 ยกเลิกใบหัก ณ ที่จ่าย (Soft Cancel) ═══════════════════════
     Dialog เล็ก : ข้อความยืนยัน + ช่อง "หมายเหตุ / เหตุผลที่ยกเลิก *" (Required)
     ว่าง -> แจ้ง "กรุณาระบุเหตุผลที่ยกเลิก" และไม่ยิง RPC (ข้อ 6)
     *** ใช้ RPC เดิม njacc_void_wht *** ไม่สร้าง cancelWht2 / RPC ใหม่ (ข้อ 9)
     *** ไม่ DELETE *** RPC ทำ UPDATE status='VOID' + voided_by/at + void_reason
     เลข Reference No. / Ref. Date / ข้อมูลเอกสาร คงเดิมทั้งหมด (ข้อ 7/14/15) */
  const cb = e.target.closest('[data-cancel]');
  if (cb) {
    const id = cb.dataset.cancel;
    const refNo = cb.dataset.ref || '';
    const body = document.createElement('div');
    body.innerHTML = `
      <p class="t-sm">ต้องการยกเลิกใบหัก ณ ที่จ่าย
        ${refNo ? '<b>Reference No. ' + esc(refNo) + '</b>' : 'ฉบับนี้'} ใช่หรือไม่?</p>
      <p class="t-xs t-3">การยกเลิกจะเก็บเอกสารและเลขอ้างอิงเดิมไว้ — ไม่ได้ลบข้อมูล</p>
      <div class="fld"><label>หมายเหตุ / เหตุผลที่ยกเลิก <span class="req">*</span></label>
        <textarea class="inp w100" id="wh-cxr" rows="3"
          placeholder="ระบุเหตุผลที่ยกเลิกเอกสารฉบับนี้"></textarea></div>`;
    const foot = document.createElement('div');
    foot.innerHTML = `<div class="mf-right">
        <button class="btn btn-o" data-close>ยกเลิก</button>
        <button class="btn btn-danger" id="wh-cxok">ยืนยันการยกเลิก</button></div>`;
    openModal({ title: 'ยกเลิกใบหัก ณ ที่จ่าย', body, footer: foot });
    foot.querySelector('#wh-cxok').onclick = async (ev) => {
      clearInvalid(body);
      const reason = (body.querySelector('#wh-cxr').value || '').trim();
      if (!reason) {
        markInvalid(body.querySelector('#wh-cxr'), 'กรุณาระบุเหตุผลที่ยกเลิก');
        toast('กรุณาระบุเหตุผลที่ยกเลิก', 'err');
        return;                                   /* ไม่ปิด Dialog · ไม่ยิง RPC */
      }
      btnBusy(ev.target, true);
      try {
        await once('cancel-wht-' + id, () => voidWht(id, reason, newRequestId()));
        closeModal();
        toast('ยกเลิกเอกสารแล้ว', 'ok');
        reload();                                  /* Refresh หน้ารายการ (ข้อ 11) */
      } catch (ex) { toast(whtErrMessage(ex), 'err'); btnBusy(ev.target, false); }
    };
    return;
  }

  const db = e.target.closest('[data-del]');
  if (db) {
    /* ── V.221 ── ข้อความไม่ใช้คำว่า "ร่าง" แล้ว (ข้อ 9)
       *** Backend Guard เดิมไม่เปลี่ยน *** njacc_delete_wht_draft ยังลบได้เฉพาะ
       status = DRAFT เท่านั้น — เปลี่ยนเฉพาะข้อความที่ผู้ใช้เห็น */
    const reason = await reasonModal('ลบหนังสือรับรองหัก ณ ที่จ่าย (ลบได้เฉพาะใบที่ยังไม่ออกจริง)');
    if (!reason) return;
    try {
      await once('del-wht-' + db.dataset.del, () => deleteWhtDraft(db.dataset.del, reason));
      toast('ลบแล้ว', 'ok'); reload();
    } catch (ex) { toast(whtErrMessage(ex), 'err'); }
    return;
  }
  const vb = e.target.closest('[data-void]');
  if (vb) {
    const reason = await reasonModal('Void หนังสือรับรอง ' + vb.dataset.no);
    if (!reason) return;
    try {
      await once('void-wht-' + vb.dataset.void, () => voidWht(vb.dataset.void, reason, newRequestId()));
      toast('Void เอกสารแล้ว', 'ok'); reload();
    } catch (ex) { handleErr(ex); }
  }
}

/* ══════════════════════════════════════════════════════════════════
   2 · ดึงข้อมูลจาก INVOICE — *** Optional Helper เท่านั้น ***
       ไม่ใช่ Gate ก่อนเปิดฟอร์มอีกแล้ว (ปุ่ม "+ เปิดงานใหม่" เข้าฟอร์มตรง)
       เรียกจากปุ่ม "🔎 ดึงข้อมูลจาก INVOICE" ที่อยู่ในฟอร์ม
   ══════════════════════════════════════════════════════════════════ */
async function renderPick(cnt) {
  pk.page = 1;
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span>
      <h2>ดึงข้อมูลจาก INVOICE</h2></div>
      <button class="btn btn-o" id="wh-back">← กลับฟอร์ม</button></div>
    <div class="card card-pad">
      <p class="t-sm t-3">เลือกใบแจ้งหนี้เพื่อเติมลูกค้า · รายการ · อัตรา WHT ให้อัตโนมัติ
        · เป็นตัวช่วยเท่านั้น กรอกเองทั้งหมดก็ได้</p>
      <div class="fbar mt-2">
        <input class="inp" id="wh-pq" value="${esc(pk.q)}" placeholder="ค้นหา เลขที่ INVOICE / ชื่อลูกค้า">
        <button class="btn btn-o btn-sm" id="wh-pgo">ค้นหา</button>
        <button class="btn btn-o btn-sm" id="wh-skip">← กลับฟอร์ม</button>
      </div>
      <div class="tbl-wrap mt-2"><table class="tbl"><thead><tr>
        <th>INVOICE</th><th>วันที่</th><th>ลูกค้า</th><th>ประเภท</th>
        <th class="r">ยอดสุทธิ</th><th>อัตรา WHT</th><th class="r">WHT</th>
        <th>วันที่จ่ายจริง</th><th class="center">จัดการ</th>
      </tr></thead><tbody id="wh-ptb">
        <tr><td colspan="9" class="load-row"><div class="spin"></div></td></tr>
      </tbody></table></div>
      <div class="mt-2" id="wh-ppgn"></div>
    </div>`;

  cnt.querySelector('#wh-back').onclick = () => renderList(cnt);
  cnt.querySelector('#wh-skip').onclick = () => openEditor(cnt, {});
  const q = cnt.querySelector('#wh-pq');
  cnt.querySelector('#wh-pgo').onclick = () => { pk.q = q.value.trim(); pk.page = 1; loadPick(); };
  q.addEventListener('input', () => debounce('wh-pick', () => {
    pk.q = q.value.trim(); pk.page = 1; loadPick();
  }, 350));
  cnt.querySelector('#wh-ptb').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pick]');
    if (b) openEditor(cnt, { invoice: JSON.parse(b.dataset.pick) });
  });

  async function loadPick() {
    const t = nextToken('wh-pick');
    const tb = cnt.querySelector('#wh-ptb'); if (!tb) return;
    try {
      const res = await whtInvoiceOptions({ q: pk.q || null, page: pk.page, size: pk.size });
      if (!isCurrent('wh-pick', t)) return;
      const rows = res.rows || [];
      tb.innerHTML = rows.length ? rows.map(r => {
        const bd = r.wht_breakdown || [];
        const rateTxt = bd.length ? bd.map(b => pct(b.rate)).join(' + ') : '-';
        return `<tr>
        <td class="t-b">${esc(r.invoice_no || '-')}</td>
        <td>${dmy(r.invoice_date)}</td>
        <td class="ellip" style="max-width:190px">${esc(r.customer_name || '-')}</td>
        <td>${esc(r.charge_type || '-')}</td>
        <td class="r">${money(r.total_amount)}</td>
        <td class="center">${esc(rateTxt)}</td>
        <td>${r.payment_date ? dmy(r.payment_date)
          : ((r.payments || []).length > 1
             ? '<span class="t-3">' + (r.payments || []).length + ' ครั้ง — เลือกเอง</span>'
             : '<span class="t-3">ยังไม่รับชำระ</span>')}</td>
        <td><div class="ch-act">
          <button class="btn btn-p btn-sm" data-pick='${JSON.stringify(r).replace(/'/g, "&#39;")}'>เลือก</button>
        </div></td></tr>`; }).join('')
        : '<tr><td colspan="9" class="empty">ไม่พบ INVOICE — กด “ข้าม” เพื่อกรอกเองได้</td></tr>';
      renderPagination(cnt.querySelector('#wh-ppgn'),
        { page: pk.page, size: pk.size, total: res.total || 0 },
        ({ page, size }) => { pk.page = page; pk.size = size; loadPick(); });
    } catch (e) {
      if (!isCurrent('wh-pick', t)) return;
      if (isWhtBackendMissing(e)) { backendPanel(cnt); return; }
      /* ตารางเลือก INVOICE มี 9 คอลัมน์ของตัวเอง (คนละชุดกับ WHT_COLS ของหน้ารายการ) */
      tb.innerHTML = '<tr><td colspan="9" class="empty">โหลดรายการไม่สำเร็จ</td></tr>';
      toast(whtErrMessage(e), 'err');
    }
  }
  await loadPick();
}

/* ── เติมข้อมูล "ผู้มีหน้าที่หักภาษี" จาก Customer Master ────────────────────
   force=false (ตอนเปิดฟอร์ม) : เติมเฉพาะช่องที่ยังว่าง
     -> เอกสารเก่าที่บันทึก snapshot ไว้แล้วไม่ถูกเขียนทับ
        (ลูกค้าอาจย้ายที่อยู่ภายหลัง — กระดาษต้องคงข้อมูล ณ วันที่ออกเอกสาร)
   force=true  (ผู้ใช้เปลี่ยนลูกค้าเอง) : เขียนทับให้ตรงลูกค้าใหม่
   ไม่พบลูกค้าใน Master -> ไม่แตะค่าเดิม (ไม่ล้างเป็นว่าง) */
function fillPayerFromMaster(force) {
  if (!ed) return;
  const c = activeCustomers().find(x => x.id === ed.customer_id) || null;
  if (!c) return;
  const set = (k, v) => { if (force || !ed[k]) ed[k] = v || ''; };
  set('payer_name', c.customer_name);
  set('payer_tax_id', c.tax_id);
  set('payer_branch', c.branch_code);
  set('payer_address', c.address);
}

/* ══════════════════════════════════════════════════════════════════
   3 · ฟอร์มหนังสือรับรอง
   ══════════════════════════════════════════════════════════════════ */
async function openEditor(cnt, { whtId = null, invoice = null } = {}) {
  cnt.innerHTML = '<div class="card card-pad"><div class="load-row"><div class="spin"></div></div></div>';

  let prev = null;
  if (whtId) {
    try { prev = await whtView(whtId); }
    catch (e) {
      if (isWhtBackendMissing(e)) { backendPanel(cnt); return; }
      toast(whtErrMessage(e), 'err'); return renderList(cnt);
    }
  }

  const today = ymd(new Date());
  /* สถานะเอกสารที่โหลดมา — ใช้ Lock ฟอร์มเมื่อ POST แล้ว
     DRAFT แก้ได้ · ISSUED ล็อก (ต้อง UNPOST ก่อน) · VOID ดูอย่างเดียว */
  const prevStatus = String((prev && prev.status) || 'DRAFT').toUpperCase();
  const isIssued = prevStatus === 'ISSUED';
  const isVoidDoc = prevStatus === 'VOID';
  const locked = isIssued || isVoidDoc;
  ed = {
    whtId: whtId || null,
    /* ── ทิศทาง: หน้านี้ออก "ใบหัก กระทำการแทน" เท่านั้น ──
       เอกสารเก่าที่เปิดมาให้คงทิศทางเดิมไว้ (RECEIVED เปิดดู/แก้ได้ ไม่ถูกแปลง) */
    direction: (prev && prev.direction) ? String(prev.direction).toUpperCase() : WHT_DIR_AGENT,
    status: prevStatus,
    customer_id: prev ? prev.customer_id : (invoice ? invoice.customer_id : ''),
    invoice_id: prev ? (prev.invoice_id || null) : (invoice ? invoice.id : null),
    invoice_no: prev ? (prev.invoice && prev.invoice.invoice_no) : (invoice ? invoice.invoice_no : null),
    document_date: prev ? prev.document_date : today,
    /* *** วันที่จ่ายเงินจริง ห้ามใช้ invoice_date แทน (คนละความหมาย) ***
       มี Payment เดียว -> เติมจาก njacc_payments.payment_date จริง
       ไม่มี Payment หรือมีหลายรายการ -> เว้นว่าง ให้ผู้ใช้ระบุเอง
       (มีหลายรายการ SQL จะคืน payment_date = null เพราะไม่เดาว่าจะเอาวันไหน) */
    pay_date: prev ? (prev.pay_date || '') : (invoice ? (invoice.payment_date || '') : ''),
    payments: invoice ? (invoice.payments || []) : [],
    certificate_no: prev ? (prev.certificate_no || '') : '',
    /* Reference No. — เลขอ้างอิงของงาน *** ไม่ใช่ Invoice No. *** จึงไม่ fallback แล้ว */
    reference_no: prev ? (prev.reference_no || '') : '',
    /* ── V.212 ── has_ref = UI State ล้วน *** ไม่มีคอลัมน์ใน Database ***
       มีค่าอย่างน้อย 1 ใน reference_no / ref_date -> ติ๊กและกางให้เห็นทันที
       (ข้อกำหนดข้อ 7) · ทั้งคู่ว่าง = ไม่ติ๊กและซ่อน (ข้อ 8)
       ไม่ถูกส่งขึ้น payload · ไม่อยู่ใน DIRTY_KEYS */
    has_ref: !!(prev && [prev.reference_no, prev.ref_date]
      .some(v => String(v == null ? '' : v).trim())),
    note: prev ? (prev.note || '') : '',
    /* ── ฟิลด์ชุดใหม่ (RUN-08) ────────────────────────────────────────────
       เอกสารเก่าที่ยังไม่มีค่า -> '' -> บันทึกเป็น NULL · ไม่บังคับกรอก
       ผู้หัก/ตัวแทน/ผู้ถูกหัก เก็บเป็น snapshot ตอนออกเอกสาร
       (customer_id / payee_customer_id ยังเป็นตัวอ้างอิงหลักไว้ค้นย้อนหลัง) */
    book_no: prev ? (prev.book_no || '') : '',
    /* ── RUN-10 ── Invoice No. เป็นข้อความ *** คนละช่องกับ reference_no ***
       ผูก INVOICE จริงอยู่แล้ว -> เติมเลขให้อัตโนมัติ แต่ผู้ใช้พิมพ์ทับได้ */
    invoice_no_text: prev ? (prev.invoice_no_text || '')
      : (invoice ? (invoice.invoice_no || '') : ''),
    payee_code: prev ? (prev.payee_code || '') : '',
    /* ผู้จ่ายเงิน (EDC/IKANO/KN/...) — *** คนละความหมายกับ signer_name (ผู้ลงนาม) *** */
    payment_by: prev ? (prev.payment_by || '') : '',
    /* ── เงินกองทุน 3 ช่องบนแบบ 50 ทวิ (RUN-14) ── เก็บเป็นข้อความในฟอร์ม
       ส่งขึ้น RPC เป็นค่าว่าง = NULL (ไม่บังคับกรอก)
       ── V.198 ── has_fund = สถานะ Checkbox "เงินกองทุน / ประกันสังคม"
         เอกสารใหม่           -> false (ไม่ติ๊ก · ซ่อนช่องทั้งหมด)
         เอกสารที่บันทึกไว้     -> has_fund ที่ SQL คืนมา
         เอกสารก่อน V.198 (null) -> ถอยไปดูว่ามียอดจริงในช่องใดช่องหนึ่งหรือไม่
           *** เอกสารเดิมที่มียอดกองทุนจึงเปิดมาแล้วติ๊กให้อัตโนมัติ *** */
    has_fund: prev
      ? ((prev.has_fund === true || prev.has_fund === false)
          ? prev.has_fund
          : [prev.gpf_amount, prev.social_security_amount, prev.provident_fund_amount]
              .some(x => x != null && Number(x) !== 0))
      : false,
    gpf_amount: prev ? (prev.gpf_amount == null ? '' : String(prev.gpf_amount)) : '',
    social_security_amount: prev
      ? (prev.social_security_amount == null ? '' : String(prev.social_security_amount)) : '',
    provident_fund_amount: prev
      ? (prev.provident_fund_amount == null ? '' : String(prev.provident_fund_amount)) : '',
    ref_date: prev ? (prev.ref_date || '') : '',
    job_no: prev ? (prev.job_no || '') : '',
    /* ── V.203 ── เลขประจำตัวบัตรประชาชน *** คนละฟิลด์กับ payer_tax_id ***
       ไม่บังคับกรอก (นิติบุคคลใช้เลขผู้เสียภาษีแทน) · เก็บเป็น String เสมอ */
    /* ── V.204 ── CODE ของ Master ที่เลือกตอนออกเอกสาร (Snapshot)
       payee_code มีอยู่แล้วตั้งแต่ RUN-10 · เพิ่มฝั่งผู้หักฯ ให้ครบคู่ */
    payer_code: prev ? (prev.payer_code || '') : '',
    payer_citizen_id: prev ? (prev.payer_citizen_id || '') : '',
    payer_name: prev ? (prev.payer_name || '') : '',
    payer_tax_id: prev ? (prev.payer_tax_id || '') : '',
    payer_branch: prev ? (prev.payer_branch || '') : '',
    payer_address: prev ? (prev.payer_address || '') : '',
    /* ── กระทำการแทนโดย (V.196) — เป็น "ตัวเลือก" ของแต่ละเอกสารแล้ว ──
       has_agent = สถานะ Checkbox ข้างหัวข้อ "ผู้มีหน้าที่หักภาษี ณ ที่จ่าย"
         เอกสารใหม่          -> false (ไม่ติ๊ก · ไม่แสดงช่อง · ไม่เติม N.J. ให้)
         เอกสารเก่า/ที่บันทึกไว้ -> has_acting_agent ที่ SQL คืนมา
         เอกสารก่อน V.196 (has_acting_agent = null) -> ถอยไปดู agent_name จริง
           *** เอกสารเดิมที่มีกระทำการแทนจึงเปิดมาแล้วติ๊กให้อัตโนมัติ ***
       ค่า Default ของ N.J. ย้ายไปเติม "ตอนติ๊กครั้งแรก" แทน (ดู applyAgentDefaults) */
    has_agent: prev
      ? ((prev.has_acting_agent === true || prev.has_acting_agent === false)
          ? prev.has_acting_agent
          : !!String(prev.agent_name || '').trim())
      : false,
    agent_name: prev ? (prev.agent_name || '') : '',
    agent_tax_id: prev ? (prev.agent_tax_id || '') : '',
    /* ── สาขาเป็นรหัสตัวเลข (V.182) · ── V.220 ── เปลี่ยนเป็น 5 หลัก ──
       เดิม default เป็นข้อความ 'สำนักงานใหญ่' ซึ่งขัดกับช่อง digits-only
       รหัสสำนักงานใหญ่ตามแบบกรมสรรพากรคือ 00000 (5 หลัก)
       *** คอลัมน์เป็น text *** เลขศูนย์นำหน้าจึงไม่หาย
       เอกสารเก่าที่เก็บ 'สำนักงานใหญ่' ไว้ยังโหลดขึ้นมาแสดงได้ตามเดิม
       (prev.agent_branch ถูกใช้ก่อนเสมอ — ไม่มีการเขียนทับข้อมูลเดิม) */
    agent_branch: prev ? (prev.agent_branch || '') : '',
    agent_address: prev ? (prev.agent_address || '') : '',
    payee_customer_id: prev ? (prev.payee_customer_id || '') : '',
    payee_citizen_id: prev ? (prev.payee_citizen_id || '') : '',
    payee_name: prev ? (prev.payee_name || '') : '',
    payee_tax_id: prev ? (prev.payee_tax_id || '') : '',
    payee_branch: prev ? (prev.payee_branch || '') : '',
    payee_address: prev ? (prev.payee_address || '') : '',
    /* ── V.214 ── Default *** เฉพาะเอกสารใหม่ *** (prev === null) เท่านั้น
       เอกสารเก่าใช้ค่าที่โหลดมาเสมอ -> ไม่มีทางถูก default เขียนทับ (ข้อ 4/6/8/9)
         ลำดับที่ในแบบยื่นรายการ -> PND53   = "(7) ภ.ง.ด.53"
         ผู้จ่ายเงิน              -> WITHHOLD = "(1) หัก ณ ที่จ่าย"
       ค่าที่เก็บลง DB เป็นรหัสเดิมทั้งคู่ ไม่ได้เปลี่ยนความหมาย */
    form_type: prev ? (prev.form_type || '') : DEFAULT_FORM_TYPE,
    form_seq: prev ? (prev.form_seq || '') : '',
    pay_method: prev ? (prev.pay_method || '') : DEFAULT_PAY_METHOD,
    pay_method_other: prev ? (prev.pay_method_other || '') : '',
    /* ── V.214 ── has_form / has_pm = UI State ล้วน
       *** ไม่มีคอลัมน์ใน Database · ไม่ส่งขึ้น payload · ไม่มี Migration ***
       เอกสารใหม่ -> ติ๊กไว้ทั้งคู่ (ข้อ 8 "ฟิกติ๊กก่อนทุกครั้ง")
       เอกสารเก่า -> ติ๊กเมื่อมีค่าที่บันทึกไว้ในหัวข้อนั้น (ข้อ 9) */
    has_form: prev ? !!(String(prev.form_type || '').trim()
                        || String(prev.form_seq || '').trim()) : true,
    has_pm: prev ? !!(String(prev.pay_method || '').trim()
                      || String(prev.pay_method_other || '').trim()) : true,
    signer_name: prev ? (prev.signer_name || '') : '',
    signer_position: prev ? (prev.signer_position || '') : '',
    /* ── V.210 ── has_signer = UI State ล้วน *** ไม่มีคอลัมน์ใน Database ***
       derive จากข้อมูลเดิม 3 ช่อง -> เอกสารเก่าที่มีค่าอย่างน้อย 1 ช่อง
       เปิดมาแล้วติ๊กให้อัตโนมัติและแสดงข้อมูลครบ (ข้อกำหนด A5 / A6)
       ทั้ง 3 ช่องว่าง -> ไม่ติ๊กและซ่อน · ไม่ถูกส่งขึ้น payload (ดู doSave) */
    has_signer: !!(prev && [prev.signer_name, prev.signer_position, prev.payment_by]
      .some(v => String(v == null ? '' : v).trim())),
    lines: [],
  };
  /* ผู้หักภาษี — เอกสารใหม่เติม snapshot จาก Customer Master ที่เลือกไว้
     เอกสารเก่าที่บันทึก snapshot ไว้แล้ว ใช้ค่าที่บันทึก ไม่เขียนทับ */
  fillPayerFromMaster(false);

  if (prev && (prev.items || []).length) {
    ed.lines = prev.items.map(it => ({
      pay_date: it.pay_date || ed.pay_date,
      income_type: String(it.income_type || 'SERVICE').toUpperCase(),
      description: it.description || '',
      tax_base: num(it.tax_base),
      rate: num(it.rate),
      /* หมวด 50 ทวิ — อ่านจาก DB ไม่คำนวณใหม่ (ผู้ใช้อาจแก้ไว้แล้ว) */
      wht_income_category: it.wht_income_category || '',
      /* ── จำนวนเงินภาษีที่บันทึกไว้จริง ──
         *** ต้องอ่านจาก DB ไม่ใช่คำนวณใหม่ *** ไม่งั้นค่า 299.98 ที่ผู้ใช้กรอก
         จะกลายเป็น 300.00 ทันทีที่เปิดงานเดิมกลับมา */
      amount: num(it.amount),
    }));
  } else if (invoice) {
    /* Auto Fill จาก Invoice — อัตราและฐานมาจาก njacc_invoice_items จริง ไม่ hardcode */
    const bd = invoice.wht_breakdown || [];
    const autoPay = invoice.payment_date || '';   /* ว่างได้ — ห้าม fallback เป็น invoice_date */
    ed.lines = bd.length ? bd.map(b => ({
      pay_date: autoPay,
      income_type: String(invoice.charge_type || '').toUpperCase() === 'ADVANCE' ? 'OTHER' : 'SERVICE',
      description: b.description || invoice.description || '',
      tax_base: num(b.tax_base),
      rate: num(b.rate),
      amount: round2(num(b.tax_base) * num(b.rate) / 100),
      wht_income_category: defaultCat(
        String(invoice.charge_type || '').toUpperCase() === 'ADVANCE' ? 'OTHER' : 'SERVICE'),
    })) : [{ pay_date: autoPay, income_type: 'SERVICE',
             description: invoice.description || '', tax_base: num(invoice.subtotal),
             rate: 0, amount: 0, wht_income_category: defaultCat('SERVICE') }];
  }
  if (!ed.lines.length) {
    /* V.206 — เอกสารใหม่ว่าง (ไม่ได้มาจาก DB / ไม่ได้มาจาก Invoice)
       -> อัตราตามประเภทเริ่มต้น SERVICE = 3 */
    /* ── V.217 ── แถวแรกใช้ "วันที่จ่ายเงินจริง" ของหัวใบเป็นค่าเริ่มต้น (ข้อ A1)
       หัวใบยังว่าง -> เว้นว่างไว้ แล้ว syncItemPayDates() จะเติมให้เมื่อผู้ใช้เลือก */
    ed.lines = [{ pay_date: ed.pay_date || '', income_type: 'SERVICE', description: '',
                  tax_base: 0, rate: FIXED_RATE.SERVICE, amount: 0,
                  wht_income_category: defaultCat('SERVICE') }];
  }

  const cust = activeCustomers().find(c => c.id === ed.customer_id) || null;

  /* ══ V.191 — LAYOUT ใหม่: Split Screen [FORM | PREVIEW A4] ═════════════
     *** เปลี่ยนเฉพาะโครง DOM / ตำแหน่ง / Wrapper ***
     ทุก input ยังเป็น id เดิม · state เดิม (ed.*) · payload key เดิม
     TXT_MAP / DIGIT_FIELDS / syncPayerInputs / syncPayeeInputs / drawLines /
     doSave / whtPostMissing / POST / UNPOST / Delete — ไม่ถูกแตะแม้บรรทัดเดียว
     ── ที่ย้ายที่ ──
       reference_no · invoice_no_text · ref_date · job_no · note
         -> <details id="wh-refbox"> "ข้อมูลอ้างอิงภายใน" (ยุบไว้เป็นค่าเริ่มต้น)
            *** ไม่ได้ลบออกจากระบบ *** และเปิดอัตโนมัติเมื่อ POST แล้วพบว่ายังกรอกไม่ครบ
       document_date -> แถวผู้ลงนาม (= "วันที่ออกหนังสือรับรอง" ตามแบบ 50 ทวิ)
       pay_date      -> แถวหัวฟอร์ม (บังคับกรอกก่อน POST จึงต้องเห็นตลอด)  */
  /* ── V.195 ── ฟอร์มกรอกเต็มความกว้าง Content Area
     เดิมเป็น grid 2 คอลัมน์ [ฟอร์ม | Preview A4] -> ตัด Preview ออกจากหน้ากรอก
     แบบฟอร์ม 50 ทวิ A4 จะปรากฏเฉพาะตอนกด Preview / Print เท่านั้น */
  /* ── V.201 ── ลำดับบล็อกบนสุดของฟอร์ม (ย้ายตำแหน่งอย่างเดียว)
       1. ข้อมูลอ้างอิงภายใน (<details id="wh-refbox"> ยุบไว้)
       2. เล่มที่ / เลขที่ / วันที่จ่ายเงินจริง
       3. ผู้มีหน้าที่หักภาษี ณ ที่จ่าย -> ที่เหลือลำดับเดิมทุกบล็อก */
  cnt.innerHTML = `
    <div class="card card-pad whp-form">

      <div class="whp-hd">
        <div class="whp-hd-l">
          <h2 class="whp-hd-t">ใบหัก ณ ที่จ่าย (50 ทวิ)</h2>
          <p class="whp-hd-s">${ed.whtId ? 'แก้ไขร่าง' : 'เปิดงานใหม่'} — หนังสือรับรองการหักภาษี ณ ที่จ่าย</p>
        </div>
        <div class="whp-hd-r">
          <span class="whp-hd-st">สถานะ: ${stBadge(ed.status)}</span>
          ${/* Optional Helper — ไม่ใช่ Gate · ไม่กดก็กรอกเองได้ทุกช่อง */ ''}
          <button class="btn btn-o btn-sm" id="wh-frominv">🔎 ดึงจาก INVOICE</button>
          ${/* ── V.197 ── ปุ่มปิด ✕ แทนปุ่มข้อความ "← กลับรายการ"
               *** ไม่ใช่ปุ่มลบ *** id เดิม (wh-back) และปลายทางเดิม (renderList)
               ปุ่มลบร่างยังอยู่ที่แถบล่างซ้ายเหมือนเดิม ไม่เกี่ยวกัน */ ''}
          <button class="btn btn-o whp-x" id="wh-back"
            title="ปิด / กลับรายการ" aria-label="ปิด / กลับรายการ">✕</button>
        </div>
      </div>

      ${/* ── ข้อมูลอ้างอิงภายใน (V.201: ย้ายขึ้นบนสุดของฟอร์ม) ──────────────
           *** ย้ายตำแหน่งอย่างเดียว *** markup ภายในไม่ถูกแก้แม้ตัวอักษรเดียว
           id เดิมครบ: wh-refbox · wh-ref · wh-invno · wh-refdate · wh-jobno · wh-note
           ยังเป็น <details> ยุบไว้เป็นค่าเริ่มต้นเหมือนเดิม
           (POST แล้วกรอกไม่ครบ -> โค้ดเดิมยังสั่ง rb.open = true ได้ตามปกติ) */ ''}
      ${/* ── V.212 ── เลิกใช้ Accordion (<details>/<summary>) เปลี่ยนเป็น Checkbox
           *** ไม่มีลูกศร ▲▾ · ไม่กดทั้งกรอบเพื่อเปิดปิด · ไม่มี summary ***
           หัวข้อใช้ .whp-bt = คลาสเดิมของหัวข้อ Section (สีน้ำเงิน var(--blue-600))
           *** ไม่สร้างสีใหม่ *** ตัวเดียวกับ "เล่มที่ / เลขที่" · "ผู้มีหน้าที่หักภาษี"
           <label> ครอบทั้ง checkbox + ข้อความ -> คลิกที่ข้อความก็ toggle ได้ (ข้อ 14)
           สถานะ = UI State ล้วน *** ไม่มี Column / ไม่มี Migration / ไม่มี RPC param ***
           derive : has_ref = !!(reference_no || ref_date) -> เอกสารที่มีเลขแล้วติ๊กเอง
           id wh-refbox คงไว้ (โค้ดเดิมอ้างถึง) แต่เปลี่ยนจาก <details> เป็น <div hidden> */ ''}
      <label class="whp-refchk" for="wh-refbox-chk">
        <input type="checkbox" id="wh-refbox-chk" ${ed.has_ref ? 'checked' : ''}>
        <span class="whp-bt">ข้อมูลอ้างอิงภายใน</span>
      </label>
      <div class="whp-ref" id="wh-refbox" ${ed.has_ref ? '' : 'hidden'}>
        ${/* ── V.202 ── ถอดช่องกรอกออกจากหน้าฟอร์ม 3 ช่อง:
             Invoice No. (wh-invno) · เลขที่งาน (wh-jobno) · หมายเหตุ (wh-note)
             *** ถอดเฉพาะ UI *** คอลัมน์ใน Database / RPC / หน้ารายการ /
             Column Manager / เอกสาร 50 ทวิ ยังใช้ค่าเดิมครบทุกจุด
             ค่าที่เอกสารเก่าบันทึกไว้ยังอยู่ใน ed.* และถูกส่งกลับใน payload เหมือนเดิม
             -> เปิดเอกสารเก่ามาแก้แล้วบันทึกซ้ำ ค่าเดิมไม่หาย */ ''}
        ${/* ── V.207 ── Reference No. + Ref. Date เป็น "ของระบบ" ไม่ใช่ช่องกรอก
             ออกครั้งเดียวตอน "บันทึก" สำเร็จครั้งแรก (njacc_save_wht_draft §C)
             แล้วล็อกเป็นประวัติของเอกสารใบนั้นตลอดไป
             *** ใช้ readonly ไม่ใช่ disabled *** -> ค่ายังอยู่ใน DOM/State/payload
             เหมือนเดิมทุกประการ (disabled จะทำให้ค่าหายจากการอ่านผ่านฟอร์ม)
             ใบที่ POST จากหน้ารายการแล้ว บล็อก locked ด้านล่างจะ disabled ทับอีกชั้น */ ''}
        <div class="whp-refg mt-1">
          <div class="fld"><label>Reference No.</label>
            <input class="inp w100" id="wh-ref" value="${esc(ed.reference_no)}"
              readonly tabindex="-1" title="ออกอัตโนมัติเมื่อกดบันทึก — แก้ไขไม่ได้"
              placeholder="ออกอัตโนมัติเมื่อกดบันทึก"></div>
          <div class="fld"><label>Ref. Date</label>
            <input class="inp w100" type="date" id="wh-refdate" value="${esc(ed.ref_date || '')}"
              readonly tabindex="-1" title="วันที่บันทึกครั้งแรก — ระบบใส่ให้อัตโนมัติ"></div>
        </div>
        ${/* ── V.207 §4 ── ข้อความใต้กรอบต้องไม่ทำให้เข้าใจว่า
             "ต้อง POST ก่อนจึงได้ Reference No." เพราะไม่ใช่ Flow ใหม่แล้ว
             ในหน้านี้มี 2 เลขคนละตัว จึงเขียนแยกกันคนละบรรทัดให้ชัด:
               Reference No. (reference_no) -> ออกตอน "บันทึก" ครั้งแรก
               เลขที่เอกสารภายใน (document_no) -> ออกตอน POST จากหน้ารายการ
             *** ไม่ได้ลบข้อมูลหรือเปลี่ยนค่าที่แสดง *** เปลี่ยนถ้อยคำอย่างเดียว */ ''}
        <p class="t-xs t-3">Reference No. และ Ref. Date
          <b>ออกอัตโนมัติเมื่อกดบันทึกครั้งแรก</b> — แก้ไขเองไม่ได้
          และจะไม่เปลี่ยนอีกเลยหลังจากนั้น</p>
        <p class="t-xs t-3">เลขที่เอกสารภายใน (คนละเลขกับ Reference No.):
          ${ed.whtId && prev && !/^WHTDRAFT-/.test(String(prev.document_no || ''))
            ? '<b>' + esc(prev.document_no) + '</b>'
            : 'ยังไม่ได้ POST — ออกให้เมื่อกด POST จากหน้ารายการ'}</p>
      </div>
      ${/* ── V.210 ── "วันที่จ่ายเงินจริง" ถูกย้ายลงไปอยู่คู่กับ
           "วันที่ออกหนังสือรับรอง" ในบล็อกด้านล่าง เพื่อให้ผู้ใช้เห็นชัดว่า
           *** เป็นคนละวันที่ *** (ข้อกำหนด B3 / C)
           id เดิม (wh-pdate) · state เดิม (ed.pay_date) · payload เดิม ไม่เปลี่ยน
           บล็อกนี้จึงเหลือ เล่มที่ / เลขที่ ตามชื่อหัวข้อพอดี */ ''}
      <!-- ── เล่มที่ / เลขที่ ──────────────────────────────────────────────── -->
      <section class="whp-blk">
        <h3 class="whp-bt">เล่มที่ / เลขที่</h3>
        <div class="whp-r3">
          <div class="fld"><label>เล่มที่</label>
            <input class="inp w100" id="wh-book" value="${esc(ed.book_no)}"></div>
          <div class="fld"><label>เลขที่ <span class="req">*</span></label>
            <input class="inp w100" id="wh-cert" value="${esc(ed.certificate_no)}"></div>
        </div>
      </section>


      <!-- ── ผู้มีหน้าที่หักภาษี ณ ที่จ่าย ─────────────────────────────────── -->
      <section class="whp-blk">
        ${/* ── V.196 ── Checkbox อยู่ข้างหัวข้อ ไม่ทำเป็นกรอบใหญ่แยก */ ''}
        <div class="whp-bh">
          <h3 class="whp-bt">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย</h3>
          ${/* ── V.216 ── ปุ่มจัดการ MASTER (njacc_customers) ของฝ่ายนี้
               *** คนละระบบกับปุ่ม 💾 บันทึก ด้านล่างฟอร์ม ***
               บันทึกเข้ารายชื่อ = INSERT Master ใหม่ (ไม่ส่ง id)
               แก้ไขข้อมูล -> อัปเดตข้อมูล = UPDATE Master เดิม (ส่ง id)
               ปุ่มแก้ไข disabled จนกว่าจะมี Master ผูกอยู่ (ed.customer_id) */ ''}
          <span class="whp-mst">
            <button type="button" class="btn btn-o btn-sm" id="wh-payer-mnew"
              >💾 บันทึกเข้ารายชื่อ</button>
            <button type="button" class="btn btn-o btn-sm" id="wh-payer-medit"
              ${ed.customer_id ? '' : 'disabled'}>✏️ แก้ไขข้อมูล</button>
          </span>
          <label class="whp-agchk"><input type="checkbox" id="wh-has-agent"
            ${ed.has_agent ? 'checked' : ''}><span>กระทำการแทนโดย</span></label>
        </div>
        ${/* ── V.203 ── เลขประจำตัวบัตรประชาชน ต่อจาก Dropdown ในแถวเดียวกัน
             *** คนละช่องกับ "เลขประจำตัวผู้เสียภาษีอากร" ที่อยู่แถวถัดไป ***
             ไม่บังคับกรอก · กรอกได้เฉพาะตัวเลข ไม่เกิน 13 หลัก (DIGIT_FIELDS) */ ''}
        ${/* ── V.204 ── แถว CODE Master (เพิ่มด้านบน · ไม่ได้ถอด Dropdown เดิมออก)
             เลือก CODE แล้วเติมข้อมูลทั้งหมดอัตโนมัติ และ sync Dropdown ให้ด้วย
             *** แก้ข้อมูลในเอกสารหลัง Auto Fill ได้ และไม่กระทบ Master *** */ ''}
        ${/* ── V.209 ── ถอด Dropdown "🔎 เลือกลูกค้า" (#wh-cust) ออก
             ซ้ำซ้อนกับแถว CODE ด้านบนที่ทำงานเดียวกัน (ค้น Master -> applyParty)
             *** ไม่ได้ถอดคอลัมน์/State *** customer_id ยังถูกตั้งค่าโดย
             applyParty() -> ed[P.custKey] = row.id เหมือนเดิมทุกประการ
             เลขบัตรประชาชน = Field เดิม id เดิม (wh-payer-cid) แค่ย้ายที่
             เหลือ 2 วิธีเลือกข้อมูล : พิมพ์ CODE + 🔍  ·  👥 เลือกจากรายชื่อ */ ''}
        <div class="whp-pick whp-coderow">
          <label for="wh-payer-code">รหัส (CODE)</label>
          <input class="inp whp-code" id="wh-payer-code" value="${esc(ed.payer_code)}"
            placeholder="เช่น NJ" autocomplete="off">
          <button type="button" class="btn btn-o btn-sm whp-code-go" id="wh-payer-code-go"
            title="ค้นหา CODE นี้">🔍</button>
          <button type="button" class="btn btn-o btn-sm" id="wh-payer-pick">👥 เลือกจากรายชื่อ</button>
          <label for="wh-payer-cid" class="whp-cid-l">เลขประจำตัวบัตรประชาชน</label>
          <input class="inp whp-cid" id="wh-payer-cid" value="${esc(ed.payer_citizen_id)}"
            inputmode="numeric" maxlength="13" placeholder="1234567890123">
        </div>
        ${/* ชื่อ (กว้างสุด) | สาขา (สั้นสุด) | Tax ID (พอดี 13 หลัก) — ห้ามเท่ากัน */ ''}
        <div class="whp-rname">
          <div class="fld"><label>ชื่อ</label>
            <input class="inp w100" id="wh-payer-name" value="${esc(ed.payer_name)}"></div>
          <div class="fld"><label>สาขา (5 หลัก)</label>
            <input class="inp w100" id="wh-payer-branch" value="${esc(ed.payer_branch)}"
              inputmode="numeric" maxlength="5" pattern="[0-9]{5}"
              placeholder="00000" title="ตัวเลข 5 หลัก เช่น 00000 (สำนักงานใหญ่)"></div>
          <div class="fld"><label>เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)</label>
            <input class="inp w100" id="wh-payer-tax" value="${esc(ed.payer_tax_id)}"
              inputmode="numeric" maxlength="13" placeholder="1234567890123"></div>
        </div>
        <div class="fld"><label>ที่อยู่</label>
          <input class="inp w100" id="wh-payer-addr" value="${esc(ed.payer_address)}"></div>
      </section>

      <!-- ── กระทำการแทนโดย — ใช้โครงเดียวกับ Payer/Payee (Align ตรงกัน) ──── -->
      ${/* ── V.196 ── แสดงเฉพาะตอนติ๊ก Checkbox ด้านบน
           ใช้ hidden ไม่ใช่การถอด markup -> ค่าที่ผู้ใช้พิมพ์ไว้ยังอยู่ใน DOM/State
           ติ๊กกลับแล้วข้อมูลเดิมกลับมาทันที (ข้อกำหนดข้อ 3) */ ''}
      <section class="whp-blk" id="wh-agent-sec" ${ed.has_agent ? '' : 'hidden'}>
        <h3 class="whp-bt">กระทำการแทนโดย <small class="whp-hint">แก้ไขได้</small></h3>
        <div class="whp-rname">
          <div class="fld"><label>ชื่อ</label>
            <input class="inp w100" id="wh-agent-name" value="${esc(ed.agent_name)}"></div>
          <div class="fld"><label>สาขา (5 หลัก)</label>
            <input class="inp w100" id="wh-agent-branch" value="${esc(ed.agent_branch)}"
              inputmode="numeric" maxlength="5" pattern="[0-9]{5}"
              placeholder="00000" title="ตัวเลข 5 หลัก เช่น 00000 (สำนักงานใหญ่)"></div>
          <div class="fld"><label>เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)</label>
            <input class="inp w100" id="wh-agent-tax" value="${esc(ed.agent_tax_id)}"
              inputmode="numeric" maxlength="13" placeholder="1234567890123"></div>
        </div>
        <div class="fld"><label>ที่อยู่</label>
          <input class="inp w100" id="wh-agent-addr" value="${esc(ed.agent_address)}"></div>
      </section>

      <!-- ── ผู้ถูกหักภาษี ณ ที่จ่าย ────────────────────────────────────────
           (V.204: ช่อง "รหัส" ย้ายขึ้นไปเป็นแถว CODE ด้านบนแล้ว -> ใช้ .whp-rname เหมือนอีก 2 ฝ่าย)
           สัดส่วนของ สาขา/Tax ID เท่ากับอีก 2 Section เป๊ะ -->
      <section class="whp-blk">
        <div class="whp-bh">
          <h3 class="whp-bt">ผู้ถูกหักภาษี ณ ที่จ่าย</h3>
          ${/* ── V.216 ── ปุ่มจัดการ MASTER ของฝ่ายนี้ (โครงเดียวกับผู้หักฯ) */ ''}
          <span class="whp-mst">
            <button type="button" class="btn btn-o btn-sm" id="wh-payee-mnew"
              >💾 บันทึกเข้ารายชื่อ</button>
            <button type="button" class="btn btn-o btn-sm" id="wh-payee-medit"
              ${ed.payee_customer_id ? '' : 'disabled'}>✏️ แก้ไขข้อมูล</button>
          </span>
        </div>
        ${/* ── V.209 ── ถอด Dropdown "🔎 เลือกลูกค้า / Supplier" (#wh-payee-cus)
             ซ้ำซ้อนกับแถว CODE ด้านบน · payee_customer_id ยังถูกตั้งค่าโดย
             applyParty() -> ed[P.custKey] = row.id เหมือนเดิม
             เลขบัตรประชาชน = Field เดิม id เดิม (wh-payee-cid) แค่ย้ายที่ */ ''}
        <div class="whp-pick whp-coderow">
          <label for="wh-payee-code2">รหัส (CODE)</label>
          <input class="inp whp-code" id="wh-payee-code2" value="${esc(ed.payee_code)}"
            placeholder="เช่น VP001" autocomplete="off">
          <button type="button" class="btn btn-o btn-sm whp-code-go" id="wh-payee-code-go"
            title="ค้นหา CODE นี้">🔍</button>
          <button type="button" class="btn btn-o btn-sm" id="wh-payee-pick">👥 เลือกจากรายชื่อ</button>
          <label for="wh-payee-cid" class="whp-cid-l">เลขประจำตัวบัตรประชาชน</label>
          <input class="inp whp-cid" id="wh-payee-cid" value="${esc(ed.payee_citizen_id)}"
            inputmode="numeric" maxlength="13" placeholder="1234567890123">
        </div>
        ${/* ── V.204 ── ช่อง "รหัส" เดิมย้ายขึ้นไปเป็นแถว CODE ด้านบนแล้ว
             (ผูก payee_code ตัวเดียวกัน · ไม่สร้าง Field ซ้ำ) -> เหลือ 3 คอลัมน์ */ ''}
        <div class="whp-rname">
          <div class="fld"><label>ชื่อ</label>
            <input class="inp w100" id="wh-payee-name" value="${esc(ed.payee_name)}"></div>
          <div class="fld"><label>สาขา (5 หลัก)</label>
            <input class="inp w100" id="wh-payee-branch" value="${esc(ed.payee_branch)}"
              inputmode="numeric" maxlength="5" pattern="[0-9]{5}"
              placeholder="00000" title="ตัวเลข 5 หลัก เช่น 00000 (สำนักงานใหญ่)"></div>
          <div class="fld"><label>เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)</label>
            <input class="inp w100" id="wh-payee-tax" value="${esc(ed.payee_tax_id)}"
              inputmode="numeric" maxlength="13" placeholder="1234567890123"></div>
        </div>
        <div class="fld"><label>ที่อยู่</label>
          <input class="inp w100" id="wh-payee-addr" value="${esc(ed.payee_address)}"></div>
      </section>

      ${/* ── ลำดับที่ในแบบ (V.199) ────────────────────────────────────────
           หัวข้อ + radio 7 ตัว + ช่อง "ลำดับที่" อยู่ในแถวแนวนอนเดียวกัน
           *** เปลี่ยนเฉพาะ Layout *** radioRow() / name="wh-form" / value เดิม
           id ของช่องลำดับที่ (wh-formseq) และ handler เดิมไม่เปลี่ยนแม้ตัวอักษรเดียว
           เลือกได้ 1 รายการโดยโครงสร้าง (radio name เดียวกัน) เหมือนเดิม */ ''}
      ${/* ── V.214 ── หัวข้อเป็น Checkbox คุมการแสดง radio + ช่อง "ลำดับที่"
           หัวข้อใช้ .whp-bt เดิม -> สีน้ำเงิน var(--blue-600) ตัวเดียวกับ Section อื่น
           *** ไม่สร้างสีใหม่ *** · <label> ครอบทั้งกล่องติ๊กและข้อความ -> คลิกได้ทั้งคู่
           ไม่ติ๊ก = ตั้ง hidden เท่านั้น *** ไม่ล้างค่า radio / ช่องลำดับที่ *** (ข้อ 10)
           radioRow() / name="wh-form" / value / id เดิมทุกตัว ไม่ถูกแตะ */ ''}
      <section class="whp-blk">
        <label class="whp-schk" for="wh-has-form">
          <input type="checkbox" id="wh-has-form" ${ed.has_form ? 'checked' : ''}>
          <span class="whp-bt">ลำดับที่ในแบบยื่นรายการ
            <small class="whp-hint">(เลือก 1 รายการ)</small></span>
        </label>
        <div class="whp-fmrow whp-sbody" id="wh-form-sec" ${ed.has_form ? '' : 'hidden'}>
          <div class="whp-rds whp-rds-h" id="wh-form-rd">${radioRow('wh-form', FORM_TYPES, ed.form_type)}</div>
          <label class="whp-seq">ลำดับที่:
            <input class="inp" id="wh-formseq" value="${esc(ed.form_seq)}"></label>
        </div>
      </section>

      <!-- ── รายการเงินได้ — ตาราง Compact (ข้อความมาตรา 40 อยู่ใน Preview A4) ── -->
      <section class="whp-blk">
        <div class="whp-bh">
          <h3 class="whp-bt">รายการเงินได้</h3>
          <button class="btn btn-o btn-sm" id="wh-add">＋ เพิ่มรายการ</button>
        </div>
        <div class="tbl-wrap whp-items"><table class="tbl"><thead><tr>
          ${/* ── ตรงตาม Mockup 6 คอลัมน์ ──
               คอลัมน์ "ประเภทเงินได้" ใน Mockup คือ *** หมวด 50 ทวิ *** (ม.40(1) ฯลฯ)
               = wht_income_category ซึ่งเป็นค่าที่พิมพ์ลงแบบราชการจริง
               ประเภทเงินได้ของระบบ (income_type) · อัตรา % · รายละเอียด
               *** ไม่ได้ลบ *** ย้ายลงบรรทัดที่ 2 ของแต่ละรายการ (ข้อกำหนดข้อ 27) */ ''}
          <th style="width:38px">ลำดับ</th>
          <th>ประเภทเงินได้ <span class="req">*</span></th>
          <th style="width:116px">วันที่จ่ายเงิน <span class="req">*</span></th>
          <th class="r" style="width:110px">จำนวนเงินที่จ่าย</th>
          <th class="r" style="width:112px">ภาษีที่หักและนำส่ง <span class="req">*</span></th>
          <th class="center" style="width:44px">จัดการ</th>
        </tr></thead><tbody id="wh-ltb"></tbody></table></div>
      </section>

      <!-- ── รวมยอด — Reuse การคำนวณเดิม 100% (refreshTotals) ─────────────── -->
      <section class="whp-blk">
        <h3 class="whp-bt">รวมเงินที่จ่ายและภาษีที่หักนำส่ง</h3>
        <div class="whp-r3">
          <div class="fld"><label>รวมเงินที่จ่าย</label>
            <input class="inp w100 r" id="wh-t-base" value="0.00" readonly tabindex="-1"></div>
          <div class="fld"><label>รวมภาษีที่หักและนำส่ง</label>
            <input class="inp w100 r whp-hi" id="wh-t-tax" value="0.00" readonly tabindex="-1"></div>
          <div class="fld"><label>รวมภาษีที่หักนำส่ง <i>(ตัวอักษร)</i></label>
            <input class="inp w100" id="wh-t-words" value="" readonly tabindex="-1"></div>
        </div>
      </section>

      ${/* ── เงินกองทุน / ประกันสังคม (V.198) ────────────────────────────
           หัวข้อกลายเป็น Checkbox · ใช้รูปแบบเดียวกับ "กระทำการแทนโดย" (.whp-agchk)
           ไม่ติ๊ก -> ซ่อนทั้ง section (Layout ยุบขึ้นเอง ไม่เหลือพื้นที่ว่าง)
           ใช้ hidden ไม่ใช่ถอด markup -> ค่าที่พิมพ์ไว้ยังอยู่ ติ๊กกลับแล้วได้คืน */ ''}
      <div class="whp-blk whp-blk-chk">
        <label class="whp-agchk"><input type="checkbox" id="wh-has-fund"
          ${ed.has_fund ? 'checked' : ''}><span>เงินกองทุน / ประกันสังคม</span></label>
      </div>
      <section class="whp-blk" id="wh-fund-sec" ${ed.has_fund ? '' : 'hidden'}>
        <div class="whp-r3">
          <div class="fld"><label>กบข./กสจ./กองทุนสงเคราะห์ครูฯ</label>
            <input class="inp w100 r" type="number" step="0.01" min="0"
              id="wh-gpf" value="${esc(ed.gpf_amount)}" placeholder="0.00"></div>
          <div class="fld"><label>กองทุนประกันสังคม</label>
            <input class="inp w100 r" type="number" step="0.01" min="0"
              id="wh-sso" value="${esc(ed.social_security_amount)}" placeholder="0.00"></div>
          <div class="fld"><label>กองทุนสำรองเลี้ยงชีพ</label>
            <input class="inp w100 r" type="number" step="0.01" min="0"
              id="wh-pvd" value="${esc(ed.provident_fund_amount)}" placeholder="0.00"></div>
        </div>
      </section>

      <!-- ── ผู้จ่ายเงิน (วิธีการจ่ายภาษี) — Radio แนวนอน ────────────────── -->
      ${/* ── ผู้จ่ายเงิน (V.200) ───────────────────────────────────────────
           หัวข้อ + radio 4 ตัว + ช่อง "ระบุอื่น ๆ" อยู่ในแถวแนวนอนเดียวกัน
           *** เปลี่ยนเฉพาะ Layout *** radioRow() / name="wh-pm" / value เดิม
           id เดิมครบ: wh-pm-rd · wh-pm-other-wrap · wh-pm-other
           พฤติกรรมเดิม: ช่องระบุถูกซ่อนจนกว่าจะเลือก "(4) อื่น ๆ (ระบุ)"
           handler ที่ตั้ง .hidden ของ #wh-pm-other-wrap ไม่ถูกแตะ
           ป้าย "ระบุ (อื่น ๆ)" ที่เคยเป็นบรรทัดแยก -> ย้ายไปเป็น placeholder */ ''}
      ${/* ── V.214 ── หัวข้อเป็น Checkbox คุม radio 4 ตัว + ช่อง "ระบุอื่น ๆ"
           พฤติกรรมเดิมของ #wh-pm-other-wrap (ซ่อนจนกว่าจะเลือก "(4) อื่น ๆ")
           *** ไม่ถูกแตะ *** ซ้อนอยู่ใน #wh-pm-sec อีกชั้นเท่านั้น */ ''}
      <section class="whp-blk">
        <label class="whp-schk" for="wh-has-pm">
          <input type="checkbox" id="wh-has-pm" ${ed.has_pm ? 'checked' : ''}>
          <span class="whp-bt">ผู้จ่ายเงิน</span>
        </label>
        <div class="whp-fmrow whp-sbody" id="wh-pm-sec" ${ed.has_pm ? '' : 'hidden'}>
          <div class="whp-rds whp-rds-h" id="wh-pm-rd">${radioRow('wh-pm', PAY_METHODS, ed.pay_method)}</div>
          <span class="whp-pmo" id="wh-pm-other-wrap"
            ${ed.pay_method === PAY_METHOD_OTHER ? '' : 'hidden'}>
            <input class="inp" id="wh-pm-other" placeholder="ระบุอื่น ๆ"
              aria-label="ระบุ (อื่น ๆ)" value="${esc(ed.pay_method_other)}">
          </span>
        </div>
      </section>

      ${/* ── V.210 ── วันที่ + ผู้ลงนาม ──────────────────────────────────────
           Checkbox คุมเฉพาะ 3 ช่อง : ผู้ลงนาม · ตำแหน่ง · ผู้จ่ายเงิน (อื่นๆ)
           *** ห้ามคุม 2 วันที่ *** ทั้งคู่ต้องเห็นตลอด (ข้อกำหนด A1 / B4)
           สถานะ Checkbox = UI State ล้วน *** ไม่มีคอลัมน์ใน Database ***
           derive จากข้อมูลเดิม (signer_name || signer_position || payment_by)
           ไม่ติ๊ก = ซ่อนด้วย hidden เท่านั้น *** ไม่ล้างค่าใน DOM/State/payload ***
           2 วันที่วางคู่กันเพื่อให้เห็นชัดว่าเป็นคนละข้อมูล :
             wh-pdate -> ed.pay_date       -> payload.pay_date       -> DB pay_date
             wh-ddate -> ed.document_date  -> payload.document_date  -> DB document_date */ ''}
      <!-- ── วันที่ / ผู้ลงนาม ─────────────────────────────────────────────── -->
      <section class="whp-blk">
        <div class="whp-bh">
          <h3 class="whp-bt">วันที่ / ผู้ลงนาม</h3>
          <label class="whp-agchk"><input type="checkbox" id="wh-has-signer"
            ${ed.has_signer ? 'checked' : ''}><span>ระบุข้อมูลผู้ลงนาม / ผู้จ่ายเงินเพิ่มเติม</span></label>
        </div>
        <div class="whp-r3 whp-dates">
          <div class="fld"><label>วันที่จ่ายเงินจริง <span class="req">*</span></label>
            <input class="inp w100" type="date" id="wh-pdate" value="${esc(ed.pay_date || '')}"></div>
          <div class="fld"><label>วันที่ออกหนังสือรับรอง <span class="req">*</span></label>
            <input class="inp w100" type="date" id="wh-ddate" value="${esc(ed.document_date)}"></div>
        </div>
        ${ed.payments && ed.payments.length > 1
          ? `<p class="t-xs whp-warn">ใบแจ้งหนี้นี้มีการรับชำระ ${ed.payments.length} ครั้ง —
              ระบบไม่เลือกให้ กรุณาระบุวันที่จ่ายเงินจริง</p>` : ''}
        <div id="wh-signer-sec" ${ed.has_signer ? '' : 'hidden'}>
          <div class="whp-r3">
            <div class="fld"><label>ผู้ลงนาม</label>
              <input class="inp w100" id="wh-signer" value="${esc(ed.signer_name)}"></div>
            <div class="fld"><label>ตำแหน่ง</label>
              <input class="inp w100" id="wh-signpos" value="${esc(ed.signer_position)}"></div>
          </div>
          <div class="whp-r3">
            <div class="fld whp-sp2"><label>ผู้จ่ายเงิน (อื่นๆ) — ใช้ในคอลัมน์ Excel · คนละช่องกับผู้ลงนาม</label>
              <input class="inp w100" id="wh-payby" value="${esc(ed.payment_by)}"
                placeholder="เช่น EDC / IKANO / KN / PRO / APL / SCH"></div>
          </div>
        </div>
      </section>

      ${/* ── ปุ่ม Action ─────────────────────────────────────────────────────
           ── V.207 ── FLOW ใหม่: กรอกครบ -> 💾 บันทึก -> ได้เลข -> 🖨 Preview A4
           *** ปุ่ม ⬆ POST ถูกถอดออกจากหน้าฟอร์ม *** ผู้ใช้จบงานด้วยปุ่มบันทึก
           POST/UNPOST ยังอยู่ที่ "หน้ารายการ" ครบเหมือนเดิม (เปลี่ยนสถานะจริง /
           ปลดล็อก 1 INVOICE 1 ร่าง / ปิดกำแพงกันลบ) — Backend POST ไม่ถูกแตะ
           ↩ UNPOST คงไว้ในฟอร์มเฉพาะใบที่ ISSUED เพราะเป็นทางเดียวที่จะกลับมา
           แก้ใบนั้นได้จากหน้านี้ (Prompt สั่งถอดเฉพาะ POST)
           id/handler เดิมทุกตัว: wh-del · wh-unpost · wh-prev · wh-save
           wh-cancel เป็นปุ่มใหม่ที่ผูกกับ handler เดียวกับ ✕ (wh-back) ไม่เขียนใหม่ */ ''}
      <div class="whp-act">
        <div class="whp-act-l">
          ${(ed.whtId && !locked && (isAdmin() || can('issue_receipt')))
            ? '<button class="btn btn-danger" id="wh-del">🗑 ลบ</button>' : ''}
          ${isIssued ? '<button class="btn btn-unpost" id="wh-unpost">↩ UNPOST</button>' : ''}
        </div>
        <div class="whp-act-r">
          <button class="btn btn-o" id="wh-cancel">ยกเลิก</button>
          <button class="btn btn-p" id="wh-save" ${locked ? 'disabled' : ''}>💾 บันทึก</button>
          ${/* ── V.215 ── เปลี่ยนชื่อปุ่มเป็น "พิมพ์" (Flow ใหม่ = พิมพ์เอกสารจริง)
               เปิดใช้งานเมื่อมี Reference No. แล้วเท่านั้น · id เดิม (wh-prev) */ ''}
          <button class="btn btn-o" id="wh-prev"
            ${String(ed.reference_no || '').trim() ? '' : 'disabled'}>🖨 พิมพ์</button>
        </div>
      </div>
      ${ed.whtId ? '' : '<p class="t-xs t-3 mt-1">กด 💾 บันทึก แล้วระบบจะออก Reference No. และ Ref. Date ให้อัตโนมัติ — พิมพ์เอกสารจริงได้ทันทีหลังบันทึก (พิมพ์จากข้อมูลในฐานข้อมูลเท่านั้น)</p>'}
      ${isIssued ? '<p class="t-xs whp-warn mt-1">เอกสารนี้ POST แล้ว — แก้ไขข้อมูลไม่ได้ ต้องกด ↩ UNPOST ก่อน</p>' : ''}
      ${isVoidDoc ? '<p class="t-xs whp-warn mt-1">เอกสารนี้ถูก VOID แล้ว — ดูและพิมพ์ได้อย่างเดียว</p>' : ''}

    </div>`;


  /* ══ V.195 — เลิก render Preview ในหน้ากรอก ═══════════════════════════
     เดิมมี previewData() / fitPreview() / renderPreview() / schedulePreview()
     คอยวาดแบบฟอร์ม 50 ทวิ ลงกรอบด้านขวาแบบ Live ทุกครั้งที่พิมพ์
     ตอนนี้ตัดออกทั้งชุด -> หน้ากรอกเบาลง ไม่มีการ render เอกสาร A4 ค้างไว้
     *** Renderer ของเอกสาร (whtDocHTML/wht50HTML) ไม่ถูกลบ ***
     ยังถูกเรียกผ่าน openWhtDoc() ตอนกด Preview / Print เท่านั้น
     Flow: เปิดงาน -> กรอก -> บันทึก -> Preview/Print -> แบบฟอร์ม 50 ทวิ A4 */

  /* 🖨 พิมพ์เอกสาร (หัว Preview) = ปุ่มเดียวกับ Preview A4 ของฟอร์ม
     พิมพ์จากข้อมูลจริงในฐานข้อมูลเสมอ (เส้นทางเดิม whtView -> openWhtDoc) */
  /* ── V.215 ── Print Gate = "มี Reference No. หรือยัง" (ข้อ 3 / ข้อ 14)
     *** ไม่ผูกกับ status === 'ISSUED' *** และ *** ปุ่มพิมพ์ไม่ออกเลขเด็ดขาด ***
     ยังไม่มีเลข -> แจ้งให้บันทึกก่อน และไม่เปิดหน้าพิมพ์
     พิมพ์จากข้อมูลจริงใน Database เสมอ (เส้นทางเดิม whtView -> openWhtDoc) */
  async function doPrint() {
    if (!ed.whtId || !String(ed.reference_no || '').trim()) {
      toast('กรุณาบันทึกเอกสารก่อนพิมพ์', 'err'); return;
    }
    try { openWhtDoc(await whtView(ed.whtId)); }
    catch (ex) { toast(whtErrMessage(ex), 'err'); }
  }

  const tb = cnt.querySelector('#wh-ltb');
  /* ══ ปิด / กลับรายการ (V.197) ═══════════════════════════════════════════
     *** ตรวจ Source แล้วหน้านี้ยังไม่มีระบบ Dirty State *** จึงเพิ่มให้ที่นี่
     (ไม่ได้ไปแก้ระบบอื่น และไม่มี Confirm ซ้ำซ้อนกับของเดิม)
     snapshot = ค่าที่ผู้ใช้กรอกได้ทั้งหมด ณ ตอนเปิดฟอร์ม
     กด ✕ แล้วค่าเปลี่ยน -> ถามก่อนออก · ไม่เปลี่ยน -> กลับรายการทันที
     เอกสารที่ POST/VOID แล้ว (locked) แก้ไม่ได้อยู่แล้ว -> ไม่ต้องถาม
     *** ไม่เรียก Delete RPC ใด ๆ *** ปุ่มนี้แค่เปลี่ยนหน้ากลับไปที่รายการ */
  const DIRTY_KEYS = [
    'certificate_no', 'book_no', 'document_date', 'pay_date', 'reference_no',
    'invoice_no_text', 'ref_date', 'job_no', 'note', 'customer_id', 'invoice_id',
    'payee_customer_id', 'payee_code', 'payment_by',
    'has_fund', 'gpf_amount', 'social_security_amount', 'provident_fund_amount',
    'payer_code', 'payer_citizen_id', 'payee_citizen_id',
    'payer_name', 'payer_tax_id', 'payer_branch', 'payer_address',
    'has_agent', 'agent_name', 'agent_tax_id', 'agent_branch', 'agent_address',
    'payee_name', 'payee_tax_id', 'payee_branch', 'payee_address',
    'form_type', 'form_seq', 'pay_method', 'pay_method_other',
    'signer_name', 'signer_position',
  ];
  const snapshot = () => JSON.stringify([
    DIRTY_KEYS.map(k => (ed[k] === undefined || ed[k] === null) ? '' : String(ed[k])),
    (ed.lines || []).map(l => [l.pay_date || '', l.income_type || '',
      l.wht_income_category || '', l.description || '',
      String(l.tax_base ?? ''), String(l.rate ?? ''), String(l.amount ?? '')]),
  ]);
  let baseline = snapshot();
  /* บันทึกสำเร็จแล้ว = ไม่ dirty อีก (doSave เรียกผ่าน hook นี้) */
  ed.__resetDirty = () => { baseline = snapshot(); };

  const doCancel = async () => {
    if (locked || snapshot() === baseline) { renderList(cnt); return; }
    const go = await confirmModal('ข้อมูลที่แก้ไขยังไม่ได้บันทึก',
      'ต้องการออกจากหน้านี้หรือไม่?<br>' +
      '<span class="t-xs t-3">การเปลี่ยนแปลงทั้งหมดจะไม่ถูกบันทึก '
      + '(เอกสารไม่ถูกลบ)</span>', 'ออกโดยไม่บันทึก');
    if (go) renderList(cnt);
  };
  cnt.querySelector('#wh-back').onclick = doCancel;
  /* ── V.207 ── ปุ่ม "ยกเลิก" ในแถบล่าง = handler ตัวเดียวกับ ✕ ทุกประการ
     ปิดฟอร์ม · ไม่ Save · ไม่ยิง RPC ใด ๆ · ไม่กิน Running Number (ข้อ 12)
     *** ไม่ใช่ปุ่มลบ *** เอกสารที่บันทึกไว้แล้วยังอยู่ครบ */
  cnt.querySelector('#wh-cancel').onclick = doCancel;
  /* ── V.209 ── เดิมผูก cnt.querySelector('#wh-cust').onchange ตรง ๆ
     Dropdown ถูกถอดออกแล้ว -> บรรทัดเดิมจะ throw "Cannot read properties of null"
     ทั้งฟอร์มพังตั้งแต่ render จึงต้องถอด Binding นี้ออกคู่กับ markup
     งานที่ handler เดิมทำ ยังอยู่ครบผ่านเส้นทาง CODE / เลือกจากรายชื่อ :
       ed.customer_id  <- applyParty() ตั้งให้จาก row.id (P.custKey)
       ค่าในฟอร์ม      <- applyParty() เขียนลงช่องให้เองทุกช่อง
     *** fillPayerFromMaster() ไม่ได้ถูกลบ *** ยังถูกเรียกตอนเปิดฟอร์ม (บรรทัด 708)
     เพื่อเติม snapshot ของเอกสารเดิมเหมือนเดิมทุกประการ */
  cnt.querySelector('#wh-ddate').onchange = (e) => { ed.document_date = e.target.value; };
  /* ── V.210 ── วันที่จ่ายเงินจริง -> เติม "วันที่ออกหนังสือรับรอง" ให้ครั้งเดียว
     *** เฉพาะตอนที่ยังว่างเท่านั้น *** (B5) มีค่าแล้วห้ามเขียนทับเด็ดขาด (B6/B7)
     -> ผู้ใช้ตั้งวันที่ออกหนังสือฯ เองแล้ว เปลี่ยนวันจ่ายอีกกี่ครั้งก็ไม่ถูกทับ
     -> เอกสารเก่าไม่ถูก Auto Sync เพราะ Logic นี้ทำงานตอน onchange เท่านั้น
        (ตอน Load ไม่มีการยิง event นี้) B8 */
  cnt.querySelector('#wh-pdate').onchange = (e) => {
    ed.pay_date = e.target.value;
    if (ed.pay_date && !String(ed.document_date || '').trim()) {
      ed.document_date = ed.pay_date;
      const dd = cnt.querySelector('#wh-ddate');
      if (dd) dd.value = ed.document_date;
    }
    syncItemPayDates();
  };

  /* ── V.217 ── เติม "วันที่จ่ายเงิน" ของรายการที่ *** ยังว่างเท่านั้น *** (ข้อ A2/A3)
     *** ห้ามเขียนทับรายการที่ผู้ใช้ระบุเองแล้ว *** (ข้อ A4)
     ไม่แตะ ed.pay_date ของหัวใบ · ไม่แตะ document_date · ไม่ยิง RPC
     เขียนกลับลงช่องในตารางโดยตรง -> ไม่ต้อง drawLines() ใหม่
     (drawLines จะรีเซ็ต focus/ค่าที่ค้างในช่องอื่น) */
  function syncItemPayDates() {
    const d = String(ed.pay_date || '').trim();
    if (!d) return;
    (ed.lines || []).forEach((l, i) => {
      if (String(l.pay_date || '').trim()) return;      /* มีค่าแล้ว -> ข้าม */
      l.pay_date = d;
      const el = cnt.querySelector(`#wh-ltb [data-i="${i}"][data-k="pay_date"]`);
      if (el) el.value = d;
    });
  }
  /* ── V.210 ── Checkbox "ระบุข้อมูลผู้ลงนาม / ผู้จ่ายเงินเพิ่มเติม"
     ติ๊ก/เอาออก = แสดง/ซ่อน Section เท่านั้น
     *** ไม่แตะค่าใน DOM · ไม่แตะ ed.* · ไม่ล้าง payload *** (A4)
     ติ๊กกลับมาข้อมูลเดิมยังอยู่ครบ เพราะไม่เคยถูกลบ
     *** ไม่แตะ 2 ช่องวันที่ *** ทั้งคู่อยู่นอก #wh-signer-sec (B4/A1) */
  /* ── V.212 ── Checkbox "ข้อมูลอ้างอิงภายใน" — Show/Hide เท่านั้น
     *** ไม่แตะ #wh-ref / #wh-refdate / ed.reference_no / ed.ref_date ***
     เอาติ๊กออกแล้วติ๊กกลับ ค่าเดิมยังอยู่ครบ เพราะไม่เคยถูกลบ (ข้อ 9) */
  const rfChk = cnt.querySelector('#wh-refbox-chk');
  const rfBox = cnt.querySelector('#wh-refbox');
  if (rfChk) rfChk.onchange = (e) => {
    ed.has_ref = !!e.target.checked;
    if (rfBox) rfBox.hidden = !ed.has_ref;
  };

  const sgChk = cnt.querySelector('#wh-has-signer');
  const sgSec = cnt.querySelector('#wh-signer-sec');
  if (sgChk) sgChk.onchange = (e) => {
    ed.has_signer = !!e.target.checked;
    if (sgSec) sgSec.hidden = !ed.has_signer;
  };
  /* ── ผูก input ชุดใหม่ทั้งหมด — ตัวเดียวจบ ไม่เขียนซ้ำทีละช่อง ──────────
     [id ในหน้า] -> [คีย์ใน ed] · oninput เก็บค่าดิบ trim ตอนสร้าง payload */
  /* ── Validation ช่องตัวเลข (Frontend เท่านั้น) ────────────────────────────
     ── V.220 ── สาขา = 0-9 *** 5 หลัก *** (เดิม 6) · Tax ID = 13 หลัก
        รหัสสำนักงานใหญ่ตามแบบกรมสรรพากร = 00000
     *** เก็บเป็น String ตามเดิม *** คอลัมน์ใน DB เป็น text ทั้ง 6 ตัว
     (ตรวจ information_schema แล้ว) -> '000001' ไม่กลายเป็น 1
     ไม่แตะ Save/Load/RPC/Schema — แค่กันตัวอักษรตั้งแต่ตอนพิมพ์
     ใช้ maxlength ใน markup ร่วมด้วย กันวางทับ (paste) เกินความยาว */
  const DIGIT_FIELDS = {
    'wh-payer-branch': 5, 'wh-agent-branch': 5, 'wh-payee-branch': 5,
    'wh-payer-tax': 13, 'wh-agent-tax': 13, 'wh-payee-tax': 13,
    /* ── V.203 ── เลขบัตรประชาชน 13 หลัก (คนละช่องกับ *-tax ด้านบน) */
    'wh-payer-cid': 13, 'wh-payee-cid': 13,
  };

  const TXT_MAP = {
    'wh-book': 'book_no', 'wh-jobno': 'job_no', 'wh-cert': 'certificate_no',
    /* ── V.207 ── 'wh-ref': 'reference_no' ถูกถอดออกโดยตั้งใจ
       ช่องเป็น readonly แล้ว แต่ถอด binding ออกอีกชั้นเพื่อไม่ให้มีทางใด ๆ
       ที่หน้าจอจะเขียน ed.reference_no ทับเลขที่ Database ออกให้ (ข้อ 5)
       ค่ายังถูกอ่านเข้ามาใน ed.reference_no ตอนเปิดฟอร์ม และยังส่งใน payload เดิม */
    'wh-note': 'note',
    /* ── RUN-10 ── 3 ช่องใหม่ · Invoice No. แยกจาก Reference No. ชัดเจน
       ── V.202 ── wh-invno / wh-jobno / wh-note ไม่มีช่องกรอกในหน้านี้แล้ว
       คง mapping ไว้เฉย ๆ (loop ข้ามให้เองเมื่อ querySelector ไม่เจอ)
       เผื่อเปิดช่องกลับมาในอนาคตจะได้ผูก state ได้ทันทีโดยไม่ต้องแก้ตรงนี้ */
    /* ── V.204 ── ช่อง CODE ของทั้ง 2 ฝ่าย (wh-payee-code เดิมถูกย้ายเป็น wh-payee-code2) */
    'wh-payer-code': 'payer_code', 'wh-payee-code2': 'payee_code',
    'wh-invno': 'invoice_no_text', 'wh-payee-code': 'payee_code', 'wh-payby': 'payment_by',
    /* เงินกองทุน 3 ช่อง (RUN-14) */
    'wh-gpf': 'gpf_amount', 'wh-sso': 'social_security_amount',
    'wh-pvd': 'provident_fund_amount',
    'wh-payer-cid': 'payer_citizen_id', 'wh-payee-cid': 'payee_citizen_id',
    'wh-payer-name': 'payer_name', 'wh-payer-tax': 'payer_tax_id',
    'wh-payer-branch': 'payer_branch', 'wh-payer-addr': 'payer_address',
    'wh-agent-name': 'agent_name', 'wh-agent-tax': 'agent_tax_id',
    'wh-agent-branch': 'agent_branch', 'wh-agent-addr': 'agent_address',
    'wh-payee-name': 'payee_name', 'wh-payee-tax': 'payee_tax_id',
    'wh-payee-branch': 'payee_branch', 'wh-payee-addr': 'payee_address',
    'wh-formseq': 'form_seq', 'wh-pm-other': 'pay_method_other',
    'wh-signer': 'signer_name', 'wh-signpos': 'signer_position',
  };
  Object.entries(TXT_MAP).forEach(([id, key]) => {
    const el = cnt.querySelector('#' + id);
    if (!el) return;
    const lim = DIGIT_FIELDS[id];
    if (lim) {
      /* ช่องตัวเลข: ตัดอักขระที่ไม่ใช่ 0-9 และตัดความยาวเกิน
         ทำที่ oninput -> ครอบทั้งพิมพ์เองและวางทับ (paste)
         คืน caret ไปท้ายค่าที่เหลือ เพื่อไม่ให้เคอร์เซอร์กระโดดตอนพิมพ์กลางข้อความ
         *** เก็บเป็น String เสมอ *** ไม่ Number() -> '000001' ไม่กลายเป็น 1 */
      el.oninput = (e) => {
        const clean = String(e.target.value).replace(/\D/g, '').slice(0, lim);
        if (clean !== e.target.value) {
          e.target.value = clean;
          try { e.target.setSelectionRange(clean.length, clean.length); } catch (_) {}
        }
        ed[key] = clean;
      };
      return;
    }
    el.oninput = (e) => { ed[key] = e.target.value; };
  });
  /* ── V.207 ── Ref. Date = วันที่ POST · Database เป็นคนเขียนเท่านั้น
     input type=date ที่เป็น readonly บางเบราว์เซอร์ยังเปิดปฏิทินเลือกได้
     จึงดีดค่ากลับเป็นค่าที่บันทึกไว้จริง *** ไม่แตะ ed.ref_date ***
     (ถึงจะหลุดมาได้ SQL ก็ไม่รับค่านี้แล้ว — RUN-23 ถอดออกจาก UPDATE SET) */
  cnt.querySelector('#wh-refdate').onchange = (e) => { e.target.value = ed.ref_date || ''; };

  /* ══ Checkbox "กระทำการแทนโดย" (V.196) ═════════════════════════════════
     ติ๊ก   -> แสดง Section · ครั้งแรกที่ยังว่างทั้งบล็อกจึงเติม Default N.J. ให้
     เอาออก -> ซ่อน Section เฉย ๆ *** ไม่ล้างค่าใน State/DOM ***
               ติ๊กกลับแล้วข้อมูลเดิมยังอยู่ (ข้อกำหนดข้อ 3)
               แต่ตอน Save จะส่ง has_acting_agent=false และไม่ส่ง agent_* (ดู doSave)
               และ SQL ล้าง agent_* ให้เป็น NULL อีกชั้น */
  function applyAgentDefaults() {
    const empty = !['agent_name', 'agent_tax_id', 'agent_branch', 'agent_address']
      .some(k => String(ed[k] || '').trim());
    if (!empty) return;                       /* มีข้อมูลอยู่แล้ว -> ไม่เขียนทับ */
    ed.agent_name = ISSUER.nameEn;
    ed.agent_tax_id = ISSUER.taxId;
    /* ── V.220 ── รหัสสำนักงานใหญ่ = 00000 (5 หลัก) *** เดิม '000000' 6 หลัก ***
       ใช้เฉพาะตอนที่ 4 ช่องของกระทำการแทนโดยยังว่างทั้งหมด -> ไม่เขียนทับข้อมูลเดิม */
    ed.agent_branch = '00000';
    ed.agent_address = ISSUER.address;
    [['wh-agent-name', 'agent_name'], ['wh-agent-tax', 'agent_tax_id'],
     ['wh-agent-branch', 'agent_branch'], ['wh-agent-addr', 'agent_address']]
      .forEach(([id, k]) => { const el = cnt.querySelector('#' + id); if (el) el.value = ed[k]; });
  }
  /* ══ CODE Master — ผู้มีหน้าที่หักภาษี / ผู้ถูกหักภาษี (V.204) ══════════════
     *** Master ชุดเดียว *** njacc_customers (ตัวเดียวกับ Dropdown เดิม)
     CODE เดียวกันจึงสลับบทบาทระหว่าง 2 ฝ่ายได้ ไม่มีข้อมูลซ้ำ

     ── Auto Fill แล้วยังแก้ในเอกสารได้ (ข้อกำหนดข้อ 8) ──
     เขียนลง ed.* + input ของเอกสารเท่านั้น *** ไม่มีเส้นทางไหนเขียนกลับ Master ***
     Master แก้ได้ทางเดียวคือฟอร์ม "เพิ่ม/แก้ข้อมูล" ใน Modal (njacc_wht_party_upsert)

     ── Snapshot (ข้อกำหนดข้อ 9) ──
     ค่าที่เติมเข้าฟอร์มถูกบันทึกเป็นคอลัมน์ payer_ และ payee_ ของเอกสารตามเดิม
     แก้ Master ภายหลังจึงไม่กระทบเอกสารเก่า (พิสูจน์ใน tests/sql/wht_05_party.sql) */
  const PARTY = {
    payer: { code: 'wh-payer-code', pick: 'wh-payer-pick', go: 'wh-payer-code-go',
             cust: 'wh-cust', k: 'payer', custKey: 'customer_id',
             ids: { name: 'wh-payer-name', branch: 'wh-payer-branch',
                    tax: 'wh-payer-tax', cid: 'wh-payer-cid', addr: 'wh-payer-addr' },
             keys: { name: 'payer_name', branch: 'payer_branch', tax: 'payer_tax_id',
                     cid: 'payer_citizen_id', addr: 'payer_address', code: 'payer_code' } },
    payee: { code: 'wh-payee-code2', pick: 'wh-payee-pick', go: 'wh-payee-code-go',
             cust: 'wh-payee-cus', k: 'payee', custKey: 'payee_customer_id',
             ids: { name: 'wh-payee-name', branch: 'wh-payee-branch',
                    tax: 'wh-payee-tax', cid: 'wh-payee-cid', addr: 'wh-payee-addr' },
             keys: { name: 'payee_name', branch: 'payee_branch', tax: 'payee_tax_id',
                     cid: 'payee_citizen_id', addr: 'payee_address', code: 'payee_code' } },
  };

  /* ══ V.218 · Single Source of Truth ของสถานะ "ฝ่ายนี้ผูก MASTER อยู่หรือไม่" ══
     ตัวตัดสินเดียว = ed[P.custKey]
       payer -> ed.customer_id        · payee -> ed.payee_customer_id
     ผูกอยู่     : ✏️ แก้ไขข้อมูล = enabled · 💾 บันทึกเข้ารายชื่อ = disabled
                  (กด "บันทึกเข้ารายชื่อ" ด้วย CODE เดิมจะชน Duplicate อยู่แล้ว
                   จึงปิดไว้กันกดผิด ตามข้อ 9 แบบแนะนำ · ไม่แตะ RPC)
     ไม่ผูก      : ✏️ แก้ไขข้อมูล = disabled · 💾 บันทึกเข้ารายชื่อ = enabled
     *** แยกฝ่ายกันสมบูรณ์ *** เรียกด้วย side ไหนก็แตะเฉพาะปุ่มของฝ่ายนั้น
     ทุก Flow (ค้น / เลือกจากรายชื่อ / ค้นไม่พบ / ล้าง CODE / Save / Update)
     เรียกฟังก์ชันนี้ตัวเดียว -> ไม่มีทางที่ State จะไม่ตรงกัน (ข้อ 13) */
  function setPartyMasterState(side) {
    const P = PARTY[side]; if (!P) return;
    const bound = !!String(ed[P.custKey] || '').trim();
    const eb = cnt.querySelector('#wh-' + side + '-medit');
    const nb = cnt.querySelector('#wh-' + side + '-mnew');
    if (eb) {
      eb.disabled = !bound;
      eb.title = bound ? 'แก้ไขข้อมูลรายชื่อที่ผูกอยู่'
                       : 'ยังไม่ได้เลือกรายชื่อ — ค้นด้วย CODE หรือเลือกจากรายชื่อก่อน';
    }
    if (nb) {
      nb.disabled = bound;
      nb.title = bound ? 'CODE นี้มีอยู่ในรายชื่อแล้ว — ใช้ "แก้ไขข้อมูล"'
                       : 'บันทึกข้อมูลชุดนี้เข้ารายชื่อ';
    }
  }

  /* ── V.218 ── ตัดการผูก MASTER ของฝ่ายนั้น (ไม่ล้างข้อมูลที่กรอกไว้ในเอกสาร)
     ใช้ตอนค้นไม่พบ CODE / ล้าง CODE / เปลี่ยนเป็น CODE ใหม่ (ข้อ 7 · ข้อ 8)
     -> กัน "แก้ MASTER ผิดคน" จาก id ที่ค้างจากการเลือกครั้งก่อน */
  function unbindParty(side) {
    const P = PARTY[side]; if (!P) return;
    if (ed[P.custKey]) ed[P.custKey] = null;
    setPartyMasterState(side);
  }

  /* เติมข้อมูลจาก Master 1 แถวเข้าฟอร์มของฝ่ายที่ระบุ */
  function applyParty(side, row) {
    const P = PARTY[side];
    if (!P || !row) return;
    ed[P.keys.code] = row.code || '';
    ed[P.keys.name] = row.name || '';
    ed[P.keys.branch] = row.branch || '';
    ed[P.keys.tax] = row.tax_id || '';
    ed[P.keys.cid] = row.citizen_id || '';
    ed[P.keys.addr] = row.address || '';
    /* Master คือ njacc_customers ตัวเดียวกับ Dropdown -> ผูก id ให้ตรงกันด้วย
       (customer_id / payee_customer_id ใช้ค้นย้อนหลังตามระบบเดิม) */
    if (row.id) {
      ed[P.custKey] = row.id;
      /* ── V.209 ── Dropdown เลือกลูกค้าถูกถอดออกจากหน้าแล้ว
         คง sync ไว้แบบ optional (มี guard `if (sel …)` อยู่เดิม) -> ไม่ throw
         และถ้าอนาคตเปิด Dropdown กลับมา โค้ดนี้ทำงานต่อได้ทันที
         *** ed[P.custKey] ยังถูกตั้งค่าเสมอ *** customer_id / payee_customer_id
         จึงยังถูกบันทึกลง Database เหมือนเดิมทุกประการ */
      const sel = cnt.querySelector('#' + P.cust);
      if (sel && [...sel.options].some(o => o.value === row.id)) sel.value = row.id;
    }
    const set = (id, v) => { const el = cnt.querySelector('#' + id); if (el) el.value = v || ''; };
    set(P.code, ed[P.keys.code]);
    set(P.ids.name, ed[P.keys.name]);
    set(P.ids.branch, ed[P.keys.branch]);
    set(P.ids.tax, ed[P.keys.tax]);
    set(P.ids.cid, ed[P.keys.cid]);
    set(P.ids.addr, ed[P.keys.addr]);
    /* ── V.218 ── ผูก/ไม่ผูก MASTER เปลี่ยนแล้ว -> อัปเดตปุ่มทันที
       ครอบทั้ง "ค้นด้วย CODE" · "เลือกจากรายชื่อ" · "หลัง Save/Update Master"
       เพราะทุกเส้นทางเรียก applyParty() ตัวนี้ตัวเดียว */
    setPartyMasterState(side);
  }

  /* พิมพ์ CODE แล้วกด Enter / ออกจากช่อง / กดปุ่ม 🔍 -> ค้นตรงตัวแล้วเติมให้ */
  async function lookupCode(side) {
    const P = PARTY[side];
    const el = cnt.querySelector('#' + P.code);
    const code = (el && el.value || '').trim();
    if (!code) return;
    try {
      const res = await whtPartySearch({ code });
      const rows = (res && res.rows) || [];
      if (!rows.length) {
        /* ── V.218 ── ไม่พบ -> ต้องไม่ค้างการผูก MASTER ตัวก่อนหน้า (ข้อ 8)
           มิฉะนั้นกด "แก้ไขข้อมูล" จะไปแก้ MASTER ผิดคน */
        unbindParty(side);
        toast('ไม่พบ CODE "' + code + '" ใน Master', 'err'); return;
      }
      applyParty(side, rows[0]);
      toast('เติมข้อมูลจาก CODE ' + rows[0].code + ' แล้ว', 'ok');
    } catch (ex) { handleErr(ex, 'ค้นหา CODE ไม่สำเร็จ'); }
  }

  /* ── Modal: ค้นหาข้อมูลลูกค้า / ผู้จ่าย ─────────────────────────────────── */
  function openPartyPicker(side) {
    const body = document.createElement('div');
    body.className = 'whp-pk';
    body.innerHTML = `
      <div class="whp-pk-bar">
        <label for="whp-pk-q">ค้นหา</label>
        <input class="inp" id="whp-pk-q" placeholder="ระบุ CODE หรือ ชื่อ" autocomplete="off">
        <button type="button" class="btn btn-o btn-sm" id="whp-pk-go">🔍 ค้นหา</button>
        ${isAdmin() ? '<button type="button" class="btn btn-p btn-sm" id="whp-pk-new">＋ เพิ่มข้อมูลใหม่</button>' : ''}
      </div>
      <div class="tbl-wrap whp-pk-tbl"><table class="tbl"><thead><tr>
        <th style="width:44px">เลือก</th><th style="width:110px">CODE</th><th>ชื่อ</th>
        <th style="width:150px">เลขประจำตัวผู้เสียภาษีอากร</th>
        <th style="width:90px">สาขา</th><th>ที่อยู่</th>
      </tr></thead><tbody id="whp-pk-tb"></tbody></table></div>
      <div class="whp-pk-form" id="whp-pk-form" hidden></div>`;

    const foot = document.createElement('div');
    foot.innerHTML = `<div class="mf-right">
        <button class="btn btn-p" id="whp-pk-ok">เลือก</button>
        <button class="btn btn-o" data-close>ยกเลิก</button></div>`;
    /* large = .modal-lg (880px) ของระบบเดิม — พอสำหรับตาราง 6 คอลัมน์
       *** ไม่ใช้ wide *** เพราะ .modal-w80 ต้องมากับ fullscreen จึงจะมีผล */
    openModal({ title: 'ค้นหาข้อมูลลูกค้า / ผู้ขาย', body, footer: foot, large: true });

    const tb = body.querySelector('#whp-pk-tb');
    let rows = [];
    let picked = null;

    /* ── V.224 ── กันผลค้นเก่ากลับมาทับผลใหม่ (ข้อ 13)
       ใช้ nextToken()/isCurrent() ตัวกลางเดิม — Pattern เดียวกับ Autocomplete V.206
       *** ไม่สร้างระบบกัน stale ใหม่ *** key แยกตามฝ่าย -> Payer/Payee ไม่กวนกัน */
    const PK_KEY = 'wh-pk-' + side;
    async function search() {
      const q = (body.querySelector('#whp-pk-q').value || '').trim();
      const t = nextToken(PK_KEY);
      tb.innerHTML = '<tr><td colspan="6" class="center t-3">กำลังค้นหา…</td></tr>';
      let res = null;
      try {
        res = await whtPartySearch(q ? { q } : {});
      } catch (ex) {
        if (!isCurrent(PK_KEY, t)) return;      /* คำค้นเก่า -> ทิ้งไปเงียบ ๆ */
        handleErr(ex, 'ค้นหาไม่สำเร็จ'); res = null;
      }
      if (!isCurrent(PK_KEY, t)) return;        /* ผลเก่ามาช้ากว่า -> ห้ามทับผลใหม่ */
      rows = (res && res.rows) || [];
      picked = null;
      tb.innerHTML = rows.length ? rows.map((r, i) => `<tr data-i="${i}">
          <td class="center"><input type="radio" name="whp-pk-r" value="${i}"></td>
          <td class="t-b">${esc(r.code || '-')}</td>
          <td class="ellip" title="${esc(r.name || '')}">${esc(r.name || '-')}</td>
          <td>${esc(r.tax_id || '-')}</td>
          <td>${esc(r.branch || '-')}</td>
          <td class="ellip" title="${esc(r.address || '')}">${esc(r.address || '-')}</td>
        </tr>`).join('')
        : '<tr><td colspan="6" class="center t-3">ไม่พบข้อมูล</td></tr>';
    }
    tb.addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-i]'); if (!tr) return;
      const rb = tr.querySelector('input[type=radio]'); if (rb) rb.checked = true;
      picked = rows[Number(tr.dataset.i)];
    });
    tb.addEventListener('change', (e) => {
      if (e.target.name === 'whp-pk-r') picked = rows[Number(e.target.value)];
    });
    /* ── V.224 ── Live Search — พิมพ์แล้วเด้งรายการเองภายใน 250ms (ข้อ 2/7/8)
       *** ทั้ง 3 ทางเรียก search() ตัวเดียวกัน *** พิมพ์ · กด 🔍 · กด Enter
       เริ่มค้นตั้งแต่ 1 ตัวอักษร (ข้อ 9) · ล้างช่องแล้วกลับมาแสดงทั้งหมด (ข้อ 10)
       ใช้ debounce() ตัวกลางเดิมของระบบ *** ไม่สร้าง helper ซ้ำ ***
       key แยกตามฝ่าย -> เปิด Modal สลับฝ่ายแล้ว timer ไม่ตีกัน */
    /* ── V.225 ── ลด Debounce 250 -> 100ms (คอขวดคือ Frontend ไม่ใช่ Database)
       *** ตัวแปรเดียว *** ไม่มี Delay ตัวอื่นซ้อนอยู่ */
    const PK_WAIT = 100;
    body.querySelector('#whp-pk-q').addEventListener('input', () => {
      debounce(PK_KEY, search, PK_WAIT);
    });
    /* ── V.225 ── ผู้ใช้สั่งค้นเอง = ค้นทันที 0ms และต้อง *** ไม่ยิงซ้ำ ***
       ยกเลิก timer ที่ค้างก่อนเสมอ ไม่งั้นพิมพ์แล้วรีบกด -> timer เดิมครบเวลา
       จะยิง search() ซ้ำอีกรอบ (RPC ซ้ำโดยเปล่าประโยชน์)
       ใช้ cancelDebounce() ที่ใช้ Map เดิม *** ไม่สร้าง timer ใหม่ *** */
    const searchNow = () => { cancelDebounce(PK_KEY); search(); };
    body.querySelector('#whp-pk-go').onclick = searchNow;
    body.querySelector('#whp-pk-q').onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); searchNow(); } };
    foot.querySelector('#whp-pk-ok').onclick = () => {
      if (!picked) { toast('เลือกรายการก่อน', 'err'); return; }
      applyParty(side, picked);
      closeModal();
      toast('เติมข้อมูลจาก CODE ' + (picked.code || '') + ' แล้ว', 'ok');
    };

    /* ── ＋ เพิ่มข้อมูลใหม่ (แก้ Master โดยตรง · ADMIN เท่านั้น) ── */
    const nb = body.querySelector('#whp-pk-new');
    if (nb) nb.onclick = () => {
      const fm = body.querySelector('#whp-pk-form');
      fm.hidden = false;
      fm.innerHTML = `
        <h4 class="whp-pk-ft">เพิ่มข้อมูลใหม่ใน Master</h4>
        <div class="whp-r3">
          <div class="fld"><label>CODE <span class="req">*</span></label>
            <input class="inp w100" id="whp-nc" placeholder="เช่น NJ"></div>
          <div class="fld whp-sp2"><label>ชื่อ <span class="req">*</span></label>
            <input class="inp w100" id="whp-nn"></div>
        </div>
        <div class="whp-r3">
          <div class="fld"><label>สาขา</label>
            <input class="inp w100" id="whp-nb" inputmode="numeric" maxlength="5"
              pattern="[0-9]{5}" placeholder="00000"></div>
          <div class="fld"><label>เลขประจำตัวผู้เสียภาษีอากร</label>
            <input class="inp w100" id="whp-nt" inputmode="numeric" maxlength="13"></div>
          <div class="fld"><label>เลขประจำตัวบัตรประชาชน</label>
            <input class="inp w100" id="whp-ni" inputmode="numeric" maxlength="13"></div>
        </div>
        <div class="fld"><label>ที่อยู่</label><input class="inp w100" id="whp-na"></div>
        <div class="whp-pk-fb">
          <button type="button" class="btn btn-p btn-sm" id="whp-nsave">บันทึก</button>
          <button type="button" class="btn btn-o btn-sm" id="whp-ncancel">ยกเลิก</button>
        </div>`;
      /* ช่องตัวเลขล้วน — กติกาเดียวกับฟอร์มหลัก */
      [['whp-nb', 5], ['whp-nt', 13], ['whp-ni', 13]].forEach(([id, lim]) => {
        const el = fm.querySelector('#' + id);
        el.oninput = (e) => {
          const c = String(e.target.value).replace(/\D/g, '').slice(0, lim);
          if (c !== e.target.value) e.target.value = c;
        };
      });
      fm.querySelector('#whp-ncancel').onclick = () => { fm.hidden = true; fm.innerHTML = ''; };
      fm.querySelector('#whp-nsave').onclick = async () => {
        const g = (id) => (fm.querySelector('#' + id).value || '').trim();
        clearInvalid(fm);
        if (!g('whp-nc')) { toast('กรอก CODE ก่อน', 'err'); return; }
        if (!g('whp-nn')) { toast('กรอกชื่อก่อน', 'err'); return; }
        for (const [id, label] of [['whp-nt', 'เลขประจำตัวผู้เสียภาษีอากร'],
                                   ['whp-ni', 'เลขประจำตัวบัตรประชาชน']]) {
          const v = g(id);
          if (v && !isValidTaxId13(v)) { toast(label + ' ต้องเป็นตัวเลข 13 หลัก', 'err'); return; }
        }
        /* ── V.220 ── สาขา: กรอกแล้วต้องครบ 5 หลักพอดี จึงจะ Save Master ได้ */
        if (g('whp-nb') && !isValidBranch5(g('whp-nb'))) {
          markInvalid(fm.querySelector('#whp-nb'), BRANCH5_MSG);
          toast(BRANCH5_MSG, 'err'); return;
        }
        /* ── ด่านที่ 1: ตรวจซ้ำฝั่ง Frontend ก่อนยิง RPC (ข้อกำหนดข้อ 8) ──
           เพื่อบอกผู้ใช้ได้เร็วและระบุรายการที่ชนได้ชัด
           *** ไม่ใช่ด่านสุดท้าย *** RPC + UNIQUE INDEX ยังตรวจซ้ำอีกชั้นเสมอ
           (njacc_wht_party_search คืนเฉพาะ active -> รายการที่ปิดใช้งานจะจับได้ที่ RPC)
           ตรวจตามลำดับ CODE -> Tax ID+สาขา -> Citizen ID ตามข้อกำหนดข้อ 1 */
        const nc = dupCode(g('whp-nc'));
        const nt = dupId(g('whp-nt'));
        const ni = dupId(g('whp-ni'));
        const nb = dupBranch(g('whp-nb'));
        try {
          const pre = ((await whtPartySearch({ size: 200 })) || {}).rows || [];
          const hitCode = pre.find(r => dupCode(r.code) === nc);
          /* *** สาขาอย่างเดียว / ที่อยู่อย่างเดียว ไม่นับเป็นซ้ำ *** (ข้อ 2 · ข้อ 3) */
          const hitTax = nt ? pre.find(r => dupId(r.tax_id) === nt
                                         && dupBranch(r.branch) === nb) : null;
          const hitCid = ni ? pre.find(r => dupId(r.citizen_id) === ni) : null;
          const hit = hitCode ? ['whp-nc', PARTY_DUP_MSG.NJACC_PARTY_CODE_DUPLICATE[1], hitCode]
            : hitTax ? ['whp-nt', PARTY_DUP_MSG.NJACC_PARTY_TAXBRANCH_DUPLICATE[1], hitTax]
            : hitCid ? ['whp-ni', PARTY_DUP_MSG.NJACC_PARTY_CITIZEN_DUPLICATE[1], hitCid]
            : null;
          if (hit) {
            const msg = hit[1] + dupWho(hit[2].code, hit[2].name);
            markInvalid(fm.querySelector('#' + hit[0]), msg);
            toast(msg, 'err');
            /* Modal ยังเปิด · ค่าที่กรอกยังอยู่ครบ (ข้อกำหนดข้อ 11) */
            return;
          }
        } catch (_) { /* ค้นไม่ได้ก็ไม่บล็อก — ปล่อยให้ RPC เป็นด่านตัดสิน */ }
        try {
          const row = await once('wht-party-upsert', () => whtPartyUpsert({
            code: g('whp-nc'), name: g('whp-nn'), branch: g('whp-nb'),
            tax_id: g('whp-nt'), citizen_id: g('whp-ni'), address: g('whp-na') }));
          toast('บันทึก Master แล้ว — เลือกใช้ได้ทันที', 'ok');
          fm.hidden = true; fm.innerHTML = '';
          /* Master เปลี่ยนแล้ว -> ล้าง cache ให้ Dropdown เดิมเห็นรายการใหม่ด้วย */
          try { await masters(true); } catch (_) {}
          body.querySelector('#whp-pk-q').value = row && row.code ? row.code : g('whp-nc');
          await search();
        } catch (ex) {
          /* ── ด่านที่ 2: ผลตรวจซ้ำจาก RPC/DB (authoritative) ──
             พบซ้ำ -> ไม่ INSERT · Modal ยังเปิด · ค่าที่กรอกไม่หาย · ไฮไลต์ช่องที่ชน */
          const dup = parsePartyDup(ex);
          if (dup) {
            const el = fm.querySelector('#' + dup.field);
            if (el) markInvalid(el, dup.msg);
            toast(dup.msg, 'err');
            return;
          }
          const m = String((ex && ex.message) || '');
          if (m.includes('NJACC_FORBIDDEN')) toast('ไม่มีสิทธิ์แก้ Master (ต้องเป็น ADMIN)', 'err');
          else handleErr(ex, 'บันทึก Master ไม่สำเร็จ');
        }
      };
    };

    search();
  }

  /* ══ V.216 · MASTER ของคู่สัญญา — บันทึกเข้ารายชื่อ / แก้ไข / อัปเดต ═══════
     *** ใช้ของเดิมทั้งหมด ***
       Master Table : public.njacc_customers   (PK = id)
       CODE Field   : customer_code            (UNIQUE njacc_cust_code_uq)
       ค้น          : whtPartySearch()  -> njacc_wht_party_search
       เขียน        : whtPartyUpsert()  -> njacc_wht_party_upsert
                      ไม่ส่ง id -> INSERT · ส่ง id -> UPDATE WHERE id = v_id
                      Duplicate Guard : CODE / TaxID+สาขา / CitizenID
                      (RPC เว้นตัวเองด้วย  AND (v_id IS NULL OR c.id <> v_id))
       เติมฟอร์ม    : applyParty(side,row) ตัวเดิม
     *** ไม่สร้าง RPC/Table/Logic ใหม่ · ไม่แตะเอกสาร 50 ทวิ ***
     ปุ่มชุดนี้ไม่ยิง njacc_save_wht_draft / ไม่ออก Reference No. / ไม่ปิดฟอร์ม */
  async function openMasterForm(side, mode) {
    const P = PARTY[side];
    const g0 = (id) => (cnt.querySelector('#' + id) || {}).value || '';
    const codeNow = g0(P.code).trim();
    if (!codeNow) { toast('กรุณาระบุ CODE ก่อนบันทึกข้อมูล', 'err'); return; }

    /* Edit Mode : ต้องโหลด Master Record เดิมจาก Database (ไม่ใช้ค่าบนฟอร์ม)
       -> เห็นค่าจริงล่าสุด และได้ id เดิมมาใช้ UPDATE */
    let base = { id: null, code: codeNow, name: g0(P.ids.name), branch: g0(P.ids.branch),
                 tax_id: g0(P.ids.tax), citizen_id: g0(P.ids.cid), address: g0(P.ids.addr) };
    if (mode === 'edit') {
      try {
        const res = await whtPartySearch({ code: codeNow });
        const row = ((res && res.rows) || [])[0];
        if (!row || !row.id) { toast('ไม่พบ CODE "' + codeNow + '" ในรายชื่อ', 'err'); return; }
        base = { id: row.id, code: row.code || '', name: row.name || '',
                 branch: row.branch || '', tax_id: row.tax_id || '',
                 citizen_id: row.citizen_id || '', address: row.address || '' };
      } catch (ex) { handleErr(ex, 'โหลดข้อมูลรายชื่อไม่สำเร็จ'); return; }
    }

    const body = document.createElement('div');
    body.className = 'whp-pk';
    body.innerHTML = `
      <h4 class="whp-pk-ft">${mode === 'edit'
        ? 'แก้ไขข้อมูลในรายชื่อ' : 'บันทึกเข้ารายชื่อ'} —
        ${side === 'payer' ? 'ผู้มีหน้าที่หักภาษี ณ ที่จ่าย' : 'ผู้ถูกหักภาษี ณ ที่จ่าย'}</h4>
      <div class="whp-r3">
        <div class="fld"><label>CODE <span class="req">*</span></label>
          <input class="inp w100" id="whm-c" value="${esc(base.code)}" placeholder="เช่น NJ"></div>
        <div class="fld whp-sp2"><label>ชื่อ <span class="req">*</span></label>
          <input class="inp w100" id="whm-n" value="${esc(base.name)}"></div>
      </div>
      <div class="whp-r3">
        <div class="fld"><label>สาขา</label>
          <input class="inp w100" id="whm-b" inputmode="numeric" maxlength="5"
            pattern="[0-9]{5}" value="${esc(base.branch)}" placeholder="00000"></div>
        <div class="fld"><label>เลขประจำตัวผู้เสียภาษีอากร</label>
          <input class="inp w100" id="whm-t" inputmode="numeric" maxlength="13"
            value="${esc(base.tax_id)}"></div>
        <div class="fld"><label>เลขประจำตัวบัตรประชาชน</label>
          <input class="inp w100" id="whm-i" inputmode="numeric" maxlength="13"
            value="${esc(base.citizen_id)}"></div>
      </div>
      <div class="fld"><label>ที่อยู่</label>
        <input class="inp w100" id="whm-a" value="${esc(base.address)}"></div>`;

    const foot = document.createElement('div');
    foot.innerHTML = `<div class="mf-right">
        <button class="btn btn-p" id="whm-save">${mode === 'edit'
          ? '💾 อัปเดตข้อมูล' : '💾 บันทึกเข้ารายชื่อ'}</button>
        <button class="btn btn-o" data-close>ยกเลิก</button></div>`;
    openModal({ title: mode === 'edit' ? 'แก้ไขข้อมูลรายชื่อ' : 'บันทึกเข้ารายชื่อ',
      body, footer: foot, large: true });

    /* ช่องตัวเลขล้วน — กติกาเดียวกับฟอร์มหลัก */
    [['whm-b', 5], ['whm-t', 13], ['whm-i', 13]].forEach(([id, lim]) => {
      const el = body.querySelector('#' + id);
      el.oninput = (e) => {
        const c = String(e.target.value).replace(/\D/g, '').slice(0, lim);
        if (c !== e.target.value) e.target.value = c;
      };
    });

    foot.querySelector('#whm-save').onclick = async (e) => {
      const g = (id) => (body.querySelector('#' + id).value || '').trim();
      clearInvalid(body);
      if (!g('whm-c')) { toast('กรุณาระบุ CODE ก่อนบันทึกข้อมูล', 'err'); return; }
      if (!g('whm-n')) { toast('กรอกชื่อก่อน', 'err'); return; }
      for (const [id, label] of [['whm-t', 'เลขประจำตัวผู้เสียภาษีอากร'],
                                 ['whm-i', 'เลขประจำตัวบัตรประชาชน']]) {
        const v = g(id);
        if (v && !isValidTaxId13(v)) { toast(label + ' ต้องเป็นตัวเลข 13 หลัก', 'err'); return; }
      }
      /* ── V.220 ── สาขา 5 หลัก — ใช้ทั้ง "บันทึกเข้ารายชื่อ" และ "อัปเดตข้อมูล"
         *** ด่านเดียวกันทั้ง 2 โหมด *** ไม่ผ่าน = ไม่ยิง RPC · Modal ยังเปิด */
      if (g('whm-b') && !isValidBranch5(g('whm-b'))) {
        markInvalid(body.querySelector('#whm-b'), BRANCH5_MSG);
        toast(BRANCH5_MSG, 'err'); return;
      }
      /* กันกดรัว — ใช้ btnBusy + once() ตัวกลางเดิม (ข้อ 25) */
      btnBusy(e.target, true);
      try {
        const payload = { code: g('whm-c'), name: g('whm-n'), branch: g('whm-b'),
                          tax_id: g('whm-t'), citizen_id: g('whm-i'), address: g('whm-a') };
        /* *** id ส่งเฉพาะ Edit Mode *** -> RPC จึง UPDATE แถวเดิม ไม่ INSERT ใหม่
           Master ID จึงไม่เปลี่ยน (ข้อ 12) */
        if (mode === 'edit' && base.id) payload.id = base.id;
        const row = await once('wht-master-' + side + '-' + (base.id || 'new'),
          () => whtPartyUpsert(payload));
        closeModal();
        /* Master เปลี่ยน -> ล้าง cache ให้การค้น/เลือกครั้งต่อไปได้ค่าล่าสุด (ข้อ 16/17) */
        try { await masters(true); } catch (_) {}
        /* เติมค่าล่าสุดกลับเข้าฟอร์มฝ่ายนั้นทันที ไม่ต้อง Refresh Browser (ข้อ 15)
           applyParty() ตั้ง ed[P.custKey] = row.id ให้ด้วย -> ปุ่มแก้ไขใช้ได้ทันที */
        /* ── V.218 ── applyParty() ตั้ง ed[P.custKey] แล้วเรียก
           setPartyMasterState() ให้เองในตัว -> ไม่ต้องสั่ง disabled ซ้ำที่นี่อีก
           (เดิมสั่งตรงจุดนี้จุดเดียว จึงเป็นเหตุให้ Flow ค้นหา/เลือกไม่เปิดปุ่ม) */
        if (row) applyParty(side, row);
        else setPartyMasterState(side);
        toast((mode === 'edit' ? 'อัปเดตข้อมูล ' : 'บันทึก ') + g('whm-c')
          + (mode === 'edit' ? ' แล้ว' : ' เข้ารายชื่อแล้ว'), 'ok');
      } catch (ex) {
        /* FAIL -> Modal ยังเปิด · ค่าที่กรอกไม่หาย · ไฮไลต์ช่องที่ชน (ข้อ 26) */
        const dup = parsePartyDup(ex);
        if (dup) {
          /* PARTY_DUP_MSG ใช้ id ของฟอร์มเดิม (whp-nc/nt/ni) -> map เป็น id ฟอร์มนี้ */
          const MAP = { 'whp-nc': 'whm-c', 'whp-nn': 'whm-n', 'whp-nb': 'whm-b',
                        'whp-nt': 'whm-t', 'whp-ni': 'whm-i', 'whp-na': 'whm-a' };
          const el = body.querySelector('#' + (MAP[dup.field] || 'whm-c'));
          if (el) markInvalid(el, dup.msg);
          toast(dup.msg, 'err');
        } else if (String((ex && ex.message) || '').includes('NJACC_FORBIDDEN')) {
          toast('ไม่มีสิทธิ์แก้รายชื่อ (ต้องเป็น ADMIN)', 'err');
        } else handleErr(ex, 'บันทึกรายชื่อไม่สำเร็จ');
        btnBusy(e.target, false);
      }
    };
  }

  ['payer', 'payee'].forEach((side) => {
    const nb = cnt.querySelector('#wh-' + side + '-mnew');
    const eb = cnt.querySelector('#wh-' + side + '-medit');
    if (nb) nb.onclick = () => openMasterForm(side, 'new');
    if (eb) eb.onclick = () => openMasterForm(side, 'edit');
    /* ── V.218 ── แก้ CODE เอง (ล้าง / พิมพ์ CODE ใหม่) = ยังไม่ยืนยันว่าเป็นราย
       ไหนใน MASTER -> ตัดการผูกทันที ปุ่มแก้ไขต้องปิด (ข้อ 7)
       ค้นเจอเมื่อไหร่ applyParty() จะผูกกลับและเปิดปุ่มให้เอง
       *** ไม่ล้างชื่อ/ที่อยู่/Tax ID ที่กรอกไว้ในเอกสาร *** */
    const ci = cnt.querySelector('#' + PARTY[side].code);
    if (ci) ci.addEventListener('input', () => unbindParty(side));
    /* ตั้ง State เริ่มต้นให้ตรงกับ ed จริงตอนเปิดฟอร์ม (เอกสารเก่าที่ผูก Master ไว้
       จะได้ปุ่มแก้ไขที่ใช้งานได้ทันที ไม่ต้องค้นซ้ำ) */
    setPartyMasterState(side);
  });

  /* ══ Autocomplete ที่ช่อง "ชื่อ" (V.206) ═══════════════════════════════════
     *** ช่องทางเพิ่ม ไม่ได้แทนที่อะไร *** — ช่อง CODE · ปุ่ม 🔍 ·
     ปุ่ม 👥 เลือกจากรายชื่อ · Dropdown เลือกลูกค้า ยังอยู่ครบและทำงานเหมือนเดิม
     ใช้ของเดิมทั้งหมด: whtPartySearch({q}) เป็นตัวค้น · applyParty(side,row)
     เป็นตัวเติมข้อมูล -> ไม่มีชุด set ค่าทีละช่องซ้ำซ้อน (ข้อกำหนดข้อ 6)
     *** ไม่ INSERT/UPDATE Master ระหว่างพิมพ์หรือเลือก *** (ข้อกำหนดข้อ 5)
     กันผลค้นเก่ากลับมาทับด้วย nextToken/isCurrent ตัวกลางเดิม (ข้อกำหนดข้อ 9) */
  const AC_MIN = 2;          /* เริ่มค้นเมื่อพิมพ์ครบ 2 ตัวอักษร */
  const AC_WAIT = 250;       /* debounce 250ms (ข้อกำหนดข้อ 8) */
  function attachNameAC(side) {
    const P = PARTY[side];
    const input = cnt.querySelector('#' + P.ids.name);
    if (!input || input.dataset.acOn === '1') return;
    const host = input.closest('.fld');
    if (!host) return;
    input.dataset.acOn = '1';
    input.setAttribute('autocomplete', 'off');
    host.classList.add('whp-ac-host');

    const box = document.createElement('div');
    box.className = 'whp-ac';
    box.hidden = true;
    host.appendChild(box);

    const key = 'wht-ac-' + side;
    let rows = [], hi = -1;

    const close = () => { box.hidden = true; box.innerHTML = ''; rows = []; hi = -1; };
    const paint = () => {
      [...box.children].forEach((el, i) => el.classList.toggle('on', i === hi));
      const cur = hi >= 0 ? box.children[hi] : null;
      /* scrollIntoView ไม่มีในทุก environment -> ตรวจก่อนเรียก (ไม่ให้ throw กลาง keydown) */
      if (cur && typeof cur.scrollIntoView === 'function') cur.scrollIntoView({ block: 'nearest' });
    };
    const draw = () => {
      if (!rows.length) { close(); return; }
      /* บรรทัดบน = ชื่อบริษัท · บรรทัดล่าง = CODE · Tax ID · สาขา (ข้อกำหนดข้อ 3) */
      box.innerHTML = rows.map((r, i) => `<div class="whp-ac-i" data-i="${i}">
          <div class="whp-ac-n">${esc(r.name || '-')}</div>
          <div class="whp-ac-m">${esc(r.code || '-')} · ${esc(r.tax_id || '-')} · ${esc(r.branch || '-')}</div>
        </div>`).join('');
      hi = -1;                 /* *** ไม่ highlight/เติมรายการแรกเอง *** (ข้อกำหนดข้อ 3) */
      box.hidden = false;
      paint();
    };
    const pick = (i) => {
      const row = rows[i];
      if (!row) return;
      close();
      /* Logic กลางชุดเดียวกับ CODE Search และปุ่มเลือกจากรายชื่อ */
      applyParty(side, row);
      toast('เติมข้อมูลจาก CODE ' + (row.code || '-') + ' แล้ว', 'ok');
    };

    input.addEventListener('input', () => {
      const q = (input.value || '').trim();
      if (q.length < AC_MIN) { close(); return; }
      debounce(key, async () => {
        const t = nextToken(key);
        try {
          const res = await whtPartySearch({ q, size: 20 });
          if (!isCurrent(key, t)) return;      /* ผลเก่ามาช้า -> ทิ้ง */
          rows = (res && res.rows) || [];
          draw();
        } catch (_) { if (isCurrent(key, t)) close(); }
      }, AC_WAIT);
    });

    /* mousedown + preventDefault -> input ไม่ blur ก่อน จึงคลิกเลือกได้จริง (ข้อ 11) */
    box.addEventListener('mousedown', (e) => {
      const it = e.target.closest('.whp-ac-i');
      if (!it) return;
      e.preventDefault();
      pick(Number(it.dataset.i));
    });
    box.addEventListener('mousemove', (e) => {
      const it = e.target.closest('.whp-ac-i');
      if (!it) return;
      hi = Number(it.dataset.i); paint();
    });

    input.addEventListener('keydown', (e) => {
      if (box.hidden || !rows.length) return;   /* ปิดอยู่ -> Enter ทำงานตามเดิม */
      if (e.key === 'ArrowDown') { e.preventDefault(); hi = (hi + 1) % rows.length; paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); hi = (hi <= 0 ? rows.length : hi) - 1; paint(); }
      else if (e.key === 'Enter') {
        /* เลือกเฉพาะรายการที่ Highlight เท่านั้น · ไม่มี highlight = ไม่เลือกอะไร
           preventDefault ทุกกรณีที่รายการเปิดอยู่ -> Enter ไม่ไป Save/ข้ามช่อง */
        e.preventDefault();
        if (hi >= 0) pick(hi); else close();
      } else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });

    input.addEventListener('blur', () => close());
  }

  Object.keys(PARTY).forEach((side) => {
    const P = PARTY[side];
    const el = cnt.querySelector('#' + P.code);
    if (el) {
      el.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); lookupCode(side); } };
      el.onblur = () => lookupCode(side);
    }
    const go = cnt.querySelector('#' + P.go);
    if (go) go.onclick = () => lookupCode(side);
    const pk = cnt.querySelector('#' + P.pick);
    if (pk) pk.onclick = () => openPartyPicker(side);
    attachNameAC(side);
  });

  /* ══ Checkbox "เงินกองทุน / ประกันสังคม" (V.198) ════════════════════════
     ซ่อน/แสดงอย่างเดียว *** ไม่ล้างค่าใน State/DOM *** ติ๊กกลับแล้วข้อมูลเดิมยังอยู่
     ตอน Save ส่ง has_fund=false + ยอดทั้ง 3 = null และ SQL ล้างซ้ำอีกชั้น */
  const fdChk = cnt.querySelector('#wh-has-fund');
  const fdSec = cnt.querySelector('#wh-fund-sec');
  if (fdChk) fdChk.onchange = (e) => {
    ed.has_fund = !!e.target.checked;
    if (fdSec) fdSec.hidden = !ed.has_fund;
  };

  const agChk = cnt.querySelector('#wh-has-agent');
  const agSec = cnt.querySelector('#wh-agent-sec');
  if (agChk) agChk.onchange = (e) => {
    ed.has_agent = !!e.target.checked;
    if (ed.has_agent) applyAgentDefaults();
    if (agSec) agSec.hidden = !ed.has_agent;
  };

  /* 🔎 ดึงข้อมูลจาก INVOICE — Optional Helper
     เรียก renderPick() ตัวเดิม (ไม่ได้เขียน Flow ค้นหา/Auto Fill ใหม่)
     ไม่กดปุ่มนี้ก็กรอกเองได้ทุกช่อง ไม่มีอะไรบังคับ */
  const fi = cnt.querySelector('#wh-frominv');
  if (fi) fi.onclick = () => renderPick(cnt);

  /* ── V.209 ── เดิมผูก cnt.querySelector('#wh-payee-cus').onchange ตรง ๆ
     Dropdown ถูกถอดออกแล้ว -> บรรทัดเดิมจะ throw null ทำให้ทั้งฟอร์มพัง
     ถอด Binding ออกคู่กับ markup · งานเดิมยังอยู่ครบผ่าน applyParty() :
       ed.payee_customer_id <- row.id (P.custKey) · ชื่อ/สาขา/Tax/ที่อยู่/CODE
     *** applyParty() เติมได้มากกว่าเดิม *** เพราะเติม citizen_id ให้ด้วย
     (Dropdown เดิมไม่มีเลขบัตรประชาชนให้เติม) */

  /* ── V.214 ── Checkbox 2 หัวข้อ — Show/Hide เท่านั้น
     *** ไม่แตะ radio · ไม่แตะ ed.form_type / form_seq / pay_method /
     pay_method_other · ไม่แตะ payload *** ติ๊กกลับค่าเดิมอยู่ครบ (ข้อ 10) */
  [['wh-has-form', 'wh-form-sec', 'has_form'],
   ['wh-has-pm', 'wh-pm-sec', 'has_pm']].forEach(([chkId, secId, key]) => {
    const c = cnt.querySelector('#' + chkId);
    const sec = cnt.querySelector('#' + secId);
    if (!c) return;
    c.onchange = (e) => { ed[key] = !!e.target.checked; if (sec) sec.hidden = !ed[key]; };
  });

  /* radio 2 กลุ่ม — เลือกได้กลุ่มละ 1 ค่าโดยโครงสร้าง (name เดียวกัน)
     "อื่น ๆ" เท่านั้นที่เปิดช่องกรอก · เลือกค่าอื่นแล้วซ่อนแต่ไม่ล้างข้อความที่พิมพ์ไว้ */
  cnt.querySelector('#wh-form-rd').addEventListener('change', (e) => {
    if (e.target.name === 'wh-form') ed.form_type = e.target.value;
  });
  cnt.querySelector('#wh-pm-rd').addEventListener('change', (e) => {
    if (e.target.name !== 'wh-pm') return;
    ed.pay_method = e.target.value;
    const w = cnt.querySelector('#wh-pm-other-wrap');
    if (w) w.hidden = (ed.pay_method !== PAY_METHOD_OTHER);
  });

  /* เขียนค่าใน ed กลับลงช่องกรอก (ใช้หลัง Auto Fill — ไม่ re-render ทั้งฟอร์ม
     จึงไม่ทำให้ค่าที่ผู้ใช้พิมพ์ค้างอยู่ในช่องอื่นหาย) */
  function syncPayerInputs() {
    [['wh-payer-name', 'payer_name'], ['wh-payer-tax', 'payer_tax_id'],
     ['wh-payer-branch', 'payer_branch'], ['wh-payer-addr', 'payer_address']]
      .forEach(([id, k]) => { const el = cnt.querySelector('#' + id); if (el) el.value = ed[k] || ''; });
  }
  /* หมายเหตุ: njacc_customers ไม่มีคอลัมน์เลขบัตรประชาชน
     -> เลือกลูกค้าแล้ว *** ไม่เขียนทับ/ไม่ล้าง *_citizen_id *** (ผู้ใช้กรอกเอง) */
  function syncPayeeInputs() {
    [['wh-payee-name', 'payee_name'], ['wh-payee-tax', 'payee_tax_id'],
     ['wh-payee-branch', 'payee_branch'], ['wh-payee-addr', 'payee_address'],
     ['wh-payee-code2', 'payee_code']]
      .forEach(([id, k]) => { const el = cnt.querySelector('#' + id); if (el) el.value = ed[k] || ''; });
  }
  cnt.querySelector('#wh-add').onclick = () => {
    ed.lines.push({ pay_date: ed.pay_date || '',
      /* V.206 — แถวใหม่ = งานใหม่ -> อัตราตามประเภทเริ่มต้น (SERVICE = 3) */
      income_type: 'SERVICE', description: '', tax_base: 0,
      rate: FIXED_RATE.SERVICE, amount: 0,
      wht_income_category: defaultCat('SERVICE') });
    drawLines();
  };

  tb.addEventListener('input', (e) => {
    const i = Number(e.target.dataset.i);
    if (!Number.isInteger(i) || !ed.lines[i]) return;
    const k = e.target.dataset.k;
    /* ── อัตรา % เป็น "ตัวช่วย" เท่านั้น ────────────────────────────────────
       แก้ฐานภาษีหรืออัตรา -> เสนอค่าภาษีให้ในช่องภาษี (เขียนทับช่องนั้น)
       แต่ถ้าผู้ใช้ไปแก้ช่อง "ภาษีที่หัก" เอง -> ค่านั้นคือค่าจริง
       ระบบจะไม่คำนวณทับอีก จนกว่าจะแก้ฐาน/อัตราใหม่
       SQL ก็เก็บตามที่ส่งมา (RUN-09 · เฉพาะ ACTING_AGENT) */
    if (k === 'tax_base' || k === 'rate') {
      ed.lines[i][k] = num(e.target.value);
      /* ── V.217 ── แก้ "ฐานภาษี/อัตรา" = ขอให้ระบบเสนอค่าใหม่ -> ล้างสถานะกรอกเอง
         (เจตนาเดิมของ V.206: อัตราเป็นตัวช่วย · แก้ฐาน/อัตราแล้วเสนอค่าให้ใหม่) */
      ed.lines[i].amount_manual = false;
      ed.lines[i].amount = round2(num(ed.lines[i].tax_base) * num(ed.lines[i].rate) / 100);
      const box = tb.querySelector(`[data-i="${i}"][data-k="amount"]`);
      if (box) box.value = ed.lines[i].amount;
      refreshTotals();
    } else if (k === 'amount') {
      /* ผู้ใช้กรอกเอง -> เก็บเป๊ะ ไม่ปัดเป็นค่าที่คำนวณได้
         ── V.217 ── ทำเครื่องหมายไว้ ห้ามให้ applyFixedRate() เขียนทับ (ข้อ B4) */
      ed.lines[i].amount = num(e.target.value);
      ed.lines[i].amount_manual = true;
      refreshTotals();
    } else if (k === 'description') ed.lines[i].description = e.target.value;
  });
  tb.addEventListener('change', (e) => {
    const i = Number(e.target.dataset.i);
    if (!Number.isInteger(i) || !ed.lines[i]) return;
    const k = e.target.dataset.k;
    /* wht_income_category = หมวด 50 ทวิ *** เก็บตามที่ผู้ใช้เลือกเท่านั้น ***
       เปลี่ยน income_type แล้วหมวดไม่ถูกเขียนทับ (ระบบไม่เดาให้) */
    if (k === 'pay_date' || k === 'income_type' || k === 'wht_income_category')
      ed.lines[i][k] = e.target.value;
    /* ── V.206 ── เปลี่ยนประเภทเงินได้ -> ตั้งอัตรา % ตาม CODE ทันที (แถวนี้แถวเดียว) */
    if (k === 'income_type') applyFixedRate(i);
  });
  tb.addEventListener('click', (e) => {
    const b = e.target.closest('[data-del-line]');
    if (!b) return;
    if (ed.lines.length <= 1) { toast('ต้องมีรายการอย่างน้อย 1 รายการ', 'err'); return; }
    ed.lines.splice(Number(b.dataset.delLine), 1); drawLines();
  });

  cnt.querySelector('#wh-save').onclick = (e) => doSave(cnt, e.target);
  cnt.querySelector('#wh-prev').onclick = doPrint;
  /* ── V.207 ── handler ของ #wh-post ถูกถอดออกพร้อมกับปุ่ม ─────────────────
     FLOW ใหม่ไม่ผ่าน POST อีกแล้ว: กรอกครบ -> 💾 บันทึก -> ได้เลข -> Preview
     Validate ชุดเดิม (whtPostMissing) *** ไม่ได้ถูกทิ้ง *** ย้ายไปเรียกใน
     doSave() ก่อนออกเลขครั้งแรก และ SQL บังคับซ้ำอีกชั้นใน njacc_save_wht_draft
     ปุ่ม ⬆ POST / ↩ UNPOST ที่หน้ารายการยังใช้ postWht()/unpostWht() ตามเดิม
     -> import postWht ยังจำเป็น ไม่ได้ถูกถอดออกจากหัวไฟล์

  /* ── ↩ UNPOST — ISSUED -> DRAFT ────────────────────────────────────────
     กดได้เฉพาะเอกสารที่ POST แล้ว (ปุ่ม disabled ในกรณีอื่น · SQL บล็อกอีกชั้น
     ด้วย NJACC_WHT_NOT_ISSUED) · ต้องระบุเหตุผลเสมอ (SQL: NJACC_WHT_REASON_REQUIRED)
     สิทธิ์ can('void') / ADMIN — ใช้ของเดิม ไม่มี Role ใหม่
     *** เลขเดิมถูกเก็บไว้ *** POST ใหม่จะได้เลขเดียวกัน (njacc_post_wht reuse) */
  /* 🗑 ลบร่าง — เส้นทางเดียวกับหน้ารายการ (reasonModal -> deleteWhtDraft)
     ไม่มี RPC ใหม่ · ไม่มีเงื่อนไขใหม่ · ลบแล้วกลับหน้ารายการ */
  const db2 = cnt.querySelector('#wh-del');
  if (db2) db2.onclick = async () => {
    if (!ed.whtId) return;
    /* ── V.221 ── ข้อความเดียวกับหน้ารายการ · Backend Guard เดิมไม่เปลี่ยน */
    const reason = await reasonModal('ลบหนังสือรับรองหัก ณ ที่จ่าย (ลบได้เฉพาะใบที่ยังไม่ออกจริง)');
    if (!reason) return;
    try {
      await once('del-wht-' + ed.whtId, () => deleteWhtDraft(ed.whtId, reason));
      toast('ลบแล้ว', 'ok');
      renderList(cnt);
    } catch (ex) { toast(whtErrMessage(ex), 'err'); }
  };

  const ub = cnt.querySelector('#wh-unpost');
  if (ub) ub.onclick = async () => {
    if (!ed.whtId) return;
    const reason = await reasonModal('UNPOST หนังสือรับรอง — กลับเป็นร่างเพื่อแก้ไข ' +
      '(เลขเดิมถูกเก็บไว้ · POST อีกครั้งจะใช้เลขเดิม)');
    if (!reason) return;
    try {
      const r = await once('unpost-wht-' + ed.whtId, () => unpostWht(ed.whtId, reason));
      toast('UNPOST แล้ว — กลับเป็นร่าง เลขเดิม ' + ((r && r.document_no) || ''), 'ok');
      openEditor(cnt, { whtId: ed.whtId });   /* โหลดใหม่ให้ฟอร์มปลดล็อก */
    } catch (ex) { toast(whtErrMessage(ex), 'err'); }
  };

  /* POST แล้ว = ล็อกทุกช่องกรอก (ยังกด Preview / Print / UNPOST ได้)
     ล็อกที่ระดับ DOM ทั้งหน้า -> ครอบทุกช่องรวมตารางรายการ ไม่ต้องไล่ทีละ id */
  if (locked) {
    /* Layout เปลี่ยนเป็น Card เดียว -> ล็อกที่ .whp-form ทีเดียวครอบทุก Section
       (เดิมไล่ .whp-top/.whp-sec ซึ่งไม่มีแล้ว)
       เว้นปุ่ม Footer ไว้: Preview / UNPOST / กลับรายการ ยังกดได้ตอน POST แล้ว */
    cnt.querySelectorAll('.whp-form input, .whp-form select, .whp-form textarea')
      .forEach(el => { el.disabled = true; });
    ['wh-add', 'wh-frominv'].forEach(id => {
      const b = cnt.querySelector('#' + id); if (b) b.disabled = true;
    });
    cnt.querySelectorAll('#wh-ltb button').forEach(b => { b.disabled = true; });
  }

  drawLines();

  /* ── Enter/Tab กรอกต่อเนื่อง ────────────────────────────────────────────
     ใช้ enableEnterNav() ตัวกลางเดียวกับฟอร์มเปิดงาน/ออกวางบิล (ไม่เขียนใหม่)
     Enter -> ช่องถัดไปตามลำดับ DOM (เรียงตาม Section 1->8 อยู่แล้ว)
     ข้ามช่องที่ disabled / readOnly / ซ่อนอยู่ (เช่นช่อง "อื่น ๆ" ที่ยังไม่เปิด)
     ช่องสุดท้ายกด Enter -> อยู่ที่เดิม · ไม่ submit · ไม่บันทึกโดยไม่ตั้งใจ
     Tab เป็นพฤติกรรมมาตรฐานของเบราว์เซอร์อยู่แล้ว ไม่ต้องเพิ่ม tabindex
     เรียกหลัง render ครบ -> ครอบทุกช่องรวมทั้งตารางรายการเงินได้ */
  enableEnterNav(cnt);

  function drawLines() {
    tb.innerHTML = ed.lines.map((l, i) => {
      return `<tr class="whp-ln">
        ${/* *** data-i / data-k เดิมทุกตัว *** -> event handler เดิม (input/change/click)
             ทำงานเหมือนเดิมทั้งหมด ไม่ได้แก้ handler แม้บรรทัดเดียว */ ''}
        <td class="center t-3">${i + 1}</td>
        <td><select class="sel w100" data-i="${i}" data-k="wht_income_category"
              title="หมวดที่จะพิมพ์ลงแบบ 50 ทวิ">${catOpts(l.wht_income_category || '')}</select></td>
        <td><input class="inp w100" type="date" data-i="${i}" data-k="pay_date"
              value="${esc(l.pay_date || '')}"></td>
        <td><input class="inp w100 r" type="number" step="0.01" min="0" data-i="${i}" data-k="tax_base"
              value="${l.tax_base}"></td>
        <td><input class="inp w100 r" type="number" step="0.01" min="0" data-i="${i}" data-k="amount"
              value="${l.amount}" title="แก้ไขได้ — ระบบจะไม่คำนวณทับ"></td>
        <td class="center"><button class="btn btn-danger btn-sm" data-del-line="${i}"
              title="ลบรายการ">🗑</button></td>
      </tr>
      <tr class="whp-ln2">
        <td></td>
        <td colspan="5"><div class="whp-ln2-g">
          <label>ประเภทเงินได้ (ระบบ)
            <select class="sel" data-i="${i}" data-k="income_type">${incomeOpts(l.income_type)}</select></label>
          <label>อัตรา %
            <input class="inp r" type="number" step="0.01" min="0" max="100"
              data-i="${i}" data-k="rate" value="${l.rate}"${isRateLocked(l)
                ? ' readonly title="อัตราคงที่ตามประเภทเงินได้ — เลือก \'อื่น ๆ\' เพื่อกรอกเอง"'
                : ' title="กรอกอัตราเอง"'}></label>
          <label>รายละเอียด
            <input class="inp" data-i="${i}" data-k="description"
              value="${esc(l.description || '')}" placeholder="ถ้ามี"></label>
        </div></td>
      </tr>`;
    }).join('');
    refreshTotals();
  }

  /* ── V.206 ── ตั้งอัตรา % ตามประเภทเงินได้ของ "แถวที่ i เท่านั้น"
     ใช้สูตรคำนวณภาษีตัวเดิม (tax_base × rate ÷ 100) ไม่สร้างสูตรใหม่ซ้อน
     OTHER -> ล้างอัตราเป็น 0 กัน % ของประเภทก่อนหน้าค้าง แล้วเปิดให้กรอกเอง */
  function applyFixedRate(i) {
    const l = ed.lines[i]; if (!l) return;
    const fx = fixedRateOf(l.income_type);
    l.rate = (fx === undefined) ? 0 : fx;
    /* ── V.217 ── เปลี่ยน "ประเภทเงินได้" -> ตั้งอัตรา % ให้ตามเดิม
       *** แต่ห้ามเขียนทับ "จำนวนเงินภาษี" ที่ผู้ใช้กรอกเอง *** (ข้อ B4/B5)
       l.amount_manual = true เมื่อผู้ใช้พิมพ์ในช่องภาษีเอง (ตั้งที่ handler input)
       -> ค่าที่พิมพ์เองคือค่าจริง ระบบไม่คำนวณทับ · ค่าที่ระบบเสนอไว้ยังคำนวณต่อได้ */
    if (!l.amount_manual) l.amount = round2(num(l.tax_base) * num(l.rate) / 100);
    const rin = tb.querySelector(`[data-i="${i}"][data-k="rate"]`);
    if (rin) {
      rin.value = l.rate;
      if (isRateLocked(l)) {
        rin.setAttribute('readonly', '');
        rin.title = 'อัตราคงที่ตามประเภทเงินได้ — เลือก \'อื่น ๆ\' เพื่อกรอกเอง';
      } else { rin.removeAttribute('readonly'); rin.title = 'กรอกอัตราเอง'; }
    }
    const ain = tb.querySelector(`[data-i="${i}"][data-k="amount"]`);
    if (ain) ain.value = l.amount;
    refreshTotals();
  }

  function refreshTotals() {
    let base = 0, tax = 0;
    for (const l of ed.lines) {
      base = round2(base + num(l.tax_base));
      /* *** รวมจากค่าภาษีจริงของแต่ละบรรทัด *** ไม่คำนวณใหม่จาก base×rate
         ไม่งั้นยอดรวมบนจอจะไม่ตรงกับที่บันทึกลง DB เมื่อผู้ใช้แก้ภาษีเอง */
      tax = round2(tax + num(l.amount));
    }
    /* ── V.191 ── ช่องรวมยอดเป็น input readonly แล้ว -> เขียนที่ .value
       *** ตัวเลขมาจากการคำนวณเดิมทุกบรรทัด *** (base/tax ด้านบน) ไม่ได้คำนวณใหม่
       ตัวอักษรใช้ bahtText() ตัวกลางเดียวกับที่เอกสาร A4 ใช้ */
    const setv = (id, v) => {
      const el = cnt.querySelector('#' + id);
      if (!el) return;
      if ('value' in el) el.value = v; else el.textContent = v;
    };
    setv('wh-t-base', money(base));
    setv('wh-t-tax', money(tax));
    setv('wh-t-words', tax > 0 ? bahtText(tax) : '');
  }
}

/* บันทึกร่าง — ส่งเฉพาะข้อมูลดิบ ภาษีและยอดรวมคำนวณที่ SQL ทั้งหมด */
const T = (v) => (v || '').trim() || null;   /* ข้อความว่าง -> null (ไม่เก็บสตริงว่าง) */

/* ── เลขประจำตัวผู้เสียภาษี 13 หลัก ────────────────────────────────────────
   ตรวจ core/validator.js แล้ว *** ไม่มี validator เลขผู้เสียภาษีเดิมในระบบ ***
   (มีแค่ required / isPositive / nonNegative / isDate / markInvalid / clearInvalid)
   จึงสร้างที่นี่ และ reuse markInvalid/clearInvalid ตัวกลางสำหรับไฮไลต์
   กติกาขั้นต่ำ: ตัดช่องว่างและขีด แล้วต้องเหลือตัวเลข 13 หลักพอดี */
export const isValidTaxId13 = (v) =>
  /^[0-9]{13}$/.test(String(v == null ? '' : v).replace(/[\s-]/g, ''));

/* ── V.220 ── สาขาต้องเป็นตัวเลข 5 หลักพอดี (สำนักงานใหญ่ = 00000)
   *** ตัวเดียวใช้ร่วมกันทั้ง Payer / Payee / กระทำการแทนโดย / ฟอร์ม Master ***
   ค่าว่าง = ไม่บังคับ (ตรวจที่ผู้เรียกว่าจะบังคับหรือไม่) */
export const isValidBranch5 = (v) =>
  /^[0-9]{5}$/.test(String(v == null ? '' : v).trim());
export const BRANCH5_MSG = 'กรุณาระบุสาขาเป็นตัวเลข 5 หลัก เช่น 00000';

/* ── รายการที่ต้องมีก่อน POST — คืนข้อความช่องแรกที่ขาด · ครบแล้วคืน null ──
   ── V.207 ── ย้ายมาเรียกจาก doSave() ก่อนออก Reference No. ครั้งแรก
   (ใบที่มีเลขแล้วไม่ต้องผ่านด่านนี้ -> แก้แล้วบันทึกซ้ำได้ตามเดิม)
   ตรวจ "ค่าที่จะพิมพ์ลงกระดาษ" (snapshot) ไม่ใช่แค่ id ที่เลือกไว้
   -> กรอกเองโดยไม่เลือกจาก Master ก็ผ่านได้ ถ้าข้อมูลครบจริง */
export function whtPostMissing(d) {
  if (!d) return 'ไม่พบข้อมูลเอกสาร';
  const lines = d.lines || [];
  /* ── 12 กลุ่มตามลำดับที่ผู้ใช้กรอกบนหน้าจอ — เจอกลุ่มแรกที่ขาดแล้วหยุด ──
     *** ใช้ตอนบันทึกครั้งแรกของเอกสาร (ก่อนออกเลข) ***
     ตรวจ "ค่าที่จะพิมพ์ลงกระดาษ" (snapshot) ไม่ใช่แค่ id ที่เลือกไว้
     -> กรอกเองโดยไม่เลือกจาก Master ก็ผ่านได้ถ้าข้อมูลครบจริง */
  /* ── V.207 ── เดิมข้อ 1 คือ  if (!T(d.reference_no)) return 'Reference No.';
     *** ถอดออกโดยตั้งใจ *** Reference No. ไม่ใช่ช่องที่ผู้ใช้กรอกอีกต่อไป
     เลขถูกออกโดย njacc_post_wht "หลัง" POST ผ่านแล้ว -> ถ้ายังบังคับตรวจก่อน POST
     เอกสารใหม่ทุกใบจะ POST ไม่ได้เลย (ร่างต้องว่างตามข้อ 2)
     ลำดับข้อ 2-12 ที่เหลือคงเดิมทุกข้อ ไม่ได้ปรับเลขใหม่ */
  /* 2 */ if (!T(d.certificate_no)) return 'เลขที่หนังสือรับรอง';
  /* 3 */ if (!d.document_date) return 'วันที่ออกเอกสาร';
  /* 4 */ if (!d.pay_date) return 'วันที่จ่าย';
  /* 5 */ if (!T(d.payer_name)) return 'ชื่อผู้มีหน้าที่หักภาษี';
  /* 6 */ if (!T(d.payer_tax_id)) return 'เลขประจำตัวผู้เสียภาษีของผู้มีหน้าที่หักภาษี';
          if (!isValidTaxId13(d.payer_tax_id))
            return 'เลขประจำตัวผู้เสียภาษีของผู้มีหน้าที่หักภาษี (ต้องเป็นตัวเลข 13 หลัก)';
          /* ── V.220 ── สาขา: ไม่บังคับกรอก แต่ถ้ากรอกต้องเป็นตัวเลข 5 หลักพอดี */
          if (T(d.payer_branch) && !isValidBranch5(d.payer_branch))
            return 'สาขาของผู้มีหน้าที่หักภาษี — ' + BRANCH5_MSG;
  /* 7 */ if (!T(d.payee_name)) return 'ชื่อผู้ถูกหักภาษี';
  /* 8 */ if (!T(d.payee_tax_id)) return 'เลขประจำตัวผู้เสียภาษีของผู้ถูกหักภาษี';
          if (!isValidTaxId13(d.payee_tax_id))
            return 'เลขประจำตัวผู้เสียภาษีของผู้ถูกหักภาษี (ต้องเป็นตัวเลข 13 หลัก)';
          /* ── V.203 ── เลขบัตรประชาชน: ไม่บังคับ แต่ถ้ากรอกต้องครบ 13 หลัก
             *** ตรวจแยกจาก *_tax_id *** ไม่มีการใช้แทนกัน */
          if (T(d.payer_citizen_id) && !isValidTaxId13(d.payer_citizen_id))
            return 'เลขประจำตัวบัตรประชาชนของผู้มีหน้าที่หักภาษี (ต้องเป็นตัวเลข 13 หลัก)';
          if (T(d.payee_citizen_id) && !isValidTaxId13(d.payee_citizen_id))
            return 'เลขประจำตัวบัตรประชาชนของผู้ถูกหักภาษี (ต้องเป็นตัวเลข 13 หลัก)';
          if (T(d.payee_branch) && !isValidBranch5(d.payee_branch))
            return 'สาขาของผู้ถูกหักภาษี — ' + BRANCH5_MSG;
          /* กระทำการแทนโดย — ไม่บังคับ แต่ถ้าติ๊กไว้และกรอกเลขมาต้องถูกรูปแบบ
             ── V.196 ── ไม่ติ๊ก = ค่าที่ค้างใน State จะไม่ถูกบันทึก จึงไม่ต้องตรวจ */
          if (d.has_agent && T(d.agent_tax_id) && !isValidTaxId13(d.agent_tax_id))
            return 'เลขประจำตัวผู้เสียภาษีของผู้กระทำการแทน (ต้องเป็นตัวเลข 13 หลัก)';
  /* 9 */ if (!lines.length) return 'รายการเงินได้อย่างน้อย 1 รายการ';
          if (lines.some(l => !String(l.income_type || '').trim())) return 'ประเภทเงินได้';
          /* หมวด 50 ทวิ ต้องเลือกทุกรายการก่อน POST — เพราะต้องพิมพ์ลงแบบราชการ */
          if (lines.some(l => !String(l.wht_income_category || '').trim()))
            return 'หมวด 50 ทวิ (เลือกให้ครบทุกรายการ)';
          if (lines.some(l => !l.pay_date)) return 'วันที่จ่ายเงินจริงในทุกรายการ';
          if (lines.some(l => !(Number(l.tax_base) > 0)))
            return 'จำนวนเงินที่จ่าย (ต้องมากกว่า 0 ทุกรายการ)';
  /* 10 */ if (lines.some(l => num(l.amount) > num(l.tax_base)))
            return 'จำนวนเงินภาษี (มากกว่าจำนวนเงินที่จ่าย)';
          if (!(round2(lines.reduce((a, l) => a + num(l.amount), 0)) > 0))
            return 'จำนวนเงินภาษี (ทุกรายการเป็น 0)';
  /* 11 */ if (!T(d.form_type)) return 'แบบที่นำส่ง';
  /* 12 */ if (!T(d.pay_method)) return 'วิธีการจ่ายภาษี';
          if (d.pay_method === PAY_METHOD_OTHER && !T(d.pay_method_other))
            return 'ข้อความของวิธีการจ่ายภาษี "อื่น ๆ"';
  return null;
}


async function doSave(cnt, btn) {
  if (!ed) return;
  /* ACTING_AGENT: ผู้หักภาษีกรอกเองในฟอร์ม ไม่ต้องมีลูกค้าในระบบ (SQL ก็ไม่บังคับ)
     RECEIVED: คงเงื่อนไขเดิมทุกประการ */
  if (ed.direction !== WHT_DIR_AGENT && !ed.customer_id) {
    toast('เลือกผู้หักภาษี / ลูกค้าผู้จ่ายเงินก่อน', 'err'); return; }
  if (!ed.lines.length) { toast('ต้องมีรายการอย่างน้อย 1 รายการ', 'err'); return; }
  /* ── V.203 ── เลขบัตรประชาชนกรอกแล้วต้องครบ 13 หลักตั้งแต่ตอนบันทึกร่าง */
  for (const [k, who] of [['payer_citizen_id', 'ผู้มีหน้าที่หักภาษี'],
                          ['payee_citizen_id', 'ผู้ถูกหักภาษี']]) {
    const v = (ed[k] || '').trim();
    if (v && !isValidTaxId13(v)) {
      toast('เลขประจำตัวบัตรประชาชนของ' + who + ' ต้องเป็นตัวเลข 13 หลัก', 'err'); return; }
  }
  for (const l of ed.lines) {
    if (!(l.tax_base > 0)) { toast('จำนวนเงินที่จ่ายต้องมากกว่า 0 ทุกรายการ', 'err'); return; }
    if (l.rate < 0 || l.rate > 100) { toast('อัตราภาษีต้องอยู่ระหว่าง 0–100', 'err'); return; }
    if (num(l.amount) < 0) { toast('จำนวนเงินภาษีต้องไม่ติดลบ', 'err'); return; }
    if (num(l.amount) > num(l.tax_base)) {
      toast('จำนวนเงินภาษีต้องไม่มากกว่าจำนวนเงินที่จ่าย', 'err'); return; }
  }

  /* ══ V.207 · Validate ครบ "ก่อนออกเลขครั้งแรก" เท่านั้น ═══════════════════
     FLOW ใหม่ = บันทึกแล้วได้เลขจริงทันที ถ้ายอมให้บันทึกทั้งที่ข้อมูลไม่ครบ
     เลข WHT{YYYYMM}-##### จะถูกกินไปโดยเปล่าประโยชน์ และนำกลับมาใช้ไม่ได้อีก
     (ข้อ 8) -> จึงตรวจชุดเดียวกับที่เดิมใช้ตอน POST (whtPostMissing ไม่ได้ถูกทิ้ง)
     *** ใบที่มีเลขแล้ว ไม่ต้องผ่านด่านนี้ *** เปิดมาแก้แล้วบันทึกซ้ำได้ตามเดิม
     (ข้อ 5 Save ครั้งต่อไป) · SQL บังคับซ้ำอีกชั้นใน njacc_save_wht_draft §B */
  if (!(ed.reference_no || '').trim()) {
    const miss = whtPostMissing(ed);
    if (miss) {
      toast('ยังกรอกไม่ครบ — ' + miss + ' (ต้องครบก่อนระบบจะออกเลขให้)', 'err');
      return;
    }
  }

  const payload = {
    wht_id: ed.whtId || null,
    /* ทิศทาง — SQL ใช้ตัดสินว่าจะเคารพค่าภาษีที่กรอกเองหรือคำนวณให้ (RUN-09) */
    direction: ed.direction || WHT_DIR_AGENT,
    customer_id: ed.customer_id,
    certificate_no: (ed.certificate_no || '').trim() || null,
    invoice_id: ed.invoice_id || null,
    document_date: ed.document_date || null,
    pay_date: ed.pay_date || null,
    wht_type: ed.lines[0].income_type,
    reference_no: (ed.reference_no || '').trim() || null,
    note: (ed.note || '').trim() || null,
    /* ── ฟิลด์ชุดใหม่ (RUN-08) — ส่งขึ้นทุกครั้งเพื่อให้แก้ไขแล้วลบค่าได้จริง
       SQL ใช้ nullif(btrim(...),'') -> ค่าว่างถูกเก็บเป็น NULL ไม่ใช่สตริงว่าง */
    book_no: T(ed.book_no),
    ref_date: ed.ref_date || null,
    job_no: T(ed.job_no),
    invoice_no_text: T(ed.invoice_no_text),
    payee_code: T(ed.payee_code),
    payment_by: T(ed.payment_by),
    /* เงินกองทุน 3 ช่อง — ค่าว่าง = null (ไม่บังคับกรอก)
       ── V.198 ── ไม่ติ๊ก = เอกสารนี้ไม่ได้เลือกเงินกองทุน -> ส่ง null ทั้ง 3 ช่อง
       (SQL ล้างซ้ำอีกชั้นด้วย CASE WHEN v_has_fund) */
    has_fund: !!ed.has_fund,
    gpf_amount: ed.has_fund ? T(ed.gpf_amount) : null,
    social_security_amount: ed.has_fund ? T(ed.social_security_amount) : null,
    provident_fund_amount: ed.has_fund ? T(ed.provident_fund_amount) : null,
    /* ── V.204 ── CODE ที่อ้างตอนออกเอกสาร (Snapshot · ไม่ผูก FK กับ Master) */
    payer_code: T(ed.payer_code),
    /* ── V.203 ── ส่งแยกจาก *_tax_id เสมอ ห้ามใช้แทนกัน */
    payer_citizen_id: T(ed.payer_citizen_id),
    payee_citizen_id: T(ed.payee_citizen_id),
    payer_name: T(ed.payer_name),
    payer_tax_id: T(ed.payer_tax_id),
    payer_branch: T(ed.payer_branch),
    payer_address: T(ed.payer_address),
    /* ── V.196 ── ไม่ติ๊ก = เอกสารนี้ไม่มีกระทำการแทน
       ส่ง null ทั้ง 4 ช่อง (SQL ล้างซ้ำอีกชั้นด้วย CASE WHEN v_has_agent) */
    has_acting_agent: !!ed.has_agent,
    agent_name: ed.has_agent ? T(ed.agent_name) : null,
    agent_tax_id: ed.has_agent ? T(ed.agent_tax_id) : null,
    agent_branch: ed.has_agent ? T(ed.agent_branch) : null,
    agent_address: ed.has_agent ? T(ed.agent_address) : null,
    payee_customer_id: ed.payee_customer_id || null,
    payee_name: T(ed.payee_name),
    payee_tax_id: T(ed.payee_tax_id),
    payee_branch: T(ed.payee_branch),
    payee_address: T(ed.payee_address),
    form_type: T(ed.form_type),
    form_seq: T(ed.form_seq),
    pay_method: T(ed.pay_method),
    /* เก็บข้อความ "อื่น ๆ" เฉพาะตอนเลือก OTHER จริง -> ไม่มีข้อมูลค้างผิดบริบท */
    pay_method_other: ed.pay_method === PAY_METHOD_OTHER ? T(ed.pay_method_other) : null,
    signer_name: T(ed.signer_name),
    signer_position: T(ed.signer_position),
    items: ed.lines.map(l => ({
      pay_date: l.pay_date || null,
      income_type: l.income_type,
      description: (l.description || '').trim() || null,
      tax_base: round2(l.tax_base),
      rate: round2(l.rate),
      /* หมวด 50 ทวิ — ส่ง null ได้ (บังคับครบตอนบันทึกครั้งแรกที่จะออกเลข) */
      wht_income_category: T(l.wht_income_category),
      /* *** ส่งค่าภาษีที่ผู้ใช้กรอกขึ้นไปเสมอ ***
         SQL (ACTING_AGENT) เก็บตามนี้เป๊ะ · RECEIVED จะคำนวณทับเองตามเดิม */
      amount: round2(num(l.amount)),
    })),
  };
  if (btn) btn.disabled = true;
  try {
    const r = await once('save-wht', () => saveWhtDraft(payload));
    if (r && r.id) {
      ed.whtId = r.id;
      /* ── V.197 ── บันทึกแล้ว = ไม่มีข้อมูลค้างที่ยังไม่บันทึกอีก */
      if (typeof ed.__resetDirty === 'function') ed.__resetDirty();
      const pv = cnt.querySelector('#wh-prev'); if (pv) pv.disabled = false;
      /* ── V.207 ── เขียนเลข/วันที่ที่ SQL ออกให้ กลับเข้า State + ช่องบนจอทันที
         *** ไม่ต้อง Reload Browser *** (ข้อ 17)
         ค่ามาจาก njacc_save_wht_draft เท่านั้น — หน้าจอไม่เคยคิดเลขเอง
         RPC เก่าที่ยังไม่คืน 2 คีย์นี้ -> ข้ามไป ไม่ล้างค่าที่มีอยู่ ไม่พัง */
      if (r.reference_no != null) {
        ed.reference_no = r.reference_no;
        const el = cnt.querySelector('#wh-ref'); if (el) el.value = r.reference_no;
      }
      if (r.ref_date != null) {
        ed.ref_date = String(r.ref_date).slice(0, 10);
        const el = cnt.querySelector('#wh-refdate'); if (el) el.value = ed.ref_date;
      }
      /* เพิ่งได้เลขครั้งแรก -> กางกล่อง "ข้อมูลอ้างอิงภายใน" ให้เห็นเลขที่ได้ */
      if (r.reference_no_issued) {
        /* ── V.212 ── เดิมสั่ง rb.open = true (Accordion) ซึ่งใช้ไม่ได้กับ <div>
           เปลี่ยนเป็นติ๊ก Checkbox + กางกล่อง ให้ผู้ใช้เห็นเลขที่เพิ่งได้ทันที */
        ed.has_ref = true;
        const rc = cnt.querySelector('#wh-refbox-chk'); if (rc) rc.checked = true;
        const rb = cnt.querySelector('#wh-refbox'); if (rb) rb.hidden = false;
      }
      toast('บันทึกแล้ว — ภาษีหักรวม ' + money(r.amount)
        + (r.reference_no ? ' · Reference No. ' + r.reference_no : ''), 'ok');
      /* ── V.215 ── Save สำเร็จ -> ปิดฟอร์ม + กลับหน้ารายการ + Refresh (ข้อ 4/15)
         renderList() ยิง njacc_list_wht ใหม่ -> เห็น Reference No. ทันที
         *** อยู่ในสาขา r && r.id เท่านั้น *** -> Save FAIL จะไม่มาถึงบรรทัดนี้
         (Error โยนออกไปที่ catch ด้านล่าง ฟอร์มยังเปิดอยู่ ข้อ 15) */
      renderList(cnt);
    }
  } catch (ex) { toast(whtErrMessage(ex), 'err'); }
  finally { if (btn) btn.disabled = false; }
}
