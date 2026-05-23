// =========================================================
// auth.js — Authentication (login, register, setup, logout)
// =========================================================

import { sb, FAKE_DOMAIN } from './supabase.js';
import { S } from './state.js';
import { $, esc, showOnly, refreshIcons, pickColor } from './utils.js';

// ---------- Alerts ----------
function authAlert(msg, type){
  const el = $('auth-alert');
  if(el) el.innerHTML = `<div class="alert alert-${type}">${esc(msg)}</div>`;
}
function setupAlert(msg, type){
  const el = $('setup-alert');
  if(el) el.innerHTML = `<div class="alert alert-${type}">${esc(msg)}</div>`;
}
function clearAuthAlert(){
  const el = $('auth-alert');
  if(el) el.innerHTML = '';
}

// ---------- Tab switching ----------
export function switchAuthTab(tab){
  $('tab-login').classList.toggle('active', tab === 'login');
  $('tab-register').classList.toggle('active', tab === 'register');
  $('form-login').style.display = tab === 'login' ? '' : 'none';
  $('form-register').style.display = tab === 'register' ? '' : 'none';
  clearAuthAlert();
}

// ---------- Login ----------
export async function doLogin(){
  const u = $('lg-username').value.trim();
  const p = $('lg-password').value;
  if(!u || !p) return authAlert('กรอก Username และ Password', 'error');

  const btn = $('btn-login');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> กำลังเข้าสู่ระบบ...';

  try {
    // Look up by username first to get the actual email used
    const { data: userRec } = await sb.from('users')
      .select('email,username,status')
      .eq('username', u)
      .maybeSingle();
    const email = (userRec && userRec.email && userRec.email.includes('@'))
      ? userRec.email
      : (u + FAKE_DOMAIN);

    const { error } = await sb.auth.signInWithPassword({ email, password: p });
    if(error){
      // Fallback: try with fake domain
      if(email !== u + FAKE_DOMAIN){
        const r2 = await sb.auth.signInWithPassword({ email: u + FAKE_DOMAIN, password: p });
        if(r2.error) throw error;
      } else {
        throw error;
      }
    }
    // boot() will be called by caller after login succeeds
    return true;
  } catch(e){
    authAlert(
      e.message === 'Invalid login credentials'
        ? 'Username หรือ Password ไม่ถูกต้อง'
        : (e.message || 'เข้าสู่ระบบไม่สำเร็จ'),
      'error'
    );
    return false;
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'เข้าสู่ระบบ';
  }
}

// ---------- Register ----------
export async function doRegister(){
  const u = $('rg-username').value.trim();
  const p = $('rg-password').value;
  const p2 = $('rg-password2').value;
  const em = $('rg-email').value.trim();
  const dep = $('rg-department').value.trim();

  if(!u || !p) return authAlert('กรอก Username และ Password', 'error');
  if(p.length < 6) return authAlert('รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร', 'error');
  if(p !== p2) return authAlert('รหัสผ่านไม่ตรงกัน', 'error');

  const btn = $('btn-register');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> กำลังสมัคร...';

  try {
    // Check duplicate username
    const { data: dup } = await sb.from('users').select('id').eq('username', u).maybeSingle();
    if(dup) throw new Error('Username นี้มีคนใช้แล้ว');

    const authEmail = em && em.includes('@') ? em : (u.toLowerCase() + FAKE_DOMAIN);
    const { data: sign, error: e1 } = await sb.auth.signUp({ email: authEmail, password: p });
    if(e1) throw e1;
    if(!sign.user) throw new Error('สมัครไม่สำเร็จ');

    const { error: e2 } = await sb.from('users').insert({
      auth_id: sign.user.id,
      username: u,
      password_display: p,
      email: em || authEmail,
      full_name: u,
      department: dep || null,
      role: 'STAFF',
      status: 'pending',
      avatar_color: pickColor(u)
    });
    if(e2) throw e2;

    // Sign out — they need approval first
    await sb.auth.signOut();
    authAlert('สมัครสำเร็จ! รอ Admin อนุมัติก่อนเข้าใช้งาน', 'success');
    switchAuthTab('login');
    $('lg-username').value = u;
    $('lg-password').value = '';
    $('rg-email').value = '';
    $('rg-department').value = '';
  } catch(e){
    authAlert(e.message || 'สมัครไม่สำเร็จ', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'สมัครสมาชิก';
  }
}

// ---------- Setup first SUPER_ADMIN ----------
export async function doSetupSuperAdmin(){
  const u = $('su-username').value.trim();
  const p = $('su-password').value;
  const p2 = $('su-password2').value;
  const fn = $('su-fullname').value.trim();
  const em = $('su-email').value.trim();

  setupAlert('', 'info');
  if(!u || !p) return setupAlert('กรอกข้อมูลให้ครบ', 'error');
  if(p.length < 6) return setupAlert('รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร', 'error');
  if(p !== p2) return setupAlert('รหัสผ่านไม่ตรงกัน', 'error');

  setupAlert('กำลังสร้างบัญชี...', 'info');
  try {
    const email = em || (u + FAKE_DOMAIN);
    const { data: sign, error: e1 } = await sb.auth.signUp({ email, password: p });
    if(e1) throw e1;
    if(!sign.user) throw new Error('ไม่สามารถสร้างบัญชีได้');

    const { error: e2 } = await sb.from('users').insert({
      auth_id: sign.user.id,
      username: u,
      password_display: p,
      email: em || null,
      full_name: fn || u,
      role: 'SUPER_ADMIN',
      status: 'active',
      avatar_color: pickColor(u)
    });
    if(e2) throw e2;

    setupAlert('สร้างบัญชี SUPER ADMIN สำเร็จ! กำลังเข้าสู่ระบบ...', 'success');
    return true;
  } catch(e){
    setupAlert(e.message || 'เกิดข้อผิดพลาด', 'error');
    return false;
  }
}

// ---------- Logout ----------
export async function doLogout(){
  try { await sb.auth.signOut(); } catch(_) {}
  S.user = null;
  S.authUser = null;
  showOnly('screen-auth');
  refreshIcons();
}

// ---------- Session load ----------
export async function loadCurrentUser(){
  const { data: { session } } = await sb.auth.getSession();
  if(!session){ S.authUser = null; S.user = null; return null; }
  S.authUser = session.user;
  const { data, error } = await sb.from('users').select('*').eq('auth_id', session.user.id).maybeSingle();
  if(error){ console.error(error); return null; }
  S.user = data;
  return data;
}
