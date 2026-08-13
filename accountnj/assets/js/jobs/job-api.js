import { rpc } from '../core/supabase-client.js';
export const saveJob = (p) => rpc('njacc_save_job', { p });
export const jobDetail = (id) => rpc('njacc_job_detail', { p_id: id });
