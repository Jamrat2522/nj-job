/* Money preview ฝั่ง UI — ตัวเลขจริงคำนวณซ้ำใน SQL (round 2 ตำแหน่งเท่ากัน) */
import { round2 } from '../core/formatter.js';
export function calcLine(item, vatRate) {
  const amt = round2(item.amount || 0);
  const vat = item.vat_applicable ? round2(amt * vatRate / 100) : 0;
  const whtRate = item.wht_applicable ? (item.wht_rate ?? 3) : 0;
  const wht = item.wht_applicable ? round2(amt * whtRate / 100) : 0;
  return { amt, vat, wht, lineTotal: round2(amt + vat) };
}
export function calcTotals(items, vatRate) {
  let sub = 0, vat = 0, wht = 0;
  for (const it of items) {
    const l = calcLine(it, vatRate);
    sub = round2(sub + l.amt); vat = round2(vat + l.vat); wht = round2(wht + l.wht);
  }
  return { sub, vat, wht, total: round2(sub + vat), net: round2(sub + vat - wht) };
}
