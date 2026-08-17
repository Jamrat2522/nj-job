/* Supabase client เดียวทั้งแอป */
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
let _sb = null;
export function sb() {
  if (!_sb) {
    if (!window.supabase) throw new Error('Supabase SDK ยังไม่โหลด');
    _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }
  return _sb;
}
export async function rpc(name, args = {}) {
  const { data, error } = await sb().rpc(name, args);
  if (error) throw normalizeErr(error);
  return data;
}
function normalizeErr(error) {
  const m = String(error.message || '');
  const map = {
    NJACC_NO_PROFILE: 'ไม่พบโปรไฟล์ผู้ใช้ หรือถูกปิดการใช้งาน',
    NJACC_FORBIDDEN: 'คุณไม่มีสิทธิ์ทำรายการนี้',
    NJACC_LOGIN_NOT_FOUND: 'ไม่พบชื่อผู้ใช้นี้',
    NJACC_JOB_NOT_FOUND: 'ไม่พบข้อมูลงาน',
    NJACC_JOB_ALREADY_INVOICED: 'งานนี้ออก INVOICE แล้ว',
    NJACC_JOB_NO_CUSTOMER: 'งานนี้ยังไม่ได้ระบุลูกค้า',
    NJACC_JOB_HAS_INVOICE: 'ยกเลิกไม่ได้ — งานนี้มี INVOICE แล้ว ต้อง Void INVOICE ก่อน',
    NJACC_INVOICE_HAS_PAYMENT: 'Void ไม่ได้ — INVOICE นี้มีการรับชำระแล้ว ต้อง Void ใบเสร็จก่อน',
    NJACC_ALLOC_EXCEEDS_OUTSTANDING: 'ยอดตัดชำระเกินยอดคงค้างของ INVOICE',
    NJACC_ALLOCATION_SUM_MISMATCH: 'ยอดรับรวมไม่เท่ากับยอดตัดชำระรวม',
    NJACC_REASON_REQUIRED: 'ต้องระบุเหตุผล',
    NJACC_NO_ITEMS: 'ต้องมีรายการอย่างน้อย 1 รายการ',
    NJACC_INVOICE_NOT_OPEN: 'INVOICE ไม่อยู่ในสถานะที่รับชำระได้',
    /* FINANCE > Receipt รับชำระเฉพาะงานบริการ · งานสำรองจ่ายมี Flow ของตัวเอง */
    NJACC_RECEIPT_SERVICE_ONLY:
      'รับชำระได้เฉพาะ INVOICE งานบริการ (SERVICE) — งานสำรองจ่าย (ADVANCE) ต้องใช้เมนู FINANCE > Advance',
    /* ปิดงาน → ส่งเข้า ACCOUNTING (migration 025) */
    NJACC_CLOSE_BAD_STATUS: 'ปิดงานไม่ได้ — งานนี้ไม่ได้อยู่ในสถานะ OPEN หรือ PROCESSING',
    NJACC_ACCOUNTING_HANDOFF_FAILED:
      'ปิดงานไม่สำเร็จ — ACCOUNTING ยังรับงานนี้ไม่ได้ ระบบยกเลิกรายการทั้งหมดแล้ว งานยังอยู่ที่ DOCUMENT กรุณาลองใหม่',
  };
  for (const k in map) if (m.includes(k)) { const e = new Error(map[k]); e.code = k; return e; }
  return error instanceof Error ? error : new Error(m || 'เกิดข้อผิดพลาด');
}
