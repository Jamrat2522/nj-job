/* HR V2 — modules/calendar/calendar.js — njhr_event_list + njhr_ann_feed/read/ack (ปฏิทิน+ประกาศ) */
let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  el.innerHTML =
    '<div class="clp v2-grid2" style="align-items:start">' +
    '<div class="v2-card"><h3>กิจกรรม/วันหยุดเดือนนี้</h3><div id="cl-events"></div></div>' +
    '<div class="v2-card"><h3>ประกาศบริษัท</h3><div id="cl-ann"></div></div></div>';
  const evEl = el.querySelector('#cl-events'), anEl = el.querySelector('#cl-ann');
  const d = new Date(), y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0');
  const last = new Date(y, d.getMonth() + 1, 0).getDate();

  ctx.ui.renderLoading(evEl);
  ctx.repo.calendar.events(y + '-' + m + '-01', y + '-' + m + '-' + last, 100).then(rows => {
    if (!alive) return;
    if (!rows.length) return ctx.ui.renderEmpty(evEl, 'ไม่มีกิจกรรมเดือนนี้');
    evEl.innerHTML = rows.map(r =>
      '<div class="v2-kv"><span class="k">' + esc(((r.event_date || r.date || r.start_date || '') + '').slice(0, 10)) + '</span>' +
      '<span class="v">' + esc(r.title || r.name || '') + '</span></div>').join('');
  }).catch(e => alive && ctx.ui.renderError(evEl, 'โหลดกิจกรรมไม่สำเร็จ', null, null, e.message));

  ctx.ui.renderLoading(anEl);
  ctx.repo.calendar.annFeed({ limit: 15 }).then(rows => {
    if (!alive) return;
    if (!rows.length) return ctx.ui.renderEmpty(anEl, 'ไม่มีประกาศ');
    anEl.innerHTML = rows.map(r =>
      '<div class="v2-card" style="margin-bottom:8px" data-id="' + esc(r.id) + '">' +
      '<b style="font-size:14px">' + esc(r.title || '') + '</b>' +
      (r.body ? '<p style="margin:4px 0 0;font-size:13.5px;color:#475569;white-space:pre-wrap">' + esc(String(r.body).slice(0, 300)) + '</p>' : '') +
      '<small style="color:#94A3B8">' + esc(((r.published_at || r.created_at || '') + '').slice(0, 10)) + '</small></div>').join('');
    anEl.querySelectorAll('[data-id]').forEach(c => c.addEventListener('click', () => {
      ctx.repo.calendar.annRead(c.dataset.id).catch(() => {});
    }));
  }).catch(e => alive && ctx.ui.renderError(anEl, 'โหลดประกาศไม่สำเร็จ', null, null, e.message));
}

export function unmount() { alive = false; }
