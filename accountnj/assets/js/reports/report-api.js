import { rpc } from '../core/supabase-client.js';
/* njacc_report รับ jsonb เดียว: charge_type, company_group, customer_id,
   status (สถานะ INVOICE: ISSUED/VOID), payment_status, from, to, page, size */
export const fetchReport = (p) => rpc('njacc_report', { p });
