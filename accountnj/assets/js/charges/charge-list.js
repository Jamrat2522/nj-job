/* state ต่อหน้า charge/group (ข้อมูลใครหน้ามัน) */
import { DEFAULT_PAGE_SIZE } from '../core/config.js';
const states = new Map();
export function chargeState(charge, group) {
  const k = charge + '/' + group;
  if (!states.has(k)) states.set(k, {
    filters: { q: '', status: '', customer: '', cs: '', due: '', from: '', to: '' },
    sort: 'date', dir: 'desc', page: 1, size: DEFAULT_PAGE_SIZE,
    options: null,          /* filter options จาก server (cache ต่อหน้า) */
  });
  return states.get(k);
}
