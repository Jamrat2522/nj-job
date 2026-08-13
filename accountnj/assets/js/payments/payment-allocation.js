import { round2 } from '../core/formatter.js';
/* ตัดชำระอัตโนมัติ: เรียงตาม invoice เก่าสุดก่อน จนครบยอดรับ */
export function autoAllocate(invoices, amount) {
  let left = round2(amount);
  const out = [];
  for (const inv of invoices) {
    if (left <= 0) break;
    const take = round2(Math.min(left, Number(inv.outstanding)));
    if (take > 0) { out.push({ invoice_id: inv.id, amount: take }); left = round2(left - take); }
  }
  return { allocations: out, leftover: left };
}
export function sumAlloc(allocs) {
  return round2(allocs.reduce((s, a) => s + Number(a.amount || 0), 0));
}
