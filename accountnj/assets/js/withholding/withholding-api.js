import { rpc } from '../core/supabase-client.js';
export const createWht = (p, requestId) => rpc('njacc_create_wht', { p, p_request_id: requestId });
export const listWht = (a) => rpc('njacc_list_wht', a);
export const voidWht = (id, reason, requestId) =>
  rpc('njacc_void_wht', { p_id: id, p_reason: reason, p_request_id: requestId });
