/* HR V2 — modules/notify/notify.js — njhr_notify_list / read / read_all + อัปเดต badge ที่ shell */
import { refreshBell } from '../../app/app-shell.js';

let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  el.innerHTML =
    '<div class="ntp"><div class="v2-toolbar"><b style="flex:1">การแจ้งเตือน</b>' +
    '<button class="btn btn-ghost" id="nt-all">อ่านทั้งหมดแล้ว</button></div><div id="nt-list"></div></div>';
  const listEl = el.querySelector('#nt-list');

  async function load() {
    ctx.ui.renderLoading(listEl);
    try {
      const rows = await ctx.repo.notify.list(30, 0);
      if (!alive) return;
      if (!rows.length) return ctx.ui.renderEmpty(listEl, 'ไม่มีการแจ้งเตือน');
      listEl.innerHTML = rows.map(r =>
        '<div class="v2-card" style="margin-bottom:8px;' + (r.read_at ? 'opacity:.65' : '') + '" data-id="' + esc(r.id) + '">' +
        '<b style="font-size:14px">' + esc(r.title || '') + '</b>' +
        (r.body ? '<p style="margin:4px 0 0;font-size:13.5px;color:#475569">' + esc(r.body) + '</p>' : '') +
        '<small style="color:#94A3B8">' + esc((r.created_at || '').slice(0, 16).replace('T', ' ')) + '</small></div>').join('');
      listEl.querySelectorAll('[data-id]').forEach(c => c.addEventListener('click', async () => {
        try { await ctx.repo.notify.read(c.dataset.id); c.style.opacity = '.65'; refreshBell(ctx); } catch (_) {}
      }));
    } catch (e) { if (alive) ctx.ui.renderError(listEl, 'โหลดการแจ้งเตือนไม่สำเร็จ', load, 'ลองอีกครั้ง', e.message); }
  }
  el.querySelector('#nt-all').addEventListener('click', async function () {
    try { await ctx.repo.notify.readAll(); load(); refreshBell(ctx); ctx.toast.show('อ่านทั้งหมดแล้ว'); }
    catch (e) { ctx.toast.show(e.message || 'ไม่สำเร็จ', 'error'); }
  });
  load();
}

export function unmount() { alive = false; }
