/* HR V2 — modules/payroll/entries.js
   รายการเงินเดือนรายเดือนต่อพนักงาน: njhr_pay_entries / entry_save / entry_delete /
   entry_totals / copy_preview / copy_apply — สูตรคำนวณอยู่ที่ RPC ทั้งหมด (ห้ามคำนวณเองฝั่งจอ) */
import { renderTable, badge } from '../../components/table.js';
import { field, val, requireAll, busyBtn } from '../../components/form.js';

let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  const now = new Date();
  let year = now.getFullYear(), month = now.getMonth() + 1, q = '';

  el.innerHTML =
    '<div class="pep"><div class="v2-toolbar">' +
    '<select id="pe-month">' + Array.from({ length: 12 }, (_, i) =>
      '<option value="' + (i + 1) + '"' + (i + 1 === month ? ' selected' : '') + '>เดือน ' + (i + 1) + '</option>').join('') + '</select>' +
    '<input type="number" id="pe-year" value="' + year + '" style="width:110px">' +
    '<input type="search" id="pe-q" class="grow" placeholder="ค้นหาพนักงาน">' +
    '<button class="btn btn-ghost" id="pe-copy">คัดลอกจากเดือนก่อน</button>' +
    '<button class="btn btn-primary" id="pe-add">+ เพิ่มรายการ</button>' +
    '</div><div id="pe-totals" class="v2-kpis"></div><div id="pe-table"></div></div>';

  const tableEl = el.querySelector('#pe-table'), totalsEl = el.querySelector('#pe-totals');
  let deb = null;

  async function load() {
    ctx.ui.renderLoading(tableEl);
    totalsEl.innerHTML = '';
    try {
      const [rows, tot] = await Promise.all([
        ctx.repo.payroll.entries({ year, month, q: q || null }),
        ctx.repo.payroll.entryTotals({ year, month }).catch(() => null)
      ]);
      if (!alive) return;
      if (tot) totalsEl.innerHTML =
        '<div class="v2-kpi"><small>รายได้รวม</small><b>' + esc(tot.income_total != null ? Number(tot.income_total).toLocaleString('th-TH') : '-') + '</b></div>' +
        '<div class="v2-kpi"><small>รายการหักรวม</small><b>' + esc(tot.deduct_total != null ? Number(tot.deduct_total).toLocaleString('th-TH') : '-') + '</b></div>' +
        '<div class="v2-kpi"><small>จำนวนรายการ</small><b>' + esc(tot.entry_count != null ? tot.entry_count : rows.length) + '</b></div>';
      renderTable(tableEl, [
        { key: 'emp_code', label: 'รหัส', width: '70px' },
        { key: 'emp_name', label: 'พนักงาน', render: r => esc(r.emp_name || r.full_name || '') },
        { key: 'item_code', label: 'รายการ', render: r => esc(r.item_name || r.item_code || '') },
        { key: 'amount', label: 'จำนวนเงิน', render: r => esc(r.amount != null ? Number(r.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-') },
        { key: 'recurring', label: 'ประจำ', render: r => r.recurring ? badge('รายการประจำ', 'info') : '' },
        { key: '_a', label: '', render: r =>
          '<button class="btn btn-ghost" data-act="edit" data-id="' + esc(r.id) + '">แก้ไข</button> ' +
          '<button class="btn btn-ghost" data-act="del" data-id="' + esc(r.id) + '">ลบ</button>' }
      ], rows, { empty: 'ยังไม่มีรายการของงวด ' + month + '/' + year });
      tableEl.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', () => {
        const r = rows.find(x => String(x.id) === b.dataset.id);
        if (b.dataset.act === 'edit') { ctx.assertWrite(); openForm(r); }
        else {
          ctx.assertWrite();
          ctx.modal.confirm('ลบรายการ', 'ยืนยันลบรายการ "' + (r.item_name || r.item_code || '') + '" ของ ' +
            (r.emp_name || r.emp_code || '') + ' ใช่หรือไม่', 'ลบรายการ', async () => {
            try { await ctx.repo.payroll.entryDelete(r.id); ctx.toast.show('ลบรายการแล้ว'); load(); }
            catch (e) { ctx.toast.show(e.message || 'ลบไม่สำเร็จ', 'error'); }
          }, true);
        }
      }));
    } catch (e) { if (alive) ctx.ui.renderError(tableEl, 'โหลดรายการไม่สำเร็จ', load, 'ลองอีกครั้ง', e.message); }
  }

  el.querySelector('#pe-month').addEventListener('change', function () { month = Number(this.value); load(); });
  el.querySelector('#pe-year').addEventListener('change', function () { year = Number(this.value) || year; load(); });
  el.querySelector('#pe-q').addEventListener('input', function () {
    clearTimeout(deb); deb = setTimeout(() => { q = this.value.trim(); load(); }, 350);
  });
  el.querySelector('#pe-add').addEventListener('click', () => { ctx.assertWrite(); openForm(null); });
  el.querySelector('#pe-copy').addEventListener('click', async () => {
    ctx.assertWrite();
    try {
      const prev = await ctx.repo.payroll.copyPreview(year, month);
      if (!prev.length) return ctx.toast.show('ไม่มีรายการประจำจากเดือนก่อนให้คัดลอก', 'warn');
      ctx.modal.confirm('คัดลอกรายการประจำ',
        'พบ ' + prev.length + ' รายการจากเดือนก่อน ยืนยันคัดลอกเข้างวด ' + month + '/' + year + ' ใช่หรือไม่ ' +
        '(RPC จะข้ามรายการที่มีอยู่แล้ว — ไม่สร้างซ้ำ)', 'คัดลอก', async () => {
        try {
          await ctx.repo.payroll.copyApply(year, month, prev);
          ctx.toast.show('คัดลอกรายการแล้ว'); load();
        } catch (e) { ctx.toast.show(e.message || 'คัดลอกไม่สำเร็จ', 'error'); }
      });
    } catch (e) { ctx.toast.show(e.message || 'อ่านตัวอย่างไม่สำเร็จ', 'error'); }
  });

  async function openForm(r) {
    const isNew = !r; r = r || {};
    let emps = [], items = [];
    try {
      [emps, items] = await Promise.all([
        ctx.repo.employees.list({ limit: 200, offset: 0 }),
        ctx.repo.payroll.items({ active: true })
      ]);
    } catch (e) { ctx.toast.show('โหลดข้อมูลประกอบไม่สำเร็จ: ' + e.message, 'error'); return; }
    ctx.modal.open(isNew ? 'เพิ่มรายการงวด ' + month + '/' + year : 'แก้ไขรายการ',
      field({ id: 'ef-emp', label: 'พนักงาน', type: 'select', value: r.employee_id, required: true, disabled: !isNew,
        options: emps.map(e0 => ({ value: e0.id, label: (e0.emp_code || '') + ' · ' + (e0.full_name || e0.first_name || '') })) }) +
      field({ id: 'ef-item', label: 'รายการ', type: 'select', value: r.item_code, required: true,
        options: items.map(i => ({ value: i.code, label: i.code + ' · ' + (i.name_th || '') })) }) +
      field({ id: 'ef-amount', label: 'จำนวนเงิน (บาท)', type: 'number', step: '0.01', value: r.amount, required: true }) +
      '<label class="v2-check"><input type="checkbox" id="ef-rec"' + (r.recurring ? ' checked' : '') + '><span>รายการประจำ (คัดลอกไปเดือนถัดไปได้)</span></label>' +
      field({ id: 'ef-note', label: 'หมายเหตุ', value: r.note }),
      '<button class="btn btn-ghost" id="ef-cancel">ยกเลิก</button><button class="btn btn-primary" id="ef-save">บันทึก</button>',
      { fullMobile: true });
    const root = document.getElementById('v2-modal-root');
    document.getElementById('ef-cancel').onclick = ctx.modal.close;
    const b = document.getElementById('ef-save');
    b.onclick = busyBtn(b, async () => {
      ctx.assertWrite();
      if (!requireAll(root, ['ef-emp', 'ef-item', 'ef-amount'])) return;
      try {
        await ctx.repo.payroll.entrySave({ id: isNew ? null : r.id, employee: val(root, 'ef-emp'),
          itemCode: val(root, 'ef-item'), year, month, amount: Number(val(root, 'ef-amount')),
          recurring: root.querySelector('#ef-rec').checked, note: val(root, 'ef-note') || null });
        ctx.modal.close(); ctx.toast.show('บันทึกรายการแล้ว'); load();
      } catch (e) { ctx.toast.show(e.message || 'บันทึกไม่สำเร็จ', 'error'); }
    });
  }

  load();
}

export function unmount() { alive = false; }
