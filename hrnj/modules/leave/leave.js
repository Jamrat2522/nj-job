/* HR V2 — modules/leave/leave.js
   njhr_leave_balances / leave_submit / leave_list / leave_detail / leave_cancel
   Business Rules เดิมจาก V1 (คงทุกข้อ):
   · ประเภทลา 7 ค่า enum เดิม — SICK ต้องแนบเอกสาร (needDoc)
   · โหมดลา FULL / HALF_AM / HALF_PM / HOURLY (HOURLY ต้องมีเวลาเริ่ม-สิ้นสุด)
   · โควตา/วันทำงาน/ตรวจซ้อน คำนวณที่ RPC (njhr_leave_workdays ตัดเสาร์อาทิตย์+วันหยุดบริษัท) */
import { renderTable, statusBadge, badge } from '../../components/table.js';
import { field, val, requireAll, busyBtn } from '../../components/form.js';

export const LEAVE_TYPES = [
  { code: 'SICK', name: 'ลาป่วย', color: '#DC2626', needDoc: true },
  { code: 'PERSONAL', name: 'ลากิจ', color: '#2563EB', needDoc: false },
  { code: 'VACATION', name: 'ลาพักร้อน', color: '#059669', needDoc: false },
  { code: 'MATERNITY', name: 'ลาคลอด', color: '#DB2777', needDoc: false },
  { code: 'ORDINATION', name: 'ลาบวช', color: '#D97706', needDoc: false },
  { code: 'HALFDAY', name: 'ลาครึ่งวัน', color: '#7C3AED', needDoc: false },
  { code: 'OTHER', name: 'ลาอื่น ๆ', color: '#64748B', needDoc: false }
];
const MODES = [
  { value: 'FULL', label: 'เต็มวัน' }, { value: 'HALF_AM', label: 'ครึ่งวันเช้า' },
  { value: 'HALF_PM', label: 'ครึ่งวันบ่าย' }, { value: 'HOURLY', label: 'รายชั่วโมง' }
];
export const typeName = c => (LEAVE_TYPES.find(t => t.code === String(c || '').toUpperCase()) || { name: c }).name;

