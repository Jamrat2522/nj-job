/* HR V2 — modules/profile/profile.js — ข้อมูลตัวเอง + สิทธิ์ลาคงเหลือ + สถานะวันนี้ (อ่านอย่างเดียว) */
import { typeName } from '../leave/leave.js';

let alive = false;

export function mount(el, ctx) {
  alive = true;
  const esc = ctx.ui.esc;
  const u = ctx.session.user || {};
  el.innerHTML =
    '<div class="pfp v2-grid2" style="align-items:start">' +
    '<div class="v2-card"><h3>ข้อมูลของฉัน</h3>' +
    '<div class="v2-kv"><span class="k">ชื่อ</span><span class="v">' + esc(u.emp_name || '-') + '</span></div>' +
    '<div class="v2-kv"><span class="k">รหัสพนักงาน</span><span class="v">' + esc(u.emp_code || '-') + '</span></div>' +
    '<div class="v2-kv"><span class="k">ชื่อผู้ใช้</span><span class="v">' + esc(u.username || '-') + '</span></div>' +
    '<div class="v2-kv"><span class="k">สิทธิ์</span><span class="v">' + esc(ctx.ROLE_TH[u.role] || u.role || '-') + '</span></div>' +
    '<p class="hm-sub">แก้ไขข้อมูลส่วนตัว/รหัสผ่าน กรุณาติดต่อ HR หรือผู้ดูแลระบบ</p></div>' +
    '<div class="v2-card"><h3>สิทธิ์ลาคงเหลือ</h3><div id="pf-bal"></div></div></div>';
  const balEl = el.querySelector('#pf-bal');
  ctx.ui.renderLoading(balEl);
  ctx.repo.leave.balances().then(rows => {
    if (!alive) return;
    if (!rows.length) return ctx.ui.renderEmpty(balEl, 'ยังไม่มีข้อมูลสิทธิ์ลา');
    balEl.innerHTML = rows.map(b =>
      '<div class="v2-kv"><span class="k">' + esc(typeName(b.leave_type)) + '</span>' +
      '<span class="v">คงเหลือ <b>' + esc(b.remaining == null ? 'ไม่จำกัด' : b.remaining) + '</b>' +
      (b.quota != null ? ' / ' + esc(b.quota) : '') + '</span></div>').join('');
  }).catch(e => alive && ctx.ui.renderError(balEl, 'โหลดสิทธิ์ลาไม่สำเร็จ', null, null, e.message));
}

export function unmount() { alive = false; }
