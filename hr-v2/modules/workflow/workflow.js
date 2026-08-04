/* HR V2 — modules/workflow/workflow.js
   ตั้งค่าลำดับการอนุมัติ (Approval Workflow): njhr_wf_list / wf_save / wf_steps / wf_step_save /
   wf_step_move / wf_step_delete — ประเภท LEAVE / OT / DOC ตามระบบเดิม */
import { renderTable, badge } from '../../components/table.js';
import { field, val, requireAll, busyBtn } from '../../components/form.js';

const WF_TYPES = [
  { value: 'LEAVE', label: 'การลา' }, { value: 'OT', label: 'OT' }, { value: 'DOC', label: 'เอกสาร HR' }
];
let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  el.innerHTML =
    '<div class="wfp"><div class="v2-tabs">' + WF_TYPES.map((t, i) =>
      '<button' + (i === 0 ? ' class="on"' : '') + ' data-t="' + t.value + '">' + esc(t.label) + '</button>').join('') +
    '</div><div class="v2-toolbar"><b style="flex:1">ลำดับขั้นการอนุมัติ</b>' +
    '<button class="btn btn-primary" id="wf-add">+ เพิ่มขั้น</button></div>' +
    '<div id="wf-steps"></div>' +
    '<p class="hm-sub">ผู้มีสิทธิ์อนุมัติจริงต่อคำขอ ตัดสินโดย RPC ตามลำดับนี้ — หน้าจอเป็นเพียงการตั้งค่า</p></div>';
  const stepsEl = el.querySelector('#wf-steps');
  let type = 'LEAVE';

  el.querySelectorAll('.v2-tabs button').forEach(b => b.addEventListener('click', () => {
    type = b.dataset.t;
    el.querySelectorAll('.v2-tabs button').forEach(x => x.classList.toggle('on', x === b));
    load();
  }));

  async function load() {
    ctx.ui.renderLoading(stepsEl);
    try {
      const rows = await ctx.repo.workflow.steps(type, null);
      if (!alive) return;
      renderTable(stepsEl, [
        { key: 'step_order', label: 'ลำดับ', width: '60px', render: r => esc(r.step_order != null ? r.step_order : '-') },
        { key: 'name', label: 'ชื่อขั้น', render: r => esc(r.name || r.step_name || '') },
        { key: 'mode', label: 'ผู้อนุมัติ', render: r => esc(r.mode_th || r.mode || '') },
        { key: 'active', label: 'สถานะ', render: r => badge(r.active === false ? 'ปิดใช้' : 'ใช้งาน', r.active === false ? '' : 'ok') },
        { key: '_a', label: '', render: r =>
          '<button class="btn btn-ghost" data-act="up" data-id="' + esc(r.step_id || r.id) + '">↑</button> ' +
          '<button class="btn btn-ghost" data-act="down" data-id="' + esc(r.step_id || r.id) + '">↓</button> ' +
          '<button class="btn btn-ghost" data-act="edit" data-id="' + esc(r.step_id || r.id) + '">แก้ไข</button> ' +
          '<button class="btn btn-ghost" data-act="del" data-id="' + esc(r.step_id || r.id) + '">ลบ</button>' }
      ], rows, { empty: 'ยังไม่มีขั้นการอนุมัติของประเภทนี้ — ใช้ค่าเริ่มต้นของระบบ' });
      stepsEl.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', async () => {
        const r = rows.find(x => String(x.step_id || x.id) === b.dataset.id);
        const id = r.step_id || r.id;
        ctx.assertWrite();
        if (b.dataset.act === 'up' || b.dataset.act === 'down') {
          try { await ctx.repo.workflow.stepMove(id, b.dataset.act === 'up' ? -1 : 1); load(); }
          catch (e) { ctx.toast.show(e.message || 'ย้ายไม่สำเร็จ', 'error'); }
        } else if (b.dataset.act === 'edit') openStep(r);
        else ctx.modal.confirm('ลบขั้นการอนุมัติ', 'ยืนยันลบขั้น "' + (r.name || '') + '" ใช่หรือไม่', 'ลบ', async () => {
          try { await ctx.repo.workflow.stepDelete(id, true); ctx.toast.show('ลบแล้ว'); load(); }
          catch (e) { ctx.toast.show(e.message || 'ลบไม่สำเร็จ', 'error'); }
        }, true);
      }));
    } catch (e) { if (alive) ctx.ui.renderError(stepsEl, 'โหลดขั้นการอนุมัติไม่สำเร็จ', load, 'ลองอีกครั้ง', e.message); }
  }
  el.querySelector('#wf-add').addEventListener('click', () => { ctx.assertWrite(); openStep(null); });

  function openStep(r) {
    const isNew = !r; r = r || {};
    ctx.modal.open(isNew ? 'เพิ่มขั้นการอนุมัติ (' + type + ')' : 'แก้ไขขั้น — ' + (r.name || ''),
      field({ id: 'wf-name', label: 'ชื่อขั้น', value: r.name || r.step_name, required: true }) +
      field({ id: 'wf-mode', label: 'ผู้อนุมัติ', type: 'select', value: r.mode || 'MANAGER', options: [
        { value: 'MANAGER', label: 'หัวหน้าแผนก' }, { value: 'HR', label: 'ฝ่ายบุคคล' },
        { value: 'ADMIN', label: 'ผู้ดูแลระบบ' }, { value: 'SPECIFIC', label: 'ระบุบุคคล (ตั้งใน RPC/รอบถัดไป)' }] }) +
      field({ id: 'wf-note', label: 'หมายเหตุ', value: r.note }) +
      '<label class="v2-check"><input type="checkbox" id="wf-active"' + (r.active === false ? '' : ' checked') + '><span>ใช้งาน</span></label>',
      '<button class="btn btn-ghost" id="wf-cancel">ยกเลิก</button><button class="btn btn-primary" id="wf-save">บันทึก</button>');
    const root = document.getElementById('v2-modal-root');
    document.getElementById('wf-cancel').onclick = ctx.modal.close;
    const b = document.getElementById('wf-save');
    b.onclick = busyBtn(b, async () => {
      ctx.assertWrite();
      if (!requireAll(root, ['wf-name'])) return;
      try {
        await ctx.repo.workflow.stepSave({ stepId: isNew ? null : (r.step_id || r.id), type,
          name: val(root, 'wf-name'), mode: val(root, 'wf-mode'), note: val(root, 'wf-note') || null,
          active: root.querySelector('#wf-active').checked });
        ctx.modal.close(); ctx.toast.show('บันทึกขั้นแล้ว'); load();
      } catch (e) { ctx.toast.show(e.message || 'บันทึกไม่สำเร็จ', 'error'); }
    });
  }

  load();
}

export function unmount() { alive = false; }
