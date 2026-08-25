/* CHARGE ENGINE กลาง — SERVICE/ADVANCE × 5 บริษัท ใช้โค้ดชุดเดียวกันผ่าน config
   ทุก query scope ด้วย charge_type + company_group ที่ server (Data Isolation)
   โหลดหน้า = 1 request (njacc_charge_page_bundle → rows + total + kpi [+ filter options]) */
import { chargeBundle, closeJob, closeJobCounts } from './charge-api.js';
/* ── V.232 ── postJob = RPC njacc_post_job (RUN-29) — จุดเดียวที่ SERVICE ออกเลข */
import { postJob } from '../jobs/job-api.js';
import { kpiHTML, KPI_COUNT } from './charge-kpi.js';
import { filterBarHTML } from './charge-filter.js';
import { headHTML, rowHTML, COL_COUNT } from './charge-table.js';
import { initColumns } from '../components/table.js';
import { chargeState } from './charge-list.js';
import { handleAction, editNote } from './charge-actions.js';
import { toolbarHTML, bindToolMenus, docTopButtonHTML } from './charge-toolbar.js';
import { runTool } from './charge-tools.js';
import { renderPagination } from '../components/pagination.js';
import { readFilters } from '../components/filters.js';
import { can } from '../core/permissions.js';
import { nextToken, isCurrent, debounce, newRequestId, once } from '../core/request-manager.js';
import { confirmModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { esc } from '../core/formatter.js';
import { handleErr } from '../core/error-handler.js';
import { groupLabel, chargeLabel, CHARGE_TYPES } from '../config/charge-groups.js';

export async function render(cnt, { charge, group, mode, scope: scopeArg }) {
  /* mode: 'document' = ข้อมูลต้นทางทั้งหมด (ค่าเริ่มต้น · route เดิม #/charges/... ใช้ค่านี้)
           'accounting' = คิวรอออก Invoice — กรองที่ server ผ่าน queue=pending_invoice
     ใช้ Job record เดียวกันทั้งสองหน้า (ไม่มีการ copy ข้อมูล) */
  /* queue กรองที่ server ทุกหน้า — ไม่มีการกรองฝั่ง browser (pagination/count ต้องถูก)
     document   : ทั้งหมด (มุมมองเอกสารต้นทาง)
     accounting : คิวรอออก Invoice
     receipt    : SERVICE ที่ POST แล้วรอรับชำระ
     advance    : ADVANCE ที่ POST แล้วรอจ่าย/เคลียร์
     closed     : จบครบวงจร — ใช้ scope='all' เพื่อเห็นทั้ง SERVICE และ ADVANCE ของ Job เดียวกัน */
  const QUEUE_BY_MODE = {
    /* ── document (025) ── งานที่ยังค้างฝั่งเอกสาร = ยังไม่ถูกกด "ปิดงาน"
       เงื่อนไขที่ server: operational_status <> 'CLOSE'
       กด "ปิดงาน" สำเร็จ → operational_status='CLOSE' → หลุดจากคิวนี้ทันที
       และเข้าคิว pending_invoice ของ ACCOUNTING ด้วยฟิลด์เดียวกัน (Job เดิม ID เดิม)
       ไม่ได้ลบแถวจาก DOM เอง — Refresh / Logout / เครื่องใหม่ ก็ไม่กลับมา */
    document: 'document',
    accounting: 'pending_invoice',
    receipt: 'receipt_active',
    advance: 'advance_active',
    closed: 'closed',
  };
  /* mode ที่ไม่ได้ระบุ (route เดิม #/charges/:charge/:group) → queue=null = มุมมองรวมเหมือนเดิม */
  const queue = QUEUE_BY_MODE[mode] || null;
  /* ── scope (025) ── แยกประเภทงานตาม charge_type ที่ server
     SERVICE เห็นเฉพาะ SERVICE · ADVANCE เห็นเฉพาะ ADVANCE (Data Isolation ตามหัวไฟล์)
     scope='all' ใช้เฉพาะหน้าที่ส่งมาเองเท่านั้น (FINANCE > Close Job) */
  const scope = scopeArg || null;
  const st = chargeState(charge, group, mode || 'document');
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
  const cols = COL_COUNT(charge, mode || 'document');
  /* stale-guard key ต้องแยกตามโหมดด้วย — DOCUMENT กับ ACCOUNTING ใช้ charge/group เดียวกัน
     ถ้าใช้ key เดียวกัน request ของหน้าที่ถูกปิดไปแล้วจะยังเขียนทับ DOM ของหน้าใหม่ */
  const key = 'charge-' + charge + '-' + group + '-' + (mode || 'document');
  const ctx = { charge, group, queue, scope, mode: mode || 'document', filters: st.filters, refresh: () => load() };

  /* ── Main List Container เดียว (.ch-panel) ──
     เดิม Filter / Table / Pagination เป็น 3 ก้อนแยก (.fbar · .tbl-wrap · .card)
     แต่ละก้อนมี border + radius + shadow ของตัวเอง -> เห็นเป็น 3 Card
     ครอบด้วย .ch-panel แล้วปิด chrome ของลูกใน CSS (scope .ch-panel เท่านั้น)
     *** เปิดเฉพาะ 4 โหมดที่สั่ง *** DOCUMENT/ACCOUNTING × SERVICE/ADVANCE
     mode อื่น (advance · closed · route เดิม #/charges/:charge/:group) ไม่ถูกครอบ
     -> โครงสร้าง DOM และหน้าตาเดิม 100%
     element id/class ภายในไม่เปลี่ยนเลย -> querySelector / event binding เดิมทำงานเหมือนเดิม */
  /* Main List Container เดียว — ใช้กับทุกหน้ารายการที่ render จาก charge-page
     DOCUMENT / ACCOUNTING (เดิม) + FINANCE > Advance / Close Job (รอบนี้)
     route เดิม #/charges/:charge/:group (mode = undefined) ไม่ถูกครอบ -> โครงเดิม 100% */
  const isPanel = (mode === 'document' || mode === 'accounting'
                || mode === 'advance'  || mode === 'closed');
  /* ── KPI Summary ──────────────────────────────────────────────────────────
     DOCUMENT   : ไม่มีมาแต่เดิม
     ACCOUNTING : ตัดออกตามคำสั่ง — ไม่ render และไม่ขอให้ server คำนวณ
     mode อื่น (advance / closed / route เดิม #/charges/:charge/:group) ยังมี KPI ครบ
     -> kpiHTML / KPI_COUNT / njacc_charge_page_bundle ไม่ถูกลบ หน้าอื่นใช้ต่อได้ */
  const showKpi = (mode !== 'document' && mode !== 'accounting');
  /* FINANCE > Advance และ Close Job ก็คลิกแถวเปิดได้ (ใช้ปลายทางเดิมของแต่ละหน้า) */
  const rowOpen = isPanel;
  /* ── Tab SERVICE / ADVANCE ในหน้า — *** ถอดออกแล้ว (V.180) *** ──────────
     เดิม render ปุ่ม [SERVICE][ADVANCE] ไว้เหนือ toolbar ของหน้า
     ตอนนี้ Sidebar มีเมนูย่อย SERVICE/ADVANCE ใต้ DOCUMENT และ ACCOUNTING แล้ว
     (V.178) -> เลือกโหมดได้ 2 ที่ = ซ้ำซ้อน
     *** ให้ Sidebar เป็นจุดเลือกโหมดเพียงจุดเดียว ***
     Route / args / Data Source / Header ไม่เปลี่ยน — หน้ายังรับ charge+mode
     จาก routes.js เหมือนเดิมทุกประการ ถอดเฉพาะ UI ที่ซ้ำ */

  /* ══ JOB CONTROL > CLOSE JOB — Tab [SERVICE] [ADVANCE] (V.190) ══════════
     แต่ละ Tab = render หน้าเดิมด้วย charge คนละค่า -> server กรอง charge_type ให้
     *** ไม่ใช้ scope='all' แล้ว *** สองประเภทจึงไม่ปนกันใน Queue เดียว (ข้อกำหนดข้อ 22)
     ไม่เปลี่ยน Route (finance/close-job เหมือนเดิม) · ไม่แตะ location.hash */
  const closeTabs = (mode === 'closed')
    ? CHARGE_TYPES.filter(c => can('view', c.key, group))
    : [];
  const tabsHTML = closeTabs.length < 1 ? '' :
    `<div class="rep-tabs" id="cj-tabs">${closeTabs.map(c =>
      `<button class="rep-tab${c.key === charge ? ' active' : ''}" data-cjtab="${c.key}">${
        c.key}<span class="cj-n" id="cj-n-${c.key}"></span></button>`).join('')}</div>`;

  cnt.innerHTML = `
    ${tabsHTML}
    ${toolbarHTML(charge, group, perms, mode || 'document')}
    ${showKpi ? `<div id="ch-kpi" class="mt-2"><div class="kpi-row">${'<div class="kpi"><div class="skel"></div></div>'.repeat(KPI_COUNT(charge, mode || 'document'))}</div></div>` : ''}
    ${isPanel ? '<div class="ch-panel">' : ''}
    <div id="ch-filter">${filterBarHTML(st.filters, st.options || {}, mode || 'document', perms)}</div>
    <div class="tbl-wrap"><table class="tbl tbl-charge"><thead><tr>${headHTML(charge, mode || 'document')}</tr></thead>
      <tbody id="ch-tbody"><tr><td colspan="${cols}" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div>
    <div class="card mt-2" id="ch-pgn"></div>
    ${isPanel ? '</div>' : ''}`;
  cnt.dataset.chPage = key;   /* ตัวชี้รุ่นของหน้า — ใช้กัน response ของหน้าเก่าเขียนทับหน้าใหม่ */


  /* ── จัดการคอลัมน์ (UI เท่านั้น) — เปิดใช้เฉพาะ 4 โหมดตามขอบเขต ──
     ลำดับ/การซ่อน เก็บใน localStorage แยกตาม User + Mode
     ไม่แตะ query · filter · sort · pagination · export · permission ใด ๆ */
  /* Mode key ของ Column Preference — แยก User + Mode ตามข้อกำหนด
     DOCUMENT_SERVICE / ACCOUNTING_ADVANCE / FINANCE_ADVANCE / FINANCE_CLOSE_JOB */
  const COL_MODE = {
    document: 'DOCUMENT_' + charge, accounting: 'ACCOUNTING_' + charge,
    advance: 'FINANCE_ADVANCE', closed: 'FINANCE_CLOSE_JOB',
  }[mode] || null;
  /* ปุ่ม "⚙ คอลัมน์" — ต่อท้ายแถบปุ่มที่มีอยู่จริงของแต่ละโหมด
     DOCUMENT อยู่ใน .fbar-acts (ถูก re-render ตอนล้างตัวกรอง จึงต้อง mount ซ้ำ)
     โหมดอื่นอยู่ใน .ch-tools · Close Job ไม่มี toolbar -> ไม่มีปุ่ม (ลากหัวได้อย่างเดียว) */
  function mountColBtn() {
    if (!COL_MODE) return;
    const table = cnt.querySelector('table.tbl-charge');
    /* หา host ของปุ่มตามที่หน้านั้นมีจริง — Close Job ไม่มี toolbar และไม่มี .fbar-acts
       จึงต่อท้ายแถบตัวกรอง #ch-fbar แทน (ปุ่มขนาด btn-sm ไม่ทำให้แถวใหญ่ขึ้น) */
    const host = cnt.querySelector('.fbar-acts') || cnt.querySelector('.ch-tools')
      || cnt.querySelector('#ch-fbar') || null;
    initColumns({ table, modeKey: COL_MODE, host });
    /* ── "+ เปิดงาน" ต่อท้าย "⚙ คอลัมน์" (หน้ารายการ DOCUMENT เท่านั้น) ──────
       ต้อง append "หลัง" initColumns เพราะปุ่มคอลัมน์ถูกสร้างด้วย JS ตอนนั้น
       -> ลำดับสุดท้ายในแถบ: ล้างตัวกรอง | Export Excel | Refresh | ⚙ คอลัมน์ | + เปิดงาน
       *** Reuse ปุ่มเดิมทั้งดุ้น *** docTopButtonHTML() คืน markup จาก MAIN entry
       'new-job' + btn() ตัวเดียวกับ Toolbar เดิม (class btn-p btn-sm · ข้อความ ·
       data-tool="new-job" · เช็ค perms.create เหมือนเดิม)
       คลิกวิ่งเข้า delegate ระดับหน้า cnt.addEventListener('click') ที่มีอยู่แล้ว
       -> runTool('new-job', ctx) -> openNewJobModal() ชุดเดิมทุกประการ
       ไม่ผูก onclick ใหม่ · ไม่สร้าง Modal/Logic/Permission ชุดใหม่
       กันปุ่มซ้ำด้วย [data-tool="new-job"] — .fbar-acts ถูก re-render ตอนล้างตัวกรอง
       และ mountColBtn() ถูกเรียกซ้ำทุกครั้งที่โหลดแถวใหม่ */
    if (host && (mode || 'document') === 'document'
        && !host.querySelector('[data-tool="new-job"]')) {
      const html = docTopButtonHTML(perms);      /* '' เมื่อไม่มีสิทธิ์ create */
      if (html) host.insertAdjacentHTML('beforeend', html);
    }
  }
  const relayout = () => mountColBtn();
  if (rowOpen) {
    const tb0 = cnt.querySelector('table.tbl-charge');
    if (tb0) tb0.classList.add('rowclick');    /* cursor:pointer + hover (CSS) */
  }
  mountColBtn();

  /* ── Tab ของ CLOSE JOB: คลิก = render หน้าเดิมด้วย charge อีกค่า ──
     ไม่แตะ hash/route · state ของแต่ละ Tab แยกกันด้วย chargeState(charge,group,mode) */
  const tabsEl = cnt.querySelector('#cj-tabs');
  if (tabsEl) {
    tabsEl.onclick = (e) => {
      const b2 = e.target.closest('[data-cjtab]');
      if (!b2 || b2.dataset.cjtab === charge) return;
      render(cnt, { charge: b2.dataset.cjtab, group, mode: 'closed' });
    };
  }
  /* ตัวเลขบน Tab — มาจาก njacc_close_job_counts (เงื่อนไขเดียวกับคิว ไม่ได้นับที่ Browser) */
  async function loadTabCounts() {
    if (!tabsEl) return;
    try {
      const c = await closeJobCounts(group) || {};
      CHARGE_TYPES.forEach(ct => {
        const el = cnt.querySelector('#cj-n-' + ct.key);
        if (el) el.textContent = ' ' + Number(c[ct.key] || 0).toLocaleString('th-TH');
      });
    } catch (e) { /* ตัวเลขบน Tab ไม่ใช่ข้อมูลหลัก — ล้มเหลวแล้วไม่ทำให้หน้าพัง */ }
  }
  loadTabCounts();

  async function load() {
    const t = nextToken(key);
    try {
      const res = await chargeBundle({ charge, group, queue, scope, filters: st.filters,
        sort: st.sort, dir: st.dir, page: st.page, size: st.size,
        withOptions: !st.options,                  /* ขอ options เฉพาะครั้งแรก */
        withKpi: showKpi });                       /* ACCOUNTING = false -> server ข้าม aggregate */
      if (!isCurrent(key, t)) return;              /* stale guard */
      if (cnt.dataset.chPage !== key) return;       /* หน้าถูกแทนที่แล้ว — ห้ามเขียนทับ DOM ของหน้าใหม่ */
      /* element ของหน้านี้ต้องยังอยู่ครบ มิฉะนั้นแปลว่าหน้าถูก render ทับไปแล้ว — ออกเงียบ ๆ ไม่โยน error */
      const elFilter = cnt.querySelector('#ch-filter');
      const elKpi = cnt.querySelector('#ch-kpi');
      const elBody = cnt.querySelector('#ch-tbody');
      const elPgn = cnt.querySelector('#ch-pgn');
      /* DOCUMENT / ACCOUNTING ไม่มี #ch-kpi แล้ว → ไม่นับเป็นเงื่อนไข stale guard */
      if (!elFilter || !elBody || !elPgn) return;
      if (showKpi && !elKpi) return;

      if (res.filter_options) {
        st.options = res.filter_options;
        elFilter.innerHTML = filterBarHTML(st.filters, st.options, mode || 'document', perms);
        bindFilterBar();
      }
      /* elKpi เป็น null ในโหมดที่ไม่มี KPI -> ไม่เรียก kpiHTML และไม่แตะ DOM ใด ๆ */
      if (showKpi && elKpi) elKpi.innerHTML = kpiHTML(res.kpi || {}, charge, mode || 'document', perms);

      const rows = res.rows || [];
      elBody.innerHTML = rows.length
        ? rows.map(r => rowHTML(r, charge, perms, mode || 'document')).join('')
        : `<tr><td colspan="${cols}" class="empty">ไม่พบข้อมูลตามเงื่อนไข — ลองล้างตัวกรอง หรือกด "+ เปิดงาน"</td></tr>`;
      renderPagination(elPgn,
        { page: st.page, size: st.size, total: res.total || 0 },
        ({ page, size }) => { st.page = page; st.size = size; load(); });
      relayout();                              /* แถวใหม่ -> จัดคอลัมน์ตามที่ผู้ใช้ตั้งไว้ */
      mountColBtn();                           /* filter bar อาจถูก re-render พร้อม options */
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
      wrap.innerHTML = filterBarHTML(st.filters, st.options || {}, mode || 'document', perms);
      bindFilterBar(); mountColBtn(); load();
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

  /* ── คลิกแถว = เปิดงานทันที (เฉพาะ 4 โหมดตามขอบเขต) ─────────────────────
     ใช้ Flow เดิมทุกบรรทัด ไม่ได้สร้าง Flow ใหม่:
       DOCUMENT   ยังไม่มี INVOICE -> openNewJobModal({ jobId }) แก้ไขได้ทันที
                  มี INVOICE แล้ว  -> #/job/:id (อ่านอย่างเดียว ตามกติกาเดิม)
       ACCOUNTING -> openBillingModal({ jobId, charge })
                  ปุ่มเดิม "ออกวางบิล" และ "ดู INVOICE" เรียกตัวนี้ทั้งคู่อยู่แล้ว
                  billing-modal ตัดสินเอง: ไม่มีใบ = CREATE · DRAFT = แก้ต่อ · POSTED = ล็อก
     เงื่อนไขสิทธิ์/สถานะ = ชุดเดียวกับที่เคยใช้ตัดสินว่าจะ render ปุ่มหรือไม่
     route เดิม #/charges/:charge/:group -> isPanel เป็น false -> ไม่เปิดอะไรเลย */
  function openRow(e) {
    if (!rowOpen) return;
    /* คลิกที่ Control ในแถว (ปุ่ม / เมนู / NOTE / input) = ทำหน้าที่ของ Control เท่านั้น */
    if (e.target.closest('button, a, input, select, textarea, label, [data-act], .row-menu')) return;
    const tr = e.target.closest('tr[data-row]');
    if (!tr || !tr.dataset.row) return;
    const id = tr.dataset.row;
    const inv = tr.dataset.inv || '';
    /* FINANCE > Close Job — ประวัติงานที่จบครบวงจร (ดูอย่างเดียว)
       ปลายทางเดียวกับปุ่ม view / viewinv เดิมเป๊ะ */
    if (mode === 'closed') {
      if (inv) {
        try { sessionStorage.setItem('nj-inv-from', location.hash); } catch (_) {}
        location.hash = '#/invoice/' + inv;
      } else {
        location.hash = '#/job/' + id + '?from=closed';
      }
      return;
    }
    /* FINANCE > Advance — ปลายทางเดียวกับปุ่ม "ดู INVOICE" เดิม
       ปุ่ม settle / พิมพ์ เป็น Action คนละหน้าที่ จึงยังอยู่ในคอลัมน์ "จัดการ" */
    if (mode === 'advance') {
      if (!inv) return;
      try { sessionStorage.setItem('nj-inv-from', location.hash); } catch (_) {}
      location.hash = '#/invoice/' + inv;
      return;
    }
    if (mode === 'document') {
      if (!inv) {
        import('../jobs/job-form.js')
          .then(m => m.openNewJobModal({ charge, group, mode: 'document', jobId: id, onSaved: () => load() }))
          .catch(handleErr);
      } else {
        location.hash = '#/job/' + id + '?from=document';
      }
      return;
    }
    /* ACCOUNTING — ไม่มีใบและไม่มีสิทธิ์ออกบิล/งานถูกยกเลิก = เดิมก็ไม่มีปุ่มให้กด */
    if (!inv && (!perms.invoice || tr.dataset.status === 'CANCELED')) return;
    import('../invoices/billing-modal.js')
      .then(m => m.openBillingModal({ jobId: id, charge, onSaved: () => load() }))
      .catch(handleErr);
  }

  /* ---- row actions ---- */
  cnt.querySelector('#ch-tbody').addEventListener('click', (e) => {
    /* เมนู 3 จุด (หน้า DOCUMENT) — เปิด/ปิดรายการคำสั่ง · ปุ่มด้านในยังเป็น data-act เดิมทุกตัว */
    const dots = e.target.closest('[data-rowmenu]');
    if (dots) {
      const m = dots.parentElement;
      const wasOpen = m.classList.contains('open');
      cnt.querySelectorAll('.row-menu.open').forEach(x => x.classList.remove('open'));
      if (!wasOpen) m.classList.add('open');
      return;
    }
    const b = e.target.closest('[data-act]'); if (!b) { openRow(e); return; }
    cnt.querySelectorAll('.row-menu.open').forEach(x => x.classList.remove('open'));
    const act = b.dataset.act, id = b.dataset.id;
    /* หน้า ACCOUNTING อนุญาตเฉพาะ action ของ Flow ใหม่เท่านั้น
       กันกรณีมี trigger เก่าหลงเหลือ/ถูกเรียกจากที่อื่น (ไม่ได้พึ่งการซ่อนปุ่มอย่างเดียว)
       action ที่เหลือยังใช้ได้ปกติจากหน้า DOCUMENT และ Backend ไม่ถูกแตะ */
    /* หน้าปลายทางอนุญาตเฉพาะ action ของตัวเอง (ไม่ได้พึ่งการซ่อนปุ่มอย่างเดียว) */
    /* ── V.228 ── เพิ่ม 'copy' เฉพาะหน้า document (SERVICE + ADVANCE ใช้ mode นี้ทั้งคู่) */
    /* ── V.232 ── เพิ่ม 'post' เฉพาะหน้า document */
    const ALLOW = { document: ['view', 'copy', 'post', 'close', 'delete', 'note'],
                    accounting: ['bill', 'viewinv', 'note'],
                    advance: ['settle', 'viewinv', 'note', 'apdoc'],
                    closed: ['view', 'viewinv', 'closejob', 'unsettle'] };
    const allow = ALLOW[mode || 'document'];
    if (allow && !allow.includes(act)) return;

    /* ══ V.228 · 📋 COPY — เปิดฟอร์ม "เปิดงานใหม่" พร้อมข้อมูลเดิม ═══════════
       *** ไม่สร้าง Record · ไม่ออกเลข · ไม่แตะ Counter ตอนกดปุ่มนี้ ***
       ใช้ openNewJobModal() ตัวเดิม (ฟอร์มชุดเดียวกับ "+ เปิดงาน")
       ส่ง copyFromId แทน jobId -> isEdit = false -> Save เข้า CREATE flow
       charge/group ถูกอ่านจากงานต้นฉบับใน job-form -> ไม่ข้าม SERVICE/ADVANCE
       ยกเลิก/ปิด Modal = ไม่มีอะไรเกิดขึ้นเลย (ไม่เคยยิง RPC ที่เขียนข้อมูล) */
    /* ══ V.232 · ⬆ POST — ออก Running Number ของ SERVICE ════════════════════
       *** จุดเดียวที่ SERVICE ได้เลข *** (RPC njacc_post_job / RUN-29)
       idempotent : newRequestId() ต่อ 1 การกดยืนยัน + once() กันกดรัว
       ยกเลิก = ไม่มีอะไรเกิดขึ้น ไม่ยิง RPC */
    if (act === 'post') {
      const tr = b.closest('tr[data-row]');
      const cust = tr ? (tr.textContent || '').trim().slice(0, 60) : '';
      confirmModal('ยืนยันออกเลขงาน (POST)',
        'ระบบจะออกเลขงานให้ทันทีและเปลี่ยนสถานะเป็น <b>POSTED</b><br>' +
        '<span class="t-xs t-3">เลขที่ออกแล้วจะไม่ถูกนำกลับมาใช้ซ้ำ — ยกเลิกแล้วเลขไม่คืน</span>',
        '⬆ POST').then(async (okc) => {
          if (!okc) return;
          try {
            const res = await once('post-job-' + id, () => postJob(id, newRequestId()));
            if (res === null) return;                 /* กดซ้ำระหว่างยิง -> ไม่ทำอะไร */
            toast('ออกเลขงานแล้ว — ' + (res && res.job_no ? res.job_no : ''), 'ok');
            load();
          } catch (ex) { handleErr(ex, 'ออกเลขงานไม่สำเร็จ'); }
        });
      return;
    }

    if (act === 'copy') {
      import('../jobs/job-form.js')
        .then(m => m.openNewJobModal({ charge, group, mode: mode || 'document',
                                       copyFromId: id, onSaved: () => load() }))
        .catch((ex) => handleErr(ex, 'เปิดฟอร์มคัดลอกไม่สำเร็จ'));
      return;
    }

    /* ── ปิดงานปลายทาง (JOB CONTROL > CLOSE JOB) ───────────────────────────
       ใช้ Job เดิม ID เดิม · ไม่สร้าง Job ใหม่ · ไม่ลบ Invoice/Payment/Advance
       ไม่ลบแถวออกจาก DOM เอง — โหลดรายการใหม่จาก server เสมอ */
    if (act === 'closejob') {
      const tr = b.closest('tr[data-row]');
      const jobNo = tr ? (tr.querySelector('b') || {}).textContent || '' : '';
      confirmModal('ยืนยันปิดงาน',
        'ปิดงาน <b>' + esc(jobNo) + '</b><br>' +
        'งานจะออกจากหน้านี้และไม่อยู่ในคิวที่ต้องดำเนินการอีก<br>' +
        '<span class="t-xs t-3">ข้อมูล INVOICE / การรับชำระ / Advance เดิมยังอยู่ครบ</span>',
        'ปิดงาน').then(async (ok) => {
          if (!ok) return;
          try {
            await once('closejob-' + id, () => closeJob(id, null, newRequestId()));
            toast('ปิดงานแล้ว', 'ok');
            load(); loadTabCounts();
          } catch (ex) { handleErr(ex); }
        }).catch(handleErr);
      return;
    }
    /* ── ย้อน SETTLED -> PAID (เฉพาะ ADVANCE) ──────────────────────────────
       ใช้ njacc_settle_advance ตัวเดิม ไม่ได้สร้าง RPC ใหม่
       ย้อนแล้วงานหลุดจาก CLOSE JOB และกลับเข้า FINANCE > ADVANCE ตามเงื่อนไขคิวเดิม */
    if (act === 'unsettle') {
      import('../invoices/invoice-api.js').then(async (m) => {
        const ok = await confirmModal('ยืนยันย้อนสถานะ Advance',
          'เปลี่ยนจาก <b>SETTLED</b> กลับเป็น <b>PAID</b><br>' +
          'งานจะกลับไปที่ <b>FINANCE &gt; ADVANCE</b> และออกจากหน้านี้', 'ย้อนสถานะ');
        if (!ok) return;
        try {
          await once('unsettle-' + id, () => m.settleAdvance(id, 'PAID', null, newRequestId()));
          toast('ย้อนสถานะแล้ว — งานกลับไปที่ FINANCE > ADVANCE', 'ok');
          load(); loadTabCounts();
        } catch (ex) { handleErr(ex); }
      }).catch(handleErr);
      return;
    }
    /* เคลียร์ ADVANCE — เปลี่ยนสถานะที่ Backend จริง แล้วโหลดรายการใหม่จาก server
       ไม่ลบแถวออกจาก DOM เอง · ไม่ copy object ไป array อื่น */
    if (act === 'settle') {
      const next = b.dataset.next;
      import('../invoices/invoice-api.js').then(async (m) => {
        const ok = await confirmModal('ยืนยันเปลี่ยนสถานะ Advance',
          'เปลี่ยนเป็น <b>' + esc(next) + '</b>' +
          (next === 'SETTLED' ? '<br>งานจะถูกย้ายไป FINANCE &gt; Close Job' : ''), 'ยืนยัน');
        if (!ok) return;
        try {
          await once('settle-' + id, () => m.settleAdvance(id, next, null, newRequestId()));
          toast('อัปเดตสถานะแล้ว', 'ok');
          load();
        } catch (ex) { handleErr(ex); }
      }).catch(handleErr);
      return;
    }
    /* พิมพ์ใบรับชำระเงินล่วงหน้า (FINANCE > Advance เท่านั้น)
       อ่านข้อมูลจริงจาก njacc_invoice_view ของใบ ADVANCE ใบนั้น แล้วเปิด Renderer เฉพาะ
       ไม่เรียก RPC ที่เปลี่ยนสถานะ · ไม่ออกเลขเอกสารใหม่ · ไม่แตะ Invoice/Receipt */
    if (act === 'apdoc') {
      const invId = b.dataset.inv;
      if (!invId) return;
      const advSt = b.dataset.adv || null;
      Promise.all([import('../invoices/invoice-api.js'), import('../finance/advance-doc.js')])
        .then(async ([api, doc]) => {
          const inv = await api.invoiceView(invId);
          doc.openAdvanceDoc(inv, { advanceStatus: advSt });
        }).catch(handleErr);
      return;
    }
    /* ปุ่ม "ดู" — เปิด Modal ฟอร์มงาน "ชุดเดียวกับตอนเปิดงาน" พร้อมข้อมูลเดิมครบ
         DOCUMENT + งานยังไม่มี Invoice → openNewJobModal({ jobId }) แก้ไขได้ทันที
                                          ไม่เปลี่ยน route → ปิด Modal แล้วอยู่หน้าเดิม
         งานที่ออก INVOICE แล้ว (data-locked) → หน้ารายละเอียดอ่านอย่างเดียว
         หน้าอื่น (closed = ประวัติ)          → หน้ารายละเอียดตามเดิม */
    if (act === 'view') {
      const src = mode || 'document';
      const locked = b.dataset.locked === '1';
      if (src === 'document' && !locked) {
        import('../jobs/job-form.js')
          .then(m => m.openNewJobModal({ charge, group, mode: src, jobId: id, onSaved: () => load() }))
          .catch(handleErr);
      } else {
        location.hash = '#/job/' + id + '?from=' + src;
      }
    }
    else if (act === 'edit') location.hash = '#/job/' + id + '/edit?mode=' + (mode || 'document');
    /* ACCOUNTING: ออกวางบิล = เปิด Modal เดียวจบ (DOCUMENT → วางบิล → INVOICE)
       ไม่เปลี่ยน route · ใช้ njacc_issue_invoice ตัวเดิม · ปิดแล้วรีเฟรชรายการ */
    else if (act === 'bill') {
      import('../invoices/billing-modal.js')
        .then(m => m.openBillingModal({ jobId: id, charge, onSaved: () => load() }))
        .catch(handleErr);
    }
    else if (act === 'viewinv') {
      /* ── ACCOUNTING > SERVICE / ADVANCE : เปิด "Master Invoice Form" ตัวเดียวกับ ออก INVOICE ──
         ทุก Action ในหัวข้อ "จัดการ" ที่มีหน้าที่เปิด Record ต้องมาที่ฟอร์มเดียวกัน
         billing-modal.js ตัดสินโหมดเองจากสถานะจริงที่ Backend คืน:
           ไม่มีใบ -> CREATE · DRAFT -> EDIT_EXISTING · POSTED -> VIEW_POSTED (ล็อก)
         *** ไม่ใช้ invoice-view.js / invoice-modal.js เป็น UI หลักอีกแล้ว ***
         onSaved เรียก load() ให้รายการรีเฟรชจาก server เมื่อสถานะเปลี่ยนจริง

         หน้าอื่น (DOCUMENT / closed) ยังใช้ route เดิม #/invoice/:id ไม่เปลี่ยน
         แยกด้วย mode จริงของระบบ ไม่ได้ตรวจจากข้อความหัวจอ */
      if (mode === 'accounting') {
        /* Master Form ทำงานด้วย job_id (njacc_job_detail / njacc_invoice_draft_view)
           ปุ่มต้องพก data-id มาด้วย — ถ้าไม่มีให้หยุด ไม่ยิง RPC ด้วยค่าว่าง
           (เคยพลาดตรงนี้: ปุ่มมีแต่ data-inv -> njacc_job_detail ถูกเรียกแบบไม่มีพารามิเตอร์) */
        if (!id) { toast('ไม่พบเลขที่งานของรายการนี้', 'err'); return; }
        import('../invoices/billing-modal.js')
          .then(m => m.openBillingModal({ jobId: id, charge, onSaved: () => load() }))
          .catch(handleErr);
      } else {
        /* จำหน้าที่กดมา เพื่อให้ปุ่ม "← กลับ" ในหน้า INVOICE กลับถูกหน้าจริง */
        try { sessionStorage.setItem('nj-inv-from', location.hash); } catch (_) {}
        location.hash = '#/invoice/' + b.dataset.inv;
      }
    }
    else if (act === 'note') editNote(id, b.textContent.trim() === '＋ NOTE' ? '' : b.textContent.trim(), () => load());
    else handleAction(act, id, () => load());
  });

  /* ── Topbar มุมขวาบน — ไม่มีปุ่ม "+ เปิดงาน" แล้ว ────────────────────────
     ปุ่มถูกย้ายลงไปต่อท้าย "⚙ คอลัมน์" ในแถบตัวกรอง (ดู mountColBtn ด้านบน)
     *** ล้าง #tb-act ทุกครั้ง *** เพราะ Topbar อยู่นอก #app-content และคงอยู่ข้ามหน้า
     ถ้าไม่ล้าง ปุ่มของหน้าก่อนจะค้างอยู่ -> เกิดปุ่มซ้ำ 2 จุด
     onclick ที่เคยผูกไว้ก็ต้องถอด (assign null) ไม่ให้เหลือ handler ค้าง
     doc-hd = ซ่อนบล็อกโปรไฟล์ (.tb-user) เฉพาะหน้านี้ — คงไว้ตามเดิม ไม่อยู่ในขอบเขตรอบนี้
     *** ซ่อนการแสดงผลอย่างเดียว *** ไม่แตะ AppState.profile / role / permission */
  const tbAct = document.getElementById('tb-act');
  const appShell = document.getElementById('app-shell');
  if (tbAct) {
    const isDocMode = (mode || 'document') === 'document';
    tbAct.innerHTML = '';
    tbAct.onclick = null;
    if (appShell) appShell.classList.toggle('doc-hd', isDocMode);
  }

  /* ---- toolbar ---- */
  const tools = cnt.querySelector('.ch-tools');
  if (tools) bindToolMenus(tools);
  /* delegate ที่ระดับหน้า — รองรับทั้ง toolbar (ACCOUNTING) และปุ่มในแถบตัวกรอง (DOCUMENT)
     ที่ถูก re-render ใหม่ตอนกด "ล้างตัวกรอง" */
  cnt.addEventListener('click', (e) => {
    /* #app-content ถูกใช้ซ้ำทุกหน้า → listener สะสม
       กันด้วย page marker: ให้ทำงานเฉพาะ listener ของหน้าที่แสดงอยู่จริง */
    if (cnt.dataset.chPage !== key) return;
    const b = e.target.closest('[data-tool]'); if (!b) return;
    runTool(b.dataset.tool, ctx);
  });
  const qc = cnt.querySelector('#qc-key');
  if (qc) qc.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); runTool('quick-close', ctx); }
  });

  load();
}
