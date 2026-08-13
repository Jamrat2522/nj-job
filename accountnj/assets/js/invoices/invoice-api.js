import { rpc } from '../core/supabase-client.js';
export const issueInvoice = (jobId, items, requestId, invDate, dueDate) =>
  rpc('njacc_issue_invoice', { p_job: jobId, p_items: items, p_request_id: requestId,
    p_invoice_date: invDate || null, p_due_date: dueDate || null });
export const invoiceView = (id) => rpc('njacc_invoice_view', { p_id: id });
export const voidInvoice = (id, reason, requestId) =>
  rpc('njacc_void_invoice', { p_id: id, p_reason: reason, p_request_id: requestId });
