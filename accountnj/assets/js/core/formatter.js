const NF = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/* money(null/undefined) → '-' (ไม่มีข้อมูล) · money(0) → '0.00' (ยอดศูนย์จริง) */
export const money = (n) => (n === null || n === undefined || n === '' || isNaN(n))
  ? '-' : NF.format(Number(n));
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export function dmy(s) {
  if (!s) return '-';
  const d = new Date(s + (String(s).length === 10 ? 'T00:00:00' : ''));
  if (isNaN(d)) return '-';
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}
export const ymd = (d) => {
  const x = d instanceof Date ? d : new Date(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
};
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
/* Remaining: ผูกกับสถานะการชำระ ไม่ผูกกับ Operational CLOSE
   ไม่มี INVOICE → ใช้ due ของงาน (ถ้ามี) · VOID → VOID · PAID → ชำระแล้ว
   ISSUED + UNPAID/PARTIAL → นับจาก effective due date */
export function remainingBadge(due, row = {}) {
  const invSt = row.invoice_status;
  const payStat = row.payment_status;
  if (invSt === 'VOID') return '<span class="bdg bdg-void">VOID</span>';
  if (invSt === 'ISSUED' && payStat === 'PAID') return '<span class="bdg bdg-paid">ชำระแล้ว</span>';
  if (row.operational_status === 'CANCELED') return '<span class="bdg bdg-canceled">CANCELED</span>';
  if (!due) {
    return invSt === 'ISSUED'
      ? '<span class="bdg bdg-due-ok">ไม่ระบุ Due</span>'
      : '<span class="bdg bdg-due-ok">ยังไม่ออก INV</span>';
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(due + 'T00:00:00');
  const rem = Math.round((d - today) / 86400000);
  if (rem < 0) return '<span class="bdg bdg-due-over">เกิน ' + Math.abs(rem) + ' วัน</span>';
  if (rem === 0) return '<span class="bdg bdg-due-today">ครบวันนี้</span>';
  if (rem <= 7) return '<span class="bdg bdg-due-warn">เหลือ ' + rem + ' วัน</span>';
  return '<span class="bdg bdg-due-ok">เหลือ ' + rem + ' วัน</span>';
}
export function statusBadge(s) {
  const m = { OPEN: ['bdg-open', 'OPEN'], PROCESSING: ['bdg-processing', 'PROCESSING'],
    CLOSE: ['bdg-close', 'CLOSE'], CANCELED: ['bdg-canceled', 'CANCELED'] };
  const [c, t] = m[s] || ['bdg-due-ok', s || '-'];
  return `<span class="bdg ${c}">${t}</span>`;
}
export function payBadge(s) {
  const m = { UNPAID: ['bdg-unpaid', 'ยังไม่ชำระ'], PARTIAL: ['bdg-partial', 'ชำระบางส่วน'],
    PAID: ['bdg-paid', 'ชำระครบ'], VOID: ['bdg-void', 'VOID'], ISSUED: ['bdg-issued', 'ISSUED'] };
  const [c, t] = m[s] || ['bdg-due-ok', s || '-'];
  return `<span class="bdg ${c}">${t}</span>`;
}
