/* ประวัติการทำงาน (audit log) — njacc_list_audit(p_page,p_size) */
import { rpc } from '../core/supabase-client.js';
import { esc } from '../core/formatter.js';
import { renderPagination } from '../components/pagination.js';
import { handleErr } from '../core/error-handler.js';
import { nextToken, isCurrent } from '../core/request-manager.js';

const st = { page: 1, size: 50 };

export async function render(cnt) {
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>ประวัติการทำงาน</h2></div>
      <button class="btn btn-o" id="au-refresh">↻ รีเฟรช</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>เวลา</th><th>ผู้ใช้</th><th>Action</th><th>Entity</th><th>รายละเอียด</th>
    </tr></thead><tbody id="au-tbody"><tr><td colspan="5" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div><div class="card mt-2" id="au-pgn"></div>`;

  async function load() {
    const t = nextToken('audit');
    try {
      const res = await rpc('njacc_list_audit', { p_page: st.page, p_size: st.size });
      if (!isCurrent('audit', t)) return;
      const rows = res.rows || [];
      cnt.querySelector('#au-tbody').innerHTML = rows.length ? rows.map(r => `<tr>
        <td class="nowrap t-xs">${esc(String(r.created_at || '').replace('T', ' ').slice(0, 19))}</td>
        <td>${esc(r.full_name || '-')}</td>
        <td class="t-b">${esc(r.action)}</td>
        <td class="t-xs">${esc(r.entity_type || '')} ${esc(String(r.entity_id || '').slice(0, 8))}</td>
        <td class="t-xs ellip" style="max-width:380px" title="${esc(JSON.stringify(r.detail || {}))}">${esc(JSON.stringify(r.detail || {}))}</td>
      </tr>`).join('') : '<tr><td colspan="5" class="empty">ยังไม่มีประวัติ</td></tr>';
      renderPagination(cnt.querySelector('#au-pgn'), { page: st.page, size: st.size, total: res.total || 0 },
        ({ page, size }) => { st.page = page; st.size = size; load(); });
    } catch (e) { if (isCurrent('audit', t)) handleErr(e); }
  }
  cnt.querySelector('#au-refresh').onclick = load;
  load();
}
