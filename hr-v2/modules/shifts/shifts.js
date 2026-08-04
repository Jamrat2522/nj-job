/* HR V2 — modules/shifts/shifts.js
   njhr_shift_list / shift_save / shift_set_active / shift_assign / shift_employee_list / shift_unassigned_employees
   กฎเดิม: ปิดกะที่มีพนักงาน ต้อง p_force · เวลาพัก/สายเป็นนาที · OT เริ่มหลังเวลาที่กำหนด */
import { renderTable, badge } from '../../components/table.js';
import { field, val, requireAll, busyBtn } from '../../components/form.js';

let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  el.innerHTML =
    '<div class="shp"><div class="v2-toolbar">' +
    '<label class="v2-check" style="margin:0"><input type="checkbox" id="sh-inactive"><span>แสดงกะที่ปิดใช้</span></label>' +
    '<span class="grow"></span><button class="btn btn-primary" id="sh-add">+ เพิ่มกะ</button>' +
    '</div><div id="sh-table"></div></div>';
  const tableEl = el.querySelector('#sh-table');
  let incInactive = false;

  async function load() {
    ctx.ui.renderLoading(tableEl);
    try {
      const rows = await ctx.repo.shifts.list(incInactive);
      if (!alive) return;
      renderTable(tableEl, [
        { key: 'shift_name', label: 'ชื่อกะ' },
        { key: 'start_time', label: 'เวลา', render: r => esc(((r.start_time || '') + '').slice(0, 5)) + ' – ' + esc(((r.end_time || '') + '').slice(0, 5)) },
        { key: 'break_minutes', label: 'พัก (นาที)' },
        { key: 'late_allow_minutes', label: 'สายได้ (นาที)' },
        { key: 'emp_count', label: 'พนักงาน', render: r => esc(r.emp_count != null ? r.emp_count : '-') },
        { key: 'active', label: 'สถานะ', render: r => badge(r.active === false ? 'ปิดใช้' : 'ใช้งาน', r.active === false ? '' : 'ok') },
        { key: '_a', label: '', render: r =>
          '<button class="btn btn-ghost" data-act="assign" data-id="' + esc(r.id) + '">มอบหมาย</button> ' +
          '<button class="btn btn-ghost" data-act="edit" data-id="' + esc(r.id) + '">แก้ไข</button>' }
      ], rows, { empty: 'ยังไม่มีกะทำงาน' });
      tableEl.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', () => {
        const r = rows.find(x => String(x.id) === b.dataset.id);
        ctx.assertWrite();
        if (b.dataset.act === 'edit') openForm(r); else openAssign(r);
      }));
    } catch (e) { if (alive) ctx.ui.renderError(tableEl, 'โหลดกะไม่สำเร็จ', load, 'ลองอีกครั้ง', e.message); }
  }
  el.querySelector('#sh-inactive').addEventListener('change', function () { incInactive = this.checked; load(); });
  el.querySelector('#sh-add').addEventListener('click', () => { ctx.assertWrite(); openForm(null); });

  function openForm(r) {
    const isNew = !r; r = r || {};
    ctx.modal.open(isNew ? 'เพิ่มกะทำงาน' : 'แก้ไขกะ — ' + (r.shift_name || ''),
      field({ id: 'sf-name', label: 'ชื่อกะ', value: r.shift_name, required: true }) +
      '<div class="v2-grid2">' +
      field({ id: 'sf-start', label: 'เวลาเข้า', type: 'time', value: ((r.start_time || '') + '').slice(0, 5), required: true }) +
      field({ id: 'sf-end', label: 'เวลาออก', type: 'time', value: ((r.end_time || '') + '').slice(0, 5), required: true }) +
      field({ id: 'sf-break', label: 'พัก (นาที)', type: 'number', value: r.break_minutes != null ? r.break_minutes : 60 }) +
      field({ id: 'sf-late', label: 'อนุโลมสาย (นาที)', type: 'number', value: r.late_allow_minutes != null ? r.late_allow_minutes : 0 }) +
      field({ id: 'sf-ot', label: 'OT เริ่มหลัง (เวลา)', type: 'time', value: ((r.ot_start_after || '') + '').slice(0, 5) }) +
      '</div>',
      '<button class="btn btn-ghost" id="sf-cancel">ยกเลิก</button><button class="btn btn-primary" id="sf-save">บันทึก</button>');
    const root = document.getElementById('v2-modal-root');
    document.getElementById('sf-cancel').onclick = ctx.modal.close;
    const b = document.getElementById('sf-save');
    b.onclick = busyBtn(b, async () => {
      ctx.assertWrite();
      if (!requireAll(root, ['sf-name', 'sf-start', 'sf-end'])) return;
      try {
        await ctx.repo.shifts.save({ id: isNew ? null : r.id, shiftName: val(root, 'sf-name'),
          startTime: val(root, 'sf-start'), endTime: val(root, 'sf-end'),
          breakMinutes: Number(val(root, 'sf-break') || 0), lateAllowMinutes: Number(val(root, 'sf-late') || 0),
          otStartAfter: val(root, 'sf-ot') || null });
        ctx.modal.close(); ctx.toast.show('บันทึกกะแล้ว'); load();
      } catch (e) { ctx.toast.show(e.message || 'บันทึกไม่สำเร็จ', 'error'); }
    });
  }

  async function openAssign(r) {
    let unassigned = [];
    try { unassigned = await ctx.repo.shifts.unassigned(null, 200); } catch (_) {}
    ctx.modal.open('มอบหมายกะ — ' + (r.shift_name || ''),
      field({ id: 'as-emp', label: 'พนักงาน (ยังไม่มีกะ)', type: 'select', required: true,
        options: unassigned.map(e0 => ({ value: e0.id || e0.employee_id,
          label: (e0.emp_code || '') + ' · ' + (e0.full_name || e0.first_name || '') })) }) +
      field({ id: 'as-date', label: 'มีผลตั้งแต่วันที่', type: 'date', required: true }) +
      '<div id="as-current" style="margin-top:8px"></div>',
      '<button class="btn btn-ghost" id="as-cancel">ยกเลิก</button><button class="btn btn-primary" id="as-save">มอบหมาย</button>');
    const root = document.getElementById('v2-modal-root');
    const cur = document.getElementById('as-current');
    ctx.repo.shifts.employeeList(r.id).then(rows => {
      cur.innerHTML = '<h3 style="font-size:13.5px;margin:4px 0">พนักงานในกะนี้ (' + rows.length + ')</h3>' +
        rows.slice(0, 30).map(x => '<div class="v2-kv"><span class="k">' + esc(x.emp_code || '') + '</span>' +
        '<span class="v">' + esc(x.full_name || '') + '</span></div>').join('');
    }).catch(() => {});
    document.getElementById('as-cancel').onclick = ctx.modal.close;
    const b = document.getElementById('as-save');
    b.onclick = busyBtn(b, async () => {
      ctx.assertWrite();
      if (!requireAll(root, ['as-emp', 'as-date'])) return;
      try {
        await ctx.repo.shifts.assign(val(root, 'as-emp'), r.id, val(root, 'as-date'));
        ctx.modal.close(); ctx.toast.show('มอบหมายกะแล้ว'); load();
      } catch (e) { ctx.toast.show(e.message || 'ไม่สำเร็จ', 'error'); }
    });
  }

  load();
}

export function unmount() { alive = false; }
