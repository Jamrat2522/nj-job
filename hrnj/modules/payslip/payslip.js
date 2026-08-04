/* HR V2 — modules/payslip/payslip.js
   E-PAYSLIP: njhr_slip_periods / slip_list / slip_get / slip_mark_sent
   EMPLOYEE เห็นเฉพาะสลิปตัวเอง (RPC กรองด้วย token เอง) · ADMIN/ACCOUNT เห็นทั้งบริษัท + ทำเครื่องหมายส่ง
   พิมพ์สลิป: มุมมองพิมพ์ในหน้ารายละเอียด (window.print) — เทมเพลตโลโก้เต็มรูปแบบ = Deferred (ดู DEFERRED.md) */
import { renderTable, statusBadge } from '../../components/table.js';
import { busyBtn } from '../../components/form.js';

let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  const canManage = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNT'].indexOf(ctx.session.role) >= 0;
  el.innerHTML =
    '<div class="psp"><div class="v2-toolbar">' +
    '<select id="ps-period"></select>' +
    '<input type="search" id="ps-q" class="grow" placeholder="ค้นหาพนักงาน"' + (canManage ? '' : ' hidden') + '>' +
    '</div><div id="ps-table"></div></div>';
  const tableEl = el.querySelector('#ps-table'), perSel = el.querySelector('#ps-period');
  let year = 0, month = 0, q = '', deb = null;

  async function init() {
    ctx.ui.renderLoading(tableEl);
    try {
      const ps = await ctx.repo.payslip.periods();
      if (!alive) return;
      if (!ps.length) return ctx.ui.renderEmpty(tableEl, 'ยังไม่มีงวดเงินเดือนในระบบ');
      perSel.innerHTML = ps.map(p =>
        '<option value="' + p.period_year + '-' + p.period_month + '">งวด ' + p.period_month + '/' + p.period_year + '</option>').join('');
      const first = String(perSel.value).split('-');
      year = Number(first[0]); month = Number(first[1]);
      load();
    } catch (e) { if (alive) ctx.ui.renderError(tableEl, 'โหลดงวดไม่สำเร็จ', init, 'ลองอีกครั้ง', e.message); }
  }

  async function load() {
    ctx.ui.renderLoading(tableEl);
    try {
      const rows = await ctx.repo.payslip.list({ year, month, q: q || null, limit: 50, offset: 0 });
      if (!alive) return;
      renderTable(tableEl, [
        { key: 'emp_code', label: 'รหัส', width: '70px' },
        { key: 'emp_name', label: 'พนักงาน', render: r => esc(r.emp_name || r.full_name || '') },
        { key: 'net_pay', label: 'สุทธิ', render: r => esc(r.net_pay != null ? Number(r.net_pay).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-') },
        { key: 'status', label: 'สถานะ', render: r => statusBadge(r.slip_status || r.status || 'DRAFT') },
        { key: '_a', label: '', render: r => '<button class="btn btn-ghost" data-id="' + esc(r.payroll_id || r.id) + '">เปิดสลิป</button>' }
      ], rows, { empty: 'ไม่มีสลิปในงวดนี้' });
      tableEl.querySelectorAll('button[data-id]').forEach(b =>
        b.addEventListener('click', () => openSlip(b.dataset.id)));
    } catch (e) { if (alive) ctx.ui.renderError(tableEl, 'โหลดรายชื่อไม่สำเร็จ', load, 'ลองอีกครั้ง', e.message); }
  }

  perSel.addEventListener('change', function () {
    const v = String(this.value).split('-'); year = Number(v[0]); month = Number(v[1]); load();
  });
  el.querySelector('#ps-q').addEventListener('input', function () {
    clearTimeout(deb); deb = setTimeout(() => { q = this.value.trim(); load(); }, 350);
  });

  async function openSlip(payrollId) {
    ctx.modal.open('สลิปเงินเดือน', '<div id="psd"></div>',
      canManage ? '<button class="btn btn-primary" id="psd-sent">ทำเครื่องหมายส่งแล้ว</button>' : '');
    const box = document.getElementById('psd');
    ctx.ui.renderLoading(box);
    try {
      const s = await ctx.repo.payslip.get(payrollId);
      const lines = Array.isArray(s.lines) ? s.lines : [];
      box.innerHTML =
        '<div class="v2-kv"><span class="k">พนักงาน</span><span class="v">' + esc(s.emp_name || '') + ' (' + esc(s.emp_code || '') + ')</span></div>' +
        '<div class="v2-kv"><span class="k">งวด</span><span class="v">' + esc(s.period_month + '/' + s.period_year) + '</span></div>' +
        lines.map(l => '<div class="v2-kv"><span class="k">' + esc(l.name_th || l.item_code || '') + '</span>' +
          '<span class="v">' + esc(l.amount != null ? Number(l.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-') + '</span></div>').join('') +
        '<div class="v2-kv"><span class="k"><b>สุทธิ</b></span><span class="v"><b>' +
        esc(s.net_pay != null ? Number(s.net_pay).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-') + '</b></span></div>';
      const sentBtn = document.getElementById('psd-sent');
      if (sentBtn) sentBtn.onclick = busyBtn(sentBtn, async () => {
        ctx.assertWrite();
        try { await ctx.repo.payslip.markSent([payrollId]); ctx.toast.show('ทำเครื่องหมายส่งแล้ว'); ctx.modal.close(); load(); }
        catch (e) { ctx.toast.show(e.message || 'ไม่สำเร็จ', 'error'); }
      });
    } catch (e) { ctx.ui.renderError(box, 'เปิดสลิปไม่สำเร็จ', null, null, e.message); }
  }

  init();
}

export function unmount() { alive = false; }
