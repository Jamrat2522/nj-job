import { rpc } from '../core/supabase-client.js';
export const fetchMasters = () => rpc('njacc_masters');
export const upsertCustomer = (p) => rpc('njacc_upsert_customer', { p });
export const upsertCompany = (p) => rpc('njacc_upsert_company', { p });
export const upsertServiceCode = (p) => rpc('njacc_upsert_service_code', { p });
