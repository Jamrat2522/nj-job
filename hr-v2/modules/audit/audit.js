/* HR V2 — modules/audit/audit.js — njhr_audit_list (อ่านอย่างเดียวเสมอ ไม่มีปุ่มเขียน) */
import { renderTable } from '../../components/table.js';

let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  el.innerHTML =
    '<div class="adp"><div class="v2-toolbar">' +
    '<input type="search" id="ad-q" class="grow" placeholder="ค้นหา action / ผู้ใช้ / ตาราง">' +
    '</div><div id="ad-table"></div></div>';
  const tableEl = el.querySelector('#ad-table');
  let q = '', page = 0, deb = null;
  const PAGE = 30;

  async function load() {
    ctx.ui.renderLoading(tableEl);
    try {
      const rows = await ctx.repo.audit.list({ q: q || null, limit: PAGE, offset: page * PAGE });
      if (!alive) return;
      const total = rows.length ? Number(rows[0].total_count || rows.length) : 0;
      renderTable(tableEl, [
        { key: 'created_at', label: 'เวลา', render: r => esc((r.created_at || '').slice(0, 19).replace('T', ' ')) },
        { key: 'username', label: 'ผู้ใช้', render: r => esc(r.username || r.actor || '-') },
        { key: 'action', label: 'Action' },
        { key: 'detail', label: 'รายละเอียด', render: r => esc(String(r.detail || r.description || '').slice(0, 120)) }
      ], rows, {
        page, pageSize: PAGE, total, onPage: p => { page = p; load(); },
        empty: 'ยังไม่มีประวัติการใช้งาน'
      });
    } catch (e) { if (alive) ctx.ui.renderError(tableEl, 'โหลดประวัติไม่สำเร็จ', load, 'ลองอีกครั้ง', e.message); }
  }
  el.querySelector('#ad-q').addEventListener('input', function () {
    clearTimeout(deb); deb = setTimeout(() => { q = this.value.trim(); page = 0; load(); }, 350);
  });
  load();
}

export function unmount() { alive = false; }
