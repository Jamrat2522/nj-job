/* REPORT > หัก ณ ที่จ่าย — ชั้นเรียก RPC
   ─────────────────────────────────────────────────────────────────────
   RPC เดิมที่มีบน Production อยู่แล้ว : njacc_list_wht · njacc_void_wht
   *** njacc_create_wht ถูกปิดแล้ว *** (REVOKE ใน 06_RUN-05) และไม่ export จากไฟล์นี้
   เพื่อกันไม่ให้มีใครนำ Legacy Path กลับมาใช้ — เหลือทางเดียว save_draft -> post
   RPC ชุด 50 ทวิ — *** ตรวจแล้วมีอยู่จริงบน Production ***
   (เดิมคอมเมนต์เขียนว่ายังไม่ได้รัน · ล้าสมัยแล้ว) :
     njacc_wht_invoice_options · njacc_save_wht_draft · njacc_post_wht ·
     njacc_wht_view · njacc_delete_wht_draft
   isWhtBackendMissing() ให้หน้าเว็บแยกได้ว่า "ยังไม่ได้รัน SQL" กับ "error จริง"
   ไม่แก้ supabase-client.js เพื่อไม่ให้กระทบหน้าอื่น */
import { rpc } from '../core/supabase-client.js';

/* ── ทิศทางเอกสาร (RUN-09) ──────────────────────────────────────────────
   ACTING_AGENT = ใบหัก ณ ที่จ่ายที่ N.J. กระทำการแทน (ผู้หัก/ผู้ถูกหักกรอกเอง)
   RECEIVED     = ของเดิม ลูกค้าออกหนังสือรับรองให้ N.J. — ห้ามแตะ
   ค่านี้ถูกบังคับซ้ำที่ CHECK ของตาราง njacc_wht_direction_ck */
export const WHT_DIR_AGENT = 'ACTING_AGENT';
export const WHT_DIR_RECEIVED = 'RECEIVED';

/* p_direction เป็นพารามิเตอร์ที่ 6 (DEFAULT NULL) -> ไม่ส่ง = ได้ทุกทิศทางเหมือนเดิม */
export const listWht = (a) => rpc('njacc_list_wht', a);
export const voidWht = (id, reason, requestId) =>
  rpc('njacc_void_wht', { p_id: id, p_reason: reason, p_request_id: requestId });

/* ── ชุด 50 ทวิ — ฟิลด์ชุดเต็มต้องรัน RUN-08_WHT50_FULL_FIELDS.sql ── */
export const whtInvoiceOptions = (p) => rpc('njacc_wht_invoice_options', { p });
export const saveWhtDraft = (p) => rpc('njacc_save_wht_draft', { p });
export const postWht = (id, requestId) => rpc('njacc_post_wht', { p_id: id, p_request_id: requestId });
export const whtView = (id) => rpc('njacc_wht_view', { p_id: id });

/* ── CODE Master ของผู้หักฯ / ผู้ถูกหักฯ (RUN-20) ────────────────────────
   *** ใช้ตาราง njacc_customers เดิม ไม่ได้สร้าง Master ใหม่ ***
   ทั้ง 2 ฝ่ายใช้ชุดเดียวกัน -> CODE เดียวกันสลับบทบาทได้
   search: { q } ค้นบางส่วนจาก CODE/ชื่อ/Tax ID · { code } ค้นตรงตัว (ไม่สนตัวพิมพ์)
   upsert: สิทธิ์ SUPER_ADMIN / ADMIN เท่ากับ njacc_upsert_customer เดิม */
export const whtPartySearch = (p) => rpc('njacc_wht_party_search', { p });
export const whtPartyUpsert = (p) => rpc('njacc_wht_party_upsert', { p });
export const deleteWhtDraft = (id, reason) =>
  rpc('njacc_delete_wht_draft', { p_id: id, p_reason: reason });

