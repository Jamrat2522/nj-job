/* HR V2 — modules/employees/employees.js
   njhr_emp_list / emp_get / emp_save / emp_status / emp_departments
   กฎเดิม V1: emp_code ห้ามเสียศูนย์นำหน้า (เก็บเป็น string เสมอ) · สถานะ 4 ค่า enum เดิม
   พ้นสภาพ = เปลี่ยนสถานะ RESIGNED เท่านั้น ไม่มีปุ่มลบข้อมูล */
import { renderTable, statusBadge } from '../../components/table.js';
import { field, val, requireAll, busyBtn } from '../../components/form.js';

const PAGE = 20;
let alive = false, state = null;

export function mount(el, ctx) {
  alive = true;
  state = { q: '', dept: '', status: '', page: 0 };
  const esc = ctx.ui.esc;

  el.innerHTML =
    '<div class="empp">' +
    '<div class="v2-toolbar">' +
    '<input type="search" id="emp-q" class="grow" placeholder="ค้นหา รหัส / ชื่อ / ชื่อเล่น / เบอร์">' +
    '<select id="emp-dept"><option value="">ทุกแผนก</option></select>' +
    '<select id="emp-status"><option value="">ทุกสถานะ</option>' +
    '<option value="ACTIVE">ปฏิบัติงาน</option><option value="PROBATION">ทดลองงาน</option>' +
    '<option value="RESIGNED">พ้นสภาพ</option><option value="SUSPENDED">พักงาน</option></select>' +
    '<button class="btn btn-primary" id="emp-add">+ เพิ่มพนักงาน</button>' +
    '</div><div id="emp-table"></div></div>';

  const tableEl = el.querySelector('#emp-table');

  ctx.repo.employees.departments().then(ds => {
    if (!alive) return;
    const sel = el.querySelector('#emp-dept');
    ds.forEach(d => {
      const o = document.createElement('option');
      o.value = d.id || d.dept_id || d.name; o.textContent = (d.name || d.dept_name || '') + (d.emp_count != null ? ' (' + d.emp_count + ')' : '');
      sel.appendChild(o);
    });
  }).catch(() => {});

  let deb = null, seq = 0;
  async function load() {
    const mySeq = ++seq;
    ctx.ui.renderLoading(tableEl);
    try {
      const rows = await ctx.repo.employees.list({ q: state.q || null, dept: state.dept || null,
        status: state.status || null, limit: PAGE, offset: state.page * PAGE });
      if (!alive || mySeq !== seq) return;
      const total = rows.length ? Number(rows[0].total_count || rows.length) : 0;
      renderTable(tableEl, [
        { key: 'emp_code', label: 'รหัส', width: '70px' },
        { key: 'full_name', label: 'พนักงาน', render: r => esc(r.full_name || ((r.first_name || '') + ' ' + (r.last_name || ''))) +
            (r.nickname ? ' <small style="color:#64748B">· ' + esc(r.nickname) + '</small>' : '') },
        { key: 'department', label: 'แผนก', render: r => esc(r.department || r.dept_name || '') },
        { key: 'position', label: 'ตำแหน่ง' },
        { key: 'start_date', label: 'เริ่มงาน', render: r => esc((r.start_date || '').slice(0, 10)) },
        { key: 'status', label: 'สถานะ', render: r => statusBadge(r.status || r.emp_status) }
      ], rows, {
        page: state.page, pageSize: PAGE, total,
        onPage: p => { state.page = p; load(); },
        onRow: r => openDetail(r.id),
        empty: 'ไม่พบพนักงานตามเงื่อนไข'
      });
    } catch (e) { if (alive && mySeq === seq) ctx.ui.renderError(tableEl, 'โหลดรายชื่อไม่สำเร็จ', load, 'ลองอีกครั้ง', e.message); }
  }

  el.querySelector('#emp-q').addEventListener('input', function () {
    clearTimeout(deb);
    deb = setTimeout(() => { state.q = this.value.trim(); state.page = 0; load(); }, 350);   // debounce
  });
  el.querySelector('#emp-dept').addEventListener('change', function () { state.dept = this.value; state.page = 0; load(); });
  el.querySelector('#emp-status').addEventListener('change', function () { state.status = this.value; state.page = 0; load(); });
  el.querySelector('#emp-add').addEventListener('click', () => { ctx.assertWrite(); openForm(null); });

  async function openDetail(id) {
    const close = ctx.modal.open('ข้อมูลพนักงาน', '<div id="empd"></div>',
      '<button class="btn btn-ghost" id="empd-status">เปลี่ยนสถานะ</button>' +
      '<button class="btn btn-primary" id="empd-edit">แก้ไข</button>');
    const box = document.getElementById('empd');
    ctx.ui.renderLoading(box);
    try {
      const e0 = await ctx.repo.employees.get(id);
      const kv = [
        ['รหัสพนักงาน', e0.emp_code], ['ชื่อ-นามสกุล', ((e0.prefix || '') + (e0.first_name || '') + ' ' + (e0.last_name || ''))],
        ['ชื่อเล่น', e0.nickname], ['แผนก', e0.department || e0.dept_name], ['ตำแหน่ง', e0.position],
        ['ประเภท', e0.emp_type], ['เริ่มงาน', (e0.start_date || '').slice(0, 10)],
        ['เบอร์โทร', e0.phone], ['สถานะ', e0.status || e0.emp_status],
        ['วันลาป่วย/กิจ/พักร้อน', [e0.leave_sick, e0.leave_personal, e0.leave_vacation].map(x => x == null ? '-' : x).join(' / ')]
      ];
      box.innerHTML = kv.map(x => '<div class="v2-kv"><span class="k">' + esc(x[0]) + '</span><span class="v">' +
        esc(x[1] == null ? '-' : x[1]) + '</span></div>').join('');
      document.getElementById('empd-edit').onclick = () => { ctx.assertWrite(); close(); openForm(e0); };
      document.getElementById('empd-status').onclick = () => { ctx.assertWrite(); close(); openStatus(e0); };
    } catch (e) { ctx.ui.renderError(box, 'โหลดข้อมูลไม่สำเร็จ', null, null, e.message); }
  }

  function openForm(e0) {
    const isNew = !e0; e0 = e0 || {};
    ctx.modal.open(isNew ? 'เพิ่มพนักงาน' : 'แก้ไขพนักงาน',
      '<div class="v2-grid2">' +
      field({ id: 'f-code', label: 'รหัสพนักงาน', value: e0.emp_code, required: true, disabled: !isNew }) +
      field({ id: 'f-prefix', label: 'คำนำหน้า', value: e0.prefix }) +
      field({ id: 'f-first', label: 'ชื่อ', value: e0.first_name, required: true }) +
      field({ id: 'f-last', label: 'นามสกุล', value: e0.last_name }) +
      field({ id: 'f-nick', label: 'ชื่อเล่น', value: e0.nickname }) +
      field({ id: 'f-phone', label: 'เบอร์โทร', value: e0.phone }) +
      field({ id: 'f-position', label: 'ตำแหน่ง', value: e0.position }) +
      field({ id: 'f-start', label: 'วันเริ่มงาน', type: 'date', value: (e0.start_date || '').slice(0, 10) }) +
      '</div>',
      '<button class="btn btn-ghost" id="f-cancel">ยกเลิก</button><button class="btn btn-primary" id="f-save">บันทึก</button>',
      { fullMobile: true });
    const root = document.getElementById('v2-modal-root');
    document.getElementById('f-cancel').onclick = ctx.modal.close;
    const saveBtn = document.getElementById('f-save');
    saveBtn.onclick = busyBtn(saveBtn, async () => {
      ctx.assertWrite();
      if (!requireAll(root, ['f-code', 'f-first'])) return;
      const data = {
        emp_code: String(val(root, 'f-code')),          // string เสมอ — ศูนย์นำหน้าไม่หาย
        prefix: val(root, 'f-prefix') || null, first_name: val(root, 'f-first'),
        last_name: val(root, 'f-last') || null, nickname: val(root, 'f-nick') || null,
        phone: val(root, 'f-phone') || null, position: val(root, 'f-position') || null,
        start_date: val(root, 'f-start') || null
      };
      try {
        await ctx.repo.employees.save(isNew ? null : e0.id, data);   // ตรวจซ้ำ/สิทธิ์ที่ RPC
        ctx.modal.close(); ctx.toast.show('บันทึกพนักงานแล้ว'); load();
      } catch (e) { ctx.toast.show(e.message || 'บันทึกไม่สำเร็จ', 'error'); }
    });
  }

  function openStatus(e0) {
    ctx.modal.open('เปลี่ยนสถานะ — ' + (e0.first_name || e0.emp_code),
      field({ id: 's-status', label: 'สถานะใหม่', type: 'select', value: e0.status || e0.emp_status, options: [
        { value: 'ACTIVE', label: 'ปฏิบัติงาน' }, { value: 'PROBATION', label: 'ทดลองงาน' },
        { value: 'SUSPENDED', label: 'พักงาน' }, { value: 'RESIGNED', label: 'พ้นสภาพ (ไม่ลบข้อมูล)' }] }) +
      field({ id: 's-date', label: 'วันพ้นสภาพ (เมื่อเลือกพ้นสภาพ)', type: 'date' }) +
      field({ id: 's-note', label: 'หมายเหตุ', type: 'textarea' }),
      '<button class="btn btn-ghost" id="s-cancel">ยกเลิก</button><button class="btn btn-danger" id="s-save">ยืนยัน</button>');
    const root = document.getElementById('v2-modal-root');
    document.getElementById('s-cancel').onclick = ctx.modal.close;
    const b = document.getElementById('s-save');
    b.onclick = busyBtn(b, async () => {
      ctx.assertWrite();
      try {
        await ctx.repo.employees.setStatus(e0.id, val(root, 's-status'), val(root, 's-date') || null, val(root, 's-note') || null);
        ctx.modal.close(); ctx.toast.show('เปลี่ยนสถานะแล้ว'); load();
      } catch (e) { ctx.toast.show(e.message || 'ไม่สำเร็จ', 'error'); }
    });
  }

  load();
}

export function unmount() { alive = false; }
