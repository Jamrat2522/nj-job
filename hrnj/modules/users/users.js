/* HR V2 — modules/users/users.js
   njhr_list_users / user_save / user_link / user_password / user_candidates
   กฎเดิม: ปิดใช้งาน user = is_active=false ไม่ลบประวัติ · เชื่อม employee ด้วย id จริงเท่านั้น */
import { renderTable, badge } from '../../components/table.js';
import { field, val, requireAll, busyBtn } from '../../components/form.js';

let alive = false;
const ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR', 'ACCOUNT', 'MANAGER', 'EMPLOYEE'];

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  el.innerHTML =
    '<div class="usp"><div class="v2-toolbar">' +
    '<input type="search" id="us-q" class="grow" placeholder="ค้นหาชื่อผู้ใช้ / พนักงาน">' +
    '<select id="us-role"><option value="">ทุก Role</option>' + ROLES.map(r => '<option>' + r + '</option>').join('') + '</select>' +
    '<button class="btn btn-primary" id="us-add">+ เพิ่มผู้ใช้</button>' +
    '</div><div id="us-table"></div></div>';
  const tableEl = el.querySelector('#us-table');
  let q = '', role = '', deb = null;

  async function load() {
    ctx.ui.renderLoading(tableEl);
    try {
      const rows = await ctx.repo.users.list({ q: q || null, role: role || null, limit: 30, offset: 0 });
      if (!alive) return;
      renderTable(tableEl, [
        { key: 'username', label: 'ชื่อผู้ใช้' },
        { key: 'role', label: 'Role', render: r => badge(r.role, r.role === 'SUPER_ADMIN' ? 'err' : 'info') },
        { key: 'emp_name', label: 'พนักงานที่เชื่อม', render: r => esc(r.emp_name || r.full_name || '-') },
        { key: 'is_active', label: 'สถานะ', render: r => badge(r.is_active === false ? 'ปิดใช้งาน' : 'ใช้งาน', r.is_active === false ? 'err' : 'ok') },
        { key: '_a', label: '', render: r =>
          '<button class="btn btn-ghost" data-act="edit" data-id="' + esc(r.user_id || r.id) + '">แก้ไข</button> ' +
          '<button class="btn btn-ghost" data-act="pw" data-id="' + esc(r.user_id || r.id) + '">รหัสผ่าน</button>' }
      ], rows, { empty: 'ไม่พบผู้ใช้' });
      tableEl.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', () => {
        const r = rows.find(x => String(x.user_id || x.id) === b.dataset.id);
        ctx.assertWrite();
        if (b.dataset.act === 'edit') openForm(r); else openPassword(r);
      }));
    } catch (e) { if (alive) ctx.ui.renderError(tableEl, 'โหลดผู้ใช้ไม่สำเร็จ', load, 'ลองอีกครั้ง', e.message); }
  }
  el.querySelector('#us-q').addEventListener('input', function () {
    clearTimeout(deb); deb = setTimeout(() => { q = this.value.trim(); load(); }, 350);
  });
  el.querySelector('#us-role').addEventListener('change', function () { role = this.value; load(); });
  el.querySelector('#us-add').addEventListener('click', () => { ctx.assertWrite(); openForm(null); });

  async function openForm(r) {
    const isNew = !r; r = r || {};
    let cands = [];
    try { cands = await ctx.repo.users.candidates(null, r.employee_id || null, 200); } catch (_) {}
    ctx.modal.open(isNew ? 'เพิ่มผู้ใช้' : 'แก้ไขผู้ใช้ — ' + (r.username || ''),
      field({ id: 'uf-username', label: 'ชื่อผู้ใช้', value: r.username, required: true, disabled: !isNew }) +
      (isNew ? field({ id: 'uf-password', label: 'รหัสผ่านเริ่มต้น', type: 'password', required: true }) : '') +
      field({ id: 'uf-role', label: 'Role', type: 'select', value: r.role || 'EMPLOYEE',
        options: ROLES.map(x => ({ value: x, label: x })) }) +
      field({ id: 'uf-emp', label: 'เชื่อมพนักงาน', type: 'select', value: r.employee_id || '',
        options: [{ value: '', label: '— ไม่เชื่อม —' }].concat(cands.map(c =>
          ({ value: c.id || c.employee_id, label: (c.emp_code || '') + ' · ' + (c.full_name || c.first_name || '') }))) }) +
      '<label class="v2-check"><input type="checkbox" id="uf-active"' + (r.is_active === false ? '' : ' checked') +
      '><span>เปิดใช้งาน (ปิด = ห้ามเข้าระบบ ไม่ลบประวัติ)</span></label>',
      '<button class="btn btn-ghost" id="uf-cancel">ยกเลิก</button><button class="btn btn-primary" id="uf-save">บันทึก</button>');
    const root = document.getElementById('v2-modal-root');
    document.getElementById('uf-cancel').onclick = ctx.modal.close;
    const b = document.getElementById('uf-save');
    b.onclick = busyBtn(b, async () => {
      ctx.assertWrite();
      if (!requireAll(root, ['uf-username'].concat(isNew ? ['uf-password'] : []))) return;
      try {
        await ctx.repo.users.save({ userId: isNew ? null : (r.user_id || r.id),
          username: val(root, 'uf-username'), password: isNew ? val(root, 'uf-password') : null,
          role: val(root, 'uf-role'), employee: val(root, 'uf-emp') || null,
          isActive: root.querySelector('#uf-active').checked });
        ctx.modal.close(); ctx.toast.show('บันทึกผู้ใช้แล้ว'); load();
      } catch (e) { ctx.toast.show(e.message || 'บันทึกไม่สำเร็จ', 'error'); }
    });
  }

  function openPassword(r) {
    ctx.modal.open('ตั้งรหัสผ่านใหม่ — ' + (r.username || ''),
      field({ id: 'pw-new', label: 'รหัสผ่านใหม่', type: 'password', required: true }),
      '<button class="btn btn-ghost" id="pw-cancel">ยกเลิก</button><button class="btn btn-danger" id="pw-save">ตั้งรหัสผ่าน</button>');
    const root = document.getElementById('v2-modal-root');
    document.getElementById('pw-cancel').onclick = ctx.modal.close;
    const b = document.getElementById('pw-save');
    b.onclick = busyBtn(b, async () => {
      ctx.assertWrite();
      if (!requireAll(root, ['pw-new'])) return;
      try {
        await ctx.repo.users.password(r.user_id || r.id, val(root, 'pw-new'));
        ctx.modal.close(); ctx.toast.show('ตั้งรหัสผ่านใหม่แล้ว');
      } catch (e) { ctx.toast.show(e.message || 'ไม่สำเร็จ', 'error'); }
    });
  }

  load();
}

export function unmount() { alive = false; }
