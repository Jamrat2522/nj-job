/* HR V2 — components/table.js
   ตารางกลาง + แบ่งหน้า — desktop = ตาราง · มือถือ ≤768px = การ์ด (CSS .v2t)
   cols: [{ key, label, render?, width? }] · rows: array · opts: { page, pageSize, total, onPage, onRow, empty } */
import { esc } from './ui-states.js';

export function renderTable(el, cols, rows, opts) {
  opts = opts || {};
  if (!rows.length) {
    el.innerHTML = '<div class="v2-state"><div class="v2-state-ic">📭</div><p>' + esc(opts.empty || 'ยังไม่มีข้อมูล') + '</p></div>';
    return;
  }
  let h = '<div class="v2t-wrap"><table class="v2t"><thead><tr>';
  cols.forEach(c => { h += '<th' + (c.width ? ' style="width:' + c.width + '"' : '') + '>' + esc(c.label) + '</th>'; });
  h += '</tr></thead><tbody>';
  rows.forEach((r, i) => {
    h += '<tr data-i="' + i + '"' + (opts.onRow ? ' class="v2t-click"' : '') + '>';
    cols.forEach(c => {
      const v = c.render ? c.render(r) : esc(r[c.key] == null ? '' : r[c.key]);
      h += '<td data-l="' + esc(c.label) + '">' + v + '</td>';
    });
    h += '</tr>';
  });
  h += '</tbody></table></div>';
  h += pager(opts);
  el.innerHTML = h;
  if (opts.onRow) el.querySelectorAll('tr[data-i]').forEach(tr =>
    tr.addEventListener('click', (ev) => {
      if (ev.target.closest('button, a, input, select')) return;   // ปุ่มในแถวทำงานของตัวเอง
      opts.onRow(rows[Number(tr.dataset.i)]);
    }));
  const pg = el.querySelectorAll('.v2t-pg button');
  pg.forEach(b => b.addEventListener('click', () => opts.onPage(Number(b.dataset.p))));
}

function pager(o) {
  if (!o.onPage || !o.total || o.total <= o.pageSize) return '';
  const pages = Math.ceil(o.total / o.pageSize), p = o.page || 0;
  return '<div class="v2t-pg">' +
    '<button class="btn btn-ghost" data-p="' + (p - 1) + '"' + (p <= 0 ? ' disabled' : '') + '>‹ ก่อนหน้า</button>' +
    '<span>หน้า ' + (p + 1) + ' / ' + pages + ' · ' + o.total + ' รายการ</span>' +
    '<button class="btn btn-ghost" data-p="' + (p + 1) + '"' + (p >= pages - 1 ? ' disabled' : '') + '>ถัดไป ›</button></div>';
}

export function badge(text, tone) {
  const t = { ok: 'v2b-ok', warn: 'v2b-warn', err: 'v2b-err', info: 'v2b-info' }[tone] || '';
  return '<span class="v2b ' + t + '">' + esc(text) + '</span>';
}
export const STATUS_TH = {
  PENDING: ['รออนุมัติ', 'warn'], APPROVED: ['อนุมัติแล้ว', 'ok'], REJECTED: ['ไม่อนุมัติ', 'err'],
  CANCELLED: ['ยกเลิก', ''], DONE: ['เสร็จสิ้น', 'ok'], DRAFT: ['แบบร่าง', ''],
  CALCULATED: ['คำนวณแล้ว', 'info'], PAID: ['จ่ายแล้ว', 'ok'], SENT: ['ส่งแล้ว', 'ok'],
  ACTIVE: ['ปฏิบัติงาน', 'ok'], PROBATION: ['ทดลองงาน', 'warn'], RESIGNED: ['พ้นสภาพ', 'err'], SUSPENDED: ['พักงาน', 'err'],
  NORMAL: ['ปกติ', 'ok'], LATE: ['สาย', 'warn'], ABSENT: ['ขาด', 'err'], LEAVE: ['ลา', 'info'], HOLIDAY: ['วันหยุด', '']
};
export function statusBadge(s) { const d = STATUS_TH[s] || [s, '']; return badge(d[0], d[1]); }
