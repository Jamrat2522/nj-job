/* HR V2 — modules/reports/reports.js
   4 รายงานหลักผ่าน RPC เดิม: njhr_att_report / njhr_leave_report / njhr_ot_report / njhr_leave_balance_report
   Export = CSV UTF-8 BOM (เปิดใน Excel ภาษาไทยถูกต้อง)
   REPORT ALL (เทมเพลต Excel XML surgery ของ V1) = Deferred — ดู DEFERRED.md ข้อ R1 */
import { renderTable, statusBadge } from '../../components/table.js';
import { typeName } from '../leave/leave.js';

let alive = false;

const REPORTS = {
  att:   { label: 'รายงานการลงเวลา' },
  leave: { label: 'รายงานการลา' },
  ot:    { label: 'รายงาน OT' },
  bal:   { label: 'สิทธิ์ลาคงเหลือ' }
};

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  const today = new Date(), y = today.getFullYear(), m = String(today.getMonth() + 1).padStart(2, '0');
  const firstDay = y + '-' + m + '-01';
  const todayStr = today.toISOString().slice(0, 10);

  el.innerHTML =
    '<div class="rpp">' +
    '<div class="v2-tabs">' + Object.keys(REPORTS).map((k, i) =>
      '<button' + (i === 0 ? ' class="on"' : '') + ' data-t="' + k + '">' + esc(REPORTS[k].label) + '</button>').join('') + '</div>' +
    '<div class="v2-toolbar">' +
    '<input type="date" id="rp-from" value="' + firstDay + '">' +
    '<input type="date" id="rp-to" value="' + todayStr + '">' +
    '<input type="search" id="rp-q" class="grow" placeholder="ค้นหาพนักงาน">' +
    '<button class="btn btn-ghost" id="rp-run">แสดงรายงาน</button>' +
    '<button class="btn btn-primary" id="rp-csv">⬇ Export CSV</button>' +
    '</div><div id="rp-table"></div>' +
    '<p class="hm-sub">Export เทมเพลต REPORT ALL (Excel ฟอร์มบริษัท) จะเพิ่มในรอบถัดไป — ดู DEFERRED.md</p></div>';

  const tableEl = el.querySelector('#rp-table');
  let tab = 'att', lastRows = [], lastCols = [];

  el.querySelectorAll('.v2-tabs button').forEach(b => b.addEventListener('click', () => {
    tab = b.dataset.t;
    el.querySelectorAll('.v2-tabs button').forEach(x => x.classList.toggle('on', x === b));
    load();
  }));

  async function load() {
    ctx.ui.renderLoading(tableEl);
    const from = el.querySelector('#rp-from').value, to = el.querySelector('#rp-to').value;
    const q = el.querySelector('#rp-q').value.trim() || null;
    try {
      let rows, cols;
      if (tab === 'att') {
        rows = await ctx.repo.attendance.report({ from, to, q, limit: 500, offset: 0 });
        cols = [
          { key: 'work_date', label: 'วันที่', render: r => esc((r.work_date || '').slice(0, 10)) },
          { key: 'emp_code', label: 'รหัส' },
          { key: 'emp_name', label: 'พนักงาน', render: r => esc(r.emp_name || r.full_name || '') },
          { key: 'check_in', label: 'เข้า', render: r => esc((r.check_in || '').slice(11, 16) || '-') },
          { key: 'check_out', label: 'ออก', render: r => esc((r.check_out || '').slice(11, 16) || '-') },
          { key: 'late_min', label: 'สาย (นาที)', render: r => esc(r.late_min != null ? r.late_min : '-') },
          { key: 'status', label: 'สถานะ', render: r => statusBadge(r.status || r.att_status) }
        ];
      } else if (tab === 'leave') {
        rows = await ctx.repo.leave.report({ from, to, q });
        cols = [
          { key: 'emp_code', label: 'รหัส' },
          { key: 'emp_name', label: 'พนักงาน', render: r => esc(r.emp_name || r.full_name || '') },
          { key: 'leave_type', label: 'ประเภท', render: r => esc(typeName(r.leave_type)) },
          { key: 'start_date', label: 'เริ่ม', render: r => esc((r.start_date || '').slice(0, 10)) },
          { key: 'end_date', label: 'สิ้นสุด', render: r => esc((r.end_date || '').slice(0, 10)) },
          { key: 'days', label: 'วัน' },
          { key: 'status', label: 'สถานะ', render: r => statusBadge(r.status) }
        ];
      } else if (tab === 'ot') {
        rows = await ctx.repo.ot.report({ from, to, q, limit: 500, offset: 0 });
        cols = [
          { key: 'ot_date', label: 'วันที่', render: r => esc(((r.ot_date || r.date || '') + '').slice(0, 10)) },
          { key: 'emp_code', label: 'รหัส' },
          { key: 'emp_name', label: 'พนักงาน', render: r => esc(r.emp_name || r.full_name || '') },
          { key: 'start_time', label: 'เวลา', render: r => esc(((r.start_time || '') + '').slice(0, 5)) + '–' + esc(((r.end_time || '') + '').slice(0, 5)) },
          { key: 'hours', label: 'ชม.' },
          { key: 'status', label: 'สถานะ', render: r => statusBadge(r.status) }
        ];
      } else {
        rows = await ctx.repo.leave.balanceReport({ year: Number(from.slice(0, 4)), q });
        cols = [
          { key: 'emp_code', label: 'รหัส' },
          { key: 'emp_name', label: 'พนักงาน', render: r => esc(r.emp_name || r.full_name || '') },
          { key: 'leave_type', label: 'ประเภท', render: r => esc(typeName(r.leave_type)) },
          { key: 'quota', label: 'สิทธิ์', render: r => esc(r.quota == null ? 'ไม่จำกัด' : r.quota) },
          { key: 'used', label: 'ใช้ไป' },
          { key: 'remaining', label: 'คงเหลือ', render: r => esc(r.remaining == null ? '-' : r.remaining) }
        ];
      }
      if (!alive) return;
      lastRows = rows; lastCols = cols;
      renderTable(tableEl, cols, rows, { empty: 'ไม่มีข้อมูลตามเงื่อนไข' });
    } catch (e) { if (alive) ctx.ui.renderError(tableEl, 'สร้างรายงานไม่สำเร็จ', load, 'ลองอีกครั้ง', e.message); }
  }

  el.querySelector('#rp-run').addEventListener('click', load);
  el.querySelector('#rp-csv').addEventListener('click', () => {
    if (!lastRows.length) return ctx.toast.show('ยังไม่มีข้อมูลให้ Export — กดแสดงรายงานก่อน', 'warn');
    /* CSV เท่านั้น — ไม่ยุ่งกับเทมเพลต Excel ต้นฉบับใด ๆ (สร้างไฟล์ใหม่ล้วน) */
    const head = lastCols.map(c => csvCell(c.label)).join(',');
    const tmp = document.createElement('div');
    const body = lastRows.map(r => lastCols.map(c => {
      if (c.render) { tmp.innerHTML = c.render(r); return csvCell(tmp.textContent); }
      return csvCell(r[c.key] == null ? '' : r[c.key]);
    }).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + head + '\r\n' + body], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'njhr-report-' + tab + '-' + Date.now() + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  function csvCell(v) {
    v = String(v == null ? '' : v);
    return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  load();
}

export function unmount() { alive = false; }
