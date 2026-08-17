/* FINANCE > Credit Note — ชั้นเรียก RPC
   ─────────────────────────────────────────────────────────────────────
   RPC ทั้งหมดในไฟล์นี้มาจาก sql/dev/RUN_3_CREDIT_NOTE.sql
   *** ณ วันที่ส่งงาน RUN_3_CREDIT_NOTE.sql ยังไม่ได้รันบน Production ***
   จึงมี isBackendMissing() ไว้ให้หน้าเว็บแยกแยะได้ว่า
   "ยังไม่ได้รัน SQL" (ต้องแจ้งให้ไปรัน) กับ "error จริง" (ต้องโชว์ error)
   ไม่แก้ supabase-client.js เพื่อไม่ให้กระทบหน้าอื่นทั้งระบบ */
import { rpc } from '../core/supabase-client.js';

/* PostgREST คืน PGRST202 / 404 เมื่อไม่พบฟังก์ชันใน schema cache
   ตรวจจากข้อความจริงที่ Supabase ส่งกลับ ไม่ได้เดาจาก status code อย่างเดียว */
export function isBackendMissing(e) {
  const m = String((e && (e.message || e.hint || e.details)) || '');
  return /PGRST202/i.test(m)
    || /Could not find the function/i.test(m)
    || (/schema cache/i.test(m) && /njacc_(credit_note|save_credit|post_credit|list_credit|void_credit|delete_credit)/i.test(m));
}

/* รายการ INVOICE ที่ออกใบลดหนี้ได้ (ISSUED / POSTED เท่านั้น — server เป็นคนกรอง) */
export const cnInvoiceOptions = (p) => rpc('njacc_credit_note_invoice_options', { p });
/* ข้อมูลต้นทางของ INVOICE ที่เลือก: ลูกค้า + รายการ + ยอดที่ยังลดได้ (remaining) */
export const cnSource = (invoiceId) => rpc('njacc_credit_note_source', { p_invoice: invoiceId });
/* บันทึกร่าง — เรียกซ้ำได้ ร่างของ INVOICE เดิมจะถูกอัปเดต ไม่งอกใบใหม่ */
export const cnSaveDraft = (payload) => rpc('njacc_save_credit_note_draft', { p: payload });
/* POST — เลข CD{YYYYMM}-##### ถูกออกที่ SQL ตอนนี้เท่านั้น */
export const cnPost = (id, requestId) =>
  rpc('njacc_post_credit_note', { p_id: id, p_request_id: requestId });
export const cnView = (id) => rpc('njacc_credit_note_view', { p_id: id });
export const cnList = (p) => rpc('njacc_list_credit_notes', { p });
export const cnDeleteDraft = (id, reason) =>
  rpc('njacc_delete_credit_note_draft', { p_id: id, p_reason: reason });
export const cnVoid = (id, reason, requestId) =>
  rpc('njacc_void_credit_note', { p_id: id, p_reason: reason, p_request_id: requestId });

/* ข้อความ error เฉพาะของ Credit Note
   supabase-client.js แปลงเฉพาะรหัสเดิมของระบบ · รหัสใหม่ชุดนี้แปลที่นี่
   (ไม่แตะ map กลาง เพื่อไม่ให้กระทบหน้าอื่น) */
const CN_ERR = {
  NJACC_CN_NOT_FOUND: 'ไม่พบใบลดหนี้ใบนี้',
  NJACC_CN_NOT_DRAFT: 'ใบลดหนี้นี้ไม่ได้อยู่ในสถานะร่างแล้ว',
  NJACC_CN_NOT_POSTED: 'Void ได้เฉพาะใบลดหนี้ที่ POST แล้วเท่านั้น',
  NJACC_CN_ALREADY_POSTED: 'ใบลดหนี้นี้ POST ไปแล้ว',
  NJACC_CN_REASON_REQUIRED: 'ต้องระบุเหตุผลในการลดหนี้ก่อน',
  NJACC_CN_INVOICE_NOT_CREDITABLE: 'INVOICE ใบนี้ออกใบลดหนี้ไม่ได้ (ต้องเป็นใบที่ออกแล้วและไม่ถูกยกเลิก)',
  NJACC_CN_INVOICE_MISMATCH: 'ร่างนี้ผูกกับ INVOICE คนละใบ',
  NJACC_CN_ITEM_NOT_FOUND: 'ไม่พบรายการต้นฉบับใน INVOICE',
  NJACC_CN_ITEM_NOT_IN_INVOICE: 'มีรายการที่ไม่ได้อยู่ใน INVOICE ใบนี้',
  NJACC_CN_ITEM_DUPLICATE: 'มีรายการซ้ำกันในใบลดหนี้',
  NJACC_CN_AMOUNT_INVALID: 'ยอดลดหนี้ต้องมากกว่า 0',
  NJACC_CN_EXCEEDS_CREDITABLE: 'ลดหนี้เกินยอดที่ลดได้จริงของรายการนั้น — ระบบไม่บันทึกให้',
};
export function cnErrMessage(e) {
  const m = String((e && e.message) || '');
  for (const k in CN_ERR) if (m.includes(k)) return CN_ERR[k];
  return m || 'เกิดข้อผิดพลาด';
}
