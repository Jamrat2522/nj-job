/* API หน้ารายการ — ทุกตัวส่ง charge_type + company_group เสมอ (Data Isolation ที่ server) */
import { rpc } from '../core/supabase-client.js';

export const payload = ({ charge, group, filters = {}, sort, dir, page, size, withOptions,
  exportPage, exportSize }) => ({
  charge_type: charge, company_group: group,
  q: filters.q || null, status: filters.status || null,
  customer_id: filters.customer || null, cs: filters.cs || null,
  due: filters.due || null, from: filters.from || null, to: filters.to || null,
  sort, dir, page, size, with_options: !!withOptions,
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
export const updateNote = (id, note) => rpc('njacc_update_note', { p_id: id, p_note: note });
export const deleteJob = (id, reason) => rpc('njacc_delete_job', { p_id: id, p_reason: reason });
