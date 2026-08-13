/* CHARGE ENGINE กลาง — SERVICE/ADVANCE × 5 บริษัท ใช้โค้ดชุดเดียวกันผ่าน config
   ทุก query scope ด้วย charge_type + company_group ที่ server (Data Isolation)
   โหลดหน้า = 1 request (njacc_charge_page_bundle → rows + total + kpi [+ filter options]) */
import { chargeBundle } from './charge-api.js';
import { kpiHTML } from './charge-kpi.js';
import { filterBarHTML } from './charge-filter.js';
import { headHTML, rowHTML, COL_COUNT } from './charge-table.js';
import { chargeState } from './charge-list.js';
import { handleAction, editNote } from './charge-actions.js';
import { toolbarHTML, bindToolMenus } from './charge-toolbar.js';
import { runTool } from './charge-tools.js';
import { renderPagination } from '../components/pagination.js';
import { readFilters } from '../components/filters.js';
import { can } from '../core/permissions.js';
import { nextToken, isCurrent, debounce } from '../core/request-manager.js';
import { handleErr } from '../core/error-handler.js';
import { groupLabel, chargeLabel, CHARGE_TYPES } from '../config/charge-groups.js';

export async function render(cnt, { charge, group }) {
  const st = chargeState(charge, group);
  const perms = {
    view: can('view', charge, group),
    create: can('create', charge, group),
    edit: can('edit', charge, group),
    invoice: can('invoice', charge, group),
    void: can('void', charge, group),
    delete: can('delete', charge, group),
    export: can('export', charge, group),
  };
  const accent = (CHARGE_TYPES.find(c => c.key === charge) || {}).accent || 'service';
  const cols = COL_COUNT(charge);
  const key = 'charge-' + charge + '-' + group;
  const ctx = { charge, group, filters: st.filters, refresh: () => load() };

  cnt.innerHTML = `
    <div class="page-head">
      <div class="page-title"><span class="dot"></span>
        <h2>${chargeLabel(charge)}</h2>
        <span class="ch-head-badge ${accent}">${groupLabel(group)}</span></div>
    </div>
    ${toolbarHTML(charge, group, perms)}
    <div id="ch-kpi" class="mt-2"><div class="kpi-row">${'<div class="kpi"><div class="skel"></div></div>'.repeat(6)}</div></div>
    <div id="ch-filter">${filterBarHTML(st.filters, st.options || {})}</div>
    <div class="tbl-wrap"><table class="tbl tbl-charge"><thead><tr>${headHTML(charge)}</tr></thead>
      <tbody id="ch-tbody"><tr><td colspan="${cols}" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div>
    <div class="card mt-2" id="ch-pgn"></div>`;

  async function load() {
    const t = nextToken(key);
    try {
      const res = await chargeBundle({ charge, group, filters: st.filters,
        sort: st.sort, dir: st.dir, page: st.page, size: st.size,
        withOptions: !st.options });               /* ขอ options เฉพาะครั้งแรก */
      if (!isCurrent(key, t)) return;              /* stale guard */

      if (res.filter_options) {
        st.options = res.filter_options;
        cnt.querySelector('#ch-filter').innerHTML = filterBarHTML(st.filters, st.options);
        bindFilterBar();
      }
      cnt.querySelector('#ch-kpi').innerHTML = kpiHTML(res.kpi || {}, charge);

      const rows = res.rows || [];
      cnt.querySelector('#ch-tbody').innerHTML = rows.length
        ? rows.map(r => rowHTML(r, charge, perms)).join('')
        : `<tr><td colspan="${cols}" class="empty">ไม่พบข้อมูลตามเงื่อนไข — ลองล้างตัวกรอง หรือกด "+ เปิดงาน"</td></tr>`;
      renderPagination(cnt.querySelector('#ch-pgn'),
        { page: st.page, size: st.size, total: res.total || 0 },
        ({ page, size }) => { st.page = page; st.size = size; load(); });
    } catch (e) { if (isCurrent(key, t)) handleErr(e); }
  }

  /* ---- filters (server-side · options มาจาก scope จริง ไม่ derive จากหน้าปัจจุบัน) ---- */
  function bindFilterBar() {
    const wrap = cnt.querySelector('#ch-filter');
    const fbar = wrap.querySelector('#ch-fbar');
    fbar.oninput = (e) => {
      const el = e.target.closest('[data-f]'); if (!el) return;
      debounce(key + '-f', () => {
        Object.assign(st.filters, readFilters(wrap.querySelector('#ch-fbar')));
        st.page = 1;                               /* filter เปลี่ยน → กลับหน้า 1 */
        load();
      }, el.dataset.f === 'q' ? 300 : 0);          /* debounce 300ms เฉพาะช่องค้นหา */
    };
    wrap.querySelector('#ch-clear').onclick = () => {
      Object.keys(st.filters).forEach(k2 => st.filters[k2] = '');
      st.page = 1;
      wrap.innerHTML = filterBarHTML(st.filters, st.options || {});
      bindFilterBar(); load();
    };
  }
  bindFilterBar();

  /* ---- sort (natural sort ทำที่ server) ---- */
  cnt.querySelector('thead').addEventListener('click', (e) => {
    const th = e.target.closest('[data-sort]'); if (!th) return;
    const s = th.dataset.sort;
    if (st.sort === s) st.dir = st.dir === 'asc' ? 'desc' : 'asc';
    else { st.sort = s; st.dir = 'desc'; }
    st.page = 1; load();
  });

  /* ---- row actions ---- */
  cnt.querySelector('#ch-tbody').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act, id = b.dataset.id;
    if (act === 'view') location.hash = '#/job/' + id;
    else if (act === 'edit') location.hash = '#/job/' + id + '/edit';
    else if (act === 'invoice') location.hash = '#/invoice/issue/' + id;
    else if (act === 'viewinv') location.hash = '#/invoice/' + b.dataset.inv;
    else if (act === 'note') editNote(id, b.textContent.trim() === '＋ NOTE' ? '' : b.textContent.trim(), () => load());
    else handleAction(act, id, () => load());
  });

  /* ---- toolbar ---- */
  const tools = cnt.querySelector('.ch-tools');
  bindToolMenus(tools);
  tools.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tool]'); if (!b) return;
    runTool(b.dataset.tool, ctx);
  });
  const qc = cnt.querySelector('#qc-key');
  if (qc) qc.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); runTool('quick-close', ctx); }
  });

  load();
}
