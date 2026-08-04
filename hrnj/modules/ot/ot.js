/* HR V2 — modules/ot/ot.js
   njhr_ot_list (p_mine) / ot_get / ot_submit / (attach ผ่าน repo — Storage เมื่อเชื่อมจริง)
   ปิดเส้นทาง local db.ots ของ V1 ทั้งหมด — ส่ง OT ผ่าน RPC njhr_ot_submit (65_ot.sql) เท่านั้น
   Business Rules เดิม: ประเภทงาน 3 ค่า (ตรวจปล่อย/คีย์ใบขน/คีย์+ตรวจปล่อย) · เวลาสิ้นสุด > เริ่ม ·
   OT ข้ามวันใช้ p_next_day · หลายรายการงานต่อ 1 คำขอ */
import { renderTable, statusBadge } from '../../components/table.js';
import { field, val, requireAll, busyBtn } from '../../components/form.js';

const JOB_TYPES = [
  { value: 'ตรวจปล่อย', label: 'ตรวจปล่อย' },
  { value: 'คีย์ใบขน', label: 'คีย์ใบขน' },
  { value: 'คีย์+ตรวจปล่อย', label: 'คีย์+ตรวจปล่อย' }
];
let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  el.innerHTML =
    '<div class="otp"><div class="v2-card">' +
    '<div style="display:flex;align-items:center;gap:10px">' +
    '<h3 style="flex:1">คำขอ OT ของฉัน</h3>' +
    '<select id="ot-status"><option value="">ทุกสถานะ</option><option value="PENDING">รออนุมัติ</option>' +
    '<option value="APPROVED">อนุมัติแล้ว</option><option value="REJECTED">ไม่อนุมัติ</option></select>' +
    '<button class="btn btn-primary" id="ot-add">+ ขอ OT</button></div>' +
    '<div id="ot-list"></div></div></div>';

  const listEl = el.querySelector('#ot-list');
  let status = '', page = 0;
  const PAGE = 10;

  async function load() {
    ctx.ui.renderLoading(listEl);
    try {
      const rows = await ctx.repo.ot.list({ mine: true, status: status || null, limit: PAGE, offset: page * PAGE });
      if (!alive) return;
      const total = rows.length ? Number(rows[0].total_count || rows.length) : 0;
      renderTable(listEl, [
        { key: 'ot_date', label: 'วันที่', render: r => esc(((r.ot_date || r.date || '') + '').slice(0, 10)) },
        { key: 'start_time', label: 'เวลา', render: r =>
          esc(((r.start_time || '') + '').slice(0, 5)) + ' – ' + esc(((r.end_time || '') + '').slice(0, 5)) +
          (r.next_day || r.is_overnight ? ' (+1 วัน)' : '') },
        { key: 'hours', label: 'ชั่วโมง', render: r => esc(r.hours != null ? r.hours : '-') },
        { key: 'job_count', label: 'งาน', render: r => esc(r.job_count != null ? r.job_count + ' รายการ' : '-') },
        { key: 'status', label: 'สถานะ', render: r => statusBadge(r.status) }
      ], rows, {
        page, pageSize: PAGE, total, onPage: p => { page = p; load(); },
        onRow: r => openDetail(r.id), empty: 'ยังไม่มีคำขอ OT'
      });
    } catch (e) { if (alive) ctx.ui.renderError(listEl, 'โหลดคำขอ OT ไม่สำเร็จ', load, 'ลองอีกครั้ง', e.message); }
  }
  el.querySelector('#ot-status').addEventListener('change', function () { status = this.value; page = 0; load(); });
  el.querySelector('#ot-add').addEventListener('click', () => { ctx.assertWrite(); openForm(); });

  function jobRow(i) {
    return '<div class="v2-card otj" data-j="' + i + '">' +
      '<div class="v2-grid2">' +
      field({ id: 'j' + i + '-job', label: 'JOB', required: true }) +
      field({ id: 'j' + i + '-type', label: 'ประเภทงาน', type: 'select', options: JOB_TYPES }) +
      '</div>' +
      field({ id: 'j' + i + '-desc', label: 'รายละเอียด' }) +
      '<button type="button" class="btn btn-ghost otj-del" data-j="' + i + '">ลบรายการนี้</button></div>';
  }

  function openForm() {
    let jobs = [0];
    ctx.modal.open('ขอ OT',
      '<div class="v2-grid2">' +
      field({ id: 'o-date', label: 'วันที่ทำ OT', type: 'date', required: true }) +
      '<label class="v2-check" style="align-self:end"><input type="checkbox" id="o-next"><span>OT ข้ามวัน (เลิกหลังเที่ยงคืน)</span></label>' +
      field({ id: 'o-start', label: 'เวลาเริ่ม', type: 'time', required: true }) +
      field({ id: 'o-end', label: 'เวลาสิ้นสุด', type: 'time', required: true }) +
      '</div>' +
      field({ id: 'o-reason', label: 'เหตุผล/หมายเหตุ', type: 'textarea' }) +
      '<h3 style="margin:8px 0;font-size:14px">รายการงาน OT</h3><div id="o-jobs">' + jobRow(0) + '</div>' +
      '<button type="button" class="btn btn-ghost" id="o-addjob">+ เพิ่มรายการงาน</button>',
      '<button class="btn btn-ghost" id="o-cancel">ยกเลิก</button><button class="btn btn-primary" id="o-save">ส่งคำขอ OT</button>',
      { fullMobile: true });
    const root = document.getElementById('v2-modal-root');
    const wire = () => root.querySelectorAll('.otj-del').forEach(b => b.onclick = () => {
      if (jobs.length <= 1) { ctx.toast.show('ต้องมีรายการงานอย่างน้อย 1 รายการ', 'warn'); return; }
      jobs = jobs.filter(x => String(x) !== b.dataset.j);
      root.querySelector('.otj[data-j="' + b.dataset.j + '"]').remove();
    });
    wire();
    root.querySelector('#o-addjob').onclick = () => {
      const i = (jobs[jobs.length - 1] || 0) + 1;
      jobs.push(i);
      root.querySelector('#o-jobs').insertAdjacentHTML('beforeend', jobRow(i));
      wire();
    };
    document.getElementById('o-cancel').onclick = ctx.modal.close;
    const b = document.getElementById('o-save');
    b.onclick = busyBtn(b, async () => {
      ctx.assertWrite();
      if (!requireAll(root, ['o-date', 'o-start', 'o-end'].concat(jobs.map(i => 'j' + i + '-job')))) return;
      const st = val(root, 'o-start'), et = val(root, 'o-end'), nextDay = root.querySelector('#o-next').checked;
      if (!nextDay && et <= st) { ctx.toast.show('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม (หรือเลือก OT ข้ามวัน)', 'warn'); return; }
      const jobList = jobs.map((i, n) => ({
        no: n + 1, job: val(root, 'j' + i + '-job'),
        job_type: val(root, 'j' + i + '-type'), detail: val(root, 'j' + i + '-desc') || null
      }));
      try {
        await ctx.repo.ot.submit({ date: val(root, 'o-date'), start: st, end: et,
          nextDay, jobs: jobList, reason: val(root, 'o-reason') || null });   // ตรวจซ้อน/ซ้ำที่ RPC
        ctx.modal.close(); ctx.toast.show('ส่งคำขอ OT แล้ว รอการอนุมัติ'); load();
      } catch (e) { ctx.toast.show(e.message || 'ส่งคำขอไม่สำเร็จ', 'error'); }
    });
  }

  async function openDetail(id) {
    ctx.modal.open('รายละเอียด OT', '<div id="otd"></div>');
    const box = document.getElementById('otd');
    ctx.ui.renderLoading(box);
    try {
      const d = await ctx.repo.ot.get(id);
      box.innerHTML =
        '<div class="v2-kv"><span class="k">วันที่</span><span class="v">' + esc(((d.ot_date || d.date || '') + '').slice(0, 10)) + '</span></div>' +
        '<div class="v2-kv"><span class="k">เวลา</span><span class="v">' + esc(((d.start_time || '') + '').slice(0, 5)) + ' – ' +
          esc(((d.end_time || '') + '').slice(0, 5)) + (d.next_day || d.is_overnight ? ' (+1 วัน)' : '') + '</span></div>' +
        '<div class="v2-kv"><span class="k">สถานะ</span><span class="v">' + statusBadge(d.status) + '</span></div>' +
        (d.reason ? '<div class="v2-kv"><span class="k">เหตุผล</span><span class="v">' + esc(d.reason) + '</span></div>' : '') +
        (Array.isArray(d.jobs) && d.jobs.length
          ? '<h3 style="margin:12px 0 6px;font-size:14px">รายการงาน</h3>' + d.jobs.map(j =>
            '<div class="v2-kv"><span class="k">' + esc(j.no || '') + '. ' + esc(j.job || '') + '</span>' +
            '<span class="v">' + esc(j.job_type || '') + (j.detail ? ' · ' + esc(j.detail) : '') + '</span></div>').join('')
          : '');
    } catch (e) { ctx.ui.renderError(box, 'โหลดรายละเอียดไม่สำเร็จ', null, null, e.message); }
  }

  load();
}

export function unmount() { alive = false; }