let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  el.innerHTML =
    '<div class="lvp">' +
    '<div class="v2-card"><h3>สิทธิ์การลาคงเหลือ (ปีนี้)</h3><div id="lv-bal"></div></div>' +
    '<div class="v2-card"><div style="display:flex;align-items:center;gap:10px">' +
    '<h3 style="flex:1">ประวัติการลา</h3>' +
    '<select id="lv-status"><option value="">ทุกสถานะ</option><option value="PENDING">รออนุมัติ</option>' +
    '<option value="APPROVED">อนุมัติแล้ว</option><option value="REJECTED">ไม่อนุมัติ</option>' +
    '<option value="CANCELLED">ยกเลิก</option></select>' +
    '<button class="btn btn-primary" id="lv-add">+ ยื่นใบลา</button></div>' +
    '<div id="lv-list"></div></div></div>';

  const balEl = el.querySelector('#lv-bal'), listEl = el.querySelector('#lv-list');
  let status = '', page = 0;
  const PAGE = 10;

  async function loadBal() {
    ctx.ui.renderLoading(balEl);
    try {
      const rows = await ctx.repo.leave.balances();
      if (!alive) return;
      if (!rows.length) return ctx.ui.renderEmpty(balEl, 'ยังไม่มีข้อมูลสิทธิ์ลา');
      balEl.innerHTML = rows.map(b =>
        '<div class="v2-kv"><span class="k">' + esc(typeName(b.leave_type)) + '</span>' +
        '<span class="v">คงเหลือ <b>' + esc(b.remaining == null ? 'ไม่จำกัด' : b.remaining) + '</b>' +
        (b.quota != null ? ' / ' + esc(b.quota) : '') +
        (Number(b.pending) ? ' · ' + badge('รอ ' + b.pending, 'warn') : '') + '</span></div>').join('');
    } catch (e) { if (alive) ctx.ui.renderError(balEl, 'โหลดสิทธิ์ลาไม่สำเร็จ', loadBal, 'ลองอีกครั้ง', e.message); }
  }

  async function loadList() {
    ctx.ui.renderLoading(listEl);
    try {
      const rows = await ctx.repo.leave.list({ status: status || null, limit: PAGE, offset: page * PAGE });
      if (!alive) return;
      const total = rows.length ? Number(rows[0].total_count || rows.length) : 0;
      renderTable(listEl, [
        { key: 'leave_type', label: 'ประเภท', render: r => esc(typeName(r.leave_type)) },
        { key: 'start_date', label: 'วันที่', render: r =>
          esc((r.start_date || '').slice(0, 10)) + (r.end_date && r.end_date !== r.start_date ? ' – ' + esc((r.end_date || '').slice(0, 10)) : '') },
        { key: 'days', label: 'จำนวน', render: r => esc(r.days != null ? r.days + ' วัน' : (r.hours != null ? r.hours + ' ชม.' : '-')) },
        { key: 'status', label: 'สถานะ', render: r => statusBadge(r.status) }
      ], rows, {
        page, pageSize: PAGE, total, onPage: p => { page = p; loadList(); },
        onRow: r => openDetail(r.id || r.leave_id), empty: 'ยังไม่มีประวัติการลา'
      });
    } catch (e) { if (alive) ctx.ui.renderError(listEl, 'โหลดประวัติไม่สำเร็จ', loadList, 'ลองอีกครั้ง', e.message); }
  }

  el.querySelector('#lv-status').addEventListener('change', function () { status = this.value; page = 0; loadList(); });
  el.querySelector('#lv-add').addEventListener('click', () => { ctx.assertWrite(); openForm(); });

  function openForm() {
    ctx.modal.open('ยื่นใบลา',
      field({ id: 'l-type', label: 'ประเภทการลา', type: 'select', required: true,
        options: LEAVE_TYPES.map(t => ({ value: t.code, label: t.name + (t.needDoc ? ' (ต้องแนบเอกสาร)' : '') })) }) +
      field({ id: 'l-mode', label: 'รูปแบบ', type: 'select', value: 'FULL', options: MODES }) +
      '<div class="v2-grid2">' +
      field({ id: 'l-start', label: 'วันที่เริ่ม', type: 'date', required: true }) +
      field({ id: 'l-end', label: 'วันที่สิ้นสุด', type: 'date', required: true }) +
      field({ id: 'l-st', label: 'เวลาเริ่ม (รายชั่วโมง)', type: 'time' }) +
      field({ id: 'l-et', label: 'เวลาสิ้นสุด (รายชั่วโมง)', type: 'time' }) +
      '</div>' +
      field({ id: 'l-reason', label: 'เหตุผลการลา', type: 'textarea', required: true }) +
      field({ id: 'l-delegate', label: 'ผู้รับมอบงาน (ถ้ามี)' }) +
      '<p class="hm-sub" id="l-docnote" hidden>⚠ ลาป่วยต้องแนบใบรับรองแพทย์ — แนบไฟล์ได้ในหน้ารายละเอียดหลังยื่น หรือส่งให้ HR ตามกำหนด</p>',
      '<button class="btn btn-ghost" id="l-cancel">ยกเลิก</button><button class="btn btn-primary" id="l-save">ส่งใบลา</button>',
      { fullMobile: true });
    const root = document.getElementById('v2-modal-root');
    const sync = () => {
      root.querySelector('#l-docnote').hidden =
        !(LEAVE_TYPES.find(t => t.code === val(root, 'l-type')) || {}).needDoc;
      const startEl = root.querySelector('#l-start'), endEl = root.querySelector('#l-end');
      if (val(root, 'l-mode') !== 'FULL' && startEl.value) endEl.value = startEl.value;   // ครึ่งวัน/รายชม. = วันเดียว
    };
    root.querySelector('#l-type').addEventListener('change', sync);
    root.querySelector('#l-mode').addEventListener('change', sync);
    root.querySelector('#l-start').addEventListener('change', sync);
    document.getElementById('l-cancel').onclick = ctx.modal.close;
    const b = document.getElementById('l-save');
    b.onclick = busyBtn(b, async () => {
      ctx.assertWrite();
      if (!requireAll(root, ['l-start', 'l-end', 'l-reason'])) return;
      const mode = val(root, 'l-mode');
      const st = val(root, 'l-st'), et = val(root, 'l-et');
      if (mode === 'HOURLY' && (!st || !et)) { ctx.toast.show('รายชั่วโมงต้องระบุเวลาเริ่มและสิ้นสุด', 'warn'); return; }
      if (val(root, 'l-end') < val(root, 'l-start')) { ctx.toast.show('วันสิ้นสุดต้องไม่ก่อนวันเริ่ม', 'warn'); return; }
      try {
        /* โควตา/วันทำงาน/ช่วงซ้อน ตรวจซ้ำที่ RPC — ไม่เชื่อการตรวจฝั่งจอเพียงอย่างเดียว */
        await ctx.repo.leave.submit({ leaveType: val(root, 'l-type'), mode,
          startDate: val(root, 'l-start'), endDate: val(root, 'l-end'),
          startTime: mode === 'HOURLY' ? st : null, endTime: mode === 'HOURLY' ? et : null,
          reason: val(root, 'l-reason'), delegate: val(root, 'l-delegate') || null, files: [] });
        ctx.modal.close(); ctx.toast.show('ส่งใบลาแล้ว รอการอนุมัติ');
        loadBal(); loadList();
      } catch (e) { ctx.toast.show(e.message || 'ส่งใบลาไม่สำเร็จ', 'error'); }
    });
  }

  async function openDetail(id) {
    ctx.modal.open('รายละเอียดใบลา', '<div id="lvd"></div>', '<span id="lvd-foot"></span>');
    const box = document.getElementById('lvd');
    ctx.ui.renderLoading(box);
    try {
      const d = await ctx.repo.leave.detail(id);
      const kv = [
        ['ประเภท', typeName(d.leave_type)], ['รูปแบบ', (MODES.find(m => m.value === d.mode) || {}).label || d.mode || 'เต็มวัน'],
        ['วันที่', (d.start_date || '').slice(0, 10) + (d.end_date && d.end_date !== d.start_date ? ' – ' + (d.end_date || '').slice(0, 10) : '')],
        ['จำนวน', d.days != null ? d.days + ' วัน' : '-'], ['เหตุผล', d.reason],
        ['สถานะ', null]
      ];
      box.innerHTML = kv.map(x => '<div class="v2-kv"><span class="k">' + esc(x[0]) + '</span><span class="v">' +
        (x[0] === 'สถานะ' ? statusBadge(d.status) : esc(x[1] == null ? '-' : x[1])) + '</span></div>').join('') +
        (Array.isArray(d.timeline) && d.timeline.length
          ? '<h3 style="margin:12px 0 6px;font-size:14px">ลำดับการอนุมัติ</h3>' + d.timeline.map(s =>
              '<div class="v2-kv"><span class="k">' + esc((s.at || '').slice(0, 16).replace('T', ' ')) + '</span>' +
              '<span class="v">' + esc(s.title || s.action || '') + (s.by ? ' · ' + esc(s.by) : '') + '</span></div>').join('')
          : '');
      if (d.status === 'PENDING') {
        document.getElementById('lvd-foot').innerHTML = '<button class="btn btn-danger" id="lvd-cancel">ยกเลิกใบลา</button>';
        document.getElementById('lvd-cancel').onclick = () => {
          ctx.assertWrite();
          ctx.modal.confirm('ยกเลิกใบลา', 'ยืนยันยกเลิกใบลานี้ใช่หรือไม่', 'ยกเลิกใบลา', async () => {
            try { await ctx.repo.leave.cancel(id); ctx.toast.show('ยกเลิกใบลาแล้ว'); loadBal(); loadList(); }
            catch (e) { ctx.toast.show(e.message || 'ไม่สำเร็จ', 'error'); }
          }, true);
        };
      }
    } catch (e) { ctx.ui.renderError(box, 'โหลดรายละเอียดไม่สำเร็จ', null, null, e.message); }
  }

  loadBal();
  loadList();
}

export function unmount() { alive = false; }
