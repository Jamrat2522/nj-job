/* HR V2 — modules/departments/departments.js
   njhr_dept_list / dept_save / dept_delete (p_confirm ตามกฎเดิม) / dept_employees / dept_move / dept_health */
import { renderTable } from '../../components/table.js';
import { field, val, requireAll, busyBtn } from '../../components/form.js';

let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  el.innerHTML =
    '<div class="deptp">' +
    '<div class="v2-toolbar">' +
    '<input type="search" id="dp-q" class="grow" placeholder="ค้นหาแผนก">' +
    '<button class="btn btn-primary" id="dp-add">+ เพิ่มแผนก</button>' +
    '</div><div id="dp-table"></div></div>';
  const tableEl = el.querySelector('#dp-table');
  let q = '', deb = null, seq = 0;

  async function load() {
    const my = ++seq;
    ctx.ui.renderLoading(tableEl);
    try {
      const rows = await ctx.repo.departments.list(q || null);
      if (!alive || my !== seq) return;
      renderTable(tableEl, [
        { key: 'code', label: 'รหัส', width: '90px' },
        { key: 'name', label: 'ชื่อแผนก' },
        { key: 'emp_count', label: 'พนักงาน', render: r => esc(r.emp_count != null ? r.emp_count : '-') },
        { key: '_a', label: 'จัดการ', render: r =>
          '<button class="btn btn-ghost" data-act="mem" data-id="' + esc(r.id) + '">รายชื่อ</button> ' +
          '<button class="btn btn-ghost" data-act="edit" data-id="' + esc(r.id) + '">แก้ไข</button> ' +
          '<button class="btn btn-ghost" data-act="del" data-id="' + esc(r.id) + '">ลบ</button>' }
      ], rows, { empty: 'ยังไม่มีแผนก' });
      tableEl.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', () => {
        const r = rows.find(x => String(x.id) === b.dataset.id);
        if (b.dataset.act === 'mem') openMembers(r);
        else if (b.dataset.act === 'edit') { ctx.assertWrite(); openForm(r); }
        else { ctx.assertWrite(); askDelete(r); }
      }));
    } catch (e) { if (alive && my === seq) ctx.ui.renderError(tableEl, 'โหลดแผนกไม่สำเร็จ', load, 'ลองอีกครั้ง', e.message); }
  }

  el.querySelector('#dp-q').addEventListener('input', function () {
    clearTimeout(deb); deb = setTimeout(() => { q = this.value.trim(); load(); }, 350);
  });
  el.querySelector('#dp-add').addEventListener('click', () => { ctx.assertWrite(); openForm(null); });

  function openForm(r) {
    const isNew = !r; r = r || {};
    ctx.modal.open(isNew ? 'เพิ่มแผนก' : 'แก้ไขแผนก',
      field({ id: 'dpf-code', label: 'รหัสแผนก', value: r.code, required: true }) +
      field({ id: 'dpf-name', label: 'ชื่อแผนก', value: r.name, required: true }),
      '<button class="btn btn-ghost" id="dpf-cancel">ยกเลิก</button><button class="btn btn-primary" id="dpf-save">บันทึก</button>');
    const root = document.getElementById('v2-modal-root');
    document.getElementById('dpf-cancel').onclick = ctx.modal.close;
    const b = document.getElementById('dpf-save');
    b.onclick = busyBtn(b, async () => {
      ctx.assertWrite();
      if (!requireAll(root, ['dpf-code', 'dpf-name'])) return;
      try {
        await ctx.repo.departments.save(isNew ? null : r.id, val(root, 'dpf-code'), val(root, 'dpf-name'));
        ctx.modal.close(); ctx.toast.show('บันทึกแผนกแล้ว'); load();
      } catch (e) { ctx.toast.show(e.message || 'บันทึกไม่สำเร็จ', 'error'); }
    });
  }

  function askDelete(r) {
    /* RPC ฝั่งเซิร์ฟเวอร์บล็อกลบแผนกที่ยังมีพนักงานเอง (กฎเดิม) — หน้าจอยืนยันชื่อชัดเจน */
    ctx.modal.confirm('ลบแผนก', 'ยืนยันลบแผนก "' + (r.name || '') + '" (รหัส ' + (r.code || '') + ') ใช่หรือไม่ ' +
      'ระบบจะไม่ลบถ้ายังมีพนักงานอยู่ในแผนก', 'ลบแผนก', async () => {
      try {
        await ctx.repo.departments.del(r.id, true);
        ctx.toast.show('ลบแผนกแล้ว'); load();
      } catch (e) { ctx.toast.show(e.message || 'ลบไม่สำเร็จ', 'error'); }
    }, true);
  }

  async function openMembers(r) {
    ctx.modal.open('พนักงานในแผนก — ' + (r.name || ''), '<div id="dpm"></div>');
    const box = document.getElementById('dpm');
    ctx.ui.renderLoading(box);
    try {
      const rows = await ctx.repo.departments.employees(r.id, null, 100);
      if (!rows.length) return ctx.ui.renderEmpty(box, 'ไม่มีพนักงานในแผนกนี้');
      box.innerHTML = rows.map(x => '<div class="v2-kv"><span class="k">' + esc(x.emp_code || '') + '</span>' +
        '<span class="v">' + esc(x.full_name || ((x.first_name || '') + ' ' + (x.last_name || ''))) + '</span></div>').join('');
    } catch (e) { ctx.ui.renderError(box, 'โหลดรายชื่อไม่สำเร็จ', null, null, e.message); }
  }

  load();
}

export function unmount() { alive = false; }
