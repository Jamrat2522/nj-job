/* HR V2 — modules/hrdocs/hrdocs.js
   ศูนย์เอกสาร HR: njhr_doc_center_list / doc_detail / doc_save / doc_respond / doc_view
   EMPLOYEE เห็นเฉพาะเอกสารของตัวเอง (กรองที่ RPC) · การอนุมัติ/ปฏิเสธผ่าน doc_respond ตามลำดับเดิม */
import { renderTable, statusBadge } from '../../components/table.js';
import { field, val, requireAll, busyBtn } from '../../components/form.js';

const DOC_TYPES = [
  { value: 'CERT_EMPLOYMENT', label: 'หนังสือรับรองการทำงาน' },
  { value: 'CERT_SALARY', label: 'หนังสือรับรองเงินเดือน' },
  { value: 'WARNING', label: 'หนังสือเตือน' },
  { value: 'CONTRACT', label: 'สัญญาจ้าง' },
  { value: 'OTHER', label: 'อื่น ๆ' }
];
let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  const canCreate = ['SUPER_ADMIN', 'ADMIN', 'HR'].indexOf(ctx.session.role) >= 0;
  el.innerHTML =
    '<div class="hdp"><div class="v2-toolbar">' +
    '<input type="search" id="hd-q" class="grow" placeholder="ค้นหาเอกสาร">' +
    '<select id="hd-status"><option value="">ทุกสถานะ</option><option value="PENDING">รออนุมัติ</option>' +
    '<option value="APPROVED">อนุมัติแล้ว</option><option value="REJECTED">ไม่อนุมัติ</option></select>' +
    (canCreate ? '<button class="btn btn-primary" id="hd-add">+ สร้างเอกสาร</button>' : '') +
    '</div><div id="hd-table"></div></div>';
  const tableEl = el.querySelector('#hd-table');
  let q = '', status = '', page = 0, deb = null;
  const PAGE = 15;

  async function load() {
    ctx.ui.renderLoading(tableEl);
    try {
      const rows = await ctx.repo.hrdocs.centerList({ q: q || null, status: status || null, limit: PAGE, offset: page * PAGE });
      if (!alive) return;
      const total = rows.length ? Number(rows[0].total_count || rows.length) : 0;
      renderTable(tableEl, [
        { key: 'doc_no', label: 'เลขที่', render: r => esc(r.doc_no || '-') },
        { key: 'title', label: 'เรื่อง' },
        { key: 'doc_type', label: 'ประเภท', render: r => esc((DOC_TYPES.find(t => t.value === r.doc_type) || {}).label || r.doc_type || '') },
        { key: 'emp_name', label: 'พนักงาน', render: r => esc(r.emp_name || r.full_name || '-') },
        { key: 'created_at', label: 'วันที่', render: r => esc((r.created_at || '').slice(0, 10)) },
        { key: 'status', label: 'สถานะ', render: r => statusBadge(r.status) }
      ], rows, {
        page, pageSize: PAGE, total, onPage: p => { page = p; load(); },
        onRow: r => openDetail(r.id), empty: 'ไม่มีเอกสาร'
      });
    } catch (e) { if (alive) ctx.ui.renderError(tableEl, 'โหลดเอกสารไม่สำเร็จ', load, 'ลองอีกครั้ง', e.message); }
  }
  el.querySelector('#hd-q').addEventListener('input', function () {
    clearTimeout(deb); deb = setTimeout(() => { q = this.value.trim(); page = 0; load(); }, 350);
  });
  el.querySelector('#hd-status').addEventListener('change', function () { status = this.value; page = 0; load(); });
  const addBtn = el.querySelector('#hd-add');
  if (addBtn) addBtn.addEventListener('click', () => { ctx.assertWrite(); openForm(); });

  async function openForm() {
    let emps = [], approvers = [];
    try {
      [emps, approvers] = await Promise.all([
        ctx.repo.employees.list({ limit: 200, offset: 0 }),
        ctx.repo.hrdocs.approvers(null, 50).catch(() => [])
      ]);
    } catch (e) { ctx.toast.show('โหลดข้อมูลประกอบไม่สำเร็จ: ' + e.message, 'error'); return; }
    ctx.modal.open('สร้างเอกสาร HR',
      field({ id: 'df-type', label: 'ประเภทเอกสาร', type: 'select', options: DOC_TYPES }) +
      field({ id: 'df-title', label: 'เรื่อง', required: true }) +
      field({ id: 'df-emp', label: 'พนักงาน', type: 'select',
        options: [{ value: '', label: '— ไม่ระบุ —' }].concat(emps.map(e0 =>
          ({ value: e0.id, label: (e0.emp_code || '') + ' · ' + (e0.full_name || e0.first_name || '') }))) }) +
      field({ id: 'df-approver', label: 'ผู้อนุมัติ', type: 'select',
        options: [{ value: '', label: '— ตามลำดับอัตโนมัติ —' }].concat(approvers.map(a =>
          ({ value: a.user_id || a.id, label: (a.username || '') + (a.emp_name ? ' · ' + a.emp_name : '') }))) }) +
      field({ id: 'df-eff', label: 'วันที่มีผล', type: 'date' }) +
      field({ id: 'df-body', label: 'เนื้อหา', type: 'textarea', rows: 5 }),
      '<button class="btn btn-ghost" id="df-cancel">ยกเลิก</button><button class="btn btn-primary" id="df-save">บันทึกเอกสาร</button>',
      { fullMobile: true });
    const root = document.getElementById('v2-modal-root');
    document.getElementById('df-cancel').onclick = ctx.modal.close;
    const b = document.getElementById('df-save');
    b.onclick = busyBtn(b, async () => {
      ctx.assertWrite();
      if (!requireAll(root, ['df-title'])) return;
      try {
        await ctx.repo.hrdocs.save({ type: val(root, 'df-type'), title: val(root, 'df-title'),
          employee: val(root, 'df-emp') || null, approver: val(root, 'df-approver') || null,
          effectiveDate: val(root, 'df-eff') || null, body: val(root, 'df-body') || null });
        ctx.modal.close(); ctx.toast.show('บันทึกเอกสารแล้ว'); load();
      } catch (e) { ctx.toast.show(e.message || 'บันทึกไม่สำเร็จ', 'error'); }
    });
  }

  async function openDetail(id) {
    ctx.modal.open('รายละเอียดเอกสาร', '<div id="hdd"></div>', '<span id="hdd-foot"></span>');
    const box = document.getElementById('hdd');
    ctx.ui.renderLoading(box);
    try {
      const d = await ctx.repo.hrdocs.detail(id);
      ctx.repo.hrdocs.view(id, null).catch(() => {});   // บันทึกการเปิดอ่าน (audit เดิม)
      box.innerHTML =
        '<div class="v2-kv"><span class="k">เลขที่</span><span class="v">' + esc(d.doc_no || '-') + '</span></div>' +
        '<div class="v2-kv"><span class="k">เรื่อง</span><span class="v">' + esc(d.title || '') + '</span></div>' +
        '<div class="v2-kv"><span class="k">พนักงาน</span><span class="v">' + esc(d.emp_name || '-') + '</span></div>' +
        '<div class="v2-kv"><span class="k">สถานะ</span><span class="v">' + statusBadge(d.status) + '</span></div>' +
        (d.body ? '<div style="white-space:pre-wrap;border:1px solid var(--v2-line);border-radius:8px;padding:12px;margin-top:10px;font-size:14px">' + esc(d.body) + '</div>' : '');
      if (d.status === 'PENDING' && d.can_respond) {
        document.getElementById('hdd-foot').innerHTML =
          '<button class="btn btn-danger" id="hdd-no">ปฏิเสธ</button> <button class="btn btn-primary" id="hdd-yes">อนุมัติ</button>';
        const go = (action) => async () => {
          ctx.assertWrite();
          try { await ctx.repo.hrdocs.respond({ id, action }); ctx.modal.close(); ctx.toast.show('บันทึกผลแล้ว'); load(); }
          catch (e) { ctx.toast.show(e.message || 'ไม่สำเร็จ', 'error'); }
        };
        document.getElementById('hdd-yes').onclick = go('APPROVE');
        document.getElementById('hdd-no').onclick = go('REJECT');
      }
    } catch (e) { ctx.ui.renderError(box, 'โหลดเอกสารไม่สำเร็จ', null, null, e.message); }
  }

  load();
}

export function unmount() { alive = false; }
