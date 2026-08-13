import { esc } from '../core/formatter.js';
/* Filter: Search / Customer / Status / CS / Due / From / To — server-side ทั้งหมด
   ตัวเลือก Customer/CS มาจาก scope จริงของหน้านั้น (njacc_charge_filter_options) ไม่ derive จากหน้าปัจจุบัน
   Layout ใช้ CSS Grid → เดสก์ท็อป ≥1366 อยู่แถวเดียว */
export function filterBarHTML(f, opts = {}) {
  const sel = (v, cur) => v === cur ? 'selected' : '';
  const customers = opts.customers || [];
  const csNames = opts.cs_names || [];
  return `<div class="fbar fbar-grid" id="ch-fbar">
    <input class="inp inp-search" data-f="q" value="${esc(f.q || '')}"
      placeholder="ค้นหา: Invoice / SRC / ลูกค้า / Job / B/L / Master / ใบขน / Case / APL / ตู้">
    <select class="sel" data-f="customer">
      <option value="">ลูกค้าทั้งหมด</option>
      ${customers.map(c => `<option value="${esc(c.id)}" ${sel(c.id, f.customer)}>${esc(c.name)}${c.active === false ? ' (ปิดใช้งาน)' : ''}</option>`).join('')}
    </select>
    <select class="sel" data-f="status">
      <option value="">Status ทั้งหมด</option>
      <option value="OPEN" ${sel('OPEN', f.status)}>OPEN</option>
      <option value="PROCESSING" ${sel('PROCESSING', f.status)}>PROCESSING</option>
      <option value="CLOSE" ${sel('CLOSE', f.status)}>CLOSE</option>
      <option value="CANCELED" ${sel('CANCELED', f.status)}>CANCELED</option>
    </select>
    <select class="sel" data-f="cs">
      <option value="">CS ทั้งหมด</option>
      ${csNames.map(c => `<option value="${esc(c)}" ${sel(c, f.cs)}>${esc(c)}</option>`).join('')}
    </select>
    <select class="sel" data-f="due">
      <option value="">Due Date ทั้งหมด</option>
      <option value="overdue" ${sel('overdue', f.due)}>เกิน Due (ยังค้างชำระ)</option>
      <option value="today" ${sel('today', f.due)}>ครบวันนี้</option>
      <option value="1-7" ${sel('1-7', f.due)}>ใกล้ครบ 1–7 วัน</option>
      <option value="8-30" ${sel('8-30', f.due)}>ครบใน 8–30 วัน</option>
      <option value="30+" ${sel('30+', f.due)}>เหลือมากกว่า 30 วัน</option>
    </select>
    <input class="inp" type="date" data-f="from" value="${esc(f.from || '')}" title="Date From">
    <input class="inp" type="date" data-f="to" value="${esc(f.to || '')}" title="Date To">
    <button class="btn btn-o btn-sm" id="ch-clear">ล้างตัวกรอง</button>
  </div>`;
}
