/* HR V2 — modules/home/home.js
   หน้าแรกหลังเข้าสู่ระบบ (Phase 2): ข้อมูลผู้ใช้จากเซิร์ฟเวอร์ + สถานะการเชื่อมต่อ
   Phase 3 จะแทนที่ด้วย Dashboard ที่อ่านจาก RPC จริง (80_dashboard.sql) */
export function mount(el, ctx) {
  const esc = ctx.ui.esc, u = ctx.session.user;
  el.innerHTML =
    '<div class="hm">' +
    '<div class="v2-card"><h3>ยินดีต้อนรับ</h3>' +
    '<p><b>' + esc(u.emp_name || u.username) + '</b> · ' + esc(ctx.ROLE_TH[u.role] || u.role) + '</p>' +
    '<p class="hm-sub">รหัสพนักงาน: ' + esc(u.emp_code || '-') + '</p></div>' +
    '<div class="v2-card"><h3>สถานะระบบ</h3><div id="hm-status">' + '</div></div>' +
    (ctx.readOnly ? '<div class="v2-card hm-ro">🔒 ขณะนี้ระบบอยู่ในโหมดอ่านอย่างเดียว</div>' : '') +
    '</div>';
  const st = el.querySelector('#hm-status');
  ctx.ui.renderLoading(st);
  ctx.client.rpc('njhr_version_status', {}).then(s => {
    st.innerHTML =
      '<p>เวอร์ชันเซิร์ฟเวอร์: <b>' + esc(s.version) + '</b> · เวอร์ชันเครื่องนี้: <b>' + esc(ctx.BUILD) + '</b> ' +
      (s.version === ctx.BUILD ? '<span class="hm-ok">ตรงกัน</span>' : '<span class="hm-warn">ไม่ตรง</span>') + '</p>' +
      '<p class="hm-sub">เวลาเซิร์ฟเวอร์: ' + esc(new Date(s.server_time).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })) + ' (Asia/Bangkok)</p>';
  }).catch(e => ctx.ui.renderError(st, 'อ่านสถานะไม่สำเร็จ', null, null, e.message));
}
export function unmount() {}
