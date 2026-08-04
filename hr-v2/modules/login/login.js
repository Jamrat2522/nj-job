/* HR V2 — modules/login/login.js
   ใช้ njhr_login เดิม · กัน double-submit · error ชัดเจน · ไม่มีบัญชีทดลองใน Production */
let cleanup = null;

export function mount(el, ctx) {
  const esc = ctx.ui.esc;
  el.innerHTML =
    '<div class="lg-wrap"><div class="lg-card">' +
    '<div class="lg-brand"><span class="v2-badge big">NJ</span><h1>NJ LOGISTIC</h1><p>HR SYSTEM · V2</p></div>' +
    '<form id="lg-form" novalidate>' +
    '<label class="v2-field"><span>ชื่อผู้ใช้</span><input type="text" id="lg-user" autocomplete="username" required></label>' +
    '<label class="v2-field"><span>รหัสผ่าน</span><span class="lg-pw"><input type="password" id="lg-pass" autocomplete="current-password" required>' +
    '<button type="button" class="lg-eye" id="lg-eye" aria-label="แสดงรหัสผ่าน">👁</button></span></label>' +
    '<div class="v2-form-error" id="lg-error" role="alert"></div>' +
    '<button class="btn btn-primary btn-block" id="lg-btn" type="submit">เข้าสู่ระบบ</button>' +
    '</form>' +
    '<p class="lg-foot">เวอร์ชันทดสอบ — เปิดใช้เฉพาะผู้ดูแลระบบและผู้ทดสอบ · <span>' + esc(ctx.BUILD) + '</span></p>' +
    '</div></div>';

  const form = el.querySelector('#lg-form'), btn = el.querySelector('#lg-btn'),
        err = el.querySelector('#lg-error');
  let busy = false, eye = false;

  el.querySelector('#lg-eye').onclick = () => {
    eye = !eye;
    el.querySelector('#lg-pass').type = eye ? 'text' : 'password';
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (busy) return;                                     // กันกดซ้ำ
    err.textContent = '';
    const u = el.querySelector('#lg-user').value.trim();
    const p = el.querySelector('#lg-pass').value;
    if (!u || !p) { err.textContent = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'; return; }
    busy = true; btn.disabled = true; btn.textContent = 'กำลังตรวจสอบ…';
    try {
      /* ตรวจ maintenance ล่าสุดก่อน login (บล็อกการ login ระหว่างปิดปรับปรุง — ยกเว้น flow SUPER_ADMIN ใน guard) */
      const st = await ctx.guard.checkNow();
      if (st.blocked) return;
      const user = await ctx.session.login(u, p);
      if (!ctx.session.v2Allowed && user.role !== 'SUPER_ADMIN') {
        location.hash = '#/no-access'; return;
      }
      ctx.toast.show('ยินดีต้อนรับ ' + (user.emp_name || user.username));
      location.hash = '#/home';
      location.reload();                                  // เริ่ม shell ใหม่ด้วย session ปัจจุบัน
    } catch (e) {
      err.textContent = (e && e.message) || 'เข้าสู่ระบบไม่สำเร็จ';
    } finally {
      busy = false; btn.disabled = false; btn.textContent = 'เข้าสู่ระบบ';
    }
  };
  form.addEventListener('submit', onSubmit);
  el.querySelector('#lg-user').focus();
  cleanup = () => form.removeEventListener('submit', onSubmit);
}

export function unmount() { if (cleanup) { cleanup(); cleanup = null; } }
