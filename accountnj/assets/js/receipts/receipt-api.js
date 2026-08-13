import { rpc } from '../core/supabase-client.js';
export const listReceipts = (a) => rpc('njacc_list_receipts', a);
export const voidReceipt = (id, reason, requestId) =>
  rpc('njacc_void_receipt', { p_id: id, p_reason: reason, p_request_id: requestId });