/* ── UNPOST (RUN-09) — ISSUED -> DRAFT ────────────────────────────────────
   SQL เก็บ document_no / certificate_no เดิมไว้ และล้างเฉพาะ posted_at/posted_by
   -> POST ใหม่ได้เลขเดิม (njacc_post_wht มีเงื่อนไข reuse อยู่แล้ว ไม่ต้องแก้)
   ต้องระบุเหตุผลเสมอ (NJACC_WHT_REASON_REQUIRED)
   สิทธิ์: can('void') หรือ ADMIN/SUPER_ADMIN — ใช้ของเดิม ไม่มี Role ใหม่ */
export const unpostWht = (id, reason) =>
  rpc('njacc_unpost_wht', { p_id: id, p_reason: reason });

/* ── Export (RUN-09) — ดึง "ทุกแถวตาม Filter" ไม่ใช่เฉพาะหน้าปัจจุบัน ──────
   หน้าจอแสดง 20 แถว แต่ Filter อาจมี 2,000 รายการ -> ต้องได้ครบ 2,000
   ไม่มี OFFSET/LIMIT แบบหน้าจอ · เพดาน 20,000 แถว (SQL คืน truncated=true ถ้าเกิน)
   VOID ไม่รวมโดยค่าเริ่มต้น */
/* ── RUN-10: Export แบบแบ่งหน้า ────────────────────────────────────────────
   *** ใช้ njacc_wht_export_page ไม่ใช่ njacc_wht_export เดิม ***
   ตัวเดิมมีเพดาน 20,000 แถวและ "ตัดข้อมูล" เงียบ ๆ (truncated) ซึ่งผิดข้อกำหนด
   ตัวใหม่คืน total / returned / has_more -> Frontend วนดึงจนครบแล้วเทียบยอด
   ถ้าไม่ครบ = ห้ามสร้างไฟล์ (ตรวจใน wht-export.js)
   Stable order ที่ SQL: pay_date, certificate_no, id -> ไม่มีแถวซ้ำ/หาย */
export const WHT_EXPORT_PAGE_SIZE = 1000;
export const whtExportPage = (p) => rpc('njacc_wht_export_page', {
  p_from: p.from || null, p_to: p.to || null,
  p_customer: p.customer || null,
  p_direction: p.direction || WHT_DIR_AGENT,
  p_include_void: !!p.includeVoid,
  p_offset: p.offset || 0,
  p_limit: p.size || WHT_EXPORT_PAGE_SIZE,
});

/* PostgREST คืน PGRST202 / "Could not find the function" เมื่อยังไม่มี RPC ใน schema cache */
export function isWhtBackendMissing(e) {
  const m = String((e && (e.message || e.hint || e.details)) || '');
  return /PGRST202/i.test(m)
    || /Could not find the function/i.test(m)
    || (/schema cache/i.test(m) && /njacc_(wht|save_wht|post_wht|delete_wht)/i.test(m));
}

