/* REPORT > หัก ณ ที่จ่าย — ชั้นเรียก RPC
   ─────────────────────────────────────────────────────────────────────
   RPC เดิมที่มีบน Production อยู่แล้ว : njacc_list_wht · njacc_void_wht
   *** njacc_create_wht ถูกปิดแล้ว *** (REVOKE ใน 06_RUN-05) และไม่ export จากไฟล์นี้
   เพื่อกันไม่ให้มีใครนำ Legacy Path กลับมาใช้ — เหลือทางเดียว save_draft -> post
   RPC ใหม่จาก sql/RUN-NOW/06_RUN-05_WHT_CERTIFICATE.sql (ยังไม่ได้รัน) :
     njacc_wht_invoice_options · njacc_save_wht_draft · njacc_post_wht ·
     njacc_wht_view · njacc_delete_wht_draft
   isWhtBackendMissing() ให้หน้าเว็บแยกได้ว่า "ยังไม่ได้รัน SQL" กับ "error จริง"
   ไม่แก้ supabase-client.js เพื่อไม่ให้กระทบหน้าอื่น */
import { rpc } from '../core/supabase-client.js';

export const listWht = (a) => rpc('njacc_list_wht', a);
export const voidWht = (id, reason, requestId) =>
  rpc('njacc_void_wht', { p_id: id, p_reason: reason, p_request_id: requestId });

/* ── ชุด 50 ทวิ (ต้องรัน 06_RUN-05 ก่อน) ── */
export const whtInvoiceOptions = (p) => rpc('njacc_wht_invoice_options', { p });
export const saveWhtDraft = (p) => rpc('njacc_save_wht_draft', { p });
export const postWht = (id, requestId) => rpc('njacc_post_wht', { p_id: id, p_request_id: requestId });
export const whtView = (id) => rpc('njacc_wht_view', { p_id: id });
export const deleteWhtDraft = (id, reason) =>
  rpc('njacc_delete_wht_draft', { p_id: id, p_reason: reason });

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
};
export function whtErrMessage(e) {
  const m = String((e && e.message) || '');
  for (const k in WHT_ERR) if (m.includes(k)) return WHT_ERR[k];
  return m || 'เกิดข้อผิดพลาด';
}
