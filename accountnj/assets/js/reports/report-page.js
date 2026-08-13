/* REPORT รวมทุก charge/group — invoice-based ตาม njacc_report (server-side filter/paginate) */
import { fetchReport } from './report-api.js';
import { reportRowHTML, reportKpiHTML } from './report-views.js';
import { masters, customerOpts } from '../master/master-cache.js';
import { renderPagination } from '../components/pagination.js';
import { can } from '../core/permissions.js';
import { nextToken, isCurrent } from '../core/request-manager.js';
import { handleErr } from '../core/error-handler.js';
import { COMPANY_GROUPS, CHARGE_TYPES } from '../config/charge-groups.js';

const st = { charge_type: '', company_group: '', customer_id: '', status: '',
  payment_status: '', from: '', to: '', page: 1, size: 20 };

export async function render(cnt) {
  await masters();
  cnt.innerHTML = `
    <div class="page-head"><div class="page-title"><span class="dot"></span><h2>REPORT</h2></div></div>
    <div id="rep-kpi"><div class="kpi-row">${'<div class="kpi"><div class="skel"></div></div>'.repeat(6)}</div></div>
    <div class="fbar">
      <select class="sel" data-f="charge_type"><option value="">ทุกประเภท</option>
        ${CHARGE_TYPES.map(c => `<option value="${c.key}" ${st.charge_type === c.key ? 'selected' : ''}>${c.label}</option>`).join('')}</select>
      <select class="sel" data-f="company_group"><option value="">ทุกบริษัท</option>
        ${COMPANY_GROUPS.map(g => `<option value="${g.key}" ${st.company_group === g.key ? 'selected' : ''}>${g.label}</option>`).join('')}</select>
      <select class="sel" data-f="customer_id">${customerOpts(st.customer_id)}</select>
      <select class="sel" data-f="status"><option value="">สถานะ INVOICE ทั้งหมด</option>
        <option value="ISSUED" ${st.status === 'ISSUED' ? 'selected' : ''}>ISSUED</option>
        <option value="VOID" ${st.status === 'VOID' ? 'selected' : ''}>VOID</option></select>
      <select class="sel" data-f="payment_status"><option value="">สถานะชำระทั้งหมด</option>
        <option value="UNPAID" ${st.payment_status === 'UNPAID' ? 'selected' : ''}>ยังไม่ชำระ</option>
        <option value="PARTIAL" ${st.payment_status === 'PARTIAL' ? 'selected' : ''}>บางส่วน</option>
        <option value="PAID" ${st.payment_status === 'PAID' ? 'selected' : ''}>ครบ</option></select>
      <input class="inp" type="date" data-f="from" value="${st.from}" title="วันที่ INVOICE ตั้งแต่">
      <input class="inp" type="date" data-f="to" value="${st.to}" title="ถึงวันที่">
      <button class="btn btn-p btn-sm" id="rep-go">แสดงรายงาน</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th>วันที่ INV</th><th>ประเภท</th><th>INVOICE</th><th>เลขงาน</th><th>ลูกค้า</th><th>สถานะ</th>
      <th class="r">ก่อน VAT</th><th class="r">VAT</th><th class="r">WHT</th>
      <th class="r">ยอดรวม</th><th class="r">รับแล้ว</th><th class="r">คงค้าง</th><th>Due</th>
    </tr></thead><tbody id="rep-tbody"><tr><td colspan="13" class="load-row"><div class="spin"></div></td></tr></tbody>
    </table></div><div class="card mt-2" id="rep-pgn"></div>
    ${can('export') ? '<p class="t-xs t-3 mt-1">* Export Excel จะเพิ่มใน Release ถัดไป (โครงสร้าง lazy-loader เตรียมไว้แล้ว)</p>' : ''}`;

  async function load() {
    const t = nextToken('report');
    try {
      const res = await fetchReport({
        charge_type: st.charge_type || null, company_group: st.company_group || null,
        customer_id: st.customer_id || null, status: st.status || null,
        payment_status: st.payment_status || null, from: st.from || null, to: st.to || null,
        page: st.page, size: st.size });
      if (!isCurrent('report', t)) return;
      cnt.querySelector('#rep-kpi').innerHTML = reportKpiHTML(res.kpi || {});
      const rows = res.rows || [];
      cnt.querySelector('#rep-tbody').innerHTML = rows.length
        ? rows.map(reportRowHTML).join('')
        : '<tr><td colspan="13" class="empty">ไม่มีข้อมูลตามเงื่อนไข — INVOICE จะปรากฏที่นี่หลังบัญชีออกบิล</td></tr>';
      renderPagination(cnt.querySelector('#rep-pgn'), { page: st.page, size: st.size, total: res.total || 0 },
        ({ page, size }) => { st.page = page; st.size = size; load(); });
    } catch (e) { if (isCurrent('report', t)) handleErr(e); }
  }
  cnt.querySelector('#rep-go').onclick = () => {
    cnt.querySelectorAll('[data-f]').forEach(el => st[el.dataset.f] = el.value);
    st.page = 1; load();
  };
  load();
}
