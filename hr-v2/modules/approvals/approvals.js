/* HR V2 — modules/approvals/approvals.js
   3 แท็บตามแบบ V1: ลา (njhr_leave_queue/decide) · OT (njhr_ot_list PENDING / ot_decide) ·
   แก้ไขเวลา (njhr_att_correction_list PENDING / approve / reject)
   สิทธิ์จริงตรวจที่ RPC ทุกครั้ง — เมนูนี้เป็นเพียงทางเข้า */
import { renderTable, statusBadge } from '../../components/table.js';
import { field, val, busyBtn } from '../../components/form.js';
import { typeName } from '../leave/leave.js';

let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  el.innerHTML =
    '<div class="apvp">' +
    '<div class="v2-tabs"><button class="on" data-t="leave">ใบลา</button>' +
    '<button data-t="ot">OT</button><button data-t="corr">แก้ไขเวลา</button></div>' +
    '<div id="apv-body"></div></div>';
  const body = el.querySelector('#apv-body');
  let tab = 'leave';

  el.querySelectorAll('.v2-tabs button').forEach(b => b.addEventListener('click', () => {
    tab = b.dataset.t;
    el.querySelectorAll('.v2-tabs button').forEach(x => x.classList.toggle('on', x === b));
    load();
  }));

  function decideModal(title, needNoteOnReject, onDecide) {
    /* กล่องยืนยัน อนุมัติ/ไม่อนุมัติ พร้อมหมายเหตุ — ไม่อนุมัติต้องมีเหตุผล (กฎเดิม) */
    ctx.modal.open(title,
      field({ id: 'ap-note', label: 'หมายเหตุ (จำเป็นเมื่อไม่อนุมัติ)', type: 'textarea' }),
      '<button class="btn btn-danger" id="ap-no">ไม่อนุมัติ</button>' +
      '<button class="btn btn-primary" id="ap-yes">อนุมัติ</button>');
    const root = document.getElementById('v2-modal-root');
    const go = (action) => async () => {
      ctx.assertWrite();
      const note = val(root, 'ap-note');
      if (action !== 'APPROVE' && needNoteOnReject && !note) {
        ctx.toast.show('กรุณาระบุเหตุผลที่ไม่อนุมัติ', 'warn'); return;
      }
      try { await onDecide(action, note || null); ctx.modal.close(); ctx.toast.show('บันทึกผลแล้ว'); load(); }
      catch (e) { ctx.toast.show(e.message || 'ไม่สำเร็จ', 'error'); }
    };
    const y = document.getElementById('ap-yes'), n = document.getElementById('ap-no');
    y.onclick = busyBtn(y, go('APPROVE'));
    n.onclick = busyBtn(n, go('REJECT'));
  }

  async function load() {
    ctx.ui.renderLoading(body);
    try {
      if (tab === 'leave') {
        const rows = await ctx.repo.leave.queue(30, 0);
        if (!alive || tab !== 'leave') return;
        renderTable(body, [
          { key: 'emp_name', label: 'พนักงาน', render: r => esc(r.emp_name || r.full_name || '') },
          { key: 'leave_type', label: 'ประเภท', render: r => esc(typeName(r.leave_type)) },
          { key: 'start_date', label: 'วันที่', render: r => esc((r.start_date || '').slice(0, 10)) +
            (r.end_date && r.end_date !== r.start_date ? ' – ' + esc((r.end_date || '').slice(0, 10)) : '') },
          { key: 'days', label: 'จำนวน', render: r => esc(r.days != null ? r.days + ' วัน' : '-') },
          { key: '_a', label: '', render: r => '<button class="btn btn-primary" data-id="' + esc(r.leave_id || r.id) + '">พิจารณา</button>' }
        ], rows, { empty: 'ไม่มีใบลารออนุมัติ' });
        body.querySelectorAll('button[data-id]').forEach(b => b.addEventListener('click', () => {
          ctx.assertWrite();
          decideModal('พิจารณาใบลา', true, (action, note) => ctx.repo.leave.decide(b.dataset.id, action, note));
        }));
      } else if (tab === 'ot') {
        const rows = await ctx.repo.ot.list({ mine: false, status: 'PENDING', limit: 30, offset: 0 });
        if (!alive || tab !== 'ot') return;
        renderTable(body, [
          { key: 'emp_name', label: 'พนักงาน', render: r => esc(r.emp_name || r.full_name || '') },
          { key: 'ot_date', label: 'วันที่', render: r => esc(((r.ot_date || r.date || '') + '').slice(0, 10)) },
          { key: 'start_time', label: 'เวลา', render: r => esc(((r.start_time || '') + '').slice(0, 5)) + ' – ' +
            esc(((r.end_time || '') + '').slice(0, 5)) + (r.next_day || r.is_overnight ? ' (+1)' : '') },
          { key: 'hours', label: 'ชม.', render: r => esc(r.hours != null ? r.hours : '-') },
          { key: '_a', label: '', render: r => '<button class="btn btn-primary" data-id="' + esc(r.id) + '">พิจารณา</button>' }
        ], rows, { empty: 'ไม่มีคำขอ OT รออนุมัติ' });
        body.querySelectorAll('button[data-id]').forEach(b => b.addEventListener('click', () => {
          ctx.assertWrite();
          decideModal('พิจารณาคำขอ OT', true, (action, note) => ctx.repo.ot.decide(b.dataset.id, action, note));
        }));
      } else {
        const rows = await ctx.repo.attendance.correctionList({ status: 'PENDING', limit: 30, offset: 0 });
        if (!alive || tab !== 'corr') return;
        renderTable(body, [
          { key: 'emp_name', label: 'พนักงาน', render: r => esc(r.emp_name || r.full_name || '') },
          { key: 'work_date', label: 'วันที่', render: r => esc((r.work_date || '').slice(0, 10)) },
          { key: 'requested_check_in', label: 'เข้า→', render: r => esc((r.requested_check_in || '').slice(11, 16) || '-') },
          { key: 'requested_check_out', label: 'ออก→', render: r => esc((r.requested_check_out || '').slice(11, 16) || '-') },
          { key: 'reason', label: 'เหตุผล' },
          { key: '_a', label: '', render: r => '<button class="btn btn-primary" data-id="' + esc(r.id) + '">พิจารณา</button>' }
        ], rows, { empty: 'ไม่มีคำขอแก้ไขเวลารออนุมัติ' });
        body.querySelectorAll('button[data-id]').forEach(b => b.addEventListener('click', () => {
          ctx.assertWrite();
          decideModal('พิจารณาคำขอแก้ไขเวลา', true, (action, note) =>
            action === 'APPROVE'
              ? ctx.repo.attendance.correctionApprove(b.dataset.id, note)
              : ctx.repo.attendance.correctionReject(b.dataset.id, note || 'ไม่อนุมัติ'));
        }));
      }
    } catch (e) { if (alive) ctx.ui.renderError(body, 'โหลดรายการไม่สำเร็จ', load, 'ลองอีกครั้ง', e.message); }
  }

  load();
}

export function unmount() { alive = false; }
