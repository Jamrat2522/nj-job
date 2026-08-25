/* API หน้ารายการ — ทุกตัวส่ง charge_type + company_group เสมอ (Data Isolation ที่ server) */
import { rpc } from '../core/supabase-client.js';

export const payload = ({ charge, group, filters = {}, sort, dir, page, size, withOptions,
  exportPage, exportSize, queue, scope, withKpi }) => ({
  charge_type: charge, company_group: group,
  q: filters.q || null, status: filters.status || null,
  customer_id: filters.customer || null, cs: filters.cs || null,
  due: filters.due || null, from: filters.from || null, to: filters.to || null,
  /* queue กรองที่ server เสมอ (ข้อมูลระดับแสน-ล้าน record — pagination/count ต้องถูก)
     pending_invoice = คิวรอออก Invoice · active = กำลังดำเนินการ
     receipt_active  = SERVICE ที่ POST แล้วรอรับชำระ
     advance_active  = ADVANCE ที่ POST แล้วรอจ่าย/เคลียร์
     closed          = จบครบวงจร (ใช้คู่กับ scope='all' เพื่อเห็นทั้ง 2 ประเภท) */
  queue: queue || null,
  advance_status: filters.advance_status || null,
  payment_status: filters.payment_status || null,
  scope: scope || null,          /* 'all' = ทุกงานในกลุ่มบริษัท (กรองสิทธิ์รายแถวที่ server) */
  sort, dir, page, size, with_options: !!withOptions,
  /* with_kpi = false -> ขอให้ server ข้าม aggregate ของ KPI ไปเลย (ไม่ใช่แค่ไม่แสดง)
     ค่าเริ่มต้นเป็น true เสมอ -> หน้าอื่นที่ยังใช้ KPI ไม่กระทบแม้แต่น้อย
     ถ้ายังไม่ได้รัน SQL (RUN-04) ฝั่ง server จะไม่รู้จัก key นี้และคำนวณเหมือนเดิม
     -> Frontend ยังทำงานปกติ ไม่พัง (graceful) */
  with_kpi: withKpi === false ? false : true,
  export_page: exportPage, export_size: exportSize,
});

/* bundle เดียว: rows + total + kpi (+ filter_options) — สร้าง working set ครั้งเดียวที่ server */
export const chargeBundle = (a) => rpc('njacc_charge_page_bundle', { p: payload(a) });
export const filterOptions = (charge, group) =>
  rpc('njacc_charge_filter_options', { p: { charge_type: charge, company_group: group } });

export const listCharges = (a) => rpc('njacc_list_charges', { p: payload(a) });
export const chargeKpi = (a) => rpc('njacc_charge_kpi', { p: payload(a) });
export const exportCharges = (a) => rpc('njacc_export_charges', { p: payload(a) });
export const contactList = (charge, group) =>
  rpc('njacc_contact_list', { p: { charge_type: charge, company_group: group } });

export const bulkSetField = (charge, group, keys, field, value) =>
  rpc('njacc_bulk_set_field', { p: { charge_type: charge, company_group: group, keys, field, value } });
export const bulkSetStatus = (charge, group, keys, status) =>
  rpc('njacc_bulk_set_status', { p: { charge_type: charge, company_group: group, keys, status } });
export const quickCloseLookup = (charge, group, key) =>
  rpc('njacc_quick_close_lookup', { p: { charge_type: charge, company_group: group, key } });

/* import / upload (batch ทั้งหมด — ไม่ยิงทีละ row) */
export const importResolveMasters = (charge, group, customers, companies) =>
  rpc('njacc_import_resolve_masters', { p: { charge_type: charge, company_group: group, customers, companies } });
export const importCreateMasters = (customers, companies) =>
  rpc('njacc_import_create_masters', { p: { customers, companies } });
export const importJobsBatch = (charge, group, rows) =>
  rpc('njacc_import_jobs_batch', { p: { charge_type: charge, company_group: group, rows } });
export const uploadAplBatch = (charge, group, pairs) =>
  rpc('njacc_upload_apl_batch', { p: { charge_type: charge, company_group: group, pairs } });
export const upload19Batch = (charge, group, rows) =>
  rpc('njacc_upload_19_batch', { p: { charge_type: charge, company_group: group, rows } });
export const uploadContactList = (pairs) => rpc('njacc_upload_contact_list', { p: { pairs } });

export const setJobStatus = (id, status, note) =>
  rpc('njacc_set_job_status', { p_id: id, p_status: status, p_note: note ?? null });

/* DOCUMENT "ปิดงาน" = ปิดงาน + ส่งเข้า ACCOUNTING ใน RPC/Transaction เดียว (migration 025)
   ภายในเรียก njacc_set_job_status(id,'CLOSE') ตัวเดิม แล้ว "ตรวจซ้ำ" ว่างานเข้าคิว
   pending_invoice ของ ACCOUNTING จริงก่อนจึง COMMIT
   ถ้าตรวจไม่ผ่าน → RAISE EXCEPTION → rollback ทั้งชุด งานยังอยู่ใน DOCUMENT เหมือนเดิม
   กดซ้ำได้ปลอดภัย (idempotent) — ไม่สร้าง Record ใหม่ ไม่ copy ไม่ลบของเดิม */
export const documentCloseJob = (id, note) =>
  rpc('njacc_document_close_job', { p_id: id, p_note: note ?? null });
/* JOB CONTROL > CLOSE JOB — ปิดงานปลายทาง (migration RUN-16)
   ใช้ Job เดิม ID เดิม · เขียนเฉพาะ job_closed_at/job_closed_by
   *** ไม่แตะ operational_status *** ซึ่งเป็น gate DOCUMENT -> ACCOUNTING คนละเรื่องกัน
   RPC ตรวจสถานะซ้ำด้วย njacc_job_ready_to_close ตัวเดียวกับคิว -> กดจากที่อื่นก็หลุดไม่ได้ */
export const closeJob = (id, note, requestId) =>
  rpc('njacc_close_job', { p_job: id, p_note: note ?? null, p_request_id: requestId });
/* จำนวนบน Tab [SERVICE] [ADVANCE] — นับจากเงื่อนไขคิวเดียวกัน ไม่ได้นับฝั่ง Browser */
export const closeJobCounts = (group) =>
  rpc('njacc_close_job_counts', { p: { company_group: group } });

export const updateNote = (id, note) => rpc('njacc_update_note', { p_id: id, p_note: note });
export const deleteJob = (id, reason) => rpc('njacc_delete_job', { p_id: id, p_reason: reason });

/* คิวรอรับชำระของหน้า RECEIPT — คนละอย่างกับ njacc_list_receipts (ใบเสร็จที่ออกแล้ว) */
export const receiptPending = (a) => rpc('njacc_receipt_pending', { p: a });
