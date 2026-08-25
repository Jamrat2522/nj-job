import { rpc } from '../core/supabase-client.js';
export const saveJob = (p) => rpc('njacc_save_job', { p });
export const jobDetail = (id) => rpc('njacc_job_detail', { p_id: id });
/* ── V.232 ── DOCUMENT > SERVICE : POST = จุดเดียวที่ออก Running Number
   RPC njacc_post_job (RUN-29) · idempotent ด้วย request_id
   *** ไม่ใช้กับ ADVANCE *** (ADVANCE ออกเลขตั้งแต่ CREATE เหมือนเดิม) */
export const postJob = (id, requestId) =>
  rpc('njacc_post_job', { p_id: id, p_request_id: requestId });
/* ฟิลด์เอกสารงาน (LIFT ON/WHARF · STORAGE CHARGE · ล่วงเวลา · การ์ดหัวลาก ·
   ยกเว้น/เปิดตรวจ · FCL/LCL/FZ/FZ+FZ) — RPC แยกจาก njacc_save_job
   เพื่อไม่ไปแตะ Logic เลขงาน (ดู sql/RUN-NOW/RUN-01_ADD_JOB_DOCUMENT_FIELDS.sql) */
export const saveJobDocFields = (p) => rpc('njacc_save_job_doc_fields', { p });
