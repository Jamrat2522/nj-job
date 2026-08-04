/* HR V2 — modules/dashboard/dashboard.js
   อ่านจาก njhr_dashboard_summary + njhr_dashboard_announcements (80_dashboard.sql)
   แก้ปัญหา V1 ที่นับสถิติจาก localStorage — ทุกเลขมาจากเซิร์ฟเวอร์เท่านั้น */
let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  el.innerHTML =
    '<div class="dashp">' +
    '<div id="dash-kpis" class="v2-kpis"></div>' +
    '<div class="v2-grid2" style="align-items:start">' +
    '<div class="v2-card"><h3>คำขอลาล่าสุด</h3><div id="dash-leave"></div></div>' +
    '<div class="v2-card"><h3>ประกาศบริษัทล่าสุด</h3><div id="dash-ann"></div></div>' +
    '</div></div>';

  const kp = el.querySelector('#dash-kpis'), lv = el.querySelector('#dash-leave'), an = el.querySelector('#dash-ann');
  ctx.ui.renderLoading(kp);
  ctx.ui.renderLoading(lv);
  ctx.ui.renderLoading(an);

  ctx.repo.dashboard.summary().then(s => {
    if (!alive) return;
    s = s || {};
    const items = [
      ['พนักงานทั้งหมด', s.total_employees],
      ['เข้างานวันนี้', s.checked_in_today],
      ['มาสายวันนี้', s.late_today],
      ['ลางานวันนี้', s.on_leave_today],
      ['ขาดงานวันนี้', s.absent_today],
      ['OT วันนี้', s.ot_today],
      ['รายการรออนุมัติ', s.pending_approvals]
    ];
    kp.innerHTML = items.map(x =>
      '<div class="v2-kpi"><small>' + esc(x[0]) + '</small><b>' + esc(x[1] == null ? '-' : x[1]) + '</b></div>').join('');
  }).catch(e => alive && ctx.ui.renderError(kp, 'โหลดสรุปไม่สำเร็จ', () => mount(el, ctx), 'ลองอีกครั้ง', e.message));

  ctx.repo.leave.list({ limit: 5, offset: 0 }).then(rows => {
    if (!alive) return;
    if (!rows.length) return ctx.ui.renderEmpty(lv, 'ยังไม่มีคำขอลา');
    lv.innerHTML = rows.map(r =>
      '<div class="v2-kv"><span class="k">' + esc((r.start_date || '') + (r.end_date && r.end_date !== r.start_date ? ' – ' + r.end_date : '')) + '</span>' +
      '<span class="v">' + esc(r.leave_type_th || r.leave_type || '') + ' · ' + esc(r.status_th || r.status || '') + '</span></div>').join('');
  }).catch(e => alive && ctx.ui.renderError(lv, 'โหลดไม่สำเร็จ', null, null, e.message));

  ctx.repo.dashboard.announcements(5).then(rows => {
    if (!alive) return;
    if (!rows.length) return ctx.ui.renderEmpty(an, 'ยังไม่มีประกาศ');
    an.innerHTML = rows.map(r =>
      '<div class="v2-kv"><span class="k">' + esc((r.published_at || r.created_at || '').slice(0, 10)) + '</span>' +
      '<span class="v">' + esc(r.title || '') + '</span></div>').join('');
  }).catch(e => alive && ctx.ui.renderError(an, 'โหลดไม่สำเร็จ', null, null, e.message));
}

export function unmount() { alive = false; }
