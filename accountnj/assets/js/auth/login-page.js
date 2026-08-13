import { APP_NAME, MAINT_MESSAGE } from '../core/config.js';
import { loginWithName, loadMyProfile } from './login-api.js';
import { AppState } from '../core/state.js';
import { rpc } from '../core/supabase-client.js';
import { esc } from '../core/formatter.js';

export async function renderLogin(onSuccess) {
  /* บล็อค login ระหว่าง Maintenance (Force Update) */
  let maint = null;
  try {
    const st = await rpc('njacc_app_status');
    if (st && st.maintenance_active) maint = st.maintenance_message || MAINT_MESSAGE;
  } catch (e) { /* เช็คไม่ได้ → แสดงฟอร์มปกติ */ }

  document.body.innerHTML = `<div class="login-wrap"><div class="login-card">
    <div class="login-logo">NJ</div>
    <h2 class="login-t">${esc(APP_NAME)}</h2>
    <p class="login-s">ระบบบัญชี Billing · N.J. Logistics</p>
    <div id="lg-err" class="login-err hide"></div>
    ${maint ? `<div class="login-maint">${esc(maint)}</div>` : ''}
    <form id="lg-form" autocomplete="off">
      <div class="fld"><label>User</label>
        <input class="inp w100" id="lg-u" autocomplete="username" ${maint ? 'disabled' : ''}></div>
      <div class="fld"><label>Password</label>
        <div class="lg-pw">
          <input class="inp w100" id="lg-p" type="password" autocomplete="current-password" ${maint ? 'disabled' : ''}>
          <button type="button" class="lg-eye" id="lg-eye" ${maint ? 'disabled' : ''}
            aria-label="แสดง/ซ่อนรหัสผ่าน">👁</button>
        </div></div>
      <button class="btn btn-p w100 mt-2" id="lg-btn" type="submit" ${maint ? 'disabled' : ''}
        style="justify-content:center">เข้าสู่ระบบ</button>
    </form></div></div>`;

  const u = document.getElementById('lg-u');
  const pw = document.getElementById('lg-p');
  const err = document.getElementById('lg-err');
  const btn = document.getElementById('lg-btn');
  if (!maint) u.focus();

  document.getElementById('lg-eye').onclick = () => {
    pw.type = pw.type === 'password' ? 'text' : 'password';
    document.getElementById('lg-eye').textContent = pw.type === 'password' ? '👁' : '🙈';
    pw.focus();
  };

  let busy = false;
  document.getElementById('lg-form').onsubmit = async (e) => {   /* ENTER = submit ในตัว */
    e.preventDefault();
    if (busy || maint) return;
    err.classList.add('hide');
    if (!u.value.trim() || !pw.value) {
      err.textContent = 'กรอก User และ Password'; err.classList.remove('hide'); return;
    }
    busy = true; btn.disabled = true; btn.textContent = 'กำลังเข้าสู่ระบบ…';   /* กันกดซ้ำ */
    try {
      await loginWithName(u.value.trim(), pw.value);
      AppState.profile = await loadMyProfile();
      pw.value = '';
      onSuccess();
    } catch (ex) {
      err.textContent = ex.message || 'เข้าสู่ระบบไม่สำเร็จ';
      err.classList.remove('hide');
      busy = false; btn.disabled = false; btn.textContent = 'เข้าสู่ระบบ';
      pw.focus(); pw.select();
    }
  };
}
