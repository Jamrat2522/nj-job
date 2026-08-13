import { rpc } from '../core/supabase-client.js';
export const openInvoices = (customerId) =>
  rpc('njacc_customer_open_invoices', { p_customer: customerId });
export const receivePayment = (args) => rpc('njacc_receive_payment', args);