/* ข้อความ error เฉพาะของงานนี้ — ไม่แตะ map กลางใน supabase-client.js */
const WHT_ERR = {
  NJACC_WHT_NOT_FOUND: 'ไม่พบหนังสือรับรองฉบับนี้',
  NJACC_WHT_NOT_DRAFT: 'เอกสารนี้ไม่ได้อยู่ในสถานะร่างแล้ว',
  /* ── V.223 ── ข้อความของ Flow ยกเลิก (RUN-27) */
  NJACC_WHT_ALREADY_VOID: 'เอกสารนี้ถูกยกเลิกไปแล้ว',
  NJACC_REASON_REQUIRED: 'กรุณาระบุเหตุผลที่ยกเลิก',
  NJACC_WHT_ALREADY_ISSUED: 'เอกสารนี้ถูกบันทึกจริงไปแล้ว',
  NJACC_WHT_PAY_DATE_REQUIRED: 'ต้องระบุวันที่จ่ายเงินจริงก่อนยืนยันบันทึก',
  NJACC_WHT_ITEM_PAY_DATE_REQUIRED: 'ทุกรายการต้องมีวันที่จ่ายเงินจริง',
  NJACC_WHT_RATE_REQUIRED: 'ต้องระบุอัตราภาษีหัก ณ ที่จ่ายทุกรายการ',
  NJACC_WHT_CUSTOMER_REQUIRED: 'ต้องเลือกผู้หักภาษี / ลูกค้าผู้จ่ายเงินก่อน',
  NJACC_WHT_CUSTOMER_NOT_FOUND: 'ไม่พบผู้หักภาษีรายนี้',
  NJACC_WHT_INVOICE_MISMATCH: 'ใบแจ้งหนี้ที่อ้างอิงไม่ใช่ของลูกค้าผู้หักภาษีรายนี้',
  NJACC_WHT_BASE_INVALID: 'จำนวนเงินที่จ่ายต้องมากกว่า 0 ทุกรายการ',
  NJACC_BAD_TAX_RATE: 'อัตราภาษีต้องอยู่ระหว่าง 0–100',
  NJACC_NO_ITEMS: 'ต้องมีรายการเงินได้อย่างน้อย 1 รายการ',
  /* ── ใหม่จาก RUN-09 ── */
  NJACC_WHT_BAD_DIRECTION: 'ทิศทางเอกสารไม่ถูกต้อง',
  NJACC_WHT_AMOUNT_INVALID: 'จำนวนเงินภาษีต้องไม่ติดลบ',
  NJACC_WHT_AMOUNT_GT_BASE: 'จำนวนเงินภาษีต้องไม่มากกว่าจำนวนเงินที่จ่าย',
  NJACC_WHT_REASON_REQUIRED: 'ต้องระบุเหตุผลก่อน UNPOST',
  NJACC_WHT_NOT_ISSUED: 'เอกสารนี้ยังไม่ได้ POST — UNPOST ไม่ได้',
  NJACC_WHT_VOIDED: 'เอกสารนี้ถูก VOID แล้ว',
  NJACC_WHT_EXPORT_INCOMPLETE: 'ดึงข้อมูลไม่ครบ — ยังไม่สร้างไฟล์',
  /* ── ใหม่จาก RUN-23 ── ด่าน Validate ที่ SQL ตรวจ "ก่อนออก Reference No."
     ยิงเฉพาะตอนใบนั้นยังไม่มีเลข -> ใบที่มีเลขแล้วบันทึกซ้ำได้ตามเดิม
     หน้าจอตรวจชุดเดียวกันไปก่อนแล้ว (whtPostMissing) นี่คือตาข่ายชั้นที่ 2 */
  NJACC_WHT_CERT_NO_REQUIRED: 'ต้องระบุเลขที่หนังสือรับรองก่อนระบบจะออกเลขให้',
  NJACC_WHT_PAYER_REQUIRED: 'ต้องระบุชื่อผู้มีหน้าที่หักภาษีก่อนระบบจะออกเลขให้',
  NJACC_WHT_PAYEE_REQUIRED: 'ต้องระบุชื่อผู้ถูกหักภาษีก่อนระบบจะออกเลขให้',
  NJACC_WHT_TAXID13_INVALID: 'เลขประจำตัวผู้เสียภาษี / บัตรประชาชน ต้องเป็นตัวเลข 13 หลัก',
  NJACC_WHT_CATEGORY_REQUIRED: 'ต้องเลือกหมวด 50 ทวิ ให้ครบทุกรายการ',
  NJACC_WHT_INCOME_TYPE_REQUIRED: 'ต้องระบุประเภทเงินได้ให้ครบทุกรายการ',
  NJACC_WHT_FORM_TYPE_REQUIRED: 'ต้องเลือกแบบที่นำส่งก่อนระบบจะออกเลขให้',
  NJACC_WHT_PAY_METHOD_REQUIRED: 'ต้องเลือกวิธีการจ่ายภาษีก่อนระบบจะออกเลขให้',
  NJACC_WHT_AMOUNT_ZERO: 'จำนวนเงินภาษีรวมต้องมากกว่า 0 ก่อนระบบจะออกเลขให้',
};
export function whtErrMessage(e) {
  const m = String((e && e.message) || '');
  for (const k in WHT_ERR) if (m.includes(k)) return WHT_ERR[k];
  return m || 'เกิดข้อผิดพลาด';
}
