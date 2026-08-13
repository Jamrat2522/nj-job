import { AppState } from './state.js';
/* SUPER_ADMIN = ทุกสิทธิ์ · อื่น ๆ เช็คจาก access rows (charge_type/group รองรับ '*') */
export function can(perm, charge = '*', group = '*') {
  const p = AppState.profile;
  if (!p) return false;
  if (p.role === 'SUPER_ADMIN') return true;
  return (p.access || []).some(a =>
    (a.charge_type === '*' || a.charge_type === charge || charge === '*') &&
    (a.company_group === '*' || a.company_group === group || group === '*') &&
    a['can_' + perm] === true);
}
export function canDelete(charge='*',group='*'){ return can('delete',charge,group); }
export function isAdmin() {
  const p = AppState.profile;
  return !!p && (p.role === 'SUPER_ADMIN' || p.role === 'ADMIN');
}
