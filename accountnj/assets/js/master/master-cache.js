import { AppState } from '../core/state.js';
import { fetchMasters } from './master-api.js';
export async function masters(force = false) {
  if (!AppState.masters || force) AppState.masters = await fetchMasters();
  return AppState.masters;
}
/* masters() คืนทุกแถวพร้อม active flag — dropdown กรองเฉพาะ active */
export function activeCustomers() {
  return (AppState.masters?.customers || []).filter(c => c.active !== false);
}
export function activeCompanies() {
  return (AppState.masters?.companies || []).filter(c => c.active !== false);
}
export function activeServiceCodes() {
  return (AppState.masters?.service_codes || []).filter(c => c.active !== false);
}
export function customerOpts(sel) {
  return '<option value="">— เลือกลูกค้า —</option>' +
    activeCustomers().map(c =>
      `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${c.name.replace(/</g, '&lt;')}</option>`).join('');
}
export function companyOpts(sel) {
  return '<option value="">— เลือกบริษัท Invoice —</option>' +
    activeCompanies().map(c =>
      `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${c.name.replace(/</g, '&lt;')}</option>`).join('');
}
