/* HR V2 — modules/payroll/items.js
   Master รายการเงินเดือน: njhr_pay_items / pay_item_save / pay_item_delete / pay_item_reorder
   kind: INCOME/DEDUCT · calc_type: FIXED/PERCENT/MANUAL (ตามโครง 43_pay_items.sql — สูตรอยู่ที่ RPC) */
import { renderTable, badge } from '../../components/table.js';
import { field, val, requireAll, busyBtn } from '../../components/form.js';

let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  el.innerHTML =
    '<div class="pip"><div class="v2-toolbar">' +
    '<input type="search" id="pi-q" class="grow" placeholder="ค้นหารายการ">' +
    '<select id="pi-kind"><option value="">ทุกประเภท</option>' +
    '<option value="INCOME">รายได้</option><option value="DEDUCT">รายการหัก</option></select>' +
    '<button class="btn btn-primary" id="pi-add">+ เพิ่มรายการ</button>' +
    '</div><div id="pi-table"></div></div>';
  const tableEl = el.querySelector('#pi-table');
  let q = '', kind = '', deb = null;

  async function load() {
    ctx.ui.renderLoading(tableEl);
    try {
      const rows = await ctx.repo.payroll.items({ q: q || null, kind: kind || null });
      if (!alive) return;
      renderTable(tableEl, [
        { key: 'code', label: 'รหัส', width: '80px' },
        { key: 'name_th', label: 'ชื่อรายการ' },
        { key: 'kind', label: 'ประเภท', render: r => badge(r.kind === 'INCOME' ? 'รายได้' : 'รายการหัก', r.kind === 'INCOME' ? 'ok' : 'err') },
        { key: 'calc_type', label: 'วิธีคำนวณ' },
        { key: 'active', label: 'สถานะ', render: r => badge(r.active === false ? 'ปิดใช้' : 'ใช้งาน', r.active === false ? '' : 'ok') },
        { key: '_a', label: '', render: r => '<button class="btn btn-ghost" data-c="' + esc(r.code) + '">แก้ไข</button>' }
      ], rows, { empty: 'ยังไม่มีรายการเงินเดือน' });
      tableEl.querySelectorAll('button[data-c]').forEach(b => b.addEventListener('click', () => {
        ctx.assertWrite(); openForm(rows.find(x => x.code === b.dataset.c));
      }));
    } catch (e) { if (alive) ctx.ui.renderError(tableEl, 'โหลดรายการไม่สำเร็จ', load, 'ลองอีกครั้ง', e.message); }
  }
  el.querySelector('#pi-q').addEventListener('input', function () {
    clearTimeout(deb); deb = setTimeout(() => { q = this.value.trim(); load(); }, 350);
  });
  el.querySelector('#pi-kind').addEventListener('change', function () { kind = this.value; load(); });
  el.querySelector('#pi-add').addEventListener('click', () => { ctx.assertWrite(); openForm(null); });

  function openForm(r) {
    const isNew = !r; r = r || {};
    ctx.modal.open(isNew ? 'เพิ่มรายการเงินเดือน' : 'แก้ไขรายการ — ' + (r.code || ''),
      '<div class="v2-grid2">' +
      field({ id: 'pf-code', label: 'รหัส', value: r.code, required: true, disabled: !isNew }) +
      field({ id: 'pf-name', label: 'ชื่อรายการ (ไทย)', value: r.name_th, required: true }) +
      field({ id: 'pf-kind', label: 'ประเภท', type: 'select', value: r.kind || 'INCOME',
        options: [{ value: 'INCOME', label: 'รายได้' }, { value: 'DEDUCT', label: 'รายการหัก' }] }) +
      field({ id: 'pf-calc', label: 'วิธีคำนวณ', type: 'select', value: r.calc_type || 'MANUAL',
        options: [{ value: 'MANUAL', label: 'กรอกเอง' }, { value: 'FIXED', label: 'จำนวนคงที่' }, { value: 'PERCENT', label: 'เปอร์เซ็นต์' }] }) +
      field({ id: 'pf-fixed', label: 'จำนวนคงที่ (บาท)', type: 'number', step: '0.01', value: r.fixed_amount }) +
      field({ id: 'pf-percent', label: 'เปอร์เซ็นต์ (%)', type: 'number', step: '0.01', value: r.percent }) +
      '</div>' +
      '<label class="v2-check"><input type="checkbox" id="pf-slip"' + (r.show_in_slip === false ? '' : ' checked') + '><span>แสดงในสลิป</span></label>' +
      '<label class="v2-check"><input type="checkbox" id="pf-report"' + (r.show_in_report === false ? '' : ' checked') + '><span>แสดงในรายงาน</span></label>' +
      '<label class="v2-check"><input type="checkbox" id="pf-active"' + (r.active === false ? '' : ' checked') + '><span>ใช้งาน</span></label>',
      '<button class="btn btn-ghost" id="pf-cancel">ยกเลิก</button><button class="btn btn-primary" id="pf-save">บันทึก</button>');
    const root = document.getElementById('v2-modal-root');
    document.getElementById('pf-cancel').onclick = ctx.modal.close;
    const b = document.getElementById('pf-save');
    b.onclick = busyBtn(b, async () => {
      ctx.assertWrite();
      if (!requireAll(root, ['pf-code', 'pf-name'])) return;
      try {
        await ctx.repo.payroll.itemSave({ code: val(root, 'pf-code'), isNew,
          nameTh: val(root, 'pf-name'), kind: val(root, 'pf-kind'), calcType: val(root, 'pf-calc'),
          fixedAmount: val(root, 'pf-fixed') || null, percent: val(root, 'pf-percent') || null,
          showInSlip: root.querySelector('#pf-slip').checked,
          showInReport: root.querySelector('#pf-report').checked,
          active: root.querySelector('#pf-active').checked });
        ctx.modal.close(); ctx.toast.show('บันทึกรายการแล้ว'); load();
      } catch (e) { ctx.toast.show(e.message || 'บันทึกไม่สำเร็จ', 'error'); }
    });
  }

  load();
}

export function unmount() { alive = false; }
