/* ============================================================================
 * NJ LOGISTIC HR SYSTEM • app.js  (SPA controller)
 * ========================================================================== */
/* Auth, Data, Norm, USE_DEMO ถูกประกาศไว้แล้วใน supabase.js (global scope)
   จึงใช้ได้โดยตรง ไม่ต้องประกาศซ้ำ (กัน "Identifier already declared") */

/* ---- tiny DOM helpers ----------------------------------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const baht = (n) => Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (n) => Number(n || 0).toLocaleString('th-TH');
// หน่วงการเรียกซ้ำ (ลดการ re-render ถี่ตอนพิมพ์ค้นหา)
function debounce(fn, ms = 180) { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; }
// จำนวนรายการต่อหน้า (ใช้ร่วมกัน: รายชื่อพนักงาน / เงินเดือน / สลิป / ประกันสังคม)
const HR_PAGE_SIZE = 7;
const avatar = (name, size = 40, forceColor = null) => {
  const init = (name || '?').trim().charAt(0);
  const colors = ['#D60000', '#1f2937', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed'];
  const c = forceColor || colors[(name || '').length % colors.length];
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='100%' height='100%' rx='${size}' fill='${c}'/><text x='50%' y='54%' dy='.1em' font-size='${size * .42}' fill='white' font-family='sans-serif' font-weight='700' text-anchor='middle' dominant-baseline='middle'>${init}</text></svg>`
  )}`;
};

/* ---- บีบรูปภาพก่อนแนบ/อัปโหลด (เร็ว ไฟล์เล็ก) ----------------------------- */
// คืนค่าเป็น Blob/File ที่บีบแล้ว ถ้าไม่ใช่รูปจะคืนไฟล์เดิม
async function compressImage(file, maxW = 1280, quality = 0.7) {
  if (!file || !file.type || !file.type.startsWith('image/')) return file; // ไม่ใช่รูป -> ไม่แตะ
  if (file.type === 'image/gif') return file; // gif (อาจเป็น animation) -> ข้าม
  try {
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
    });
    const img = await new Promise((res, rej) => {
      const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = dataUrl;
    });
    const scale = Math.min(1, maxW / img.width);
    if (scale >= 1 && file.size < 300 * 1024) return file; // เล็กอยู่แล้ว -> ไม่ต้องบีบ
    const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file; // บีบแล้วไม่เล็กลง -> ใช้ไฟล์เดิม
    const out = new File([blob], file.name.replace(/\.(png|webp|bmp|heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
    return out;
  } catch (_) {
    return file; // บีบไม่ได้ -> ใช้ไฟล์เดิม
  }
}

/* ---- icon set ------------------------------------------------------------- */
const I = {
  home:'M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9',
  users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11',
  clock:'M12 8v4l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  ot:'M12 7v5l3 2M12 22a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  leave:'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  money:'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  slip:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8M8 9h2',
  sso:'M3 12h4l2 5 4-10 2 5h6',
  report:'M3 3v18h18M7 16V9M12 16V5M17 16v-7',
  settings:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 3.6 1.65 1.65 0 0 0 10 2.09V2a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.4 9a1.65 1.65 0 0 0 1.51 1H22a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z',
  member:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6',
  logout:'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  profile:'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
};
const svg = (path, sz = 20) => `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none"><path d="${path}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* ---- menu definitions ----------------------------------------------------- */
const MENU_ADMIN = [
  { id:'dashboard', label:'Dashboard', icon:'home' },
  { id:'employees', label:'พนักงาน', icon:'users' },
  { id:'attendance', label:'ลงเวลา', icon:'clock' },
  { id:'ot', label:'OT', icon:'ot' },
  { id:'leave', label:'ลางาน', icon:'leave' },
  { id:'payroll', label:'เงินเดือน', icon:'money' },
  { id:'payslip', label:'สลิปเงินเดือน', icon:'slip' },
  { id:'sso', label:'ประกันสังคม', icon:'sso' },
  { id:'reports', label:'รายงาน', icon:'report' },
  { sep:true },
  { id:'settings', label:'ตั้งค่า', icon:'settings' },
  { id:'users', label:'จัดการสมาชิก', icon:'member' },
  { id:'logout', label:'ออกจากระบบ', icon:'logout' },
];
const MENU_EMP = [
  { id:'dashboard', label:'หน้าหลัก', icon:'home' },
  { id:'myinfo', label:'ข้อมูลของฉัน', icon:'users' },
  { id:'attendance', label:'ลงเวลา', icon:'clock' },
  { id:'ot', label:'OT', icon:'ot' },
  { id:'leave', label:'ลางาน', icon:'leave' },
  { id:'payroll', label:'เงินเดือน', icon:'money' },
  { id:'payslip', label:'สลิปเงินเดือน', icon:'slip' },
  { sep:true },
  { id:'profile', label:'โปรไฟล์', icon:'profile' },
  { id:'logout', label:'ออกจากระบบ', icon:'logout' },
];
const MOBILE_NAV = [
  { id:'dashboard', label:'หน้าหลัก', icon:'home' },
  { id:'attendance', label:'ลงเวลา', icon:'clock' },
  { id:'leave', label:'ลางาน', icon:'leave' },
  { id:'payslip', label:'เงินเดือน', icon:'slip' },
  { id:'profile', label:'โปรไฟล์', icon:'profile' },
];

const PAGE_TITLES = {
  dashboard:'Dashboard', employees:'พนักงาน', myinfo:'ข้อมูลพนักงาน', attendance:'ลงเวลา',
  ot:'OT', leave:'ลางาน', payroll:'เงินเดือน', payslip:'สลิปเงินเดือน', sso:'ประกันสังคม',
  reports:'รายงาน', settings:'ตั้งค่า', users:'จัดการสมาชิก', profile:'โปรไฟล์',
};

/* ============================================================================
 * APP STATE + BOOT
 * ========================================================================== */
const state = { route:'dashboard', employees:[], leaves:[] };

document.addEventListener('DOMContentLoaded', () => {
  bindLogin();
  bindDbSetup();
  if (njAutoLogin()) startApp();
});

/* ---- ตั้งค่าเชื่อมต่อฐานข้อมูล (ใส่ anon key ครั้งแรก) -------------------- */
function bindDbSetup() {
  const status = $('#dbStatus'), panel = $('#dbPanel'), toggle = $('#dbToggle');
  if (!status) return;
  const live = (typeof window.NJ_isLive === 'function') ? window.NJ_isLive() : !USE_DEMO;
  if (live) {
    status.textContent = '● เชื่อมต่อฐานข้อมูลจริงแล้ว';
    status.className = 'db-status live';
  } else {
    status.textContent = '● โหมดทดลอง (DEMO) — แตะเพื่อใส่คีย์';
    status.className = 'db-status demo';
    panel.style.display = 'block';   // โหมดทดลอง: เปิดแผงให้เห็นช่องใส่ทันที
  }
  // เติมค่าเดิมถ้ามี
  try {
    const sk = localStorage.getItem('nj_supabase_key'), su = localStorage.getItem('nj_supabase_url');
    if (sk && $('#dbKey')) $('#dbKey').value = sk;
    if (su && $('#dbUrl')) $('#dbUrl').value = su;
  } catch (_) {}
  toggle.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });
  $('#dbSave').addEventListener('click', () => {
    const key = $('#dbKey').value.trim(), url = $('#dbUrl').value.trim();
    if (!key) { toast('กรุณาวาง anon public key', 'err'); return; }
    if (key.length < 30) { toast('คีย์ดูสั้นเกินไป ตรวจสอบอีกครั้ง', 'err'); return; }
    // ตรวจจับ secret/service_role key (ห้ามใช้ในเบราว์เซอร์)
    const role = detectKeyRole(key);
    if (role === 'service_role' || /^sb_secret_/i.test(key) || /service[_-]?role/i.test(key)) {
      toast('❌ นี่คือ secret key (service_role) — ใช้ในเบราว์เซอร์ไม่ได้ กรุณาใช้คีย์ "anon public" แทน', 'err', 6000);
      return;
    }
    window.NJ_setSupabaseKey(key, url);
    toast('บันทึกแล้ว • กำลังเชื่อมต่อฐานข้อมูล...', 'ok', 1800);
    setTimeout(() => location.reload(), 900);   // รีโหลดเพื่อสร้าง client ใหม่
  });
  $('#dbClear').addEventListener('click', () => {
    window.NJ_clearSupabaseKey();
    toast('ล้างคีย์แล้ว • กลับสู่โหมดทดลอง', 'ok', 1800);
    setTimeout(() => location.reload(), 900);
  });
}
// ถอดรหัส JWT แล้วอ่าน role (anon / service_role) — ไม่ verify แค่ดู payload
function detectKeyRole(jwt) {
  try {
    const part = jwt.split('.')[1];
    if (!part) return null;
    const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    return json.role || null;
  } catch (_) { return null; }
}

/* ---- login ---------------------------------------------------------------- */
/* ---- Remember Me / Auto-login (Patch 17) — แก้เฉพาะ app.js, ไม่แตะ Supabase/Schema/Role ----
 * เก็บเฉพาะ session object (username/role/emp_code ฯลฯ) + วันหมดอายุ — ไม่เก็บรหัสผ่าน
 * ติ๊กจดจำฉัน -> localStorage + อยู่ได้ 30 วัน | ไม่ติ๊ก -> sessionStorage (ปิดเบราว์เซอร์แล้วต้อง login ใหม่) */
var NJ_REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;
function njRememberOnLogin() {
  try {
    var cb = document.getElementById('rememberMe');
    var remember = cb ? cb.checked : true;
    if (remember) {
      localStorage.setItem('nj_hr_remember_until', String(Date.now() + NJ_REMEMBER_MS));
      sessionStorage.removeItem('nj_hr_session_s');
    } else {
      var sess = localStorage.getItem('nj_hr_session') || (Auth.current ? JSON.stringify(Auth.current) : '');
      if (sess) { try { sessionStorage.setItem('nj_hr_session_s', sess); } catch (e) {} }
      localStorage.removeItem('nj_hr_session');
      localStorage.removeItem('nj_hr_remember_until');
    }
  } catch (e) {}
}
function njAutoLogin() {
  try {
    var until = parseInt(localStorage.getItem('nj_hr_remember_until') || '0', 10);
    if (until && Date.now() < until && Auth.restore()) return true;
    if (until && Date.now() >= until) { localStorage.removeItem('nj_hr_remember_until'); localStorage.removeItem('nj_hr_session'); }
  } catch (e) {}
  try {
    var s = sessionStorage.getItem('nj_hr_session_s');
    if (s) { Auth.current = JSON.parse(s); return true; }
  } catch (e) {}
  return false;
}
function njInjectRemember() {
  try {
    if (document.getElementById('rememberMe')) return;
    var btn = document.getElementById('btnLogin');
    if (!btn || !btn.parentNode) return;
    var wrap = document.createElement('label');
    wrap.className = 'login-remember';
    wrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin:2px 0 14px;cursor:pointer;font-size:14px;color:#555;user-select:none';
    wrap.innerHTML = '<input type="checkbox" id="rememberMe" checked style="width:18px;height:18px;accent-color:var(--red,#e11d2a)"/> <span>จดจำฉัน (อยู่ในระบบ 30 วัน)</span>';
    btn.parentNode.insertBefore(wrap, btn);
  } catch (e) {}
}
function bindLogin() {
  njInjectRemember();
  const doLogin = async () => {
    const u = $('#username').value, p = $('#password').value;
    const err = $('#loginErr');
    if (!u || !p) { err.textContent = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'; err.classList.add('show'); return; }
    const btn = $('#btnLogin'); btn.textContent = 'กำลังเข้าสู่ระบบ...'; btn.disabled = true;
    const res = await Auth.login(u, p);
    btn.textContent = 'เข้าสู่ระบบ'; btn.disabled = false;
    if (res.error) { err.textContent = res.error; err.classList.add('show'); return; }
    err.classList.remove('show');
    njRememberOnLogin();
    startApp();
  };
  $('#btnLogin').addEventListener('click', doLogin);
  $('#password').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  $('#username').addEventListener('keydown', e => { if (e.key === 'Enter') $('#password').focus(); });
}

async function startApp() {
  const u = Auth.current;
  $('#loginScreen').style.display = 'none';
  $('#app').classList.add('active');
  $('#meName').textContent = u.full_name || u.username;
  $('#meRole').textContent = roleLabel(u.role);
  $('#meAvatar').src = avatar(u.full_name || u.username);

  buildNav();
  buildMobileNav();

  // load data (ขนานกัน — ลดเวลารอตอนเปิดแอป)
  if (window.NJ && NJ.cloudPreload) { try { await NJ.cloudPreload(); } catch (_) {} }   // Live: ดึง config จาก Supabase ลง cache ก่อน
  const [emps, lvs, ots] = await Promise.all([Data.employees(), Data.leaves(), Data.ots()]);
  state.employees = emps;
  state.leaves = lvs;
  state.ots = ots;

  // โหลด/ย้ายข้อมูลแผนก + ผู้อนุมัติแผนก (additive — ไม่กระทบของเดิม)
  try { if (typeof njDeptLazyLoad === 'function') njDeptLazyLoad(); } catch (_) {}

  bindShell();
  go(state.route);

  if (USE_DEMO) toast('โหมดทดลอง: กด "⚙️ ตั้งค่าฐานข้อมูล" ที่หน้าเข้าสู่ระบบ เพื่อใส่ Supabase key', 'ok', 4200);
}

function roleLabel(r) {
  return { SUPER_ADMIN:'Super Admin', ADMIN:'Admin', HR:'ฝ่ายบุคคล', ACCOUNT:'ฝ่ายบัญชี', MANAGER:'ผู้จัดการ', EMPLOYEE:'พนักงาน' }[r] || r;
}

/* ---- nav ------------------------------------------------------------------ */
function buildNav() {
  const menu = Auth.isAdmin() ? MENU_ADMIN : MENU_EMP;
  const nav = $('#navMenu'); nav.innerHTML = '';
  menu.forEach(m => {
    if (m.sep) { nav.appendChild(el('div', 'sep')); return; }
    const b = el('button', 'nav-item', svg(I[m.icon]) + `<span>${m.label}</span>`);
    b.dataset.id = m.id;
    b.addEventListener('click', () => m.id === 'logout' ? doLogout() : go(m.id));
    nav.appendChild(b);
  });
}
function buildMobileNav() {
  const nav = $('#mobileNav'); nav.innerHTML = '';
  MOBILE_NAV.forEach(m => {
    const b = el('button', 'mnav', svg(I[m.icon], 22) + `<span>${m.label}</span>`);
    b.dataset.id = m.id;
    b.addEventListener('click', () => { if (m.id === 'menu') toggleSidebar(true); else go(m.id); });
    nav.appendChild(b);
  });
}

function bindShell() {
  const hb = $('#hamburger'); if (hb) hb.addEventListener('click', () => toggleSidebar(true));
  const mf = $('#mobileMenuFab'); if (mf) mf.addEventListener('click', () => toggleSidebar(true));
  $('#scrim').addEventListener('click', () => toggleSidebar(false));
  $('#modalBg').addEventListener('click', e => { if (e.target.id === 'modalBg') closeModal(); });
  const gs = $('#globalSearch');
  if (gs) gs.addEventListener('input', e => {
    if (state.route === 'employees') { state.employeePage = 1; renderEmployees(e.target.value); }
  });
}
function toggleSidebar(open) {
  $('#sidebar').classList.toggle('open', open);
  $('#scrim').classList.toggle('show', open);
}

/* ---- router --------------------------------------------------------------- */
function go(route) {
  state.route = route;
  // หยุดนาฬิกาหน้าลงเวลาเมื่อออกจากหน้า (กัน setInterval ทำงานทิ้งไว้)
  if (route !== 'attendance') { clearInterval(window._clk); window._clk = null; }
  // ยกเลิก Realtime ของหน้ารายงานเมื่อออกจากหน้า (กัน subscribe ค้าง)
  if (route !== 'reports' && typeof rptTeardownRealtime === 'function') rptTeardownRealtime();
  // หน้าที่มีหัวข้อใหญ่ในหน้าแล้ว ไม่ต้องแสดงชื่อหน้าซ้ำบน topbar
  const ownHeader = ['dashboard', 'employees', 'payroll', 'payslip', 'attendance', 'sso', 'reports', 'ot', 'leave', 'users', 'settings'];
  $('#pageTitle').textContent = ownHeader.includes(route) ? '' : (PAGE_TITLES[route] || route);
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.id === route));
  $$('.mnav').forEach(n => n.classList.toggle('active', n.dataset.id === route));
  toggleSidebar(false);
  // ลบ class ซ่อน scrollbar ของ 3 หน้า ก่อนเปลี่ยนหน้าเสมอ (แต่ละ render จะใส่กลับเอง)
  $('#view').classList.remove('hr-page-no-scroll', 'employees-no-scroll', 'payroll-no-scroll', 'sso-no-scroll', 'payslip-compact', 'sso-compact', 'reports-compact', 'settings-compact', 'users-compact');
  // ซ่อน scrollbar ของ viewport หลัก (html/body) เฉพาะ 3 หน้านี้ — ใช้ pagination แทนการเลื่อน
  const noScrollRoutes = ['employees', 'payroll', 'sso'];
  if (route !== 'users') state.appUsers = null;   // รีเฟรชรายชื่อสมาชิกทุกครั้งที่เข้าหน้าใหม่
  document.body.classList.toggle('hr-body-no-scroll', noScrollRoutes.includes(route));
  document.documentElement.classList.toggle('hr-html-no-scroll', noScrollRoutes.includes(route));
  $('#view').scrollTop = 0; window.scrollTo(0, 0);

  const R = {
    dashboard:renderDashboard, employees:() => renderEmployees(''), myinfo:renderMyInfo,
    attendance:renderAttendance, ot:renderOT, leave:renderLeave, payroll:renderPayroll,
    payslip:renderPayslip, sso:renderSSO, reports:renderReports, settings:renderSettings,
    users:renderUsers, profile:renderMyInfo,
  };
  (R[route] || renderDashboard)();
  // marker class สำหรับย่อความสูงเฉพาะหน้า (CSS scope ด้วย #view.xxx-compact)
  const COMPACT = { sso:'sso-compact', reports:'reports-compact', settings:'settings-compact', users:'users-compact' };
  if (COMPACT[route]) $('#view').classList.add(COMPACT[route]);
}

/* ============================================================================
 * MODULES
 * ========================================================================== */

/* ---- DASHBOARD ------------------------------------------------------------ */
function renderDashboard() {
  const emps = state.employees || [];
  const total = emps.length;
  const active = emps.filter(e => e.status !== 'RESIGNED');
  const activeCount = active.length || 1;
  const today = new Date().toISOString().slice(0, 10);
  // ลางานวันนี้ (จากข้อมูลที่โหลดไว้)
  const onleave = (state.leaves || []).filter(l => {
    if (String(l.status || '').toUpperCase() === 'REJECTED') return false;
    const s = l.start || l.start_date || ''; const e2 = l.end || l.end_date || s;
    return s && s <= today && today <= e2;
  }).length;
  // OT วันนี้ (ชั่วโมง)
  const otHours = (state.ots || []).reduce((sum, o) => {
    const d = o.ot_date || o.date || ''; return d === today ? sum + Number(o.ot_hours != null ? o.ot_hours : (o.hours || 0)) : sum;
  }, 0);
  // เงินเดือนรวม + ประกันสังคมรวม เดือนนี้ (คำนวณจากพนักงานที่ทำงานอยู่)
  let payrollSum = 0, ssoSum = 0;
  active.forEach(e => {
    try { payrollSum += (NJ.Data.calcPayroll(e, (state.payrollMonthly || {})[e.emp_code]).net) || 0; } catch (_) {}
    const base = Number(e.base_salary || 0);
    if (base > 0) ssoSum += Math.min(base * 0.05, 750);
  });
  const fmtM = (n) => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : num(Math.round(n));
  const u = Auth.current || {};

  const v = $('#view');
  v.innerHTML = `
    <div class="dash-mobile">
      <div class="dm-greet">
        <img src="${avatar(u.full_name || u.username, 56)}"/>
        <div><small>สวัสดีครับ</small><b>${u.full_name || u.username || ''}</b><span>${roleLabel(u.role)}</span></div>
      </div>
      <div class="dm-actions">
        <button class="dm-card" data-go="attendance"><span class="dm-ic red">${svg(I.clock, 24)}</span><b>ลงเวลา</b><small>สแกนเข้า-ออกงาน</small></button>
        <button class="dm-card" data-go="leave"><span class="dm-ic amber">${svg(I.leave, 24)}</span><b>ลางาน</b><small>ขออนุมัติวันลา</small></button>
        <button class="dm-card" data-go="payslip"><span class="dm-ic green">${svg(I.money, 24)}</span><b>เงินเดือน</b><small>ดูเงินเดือน / สลิป</small></button>
        <button class="dm-card" data-go="profile"><span class="dm-ic blue">${svg(I.profile, 24)}</span><b>โปรไฟล์</b><small>ข้อมูลส่วนตัว</small></button>
      </div>
    </div>
    <div class="lv-banner mb dash-hide-mobile">
      <div class="lv-banner-ic">▦</div>
      <div><h2 style="margin:0;font-size:21px;font-weight:800">Dashboard</h2>
        <p class="muted" style="margin:1px 0 0;font-size:12.5px">ภาพรวมข้อมูลพนักงานและการทำงานในองค์กร</p></div>
    </div>
    <div class="kpi-grid dash-hide-mobile">
      ${kpi('users','red','พนักงานทั้งหมด',num(total),'คน','ทั้งหมด','rose')}
      ${kpiId('clock','green','เข้างานวันนี้','kpiPresent','คน','kpiPresentMeta','green')}
      ${kpi('leave','amber','ลางานวันนี้',num(onleave),'คน',((onleave/activeCount)*100).toFixed(2)+'%','orange')}
      ${kpiId('clock','amber','มาสายวันนี้','kpiLate','คน','kpiLateMeta','yellow')}
      ${kpiId('users','red','ขาดงานวันนี้','kpiAbsent','คน','kpiAbsentMeta','red')}
      ${kpi('ot','dark','OT วันนี้',num(otHours),'ชม.','','slate')}
      ${kpi('money','blue','เงินเดือนเดือนนี้',fmtM(payrollSum),'บาท','พนักงานทำงานอยู่','blue')}
      ${kpi('sso','green','ประกันสังคม',num(Math.round(ssoSum)),'บาท','เดือนนี้','emerald')}
    </div>
    <div class="grid-2">
      <div class="card dash-hide-mobile">
        <div class="card-head"><h3>การลงเวลาวันนี้</h3></div>
        <div class="card-pad">
          <div class="donut-wrap">
            <div class="donut" id="dashDonut">${donut(0, 0, 0)}<div class="pct">…</div></div>
            <ul class="legend">
              <li><span class="sw" style="background:var(--green)"></span>เข้างาน <b id="kpiPresentLeg">…</b></li>
              <li><span class="sw" style="background:var(--amber)"></span>มาสาย <b id="kpiLateLeg">…</b></li>
              <li><span class="sw" style="background:var(--red)"></span>ขาดงาน <b id="kpiAbsentLeg">…</b></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>ประกาศ / แจ้งเตือน</h3></div>
        <div class="card-pad">
          ${announce('🎉','แจ้งวันหยุดประจำปี 2567','ประกาศเมื่อ 10 เม.ย. 2567')}
          ${announce('📄','ส่งสลิปเงินเดือนเดือนเมษายน','ประกาศเมื่อ 30 เม.ย. 2567')}
          ${announce('🏥','ตรวจสุขภาพประจำปี 2567','ประกาศเมื่อ 15 พ.ค. 2567')}
        </div>
      </div>
    </div>`;
  $$('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
  loadDashboardAttendance(activeCount);
}
// ใส่ค่า "เข้างาน/มาสาย/ขาด วันนี้" จาก Supabase (อ่านอย่างเดียว, ล้มเหลว = 0)
async function loadDashboardAttendance(activeCount) {
  let rows = [];
  try { rows = await Data.attendanceToday(); } catch (_) { rows = []; }
  const norm = s => String(s || '').toUpperCase();
  const present = rows.filter(r => r.check_in || ['PRESENT','NORMAL','LATE','ON_TIME'].includes(norm(r.status))).length;
  const late = rows.filter(r => norm(r.status) === 'LATE').length;
  const absent = rows.filter(r => norm(r.status) === 'ABSENT').length;
  const pct = n => activeCount ? ((n / activeCount) * 100).toFixed(2) + '%' : '0%';
  const set = (id, val) => { const x = $('#' + id); if (x) x.textContent = val; };
  set('kpiPresent', num(present)); set('kpiPresentMeta', pct(present)); set('kpiPresentLeg', present + ' คน');
  set('kpiLate', num(late));       set('kpiLateMeta', pct(late));       set('kpiLateLeg', late + ' คน');
  set('kpiAbsent', num(absent));   set('kpiAbsentMeta', pct(absent));   set('kpiAbsentLeg', absent + ' คน');
  const dc = $('#dashDonut');
  if (dc) dc.innerHTML = donut(present, late, absent) + `<div class="pct">${activeCount ? Math.round(present / activeCount * 100) : 0}%</div>`;
}
function kpiId(icon, color, lbl, valId, unit, metaId, tone) {
  return `<div class="kpi${tone ? ' kpi-tone tone-' + tone : ''}"><div class="ic ${color}">${svg(I[icon], 24)}</div>
    <div><div class="lbl">${lbl}</div><div class="val"><span id="${valId}">…</span><small>${unit}</small></div>
    <div class="meta" id="${metaId}">…</div></div></div>`;
}
function kpi(icon, color, lbl, val, unit, meta, tone) {
  return `<div class="kpi${tone ? ' kpi-tone tone-' + tone : ''}"><div class="ic ${color}">${svg(I[icon], 24)}</div>
    <div><div class="lbl">${lbl}</div><div class="val">${val}<small>${unit}</small></div>
    ${meta ? `<div class="meta">${meta}</div>` : ''}</div></div>`;
}
function announce(ic, title, sub) {
  return `<div class="announce"><div class="ic">${ic}</div><div><b>${title}</b><small>${sub}</small></div></div>`;
}
function donut(g, a, r) {
  const tot = g + a + r, C = 2 * Math.PI * 60;
  const seg = (val, color, off) => `<circle cx="75" cy="75" r="60" fill="none" stroke="${color}" stroke-width="22"
    stroke-dasharray="${(val / tot) * C} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 75 75)"/>`;
  let off = 0;
  const sg = seg(g, 'var(--green)', off); off += (g / tot) * C;
  const sa = seg(a, 'var(--amber)', off); off += (a / tot) * C;
  const sr = seg(r, 'var(--red)', off);
  return `<svg viewBox="0 0 150 150" width="150" height="150"><circle cx="75" cy="75" r="60" fill="none" stroke="#f1f3f5" stroke-width="22"/>${sg}${sa}${sr}</svg>`;
}

/* ---- EMPLOYEES (list) ----------------------------------------------------- */
// KPI การ์ดหน้าพนักงาน
function empKpi(icon, color, label, value) {
  // color -> tone class (เต็มใบ + ไอคอน gradient + เลขสีตามหมวด + accent)
  const tone = { red:'k-red', green:'k-green', amber:'k-amber', blue:'k-blue' }[color] || 'k-red';
  return `<div class="emp-kpi ek-tone ${tone}">
    <div class="emp-kpi-ic">${icon}</div>
    <div><div class="emp-kpi-lbl">${label}</div><div class="emp-kpi-val">${value}</div></div>
  </div>`;
}
// แสดงชื่อแผนกแบบย่อ (display-only) — ไม่กระทบค่าจริงในฐานข้อมูล
function getDepartmentDisplayName(department) {
  const map = {
    'SHIPPING AIRPORT': 'AIRPORT',
    'CUSTOMER SERVICE EXPORT': 'EXPORT',
    'CUSTOMER SERVICE IMPORT': 'IMPORT',
  };
  return map[String(department || '').trim().toUpperCase()] || department;
}
// badge แผนกพร้อมสีตามกลุ่ม
function deptBadge(dept) {
  if (!dept) return '-';
  const d = dept.toUpperCase();
  let cls = 'gray', ic = '🏢';
  if (d.includes('MANAGER')) { cls = 'red'; ic = '👥'; }
  else if (d.includes('ACCOUNT')) { cls = 'blue'; ic = '📄'; }
  else if (d.includes('SHIPPING')) { cls = 'green'; ic = '🚚'; }
  else if (d.includes('CUSTOMER')) { cls = 'amber'; ic = '🎧'; }
  else if (d.includes('MAID')) { cls = 'purple'; ic = '🧹'; }
  return `<span class="dept-badge ${cls}">${ic} ${getDepartmentDisplayName(dept)}</span>`;
}
function renderEmployees(q) {
  q = (q || '').toLowerCase();
  state.employeeSearch = q;
  const deptFilter = state.employeeDepartmentFilter || '';
  const nameFilter = state.employeeNameFilter || '';

  // ตัวเลือก dropdown: ดึงจากข้อมูลพนักงานจริง
  const departments = [...new Set(state.employees.map(e => e.department_name).filter(Boolean))].sort();
  const people = state.employees.map(e => ({ code: e.emp_code, name: `${e.first_name} ${e.last_name}` }));

  // Filter logic: 1) search 2) แผนก 3) พนักงาน
  const list = state.employees.filter(e => {
    if (q && !`${e.emp_code} ${e.first_name} ${e.last_name} ${e.department_name}`.toLowerCase().includes(q)) return false;
    if (deptFilter && e.department_name !== deptFilter) return false;
    if (nameFilter && e.emp_code !== nameFilter) return false;
    return true;
  });

  // 4) pagination จากผลลัพธ์หลังกรอง
  const pageSize = state.employeePageSize || HR_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  state.employeePage = Math.min(state.employeePage || 1, totalPages);
  const start = (state.employeePage - 1) * pageSize;
  const pageRows = list.slice(start, start + pageSize);

  const rows = pageRows.map(e => `
    <tr>
      <td><b>${e.emp_code || '-'}</b></td>
      <td><div class="emp-cell"><img src="${avatar(e.first_name)}"/><div><b style="font-size:18px;font-weight:600;color:#111827">${e.first_name} ${e.last_name}</b></div></div></td>
      <td>${deptBadge(e.department_name)}</td>
      <td class="t-num" style="white-space:nowrap"><b class="emp-list-salary">${Number(e.base_salary || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></td>
      <td>${e.status === 'RESIGNED' ? '<span class="badge red">● ลาออก</span>' : '<span class="badge green">● ทำงาน</span>'}</td>
      <td><div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" data-emp="${e.emp_code}" style="gap:6px">👁 ดูข้อมูล</button>
        <button class="btn btn-ghost btn-sm" data-empedit="${e.emp_code}" style="gap:6px">✏️ แก้ไข</button>
        <button class="btn btn-ghost btn-sm" data-empdel="${e.emp_code}" style="gap:6px;color:var(--red)">🗑 ลบ</button>
        ${Auth.canEditDiligence() ? `<button class="btn btn-ghost btn-sm" data-dilg="${e.emp_code}" style="padding:0 9px" title="แก้ไขเบี้ยขยัน / โหมด">💰</button>` : ''}
      </div></td>
    </tr>`).join('');

  // KPI
  const total = state.employees.length;
  const active = state.employees.filter(e => e.status !== 'RESIGNED').length;
  const resigned = state.employees.filter(e => e.status === 'RESIGNED').length;
  const sumSalary = state.employees.filter(e => e.status !== 'RESIGNED').reduce((a, e) => a + Number(e.base_salary || 0), 0);

  $('#view').innerHTML = `
    <div class="emp-head mb">
      <div style="display:flex;align-items:center;gap:14px">
        <div class="emp-head-ic">👥</div>
        <div>
          <h2 style="font-size:21px;font-weight:800;margin:0">รายชื่อพนักงาน <span style="color:var(--red)">(${total})</span></h2>
          <p class="muted" style="margin:1px 0 0;font-size:12.5px">จัดการข้อมูลพนักงานทั้งหมดในระบบ</p>
        </div>
      </div>
      <div style="display:flex;gap:9px;flex-wrap:wrap">
        <input type="file" id="empImportFile" accept=".xlsx,.xls,.csv" style="display:none" onchange="window.importEmployeesExcel(this)"/>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('empImportFile').click()">📥 Import</button>
        <button class="btn btn-ghost btn-sm" onclick="window.exportEmployees()">📤 Export</button>
        <button class="btn btn-primary btn-sm" onclick="window.empForm()">+ เพิ่มพนักงาน</button>
      </div>
    </div>

    <div class="kpi-grid mb payroll-compact-kpi">
      ${empKpi('👥','red','พนักงานทั้งหมด', total + ' คน')}
      ${empKpi('✅','green','พนักงานที่ทำงานอยู่', active + ' คน')}
      ${empKpi('🚫','amber','พนักงานลาออก', resigned + ' คน')}
      ${empKpi('💰','blue','เงินเดือนรวมทั้งหมด', num(sumSalary) + ' บาท')}
    </div>

    <div class="card payroll-compact-table">
      <div class="card-head" style="flex-wrap:wrap;gap:12px;align-items:center">
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <select class="input" id="employeeDepartmentFilter" style="width:200px;height:40px" title="หัวข้อแผนก">
            <option value="">ทุกแผนก</option>
            ${departments.map(d => `<option value="${d}" ${d === deptFilter ? 'selected' : ''}>${getDepartmentDisplayName(d)}</option>`).join('')}
          </select>
          <select class="input" id="employeeNameFilter" style="width:220px;height:40px" title="พนักงาน">
            <option value="">พนักงานทั้งหมด</option>
            ${people.map(p => `<option value="${p.code}" ${p.code === nameFilter ? 'selected' : ''}>${p.name} (${p.code})</option>`).join('')}
          </select>
          <input class="input" id="employeeSearchBox" style="width:280px;height:40px" placeholder="🔍 ค้นหาชื่อ, รหัสพนักงาน, แผนก" value="${q || ''}"/>
        </div>
      </div>
      <div class="tbl-wrap fit-table-wrap emp-list-wrap"><table class="emp-table emp-list-table">
        <thead><tr><th>รหัสพนักงาน</th><th>พนักงาน</th><th>แผนก</th><th class="t-num">เงินเดือน</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:40px" class="muted">ไม่พบข้อมูล</td></tr>'}</tbody>
      </table></div>
      ${pager(state.employeePage, totalPages)}
    </div>`;
  $('#view').classList.add('hr-page-no-scroll', 'employees-no-scroll');
  $$('[data-emp]').forEach(b => b.addEventListener('click', () => renderEmployeeDetail(b.dataset.emp)));
  $$('[data-empedit]').forEach(b => b.addEventListener('click', () => window.empForm(b.dataset.empedit)));
  $$('[data-empdel]').forEach(b => b.addEventListener('click', () => window.empDelete(b.dataset.empdel)));
  $$('[data-dilg]').forEach(b => b.addEventListener('click', () => window.diligenceForm(b.dataset.dilg)));

  // bind filters (เปลี่ยนแล้ว reset page = 1)
  const dep = $('#employeeDepartmentFilter');
  if (dep) dep.addEventListener('change', e => {
    state.employeeDepartmentFilter = e.target.value; state.employeePage = 1;
    renderEmployees(state.employeeSearch || '');
  });
  const nm = $('#employeeNameFilter');
  if (nm) nm.addEventListener('change', e => {
    state.employeeNameFilter = e.target.value; state.employeePage = 1;
    renderEmployees(state.employeeSearch || '');
  });
  // ช่องค้นหา: ค้นหาชื่อ/รหัส/แผนก (รักษา cursor หลัง re-render)
  const sb = $('#employeeSearchBox');
  if (sb) {
    const run = debounce((val) => {
      state.employeePage = 1;
      renderEmployees(val);
      const box = $('#employeeSearchBox');
      if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); }
    }, 180);
    sb.addEventListener('input', e => { state.employeeSearch = e.target.value; run(e.target.value); });
  }

  // bind pagination
  $$('.pager [data-page]').forEach(btn => btn.addEventListener('click', () => {
    const p = btn.dataset.page;
    if (p === 'prev') state.employeePage = Math.max(1, state.employeePage - 1);
    else if (p === 'next') state.employeePage = Math.min(totalPages, state.employeePage + 1);
    else state.employeePage = Number(p);
    renderEmployees(state.employeeSearch || '');
  }));
}

/* ---- EMPLOYEE DETAIL ------------------------------------------------------ */
function renderEmployeeDetail(code) {
  const e = state.employees.find(x => x.emp_code === code) || state.employees[0];
  go._silent = true;
  $('#pageTitle').textContent = 'ข้อมูลพนักงาน';
  const gross = (Number(e.base_salary) + Number(e.position_allow) + Number(e.diligence_allow) + Number(e.phone_allow) + Number(e.travel_allow));
  $('#view').innerHTML = `
    <button class="btn btn-ghost btn-sm mb" onclick="window.back('employees')">← กลับ</button>
    <div class="grid-2" style="align-items:start">
      <div class="card card-pad" style="text-align:center">
        <img src="${avatar(e.first_name, 140)}" style="width:140px;height:140px;border-radius:50%;margin:0 auto 12px;display:block"/>
        <span class="badge green">● ทำงาน</span>
        <h2 style="font-family:var(--font-display);font-size:24px;margin:10px 0 2px">${e.first_name} ${e.last_name}</h2>
        <div class="muted">${e.emp_code} • ${e.position_name || ''}</div>
        <div style="text-align:left;margin-top:20px;display:grid;gap:10px;font-size:14px">
          ${kv('แผนก', getDepartmentDisplayName(e.department_name))}
          ${kv('ตำแหน่ง', e.position_name)}
          ${kv('วันเริ่มงาน', thDate(e.start_date))}
          ${kv('เบอร์โทร', e.phone || '-')}
          ${kv('อีเมล', e.email || '-')}
          ${kv('ธนาคาร', e.bank_name || '-')}
          ${kv('เลขบัญชี', e.bank_account || '-')}
        </div>
      </div>
      <div style="display:grid;gap:16px">
        <div class="card">
          <div class="card-head"><h3>ข้อมูลเงินเดือน</h3><button class="btn btn-primary btn-sm no-print" onclick="window.print()">🖨️ พิมพ์</button></div>
          <div class="card-pad">
            <div class="grid-3" style="gap:12px">
              ${stat('เงินเดือนพื้นฐาน', baht(e.base_salary))}
              ${stat('ค่าตำแหน่ง', baht(e.position_allow))}
              ${stat('เบี้ยขยัน', baht(e.diligence_allow))}
              ${stat('ค่าโทรศัพท์', baht(e.phone_allow))}
              ${stat('ค่าเดินทาง', baht(e.travel_allow))}
              ${stat('รวมรายได้/เดือน', baht(gross), true)}
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>สิทธิ์การลา (คงเหลือ)</h3></div>
          <div class="card-pad grid-3" style="gap:14px">
            ${leaveStat('🤒','ลาป่วย','15 วัน','green-soft')}
            ${leaveStat('💼','ลากิจ','10 วัน','blue')}
            ${leaveStat('🏖️','ลาพักร้อน','6 วัน','amber')}
            ${leaveStat('👶','ลาคลอด','- วัน','red')}
            ${leaveStat('🙏','ลาบวช','- วัน','gray')}
            ${leaveStat('📋','ลาอื่นๆ','- วัน','gray')}
          </div>
        </div>
      </div>
    </div>`;
}
function kv(k, val) { return `<div style="display:flex"><span class="muted" style="width:110px;flex:none">${k}</span><b style="font-weight:600">${val || '-'}</b></div>`; }
function stat(lbl, val, hl) { return `<div style="padding:12px;background:var(--gray);border-radius:11px"><div class="muted" style="font-size:12px">${lbl}</div><div style="font-family:var(--font-display);font-weight:700;font-size:17px;color:${hl ? 'var(--green)' : 'inherit'}">${val}</div></div>`; }
function leaveStat(ic, lbl, val, c) { return `<div style="display:flex;align-items:center;gap:11px"><div style="width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--gray);font-size:19px">${ic}</div><div><div class="muted" style="font-size:12px">${lbl}</div><b style="font-family:var(--font-display);font-size:16px">${val}</b></div></div>`; }
window.back = (r) => { $('#pageTitle').textContent = PAGE_TITLES[r]; go(r); };

/* ---- MY INFO (employee) --------------------------------------------------- */
function renderMyInfo() {
  const code = Auth.current.emp_code || 'EMP0001';
  renderEmployeeDetail(code);
  $('#pageTitle').textContent = state.route === 'profile' ? 'โปรไฟล์' : 'ข้อมูลพนักงาน';
}

/* ---- ATTENDANCE (มีแท็บย่อย: เข้า-ออกงาน / กะการทำงาน / ประวัติ / สรุป) ----- */
function renderAttendance() {
  if (!state.attTab) state.attTab = 'scan';
  const shiftLabel = Auth.canEditShift() ? '🕒 กะการทำงาน' : '🕒 กะของฉัน';
  const tabs = [
    ['scan', '📷 เข้า-ออกงาน'],
    ['shift', shiftLabel],
    ['history', '📋 ประวัติลงเวลา'],
    ['summary', '📊 สรุปเวลาทำงาน'],
  ];
  $('#view').innerHTML = `
    <div class="lv-banner mb">
      <div class="lv-banner-ic">📅</div>
      <div><h2 style="margin:0;font-size:21px;font-weight:800">ลงเวลา</h2>
        <p class="muted" style="margin:1px 0 0;font-size:12.5px">จัดการเวลาเข้า-ออกงานของพนักงานอย่างมีประสิทธิภาพ</p></div>
    </div>
    <div class="card">
      <div class="card-pad">
        <div class="tabs" id="attTabs">
          ${tabs.map(([k, l]) => `<button class="tab ${state.attTab === k ? 'active' : ''}" data-att="${k}">${l}</button>`).join('')}
        </div>
        <div id="attBody" class="mt"></div>
      </div>
    </div>`;
  $$('#attTabs .tab').forEach(t => t.addEventListener('click', () => { state.attTab = t.dataset.att; renderAttendance(); }));
  ({ scan:attScan, shift:attShift, history:attHistory, summary:attSummary }[state.attTab] || attScan)();
}

/* เข้า-ออกงาน — ADMIN เห็นแบบเดิม (สองการ์ด + GPS), USER เห็นการ์ดเดียว ไม่มี GPS */
function attScan() {
  if (!Auth.isAdmin()) return attScanUser();   // ผู้ใช้ทั่วไป (USER/STAFF/MESSENGER) -> มุมมองง่าย
  return attScanAdmin();
}

/* ---- มุมมอง ADMIN (เดิมทุกประการ) ---------------------------------------- */
function attScanAdmin() {
  const card = (type) => {
    const isIn = type === 'in';
    return `<div class="att-card att-card-v3 ${type}">
      <h3>${isIn ? '☀️ เข้างาน' : '🌙 ออกงาน'}</h3><div class="date">วันที่ ${todayTH()}</div>
      <div class="clock ${isIn ? 'clk-in' : 'clk-out'}" id="clk${isIn ? 'In' : 'Out'}">--:--:--</div>
      <div class="att-status badge ${isIn ? 'green' : 'red'}" id="attStatus${isIn ? 'In' : 'Out'}">${isIn ? '✓ ยังไม่ได้เข้างาน' : '✗ ยังไม่ออกงาน'}</div>
      <div class="att-frame att-frame-v3 ${isIn ? 'in' : 'out'}">
        <span class="scan-corner" style="top:-6px;left:-6px;border-right:none;border-bottom:none"></span>
        <span class="scan-corner" style="top:-6px;right:-6px;border-left:none;border-bottom:none"></span>
        <span class="scan-corner" style="bottom:-6px;left:-6px;border-right:none;border-top:none"></span>
        <span class="scan-corner" style="bottom:-6px;right:-6px;border-left:none;border-top:none"></span>
        <img src="${avatar(Auth.current.full_name, 120)}"/>
      </div>
      <p class="muted" style="margin-bottom:14px">สแกนใบหน้าเพื่อ${isIn ? 'เข้า' : 'ออก'}งาน • GPS</p>
      <button class="btn att-btn-v3 ${isIn ? 'in' : 'out'}" style="width:100%;justify-content:center" onclick="window.checkIn('${type}', this)">📷 สแกนหน้า${isIn ? 'เข้า' : 'ออก'}งาน</button>
    </div>`;
  };
  $('#attBody').innerHTML = `
    <div class="att-grid mb">${card('in')}${card('out')}</div>
    <div class="card card-pad gps-card-v3" style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="kpi-ic" style="width:46px;height:46px;border-radius:13px;background:var(--red-soft);color:var(--red);display:grid;place-items:center;font-size:20px">📍</div>
        <div><div class="muted" style="font-size:12px">ตำแหน่งที่ตั้งปัจจุบัน (GPS)</div>
          <b id="gpsText">99/99 หมู่ 1 ต.บางเสาธง อ.บางเสาธง จ.สมุทรปราการ • 13.6537, 100.7501</b></div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="window.refreshGPS()">📍 อัปเดต GPS</button>
    </div>`;
  startClock();
  attLoadTodayStatus();   // อ่าน attendance วันนี้ของผู้ใช้ -> อัปเดตการ์ด/นาฬิกาให้ตรงข้อมูลจริง
}

/* ---- มุมมอง USER (ใหม่): การ์ดเดียว ปุ่มเดียว ตัวใหญ่ ไม่มี GPS ------------- *
 * โหลดสถานะวันนี้จริงจาก Supabase ก่อนแสดง — ไม่ใช้ข้อความตายตัว */
function attScanUser() {
  $('#attBody').innerHTML = `<div class="att-user-wrap"><div class="att-user-card">
    <div class="muted" style="text-align:center;padding:34px">กำลังโหลดสถานะวันนี้…</div></div></div>`;
  Data.myAttendanceToday().then(row => attRenderUserCard(row || null)).catch(() => attRenderUserCard(null));
}
function attRenderUserCard(row) {
  if (state.route !== 'attendance' || state.attTab !== 'scan') return;   // กันเปลี่ยนหน้าไปแล้ว
  const checkIn  = row && row.check_in  ? row.check_in  : null;
  const checkOut = row && row.check_out ? row.check_out : null;
  const inT  = checkIn  ? attFmtTime(checkIn)  : null;
  const outT = checkOut ? attFmtTime(checkOut) : null;

  let statusHTML, btnHTML, showLiveClock = true;
  if (!checkIn) {
    statusHTML = `<div class="att-user-status pending">● ยังไม่ได้เข้างาน</div>`;
    btnHTML = `<button class="btn att-user-btn in" id="attUserBtn" onclick="window.checkIn('in', this)">📷 สแกนหน้าเข้างาน</button>`;
  } else if (!checkOut) {
    statusHTML = `<div class="att-user-status ok">✓ เข้างานแล้ว</div>`;
    btnHTML = `<button class="btn att-user-btn out" id="attUserBtn" onclick="window.checkIn('out', this)">📷 สแกนหน้าออกงาน</button>`;
  } else {
    statusHTML = `<div class="att-user-status done">✓ ลงเวลาครบแล้ววันนี้</div>`;
    btnHTML = `<button class="btn att-user-btn done" disabled>ลงเวลาครบแล้ววันนี้</button>`;
    showLiveClock = false;
  }

  $('#attBody').innerHTML = `
    <div class="att-user-wrap">
      <div class="att-user-card">
        <div class="att-user-date">${todayTH()}</div>
        ${showLiveClock ? `<div class="att-user-clock" id="clkUser">--:--:--</div>` : ''}
        ${statusHTML}
        <div class="att-frame att-frame-v3 in att-user-frame">
          <span class="scan-corner" style="top:-6px;left:-6px;border-right:none;border-bottom:none"></span>
          <span class="scan-corner" style="top:-6px;right:-6px;border-left:none;border-bottom:none"></span>
          <span class="scan-corner" style="bottom:-6px;left:-6px;border-right:none;border-top:none"></span>
          <span class="scan-corner" style="bottom:-6px;right:-6px;border-left:none;border-top:none"></span>
          <img src="${avatar(Auth.current.full_name, 120)}"/>
        </div>
        <div class="att-user-times">
          <div><span class="muted">เวลาเข้างาน</span><b class="${inT ? '' : 'muted'}">${inT || '--:--:--'}</b></div>
          <div><span class="muted">เวลาออกงาน</span><b class="${outT ? '' : 'muted'}">${outT || '--:--:--'}</b></div>
        </div>
        ${btnHTML}
      </div>
    </div>`;
  if (showLiveClock) startClock();   // นาฬิกาสด เฉพาะตอนยังลงเวลาไม่ครบ
}

/* ---- อ่านสถานะเข้า/ออกงานวันนี้ (ใช้ในมุมมอง ADMIN สองการ์ด) ---------------
 * - มี check_in  -> การ์ดเข้างานแสดง "✓ เข้างานแล้ว" + เวลา check_in จริง
 * - มี check_out -> การ์ดออกงานแสดง "✓ ออกงานแล้ว" + เวลา check_out จริง
 * - ไม่มีข้อมูล   -> คงข้อความเดิม
 * - นาฬิกาที่ตั้งเวลาจริงจะถูก "ล็อก" กัน startClock() เขียนทับ */
function attFmtTime(iso) {
  try { return iso ? new Date(iso).toLocaleTimeString('th-TH', { hour12: false }) : ''; }
  catch (_) { return ''; }
}
function attApplyStatus(type, iso) {
  const isIn = type === 'in';
  const clk = $(isIn ? '#clkIn' : '#clkOut');
  const badge = $(isIn ? '#attStatusIn' : '#attStatusOut');
  const t = attFmtTime(iso);
  if (clk && t) { clk.textContent = t; clk.dataset.locked = '1'; }   // ห้าม startClock ทับเวลาจริง
  if (badge) {
    badge.textContent = isIn ? '✓ เข้างานแล้ว' : '✓ ออกงานแล้ว';
    badge.classList.remove('red'); badge.classList.add('green');
  }
}
async function attLoadTodayStatus() {
  let row = null;
  try { row = await Data.myAttendanceToday(); } catch (_) { row = null; }
  if (!row) return;                       // ไม่มีข้อมูล -> คงข้อความเดิม
  if (row.check_in)  attApplyStatus('in', row.check_in);
  if (row.check_out) attApplyStatus('out', row.check_out);
}
/* ===== Geofence + Face capture (SAFE PATCH: logic หลังปุ่มเดิมเท่านั้น) ===== */
const ATTENDANCE_LOCATIONS = [
  {
    location_name: 'ออฟฟิศใหญ่',
    latitude: 13.6537,
    longitude: 100.7501,
    radius_meter: 100,
    status: 'ACTIVE',
  },
];

// 1) ขอพิกัด GPS ปัจจุบัน (ไม่อนุญาต -> throw)
function getCurrentGPS() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('อุปกรณ์ไม่รองรับ GPS'));
    navigator.geolocation.getCurrentPosition(
      p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => reject(new Error('ไม่ได้รับอนุญาตให้เข้าถึง GPS')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

// 2) ระยะห่าง (เมตร) ด้วย Haversine
function calcDistanceMeter(lat1, lon1, lat2, lon2) {
  const R = 6371000, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 3) หาพื้นที่อนุญาตที่อยู่ในรัศมี
function findAllowedLocation(lat, lon) {
  let nearest = null, nearestDist = Infinity;
  for (const loc of ATTENDANCE_LOCATIONS) {
    if (loc.status !== 'ACTIVE') continue;
    const d = calcDistanceMeter(lat, lon, loc.latitude, loc.longitude);
    if (d < nearestDist) { nearestDist = d; nearest = loc; }
    if (d <= loc.radius_meter)
      return { allowed: true, location_name: loc.location_name, distance_meter: Math.round(d) };
  }
  return { allowed: false, nearest_location_name: nearest ? nearest.location_name : '-', distance_meter: Math.round(nearestDist) };
}

// 4) เปิดกล้องจริง ถ่ายภาพใบหน้า -> base64 (ไม่อนุญาต -> throw)
async function captureFaceSnapshot() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
    throw new Error('อุปกรณ์ไม่รองรับกล้อง');
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
  } catch (e) {
    throw new Error('ไม่ได้รับอนุญาตให้ใช้กล้อง');
  }
  try {
    const video = document.createElement('video');
    video.srcObject = stream; video.muted = true; video.playsInline = true;
    await video.play();
    await new Promise(r => setTimeout(r, 350)); // ให้กล้องโฟกัสสักครู่
    const vw = video.videoWidth || 480, vh = video.videoHeight || 360;
    // บีบภาพ: กว้างสูงสุด 480px คงสัดส่วน -> ไฟล์เล็ก อัปโหลดเร็ว
    const MAXW = 480;
    const scale = Math.min(1, MAXW / vw);
    const w = Math.round(vw * scale), h = Math.round(vh * scale);
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(video, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.6); // คุณภาพ 0.6 -> เล็กลง ~60%
  } finally {
    stream.getTracks().forEach(t => t.stop()); // หยุดกล้องเสมอ
  }
}

window.refreshGPS = async () => {
  try {
    const { latitude, longitude } = await getCurrentGPS();
    const g = $('#gpsText');
    if (g) g.textContent = `ตำแหน่งปัจจุบัน • ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    const r = findAllowedLocation(latitude, longitude);
    if (r.allowed) toast(`✅ อยู่ในพื้นที่: ${r.location_name} ระยะ ${r.distance_meter} เมตร`, 'ok', 3500);
    else toast(`❌ อยู่นอกพื้นที่ที่อนุญาต ระยะ ${r.distance_meter} เมตร`, 'err', 3500);
  } catch (e) {
    toast(e.message || 'ไม่สามารถเข้าถึง GPS', 'err');
  }
};

/* 🕒 กะการทำงาน — admin จัดการได้ / employee เห็นเฉพาะ "กะของฉัน" */
async function attShift() {
  const body = $('#attBody');
  if (!Auth.canEditShift()) {
    const s = await Data.myShift(Auth.current.emp_code || 'EMP0001');
    body.innerHTML = `
      <div class="card" style="max-width:520px">
        <div class="card-head"><h3>กะของฉัน</h3></div>
        <div class="card-pad">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
            <div style="width:64px;height:64px;border-radius:16px;background:var(--gray);display:grid;place-items:center;font-size:30px">${s.icon || '🕒'}</div>
            <div><h2 style="font-family:var(--font-display);font-size:22px">${s.shift_name}</h2>
              <span class="badge green">● ใช้งาน</span></div>
          </div>
          <div class="grid-2" style="gap:12px">
            ${stat('เวลาทำงาน', `${s.start_time} - ${s.end_time}`)}
            ${stat('สายได้', `${s.late_allow_minutes} นาที`)}
            ${stat('พักกลางวัน', `${s.break_minutes} นาที`)}
            ${stat('วันทำงาน', s.working_days)}
            ${stat('คิด OT หลัง', s.ot_start_after)}
          </div>
        </div>
      </div>`;
    return;
  }
  // ADMIN view
  const shifts = await Data.shifts();
  state._shifts = shifts;
  const rows = shifts.map(s => `<tr>
    <td><b>${s.icon || '🕒'} ${s.shift_name}</b>${window.shiftGpsBadge ? window.shiftGpsBadge(s.id) : ''}</td>
    <td>${s.start_time}</td><td>${s.end_time}</td><td>${s.break_minutes} น.</td>
    <td>${s.late_allow_minutes} น.</td><td>${s.ot_start_after}</td><td>${s.working_days}</td>
    <td>${s.status === 'ACTIVE' ? '<span class="badge green">ใช้งาน</span>' : '<span class="badge gray">ปิด</span>'}</td>
    <td style="display:flex;gap:6px">
      <button class="icon-btn shift-action" data-action="edit" data-shift-id="${s.id}" title="แก้ไข">✏️</button>
      <button class="icon-btn shift-action" data-action="members" data-shift-id="${s.id}" title="พนักงานในกะ">👥</button>
      <button class="icon-btn shift-action" data-action="gps" data-shift-id="${s.id}" title="พื้นที่สแกนหน้า">📍</button>
      <button class="icon-btn shift-action" data-action="delete" data-shift-id="${s.id}" title="ลบ">🗑</button>
    </td></tr>`).join('');
  const cards = shifts.map(s => `
    <div class="card card-pad">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div><b style="font-size:16px">${s.icon || '🕒'} ${s.shift_name}</b>${window.shiftGpsBadge ? window.shiftGpsBadge(s.id) : ''}</div>
        ${s.status === 'ACTIVE' ? '<span class="badge green">ใช้งาน</span>' : '<span class="badge gray">ปิด</span>'}
      </div>
      <div class="grid-2" style="gap:8px;margin:12px 0">
        ${stat('เวลา', `${s.start_time}-${s.end_time}`)}${stat('สายได้', `${s.late_allow_minutes} น.`)}
        ${stat('พัก', `${s.break_minutes} น.`)}${stat('OT หลัง', s.ot_start_after)}
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm shift-action" data-action="edit" data-shift-id="${s.id}" style="flex:1;justify-content:center">✏️ แก้ไข</button>
        <button class="btn btn-ghost btn-sm shift-action" data-action="members" data-shift-id="${s.id}" style="flex:1;justify-content:center">👥 จัดคน</button>
        <button class="icon-btn shift-action" data-action="gps" data-shift-id="${s.id}" title="พื้นที่สแกนหน้า">📍</button>
        <button class="icon-btn shift-action" data-action="delete" data-shift-id="${s.id}">🗑</button>
      </div>
    </div>`).join('');
  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px">
      <p class="muted" style="margin:0">จัดการกะการทำงาน — เชื่อมกับการลงเวลา, OT และเงินเดือน</p>
      <div style="display:flex;gap:9px">
        <button class="btn btn-ghost btn-sm" onclick="window.monthlySchedule()">📅 ตารางกะรายเดือน</button>
        <button class="btn btn-primary btn-sm" onclick="window.shiftForm()">➕ เพิ่มกะ</button>
      </div>
    </div>
    <div class="tbl-wrap shift-table fit-table-wrap"><table class="emp-table">
      <thead><tr><th>กะ</th><th>เวลาเข้า</th><th>เวลาออก</th><th>พัก</th><th>สายได้</th><th>OT หลัง</th><th>วันทำงาน</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <div class="shift-cards">${cards}</div>`;
}

/* 📋 ประวัติลงเวลา (คงตารางเดิม) */
function attHistory() {
  if (!state.attHistoryStatus) state.attHistoryStatus = 'ALL';
  Data.attendanceHistory().then(hist => {
    state._attHistory = hist;                       // เก็บไว้ให้ export ใช้
    const filtered = filterAttHistory(hist, state.attHistoryStatus);
    const empOf = attEmpOf;                          // หาพนักงานเจ้าของแถว (เชื่อมด้วย emp_code)
    const rows = filtered.map(a => {
      const e = empOf(a);
      return `<tr>
        <td>${e.emp_code || '-'}</td>
        <td>${e.employee_category || e.prefix || '-'}</td>
        <td>${e.first_name || '-'}</td>
        <td>${e.last_name || '-'}</td>
        <td>${e.department_name || '-'}</td>
        <td>${e.position_name || '-'}</td>
        <td>${a.date}</td><td>${a.in}</td><td>${a.out}</td><td>${a.hours}</td>
        <td>${attStatusBadge(a.status)}</td>
        <td>📍 ${a.place}</td></tr>`;
    }).join('');
    const opt = (v, label) => `<option value="${v}" ${state.attHistoryStatus === v ? 'selected' : ''}>${label}</option>`;
    $('#attBody').innerHTML = `
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px">
        <div style="min-width:180px">
          <label class="form-label">สถานะ</label>
          <select class="input" id="attHistoryStatus" onchange="window.onAttHistoryFilter()">
            ${opt('ALL','ทั้งหมด')}${opt('NORMAL','ปกติ')}${opt('LATE','มาสาย')}${opt('ABSENT','ขาดงาน')}${opt('OT','OT')}
          </select>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="window.exportAttendanceHistoryExcel()">📥 Export Excel</button>
      </div>
      <div class="tbl-wrap fit-table-wrap"><table class="emp-table">
        <thead><tr>
          <th>รหัสพนักงาน</th><th>หัวข้อพนักงาน</th><th>ชื่อ</th><th>นามสกุล</th><th>แผนก</th><th>ตำแหน่ง</th>
          <th>วันที่</th><th>เข้างาน</th><th>ออกงาน</th><th>ชั่วโมงทำงาน</th><th>สถานะ</th><th>ตำแหน่งที่ลงเวลา</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="12" style="text-align:center;padding:30px" class="muted">ไม่พบข้อมูล</td></tr>'}</tbody>
      </table></div>`;
  });
}
// หาพนักงานเจ้าของแถวประวัติ (เชื่อมด้วย emp_code, fallback ผู้ใช้ปัจจุบัน/คนแรก)
function attEmpOf(row) {
  const fallback = state.employees.find(e => e.emp_code === Auth.current?.emp_code) || state.employees[0] || {};
  if (row.emp_code) return state.employees.find(e => e.emp_code === row.emp_code) || fallback;
  return fallback;
}
// กรองตามสถานะ (ใช้ร่วมกันระหว่างตารางและ export)
function filterAttHistory(hist, status) {
  if (!status || status === 'ALL') return hist;
  if (status === 'OT') return hist.filter(a => a.status === 'OT' || Number(a.ot_hours) > 0);
  return hist.filter(a => (a.status || 'NORMAL') === status);
}
function attStatusBadge(s) {
  if (s === 'LATE') return '<span class="badge amber">มาสาย</span>';
  if (s === 'ABSENT') return '<span class="badge red">ขาดงาน</span>';
  if (s === 'OT') return '<span class="badge blue">OT</span>';
  return '<span class="badge green">ปกติ</span>';
}
window.onAttHistoryFilter = () => {
  const sel = $('#attHistoryStatus');
  state.attHistoryStatus = sel ? sel.value : 'ALL';
  attHistory();
};

/* Export ประวัติลงเวลา -> Excel (เฉพาะข้อมูลที่แสดงหลังกรอง) */
window.exportAttendanceHistoryExcel = async () => {
  if (typeof XLSX === 'undefined') return toast('ไลบรารี Excel ยังไม่พร้อม', 'err');
  try {
    let hist = state._attHistory;
    if (!hist) { try { hist = await Data.attendanceHistory(); } catch { hist = []; } }
    // ใช้ข้อมูลหลังกรองสถานะปัจจุบัน
    hist = filterAttHistory(hist || [], state.attHistoryStatus || 'ALL');
    if (!hist.length) return toast('ไม่พบข้อมูลสำหรับ Export', 'err');

    const fallback = state.employees.find(e => e.emp_code === Auth.current?.emp_code) || state.employees[0] || {};
    const empOf = (row) => row.emp_code
      ? (state.employees.find(e => e.emp_code === row.emp_code) || fallback)
      : fallback;
    const stLabel = (s) => s === 'LATE' ? 'มาสาย' : s === 'ABSENT' ? 'ขาดงาน' : s === 'OT' ? 'OT' : 'ปกติ';

    const data = hist.map(a => {
      const e = empOf(a);
      return {
        'รหัสพนักงาน': e.emp_code || '-',
        'หัวข้อพนักงาน': e.employee_category || e.prefix || '-',
        'ชื่อ': e.first_name || '-',
        'นามสกุล': e.last_name || '-',
        'แผนก': e.department_name || '-',
        'ตำแหน่ง': e.position_name || '-',
        'วันที่': a.date || '-',
        'เข้างาน': a.in || '-',
        'ออกงาน': a.out || '-',
        'ชั่วโมงทำงาน': a.hours || '-',
        'สถานะ': stLabel(a.status),
        'ตำแหน่งที่ลงเวลา': a.place || '-',
      };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'ประวัติลงเวลา');
    const d = new Date();
    const fname = `attendance_history_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.xlsx`;
    XLSX.writeFile(wb, fname);
    toast('Export Excel สำเร็จ', 'ok');
  } catch (e) {
    toast('Export ไม่สำเร็จ: ' + e.message, 'err', 4000);
  }
};

/* 📊 สรุปเวลาทำงาน */
function attSummary() {
  $('#attBody').innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="btn btn-ghost btn-sm" onclick="window.exportAttendanceSummaryExcel()">📥 Export Excel</button>
    </div>
    <div class="kpi-grid">
      ${kpi('clock','green','ชั่วโมงทำงานเดือนนี้','176','ชม.','')}
      ${kpi('clock','amber','มาสาย','2','ครั้ง','')}
      ${kpi('users','red','ขาดงาน','0','วัน','')}
      ${kpi('ot','dark','OT สะสม','12','ชม.','')}
    </div>
    <p class="muted mt">สรุปคำนวณจากกะการทำงานที่ผูกไว้ (เวลาเข้า-ออก, สายได้, พัก) เชื่อมกับ OT และเงินเดือนอัตโนมัติ</p>`;
}

/* Export สรุปเวลาทำงาน -> Excel 4 sheets (เฉพาะแท็บสรุปเวลาทำงาน) */
window.exportAttendanceSummaryExcel = async () => {
  if (typeof XLSX === 'undefined') return toast('ไลบรารี Excel ยังไม่พร้อม', 'err');
  try {
    const emps = state.employees || [];
    let history = [];
    try { history = await Data.attendanceHistory(); } catch { history = []; }

    // คอลัมน์พื้นฐานของพนักงานทุก sheet
    const base = (e) => ({
      'รหัสพนักงาน': e.emp_code || '',
      'หัวข้อพนักงาน': e.prefix || '',
      'ชื่อ': e.first_name || '',
      'นามสกุล': e.last_name || '',
      'แผนก': e.department_name || '',
      'ตำแหน่ง': e.position_name || '',
    });

    // Sheet 1: สรุปเวลาทำงาน
    const s1 = emps.map(e => ({
      ...base(e),
      'ชั่วโมงทำงานเดือนนี้': e.work_hours_month ?? 0,
      'มาสาย': e.late_count ?? 0,
      'ขาดงาน': e.absent_count ?? 0,
      'OT สะสม': e.ot_hours ?? 0,
    }));

    // Sheet 2: มาสาย (ดึงจากประวัติที่ status=LATE ถ้ามี)
    const lateRows = [];
    emps.forEach(e => {
      const lates = history.filter(h => h.status === 'LATE');
      if (lates.length && e.emp_code === (Auth.current?.emp_code)) {
        lates.forEach(h => lateRows.push({ ...base(e), 'วันที่': h.date || '-', 'เวลาเข้างาน': h.in || '-', 'จำนวนนาทีที่สาย': h.late_minutes ?? '-', 'หมายเหตุ': '-' }));
      }
    });
    const s2 = lateRows.length ? lateRows : emps.map(e => ({ ...base(e), 'วันที่': '-', 'เวลาเข้างาน': '-', 'จำนวนนาทีที่สาย': 0, 'หมายเหตุ': '-' }));

    // Sheet 3: ขาดงาน
    const s3 = emps.map(e => ({ ...base(e), 'วันที่': '-', 'สถานะ': 'ปกติ', 'หมายเหตุ': '-' }));

    // Sheet 4: OT สะสม
    const s4 = emps.map(e => ({ ...base(e), 'วันที่': '-', 'จำนวนชั่วโมง OT': e.ot_hours ?? 0, 'ประเภท OT': '-', 'หมายเหตุ': '-' }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s1), 'สรุปเวลาทำงาน');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s2), 'มาสาย');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s3), 'ขาดงาน');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s4), 'OT สะสม');

    const d = new Date();
    const fname = `attendance_summary_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}.xlsx`;
    XLSX.writeFile(wb, fname);
    toast('ส่งออกสรุปเวลาทำงาน (4 ชีต) เรียบร้อย', 'ok', 3500);
  } catch (e) {
    toast('ส่งออกไม่สำเร็จ: ' + e.message, 'err', 4000);
  }
};

/* ---- Shift modals (admin) ------------------------------------------------- */
/* ===== วันทำงาน: เลือกแบบ Checkbox แทนการพิมพ์ — SAFE: แปลงกลับเป็นรูปแบบเดิมที่ระบบใช้ ===== */
const SF_DAYS = [['จ','จันทร์'],['อ','อังคาร'],['พ','พุธ'],['พฤ','พฤหัสบดี'],['ศ','ศุกร์'],['ส','เสาร์'],['อา','อาทิตย์']];
function sfParseDays(str) {
  const s = (str || '').trim(), set = new Set();
  if (!s) return set;
  if (s === 'ทุกวัน') { for (let i = 0; i < 7; i++) set.add(i); return set; }
  const abbr = SF_DAYS.map(d => d[0]);
  if (s.includes('-')) {                                   // ช่วงวัน เช่น จ-ศ / จ-ส / จ-อา
    const p = s.split('-').map(x => x.trim());
    const ai = abbr.indexOf(p[0]), bi = abbr.indexOf(p[1]);
    if (ai >= 0 && bi >= 0 && ai <= bi) { for (let i = ai; i <= bi; i++) set.add(i); return set; }
  }
  s.split(',').forEach(t => { const i = abbr.indexOf(t.trim()); if (i >= 0) set.add(i); });   // เฉพาะบางวัน เช่น จ,พ,ศ
  if (set.size === 0) [0, 1, 2, 3, 4].forEach(i => set.add(i));   // fallback จ-ศ (กันค่าเดิมที่อ่านไม่ออก)
  return set;
}
function sfFormatDays(set) {                               // แปลงกลับเป็นข้อความเดิม
  const arr = [...set].sort((a, b) => a - b);
  if (arr.length === 0) return '';
  if (arr.length === 7) return 'ทุกวัน';
  if (arr.length === 5 && arr.every((v, i) => v === i)) return 'จ-ศ';   // จันทร์-ศุกร์
  if (arr.length === 6 && arr.every((v, i) => v === i)) return 'จ-ส';   // จันทร์-เสาร์
  return arr.map(i => SF_DAYS[i][0]).join(',');            // เช่น จ,พ,ศ
}
function sfDayBoxHTML(daysStr) {
  const chk = sfParseDays(daysStr);
  const quick = [['จ-ศ', 'จ-ศ'], ['จ-ส', 'จ-ส'], ['ทุกวัน', 'ทุกวัน'], ['', 'ล้าง']]
    .map(([v, l]) => `<button type="button" class="btn btn-ghost btn-sm" onclick="window.sfSetDays('${v}')">${l}</button>`).join('');
  const boxes = SF_DAYS.map((d, i) => `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap"><input type="checkbox" class="sf-day" data-day="${i}" ${chk.has(i) ? 'checked' : ''} style="width:17px;height:17px;accent-color:var(--red)"/> ${d[1]}</label>`).join('');
  return `<div>
      <label class="form-label">วันทำงาน <span class="muted" style="font-weight:400">— เลือกจากตัวเลือก (พิมพ์เองไม่ได้)</span></label>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${quick}</div>
      <div id="sf_days_box" style="display:flex;flex-wrap:wrap;gap:8px 16px">${boxes}</div>
    </div>`;
}
window.sfSetDays = (preset) => {
  const set = sfParseDays(preset);
  $$('#sf_days_box .sf-day').forEach(cb => { cb.checked = set.has(Number(cb.dataset.day)); });
};
function sfReadDays() {
  const set = new Set($$('#sf_days_box .sf-day:checked').map(cb => Number(cb.dataset.day)));
  return sfFormatDays(set);
}
window.shiftForm = (id) => {
  const s = (state._shifts || []).find(x => String(x.id) === String(id)) || {};
  openModal(id ? 'แก้ไขกะการทำงาน' : 'เพิ่มกะการทำงาน', `
    <div class="form-grid">
      <div class="form-row">
        <div><label class="form-label">ไอคอน</label><input class="input" id="sf_icon" value="${s.icon || '🕒'}" placeholder="🕒"/></div>
        <div><label class="form-label">ชื่อกะ (Shift Name) <span class="req">*</span></label><input class="input" id="sf_name" value="${s.shift_name || ''}" placeholder="เช่น OFFICE / WAREHOUSE"/></div>
      </div>
      <div class="form-row">
        <div><label class="form-label">เวลาเริ่ม</label><input type="time" class="input" id="sf_start" value="${s.start_time || '08:30'}"/></div>
        <div><label class="form-label">เวลาสิ้นสุด</label><input type="time" class="input" id="sf_end" value="${s.end_time || '17:30'}"/></div>
      </div>
      <div class="form-row">
        <div><label class="form-label">พัก (นาที)</label><input type="number" class="input" id="sf_break" value="${s.break_minutes ?? 60}"/></div>
        <div><label class="form-label">สายได้ (นาที)</label><input type="number" class="input" id="sf_late" value="${s.late_allow_minutes ?? 15}"/></div>
      </div>
      <div class="form-row">
        <div><label class="form-label">คิด OT หลังเวลา</label><input type="time" class="input" id="sf_ot" value="${s.ot_start_after || '17:30'}"/></div>
        <div></div>
      </div>
      ${sfDayBoxHTML(s.working_days || 'จ-ศ')}
      <div><label class="form-label">สถานะ</label><select class="input" id="sf_status"><option ${s.status !== 'INACTIVE' ? 'selected' : ''}>ACTIVE</option><option ${s.status === 'INACTIVE' ? 'selected' : ''}>INACTIVE</option></select></div>
    </div>`,
    `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
     <button class="btn btn-primary" onclick="window.saveShift(${id ? `'${id}'` : 'null'})">บันทึก</button>`);
};
window.saveShift = async (id) => {
  const v = (x) => { const el = $('#' + x); return el ? el.value.trim() : ''; };
  const name = v('sf_name');
  if (!name) return toast('กรุณากรอกชื่อกะ', 'err');
  const shift = {
    id,
    icon: v('sf_icon') || '🕒',
    shift_name: name,
    start_time: v('sf_start'),
    end_time: v('sf_end'),
    break_minutes: Number(v('sf_break') || 0),
    late_allow_minutes: Number(v('sf_late') || 0),
    ot_start_after: v('sf_ot'),
    working_days: sfReadDays() || 'จ-ศ',
    status: v('sf_status') || 'ACTIVE',
  };
  if (USE_DEMO) {
    const list = NJ.DEMO.shifts;
    if (id) {
      const i = list.findIndex(x => String(x.id) === String(id));
      if (i >= 0) list[i] = { ...list[i], ...shift };
    } else {
      shift.id = list.length ? Math.max(...list.map(x => x.id)) + 1 : 1;
      list.push(shift);
    }
    state._shifts = list;
    closeModal();
    toast(id ? `บันทึกกะ "${name}" เรียบร้อย` : `เพิ่มกะ "${name}" เรียบร้อย`, 'ok');
    attShift();
    return;
  }
  // Supabase — id ที่ส่งมาคือ uuid จริงของ work_shifts (จาก Data.shifts)
  const res = await Data.saveShift({ ...shift, uuid: id || undefined });
  if (!res.ok) return toast('บันทึกไม่สำเร็จ: ' + (res.error || ''), 'err', 4000);
  state._shifts = await Data.shifts();
  closeModal();
  toast(id ? `บันทึกกะ "${name}" เรียบร้อย` : `เพิ่มกะ "${name}" เรียบร้อย`, 'ok');
  attShift();
};
window.delShift = (id) => {
  const s = (state._shifts || []).find(x => String(x.id) === String(id)) || {};
  state._pendingDelShift = id;   // เก็บ id ไว้ลบหลังยืนยัน (รองรับ id ทั้ง number/string)
  openModal('ยืนยันการลบกะ', `<p>ต้องการลบกะ <b>${s.shift_name || ''}</b> ใช่หรือไม่? พนักงานที่อยู่ในกะนี้จะต้องจัดกะใหม่</p>`,
    `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
     <button class="btn btn-primary" onclick="window.confirmDelShift()">ลบกะ</button>`);
};
// ลบกะจริงหลังยืนยัน + render ตารางใหม่ทันที (ไม่แตะ schema/ลงเวลา/เงินเดือน/OT)
window.confirmDelShift = async () => {
  const id = state._pendingDelShift;
  if (id == null) return;
  if (USE_DEMO) {
    NJ.DEMO.shifts = (NJ.DEMO.shifts || []).filter(x => x.id !== id);
    state._shifts = NJ.DEMO.shifts;
    Object.keys(NJ.DEMO.employeeShifts || {}).forEach(c => { if (String(NJ.DEMO.employeeShifts[c]) === String(id)) delete NJ.DEMO.employeeShifts[c]; });
    state._pendingDelShift = null;
    closeModal(); toast('ลบกะเรียบร้อย', 'ok'); attShift();
    return;
  }
  // Supabase (Live): ลบจริงจาก work_shifts + employee_shifts + shift_gps_locations (Data.deleteShift ไม่มี -> ลบตรงผ่าน sb)
  const orig = (state._shifts || []).find(x => String(x.id) === String(id));
  const _suuid = orig?.uuid || orig?.id_uuid || id;
  if (typeof Data.deleteShift === 'function') {
    const res = await Data.deleteShift(_suuid);
    if (res && res.ok === false) return toast('ลบไม่สำเร็จ: ' + (res.error || ''), 'err', 4000);
    state._shifts = await Data.shifts();
  } else if (typeof sb !== 'undefined' && sb) {
    try {
      await sb.from('employee_shifts').delete().eq('shift_id', _suuid);
      const { error } = await sb.from('work_shifts').delete().eq('id', _suuid);
      if (error) return toast('ลบไม่สำเร็จ: ' + error.message, 'err', 4000);
      try { await sb.from('shift_gps_locations').delete().eq('shift_id', String(_suuid)); } catch (_) {}
    } catch (e) { return toast('ลบไม่สำเร็จ: ' + (e.message || ''), 'err', 4000); }
    state._shifts = await Data.shifts();
  } else {
    state._shifts = (state._shifts || []).filter(x => x.id !== id);
  }
  state._pendingDelShift = null;
  closeModal(); toast('ลบกะเรียบร้อย', 'ok'); attShift();
};
// Event delegation: ปุ่มจัดการกะ (✏️ แก้ไข / 👥 จัดคน / 📍 พื้นที่สแกน / 🗑 ลบ) — ผูกครั้งเดียว ทำงานข้าม re-render
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.shift-action');
  if (!btn) return;
  const action = btn.dataset.action;
  const raw = btn.dataset.shiftId;
  const id = /^\d+$/.test(raw) ? Number(raw) : raw;
  if (action === 'edit') window.shiftForm(id);
  else if (action === 'members') window.assignShift(id);
  else if (action === 'gps') window.shiftGpsModal(id);
  else if (action === 'delete') window.delShift(id);
});

/* ============================================================================
 * 📍 พื้นที่สแกนหน้า (GPS) ต่อกะ — SAFE PATCH (config + UI + badge เท่านั้น)
 * ใช้ของจริงซ้ำ: ATTENDANCE_LOCATIONS[0] = สำนักงานใหญ่, calcDistanceMeter(), getCurrentGPS()
 * เก็บใน localStorage('nj_shift_gps') + state.shiftGpsAreas  (ไม่แตะ schema/Supabase/ลงเวลา)
 * NOTE: ไม่เดินเข้า flow checkIn/findAllowedLocation จริง (ห้ามกระทบลงเวลา/สแกนหน้าเดิม)
 * ========================================================================== */
function ensureShiftGps() {
  if (!state.shiftGpsAreas) {
    let saved = null;
    try { const x = localStorage.getItem('nj_shift_gps'); if (x) saved = JSON.parse(x); } catch (_) {}
    state.shiftGpsAreas = (saved && typeof saved === 'object') ? saved : {};
  }
}
const SG_MAIN_DEFAULT = { name: 'สำนักงานใหญ่', address: '62/165 หมู่ 10 ซอยทุ่งสุขลา ตำบลทุ่งสุขลา อำเภอศรีราชา ชลบุรี', latitude: 13.6537, longitude: 100.7501 };
function sgMainOffice() {
  if (!state.sgMainOffice) {
    let m = null;
    try { const x = localStorage.getItem('nj_main_office'); if (x) m = JSON.parse(x); } catch (_) {}
    state.sgMainOffice = (m && typeof m === 'object' && m.latitude != null) ? m : Object.assign({}, SG_MAIN_DEFAULT);
  }
  return state.sgMainOffice;
}
function sgSaveMainOffice(o) { state.sgMainOffice = o; try { localStorage.setItem('nj_main_office', JSON.stringify(o)); } catch (_) {} if (window.NJ && NJ.cloudSaveSetting) NJ.cloudSaveSetting('main_office', o); }
function _sgHQ() { const o = sgMainOffice(); return { location_name: o.name, name: o.name, address: o.address || '', latitude: o.latitude, longitude: o.longitude }; }
function _sgParseCoords(t) { const m = (t || '').trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/); return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : null; }
// ดึงพิกัดจาก Google Maps URL (ออฟไลน์ ด้วย regex) — รองรับลิงก์ที่ "มีพิกัดอยู่ในลิงก์"
function _sgExtractCoordsFromUrl(t) {
  const s = (t || '').trim();
  if (!/https?:\/\//i.test(s) && !/^geo:/i.test(s)) return null;
  const pats = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,                                              // !3dLAT!4dLNG (pin/place)
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,                                                   // /@LAT,LNG
    /[?&](?:q|query|ll|center|destination|daddr|sll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,// ?q=LAT,LNG ฯลฯ
    /geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i,                                               // geo:LAT,LNG
  ];
  for (const re of pats) {
    const m = s.match(re);
    if (m) { const lat = parseFloat(m[1]), lng = parseFloat(m[2]); if (!isNaN(lat) && !isNaN(lng)) return { lat, lng }; }
  }
  return null;
}
function _sgIsShortLink(t) { return /(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs|share\.google|maps\.app\.goo)/i.test(t || ''); }

window.shiftGpsModal = (id) => {
  ensureShiftGps();
  const s = (state._shifts || NJ.DEMO.shifts).find(x => String(x.id) === String(id)) || {};
  let a = state.shiftGpsAreas[id] || {};
  if (state._sgDraft) { a = { ...a, ...state._sgDraft }; state._sgDraft = null; }   // คืนค่าจากแผนที่/แก้ HQ โดยไม่หาย
  state._sgCurrentShift = id;
  const HQ = _sgHQ();
  const radii = [50, 100, 300, 500, 1000];
  const curRadius = a.radius_meters || 100;
  const scope = a.employee_scope === 'SELECTED' ? 'SELECTED' : 'ALL';
  const anywhere = !!a.allow_anywhere;
  const inShift = (state.employees || []).filter(e => String((NJ.DEMO.employeeShifts || {})[e.emp_code]) === String(id));
  const empRows = inShift.length ? inShift.map(e => {
    const ck = Array.isArray(a.employees) && a.employees.includes(e.emp_code) ? 'checked' : '';
    return `<label class="leave-item" style="cursor:pointer"><input type="checkbox" class="sg-emp" value="${e.emp_code}" ${ck} style="accent-color:var(--red);width:18px;height:18px"/><div class="body"><b>${e.first_name} ${e.last_name}</b><small>${e.emp_code} • ${e.department_name || ''}</small></div></label>`;
  }).join('') : '<p class="muted" style="padding:10px">ยังไม่มีพนักงานในกะนี้ (จัดพนักงานเข้ากะก่อน)</p>';
  const dist = (a.latitude != null && a.longitude != null) ? (calcDistanceMeter(a.latitude, a.longitude, HQ.latitude, HQ.longitude) / 1000).toFixed(1) : '-';
  const distMode = a.distance_mode === 'MANUAL' ? 'MANUAL' : 'AUTO';
  const distUnit = a.distance_unit === 'm' ? 'm' : 'km';
  const autoKm = (a.latitude != null && a.longitude != null) ? +(calcDistanceMeter(a.latitude, a.longitude, HQ.latitude, HQ.longitude) / 1000).toFixed(1) : null;
  const distVal = distMode === 'MANUAL' ? (a.distance_value != null ? a.distance_value : '') : (autoKm != null ? autoKm : '');
  openModal('ตั้งค่าพื้นที่สแกนหน้า', `
    <div class="form-grid">
      <div><label class="form-label">ชื่อกะ</label><input class="input" value="${s.icon || ''} ${s.shift_name || ''}" disabled/></div>
      <div>
        <label class="form-label">ค้นหาสถานที่ / พิกัด / ลิงก์ <span class="muted" style="font-weight:400">— พิกัด lat,lng • ลิงก์ Google Maps • หรือใช้ตำแหน่งปัจจุบัน</span></label>
        <div style="display:flex;gap:8px">
          <input class="input" id="sg_search" placeholder="13.04,100.93 หรือวางลิงก์ Google Maps" oninput="window.shiftGpsSearchAuto()"/>
          <button class="btn btn-ghost btn-sm" onclick="window.shiftGpsSearch()">ค้นหา</button>
          <button class="btn btn-ghost btn-sm" onclick="window.shiftGpsOpenLink()">เปิดลิงก์</button>
        </div>
        <button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="window.shiftGpsUseCurrent()">📍 ใช้ตำแหน่งปัจจุบัน</button>
        <button class="btn btn-primary btn-sm" style="margin-top:8px;margin-left:8px" onclick="window.sgOpenMap('${id}')">🗺️ เลือกสถานที่ทำงาน (แผนที่)</button>
      </div>
      <!-- ฟิลด์ GPS ซ่อน (เก็บข้อมูลเดิมครบ ไม่แสดงให้ผู้ใช้กรอก) — autofill จาก ค้นหา/แผนที่/ตำแหน่งปัจจุบัน -->
      <input type="hidden" id="sg_locname" value="${a.location_name || ''}"/>
      <input type="hidden" id="sg_address" value="${a.address || ''}"/>
      <input type="hidden" id="sg_lat" value="${a.latitude ?? ''}"/>
      <input type="hidden" id="sg_lng" value="${a.longitude ?? ''}"/>
      <div class="form-row">
        <div><label class="form-label">รัศมีบริเวณที่อนุญาตให้สแกน (เมตร)</label><input type="number" class="input" id="sg_radius" value="${curRadius}" min="1" step="10" list="sg_radius_list"/><datalist id="sg_radius_list">${radii.map(r => `<option value="${r}"></option>`).join('')}</datalist></div>
        <div></div>
      </div>
      <div>
        <label class="form-label">ระยะจากสำนักงานใหญ่</label>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin:4px 0 8px">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="radio" name="sg_distmode" value="AUTO" ${distMode === 'AUTO' ? 'checked' : ''} onchange="window.shiftGpsDistMode()"/><span>คำนวณอัตโนมัติ</span></label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="radio" name="sg_distmode" value="MANUAL" ${distMode === 'MANUAL' ? 'checked' : ''} onchange="window.shiftGpsDistMode()"/><span>กรอกเอง</span></label>
        </div>
        <div style="display:flex;gap:8px;max-width:300px">
          <input class="input" id="sg_distance_val" value="${distVal}" ${distMode === 'AUTO' ? 'disabled' : ''} style="flex:1" placeholder="เช่น 70.3"/>
          <select class="input" id="sg_distance_unit" ${distMode === 'AUTO' ? 'disabled' : ''} style="width:110px"><option value="km" ${distUnit === 'km' ? 'selected' : ''}>km</option><option value="m" ${distUnit === 'm' ? 'selected' : ''}>เมตร</option></select>
        </div>
      </div>
      ${(typeof Auth !== 'undefined' && Auth.canEditShift && Auth.canEditShift()) ? `
      <div>
        <button type="button" class="btn btn-ghost btn-sm" id="sg_detail_toggle" onclick="window.sgToggleDetail()">\u25BC ดูรายละเอียด GPS</button>
        <div id="sg_detail_box" style="display:none;background:var(--gray);border-radius:10px;padding:10px 12px;margin-top:6px;font-size:13px;line-height:1.7">
          <div><b>ชื่อสถานที่:</b> <span id="sg_d_name"></span></div>
          <div><b>ที่อยู่:</b> <span id="sg_d_addr"></span></div>
          <div><b>Latitude:</b> <span id="sg_d_lat"></span></div>
          <div><b>Longitude:</b> <span id="sg_d_lng"></span></div>
          <small class="muted">อ่านอย่างเดียว • สำหรับผู้ดูแลระบบ</small>
        </div>
      </div>` : ''}
      <div style="background:var(--gray);border-radius:10px;padding:10px 12px;font-size:12.5px;display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div><b>🏢 ${HQ.location_name}</b> — พิกัด ${HQ.latitude},${HQ.longitude}${HQ.address ? `<br><small class="muted">${HQ.address}</small>` : ''}</div>
        <button class="btn btn-ghost btn-sm" onclick="window.sgEditMainOffice('${id}')">✏️ แก้พิกัด</button>
      </div>
      <div>
        <label class="form-label">สิทธิ์การใช้งาน</label>
        <label style="display:flex;align-items:center;gap:8px;margin:4px 0;cursor:pointer"><input type="radio" name="sg_scope" value="ALL" ${scope === 'ALL' ? 'checked' : ''} onchange="window.shiftGpsToggleScope()"/><span>ใช้กับทุกคนในกะ</span></label>
        <label style="display:flex;align-items:center;gap:8px;margin:4px 0;cursor:pointer"><input type="radio" name="sg_scope" value="SELECTED" ${scope === 'SELECTED' ? 'checked' : ''} onchange="window.shiftGpsToggleScope()"/><span>เลือกเฉพาะพนักงานในกะ</span></label>
        <div id="sg_empWrap" style="display:${scope === 'SELECTED' ? 'block' : 'none'};max-height:180px;overflow:auto;background:#fff;border:1px solid var(--line);border-radius:10px;padding:6px;margin-top:6px">${empRows}</div>
      </div>
      <label style="display:flex;align-items:center;gap:8px;margin:4px 0;cursor:pointer;background:var(--gray);padding:10px 12px;border-radius:10px">
        <input type="checkbox" id="sg_anywhere" ${anywhere ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--red)"/>
        <span>🌎 อนุญาตสแกนได้ทุกพื้นที่ <small class="muted">(ไม่ตรวจรัศมี แต่ยังบันทึก GPS จริงตอนสแกน)</small></span>
      </label>
    </div>`,
    `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
     <button class="btn btn-primary" onclick="window.saveShiftGps('${id}')">บันทึก</button>`);
};
window.sgToggleDetail = () => {
  const box = $('#sg_detail_box'), btn = $('#sg_detail_toggle');
  if (!box) return;
  const show = box.style.display === 'none';
  if (show) {
    const v = (id) => (($('#' + id) || {}).value || '').trim() || '-';
    if ($('#sg_d_name')) $('#sg_d_name').textContent = v('sg_locname');
    if ($('#sg_d_addr')) $('#sg_d_addr').textContent = v('sg_address');
    if ($('#sg_d_lat')) $('#sg_d_lat').textContent = v('sg_lat');
    if ($('#sg_d_lng')) $('#sg_d_lng').textContent = v('sg_lng');
  }
  box.style.display = show ? 'block' : 'none';
  if (btn) btn.textContent = show ? '\u25B2 ซ่อนรายละเอียด GPS' : '\u25BC ดูรายละเอียด GPS';
};
window.shiftGpsToggleScope = () => {
  const sel = document.querySelector('#modal input[name="sg_scope"]:checked');
  const wrap = $('#sg_empWrap'); if (wrap) wrap.style.display = (sel && sel.value === 'SELECTED') ? 'block' : 'none';
};
window.shiftGpsRecalc = () => {
  const modeEl = document.querySelector('#modal input[name="sg_distmode"]:checked');
  if (modeEl && modeEl.value === 'MANUAL') return;   // กรอกเอง: ไม่เขียนทับค่าที่ผู้ใช้ใส่
  const lat = parseFloat(($('#sg_lat') || {}).value), lng = parseFloat(($('#sg_lng') || {}).value);
  const HQ = _sgHQ(), v = $('#sg_distance_val'), u = $('#sg_distance_unit');
  if (v) {
    if (!isNaN(lat) && !isNaN(lng)) { v.value = (calcDistanceMeter(lat, lng, HQ.latitude, HQ.longitude) / 1000).toFixed(1); if (u) u.value = 'km'; }
    else v.value = '';
  }
};
window.shiftGpsDistMode = () => {
  const modeEl = document.querySelector('#modal input[name="sg_distmode"]:checked');
  const manual = !!(modeEl && modeEl.value === 'MANUAL');
  const v = $('#sg_distance_val'), u = $('#sg_distance_unit');
  if (v) v.disabled = !manual;
  if (u) u.disabled = !manual;
  if (!manual) window.shiftGpsRecalc();   // กลับเป็นอัตโนมัติ -> คำนวณใหม่
};
// auto-extract ตอนพิมพ์/วาง (พิกัด หรือ ลิงก์ Google Maps) -> เติม lat/lng ทันที (เงียบๆ)
window.shiftGpsSearchAuto = () => {
  const t = ($('#sg_search') || {}).value || '';
  const c = _sgParseCoords(t) || _sgExtractCoordsFromUrl(t);
  if (c) {
    if ($('#sg_lat')) $('#sg_lat').value = c.lat;
    if ($('#sg_lng')) $('#sg_lng').value = c.lng;
    window.shiftGpsRecalc();
  }
};
// เปิดลิงก์ในช่องค้นหา (เช่น share.google) ในแท็บใหม่ -> รีไดเร็กต์เป็น Maps เต็มที่มีพิกัด ให้คัดลอกกลับมาวาง
window.shiftGpsOpenLink = () => {
  const t = (($('#sg_search') || {}).value || '').trim();
  if (/^https?:\/\//i.test(t)) window.open(t, '_blank', 'noopener');
  else toast('ช่องค้นหายังไม่ใช่ลิงก์ — วางลิงก์ Google Maps ก่อน', 'err', 4000);
};
window.shiftGpsSearch = () => {
  const t = ($('#sg_search') || {}).value || '';
  const c = _sgParseCoords(t) || _sgExtractCoordsFromUrl(t);
  if (c) {
    if ($('#sg_lat')) $('#sg_lat').value = c.lat;
    if ($('#sg_lng')) $('#sg_lng').value = c.lng;
    if ($('#sg_locname') && !$('#sg_locname').value) $('#sg_locname').value = 'พิกัดจากลิงก์/ค้นหา';
    window.shiftGpsRecalc(); toast('ดึงพิกัดจากลิงก์/ค้นหาแล้ว', 'ok');
  } else if (_sgIsShortLink(t)) {
    toast('ลิงก์ย่อ (share.google / goo.gl) อ่านพิกัดออฟไลน์ไม่ได้ — กดปุ่ม “เปิดลิงก์” แล้วคัดลอกลิงก์เต็ม (มี @lat,lng) หรือพิกัด มาวาง', 'err', 6000);
    window.shiftGpsOpenLink();
  } else if (t.trim()) {
    if ($('#sg_locname')) $('#sg_locname').value = t.trim();
    toast('วางลิงก์ Google Maps แบบเต็ม, พิกัด lat,lng หรือกด “ใช้ตำแหน่งปัจจุบัน”', 'err', 5000);
  }
};
window.shiftGpsUseCurrent = async () => {
  try {
    const g = await getCurrentGPS();
    if ($('#sg_lat')) $('#sg_lat').value = g.latitude.toFixed(6);
    if ($('#sg_lng')) $('#sg_lng').value = g.longitude.toFixed(6);
    window.shiftGpsRecalc(); toast('ใช้ตำแหน่งปัจจุบันแล้ว', 'ok');
  } catch (e) { toast(e.message || 'เข้าถึง GPS ไม่ได้', 'err', 4000); }
};
window.saveShiftGps = async (id) => {
  ensureShiftGps();
  const lat = parseFloat(($('#sg_lat') || {}).value), lng = parseFloat(($('#sg_lng') || {}).value);
  const anywhere = !!($('#sg_anywhere') && $('#sg_anywhere').checked);
  if (!anywhere && (isNaN(lat) || isNaN(lng))) return toast('กรุณาระบุพิกัด หรือเลือก “อนุญาตสแกนได้ทุกพื้นที่”', 'err', 4000);
  const scopeEl = document.querySelector('#modal input[name="sg_scope"]:checked');
  const scope = scopeEl ? scopeEl.value : 'ALL';
  const emps = $$('#sg_empWrap .sg-emp:checked').map(c => c.value);
  const HQ = _sgHQ();
  const modeEl2 = document.querySelector('#modal input[name="sg_distmode"]:checked');
  const distMode = (modeEl2 && modeEl2.value === 'MANUAL') ? 'MANUAL' : 'AUTO';
  const distUnit = (($('#sg_distance_unit') || {}).value === 'm') ? 'm' : 'km';
  let distVal, distKm;
  if (distMode === 'MANUAL') {
    distVal = parseFloat(($('#sg_distance_val') || {}).value);
    if (isNaN(distVal)) distVal = null;
    distKm = (distVal == null) ? null : (distUnit === 'm' ? +(distVal / 1000).toFixed(3) : distVal);
  } else {
    distKm = (!isNaN(lat) && !isNaN(lng)) ? +(calcDistanceMeter(lat, lng, HQ.latitude, HQ.longitude) / 1000).toFixed(1) : null;
    distVal = distKm;
  }
  state.shiftGpsAreas[id] = {
    shift_id: id,
    location_name: ($('#sg_locname') || {}).value || '',
    address: ($('#sg_address') || {}).value || '',
    latitude: isNaN(lat) ? null : lat,
    longitude: isNaN(lng) ? null : lng,
    radius_meters: Number(($('#sg_radius') || {}).value || 100),
    distance_from_office: distKm,
    distance_mode: distMode,
    distance_value: distVal,
    distance_unit: distUnit,
    allow_anywhere: anywhere,
    employee_scope: scope,
    employees: scope === 'SELECTED' ? emps : [],
    saved_at: Date.now(),
  };
  try { localStorage.setItem('nj_shift_gps', JSON.stringify(state.shiftGpsAreas)); } catch (_) {}
  // บันทึกลง Supabase จริง + แสดง error จริงถ้าไม่สำเร็จ (ห้ามขึ้นว่าสำเร็จถ้าบันทึกไม่ได้)
  if (window.NJ && NJ.cloudSaveShiftGps) {
    const r = await NJ.cloudSaveShiftGps(state.shiftGpsAreas);
    if (r && r.error) return toast('บันทึก GPS ไม่สำเร็จ: ' + r.error, 'err', 4500);
  }
  toast('✅ ตั้งค่า GPS สำเร็จ', 'ok');
  shiftGpsSummaryModal(id);
  attShift();   // อัปเดต Badge ในตารางทันที
};
function shiftGpsSummaryModal(id) {
  const s = (state._shifts || NJ.DEMO.shifts).find(x => String(x.id) === String(id)) || {};
  const a = state.shiftGpsAreas[id] || {};
  openModal('สรุปพื้นที่สแกนหน้า', shiftGpsSummaryHTML(s, a),
    `<button class="btn btn-ghost" onclick="window.shiftGpsModal('${id}')">แก้ไขอีกครั้ง</button>
     <button class="btn btn-primary" onclick="window.closeModal()">เสร็จสิ้น</button>`);
}
function shiftGpsSummaryHTML(s, a) {
  const perm = a.allow_anywhere ? 'สแกนได้ทุกพื้นที่' : 'สแกนได้เฉพาะในรัศมี';
  const coord = (a.latitude != null && a.longitude != null) ? `${a.latitude},${a.longitude}` : '-';
  const scopeTxt = a.employee_scope === 'SELECTED' ? ` • เฉพาะ ${(a.employees || []).length} คน` : ' • ทุกคนในกะ';
  const block = (c, t, v) => `<div style="border-left:4px solid ${c};padding-left:12px"><div style="color:${c};font-weight:700">${t}</div><div>${v}</div></div>`;
  return `<div class="appr-summary" style="border:1px solid var(--line);border-radius:14px;overflow:hidden">
    <div style="background:var(--red);color:#fff;padding:12px 16px;font-weight:700">✅ ตั้งค่า GPS สำเร็จ — กะ ${s.shift_name || ''}</div>
    <div style="padding:14px 16px;display:flex;flex-direction:column;gap:12px">
      ${block('#2563eb', '📍 สถานที่', (a.location_name || '-') + (a.address ? (' • ' + a.address) : ''))}
      ${block('#ea580c', '🧭 พิกัด', coord)}
      ${block('#16a34a', '⭕ รัศมี', a.allow_anywhere ? '— (ทุกพื้นที่) —' : ((a.radius_meters || 0) + ' เมตร'))}
      ${block('#6b7280', '🏢 ระยะจากสำนักงานใหญ่', (a.distance_from_office != null ? a.distance_from_office : '-') + ' km')}
      ${block('var(--red)', '🔑 สิทธิ์', perm + scopeTxt)}
    </div></div>`;
}
window.shiftGpsBadge = (id) => {
  ensureShiftGps();
  const a = state.shiftGpsAreas && state.shiftGpsAreas[id];
  if (!a) return '';
  if (a.allow_anywhere) return `<div style="margin-top:3px"><span class="badge" style="background:#dcfce7;color:#16a34a">🌎 ทุกพื้นที่</span></div>`;
  const hq = (a.distance_from_office != null) ? `<div style="margin-top:2px"><small class="muted">ระยะจากสำนักงานใหญ่ ${a.distance_from_office} km</small></div>` : '';
  return `<div style="margin-top:3px"><span class="badge" style="background:#dbeafe;color:#2563eb">📍 ${a.radius_meters || 0}m จากจุดสแกน</span></div>${hq}`;
};

/* ============================================================================
 * 🗺️ เลือกสถานที่บนแผนที่จริง (Leaflet + OSM) + แก้ไขสำนักงานใหญ่ — SAFE PATCH
 * - แผนที่โหลดแบบ lazy จาก CDN (ออนไลน์) • ถ้าโหลดไม่ได้ degrade เป็นกรอกพิกัด/ลิงก์
 * - geocoder: OpenStreetMap Nominatim (ออนไลน์, rate-limited)
 * - ไม่แตะ flow ลงเวลา/สแกนหน้า/ATTENDANCE_LOCATIONS เดิม
 * ========================================================================== */
function sgCaptureDraft() {
  const g = (id) => { const el = $('#' + id); return el ? el.value : undefined; };
  if (!$('#sg_lat')) return;   // ฟอร์มกะไม่ได้เปิดอยู่ -> ไม่จับ
  const scopeEl = document.querySelector('#modal input[name="sg_scope"]:checked');
  const modeEl = document.querySelector('#modal input[name="sg_distmode"]:checked');
  let lat = parseFloat(g('sg_lat')), lng = parseFloat(g('sg_lng')), dv = parseFloat(g('sg_distance_val'));
  state._sgDraft = {
    location_name: g('sg_locname') || '', address: g('sg_address') || '',
    latitude: isNaN(lat) ? null : lat, longitude: isNaN(lng) ? null : lng,
    radius_meters: Number(g('sg_radius') || 100),
    employee_scope: scopeEl ? scopeEl.value : 'ALL',
    employees: $$('#sg_empWrap .sg-emp:checked').map(c => c.value),
    allow_anywhere: !!($('#sg_anywhere') && $('#sg_anywhere').checked),
    distance_mode: modeEl ? modeEl.value : 'AUTO',
    distance_value: isNaN(dv) ? null : dv,
    distance_unit: (g('sg_distance_unit') === 'm') ? 'm' : 'km',
  };
}
window.sgOpenMap = (id) => {
  sgCaptureDraft();
  state._sgCurrentShift = id;
  const HQ = _sgHQ();
  const a = state._sgDraft || {};
  const startLat = (a.latitude != null && !isNaN(a.latitude)) ? a.latitude : HQ.latitude;
  const startLng = (a.longitude != null && !isNaN(a.longitude)) ? a.longitude : HQ.longitude;
  state._sgPick = { lat: startLat, lng: startLng, name: a.location_name || '', address: a.address || '' };
  openModal('กรุณาเลือกสถานที่', `
    <div style="display:flex;gap:8px;margin-bottom:10px">
      <input class="input" id="sgmap_search" placeholder="ค้นหาชื่อสถานที่ / ที่อยู่ / พิกัด / ลิงก์ Google Maps"/>
      <button class="btn btn-primary btn-sm" onclick="window.sgMapSearch()">ค้นหา</button>
    </div>
    <div id="sgMapCanvas" style="width:100%;height:360px;border-radius:12px;overflow:hidden;background:var(--gray);display:grid;place-items:center;color:var(--txt-2)">กำลังโหลดแผนที่…</div>
    <p class="muted" style="font-size:12px;margin:8px 0 0">คลิกบนแผนที่ หรือลากหมุดแดง เพื่อเลือกจุด • พิกัดที่เลือก: <b id="sgmap_coord">${startLat.toFixed(6)}, ${startLng.toFixed(6)}</b></p>
  `, `<button class="btn btn-ghost" onclick="window.sgMapCancel()">ยกเลิก</button>
      <button class="btn btn-primary" onclick="window.sgMapConfirm()">ยืนยัน</button>`, 'employee-modal');
  setTimeout(() => sgInitMap(startLat, startLng), 80);
};
function sgLoadLeaflet(cb) {
  if (window.L) return cb();
  if (!document.getElementById('leaflet-css')) {
    const l = document.createElement('link');
    l.id = 'leaflet-css'; l.rel = 'stylesheet'; l.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(l);
  }
  const sc = document.createElement('script');
  sc.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
  sc.onload = () => cb(); sc.onerror = () => cb(new Error('load-failed'));
  document.head.appendChild(sc);
}
function sgInitMap(lat, lng) {
  const host = $('#sgMapCanvas'); if (!host) return;
  sgLoadLeaflet((err) => {
    if (err || !window.L || !$('#sgMapCanvas')) {
      if ($('#sgMapCanvas')) $('#sgMapCanvas').innerHTML = '🗺️ แผนที่โหลดไม่ได้ (ต้องเชื่อมอินเทอร์เน็ต) — ใช้ช่องค้นหาพิกัด/ลิงก์ แล้วกดยืนยันได้';
      return;
    }
    host.innerHTML = '';
    const map = L.map(host).setView([lat, lng], 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    const icon = L.divIcon({ className: 'sg-pin', html: '<div style="font-size:30px;line-height:1">📍</div>', iconSize: [30, 30], iconAnchor: [15, 30] });
    const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);
    const upd = (ll) => {
      state._sgPick.lat = ll.lat; state._sgPick.lng = ll.lng;
      const c = $('#sgmap_coord'); if (c) c.textContent = ll.lat.toFixed(6) + ', ' + ll.lng.toFixed(6);
    };
    marker.on('dragend', () => upd(marker.getLatLng()));
    map.on('click', (e) => { marker.setLatLng(e.latlng); upd(e.latlng); });
    state._sgMap = map; state._sgMarker = marker;
    setTimeout(() => map.invalidateSize(), 60);
  });
}
window.sgMapSearch = async () => {
  const t = ($('#sgmap_search') || {}).value || '';
  let c = _sgParseCoords(t) || _sgExtractCoordsFromUrl(t);
  if (!c && _sgIsShortLink(t)) { return toast('ไม่พบพิกัดจากลิงก์นี้ กรุณาวางพิกัด latitude, longitude แทน', 'err', 5500); }
  if (!c && t.trim()) {
    try {
      const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(t.trim()), { headers: { 'Accept': 'application/json' } });
      const j = await r.json();
      if (j && j[0]) { c = { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) }; state._sgPick.name = state._sgPick.name || t.trim(); state._sgPick.address = j[0].display_name || ''; }
      else { return toast('ไม่พบสถานที่ — ลองพิกัด/ลิงก์ หรือคำค้นอื่น (ค้นหาชื่อ/ที่อยู่ต้องออนไลน์)', 'err', 5000); }
    } catch (e) { return toast('ค้นหาชื่อ/ที่อยู่ต้องเชื่อมอินเทอร์เน็ต — หรือวางพิกัด lat,lng', 'err', 5000); }
  }
  if (c) {
    state._sgPick.lat = c.lat; state._sgPick.lng = c.lng;
    if (state._sgMap && state._sgMarker) { state._sgMarker.setLatLng([c.lat, c.lng]); state._sgMap.setView([c.lat, c.lng], 16); }
    const cc = $('#sgmap_coord'); if (cc) cc.textContent = c.lat.toFixed(6) + ', ' + c.lng.toFixed(6);
    toast('ตั้งจุดจากการค้นหาแล้ว', 'ok');
  }
};
window.sgMapConfirm = () => {
  const p = state._sgPick || {};
  if (!state._sgDraft) state._sgDraft = {};
  state._sgDraft.latitude = p.lat; state._sgDraft.longitude = p.lng;
  if (p.name) state._sgDraft.location_name = p.name;
  if (p.address) state._sgDraft.address = p.address;
  sgDestroyMap();
  window.shiftGpsModal(state._sgCurrentShift);
};
window.sgMapCancel = () => { sgDestroyMap(); window.shiftGpsModal(state._sgCurrentShift); };
function sgDestroyMap() { try { if (state._sgMap) { state._sgMap.remove(); state._sgMap = null; state._sgMarker = null; } } catch (_) {} }

/* ---- แก้ไขสำนักงานใหญ่ (Main Office GPS) — ถ้าอ่านลิงก์ไม่ได้ ให้กรอกพิกัดเองได้ ---- */
window.sgEditMainOffice = (id) => {
  sgCaptureDraft();
  state._sgCurrentShift = id;
  const o = sgMainOffice();
  openModal('ตั้งค่าสำนักงานใหญ่ (Main Office GPS)', `
    <div class="form-grid">
      <div><label class="form-label">ชื่อ</label><input class="input" id="mo_name" value="${o.name || ''}"/></div>
      <div><label class="form-label">ที่อยู่</label><input class="input" id="mo_address" value="${o.address || ''}"/></div>
      <div class="form-row">
        <div><label class="form-label">Latitude</label><input class="input" id="mo_lat" value="${o.latitude}"/></div>
        <div><label class="form-label">Longitude</label><input class="input" id="mo_lng" value="${o.longitude}"/></div>
      </div>
      <p class="muted" style="font-size:12px">ค่าเริ่มต้น (ถาวร): ${SG_MAIN_DEFAULT.latitude},${SG_MAIN_DEFAULT.longitude} — เปลี่ยนเฉพาะเมื่อจำเป็น</p>
    </div>`,
    `<button class="btn btn-ghost" onclick="window.sgMapCancel()">ยกเลิก</button>
     <button class="btn btn-primary" onclick="window.sgSaveMainOfficeFromForm()">บันทึก</button>`);
};
window.sgSaveMainOfficeFromForm = () => {
  const lat = parseFloat(($('#mo_lat') || {}).value), lng = parseFloat(($('#mo_lng') || {}).value);
  if (isNaN(lat) || isNaN(lng)) return toast('กรุณากรอกพิกัดสำนักงานใหญ่ให้ถูกต้อง (latitude, longitude)', 'err', 4000);
  sgSaveMainOffice({ name: ($('#mo_name') || {}).value || 'สำนักงานใหญ่', address: ($('#mo_address') || {}).value || '', latitude: lat, longitude: lng });
  toast('บันทึกสำนักงานใหญ่แล้ว', 'ok');
  window.shiftGpsModal(state._sgCurrentShift);
};

/* ===== Cloud sync (Patch 20): Live -> Supabase | DEMO -> localStorage cache เดิม ===== */
window.NJ = window.NJ || {};
NJ.cloudSaveSetting = function (key, value) {
  try {
    if (typeof USE_DEMO !== 'undefined' && USE_DEMO) return;          // DEMO: ใช้ localStorage ของฟีเจอร์อยู่แล้ว
    if (typeof sb === 'undefined' || !sb) return;
    sb.from('system_settings').upsert({ key: key, value: value, updated_at: new Date().toISOString() }).then(function (res) { if (res && res.error) toast('Sync ' + key + ' ไม่สำเร็จ', 'err', 3500); });
  } catch (_) {}
};
NJ.cloudSaveShiftGps = async function (areas) {
  try {
    if (typeof USE_DEMO !== 'undefined' && USE_DEMO) return { ok:true };
    if (typeof sb === 'undefined' || !sb) return { ok:false, error:'ยังไม่ได้เชื่อมต่อฐานข้อมูล' };
    var rows = Object.keys(areas || {}).map(function (sid) { return { shift_id: String(sid), config: areas[sid], updated_at: new Date().toISOString() }; });
    if (!rows.length) return { ok:true };
    var res = await sb.from('shift_gps_locations').upsert(rows, { onConflict: 'shift_id' });
    if (res && res.error) return { ok:false, error: res.error.message };
    return { ok:true };
  } catch (e) { return { ok:false, error: e.message }; }
};
NJ.cloudPreload = async function () {            // ดึงจาก Supabase -> hydrate localStorage cache ตอนเข้าระบบ (Live)
  try {
    if (typeof USE_DEMO !== 'undefined' && USE_DEMO) return;
    if (typeof sb === 'undefined' || !sb) return;
    var s = await sb.from('system_settings').select('key,value');
    if (s && Array.isArray(s.data)) {
      var MAP = { main_office: 'nj_main_office', payroll_state: 'nj_payroll_state', holidays: 'nj_holidays' };
      s.data.forEach(function (row) { if (row && MAP[row.key]) { try { localStorage.setItem(MAP[row.key], JSON.stringify(row.value)); } catch (_) {} } });
    }
    var g = await sb.from('shift_gps_locations').select('shift_id,config');
    if (g && Array.isArray(g.data)) {
      var map = {};
      g.data.forEach(function (r) { if (r && r.shift_id) map[r.shift_id] = r.config || {}; });
      try { localStorage.setItem('nj_shift_gps', JSON.stringify(map)); } catch (_) {}
    }
  } catch (_) {}
};
window.assignShift = (id) => {
  const s = (state._shifts || NJ.DEMO.shifts).find(x => String(x.id) === String(id)) || {};
  const rows = state.employees.map(e => {
    const cur = NJ.DEMO.employeeShifts?.[e.emp_code] === id;
    return `<label class="leave-item assign-row" style="cursor:pointer"
        data-search="${(e.emp_code + ' ' + e.first_name + ' ' + e.last_name + ' ' + (e.department_name || '')).toLowerCase()}">
      <input type="checkbox" class="assign-cb" data-emp-code="${e.emp_code}" ${cur ? 'checked' : ''} style="accent-color:var(--red);width:18px;height:18px"/>
      <img class="ic" src="${avatar(e.first_name)}" style="border-radius:50%"/>
      <div class="body"><b>${e.first_name} ${e.last_name}</b><small>${e.emp_code} • ${e.department_name || ''} • ${e.position_name || ''}</small></div>
    </label>`;
  }).join('');
  openModal(`จัดพนักงานเข้ากะ • ${s.icon || ''} ${s.shift_name || ''}`,
    `<input class="input mb" id="assignSearch" placeholder="🔍 ค้นหาพนักงาน (รหัส/ชื่อ/แผนก)" oninput="window.filterAssign()"/>
     <div style="display:flex;gap:8px;margin-bottom:12px">
       <button class="btn btn-ghost btn-sm" onclick="window.assignSelectAll(true)">เลือกทั้งหมด</button>
       <button class="btn btn-ghost btn-sm" onclick="window.assignSelectAll(false)">ล้างทั้งหมด</button>
     </div>
     <div class="leave-list" id="assignList" style="max-height:340px;overflow:auto">${rows}</div>`,
    `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
     <button class="btn btn-primary" onclick="window.saveShiftAssign('${id}')">บันทึก</button>`);
};
window.filterAssign = () => {
  const q = ($('#assignSearch').value || '').toLowerCase();
  $$('#assignList .assign-row').forEach(r => {
    r.style.display = (!q || r.dataset.search.includes(q)) ? '' : 'none';
  });
};
window.assignSelectAll = (val) => {
  $$('#assignList .assign-row').forEach(r => {
    if (r.style.display !== 'none') { const cb = r.querySelector('.assign-cb'); if (cb) cb.checked = val; }
  });
};
window.saveShiftAssign = async (id) => {
  const checked = $$('#assignList .assign-cb').filter(cb => cb.checked).map(cb => cb.dataset.empCode);
  if (USE_DEMO) {
    state.employees.forEach(e => {
      const isChecked = checked.includes(e.emp_code);
      if (isChecked) NJ.DEMO.employeeShifts[e.emp_code] = id;
      else if (String(NJ.DEMO.employeeShifts[e.emp_code]) === String(id)) delete NJ.DEMO.employeeShifts[e.emp_code];
    });
    closeModal();
    toast('จัดพนักงานเข้ากะเรียบร้อย', 'ok');
    attShift();
    return;
  }
  const orig = (state._shifts || []).find(x => String(x.id) === String(id));
  const res = await Data.assignShift(orig?.uuid || orig?.id_uuid || id, checked);
  if (!res.ok) return toast('บันทึกไม่สำเร็จ: ' + (res.error || ''), 'err', 4000);
  closeModal();
  toast('จัดพนักงานเข้ากะเรียบร้อย', 'ok');
  attShift();
};
window.monthlySchedule = () => {
  const days = Array.from({ length: 10 }, (_, i) => i + 1);
  const head = `<th>พนักงาน</th>${days.map(d => `<th class="t-num">${d}</th>`).join('')}`;
  const body = state.employees.slice(0, 6).map(e => {
    const sid = NJ.DEMO.employeeShifts?.[e.emp_code] || 1;
    const sh = (state._shifts || NJ.DEMO.shifts).find(x => x.id === sid) || {};
    const cells = days.map(d => `<td class="t-num">${[0, 6].includes(d % 7) ? '<span class="muted">-</span>' : (sh.icon || '🕒')}</td>`).join('');
    return `<tr><td><b>${e.first_name}</b><small class="muted" style="display:block">${sh.shift_name || ''}</small></td>${cells}</tr>`;
  }).join('');
  openModal('📅 ตารางกะรายเดือน (ตัวอย่าง)',
    `<div class="tbl-wrap" style="max-height:360px;overflow:auto"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`,
    `<button class="btn btn-ghost" onclick="window.closeModal()">ปิด</button>
     <button class="btn btn-primary" onclick="window.closeModal();window.toast('ส่งออกตารางกะ (Excel)','ok')">📤 Export</button>`);
};
window.checkIn = async (type, btnEl) => {
  if (state._scanning) return;            // กันกดซ้ำระหว่างกำลังบันทึก
  state._scanning = true;
  if (btnEl) { btnEl._txt = btnEl.textContent; btnEl.disabled = true; btnEl.textContent = 'กำลังบันทึก...'; }
  const restore = () => {                 // คืนปุ่ม + ปลดล็อก (กรณีไม่สำเร็จ)
    state._scanning = false;
    if (btnEl) { btnEl.disabled = false; if (btnEl._txt != null) btnEl.textContent = btnEl._txt; }
  };

  // 1) ขอ GPS ก่อน
  let gps;
  try {
    gps = await getCurrentGPS();
  } catch (e) {
    restore();
    return toast(e.message || 'กรุณาอนุญาต GPS ก่อนลงเวลา', 'err', 3500);
  }

  // 2-3) เช็ก Geofence — อยู่นอกพื้นที่ -> บล็อก ไม่บันทึก
  const geo = findAllowedLocation(gps.latitude, gps.longitude);
  if (!geo.allowed) {
    restore();
    return toast(`❌ คุณอยู่นอกพื้นที่ที่กำหนด ไม่สามารถลงเวลาได้ (ระยะ ${geo.distance_meter} ม.)`, 'err', 4000);
  }

  // 4) อยู่ในพื้นที่ -> เปิดกล้องจริง ถ่ายภาพใบหน้า
  let faceImage;
  try {
    toast('กำลังเปิดกล้องเพื่อสแกนใบหน้า...', '', 1500);
    faceImage = await captureFaceSnapshot();
  } catch (e) {
    restore();
    return toast('กรุณาอนุญาตกล้องเพื่อสแกนใบหน้าก่อนลงเวลา', 'err', 4000);
  }

  // 5) GPS ผ่าน + Face ผ่าน -> บันทึกเวลา (logic เดิม) + แนบข้อมูล
  const now = new Date().toLocaleTimeString('th-TH', { hour12: false });
  const record = {
    type,                               // 'in' | 'out'
    time: now,
    face_image_base64: faceImage,
    latitude: gps.latitude,
    longitude: gps.longitude,
    location_name: geo.location_name,
    distance_meter: geo.distance_meter,
    gps_status: 'IN_AREA',
  };
  state._lastAttendance = record;        // เก็บ record ล่าสุด (ไม่กระทบตารางอื่น)

  // 5.1) บันทึกลง Supabase จริง (attendance + gps_logs + face_scan_logs)
  //      ถ้าบันทึกไม่สำเร็จ → แสดง error จริง ห้ามขึ้นว่าสำเร็จ
  record.shift_id = (state._activeShift && state._activeShift.id) ? state._activeShift.id : null;
  const saved = await Data.saveAttendanceScan(record);
  if (!saved.ok) {
    restore();
    return toast('บันทึกลงเวลาไม่สำเร็จ: ' + (saved.error || 'unknown'), 'err', 5000);
  }

  // 6) สำเร็จจริง: toast + reload เฉพาะ attScan() (อ่านสถานะจริงมาแสดงใหม่)
  state._scanning = false;               // ปลดล็อก (ปุ่มจะถูกสร้างใหม่ตอน re-render)
  const label = type === 'in' ? 'บันทึกเข้างานสำเร็จ' : 'บันทึกออกงานสำเร็จ';
  toast(`✅ ${label} • ${geo.location_name} • ระยะ ${geo.distance_meter} เมตร`, 'ok', 3800);
  if (state.route === 'attendance' && state.attTab === 'scan') attScan();
};
function startClock() {
  const tick = () => {
    const t = new Date().toLocaleTimeString('th-TH', { hour12:false });
    const i = $('#clkIn'), o = $('#clkOut'), u = $('#clkUser');
    if (i && !i.dataset.locked) i.textContent = t;   // ล็อกไว้ = แสดงเวลาจริงที่บันทึก ไม่เขียนทับ
    if (o && !o.dataset.locked) o.textContent = t;
    if (u && !u.dataset.locked) u.textContent = t;   // นาฬิกาสดของมุมมอง USER
  };
  tick(); clearInterval(window._clk); window._clk = setInterval(tick, 1000);
}

/* ---- OT ------------------------------------------------------------------- */
function renderOT() {
  const isAdmin = Auth.isAdmin();
  // default tab: admin -> รายการรออนุมัติ, ไม่ใช่ admin -> ประวัติ
  if (!state.otTab || state.otTab === 'request') state.otTab = isAdmin ? 'approve' : 'history';
  if (state.otTab === 'approve' && !isAdmin) state.otTab = 'history';
  const tab = state.otTab;
  const banner = `<div class="lv-banner mb" style="gap:14px;flex-wrap:wrap">
    <div class="lv-banner-ic">🕒</div>
    <div style="flex:1;min-width:150px"><h2 style="margin:0;font-size:20px;font-weight:800">ขอทำ OT</h2>
      <p class="muted" style="margin:1px 0 0;font-size:12.5px">จัดการคำขอทำ OT ของพนักงาน</p></div>
    <button class="btn btn-primary btn-sm" onclick="window.otRequestForm()">+ ขอทำ OT</button>
  </div>`;
  const tabBtn = (id, label) => `<button class="tab ${tab === id ? 'active' : ''}" onclick="window.setOtTab('${id}')">${label}</button>`;
  const tabsBar = `<div class="tabs" style="margin-bottom:16px">
    ${isAdmin ? tabBtn('approve', `รายการรออนุมัติ${pendingOTs().length ? ` (${pendingOTs().length})` : ''}`) : ''}
    ${tabBtn('history','ประวัติ OT')}
  </div>`;
  let body = '';
  if (tab === 'approve' && isAdmin) body = otApproveTab();
  else body = otHistoryTab();
  $('#view').innerHTML = banner + tabsBar + body;
  state._otFile = null;
}
window.setOtTab = (id) => { state.otTab = id; renderOT(); };
function pendingOTs() { return (state.ots || []).filter(o => (o.status || '').startsWith('PENDING')); }
function otEmpOf(o) {
  const fb = state.employees.find(e => e.emp_code === Auth.current?.emp_code) || state.employees[0] || {};
  if (o.emp_code) return state.employees.find(e => e.emp_code === o.emp_code) || fb;
  return fb;
}

// เปิด Modal popup ฟอร์มขอทำ OT (เหมือนปุ่ม + เพิ่มพนักงาน)
window.otRequestForm = () => {
  state._otFile = null;
  openModal('🕒 ขอทำ OT', `
    <div class="form-grid modal-ot-grid">
      <div><label class="form-label">วันที่ <span class="req">*</span></label><input type="date" class="input" id="ot_date"/></div>
      <div class="form-row ot-time-row">
        <div><label class="form-label">เวลาเริ่ม <span class="req">*</span></label><input type="time" class="input ot-time" id="ot_start" value="18:00" oninput="window.calcOtHours()"/></div>
        <div><label class="form-label">เวลาสิ้นสุด <span class="req">*</span></label><input type="time" class="input ot-time" id="ot_end" value="21:00" oninput="window.calcOtHours()"/></div>
      </div>
      <div><label class="form-label">จำนวนชั่วโมง (คำนวณอัตโนมัติ)</label>
        <div class="ot-hour-card">
          <span class="ot-hour-ic">🕒</span>
          <input id="ot_hours" value="3" readonly/>
          <span class="ot-hour-unit">ชั่วโมง</span>
        </div>
      </div>
      <div><label class="form-label">เหตุผล <span class="req">*</span></label><textarea class="input" id="ot_reason" placeholder="อธิบายเหตุผลการทำ OT อย่างละเอียด" maxlength="200" style="min-height:90px"></textarea></div>
      <div><label class="form-label">แนบเอกสาร (ถ้ามี)</label>
        <input type="file" id="ot_file" style="display:none" onchange="window.onOtFile(this)"/>
        <div id="ot_filechip">
          <button class="btn btn-ghost" style="width:100%;justify-content:center" onclick="document.getElementById('ot_file').click()">📎 เลือกไฟล์แนบ (ทุกนามสกุล ≤ 10MB)</button>
        </div>
      </div>
    </div>`,
    `<button class="btn lv-submit" style="width:100%;justify-content:center;height:52px;font-size:16px" onclick="window.submitOT()">✈️ ส่งคำขอ OT</button>`,
    'modal-ot');
  // focus ที่ช่องวันที่
  setTimeout(() => { const d = $('#ot_date'); if (d) d.focus(); }, 50);
};

/* แท็บ 2: รายการรออนุมัติ OT */
function otApproveTab() {
  const pend = pendingOTs();
  const rows = pend.map((o, idx) => {
    const e = otEmpOf(o);
    const level = LEAVE_STATUS_LEVEL[o.status] || 'DEPARTMENT';
    const canDo = canApproveLevel(level, e.department_name);
    const lastAppr = (o.approvals && o.approvals.length) ? o.approvals[o.approvals.length - 1] : null;
    return `<tr>
      <td>${e.emp_code || '-'}</td>
      <td>${e.first_name || '-'} ${e.last_name || ''}</td>
      <td>${e.department_name || '-'}</td>
      <td>${o.date || '-'}</td>
      <td>${o.start || '-'} - ${o.end || '-'}</td>
      <td>${o.hours || 0} ชม.</td>
      <td style="max-width:160px">${o.reason || '-'}</td>
      <td>${leaveStatusBadge(o.status)}</td>
      <td>${lastAppr ? `${lastAppr.approver_name || ''} <small class="muted">(${lastAppr.action === 'APPROVE' ? 'อนุมัติ' : 'ไม่อนุมัติ'})</small>` : '-'}</td>
      <td style="display:flex;gap:6px;white-space:nowrap">
        <button class="icon-btn" onclick="window.otDetail(${idx})" title="ดูรายละเอียด">👁</button>
        ${canDo ? `<button class="icon-btn" onclick="window.otApprove(${idx})" title="อนุมัติ">✅</button>
          <button class="icon-btn" onclick="window.otReject(${idx})" title="ไม่อนุมัติ">❌</button>` : '<small class="muted">ไม่มีสิทธิ์</small>'}
      </td>
    </tr>`;
  }).join('');
  return `<div class="card">
    <div class="card-head"><h3>รายการรออนุมัติ OT <span class="muted" style="font-weight:500">(${pend.length})</span></h3></div>
    <div class="tbl-wrap fit-table-wrap"><table class="emp-table">
      <thead><tr><th>รหัสพนักงาน</th><th>ชื่อ-นามสกุล</th><th>แผนก</th><th>วันที่</th><th>เวลา</th><th>ชั่วโมง</th><th>เหตุผล</th><th>สถานะปัจจุบัน</th><th>ผู้อนุมัติล่าสุด</th><th>จัดการ</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="10" style="text-align:center;padding:30px" class="muted">ไม่มีคำขอรออนุมัติ</td></tr>'}</tbody>
    </table></div>
  </div>`;
}

/* แท็บ 3: ประวัติ OT */
function otHistoryTab() {
  const rows = (state.ots || []).map(o => {
    const e = otEmpOf(o);
    return `<tr><td>${o.date}</td><td>${o.start}</td><td>${o.end}</td><td>${o.hours} ชม.</td>
      <td>${e.first_name || ''} ${e.last_name || ''}</td>
      <td>${(o.approvals && o.approvals.length) ? o.approvals[o.approvals.length - 1].approver_name : '-'}</td>
      <td>${leaveStatusBadge(o.status)}</td></tr>`;
  }).join('');
  return `<div class="card">
    <div class="card-head"><h3>ประวัติ OT ทั้งหมด</h3></div>
    <div class="tbl-wrap fit-table-wrap"><table class="emp-table">
      <thead><tr><th>วันที่</th><th>เริ่ม</th><th>สิ้นสุด</th><th>ชั่วโมง</th><th>พนักงาน</th><th>ผู้อนุมัติล่าสุด</th><th>สถานะ</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7" style="text-align:center;padding:30px" class="muted">ยังไม่มีประวัติ OT</td></tr>'}</tbody>
    </table></div>
  </div>`;
}

window.calcOtHours = () => {
  const s = $('#ot_start')?.value, e = $('#ot_end')?.value, out = $('#ot_hours');
  if (!s || !e || !out) return;
  const [sh, sm] = s.split(':').map(Number), [eh, em] = e.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  out.value = (mins / 60).toFixed(mins % 60 ? 1 : 0);
};
window.submitOT = async () => {
  const date = $('#ot_date')?.value, start = $('#ot_start')?.value, end = $('#ot_end')?.value;
  const hours = Number($('#ot_hours')?.value) || 0, reason = $('#ot_reason')?.value.trim() || '';
  if (!date) return toast('กรุณาเลือกวันที่', 'err');
  if (!reason) return toast('กรุณาระบุเหตุผลการทำ OT', 'err');
  const res = await Data.submitOT({ date, start, end, hours, reason, file: state._otFile });
  if (!res.ok) return toast('บันทึกไม่สำเร็จ: ' + (res.error || ''), 'err', 4000);
  state._otFile = null;
  closeModal();
  state.ots = await Data.ots();
  state.otTab = 'history';
  renderOT();
  toast('ส่งคำขอ OT เรียบร้อย • รอแผนกตรวจสอบ', 'ok', 3500);
};

/* Action OT: อนุมัติ / ไม่อนุมัติ / รายละเอียด */
window.otApprove = (idx) => {
  const o = pendingOTs()[idx]; if (!o) return;
  const level = LEAVE_STATUS_LEVEL[o.status] || 'DEPARTMENT';
  if (!canApproveLevel(level, otEmpOf(o).department_name)) return toast('คุณไม่มีสิทธิ์อนุมัติในระดับนี้', 'err');
  openModal('อนุมัติคำขอ OT', `
    <p class="mb">อนุมัติ OT ของ <b>${otEmpOf(o).first_name || ''} ${otEmpOf(o).last_name || ''}</b></p>
    <p class="muted mb">ระดับปัจจุบัน: ${LEAVE_STATUS_TH[o.status]}</p>
    ${execApproverPickerHTML(level, otEmpOf(o).department_name)}
    <label class="form-label">หมายเหตุ (ถ้ามี)</label>
    <textarea class="input" id="ot_appr_comment" placeholder="ความเห็นเพิ่มเติม" maxlength="200"></textarea>`,
    `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
     <button class="btn btn-primary" onclick="window.confirmOtApprove(${idx})">ยืนยันอนุมัติ</button>`);
};
window.confirmOtApprove = async (idx) => {
  const o = pendingOTs()[idx]; if (!o) return;
  const level = LEAVE_STATUS_LEVEL[o.status] || 'DEPARTMENT';
  const comment = $('#ot_appr_comment')?.value.trim() || '';
  if (!o.approvals) o.approvals = [];
  const appr = pickedApprover();
  o.approvals.push({ level, approver_role: Auth.current?.role, approver_name: appr.name, approver_code: appr.code, action: 'APPROVE', comment, approved_at: new Date().toISOString() });
  const newStatus = nextLeaveStatus(o.status);
  const res = await Data.updateOtStatus(o.id, newStatus, o.approvals);
  if (!res.ok) { o.approvals.pop(); return toast('บันทึกไม่สำเร็จ: ' + res.error, 'err', 4500); }
  o.status = newStatus;
  closeModal(); renderOT();
  toast(o.status === 'APPROVED' ? 'อนุมัติครบทุกระดับแล้ว ✅' : `อนุมัติแล้ว • ${LEAVE_STATUS_TH[o.status]}`, 'ok', 3500);
};
window.otReject = (idx) => {
  const o = pendingOTs()[idx]; if (!o) return;
  const level = LEAVE_STATUS_LEVEL[o.status] || 'DEPARTMENT';
  if (!canApproveLevel(level, otEmpOf(o).department_name)) return toast('คุณไม่มีสิทธิ์ในระดับนี้', 'err');
  openModal('ไม่อนุมัติคำขอ OT', `
    <p class="mb">ไม่อนุมัติ OT ของ <b>${otEmpOf(o).first_name || ''} ${otEmpOf(o).last_name || ''}</b></p>
    <label class="form-label">เหตุผลที่ไม่อนุมัติ <span class="req">*</span></label>
    <textarea class="input" id="ot_rej_comment" placeholder="ระบุเหตุผล (จำเป็น)" maxlength="200"></textarea>`,
    `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
     <button class="btn btn-primary" onclick="window.confirmOtReject(${idx})">ยืนยันไม่อนุมัติ</button>`);
};
window.confirmOtReject = async (idx) => {
  const o = pendingOTs()[idx]; if (!o) return;
  const comment = $('#ot_rej_comment')?.value.trim() || '';
  if (!comment) return toast('กรุณากรอกเหตุผลที่ไม่อนุมัติ', 'err');
  const level = LEAVE_STATUS_LEVEL[o.status] || 'DEPARTMENT';
  if (!o.approvals) o.approvals = [];
  o.approvals.push({ level, approver_role: Auth.current?.role, approver_name: Auth.current?.full_name || Auth.current?.username, action: 'REJECT', comment, approved_at: new Date().toISOString() });
  const res = await Data.updateOtStatus(o.id, 'REJECTED', o.approvals);
  if (!res.ok) { o.approvals.pop(); return toast('บันทึกไม่สำเร็จ: ' + res.error, 'err', 4500); }
  o.status = 'REJECTED';
  closeModal(); renderOT();
  toast('ไม่อนุมัติคำขอ OT แล้ว', 'ok');
};
window.otDetail = (idx) => {
  const o = pendingOTs()[idx]; if (!o) return;
  const e = otEmpOf(o);
  const history = (o.approvals || []).map(a =>
    `<div class="detail-line"><span>${{DEPARTMENT:'แผนก',SUPERVISOR:'หัวหน้า',MANAGER:'หัวหน้าฝ่าย',EXECUTIVE:'ผู้บริหาร'}[a.level] || a.level} • ${a.approver_name || ''}</span><b style="color:${a.action === 'APPROVE' ? 'var(--green)' : 'var(--red)'}">${a.action === 'APPROVE' ? 'อนุมัติ' : 'ไม่อนุมัติ'}</b></div>${a.comment ? `<div class="muted" style="font-size:12px;padding:0 0 8px">↳ ${a.comment}</div>` : ''}`
  ).join('') || '<p class="muted">ยังไม่มีประวัติการอนุมัติ</p>';
  openModal(`รายละเอียด OT • ${e.emp_code || ''}`, `
    <div class="detail-line"><span>พนักงาน</span><b>${e.first_name || ''} ${e.last_name || ''}</b></div>
    <div class="detail-line"><span>แผนก</span><b>${e.department_name || '-'}</b></div>
    <div class="detail-line"><span>วันที่</span><b>${o.date || '-'}</b></div>
    <div class="detail-line"><span>เวลา</span><b>${o.start || '-'} - ${o.end || '-'} (${o.hours || 0} ชม.)</b></div>
    <div class="detail-line"><span>เหตุผล</span><b>${o.reason || '-'}</b></div>
    <div class="detail-line"><span>สถานะ</span><b>${LEAVE_STATUS_TH[o.status] || o.status}</b></div>
    <div style="margin-top:14px;font-weight:700;color:var(--red)">ประวัติการอนุมัติ</div>
    ${history}`,
    `<button class="btn btn-primary" onclick="window.closeModal()">ปิด</button>`);
};
function stBadge(s) {
  return { PENDING:'<span class="badge amber">รออนุมัติ</span>', APPROVED:'<span class="badge green">อนุมัติแล้ว</span>',
    REJECTED:'<span class="badge red">ไม่อนุมัติ</span>' }[s] || s;
}

/* ---- LEAVE ---------------------------------------------------------------- */
const LEAVE_TYPE_ENUM = { 'ลาป่วย':'SICK','ลากิจ':'PERSONAL','ลาพักร้อน':'VACATION','ลาคลอด':'MATERNITY','ลาบวช':'ORDINATION','อื่นๆ':'OTHER' };

function leaveDuration(l) {
  const unit = l.unit || 'day';
  if (unit === 'hour') return `${l.hours || 0} ชั่วโมง`;
  if (unit === 'halfday') return `0.5 วัน`;
  return `${l.days || 0} วัน`;
}

/* ====== ระบบอนุมัติลา 4 ระดับ (แผนก → หัวหน้า → หัวหน้าฝ่าย → ผู้บริหาร) ====== */
const LEAVE_FLOW = ['PENDING_DEPARTMENT','PENDING_SUPERVISOR','PENDING_MANAGER','PENDING_EXECUTIVE','APPROVED'];
const LEAVE_STATUS_TH = {
  PENDING_DEPARTMENT:'รอแผนกตรวจสอบ', PENDING_SUPERVISOR:'รอหัวหน้าอนุมัติ',
  PENDING_MANAGER:'รอหัวหน้าฝ่ายอนุมัติ', PENDING_EXECUTIVE:'รอผู้บริหารอนุมัติ',
  APPROVED:'อนุมัติแล้ว', REJECTED:'ไม่อนุมัติ',
  PENDING:'รอแผนกตรวจสอบ',   // ของเก่า map เป็น level แรก
};
// level ที่ต้องอนุมัติในแต่ละสถานะ
const LEAVE_STATUS_LEVEL = {
  PENDING_DEPARTMENT:'DEPARTMENT', PENDING:'DEPARTMENT',
  PENDING_SUPERVISOR:'SUPERVISOR', PENDING_MANAGER:'MANAGER', PENDING_EXECUTIVE:'EXECUTIVE',
};
// สิทธิ์อนุมัติแต่ละ level (ตาม role) — SUPER_ADMIN อนุมัติได้ทุก level
const LEVEL_ROLES = {
  DEPARTMENT: ['HR','ADMIN','SUPER_ADMIN'],
  SUPERVISOR: ['MANAGER','ADMIN','SUPER_ADMIN'],          // "หัวหน้า"
  MANAGER:    ['MANAGER','ADMIN','SUPER_ADMIN'],          // "หัวหน้าฝ่าย"
  EXECUTIVE:  ['SUPER_ADMIN'],                            // "ผู้บริหาร"
};
// ผู้อนุมัติที่กำหนดเป็นรายบุคคล แยกตามแผนก
// โครงสร้าง: state.leaveApprovers[department][level] = emp_code
// level: SUPERVISOR (หัวหน้า) / MANAGER (หัวหน้าฝ่าย) / EXECUTIVE (ผู้บริหาร)
function getDeptApprover(department, level) {
  // ระบบใหม่ (Department Approvers) มาก่อน — รองรับหลายผู้อนุมัติ/หัวหน้าดูแลหลายแผนก
  // ถ้ายังไม่ได้ตั้งในระบบใหม่ -> ตกไปใช้ระบบเดิม (backward compatible)
  try {
    const fromNew = (typeof newDeptApproverCodes === 'function') ? newDeptApproverCodes(department, level) : null;
    if (fromNew && fromNew.length) return fromNew;
  } catch (_) {}
  return state.leaveApprovers?.[department]?.[level] || null;
}
// ตรวจสิทธิ์อนุมัติ: ถ้ามีการกำหนดผู้อนุมัติรายคนของแผนกนั้นไว้ ต้องเป็นคนนั้น
// ถ้ายังไม่ได้กำหนด -> ใช้ role เดิม (backward compatible)
function canApproveLevel(level, department) {
  const role = Auth.current?.role;
  if (role === 'SUPER_ADMIN') return true;                // ผู้ดูแลสูงสุดอนุมัติได้ทุกกรณี
  // ถ้ามีผู้อนุมัติที่กำหนดไว้สำหรับแผนก+ระดับนี้ -> ต้องเป็นคนนั้นเท่านั้น
  if (department) {
    const assigned = getDeptApprover(department, level);
    if (assigned) return Array.isArray(assigned) ? assigned.includes(Auth.current?.emp_code) : (assigned === Auth.current?.emp_code);
  }
  // ไม่ได้กำหนดรายคน -> ใช้สิทธิ์ตาม role
  return (LEVEL_ROLES[level] || []).includes(role);
}
function leaveStatusBadge(s) {
  const th = LEAVE_STATUS_TH[s] || s;
  if (s === 'APPROVED') return `<span class="badge green">${th}</span>`;
  if (s === 'REJECTED') return `<span class="badge red">${th}</span>`;
  return `<span class="badge amber">${th}</span>`;
}
// สถานะถัดไปใน flow (คืน APPROVED เมื่อจบ)
function nextLeaveStatus(cur) {
  const c = cur === 'PENDING' ? 'PENDING_DEPARTMENT' : cur;
  const i = LEAVE_FLOW.indexOf(c);
  if (i < 0 || i >= LEAVE_FLOW.length - 1) return 'APPROVED';
  return LEAVE_FLOW[i + 1];
}
// รายการรออนุมัติ = สถานะ pending ทั้งหมด
function pendingLeaves() {
  return (state.leaves || []).filter(l => (l.status || '').startsWith('PENDING'));
}

function renderLeave() {
  // default: admin → รายการรออนุมัติ, อื่นๆ → ประวัติการลา (ไม่มีแท็บ "ขออนุมัติลา" แล้ว)
  if (!state.leaveTab || state.leaveTab === 'request') state.leaveTab = Auth.isAdmin() ? 'approve' : 'history';
  const tab = state.leaveTab;
  const banner = `<div class="lv-banner mb" style="gap:16px">
    <div class="lv-banner-ic">📋</div>
    <div style="flex:1"><h2 style="margin:0;font-size:20px;font-weight:800">ขอลางาน</h2>
      <p class="muted" style="margin:1px 0 0;font-size:12.5px">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อส่งคำขออนุมัติ</p></div>
    <button class="btn btn-primary btn-sm" onclick="window.leaveRequestForm()">+ ขออนุมัติลา</button>
  </div>`;
  const tabBtn = (id, label) => `<button class="tab ${tab === id ? 'active' : ''}" onclick="window.setLeaveTab('${id}')">${label}</button>`;
  const tabsBar = `<div class="tabs" style="margin-bottom:16px">
    ${Auth.isAdmin() ? tabBtn('approve', `รายการรออนุมัติ${pendingLeaves().length ? ` (${pendingLeaves().length})` : ''}`) : ''}
    ${tabBtn('history','ประวัติการลา')}
  </div>`;
  let bodyHTML = '';
  if (tab === 'approve' && Auth.isAdmin()) bodyHTML = leaveApproveTab();
  else bodyHTML = leaveHistoryTab();
  $('#view').innerHTML = banner + tabsBar + bodyHTML;
  state._leaveFile = null;
}
window.setLeaveTab = (id) => { state.leaveTab = id; renderLeave(); };

// เปิด Modal popup ฟอร์มขอลางาน (เหมือนปุ่ม + เพิ่มพนักงาน)
window.leaveRequestForm = () => {
  state._leaveFile = null;
  openModal('📅 ขออนุมัติลา', `
    <div class="form-grid">
      <div><label class="form-label">ประเภทการลา <span class="req">*</span></label>
        <select class="input" id="lv_type"><option>ลาป่วย</option><option>ลากิจ</option><option>ลาพักร้อน</option><option>ลาคลอด</option><option>ลาบวช</option><option>อื่นๆ</option></select></div>

      <div><label class="form-label">ประเภทการนับลา <span class="req">*</span></label>
        <select class="input" id="lv_unit" onchange="window.onLeaveUnitChange()">
          <option value="day">ลาเต็มวัน</option>
          <option value="halfday">ลาครึ่งวัน</option>
          <option value="hour">ลาเป็นชั่วโมง</option>
        </select></div>

      <div class="form-row">
        <div><label class="form-label">วันที่เริ่มลา <span class="req">*</span></label><input type="date" class="input" id="lv_start"/></div>
        <div><label class="form-label">วันที่สิ้นสุด <span class="req">*</span></label><input type="date" class="input" id="lv_end"/></div>
      </div>

      <div id="lv_hourbox" style="display:none">
        <div class="form-row">
          <div><label class="form-label">เวลาเริ่มลา <span class="req">*</span></label><input type="time" class="input" id="lv_htime_start" value="09:00" oninput="window.calcLeaveHours()"/></div>
          <div><label class="form-label">เวลาสิ้นสุดลา <span class="req">*</span></label><input type="time" class="input" id="lv_htime_end" value="12:00" oninput="window.calcLeaveHours()"/></div>
        </div>
        <div style="margin-top:14px"><label class="form-label">จำนวนชั่วโมงลา (คำนวณอัตโนมัติ)</label>
          <input class="input" id="lv_hours" value="3" readonly style="background:var(--gray);font-weight:700"/></div>
      </div>

      <div><label class="form-label">เหตุผลในการลา <span class="req">*</span></label><textarea class="input" id="lv_reason" placeholder="ระบุเหตุผลในการลา" maxlength="200" style="min-height:90px"></textarea></div>

      <div><label class="form-label">แนบเอกสาร (ถ้ามี)</label>
        <input type="file" id="lv_file" style="display:none" onchange="window.onLeaveFile(this)"/>
        <div id="lv_filechip">
          <button class="btn btn-ghost" style="width:100%;justify-content:center" onclick="document.getElementById('lv_file').click()">📎 เลือกไฟล์แนบ (ทุกนามสกุล ≤ 10MB)</button>
        </div>
      </div>
    </div>`,
    `<div style="display:flex;gap:10px;width:100%">
       <button class="btn btn-ghost" style="flex:1;justify-content:center;height:52px" onclick="window.clearLeaveModalForm()">🗑 ล้างข้อมูล</button>
       <button class="btn lv-submit" style="flex:1;justify-content:center;height:52px;font-size:16px" onclick="window.submitLeave()">✈️ ส่งคำขอ</button>
     </div>`);
  setTimeout(() => { const t = $('#lv_type'); if (t) t.focus(); }, 50);
};
// ล้างข้อมูลในฟอร์ม Modal (ไม่ปิด popup)
window.clearLeaveModalForm = () => {
  state._leaveFile = null;
  ['lv_start', 'lv_end', 'lv_reason'].forEach(id => { const el = $('#' + id); if (el) el.value = ''; });
  const t = $('#lv_type'); if (t) t.selectedIndex = 0;
  const u = $('#lv_unit'); if (u) { u.selectedIndex = 0; window.onLeaveUnitChange(); }
  if (typeof window.clearLeaveFile === 'function') window.clearLeaveFile();
};

/* แท็บ 2: รายการรออนุมัติ (เฉพาะผู้มีสิทธิ์) */
function leaveApproveTab() {
  const pend = pendingLeaves();
  const rows = pend.map((l, idx) => {
    const e = leaveEmpOf(l);
    const level = LEAVE_STATUS_LEVEL[l.status] || 'DEPARTMENT';
    const canDo = canApproveLevel(level, e.department_name);
    const lastAppr = (l.approvals && l.approvals.length) ? l.approvals[l.approvals.length - 1] : null;
    return `<tr>
      <td>${e.emp_code || '-'}</td>
      <td>${e.first_name || '-'} ${e.last_name || ''}</td>
      <td>${e.department_name || '-'}</td>
      <td>${l.label || '-'}</td>
      <td>${l.start || '-'}${l.end && l.end !== l.start ? ' - ' + l.end : ''}</td>
      <td>${leaveDuration(l)}</td>
      <td style="max-width:160px">${l.reason || '-'}</td>
      <td>${leaveStatusBadge(l.status)}</td>
      <td>${lastAppr ? `${lastAppr.approver_name || ''} <small class="muted">(${lastAppr.action === 'APPROVE' ? 'อนุมัติ' : 'ไม่อนุมัติ'})</small>` : '-'}</td>
      <td style="display:flex;gap:6px;white-space:nowrap">
        <button class="icon-btn" onclick="window.leaveDetail(${idx})" title="ดูรายละเอียด">👁</button>
        ${canDo ? `<button class="icon-btn" onclick="window.leaveApprove(${idx})" title="อนุมัติ">✅</button>
          <button class="icon-btn" onclick="window.leaveReject(${idx})" title="ไม่อนุมัติ">❌</button>` : '<small class="muted">ไม่มีสิทธิ์</small>'}
      </td>
    </tr>`;
  }).join('');
  return `<div class="card">
    <div class="card-head"><h3>รายการรออนุมัติ <span class="muted" style="font-weight:500">(${pend.length})</span></h3></div>
    <div class="tbl-wrap fit-table-wrap"><table class="emp-table">
      <thead><tr><th>รหัสพนักงาน</th><th>ชื่อ-นามสกุล</th><th>แผนก</th><th>ประเภทลา</th><th>วันที่ลา</th><th>จำนวน</th><th>เหตุผล</th><th>สถานะปัจจุบัน</th><th>ผู้อนุมัติล่าสุด</th><th>จัดการ</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="10" style="text-align:center;padding:30px" class="muted">ไม่มีคำขอรออนุมัติ</td></tr>'}</tbody>
    </table></div>
  </div>`;
}

/* แท็บ 3: ประวัติการลา */
function leaveHistoryTab() {
  const leaveIcon = { SICK:['🤒','#fff1f1'], PERSONAL:['💼','#dcfce7'], VACATION:['🏖️','#fffbeb'], MATERNITY:['👶','#ffe3e3'], ORDINATION:['🙏','#f1f3f5'], OTHER:['📋','#f1f3f5'] };
  // USER เห็นเฉพาะใบลาของตัวเอง / ADMIN เห็นทุกคน
  const all = state.leaves || [];
  const source = Auth.isAdmin() ? all : all.filter(l => leaveIsMine(l));
  const items = source.map(l => {
    const [ic, bg] = leaveIcon[l.type] || ['📋','#f1f3f5'];
    const who = Auth.isAdmin() ? `<small class="muted" style="display:block">${(leaveEmpOf(l).first_name || '')} ${(leaveEmpOf(l).last_name || '')}</small>` : '';
    return `<div class="leave-item">
      <div class="ic" style="background:${bg}">${ic}</div>
      <div class="body"><b>${l.label}</b><small>${l.start} - ${l.end} • ${leaveDuration(l)}</small>${who}</div>
      <div style="text-align:right">${leaveStatusBadge(l.status)}<small class="muted" style="display:block;font-size:11px;margin-top:4px">${l.when}</small></div>
    </div>`;
  }).join('');
  return `<div class="card">
    <div class="card-head"><h3>${Auth.isAdmin() ? 'ประวัติการลาทั้งหมด' : 'ประวัติการลาของฉัน'}</h3></div>
    <div class="card-pad leave-list">${items || '<p class="muted" style="text-align:center;padding:30px">ยังไม่มีประวัติการลา</p>'}</div>
  </div>`;
}
// ใบลานี้เป็นของผู้ใช้ที่ล็อกอินหรือไม่ (เทียบ emp_code ก่อน, ไม่มีก็เทียบ employee_id)
function leaveIsMine(l) {
  const me = Auth.current || {};
  if (l.emp_code && me.emp_code) return String(l.emp_code) === String(me.emp_code);
  const myEmp = (state.employees || []).find(e => e.emp_code === me.emp_code);
  if (l.employee_id && myEmp) return String(l.employee_id) === String(myEmp.id);
  return false;
}
// หาพนักงานเจ้าของใบลา
function leaveEmpOf(l) {
  const fb = state.employees.find(e => e.emp_code === Auth.current?.emp_code) || state.employees[0] || {};
  if (l.emp_code) return state.employees.find(e => e.emp_code === l.emp_code) || fb;
  if (l.employee_id) return state.employees.find(e => e.id === l.employee_id) || fb;
  return fb;
}

/* ---- Action: อนุมัติ / ไม่อนุมัติ / ดูรายละเอียด ---- */
window.leaveApprove = (idx) => {
  const l = pendingLeaves()[idx]; if (!l) return;
  const level = LEAVE_STATUS_LEVEL[l.status] || 'DEPARTMENT';
  if (!canApproveLevel(level, leaveEmpOf(l).department_name)) return toast('คุณไม่มีสิทธิ์อนุมัติในระดับนี้', 'err');
  openModal('อนุมัติคำขอลา', `
    <p class="mb">อนุมัติคำขอลาของ <b>${leaveEmpOf(l).first_name || ''} ${leaveEmpOf(l).last_name || ''}</b></p>
    <p class="muted mb">ระดับปัจจุบัน: ${LEAVE_STATUS_TH[l.status]}</p>
    ${execApproverPickerHTML(level, leaveEmpOf(l).department_name)}
    <label class="form-label">หมายเหตุ (ถ้ามี)</label>
    <textarea class="input" id="appr_comment" placeholder="ความเห็นเพิ่มเติม" maxlength="200"></textarea>`,
    `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
     <button class="btn btn-primary" onclick="window.confirmLeaveApprove(${idx})">ยืนยันอนุมัติ</button>`);
};
window.confirmLeaveApprove = async (idx) => {
  const l = pendingLeaves()[idx]; if (!l) return;
  const level = LEAVE_STATUS_LEVEL[l.status] || 'DEPARTMENT';
  const comment = $('#appr_comment')?.value.trim() || '';
  if (!l.approvals) l.approvals = [];
  const appr = pickedApprover();
  l.approvals.push({
    leave_id: l.id || idx, level, approver_role: Auth.current?.role,
    approver_name: appr.name, approver_code: appr.code, action: 'APPROVE',
    comment, approved_at: new Date().toISOString(),
  });
  const newStatus = nextLeaveStatus(l.status);
  const res = await Data.updateLeaveStatus(l.id, newStatus, l.approvals);
  if (!res.ok) { l.approvals.pop(); return toast('บันทึกไม่สำเร็จ: ' + res.error, 'err', 4500); }
  l.status = newStatus;
  closeModal();
  renderLeave();
  toast(l.status === 'APPROVED' ? 'อนุมัติครบทุกระดับแล้ว ✅' : `อนุมัติแล้ว • ${LEAVE_STATUS_TH[l.status]}`, 'ok', 3500);
};
window.leaveReject = (idx) => {
  const l = pendingLeaves()[idx]; if (!l) return;
  const level = LEAVE_STATUS_LEVEL[l.status] || 'DEPARTMENT';
  if (!canApproveLevel(level, leaveEmpOf(l).department_name)) return toast('คุณไม่มีสิทธิ์ในระดับนี้', 'err');
  openModal('ไม่อนุมัติคำขอลา', `
    <p class="mb">ไม่อนุมัติคำขอลาของ <b>${leaveEmpOf(l).first_name || ''} ${leaveEmpOf(l).last_name || ''}</b></p>
    <label class="form-label">เหตุผลที่ไม่อนุมัติ <span class="req">*</span></label>
    <textarea class="input" id="rej_comment" placeholder="ระบุเหตุผล (จำเป็น)" maxlength="200"></textarea>`,
    `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
     <button class="btn btn-primary" onclick="window.confirmLeaveReject(${idx})">ยืนยันไม่อนุมัติ</button>`);
};
window.confirmLeaveReject = async (idx) => {
  const l = pendingLeaves()[idx]; if (!l) return;
  const comment = $('#rej_comment')?.value.trim() || '';
  if (!comment) return toast('กรุณากรอกเหตุผลที่ไม่อนุมัติ', 'err');
  const level = LEAVE_STATUS_LEVEL[l.status] || 'DEPARTMENT';
  if (!l.approvals) l.approvals = [];
  l.approvals.push({
    leave_id: l.id || idx, level, approver_role: Auth.current?.role,
    approver_name: Auth.current?.full_name || Auth.current?.username, action: 'REJECT',
    comment, approved_at: new Date().toISOString(),
  });
  const res = await Data.updateLeaveStatus(l.id, 'REJECTED', l.approvals);
  if (!res.ok) { l.approvals.pop(); return toast('บันทึกไม่สำเร็จ: ' + res.error, 'err', 4500); }
  l.status = 'REJECTED';
  closeModal();
  renderLeave();
  toast('ไม่อนุมัติคำขอลาแล้ว', 'ok');
};
window.leaveDetail = (idx) => {
  const l = pendingLeaves()[idx]; if (!l) return;
  const e = leaveEmpOf(l);
  const history = (l.approvals || []).map(a =>
    `<div class="detail-line"><span>${{DEPARTMENT:'แผนก',SUPERVISOR:'หัวหน้า',MANAGER:'หัวหน้าฝ่าย',EXECUTIVE:'ผู้บริหาร'}[a.level] || a.level} • ${a.approver_name || ''}</span><b style="color:${a.action === 'APPROVE' ? 'var(--green)' : 'var(--red)'}">${a.action === 'APPROVE' ? 'อนุมัติ' : 'ไม่อนุมัติ'}</b></div>${a.comment ? `<div class="muted" style="font-size:12px;padding:0 0 8px">↳ ${a.comment}</div>` : ''}`
  ).join('') || '<p class="muted">ยังไม่มีประวัติการอนุมัติ</p>';
  openModal(`รายละเอียดคำขอลา • ${e.emp_code || ''}`, `
    <div class="detail-line"><span>พนักงาน</span><b>${e.first_name || ''} ${e.last_name || ''}</b></div>
    <div class="detail-line"><span>แผนก</span><b>${e.department_name || '-'}</b></div>
    <div class="detail-line"><span>ประเภทลา</span><b>${l.label || '-'}</b></div>
    <div class="detail-line"><span>วันที่ลา</span><b>${l.start || '-'}${l.end && l.end !== l.start ? ' - ' + l.end : ''}</b></div>
    <div class="detail-line"><span>จำนวน</span><b>${leaveDuration(l)}</b></div>
    <div class="detail-line"><span>เหตุผล</span><b>${l.reason || '-'}</b></div>
    <div class="detail-line"><span>สถานะ</span><b>${LEAVE_STATUS_TH[l.status] || l.status}</b></div>
    <div style="margin-top:14px;font-weight:700;color:var(--red)">ประวัติการอนุมัติ</div>
    ${history}`,
    `<button class="btn btn-primary" onclick="window.closeModal()">ปิด</button>`);
};
window.renderLeaveReset = () => { state._leaveFile = null; renderLeave(); };

window.onLeaveUnitChange = () => {
  const u = $('#lv_unit'), box = $('#lv_hourbox');
  if (!u || !box) return;
  const unit = u.value;
  box.style.display = unit === 'hour' ? 'block' : 'none';
  if (unit === 'hour') calcLeaveHours();
};

window.calcLeaveHours = () => {
  const s = $('#lv_htime_start')?.value, e = $('#lv_htime_end')?.value;
  const out = $('#lv_hours'); if (!s || !e || !out) return;
  const [sh, sm] = s.split(':').map(Number), [eh, em] = e.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;               // ข้ามวัน
  out.value = (mins / 60).toFixed(mins % 60 ? 1 : 0);
};

window.onLeaveFile = async (input) => {
  let f = input.files && input.files[0];
  if (!f) return;
  if (f.size > 10 * 1024 * 1024) { toast('ไฟล์ใหญ่เกิน 10 MB', 'err'); input.value = ''; return; }
  const fchip = $('#lv_filechip');
  if (fchip && f.type && f.type.startsWith('image/')) fchip.innerHTML = `<div class="file-chip"><div class="ic">⏳</div><div><b>กำลังบีบรูป...</b></div></div>`;
  f = await compressImage(f);            // บีบรูปก่อนแนบ (ถ้าเป็นรูป)
  state._leaveFile = f;
  const kb = f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(0)} KB` : `${(f.size / 1024 / 1024).toFixed(1)} MB`;
  if (fchip) fchip.innerHTML = `<div class="file-chip"><div class="ic">📄</div>
    <div><b>${f.name}</b><small>${kb}</small></div>
    <span class="x" style="cursor:pointer" onclick="window.clearLeaveFile()">✕</span></div>`;
};
window.clearLeaveFile = () => {
  state._leaveFile = null; const fi = $('#lv_file'); if (fi) fi.value = '';
  $('#lv_filechip').innerHTML = `<button class="btn btn-ghost" style="width:100%;justify-content:center" onclick="document.getElementById('lv_file').click()">📎 เลือกไฟล์แนบ</button>`;
};
window.onOtFile = async (input) => {
  let f = input.files && input.files[0];
  if (!f) return;
  if (f.size > 10 * 1024 * 1024) { toast('ไฟล์ใหญ่เกิน 10 MB', 'err'); input.value = ''; return; }
  const fchip = $('#ot_filechip');
  if (fchip && f.type && f.type.startsWith('image/')) fchip.innerHTML = `<div class="file-chip"><div class="ic">⏳</div><div><b>กำลังบีบรูป...</b></div></div>`;
  f = await compressImage(f);            // บีบรูปก่อนแนบ (ถ้าเป็นรูป)
  state._otFile = f;
  const kb = f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(0)} KB` : `${(f.size / 1024 / 1024).toFixed(1)} MB`;
  if (fchip) fchip.innerHTML = `<div class="file-chip"><div class="ic">📄</div>
    <div><b>${f.name}</b><small>${kb}</small></div>
    <span class="x" style="cursor:pointer" onclick="window.clearOtFile()">✕</span></div>`;
};
window.clearOtFile = () => {
  state._otFile = null; const fi = $('#ot_file'); if (fi) fi.value = '';
  $('#ot_filechip').innerHTML = `<button class="btn btn-ghost" style="width:100%;justify-content:center" onclick="document.getElementById('ot_file').click()">📎 เลือกไฟล์แนบ หรือลากไฟล์มาวางที่นี่</button>`;
};

window.submitLeave = async () => {
  const typeLabel = $('#lv_type').value;
  const unit = $('#lv_unit').value;
  const start_date = $('#lv_start').value, end_date = $('#lv_end').value;
  const reason = $('#lv_reason').value.trim();
  if (!start_date || !end_date) return toast('กรุณาเลือกวันที่ลา', 'err');
  if (!reason) return toast('กรุณาระบุเหตุผลในการลา', 'err');

  // คำนวณจำนวน
  let days = 0, hours = 0, start_time = null, end_time = null;
  if (unit === 'hour') {
    start_time = $('#lv_htime_start').value; end_time = $('#lv_htime_end').value;
    hours = Number($('#lv_hours').value) || 0;
    if (!hours) return toast('กรุณาระบุเวลาลาให้ถูกต้อง', 'err');
  } else if (unit === 'halfday') {
    days = 0.5;
  } else {
    const d = (new Date(end_date) - new Date(start_date)) / 86400000 + 1;
    days = isNaN(d) || d < 1 ? 1 : d;
  }

  const btnPayload = {
    typeLabel, leaveEnum: LEAVE_TYPE_ENUM[typeLabel] || 'OTHER', unit,
    start_date, end_date, start_time, end_time, hours, days, reason, file: state._leaveFile,
  };
  toast('กำลังบันทึก...', '', 1500);
  const res = await Data.submitLeave(btnPayload);
  if (!res.ok) return toast('บันทึกไม่สำเร็จ: ' + (res.error || ''), 'err', 4000);

  closeModal();
  state.leaves = await Data.leaves();   // รีโหลดประวัติ
  state.leaveTab = 'history';
  renderLeave();
  toast('ส่งคำขอลาเรียบร้อย • รอแผนกตรวจสอบ', 'ok', 3500);
};

/* ---- PAYROLL -------------------------------------------------------------- */
function renderPayroll() {
  if (!state.payrollMonthly) state.payrollMonthly = {};   // { emp_code: {ตัวแปรรายเดือน} }
  const active = state.employees.filter(e => e.status !== 'RESIGNED');
  const kw = (state.payrollSearch || '').trim().toLowerCase();
  let grand = 0;
  const filtered = state.employees.filter(e => {
    if (!kw) return true;
    return `${e.emp_code} ${e.first_name} ${e.last_name} ${e.department_name}`.toLowerCase().includes(kw);
  });
  const PAGE = 6;   // เงินเดือน: 6 คน/หน้า
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  if (!state.payrollPage || state.payrollPage > totalPages) state.payrollPage = 1;
  const pg = state.payrollPage;
  const startIdx = (pg - 1) * PAGE;
  const rows = filtered.map((e, i) => {
    const monthly = state.payrollMonthly[e.emp_code];
    const p = Data.calcPayroll(e, monthly);
    if (e.status !== 'RESIGNED') grand += p.net;
    if (i < startIdx || i >= startIdx + PAGE) return '';   // แสดงเฉพาะหน้านี้ — ข้ามก่อนสร้าง HTML/avatar
    const done = !!monthly || e.status !== 'RESIGNED';
    const avColor = i % 2 === 0 ? '#DC2626' : '#111827';   // สลับ แดง/ดำ เท่านั้น
    return `<tr>
      <td><b>${e.emp_code}</b></td>
      <td><div class="emp-cell"><img src="${avatar(e.first_name, 40, avColor)}"/><div><b style="font-size:18px;font-weight:600;color:#111827;line-height:1.3">${e.first_name} ${e.last_name}</b></div></div></td>
      <td>${e.position_name || '-'}</td>
      <td class="t-num">${baht(p.totalIncome)}</td>
      <td class="t-num">${baht(p.totalDeduct)}</td>
      <td class="t-num" style="text-align:center;vertical-align:middle;width:140px;white-space:nowrap"><span style="color:#16a34a;font-size:16px;font-weight:700">${formatMoney(p.net)}</span></td>
      <td>${payrollStatusBadge(monthly, done)}</td>
      <td style="text-align:center;vertical-align:middle;width:120px;min-width:120px"><div style="display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:nowrap">
        <button class="pay-act edit" data-payedit="${e.emp_code}" title="แก้ไข">✏️</button>
        <button class="pay-act del" data-paydel="${e.emp_code}" title="ลบข้อมูลเงินเดือนรอบนี้">🗑</button>
      </div></td>
    </tr>`;
  }).join('');
  const imported = Object.keys(state.payrollMonthly).length;
  $('#view').innerHTML = `
    <div class="lv-banner mb" style="flex-wrap:wrap;gap:14px">
      <div class="lv-banner-ic">👛</div>
      <div style="flex:1;min-width:180px">
        <h2 style="font-size:21px;font-weight:800;margin:0">เงินเดือน</h2>
        <p class="muted" style="margin:1px 0 0;font-size:12.5px">จัดการข้อมูลเงินเดือนของพนักงานในระบบ</p>
      </div>
      <div style="display:flex;gap:9px;flex-wrap:wrap">
        <input type="file" id="payImportFile" accept=".xlsx,.xls,.csv" style="display:none" onchange="window.importPayrollExcel(this)"/>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('payImportFile').click()">📥 นำเข้า Excel</button>
        <button class="btn btn-ghost btn-sm" onclick="window.exportPayroll()">📤 Export</button>
        <button class="btn btn-primary btn-sm" onclick="window.recalcPayroll()">+ คำนวณเงินเดือน</button>
        <button class="btn btn-sm" style="background:#7c3aed;color:#fff;border:none" onclick="window.confirmPayroll()">✅ ยืนยันเงินเดือน</button>
      </div>
    </div>
    <div class="kpi-grid mb payroll-compact-kpi pay-xtra">
      ${empKpi('👥','red','พนักงานทั้งหมด', num(state.employees.length) + ' คน')}
      ${empKpi('📄','green','นำเข้ารายเดือน', num(imported) + ' คน')}
      ${empKpi('🕒','amber','ดึงจากพนักงาน', num(active.length - imported < 0 ? 0 : active.length - imported) + ' คน')}
      ${empKpi('💰','red','เงินเดือนรวม', baht(grand) + ' บาท')}
    </div>
    <div class="card mb">
      <div class="card-pad" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-top:14px;padding-bottom:14px">
        <select class="input" style="width:auto;height:44px"><option>พฤษภาคม</option><option>เมษายน</option><option>มีนาคม</option></select>
        <select class="input" style="width:auto;height:44px"><option>2567</option><option>2566</option></select>
        <input class="input" id="payrollSearchBox" style="width:220px;height:44px" placeholder="🔍 ค้นหาชื่อ, รหัสพนักงาน, แผนก" value="${state.payrollSearch || ''}"/>
      </div>
    </div>
    <div class="card payroll-compact-table pay-xtra">
      <div class="tbl-wrap fit-table-wrap"><table class="emp-table">
        <thead><tr><th>รหัสพนักงาน</th><th>พนักงาน</th><th>ตำแหน่ง</th><th class="t-num">รายรับรวม</th><th class="t-num">หักรวม</th><th class="t-num">รับสุทธิ</th><th>สถานะ</th><th style="text-align:center">จัดการ</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      ${pager(pg, totalPages)}
    </div>`;
  $('#view').classList.add('hr-page-no-scroll', 'payroll-no-scroll');
  $$('#view .pager [data-page]').forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.page;
    if (v === 'prev') state.payrollPage = Math.max(1, pg - 1);
    else if (v === 'next') state.payrollPage = Math.min(totalPages, pg + 1);
    else state.payrollPage = Number(v);
    renderPayroll();
  }));
  $$('[data-payedit]').forEach(b => b.addEventListener('click', () => payrollEditForm(b.dataset.payedit)));
  $$('[data-paydel]').forEach(b => b.addEventListener('click', () => payrollDelete(b.dataset.paydel)));
  const psb = $('#payrollSearchBox');
  if (psb) {
    const run = debounce(() => {
      renderPayroll();
      const box = $('#payrollSearchBox');
      if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); }
    }, 180);
    psb.addEventListener('input', e => { state.payrollSearch = e.target.value; run(); });
  }
}

/* นำเข้า Excel เงินเดือนรายเดือน: อ่านรหัส -> ดึงพนักงาน -> รวม -> คำนวณสุทธิ */
window.importPayrollExcel = async (input) => {
  const f = input.files && input.files[0]; if (!f) return;
  try {
    const rows = await readSheet(f);
    const built = Data.buildPayrollFromImport(rows, state.employees);
    if (!built.length) { toast('ไม่พบรหัสพนักงานที่ตรงกับระบบ', 'err', 3500); input.value = ''; return; }
    built.forEach(b => { state.payrollMonthly[b.emp.emp_code] = b.monthly; });
    input.value = '';
    renderPayroll();
    toast(`นำเข้าเงินเดือน ${built.length} รายการ • เชื่อมด้วยรหัสพนักงานสำเร็จ`, 'ok', 3500);
  } catch (e) { toast('อ่านไฟล์ไม่สำเร็จ: ' + e.message, 'err', 4000); input.value = ''; }
};
window.recalcPayroll = () => {
  ensurePayrollState();
  state.payrollState.calculated = true;       // ผ่านขั้น "คำนวณ" แล้ว (เปิดให้ยืนยันได้)
  _savePayrollState();
  renderPayroll();
  toast('คำนวณเงินเดือนใหม่จากข้อมูลพนักงานเรียบร้อย', 'ok');
};
/* ===== ยืนยันเงินเดือน — lifecycle: 🟡 นำเข้า / 🔵 คำนวณ / 🟣 ยืนยัน / 🟢 จ่าย =====
 * SAFE: ไม่แตะตัวเลข/Import/Export/Schema/Supabase — เก็บสถานะใน localStorage('nj_payroll_state')
 * สถานะเป็นระดับ "งวด" (ทั้งเดือน) เพราะตัวเลือกเดือน/ปีในหน้าเดิมยังไม่ผูกกับ state
 */
function ensurePayrollState() {
  if (!state.payrollState) {
    let s = null;
    try { const x = localStorage.getItem('nj_payroll_state'); if (x) s = JSON.parse(x); } catch (_) {}
    state.payrollState = (s && typeof s === 'object') ? s : { calculated: false, status: 'NONE' };
  }
}
function _savePayrollState() { try { localStorage.setItem('nj_payroll_state', JSON.stringify(state.payrollState)); } catch (_) {} if (window.NJ && NJ.cloudSaveSetting) NJ.cloudSaveSetting('payroll_state', state.payrollState); }
function payrollIsConfirmed() { ensurePayrollState(); return state.payrollState.status === 'CONFIRMED' || state.payrollState.status === 'PAID'; }
// Badge ต่อแถว: imported->🟡 นำเข้าแล้ว / computed->🔵 คำนวณแล้ว / ยืนยัน->🟣 / จ่าย->🟢 (รอคำนวณคงเดิม)
function payrollStatusBadge(monthly, done) {
  ensurePayrollState();
  const st = state.payrollState.status;
  if (!done) return '<span class="badge amber">● รอคำนวณ</span>';
  if (st === 'PAID') return '<span class="badge green">🟢 จ่ายแล้ว</span>';
  if (st === 'CONFIRMED') return '<span class="badge" style="background:#ede9fe;color:#7c3aed">🟣 ยืนยันแล้ว</span>';
  if (monthly) return '<span class="badge amber">🟡 นำเข้าแล้ว</span>';
  return '<span class="badge" style="background:#dbeafe;color:#2563eb">🔵 คำนวณแล้ว</span>';
}
window.confirmPayroll = () => {
  ensurePayrollState();
  const hasData = (state.employees || []).some(e => e.status !== 'RESIGNED') || Object.keys(state.payrollMonthly || {}).length > 0;
  if (!hasData) return toast('ยังไม่มีข้อมูลเงินเดือนให้ยืนยัน', 'err', 3500);
  if (!state.payrollState.calculated) return toast('กรุณาคำนวณเงินเดือนก่อน', 'err', 3500);
  if (payrollIsConfirmed()) return toast('เงินเดือนเดือนนี้ยืนยันแล้ว', 'ok', 3000);
  openModal('ยืนยันเงินเดือน', '<p>คุณต้องการยืนยันเงินเดือนของเดือนนี้หรือไม่?</p>',
    `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
     <button class="btn btn-primary" onclick="window.doConfirmPayroll()">ยืนยัน</button>`);
};
window.doConfirmPayroll = () => {
  ensurePayrollState();
  state.payrollState.status = 'CONFIRMED';
  state.payrollState.confirmed_at = Date.now();
  _savePayrollState();
  closeModal();
  toast('✅ ยืนยันเงินเดือนเรียบร้อย', 'ok');
  renderPayroll();
};
window.exportPayroll = () => {
  if (typeof XLSX === 'undefined') return toast('ไลบรารี Excel ยังไม่พร้อม', 'err');
  const data = state.employees.map(e => {
    const p = Data.calcPayroll(e, state.payrollMonthly[e.emp_code]);
    return { 'รหัสพนักงาน':e.emp_code, 'ชื่อ':e.first_name, 'นามสกุล':e.last_name,
      'แผนก':e.department_name, 'ตำแหน่ง':e.position_name,
      'รายรับรวม':p.totalIncome, 'หักรวม':p.totalDeduct, 'เงินสุทธิ':p.net };
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
  XLSX.writeFile(wb, 'payroll_export.xlsx');
  toast('ส่งออก Excel เรียบร้อย', 'ok');
};

function payrollDrawer(code) {
  const e = state.employees.find(x => x.emp_code === code);
  const p = Data.calcPayroll(e, (state.payrollMonthly || {})[code]);
  const incRows = Object.entries(p.income).map(([k, v]) => `<div class="detail-line"><span>${k}</span><b>${baht(v)}</b></div>`).join('');
  const dedRows = Object.entries(p.deduct).map(([k, v]) => `<div class="detail-line"><span>${k}</span><b>${baht(v)}</b></div>`).join('');
  openModal(`รายละเอียดเงินเดือน • ${e.emp_code}`, `
    <div style="display:flex;align-items:center;gap:13px;margin-bottom:18px">
      <img src="${avatar(e.first_name, 52)}" style="border-radius:50%"/>
      <div><b style="font-size:16px">${e.first_name} ${e.last_name}</b><div class="muted">${e.position_name || ''} • ${e.department_name || ''}</div>
      <div class="muted" style="font-size:12px">${e.bank_name || ''} ${e.bank_account || ''}</div></div>
    </div>
    <div class="detail-block"><div class="bar income">รายการรับ (เขียว)<span>${baht(p.totalIncome)}</span></div>${incRows}</div>
    <div class="detail-block"><div class="bar deduct">รายการหัก (เหลือง)<span>${baht(p.totalDeduct)}</span></div>${dedRows}</div>
    <div class="net-box"><b>เงินสุทธิ</b><span class="amt">${baht(p.net)} บาท</span></div>`,
    `<button class="btn btn-ghost" onclick="window.closeModal()">ปิด</button>
     <button class="btn btn-primary" onclick="window.closeModal();window.toast('บันทึกเรียบร้อย','ok')">บันทึก</button>`);
}

/* ✏️ แก้ไขตัวแปรเงินเดือนรายเดือน (กรอกเอง) + คำนวณสดทันที (Realtime) */
function payrollEditForm(code) {
  const e = state.employees.find(x => x.emp_code === code);
  if (!e) return;
  const cur = (state.payrollMonthly || {})[code] || {};
  const v = (k, dflt) => (cur[k] != null ? cur[k] : (dflt != null ? dflt : ''));
  const ro = (label, val) => `<div><label class="form-label">${label}</label><input class="input" value="${val}" disabled style="background:var(--gray)"/></div>`;
  const fld = (label, key, ph, dflt) => `<div><label class="form-label">${label}</label><input type="number" class="input" data-pf="${key}" value="${v(key, dflt)}" placeholder="${ph || '0'}"/></div>`;

  openModal(`แก้ไขเงินเดือน • ${e.first_name} ${e.last_name} (${e.emp_code})`, `
    <p class="muted mb">ข้อมูลพนักงานดึงจากทะเบียนอัตโนมัติ (แก้ที่หน้าพนักงาน) • ช่องด้านล่างกรอกเพิ่มได้ คำนวณสดทันที</p>
    <div class="pe-grid4">
      ${ro('รหัสพนักงาน', e.emp_code)}
      ${ro('ชื่อพนักงาน', `${e.first_name} ${e.last_name}`)}
      ${ro('แผนก', e.department_name || '-')}
      ${ro('ตำแหน่ง', e.position_name || '-')}
      ${ro('ฐานเงินเดือน', baht(e.base_salary))}
      ${ro('ค่าตำแหน่ง', baht(e.position_allow))}
      ${ro('ค่าโทรศัพท์', baht(e.phone_allow))}
      ${ro('ค่าเดินทาง', baht(e.travel_allow))}
      ${ro('ค่าน้ำมัน', baht(e.fuel_allow))}
      ${ro('ค่าเบี้ยขยัน (พนักงาน)', baht(e.diligence_allow))}
    </div>

    <div style="font-family:var(--font-display);font-weight:700;margin:16px 0 8px">ฐานการคำนวณ</div>
    <div class="pe-grid4">
      ${fld('ลากิจ (วัน)', 'ลากิจ', '0')}
      ${fld('ประกันสังคม %', 'ปกส.%', '5', 5)}
      ${fld('จำนวนวันในเดือน (เว้นว่าง=อัตโนมัติ)', 'วันในเดือน', 'อัตโนมัติ')}
    </div>

    <div style="font-family:var(--font-display);font-weight:700;color:var(--green);margin:16px 0 8px">รายการรับ (กรอกเอง)</div>
    <div class="pe-grid4">
      ${fld('ค่ากะ (บาท/วัน)', 'ค่ากะ', '0')}
      ${fld('ค่าล่วงเวลา (OT)', 'ค่าล่วงเวลา', '0')}
      ${fld('โบนัส', 'โบนัส', '0')}
      ${fld('ค่าคอมมิชชั่น', 'ค่าคอมมิชชั่น', '0')}
      ${fld('ค่าอื่นๆ', 'ค่าอื่นๆ', '0')}
      ${fld('ค่าเบี้ยขยัน (แก้ไขรายเดือน)', 'ค่าเบี้ยขยัน', 'ใช้ค่าพนักงาน')}
    </div>

    <div style="font-family:var(--font-display);font-weight:700;color:var(--red);margin:16px 0 8px">รายการหัก (กรอกเอง)</div>
    <div class="pe-grid4">
      ${fld('หักกยศ.', 'หักกยศ.', '0')}
      ${fld('หักอื่นๆ', 'หักอื่นๆ', '0')}
    </div>

    <div id="peLive" style="margin-top:16px;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--gray)"></div>`,
    `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
     <button class="btn btn-primary" onclick="window.savePayrollEdit('${code}')">บันทึก</button>`,
    'employee-modal');

  const line = (l, val, c) => `<div style="display:flex;justify-content:space-between;font-size:13px;color:${c || 'var(--txt-2)'}"><span>${l}</span><b>${val}</b></div>`;
  const live = () => {
    const p = Data.calcPayroll(e, readPayrollForm());
    const box = $('#peLive');
    if (!box) return;
    box.innerHTML =
      line(`ค่ากะรวม (${num(p.meta.shiftRate)}฿ × ${p.meta.workDays} วันทำงาน)`, baht(p.income['ค่ากะ'])) +
      line(`หักลากิจ (${p.meta.personalLeaveDays} วัน × ${baht(p.meta.dailySalary)})`, baht(p.deduct['หักลากิจ'])) +
      line(`ประกันสังคม (${num(p.meta.ssoPercent)}% สูงสุด 750)`, baht(p.deduct['หักปกส.5%'])) +
      `<hr style="border:none;border-top:1px solid var(--line);margin:9px 0"/>` +
      line('รายรับรวม', baht(p.totalIncome), 'var(--green)') +
      line('รายการหักรวม', baht(p.totalDeduct), 'var(--red)') +
      `<div style="display:flex;justify-content:space-between;font-size:17px;margin-top:6px"><b>เงินสุทธิ</b><b>${baht(p.net)} บาท</b></div>`;
  };
  $$('#modal [data-pf]').forEach(inp => inp.addEventListener('input', live));
  live();
}

// อ่านค่าจากฟอร์มแก้ไขเงินเดือน -> object ตัวแปรรายเดือน (เก็บเฉพาะช่องที่กรอก)
function readPayrollForm() {
  const monthly = {};
  $$('#modal [data-pf]').forEach(inp => {
    const raw = (inp.value || '').trim();
    if (raw !== '') monthly[inp.dataset.pf] = Number(raw) || 0;
  });
  return monthly;
}

window.savePayrollEdit = (code) => {
  if (!state.payrollMonthly) state.payrollMonthly = {};
  state.payrollMonthly[code] = readPayrollForm();
  closeModal();
  renderPayroll();
  toast('บันทึกเงินเดือนเรียบร้อย', 'ok');
};

/* 🗑 ลบข้อมูลเงินเดือนรอบนี้ (รีเซ็ตกลับไปดึงจากพนักงาน) — ไม่ลบพนักงาน */
function payrollDelete(code) {
  const e = state.employees.find(x => x.emp_code === code);
  if (!e) return;
  openModal('ยืนยันการลบข้อมูลเงินเดือน',
    `<p>ต้องการลบข้อมูลเงินเดือนรอบนี้ของ <b>${e.first_name} ${e.last_name}</b> (${e.emp_code}) ใช่หรือไม่?</p>
     <p class="muted" style="margin-top:8px">ระบบจะรีเซ็ตกลับไปดึงค่าจากข้อมูลพนักงานอัตโนมัติ — ไม่ลบตัวพนักงาน</p>`,
    `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
     <button class="btn btn-primary" onclick="window.confirmPayrollDelete('${code}')">ลบข้อมูล</button>`);
}
window.confirmPayrollDelete = (code) => {
  if (state.payrollMonthly && state.payrollMonthly[code]) delete state.payrollMonthly[code];
  closeModal();
  renderPayroll();
  toast('ลบข้อมูลเงินเดือนรอบนี้แล้ว (ดึงจากพนักงาน)', 'ok', 3500);
};

/* ---- PAYSLIP -------------------------------------------------------------- */
function renderPayslip() {
  const months = ['มกราคม 2567','กุมภาพันธ์ 2567','มีนาคม 2567','เมษายน 2567','พฤษภาคม 2567','มิถุนายน 2567','กรกฎาคม 2567','สิงหาคม 2567','กันยายน 2567','ตุลาคม 2567','พฤศจิกายน 2567','ธันวาคม 2567'];
  if (!state.selectedPayslipMonth) state.selectedPayslipMonth = months[new Date().getMonth()] || 'พฤษภาคม 2567';
  if (state.payslipSearched === undefined) state.payslipSearched = true;   // แสดงทั้งหมดเริ่มต้น
  const selectedMonth = state.selectedPayslipMonth;
  const selEmp = (state.payslipSearch || '').trim();           // emp_code จาก dropdown
  const kw = (state.payslipKw || '').trim().toLowerCase();     // คำค้นอิสระ (ชื่อ/รหัส/แผนก)

  // กรองพนักงาน: dropdown (เลือกคนเดียว) + คำค้นอิสระ (ชื่อ/รหัส/แผนก)
  const list = (state.employees || []).filter(e => {
    if (selEmp && e.emp_code !== selEmp) return false;
    if (!kw) return true;
    return `${e.first_name} ${e.last_name} ${e.emp_code} ${e.department_name || ''}`.toLowerCase().includes(kw);
  });

  const empOpts = '<option value="">— ทั้งหมด —</option>' +
    (state.employees || []).map(e => `<option value="${e.emp_code}" ${state.payslipSearch === e.emp_code ? 'selected' : ''}>${e.first_name} ${e.last_name} (${e.emp_code})</option>`).join('');
  const optMonths = months.map(m => `<option value="${m}" ${m === selectedMonth ? 'selected' : ''}>${m}</option>`).join('');

  const avColors = ['#DC2626', '#111827', '#9ca3af'];
  const PAGE = HR_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE));
  if (!state.payslipPage || state.payslipPage > totalPages) state.payslipPage = 1;
  const pg = state.payslipPage;
  const startIdx = (pg - 1) * PAGE;
  const pageRows = list.slice(startIdx, startIdx + PAGE);
  const rows = state.payslipSearched ? pageRows.map((e, i) => `<tr>
    <td><div class="emp-cell" style="gap:10px"><img src="${avatar(e.first_name, 40, avColors[(startIdx + i) % 3])}" style="width:38px;height:38px"/><b>${e.emp_code}</b></div></td>
    <td><b style="font-size:14.5px">${e.first_name} ${e.last_name}</b></td>
    <td>${psDeptBadge(e.department_name)}</td>
    <td>📅 ${selectedMonth}</td>
    <td style="white-space:nowrap">
      <button class="ps-dl" onclick="window.downloadPayslip('${e.emp_code}')">⬇ ดาวน์โหลดสลิปเงินเดือน</button>
    </td>
  </tr>`).join('') : '';

  $('#view').innerHTML = `
    <div class="emp-head mb">
      <div style="display:flex;align-items:center;gap:14px">
        <div class="ps-head-ic">⬇</div>
        <div>
          <h2 style="font-size:21px;font-weight:800;margin:0">สลิปเงินเดือน</h2>
          <p class="muted" style="margin:1px 0 0;font-size:12.5px">ดาวน์โหลดสลิปเงินเดือนของพนักงาน</p>
        </div>
      </div>
    </div>
    <div class="card mb">
      <div class="card-pad" style="display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:220px">
          <label class="form-label">👥 ข้อมูลพนักงาน</label>
          <select class="input" id="payslipEmp" style="height:46px">${empOpts}</select>
        </div>
        <div style="flex:1;min-width:200px">
          <label class="form-label">📅 เดือนที่คำนวณเงินเดือน</label>
          <select class="input" id="payslipMonth" style="height:46px">${optMonths}</select>
        </div>
        <div style="flex:1;min-width:220px">
          <label class="form-label">🔍 ค้นหา</label>
          <input class="input" id="payslipSearchBox" style="height:46px" placeholder="ค้นหาชื่อ, รหัสพนักงาน, แผนก" value="${state.payslipKw || ''}"/>
        </div>
        <button class="btn btn-ghost" style="height:46px" onclick="window.onPayslipSearch()">🔍 ค้นหา</button>
        <button class="btn btn-primary" style="height:46px" onclick="window.downloadAllPayslips()">⬇ ดาวน์โหลดทั้งหมด</button>
      </div>
    </div>
    <div class="card">
      <div class="tbl-wrap fit-table-wrap"><table class="emp-table">
        <thead><tr><th>รหัสพนักงาน</th><th>ชื่อ-นามสกุล</th><th>แผนก</th><th>เดือนที่คำนวณเงินเดือน</th><th>ดำเนินการ</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:30px" class="muted">กดค้นหาเพื่อแสดงรายการสลิปเงินเดือน</td></tr>'}</tbody>
      </table></div>
      ${state.payslipSearched ? pager(pg, totalPages) : ''}
    </div>
    <!-- ใบสลิปซ่อนไว้สำหรับสร้าง PDF รายคน -->
    <div id="payslipSheetHost" style="position:absolute;left:-9999px;top:0"></div>`;
  $('#view').classList.add('payslip-compact');
  $$('#view .pager [data-page]').forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.page;
    if (v === 'prev') state.payslipPage = Math.max(1, pg - 1);
    else if (v === 'next') state.payslipPage = Math.min(totalPages, pg + 1);
    else state.payslipPage = Number(v);
    renderPayslip();
  }));
  const psb = $('#payslipSearchBox');
  if (psb) psb.addEventListener('input', e => {
    state.payslipKw = e.target.value;
    state.payslipSearched = true;
    state.payslipPage = 1;
    renderPayslip();
    const box = $('#payslipSearchBox');
    if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); }
  });
}
// badge แผนกหน้าสลิป (สีตามสเปก red/black/orange/gray เท่านั้น)
function psDeptBadge(dept) {
  if (!dept) return '-';
  const d = dept.toUpperCase();
  let cls = 'dark';
  if (d.includes('MANAGER')) cls = 'red';
  else if (d.includes('CUSTOMER')) cls = 'orange';
  return `<span class="ps-badge ${cls}">${dept}</span>`;
}
window.onPayslipSearch = () => {
  const empSel = $('#payslipEmp'), mSel = $('#payslipMonth'), kwBox = $('#payslipSearchBox');
  state.payslipSearch = empSel ? empSel.value : '';
  if (mSel) state.selectedPayslipMonth = mSel.value;
  if (kwBox) state.payslipKw = kwBox.value;
  state.payslipSearched = true;
  state.payslipPage = 1;
  renderPayslip();
};

// คำนวณสลิปของพนักงานคนหนึ่ง ในเดือนที่เลือก
function payslipCalcFor(emp_code, month) {
  const e = state.employees.find(x => x.emp_code === emp_code);
  if (!e) return null;
  const months = ['มกราคม 2567','กุมภาพันธ์ 2567','มีนาคม 2567','เมษายน 2567','พฤษภาคม 2567','มิถุนายน 2567','กรกฎาคม 2567','สิงหาคม 2567','กันยายน 2567','ตุลาคม 2567','พฤศจิกายน 2567','ธันวาคม 2567'];
  const currentMonth = months[new Date().getMonth()] || 'พฤษภาคม 2567';
  const byMonth = state.payslipByMonth?.[emp_code]?.[month];
  let monthly, hasData;
  if (month === currentMonth) { monthly = state.payrollMonthly?.[emp_code] || {}; hasData = true; }
  else if (byMonth) { monthly = byMonth; hasData = true; }
  else { monthly = null; hasData = false; }
  const p = hasData ? Data.calcPayroll(e, monthly || {}) : zeroPayroll();
  return { e, p, hasData, month, monthIndex: months.indexOf(month) };
}

// สร้าง HTML ใบสลิปของพนักงานคนหนึ่ง (ดีไซน์ A4 corporate ตามตัวอย่าง)
function buildPayslipSheetHTML(emp_code, month) {
  const r = payslipCalcFor(emp_code, month);
  if (!r) return '';
  const { e, p, month: m, monthIndex } = r;
  // เดือนภาษาอังกฤษ
  const enMonths = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  const enMonth = `${enMonths[monthIndex] || ''} 2024`;
  const incEntries = Object.entries(p.income);
  const dedEntries = Object.entries(p.deduct);
  const incRows = incEntries.map(([k, v], i) => `<tr>
    <td class="num"><span class="badge-no g">${i + 1}</span></td><td class="lbl">${k}</td><td class="amt">${baht(v)}</td></tr>`).join('');
  const dedRows = dedEntries.map(([k, v], i) => `<tr>
    <td class="num"><span class="badge-no r">${i + 1}</span></td><td class="lbl">${k}</td><td class="amt">${baht(v)}</td></tr>`).join('');
  // QR code (ใช้บริการสร้าง QR จาก emp_code)
  const qrData = encodeURIComponent(`NJ-PAYSLIP|${e.emp_code}|${m}`);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`;

  return `<div class="slip ps2" id="payslipSheet">
    <!-- HEADER -->
    <div class="ps2-head">
      <div class="ps2-brand">
        <span class="ps2-logo">NJ</span>
        <div class="ps2-brandtxt"><div class="ps2-co"><b>N J</b> <span class="ps2-co-red">Logistics &amp; Fruits</span> <b>Co., Ltd.</b></div><div class="ps2-sys">HR SYSTEM <span class="ps2-line"></span></div></div>
      </div>
      <div class="ps2-title"><h2>สลิปเงินเดือน</h2><div class="ps2-epay">E-PAYSLIP</div></div>
      <div class="ps2-month">
        <div class="ps2-cal">📅</div>
        <div><div class="ps2-mlbl">ประจำเดือน</div><div class="ps2-mth">${m}</div><div class="ps2-men">${enMonth}</div></div>
      </div>
    </div>

    <!-- EMPLOYEE INFO -->
    <div class="ps2-emp">
      <img class="ps2-photo" src="${avatar(e.first_name, 110)}"/>
      <div class="ps2-info">
        <div class="ps2-kv"><span>รหัสพนักงาน</span><b>${e.emp_code}</b></div>
        <div class="ps2-kv"><span>ชื่อ-สกุล</span><b>${e.first_name} ${e.last_name}</b></div>
        <div class="ps2-kv"><span>ตำแหน่ง</span><b>${e.position_name || '-'}</b></div>
        <div class="ps2-kv"><span>แผนก</span><b>${e.department_name || '-'}</b></div>
      </div>
      <div class="ps2-info">
        <div class="ps2-kv"><span>เลขบัตรประชาชน</span><b>${e.national_id || '-'}</b></div>
        <div class="ps2-kv"><span>เบอร์โทรศัพท์</span><b>${e.phone || '-'}</b></div>
        <div class="ps2-kv"><span>วันเริ่มงาน</span><b>${thDate(e.start_date)}</b></div>
        <div class="ps2-kv"><span>ประเภทพนักงาน</span><b>${e.employee_category || 'พนักงานประจำ'}</b></div>
      </div>
      <div class="ps2-qr"><img src="${qrSrc}" alt="QR"/></div>
    </div>

    <!-- INCOME / DEDUCTION -->
    <div class="ps2-tables">
      <div class="ps2-tbl income">
        <div class="ps2-tblhead g"><span>💰 รายการรับ</span><span>จำนวนเงิน (บาท)</span></div>
        <table>${incRows}</table>
        <div class="ps2-tblsum g"><span>รวมรายการรับทั้งสิ้น</span><b>${baht(p.totalIncome)}</b></div>
      </div>
      <div class="ps2-tbl deduct">
        <div class="ps2-tblhead r"><span>📄 รายการหัก</span><span>จำนวนเงิน (บาท)</span></div>
        <table>${dedRows}</table>
        <div class="ps2-tblsum r"><span>รวมรายการหักทั้งสิ้น</span><b>${baht(p.totalDeduct)}</b></div>
      </div>
    </div>

    <!-- NET SALARY -->
    <div class="ps2-net">
      <div class="ps2-net-box">
        <div class="ps2-net-ic">👛</div>
        <div><div class="ps2-net-lbl">เงินเดือนสุทธิ</div><div class="ps2-net-en">NET SALARY</div></div>
        <div class="ps2-net-amt">${baht(p.net)}<span class="ps2-net-unit">บาท / THB</span></div>
      </div>
      <div class="ps2-net-box">
        <div class="ps2-net-ic">🪙</div>
        <div><div class="ps2-net-lbl2">เงินเดือนสุทธิ (ตัวอักษร)</div><div class="ps2-net-txt">${bahtText(p.net)}</div></div>
      </div>
      <div class="ps2-net-box col">
        <div class="ps2-net-row"><span class="ps2-net-ic2">📅</span><div><div class="ps2-pay-lbl">วันที่จ่ายเงิน</div><div class="ps2-pay-val">30 ${m}</div></div></div>
        <div class="ps2-net-row"><span class="ps2-net-ic2">🏦</span><div class="ps2-bankgrid"><div><div class="ps2-pay-lbl">ธนาคาร</div><div class="ps2-pay-val">${e.bank_name || '-'}</div></div><div><div class="ps2-pay-lbl">เลขบัญชี</div><div class="ps2-pay-val">${e.bank_account || '-'}</div></div></div></div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="ps2-footer">
      <div class="ps2-f-item"><span class="ps2-f-ic">📍</span><b>N J Logistics &amp; Fruits Co., Ltd.</b></div>
      <div class="ps2-f-item"><span class="ps2-f-ic">📍</span><span>62/165 Moo 10, T. Thung Sukhla,<br>A. Sriracha, Chonburi 20230</span></div>
      <div class="ps2-f-item"><span class="ps2-f-ic">📞</span><span><span style="opacity:.85">Mobile Office:</span><br><b>033-000870</b></span></div>
    </div>
  </div>`;
}
// พิมพ์/ดาวน์โหลดสลิปของพนักงานคนหนึ่ง (เปิดหน้าต่างพิมพ์ A4 หน้าเดียว)
function openPayslipPrintWindow(emp_code, month) {
  const html = buildPayslipSheetHTML(emp_code || state.payslipSearch, month || state.selectedPayslipMonth);
  if (!html) { toast('ไม่พบข้อมูลพนักงาน', 'err'); return null; }
  const css = document.querySelector('style') ? [...document.querySelectorAll('style')].map(s => s.textContent).join('\n') : '';
  const w = window.open('', '_blank', 'width=820,height=1100');
  if (!w) { toast('เบราว์เซอร์บล็อกหน้าต่างป๊อปอัพ — กรุณาอนุญาต popup', 'err', 4000); return null; }
  w.document.write(`<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">
    <title>สลิปเงินเดือน</title>
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>${css}${PAYSLIP_PRINT_CSS}</style></head><body>${html}</body></html>`);
  w.document.close();
  return w;
}
// CSS บีบสลิปให้พอดี A4 portrait หน้าเดียว (ใช้ร่วมกันทั้ง print เดี่ยว/ทั้งหมด)
const PAYSLIP_PRINT_CSS = `
  @page{ size:A4 portrait; margin:7mm; }
  html,body{ background:#fff; margin:0; padding:0; font-family:'Prompt',sans-serif; }
  .slip.ps2{ box-shadow:none !important; border:1px solid #e5e7eb; width:196mm; max-width:196mm; margin:0 auto; }
  /* บีบทุกส่วนให้กระชับ */
  .ps2-head{ padding:12px 18px !important; }
  .ps2-logo{ width:42px !important; height:42px !important; font-size:17px !important; }
  .ps2-co{ font-size:15px !important; }
  .ps2-sys{ font-size:10px !important; letter-spacing:2px !important; }
  .ps2-title h2{ font-size:22px !important; }
  .ps2-epay{ font-size:13px !important; }
  .ps2-month{ padding:8px 16px !important; }
  .ps2-cal{ font-size:20px !important; }
  .ps2-mth{ font-size:17px !important; }
  .ps2-men{ font-size:10px !important; }
  .ps2-mlbl{ font-size:11px !important; }
  .ps2-emp{ margin:0 18px !important; padding:12px 16px !important; gap:16px !important; }
  .ps2-photo{ width:74px !important; height:74px !important; }
  .ps2-kv{ font-size:12px !important; }
  .ps2-kv span{ width:108px !important; }
  .ps2-qr img{ width:84px !important; height:84px !important; }
  .ps2-tables{ padding:14px 18px !important; gap:16px !important; }
  .ps2-tblhead{ padding:9px 14px !important; font-size:13px !important; }
  .ps2-tbl td{ padding:5px 12px !important; font-size:12px !important; }
  .badge-no{ width:20px !important; height:20px !important; font-size:11px !important; }
  .ps2-tblsum{ padding:9px 14px !important; font-size:13px !important; }
  .ps2-net{ padding:0 18px 14px !important; gap:12px !important; }
  .ps2-net-box{ padding:12px 14px !important; gap:10px !important; }
  .ps2-net-ic{ font-size:20px !important; }
  .ps2-net-amt{ font-size:22px !important; }
  .ps2-net-lbl{ font-size:13px !important; }
  .ps2-net-txt{ font-size:13px !important; }
  .ps2-pay-val{ font-size:12px !important; }
  .ps2-footer{ height:56px !important; padding:0 18px !important; font-size:12px !important; }
  .ps2-f-ic{ font-size:15px !important; }
  @media print{ .slip.ps2{ page-break-inside:avoid; break-inside:avoid; } }
`;
window.printPayslip = (emp_code) => {
  const w = openPayslipPrintWindow(emp_code);
  if (w) { w.focus(); setTimeout(() => { w.print(); }, 500); }
};
window.downloadPayslip = (emp_code) => {
  if (!payrollIsConfirmed()) return toast('ออกสลิปได้เฉพาะเงินเดือนที่ "ยืนยันแล้ว" หรือ "จ่ายแล้ว" — กรุณายืนยันเงินเดือนก่อน', 'err', 4500);
  const w = openPayslipPrintWindow(emp_code);
  if (w) {
    toast('เลือก "บันทึกเป็น PDF" ในกล่องพิมพ์เพื่อดาวน์โหลด', 'ok', 4000);
    w.focus();
    setTimeout(() => { w.print(); }, 600);
  }
};
// ส่งสลิปไปอีเมล (รอบนี้ยังไม่เชื่อมระบบส่งจริง)
window.emailPayslip = (emp_code) => {
  const e = state.employees.find(x => x.emp_code === emp_code);
  if (!e || !e.email) return toast('ไม่พบอีเมลพนักงาน', 'err');
  toast('เตรียมส่งสลิปไปยังอีเมล', 'ok');
};
// ดาวน์โหลดทั้งหมด: รวมทุกพนักงานในหน้าเป็นเอกสารพิมพ์เดียว (สลิปละ 1 หน้า A4)
window.downloadAllPayslips = () => {
  const kw = (state.payslipSearch || '').trim().toLowerCase();
  const list = (state.employees || []).filter(e => !state.payslipSearch || e.emp_code === state.payslipSearch);
  const targets = state.payslipSearch ? list : (state.employees || []);
  if (!targets.length) return toast('ไม่มีพนักงานให้ดาวน์โหลด', 'err');
  const sheets = targets.map(e => buildPayslipSheetHTML(e.emp_code, state.selectedPayslipMonth)).join('<div style="page-break-after:always"></div>');
  const css = document.querySelector('style') ? [...document.querySelectorAll('style')].map(s => s.textContent).join('\n') : '';
  const w = window.open('', '_blank', 'width=820,height=1100');
  if (!w) { toast('เบราว์เซอร์บล็อกหน้าต่างป๊อปอัพ — กรุณาอนุญาต popup', 'err', 4000); return; }
  w.document.write(`<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">
    <title>สลิปเงินเดือนทั้งหมด</title>
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>${css}${PAYSLIP_PRINT_CSS}
      .slip.ps2{ margin-bottom:8mm !important; }
      @media print{ .slip.ps2{ page-break-after:always; } }
    </style></head><body>${sheets}</body></html>`);
  w.document.close();
  toast('เลือก "บันทึกเป็น PDF" เพื่อดาวน์โหลดทั้งหมด', 'ok', 4000);
  w.focus();
  setTimeout(() => { w.print(); }, 700);
};
window.onPayslipMonth = () => {
  const sel = $('#payslipMonth');
  if (sel) state.selectedPayslipMonth = sel.value;
  renderPayslip();
};
// สลิปเปล่า (ทุกช่อง 0) เมื่อไม่มีข้อมูลเดือนนั้น
function zeroPayroll() {
  const income = {}; NJ.Data.INCOME_KEYS.forEach(k => income[k] = 0);
  const deduct = {}; NJ.Data.DEDUCT_KEYS.forEach(k => deduct[k] = 0);
  return { income, deduct, totalIncome: 0, totalDeduct: 0, net: 0 };
}

/* ---- SOCIAL SECURITY ------------------------------------------------------ */
function renderSSO() {
  // เลข สปส. คงที่ต่อพนักงาน (อิงจาก emp_code ไม่สุ่มใหม่ทุกครั้ง)
  const ssoNo = (code) => {
    let h = 0; for (const c of (code || '')) h = (h * 31 + c.charCodeAt(0)) % 100000000;
    const a = String(1000 + (h % 9000)), b = String(10000 + (h % 90000));
    return `1-${a}-${b}`;
  };
  const avColors = ['#DC2626', '#111827', '#64748B'];
  const kw = (state.ssoKw || '').trim().toLowerCase();
  const PAGE = 6;   // ประกันสังคม: 6 คน/หน้า
  const all = (state.employees || []).filter(e => {
    if (!kw) return true;
    return `${e.first_name} ${e.last_name} ${e.emp_code} ${e.department_name || ''}`.toLowerCase().includes(kw);
  });
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE));
  if (!state.ssoPage || state.ssoPage > totalPages) state.ssoPage = 1;
  const page = state.ssoPage;
  const startIdx = (page - 1) * PAGE;
  const pageRows = all.slice(startIdx, startIdx + PAGE);
  $('#view').innerHTML = `
    <div class="lv-banner mb">
      <div class="lv-banner-ic">🛡️</div>
      <div><h2 style="margin:0;font-size:21px;font-weight:800">ประกันสังคม</h2>
        <p class="muted" style="margin:1px 0 0;font-size:12.5px">จัดการข้อมูลผู้ประกันตนและรายการส่งเงินสมทบ</p></div>
    </div>
    <div class="kpi-grid mb">
      ${empKpi('👥','red','ผู้ประกันตน','118 คน')}
      ${empKpi('💰','amber','ยอดส่ง สปส.','90,000 บาท')}
      ${empKpi('📥','blue','รอแจ้งเข้า','2 คน')}
      ${empKpi('📤','red','รอแจ้งออก','1 คน')}
    </div>
    <div class="card">
      <div class="card-head" style="flex-wrap:wrap;gap:10px"><h3>👥 รายการผู้ประกันตน</h3>
        <div style="display:flex;gap:9px;flex-wrap:wrap;align-items:center">
          <input class="input" id="ssoSearchBox" style="width:260px;height:38px" placeholder="🔍 ค้นหาชื่อ, รหัสพนักงาน, แผนก" value="${state.ssoKw || ''}"/>
          <button class="btn btn-ghost btn-sm">📥 แจ้งเข้า</button>
          <button class="btn btn-ghost btn-sm">📤 แจ้งออก</button>
          <button class="btn btn-primary btn-sm" onclick="window.toast('ส่งออกรายงาน สปส. (Excel)','ok')">📄 รายงาน สปส.</button>
        </div></div>
      <div class="tbl-wrap fit-table-wrap sso-table-wrap"><table class="emp-table sso-table">
        <thead><tr><th style="width:100px;text-align:center">รหัสพนักงาน</th><th>พนักงาน</th><th>เลข สปส.</th><th class="t-num">เงินสมทบ</th><th>วันแจ้งเข้า</th><th>สถานะ</th></tr></thead>
        <tbody>${pageRows.map((e, i) => `<tr>
          <td style="text-align:center;font-weight:700;font-size:15px;color:#111827">${e.emp_code || '-'}</td>
          <td><div class="emp-cell"><img src="${avatar(e.first_name, 40, avColors[(startIdx + i) % 3])}"/><div><b style="font-size:18px;font-weight:600;color:#111827;line-height:1.3">${e.first_name} ${e.last_name}</b></div></div></td>
          <td>${ssoNo(e.emp_code)}</td>
          <td class="t-num">750.00</td><td>01/01/2566</td><td><span class="badge green">● ปกติ</span></td></tr>`).join('')}</tbody>
      </table></div>
      ${pager(page, totalPages)}
    </div>`;
  $('#view').classList.add('hr-page-no-scroll', 'sso-no-scroll', 'sso-compact');
  $$('#view .pager [data-page]').forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.page;
    if (v === 'prev') state.ssoPage = Math.max(1, page - 1);
    else if (v === 'next') state.ssoPage = Math.min(totalPages, page + 1);
    else state.ssoPage = Number(v);
    renderSSO();
  }));
  const ssb = $('#ssoSearchBox');
  if (ssb) ssb.addEventListener('input', e => {
    state.ssoKw = e.target.value;
    state.ssoPage = 1;
    renderSSO();
    const box = $('#ssoSearchBox');
    if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); }
  });
}

/* ---- REPORTS -------------------------------------------------------------- */
/* ============================================================================
 * REPORTS — ผูกข้อมูลจริงจาก Supabase (SAFE PATCH: เฉพาะหน้ารายงาน)
 * - LIVE: ดึงข้อมูลจริงจาก Supabase ทุกครั้งที่โหลด/Export
 * - DEMO: ใช้ข้อมูลตัวอย่างในเครื่อง (กันหน้าพัง เมื่อยังไม่เชื่อม Supabase)
 * - Filter วันที่/เดือน/ปี/แผนก/พนักงาน + Realtime + Export Excel/PDF
 * - ไม่มี Mock Data / ไม่มีเลข Fix (สปส. ใช้สูตรจริงจากฐานเงินเดือน)
 * ========================================================================== */
const RPT_DEFS = [
  { key:'employees',  ic:'👥', title:'รายงานพนักงาน',     desc:'ข้อมูลพนักงานทั้งหมด',  tone:'rt-purple', file:'รายงานพนักงาน',     dated:false },
  { key:'attendance', ic:'📷', title:'รายงานการลงเวลา',   desc:'สรุปการเข้า-ออกงาน',     tone:'rt-blue',   file:'รายงานการลงเวลา',   dated:true  },
  { key:'ot',         ic:'🕒', title:'รายงาน OT',          desc:'สรุปชั่วโมง OT',         tone:'rt-amber',  file:'รายงาน_OT',         dated:true  },
  { key:'leave',      ic:'📅', title:'รายงานการลา',        desc:'สรุปวันลาพนักงาน',       tone:'rt-green',  file:'รายงานการลา',       dated:true  },
  { key:'payroll',    ic:'💰', title:'รายงานเงินเดือน',    desc:'สรุปการจ่ายเงินเดือน',   tone:'rt-orange', file:'รายงานเงินเดือน',   dated:true  },
  { key:'sso',        ic:'🛡️', title:'รายงานประกันสังคม',  desc:'สรุปเงินสมทบ สปส.',      tone:'rt-sky',    file:'รายงานประกันสังคม', dated:true  },
];
const rptDef = (k) => RPT_DEFS.find(r => r.key === k);

function rptInitFilter() {
  if (!state.reportFilter) {
    const n = new Date();
    state.reportFilter = { start:'', end:'', month:n.getMonth() + 1, year:n.getFullYear(), dept:'', emp:'' };
  }
  return state.reportFilter;
}
// ช่วงวันที่ (YYYY-MM-DD): ถ้ากรอก start+end ใช้เลย ไม่งั้นใช้เดือน/ปีปัจจุบันของ filter
function rptRange(f) {
  if (f.start && f.end) return { from:f.start, to:f.end };
  const y = Number(f.year), m = Number(f.month);
  const p2 = (x) => String(x).padStart(2, '0');
  const last = new Date(y, m, 0).getDate();
  return { from:`${y}-${p2(m)}-01`, to:`${y}-${p2(m)}-${p2(last)}` };
}

/* ---- helpers แปลงค่าให้อ่านง่าย (เฉพาะรายงาน) ---------------------------- */
const rptName = (e) => { if (!e) return '-'; const n = `${e.first_name || ''} ${e.last_name || ''}`.trim(); return n || e.emp_code || '-'; };
function rptTime(v) {
  if (!v) return '-';
  const s = String(v);
  if (s.includes('T') || s.includes(' ')) { const d = new Date(s); if (!isNaN(d)) return d.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' }); }
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5);
  return s;
}
function rptDateTH(v) {
  if (!v) return '-';
  const s = String(v);
  if (s.includes('T') || /^\d{4}-\d{2}-\d{2}$/.test(s)) { const d = new Date(s); if (!isNaN(d)) return d.toLocaleDateString('th-TH'); }
  return s;
}
function rptStatusTH(s) {
  const x = String(s || '').toUpperCase();
  if (x.includes('APPROVED')) return 'อนุมัติแล้ว';
  if (x.includes('REJECT')) return 'ไม่อนุมัติ';
  if (x.includes('PENDING')) return 'รออนุมัติ';
  return s || '-';
}
const rptAttStatus = (s) => ({ NORMAL:'ปกติ', LATE:'มาสาย', ABSENT:'ขาดงาน', OT:'OT', LEAVE:'ลา' }[String(s || '').toUpperCase()] || (s || '-'));
const rptEmpStatus = (s) => ({ ACTIVE:'ทำงาน', RESIGNED:'ลาออก', SUSPENDED:'พักงาน' }[String(s || '').toUpperCase()] || (s || '-'));
const rptLeaveType = (s) => ({ SICK:'ลาป่วย', PERSONAL:'ลากิจ', VACATION:'ลาพักร้อน', MATERNITY:'ลาคลอด', ORDINATION:'ลาบวช', ANNUAL:'ลาพักร้อน' }[String(s || '').toUpperCase()] || (s || '-'));

/* ---- ดึง + ประกอบข้อมูลรายงาน (async, ดึงจริงจาก Supabase ใน LIVE) ------- */
async function rptBuild(key) {
  rptInitFilter();
  const f = state.reportFilter;
  const sb = window.NJ && window.NJ.sb;
  const LIVE = !!((window.NJ_isLive && window.NJ_isLive()) && sb);
  const n0 = (v) => v == null ? 0 : Number(v) || 0;

  // พนักงาน (LIVE: ดึงสดจาก v_employee_full / DEMO: state)
  let emps;
  if (LIVE) { const { data, error } = await sb.from('v_employee_full').select('*').order('emp_code'); if (error) throw error; emps = data || []; }
  else emps = state.employees || [];
  const byId = {}, byCode = {};
  emps.forEach(e => { if (e.id != null) byId[e.id] = e; if (e.emp_code) byCode[e.emp_code] = e; });
  const empOf = (row) => row.employee_id != null ? (byId[row.employee_id] || byCode[row.employee_code] || {}) : (byCode[row.emp_code] || {});
  const matchEmp = (e) => (!f.dept || (e && e.department_name === f.dept)) && (!f.emp || (e && e.emp_code === f.emp));
  const { from, to } = rptRange(f);

  // 1) รายงานพนักงาน
  if (key === 'employees') {
    return emps.filter(matchEmp).map(e => ({
      'รหัสพนักงาน': e.emp_code || '-', 'ชื่อพนักงาน': rptName(e),
      'แผนก': e.department_name || '-', 'ตำแหน่ง': e.position_name || '-',
      'ฐานเงินเดือน': n0(e.base_salary), 'ค่าตำแหน่ง': n0(e.position_allow),
      'ค่าโทรศัพท์': n0(e.phone_allow), 'ค่าเดินทาง': n0(e.travel_allow), 'ค่าน้ำมัน': n0(e.fuel_allow),
      'ค่าเบี้ยขยัน': n0(e.diligence_allow), 'สถานะ': rptEmpStatus(e.status),
      'วันที่เริ่มงาน': e.start_date || '-', 'เบอร์โทร': e.phone || '-', 'อีเมล': e.email || '-',
    }));
  }

  // 2) รายงานลงเวลา
  if (key === 'attendance') {
    if (LIVE) {
      const { data, error } = await sb.from('attendance').select('*').gte('work_date', from).lte('work_date', to).order('work_date', { ascending:false });
      if (error) throw error;
      return (data || []).filter(a => matchEmp(byId[a.employee_id])).map(a => {
        const e = byId[a.employee_id] || {};
        return {
          'วันที่': a.work_date || '-', 'รหัสพนักงาน': e.emp_code || '-', 'ชื่อพนักงาน': rptName(e),
          'แผนก': e.department_name || '-', 'เวลาเข้างาน': rptTime(a.check_in), 'เวลาออกงาน': rptTime(a.check_out),
          'ชั่วโมงทำงาน': a.work_hours != null ? n0(a.work_hours) : '-', 'สถานะ': rptAttStatus(a.status),
          'มาสาย(นาที)': a.late_minutes != null ? n0(a.late_minutes) : '-', 'หมายเหตุ': a.note || '-',
        };
      });
    }
    const src = state.attendance || (window.NJ && window.NJ.DEMO && window.NJ.DEMO.attendance) || [];
    return src.map(a => ({
      'วันที่': a.date || a.work_date || '-', 'รหัสพนักงาน': a.emp_code || '-', 'ชื่อพนักงาน': rptName(byCode[a.emp_code]),
      'แผนก': (byCode[a.emp_code] || {}).department_name || '-', 'เวลาเข้างาน': rptTime(a.in || a.check_in), 'เวลาออกงาน': rptTime(a.out || a.check_out),
      'ชั่วโมงทำงาน': a.hours || a.work_hours || '-', 'สถานะ': rptAttStatus(a.status),
      'มาสาย(นาที)': '-', 'หมายเหตุ': a.place || '-',
    }));
  }

  // 3) รายงาน OT
  if (key === 'ot') {
    if (LIVE) {
      const { data, error } = await sb.from('ot_requests').select('*').gte('ot_date', from).lte('ot_date', to).order('ot_date', { ascending:false });
      if (error) throw error;
      return (data || []).filter(o => matchEmp(byId[o.employee_id])).map(o => {
        const e = byId[o.employee_id] || {}; const ap = byId[o.approver_id];
        return {
          'วันที่ OT': o.ot_date || '-', 'รหัสพนักงาน': e.emp_code || '-', 'ชื่อพนักงาน': rptName(e), 'แผนก': e.department_name || '-',
          'เวลาเริ่ม': rptTime(o.start_time), 'เวลาสิ้นสุด': rptTime(o.end_time),
          'จำนวนชั่วโมง': o.ot_hours != null ? n0(o.ot_hours) : '-', 'อัตรา OT': o.ot_rate != null ? n0(o.ot_rate) : '-',
          'ยอดเงิน OT': o.ot_amount != null ? n0(o.ot_amount) : '-', 'สถานะ': rptStatusTH(o.status), 'ผู้อนุมัติ': ap ? rptName(ap) : '-', 'หมายเหตุ': o.reason || '-',
        };
      });
    }
    return (state.ots || []).filter(o => matchEmp(byCode[o.emp_code])).map(o => {
      const e = byCode[o.emp_code] || {};
      return {
        'วันที่ OT': o.date || '-', 'รหัสพนักงาน': o.emp_code || '-', 'ชื่อพนักงาน': rptName(e), 'แผนก': e.department_name || '-',
        'เวลาเริ่ม': rptTime(o.start), 'เวลาสิ้นสุด': rptTime(o.end),
        'จำนวนชั่วโมง': o.hours != null ? n0(o.hours) : '-', 'อัตรา OT': '-', 'ยอดเงิน OT': '-',
        'สถานะ': rptStatusTH(o.status), 'ผู้อนุมัติ': '-', 'หมายเหตุ': o.reason || '-',
      };
    });
  }

  // 4) รายงานลางาน (กรองตามวันที่เริ่มลา)
  if (key === 'leave') {
    if (LIVE) {
      const { data, error } = await sb.from('leave_requests').select('*').gte('start_date', from).lte('start_date', to).order('created_at', { ascending:false });
      if (error) throw error;
      return (data || []).filter(l => matchEmp(byId[l.employee_id])).map(l => {
        const e = byId[l.employee_id] || {}; const ap = byId[l.approver_id];
        return {
          'วันที่ยื่น': rptDateTH(l.created_at), 'รหัสพนักงาน': e.emp_code || '-', 'ชื่อพนักงาน': rptName(e), 'แผนก': e.department_name || '-',
          'ประเภทการลา': rptLeaveType(l.leave_type), 'วันที่เริ่มลา': l.start_date || '-', 'วันที่สิ้นสุดลา': l.end_date || '-',
          'จำนวนวัน': l.total_days != null ? n0(l.total_days) : '-', 'เหตุผล': l.reason || '-',
          'สถานะ': rptStatusTH(l.status), 'ผู้อนุมัติ': ap ? rptName(ap) : '-',
        };
      });
    }
    return (state.leaves || []).filter(l => matchEmp(byCode[l.emp_code])).map(l => {
      const e = byCode[l.emp_code] || {};
      return {
        'วันที่ยื่น': l.when || '-', 'รหัสพนักงาน': l.emp_code || '-', 'ชื่อพนักงาน': rptName(e), 'แผนก': e.department_name || '-',
        'ประเภทการลา': l.label || rptLeaveType(l.type), 'วันที่เริ่มลา': l.start || '-', 'วันที่สิ้นสุดลา': l.end || '-',
        'จำนวนวัน': l.days != null ? n0(l.days) : '-', 'เหตุผล': l.reason || '-', 'สถานะ': rptStatusTH(l.status), 'ผู้อนุมัติ': '-',
      };
    });
  }

  // 5) รายงานเงินเดือน (ดึงจาก payroll_monthly เป็นหลัก -> payroll) + breakdown เต็ม
  if (key === 'payroll') {
    if (LIVE) {
      let rows = null;
      for (const t of ['payroll_monthly', 'payroll']) {
        const r = await sb.from(t).select('*').eq('period_year', Number(f.year)).eq('period_month', Number(f.month));
        if (!r.error) { rows = r.data || []; break; }
      }
      if (rows == null) throw new Error('อ่านตารางเงินเดือนไม่ได้');
      return rows.filter(p => matchEmp(empOf(p))).map(p => {
        const e = empOf(p);
        const otherIncome = n0(p.commission) + n0(p.other_income);
        const otherDeduct = n0(p.advance_deduct) + n0(p.late_deduct) + n0(p.other_leave_deduct) + n0(p.absent_deduct) + n0(p.suspend_deduct) + n0(p.other_deduct);
        const gross = p.total_income != null ? n0(p.total_income)
          : (n0(p.base_salary) + n0(p.position_allow) + n0(p.phone_allow) + n0(p.travel_allow) + n0(p.oil_allow) + n0(p.diligence) + n0(p.shift_allow) + n0(p.ot_amount) + n0(p.bonus) + otherIncome);
        const totalDeduct = p.total_deduct != null ? n0(p.total_deduct)
          : (n0(p.personal_leave_deduct) + n0(p.social_security) + n0(p.student_loan) + otherDeduct);
        return {
          'เดือน': p.period_month, 'ปี': p.period_year, 'รหัสพนักงาน': e.emp_code || p.employee_code || '-', 'ชื่อพนักงาน': rptName(e), 'แผนก': e.department_name || '-',
          'ฐานเงินเดือน': n0(p.base_salary), 'ค่าตำแหน่ง': n0(p.position_allow), 'ค่าโทรศัพท์': n0(p.phone_allow), 'ค่าเดินทาง': n0(p.travel_allow), 'ค่าน้ำมัน': n0(p.oil_allow),
          'ค่าเบี้ยขยัน': n0(p.diligence), 'ค่ากะ': n0(p.shift_allow), 'OT': n0(p.ot_amount), 'โบนัส': n0(p.bonus), 'รายรับอื่น': otherIncome, 'รายรับรวม': gross,
          'หักลากิจ': n0(p.personal_leave_deduct), 'ประกันสังคม': n0(p.social_security), 'กยศ.': n0(p.student_loan), 'หักอื่นๆ': otherDeduct, 'รวมหัก': totalDeduct,
          'เงินสุทธิ': p.net_pay != null ? n0(p.net_pay) : (gross - totalDeduct),
        };
      });
    }
    // DEMO: ไม่มีตาราง payroll -> ใช้ตัวคำนวณตามนโยบาย (เฉพาะโหมดทดลอง)
    const calc = window.NJ && window.NJ.Data && window.NJ.Data.calcPayroll;
    return emps.filter(matchEmp).map(e => {
      const p = calc ? calc(e, (state.payrollMonthly || {})[e.emp_code]) : null;
      const inc = p ? p.income : {}; const ded = p ? p.deduct : {};
      return {
        'เดือน': Number(f.month), 'ปี': Number(f.year), 'รหัสพนักงาน': e.emp_code || '-', 'ชื่อพนักงาน': rptName(e), 'แผนก': e.department_name || '-',
        'ฐานเงินเดือน': n0(inc['ฐานเงินเดือน']), 'ค่าตำแหน่ง': n0(inc['ค่าตำแหน่ง']), 'ค่าโทรศัพท์': n0(inc['ค่าโทรศัพท์']), 'ค่าเดินทาง': n0(inc['ค่าเดินทาง']), 'ค่าน้ำมัน': n0(inc['ค่าน้ำมัน']),
        'ค่าเบี้ยขยัน': n0(inc['ค่าเบี้ยขยัน']), 'ค่ากะ': n0(inc['ค่ากะ']), 'OT': n0(inc['ค่าล่วงเวลา']), 'โบนัส': n0(inc['โบนัส']), 'รายรับอื่น': n0(inc['ค่าคอมมิชชั่น']) + n0(inc['ค่าอื่นๆ']), 'รายรับรวม': p ? n0(p.totalIncome) : 0,
        'หักลากิจ': n0(ded['หักลากิจ']), 'ประกันสังคม': n0(ded['หักปกส.5%']), 'กยศ.': n0(ded['หักกยศ.']), 'หักอื่นๆ': n0(ded['หักอื่นๆ']), 'รวมหัก': p ? n0(p.totalDeduct) : 0,
        'เงินสุทธิ': p ? n0(p.net) : 0,
      };
    });
  }

  // 6) รายงานประกันสังคม (ดึงจาก payroll_monthly -> payroll; ไม่มีก็คำนวณจากฐานเงินเดือนจริง) + เปอร์เซ็นต์
  if (key === 'sso') {
    if (LIVE) {
      let rows = null;
      for (const t of ['payroll_monthly', 'payroll']) {
        const r = await sb.from(t).select('*').eq('period_year', Number(f.year)).eq('period_month', Number(f.month));
        if (!r.error) { rows = r.data || []; break; }
      }
      if (rows && rows.length) {
        return rows.filter(p => matchEmp(empOf(p))).map(p => {
          const e = empOf(p); const base = p.base_salary != null ? p.base_salary : e.base_salary;
          const pct = p.sso_percent != null ? n0(p.sso_percent) : 5;
          const erSso = Math.round(Math.min(n0(base) * pct / 100, 750));
          const empSso = p.social_security != null ? n0(p.social_security) : erSso;
          return {
            'เดือน': p.period_month, 'ปี': p.period_year, 'รหัสพนักงาน': e.emp_code || p.employee_code || '-', 'ชื่อพนักงาน': rptName(e), 'แผนก': e.department_name || '-',
            'ฐานเงินเดือน': n0(base), 'เปอร์เซ็นต์ ปกส.': pct, 'หัก ปกส. พนักงาน': empSso, 'สมทบนายจ้าง': erSso, 'ยอดรวม ปกส.': empSso + erSso,
          };
        });
      }
    }
    // ไม่มีข้อมูลเงินเดือนของเดือนนั้น -> คำนวณจากฐานเงินเดือนจริง (สูตร min(ฐาน × % / 100, 750))
    return emps.filter(matchEmp).map(e => {
      const mx = (state.payrollMonthly || {})[e.emp_code] || {};
      const pct = mx['ปกส.%'] != null ? n0(mx['ปกส.%']) : 5;
      const empSso = Math.round(Math.min(n0(e.base_salary) * pct / 100, 750));
      return {
        'เดือน': Number(f.month), 'ปี': Number(f.year), 'รหัสพนักงาน': e.emp_code || '-', 'ชื่อพนักงาน': rptName(e), 'แผนก': e.department_name || '-',
        'ฐานเงินเดือน': n0(e.base_salary), 'เปอร์เซ็นต์ ปกส.': pct, 'หัก ปกส. พนักงาน': empSso, 'สมทบนายจ้าง': empSso, 'ยอดรวม ปกส.': empSso * 2,
      };
    });
  }
  return [];
}

/* ---- ตาราง preview + ชื่อไฟล์ -------------------------------------------- */
// รูปแบบเงินกลาง: ทศนิยม 2 ตำแหน่งเสมอ (0 -> 0.00, 24468.9 -> 24,468.90)
function formatMoney(value) { return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function rptCell(v) { return typeof v === 'number' ? formatMoney(v) : (v == null ? '-' : String(v)); }
function rptTableHTML(rows, limit) {
  const cols = Object.keys(rows[0]);
  const th = cols.map(c => `<th style="text-align:left;padding:9px 12px;border-bottom:1px solid var(--line);white-space:nowrap;font-weight:700">${c}</th>`).join('');
  const tb = rows.slice(0, limit).map(r => `<tr>${cols.map(c => `<td style="padding:8px 12px;border-bottom:1px solid var(--gray-2);white-space:nowrap">${rptCell(r[c])}</td>`).join('')}</tr>`).join('');
  const more = rows.length > limit ? `<p class="muted mt" style="padding:0 12px">…แสดง ${limit} จาก ${rows.length} รายการ (ไฟล์ Excel/PDF จะได้ครบทุกรายการ)</p>` : '';
  return `<div class="tbl-wrap" style="max-height:420px;overflow:auto"><table class="rpt-table"><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table></div>${more}`;
}
function rptFileName(def) {
  return def.file;
}

/* ---- Realtime: refresh preview เมื่อข้อมูลเปลี่ยน (ไม่ reload หน้า) ------- */
function rptSetupRealtime() {
  const sb = window.NJ && window.NJ.sb;
  if (!(window.NJ_isLive && window.NJ_isLive()) || !sb) return;
  rptTeardownRealtime();
  try {
    const ch = sb.channel('nj-reports-live');
    ['employees', 'attendance', 'ot_requests', 'leave_requests', 'payroll'].forEach(tbl => {
      ch.on('postgres_changes', { event:'*', schema:'public', table:tbl }, () => {
        if (state.route === 'reports') rptLoadPreview(state.reportActive, true);
      });
    });
    ch.subscribe();
    window._rptCh = ch;
  } catch (_) {}
}
function rptTeardownRealtime() {
  const sb = window.NJ && window.NJ.sb;
  if (window._rptCh && sb) { try { sb.removeChannel(window._rptCh); } catch (_) {} }
  window._rptCh = null;
}

/* ---- โหลด preview ของรายงานที่เลือก -------------------------------------- */
async function rptLoadPreview(key, silent) {
  key = key || 'employees';
  state.reportActive = key;
  const def = rptDef(key);
  const box = $('#rptPreview'), title = $('#rptPreviewTitle'), meta = $('#rptPreviewMeta');
  if (title) title.textContent = 'ตัวอย่าง: ' + (def ? def.title : '');
  $$('.rpt-card').forEach(c => { c.style.outline = c.dataset.rpt === key ? '2px solid var(--red)' : ''; c.style.outlineOffset = c.dataset.rpt === key ? '1px' : ''; });
  if (box && !silent) box.innerHTML = '<p class="muted">⏳ กำลังโหลดข้อมูลจาก Supabase…</p>';
  try {
    const rows = await rptBuild(key);
    state.reportRows = rows;
    if (!box) return;
    if (!rows.length) { box.innerHTML = '<p class="muted">ไม่พบข้อมูลตามช่วงวันที่ที่เลือก</p>'; if (meta) meta.textContent = '0 รายการ'; return; }
    if (meta) meta.textContent = rows.length + ' รายการ';
    box.innerHTML = rptTableHTML(rows, 50);
  } catch (e) {
    if (box) box.innerHTML = '<p style="color:var(--red);font-weight:600">ไม่สามารถโหลดรายงานได้ กรุณาตรวจสอบการเชื่อมต่อ Supabase</p>';
    if (meta) meta.textContent = '';
  }
}

function renderReports() {
  rptInitFilter();
  const f = state.reportFilter;
  if (!state.reportActive) state.reportActive = 'employees';
  const emps = state.employees || [];
  const depts = [...new Set(emps.map(e => e.department_name).filter(Boolean))].sort();
  const empOpts = emps.slice().sort((a, b) => String(a.emp_code).localeCompare(String(b.emp_code)));
  const yNow = new Date().getFullYear();
  const years = [yNow, yNow - 1, yNow - 2, yNow - 3];
  const monthsTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  $('#view').innerHTML = `
    <div class="lv-banner mb">
      <div class="lv-banner-ic">📊</div>
      <div><h2 style="margin:0;font-size:21px;font-weight:800">รายงาน</h2>
        <p class="muted" style="margin:1px 0 0;font-size:12.5px">รายงานทั้งหมดดึงข้อมูลจริงจากระบบ • เลือกตัวกรองแล้วกดการ์ดเพื่อดูตัวอย่าง</p></div>
    </div>

    <div class="card card-pad mb">
      <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
        <div><label class="form-label">วันที่เริ่มต้น</label><input type="date" class="input" id="rf_start" value="${f.start}" style="height:42px"/></div>
        <div><label class="form-label">วันที่สิ้นสุด</label><input type="date" class="input" id="rf_end" value="${f.end}" style="height:42px"/></div>
        <div><label class="form-label">เดือน</label><select class="input" id="rf_month" style="height:42px">${monthsTH.map((m, i) => `<option value="${i + 1}" ${Number(f.month) === i + 1 ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
        <div><label class="form-label">ปี</label><select class="input" id="rf_year" style="height:42px">${years.map(y => `<option value="${y}" ${Number(f.year) === y ? 'selected' : ''}>${y}</option>`).join('')}</select></div>
        <div><label class="form-label">แผนก</label><select class="input" id="rf_dept" style="height:42px"><option value="">ทุกแผนก</option>${depts.map(d => `<option value="${d}" ${f.dept === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
        <div><label class="form-label">พนักงาน</label><select class="input" id="rf_emp" style="height:42px"><option value="">ทุกคน</option>${empOpts.map(e => `<option value="${e.emp_code}" ${f.emp === e.emp_code ? 'selected' : ''}>${e.emp_code} ${rptName(e)}</option>`).join('')}</select></div>
        <div><label class="form-label">&nbsp;</label><button class="btn btn-ghost btn-sm" id="rf_clear" style="height:42px">ล้างตัวกรอง</button></div>
      </div>
      <p class="muted" style="margin:10px 0 0;font-size:12px">* รายงานพนักงานไม่อิงวันที่ • รายงานอื่นใช้ช่วงวันที่ (ถ้าไม่กรอกวันที่ จะใช้ทั้งเดือนตามเดือน/ปีที่เลือก)</p>
    </div>

    <div class="grid-3 rpt-grid">${RPT_DEFS.map(r => `
      <div class="card rpt-card ${r.tone}" data-rpt="${r.key}" style="cursor:pointer">
        <div class="rpt-ic">${r.ic}</div>
        <div class="rpt-accent"></div>
        <h3 class="rpt-title">${r.title}</h3>
        <p class="muted rpt-desc">${r.desc}</p>
        <div style="display:flex;gap:10px;margin-top:auto">
          <button class="rpt-btn excel" style="flex:1" onclick="event.stopPropagation();window.reportExcel('${r.key}')">📊 Excel</button>
          <button class="rpt-btn pdf" style="flex:1" onclick="event.stopPropagation();window.reportPDF('${r.key}')">📄 PDF</button>
        </div>
      </div>`).join('')}</div>`;
  $('#view').classList.add('reports-compact');

  const bind = (id, k) => { const x = $('#' + id); if (x) x.addEventListener('change', e => { state.reportFilter[k] = e.target.value; }); };
  bind('rf_start', 'start'); bind('rf_end', 'end'); bind('rf_month', 'month'); bind('rf_year', 'year'); bind('rf_dept', 'dept'); bind('rf_emp', 'emp');
  const clr = $('#rf_clear');
  if (clr) clr.addEventListener('click', () => { const n = new Date(); state.reportFilter = { start:'', end:'', month:n.getMonth() + 1, year:n.getFullYear(), dept:'', emp:'' }; renderReports(); });
}

// function กลางตามสเปก: exportReport(type) -> Export Excel ตาม Filter ปัจจุบัน
window.exportReport = (type) => window.reportExcel(type);

// Export Excel — ดึงข้อมูลล่าสุดจาก Supabase แล้วเขียนไฟล์
window.reportExcel = async (key) => {
  try {
    const def = rptDef(key); if (!def) return toast('ไม่รู้จักรายงานนี้', 'err');
    toast('กำลังดึงข้อมูลล่าสุด…', 'ok', 1500);
    const rows = await rptBuild(key);
    if (!rows.length) return toast('ไม่พบข้อมูลตามช่วงวันที่ที่เลือก', 'err', 3500);
    const cols = Object.keys(rows[0]);
    // คอลัมน์ที่จัดเป็น "ข้อความ" (ไม่ใช่ตัวเลขเงิน) — รหัส/ชื่อ/วันที่/สถานะ/แผนก/ตำแหน่ง/ธนาคาร ฯลฯ
    const isTextCol = (c) => /รหัส|ชื่อ|นามสกุล|วันที่|สถานะ|แผนก|ตำแหน่ง|ธนาคาร|บัญชี|เลขที่|บัตร|เบอร์|อีเมล|หมายเหตุ|เหตุผล|ประเภท|กะ|วันแจ้ง/i.test(c);
    const isCodeCol = (c) => /รหัส|เลขที่บัตร|เลขบัญชี|เบอร์|เลข\s*สปส/i.test(c);

    // ---- ทางหลัก: ExcelJS (มีกรอบ/สีหัว/ฟอนต์) ----
    if (typeof ExcelJS !== 'undefined') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet((def.file || 'รายงาน').slice(0, 31));
      ws.addRow(cols);
      rows.forEach(r => ws.addRow(cols.map(c => { const v = r[c]; return typeof v === 'number' ? v : (v == null ? '' : v); })));
      const border = { top:{style:'thin',color:{argb:'FF000000'}}, left:{style:'thin',color:{argb:'FF000000'}}, bottom:{style:'thin',color:{argb:'FF000000'}}, right:{style:'thin',color:{argb:'FF000000'}} };
      // หัวตาราง: น้ำตาล + ตัวขาว + กลาง
      const head = ws.getRow(1); head.height = 24;
      head.eachCell((cell, col) => {
        cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF8B5A2B' } };
        cell.font = { bold:true, color:{ argb:'FFFFFFFF' }, name:'Tahoma', size:11 };
        cell.alignment = { horizontal:'center', vertical:'middle' };
        cell.border = border;
      });
      // แถวข้อมูล: กรอบ + จัดชิด + รูปแบบตัวเลข
      for (let i = 0; i < rows.length; i++) {
        const row = ws.getRow(i + 2); row.height = 20;
        cols.forEach((c, ci) => {
          const cell = row.getCell(ci + 1);
          cell.border = border;
          cell.font = { name:'Tahoma', size:10 };
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0.00';
            cell.alignment = { horizontal:'right', vertical:'middle' };
          } else {
            cell.alignment = { horizontal: isCodeCol(c) ? 'center' : 'left', vertical:'middle' };
          }
        });
      }
      // ความกว้างอัตโนมัติ (อิงข้อความยาวสุด + padding 2, min 10 / max 35)
      cols.forEach((c, ci) => {
        let maxLen = String(c).length;
        rows.forEach(r => {
          const v = r[c];
          const s = typeof v === 'number' ? v.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 }) : String(v == null ? '' : v);
          if (s.length > maxLen) maxLen = s.length;
        });
        ws.getColumn(ci + 1).width = Math.min(35, Math.max(10, maxLen + 2));
      });
      ws.views = [{ state:'frozen', ySplit:1 }];   // freeze หัวตาราง
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = rptFileName(def) + '.xlsx';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
      toast(`ดาวน์โหลด ${def.title} สำเร็จ • ${rows.length} รายการ`, 'ok', 3500);
      return;
    }

    // ---- fallback: SheetJS (ไม่มีสไตล์ แต่ยังได้ไฟล์ + .00) ----
    if (typeof XLSX === 'undefined') return toast('ไม่พบไลบรารี Excel', 'err', 4000);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    const ref = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = ref.s.r + 1; R <= ref.e.r; R++) {
      for (let C = ref.s.c; C <= ref.e.c; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell && cell.t === 'n') cell.z = '#,##0.00';
      }
    }
    XLSX.utils.book_append_sheet(wb, ws, def.file.replace(/[\\/?*[\]:]/g, '').slice(0, 31) || 'รายงาน');
    XLSX.writeFile(wb, rptFileName(def) + '.xlsx');
    toast(`ดาวน์โหลด ${def.title} สำเร็จ • ${rows.length} รายการ`, 'ok', 3500);
  } catch (e) {
    toast('สร้าง Excel ไม่สำเร็จ: ' + (e.message || e), 'err', 4000);
  }
};

// Export PDF — ใช้ข้อมูลชุดเดียวกับ Excel (พิมพ์/บันทึกเป็น PDF จากเบราว์เซอร์)
window.reportPDF = async (key) => {
  try {
    const def = rptDef(key); if (!def) return toast('ไม่รู้จักรายงานนี้', 'err');
    toast('กำลังดึงข้อมูลล่าสุด…', 'ok', 1500);
    const rows = await rptBuild(key);
    if (!rows.length) return toast('ไม่พบข้อมูลตามช่วงวันที่ที่เลือก', 'err', 3500);
    const cols = Object.keys(rows[0]);
    const head = cols.map(c => `<th>${c}</th>`).join('');
    const body = rows.map(r => `<tr>${cols.map(c => `<td>${rptCell(r[c])}</td>`).join('')}</tr>`).join('');
    const period = def.dated ? rptFileName(def).replace(def.file + '_', 'ช่วง: ') : 'ทั้งหมด';
    const w = window.open('', '_blank');
    if (!w) return toast('เบราว์เซอร์บล็อกหน้าต่างพิมพ์ — โปรดอนุญาต popup แล้วลองใหม่', 'err', 4500);
    w.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${def.file}</title>
      <style>*{font-family:'Prompt',sans-serif}h2{margin:0 0 2px}p{margin:0 0 12px;color:#666;font-size:13px}
      table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:5px 8px;text-align:left;white-space:nowrap}
      th{background:#f3f4f6}@media print{@page{size:landscape;margin:10mm}}</style></head>
      <body><h2>${def.title}</h2><p>${period} • ${rows.length} รายการ • พิมพ์เมื่อ ${new Date().toLocaleString('th-TH')}</p>
      <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
      <script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script></body></html>`);
    w.document.close();
  } catch (e) {
    toast('สร้าง PDF ไม่สำเร็จ: ' + (e.message || e), 'err', 4000);
  }
};

/* ---- SETTINGS ------------------------------------------------------------- */
// ไอคอน + สี gradient ตามแผนก (ใช้ในหน้าตั้งค่า)
function deptIconStyle(name) {
  const d = (name || '').toUpperCase();
  if (d.includes('ACCOUNT')) return { ic: '🏢', g: 'linear-gradient(135deg,#3B82F6,#2563EB)' };
  if (d.includes('CUSTOMER')) return { ic: '🎧', g: 'linear-gradient(135deg,#FB923C,#EA580C)' };
  if (d.includes('MANAGER')) return { ic: '👥', g: 'linear-gradient(135deg,#EF4444,#DC2626)' };
  if (d.includes('MAID')) return { ic: '🧹', g: 'linear-gradient(135deg,#F472B6,#DB2777)' };
  if (d.includes('AIRPORT')) return { ic: '✈️', g: 'linear-gradient(135deg,#4ADE80,#16A34A)' };
  if (d.includes('BKK')) return { ic: '🚚', g: 'linear-gradient(135deg,#34D399,#059669)' };
  if (d.includes('LBK')) return { ic: '🏬', g: 'linear-gradient(135deg,#2DD4BF,#0D9488)' };
  if (d.includes('LCB')) return { ic: '📦', g: 'linear-gradient(135deg,#22C55E,#15803D)' };
  return { ic: '•', g: 'linear-gradient(135deg,#94A3B8,#64748B)' };
}
/* ============================================================================
 * DEPARTMENT MASTER + MULTI-APPROVER SYSTEM  (AMEND PATCH)
 * ----------------------------------------------------------------------------
 * เพิ่มเติมแบบ additive — ไม่ลบ/ไม่แก้ระบบเดิม (state.leaveApprovers ยังทำงานเป็น fallback)
 *  • departments            : ตารางแผนกกลาง (id, code, name, active)
 *  • departmentApprovers     : ผู้อนุมัติหลายคน/ระดับ ต่อแผนก + โหมด ANY/ALL
 *  • รองรับ: หัวหน้า 1 คนดูแลหลายแผนก, 1 แผนกมีผู้อนุมัติหลายคน
 *  • Mapping ระดับเข้ากับ flow เดิม: SUPERVISOR=SUPERVISOR, MANAGER=MANAGER,
 *    DIRECTOR=EXECUTIVE (stage เดิม PENDING_EXECUTIVE) — ไม่แตะ LEAVE_FLOW/สถานะเดิม
 *  • DEPARTMENT(HR) stage เดิม คงไว้ตามเดิม (ตาม role) ไม่เปลี่ยน
 *  • โหมด ANY/ALL: บันทึกครบ + "ใครมีสิทธิ์อนุมัติ" ใช้ได้ทั้งสองโหมด
 *    (การเดินสถานะยังเป็น ANY = อนุมัติ 1 คนผ่าน ตามพฤติกรรมเดิม — ดูหมายเหตุท้ายงาน)
 * ========================================================================== */
const DEPT_APPR_LEVELS = [
  ['SUPERVISOR', 'หัวหน้างาน', '#2563eb'],
  ['MANAGER',    'ผู้จัดการ',  '#ea580c'],
  ['DIRECTOR',   'ผู้บริหาร',  '#16a34a'],   // = EXECUTIVE stage ใน flow เดิม
];
// แปลงระดับ flow เดิม -> ระดับระบบใหม่
function flowLevelToDeptLevel(level) { return level === 'EXECUTIVE' ? 'DIRECTOR' : level; }

/* ---- helpers: departments master ---------------------------------------- */
function njNextDeptCode() {
  const nums = (state.departments || []).map(d => {
    const m = /^DEP0*(\d+)$/i.exec(String(d.code || ''));
    return m ? parseInt(m[1], 10) : 0;
  });
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return 'DEP' + String(next).padStart(3, '0');
}
function njDeptById(id) { return (state.departments || []).find(d => String(d.id) === String(id)) || null; }
function njDeptByName(name) {
  const n = String(name || '').trim().toLowerCase();
  if (!n) return null;
  return (state.departments || []).find(d => String(d.department_name || d.name || '').trim().toLowerCase() === n) || null;
}
const njDeptName = (d) => d ? (d.department_name || d.name || '') : '';

/* ---- ระบบใหม่: คืนรหัสผู้อนุมัติ (active) ตามชื่อแผนก + ระดับ flow เดิม ----
 * ใช้ใน getDeptApprover เป็นลำดับแรก (ถ้าไม่มี config ใหม่ -> ตกไปใช้ระบบเดิม) */
function newDeptApproverCodes(departmentName, flowLevel) {
  try {
    const dept = njDeptByName(departmentName);
    if (!dept) return null;
    const cfg = (state.departmentApprovers || {})[dept.id];
    if (!cfg) return null;
    const lv = flowLevelToDeptLevel(flowLevel);
    const slot = cfg[lv];
    if (!slot || !Array.isArray(slot.emps) || !slot.emps.length) return null;
    return slot.emps.slice();
  } catch (_) { return null; }
}

/* ---- Persistence: departments + department_approvers --------------------- *
 * DEMO  -> localStorage('nj_departments' / 'nj_department_approvers')
 * Live  -> Supabase tables 'departments' / 'department_approvers' (normalized) */
function njLoadDeptLocal() {
  try {
    const d = localStorage.getItem('nj_departments');
    if (d) { const a = JSON.parse(d); if (Array.isArray(a)) state.departments = a; }
    const m = localStorage.getItem('nj_department_approvers');
    if (m) { const o = JSON.parse(m); if (o && typeof o === 'object') state.departmentApprovers = o; }
  } catch (_) {}
}
async function njLoadDeptRemote() {
  try {
    const { data: deps } = await sb.from('nj_departments').select('*').order('department_code');
    if (Array.isArray(deps)) {
      state.departments = deps.map(r => ({
        id: r.id, code: r.department_code, department_name: r.department_name,
        active: r.active !== false, created_at: r.created_at,
      }));
    }
  } catch (_) {}
  try {
    const { data: rows } = await sb.from('nj_department_approvers').select('*');
    if (Array.isArray(rows)) {
      const map = {};
      rows.forEach(r => {
        if (!r || r.active === false) return;
        const did = r.department_id, lv = r.approval_level;
        if (!did || !lv) return;
        if (!map[did]) map[did] = {};
        if (!map[did][lv]) map[did][lv] = { emps: [], mode: r.approval_mode || 'ANY' };
        if (r.approver_emp_code && !map[did][lv].emps.includes(r.approver_emp_code)) map[did][lv].emps.push(r.approver_emp_code);
        if (r.approval_mode) map[did][lv].mode = r.approval_mode;
      });
      state.departmentApprovers = map;
    }
  } catch (_) {}
}
function njDeptLazyLoad() {
  if (state._deptLoaded) return;
  state._deptLoaded = true;
  if (!state.departments) state.departments = [];
  if (!state.departmentApprovers) state.departmentApprovers = {};
  try {
    if (typeof USE_DEMO !== 'undefined' && USE_DEMO) { njLoadDeptLocal(); njMigrateDepartments(); }
    else if (typeof sb !== 'undefined' && sb) {
      njLoadDeptRemote().then(() => { njMigrateDepartments(); if (state.route === 'settings') { try { renderDeptMaster(); } catch (_) {} } });
    }
  } catch (_) {}
}
function njPersistDepartments() {
  try {
    if (typeof USE_DEMO !== 'undefined' && USE_DEMO) {
      localStorage.setItem('nj_departments', JSON.stringify(state.departments || []));
    } else if (typeof sb !== 'undefined' && sb) {
      const rows = (state.departments || []).map(d => ({
        id: d.id, department_code: d.code, department_name: d.department_name,
        active: d.active !== false, created_at: d.created_at || new Date().toISOString(),
      }));
      sb.from('nj_departments').upsert(rows, { onConflict: 'id' }).then(res => {
        if (res && res.error) toast('บันทึกแผนกขึ้นฐานข้อมูลไม่สำเร็จ: ' + res.error.message, 'err', 4500);
      });
    }
  } catch (_) {}
}
function njPersistDeptApprovers(deptId) {
  try {
    if (typeof USE_DEMO !== 'undefined' && USE_DEMO) {
      localStorage.setItem('nj_department_approvers', JSON.stringify(state.departmentApprovers || {}));
    } else if (typeof sb !== 'undefined' && sb) {
      const cfg = (state.departmentApprovers || {})[deptId] || {};
      const rows = [];
      DEPT_APPR_LEVELS.forEach(([lv]) => {
        const slot = cfg[lv]; if (!slot || !Array.isArray(slot.emps)) return;
        slot.emps.forEach(code => rows.push({
          department_id: deptId, approver_emp_code: code, approval_level: lv,
          approval_mode: slot.mode || 'ANY', active: true, created_at: new Date().toISOString(),
        }));
      });
      // เขียนทับเฉพาะแผนกนี้: ลบของเดิมแล้วใส่ชุดใหม่ (ไม่กระทบแผนกอื่น)
      sb.from('nj_department_approvers').delete().eq('department_id', deptId).then(() => {
        if (rows.length) sb.from('nj_department_approvers').insert(rows).then(res => {
          if (res && res.error) toast('บันทึกผู้อนุมัติแผนกไม่สำเร็จ: ' + res.error.message, 'err', 4500);
        });
      });
    }
  } catch (_) {}
}

/* ---- J. Data Migration: ไม่ทำให้ข้อมูลเดิมหาย ---------------------------- *
 * 1) สร้าง departments จากชื่อแผนกเดิม (พนักงาน + EMP_DEPARTMENTS + DEMO) ที่ยังไม่มี
 * 2) สร้าง department_approvers จาก state.leaveApprovers เดิม (ครั้งเดียว ไม่ทับของใหม่) */
function njMigrateDepartments() {
  if (!state.departments) state.departments = [];
  if (!state.departmentApprovers) state.departmentApprovers = {};
  // 1) แผนก
  const names = new Set();
  (state.employees || []).forEach(e => { if (e.department_name) names.add(String(e.department_name).trim()); });
  (typeof EMP_DEPARTMENTS !== 'undefined' ? EMP_DEPARTMENTS : []).forEach(n => names.add(String(n).trim()));
  try { (NJ.DEMO && NJ.DEMO.departments || []).forEach(n => names.add(String(n).trim())); } catch (_) {}
  let changed = false;
  names.forEach(name => {
    if (!name) return;
    if (!njDeptByName(name)) {
      state.departments.push({
        id: 'dep_' + Math.random().toString(36).slice(2, 10),
        code: njNextDeptCode(), department_name: name, active: true,
        created_at: new Date().toISOString(),
      });
      changed = true;
    }
  });
  if (changed) njPersistDepartments();
  // 2) ผู้อนุมัติเดิม -> ระบบใหม่ (เฉพาะแผนกที่ยังไม่มี config ใหม่)
  try {
    njApprLazyLoad();
    const old = state.leaveApprovers || {};
    Object.keys(old).forEach(deptName => {
      const cfg = old[deptName]; if (!cfg) return;
      const dept = njDeptByName(deptName); if (!dept) return;
      if (state.departmentApprovers[dept.id]) return;   // มี config ใหม่แล้ว ไม่ทับ
      const exec = Array.isArray(cfg.EXECUTIVE) ? cfg.EXECUTIVE : (cfg.EXECUTIVE ? [cfg.EXECUTIVE] : []);
      const built = {};
      if (cfg.SUPERVISOR) built.SUPERVISOR = { emps: [cfg.SUPERVISOR], mode: 'ANY' };
      if (cfg.MANAGER)    built.MANAGER    = { emps: [cfg.MANAGER],    mode: 'ANY' };
      if (exec.length)    built.DIRECTOR   = { emps: exec.slice(),     mode: cfg.approval_mode === 'ALL' ? 'ALL' : 'ANY' };
      if (Object.keys(built).length) {
        built.saved_at = cfg.saved_at || Date.now();
        state.departmentApprovers[dept.id] = built;
        njPersistDeptApprovers(dept.id);
      }
    });
  } catch (_) {}
}

/* ---- G. หน้า "จัดการแผนก" (Department Master) ---------------------------- */
function renderDeptMaster() {
  njDeptLazyLoad();
  const list = (state.departments || []).slice().sort((a, b) => String(a.code).localeCompare(String(b.code)));
  const rows = list.length ? list.map(d => {
    const s = deptIconStyle(njDeptName(d));
    const off = d.active === false;
    return `<div class="set-item" style="${off ? 'opacity:.55' : ''}">
      <div class="set-ic" style="background:${s.g}">${s.ic}</div>
      <div class="set-body"><b>${njDeptName(d)}</b>
        <small class="muted" style="display:block">${d.code}${off ? ' • ปิดใช้งาน' : ''}</small></div>
      <button class="set-edit" onclick="window.njDeptToggle('${d.id}')" title="${off ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}">${off ? '☑️' : '⏸'}</button>
      <button class="set-edit" onclick="window.njDeptEdit('${d.id}')" title="แก้ไข">✏️</button>
    </div>`;
  }).join('') : '<p class="muted" style="text-align:center;padding:24px">ยังไม่มีแผนก — กด “+ เพิ่มแผนก”</p>';
  $('#setContent').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:14px">
      <p class="muted" style="margin:0">แผนกกลางขององค์กร — ใช้เป็นศูนย์กลางผูกผู้อนุมัติ (เพิ่ม/แก้ไข/ปิดใช้งานได้ ไม่ลบทิ้ง)</p>
      <button class="btn btn-primary btn-sm" onclick="window.njDeptEdit()">+ เพิ่มแผนก</button>
    </div>
    <div class="set-list">${rows}</div>`;
}
window.njDeptEdit = (id) => {
  njDeptLazyLoad();
  const d = id ? njDeptById(id) : null;
  const body = `
    <div class="field"><label class="form-label">รหัสแผนก</label>
      <input class="input" id="dm_code" value="${d ? d.code : njNextDeptCode()}" placeholder="DEP001"/></div>
    <div class="field"><label class="form-label">ชื่อแผนก <span class="req">*</span></label>
      <input class="input" id="dm_name" value="${d ? njDeptName(d) : ''}" placeholder="เช่น Shipping Import"/></div>
    <label style="display:flex;align-items:center;gap:8px;margin-top:6px;cursor:pointer">
      <input type="checkbox" id="dm_active" ${(!d || d.active !== false) ? 'checked' : ''}/> <span>เปิดใช้งาน</span></label>`;
  const foot = `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
    <button class="btn btn-primary" onclick="window.njDeptSave('${id || ''}')">บันทึก</button>`;
  openModal(d ? 'แก้ไขแผนก' : 'เพิ่มแผนก', body, foot);
};
window.njDeptSave = (id) => {
  const code = ($('#dm_code')?.value || '').trim();
  const name = ($('#dm_name')?.value || '').trim();
  const active = !!$('#dm_active')?.checked;
  if (!name) return toast('กรุณากรอกชื่อแผนก', 'err');
  // กันชื่อซ้ำ (ยกเว้นตัวเอง)
  const dup = njDeptByName(name);
  if (dup && String(dup.id) !== String(id)) return toast('มีชื่อแผนกนี้อยู่แล้ว', 'err');
  if (id) {
    const d = njDeptById(id); if (!d) return;
    d.code = code || d.code; d.department_name = name; d.active = active;
  } else {
    state.departments.push({
      id: 'dep_' + Math.random().toString(36).slice(2, 10),
      code: code || njNextDeptCode(), department_name: name, active,
      created_at: new Date().toISOString(),
    });
  }
  njPersistDepartments();
  closeModal();
  toast('✅ บันทึกแผนกสำเร็จ', 'ok');
  renderDeptMaster();
};
window.njDeptToggle = (id) => {
  const d = njDeptById(id); if (!d) return;
  d.active = d.active === false;   // toggle (ปิด<->เปิด) — ไม่ลบข้อมูล
  njPersistDepartments();
  renderDeptMaster();
};

/* ---- H. หน้า "ผู้อนุมัติแผนก" (Mapping หลายคน/ระดับ + ANY/ALL) ----------- */
function renderDeptApprovers() {
  njDeptLazyLoad();
  const depts = (state.departments || []).filter(d => d.active !== false)
    .slice().sort((a, b) => String(a.code).localeCompare(String(b.code)));
  if (!depts.length) {
    $('#setContent').innerHTML = '<p class="muted" style="text-align:center;padding:24px">ยังไม่มีแผนก — ไปที่แท็บ “🏢 จัดการแผนก” เพื่อเพิ่มแผนกก่อน</p>';
    return;
  }
  const selId = state.deptApprSel && njDeptById(state.deptApprSel) ? state.deptApprSel : depts[0].id;
  state.deptApprSel = selId;
  const cfg = (state.departmentApprovers || {})[selId] || {};
  const emps = (state.employees || []);

  const levelCard = ([lv, label, color]) => {
    const slot = cfg[lv] || { emps: [], mode: 'ANY' };
    const sel = Array.isArray(slot.emps) ? slot.emps : [];
    const mode = slot.mode === 'ALL' ? 'ALL' : 'ANY';
    const items = emps.map(e => {
      const checked = sel.includes(e.emp_code) ? 'checked' : '';
      const search = `${e.emp_code} ${e.first_name} ${e.last_name} ${e.department_name || ''}`.toLowerCase();
      return `<label class="njda-item" data-search="${search}" style="display:flex;align-items:center;gap:10px;padding:7px 9px;border-radius:8px;cursor:pointer">
        <input type="checkbox" data-njda="${lv}" value="${e.emp_code}" ${checked}/>
        <span>${e.emp_code} | ${e.first_name} ${e.last_name} <span class="muted">| ${e.department_name || '-'}</span></span></label>`;
    }).join('') || '<p class="muted" style="padding:10px;font-size:13px">ยังไม่มีพนักงานในระบบ</p>';
    return `<div style="border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:12px">
      <div style="font-weight:700;color:${color};margin-bottom:8px">${label} <span class="muted" style="font-weight:400">— เลือกได้หลายคน</span></div>
      <input class="input" placeholder="ค้นหา รหัส / ชื่อ / นามสกุล / แผนก ..." oninput="window.njdaFilter(this,'njdaList_${lv}')" style="margin-bottom:8px"/>
      <div id="njdaList_${lv}" style="max-height:150px;overflow:auto;background:var(--gray);border:1px solid var(--line);border-radius:10px;padding:6px">${items}</div>
      <div style="display:flex;gap:16px;margin-top:8px;font-size:13px">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="radio" name="njdaMode_${lv}" value="ANY" ${mode === 'ANY' ? 'checked' : ''}/> อนุมัติคนใดคนหนึ่งผ่าน</label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="radio" name="njdaMode_${lv}" value="ALL" ${mode === 'ALL' ? 'checked' : ''}/> ต้องอนุมัติครบทุกคน</label>
      </div>
    </div>`;
  };

  $('#setContent').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px">
      <p class="muted" style="margin:0">กำหนดผู้อนุมัติแต่ละระดับของแผนก (หลายคนได้ • หัวหน้า 1 คนตั้งให้หลายแผนกได้)</p>
    </div>
    <div class="field"><label class="form-label">เลือกแผนก</label>
      <select class="input" id="njda_dept" onchange="window.njdaSelectDept(this.value)">
        ${depts.map(d => `<option value="${d.id}" ${d.id === selId ? 'selected' : ''}>${d.code} | ${njDeptName(d)}</option>`).join('')}
      </select>
    </div>
    ${DEPT_APPR_LEVELS.map(levelCard).join('')}
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:4px">
      <button class="btn btn-primary" onclick="window.njdaSave()">บันทึกผู้อนุมัติแผนก</button>
    </div>`;
}
window.njdaFilter = (inp, listId) => {
  const kw = (inp.value || '').trim().toLowerCase();
  $$('#' + listId + ' .njda-item').forEach(it => {
    it.style.display = (!kw || (it.dataset.search || '').includes(kw)) ? '' : 'none';
  });
};
window.njdaSelectDept = (id) => { state.deptApprSel = id; renderDeptApprovers(); };
window.njdaSave = () => {
  const id = state.deptApprSel; if (!id) return;
  if (!state.departmentApprovers) state.departmentApprovers = {};
  const cfg = {};
  DEPT_APPR_LEVELS.forEach(([lv]) => {
    const emps = $$(`#setContent [data-njda="${lv}"]:checked`).map(c => c.value);
    const modeEl = $(`#setContent input[name="njdaMode_${lv}"]:checked`);
    const mode = modeEl ? modeEl.value : 'ANY';
    if (emps.length) cfg[lv] = { emps, mode };
  });
  cfg.saved_at = Date.now();
  state.departmentApprovers[id] = cfg;
  njPersistDeptApprovers(id);
  toast('✅ บันทึกผู้อนุมัติแผนกสำเร็จ', 'ok');
};

function renderSettings() {
  if (!state.leaveApprovers) state.leaveApprovers = {};
  const tabs = [['deptmaster','🏢 จัดการแผนก'], ['deptapprovers','👤 ผู้อนุมัติแผนก'], ['positions','👤 ตำแหน่ง'], ['leavetypes','📅 ประเภทลา'], ['holidays','🗓 วันหยุด'], ['approvers','👥 ผู้อนุมัติลา (เดิม)']];
  $('#view').innerHTML = `
    <div class="lv-banner mb" style="gap:16px">
      <div class="lv-banner-ic">⚙️</div>
      <div style="flex:1"><h2 style="margin:0;font-size:21px;font-weight:800">ตั้งค่า</h2>
        <p class="muted" style="margin:1px 0 0;font-size:12.5px">จัดการการตั้งค่าระบบทั้งหมดขององค์กร</p></div>
      <button class="btn btn-primary btn-sm" onclick="window.toast('เพิ่มรายการใหม่')">+ เพิ่ม</button>
    </div>
    <div class="card">
      <div class="card-pad">
        <div class="tabs" id="setTabs">${tabs.map((t, i) => `<button class="tab ${i === 0 ? 'active' : ''}" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>
        <div id="setContent" class="mt"></div>
      </div>
    </div>`;
  const render = (key) => {
    if (key === 'deptmaster') return renderDeptMaster();
    if (key === 'deptapprovers') return renderDeptApprovers();
    if (key === 'approvers') return renderApproverSettings();
    if (key === 'holidays') return renderHolidaySettings();
    const data = {
      positions:['General Manager','Assistant Manager','Accountant','เจ้าหน้าที่ HR','Logistic'],
      leavetypes:['ลาป่วย','ลากิจ','ลาพักร้อน','ลาคลอด','ลาบวช','ลาครึ่งวัน'],
      holidays:['วันปีใหม่ (1 ม.ค.)','วันสงกรานต์ (13-15 เม.ย.)','วันแรงงาน (1 พ.ค.)'],
      perms:['SUPER_ADMIN','ADMIN','HR','ACCOUNT','MANAGER','EMPLOYEE'],
    }[key];
    $('#setContent').innerHTML = `
      <div class="set-list">${(data || []).map(d => {
        const s = { ic: '•', g: 'linear-gradient(135deg,#EF4444,#DC2626)' };
        return `<div class="set-item">
          <div class="set-ic" style="background:${s.g}">${s.ic}</div>
          <div class="set-body"><b>${d}</b></div>
          <button class="set-edit" onclick="window.toast('แก้ไขรายการ')" title="แก้ไข">✏️</button>
        </div>`;
      }).join('')}</div>`;
  };
  render('deptmaster');
  $$('#setTabs .tab').forEach(t => t.addEventListener('click', () => {
    $$('#setTabs .tab').forEach(x => x.classList.remove('active')); t.classList.add('active'); render(t.dataset.t);
  }));
}

/* ตั้งค่าผู้อนุมัติลา แยกตามแผนก: เลือกแผนก -> เห็นรายชื่อพนักงานแผนกนั้น -> ตั้งผู้อนุมัติแต่ละระดับ */
/* ============================================================================
 * APPROVER SETTINGS — MODAL FLOW (ต่อยอดจากระบบผู้อนุมัติเดิม)
 * - หน้า: ปุ่ม "+ เปิดอนุมัติลา" + รายการ Summary Card รายแผนก (กดแก้ไขได้)
 * - Modal: เลือกแผนก / หัวหน้างาน / ผู้จัดการ / ผู้บริหาร(หลายคน) / โหมด / สิทธิ์ตามประเภท
 * - บันทึก -> Toast + Summary Card ใน Modal ทันที
 * data model เดิม: state.leaveApprovers[dept] = {SUPERVISOR, MANAGER, EXECUTIVE[], approval_mode, typeMatrix, saved_at}
 * (canApproveLevel เดิมยังอ่าน SUPERVISOR/MANAGER/EXECUTIVE ได้ • ไม่แตะ flow ลา/OT จริง)
 * ========================================================================== */
const APPR_LEVELS = [['SUPERVISOR', 'หัวหน้างาน', '#2563eb'], ['MANAGER', 'ผู้จัดการ', '#ea580c'], ['EXECUTIVE', 'ผู้บริหาร', '#16a34a']];
const LEAVE_TYPE_DEFS = [
  ['SICK',         '🤒 ลาป่วย',                [true, false, false]],
  ['PERSONAL',     '📝 ลากิจ',                 [true, true,  false]],
  ['VACATION',     '🏖️ ลาพักร้อน',            [true, true,  false]],
  ['MATERNITY',    '🤱 ลาคลอด',                [true, true,  true ]],
  ['OT',           '⏰ ทำงานล่วงเวลา',          [true, false, false]],
  ['RESIGN',       '🚪 ลาออก',                 [true, true,  true ]],
  ['BACKDATE',     '🕓 ลงชื่อย้อนหลัง',         [true, true,  false]],
  ['HOLIDAYLEAVE', '📅 การลาหยุด',             [true, false, false]],  // สเปกไม่ระบุ default -> ตั้งหัวหน้างาน (แก้ไขได้)
];
const LEAVE_TYPE_LABEL = Object.fromEntries(LEAVE_TYPE_DEFS.map(([k, l]) => [k, l]));
function defaultTypeMatrix() {
  const m = {}; LEAVE_TYPE_DEFS.forEach(([k, _l, d]) => { m[k] = { SUPERVISOR: d[0], MANAGER: d[1], EXECUTIVE: d[2] }; }); return m;
}
function typeMatrixOf(cfg) { return (cfg && cfg.typeMatrix) ? cfg.typeMatrix : defaultTypeMatrix(); }

const apprEmpOptLabel = (e) => `${e.emp_code} | ${e.first_name} ${e.last_name} | ${e.department_name || '-'}`;
function apprEmpCodeName(allEmps, code) {
  const e = allEmps.find(x => x.emp_code === code);
  return e ? `${e.emp_code} | ${e.first_name} ${e.last_name} | ${e.department_name || '-'}` : code;
}
function fmtSavedAt(ts) {
  if (!ts) return '-';
  const d = new Date(ts), p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ============================================================================
 * ผู้บริหารอนุมัติ (รายชื่อกำหนดตายตัว)
 * ----------------------------------------------------------------------------
 * ช่อง "ผู้บริหารอนุมัติ" จะค้นหา/แสดง/เลือกได้เฉพาะคนในรายการนี้เท่านั้น
 * และตอนอนุมัติจริงระดับผู้บริหาร จะให้เลือกได้ว่าผู้บริหารคนไหนเป็นผู้อนุมัติ
 * ▸ วิธีแก้ไขรายชื่อ: เพิ่ม/ลบ object ในอาเรย์ด้านล่าง (ระบุ code = รหัสพนักงาน)
 *   จับคู่ด้วยรหัสพนักงาน (emp_code) เป็นหลัก และใช้ชื่อ-นามสกุลเป็นตัวสำรอง
 * ========================================================================== */
const EXEC_APPROVERS = [
  { code: '0001', name: 'จำรัส ผาเทพ' },
  { code: '0002', name: 'สุนทรี ทิรานูกูล' },
];
// เป็นผู้บริหารที่กำหนดไว้หรือไม่ (เทียบรหัสก่อน ถ้าไม่ตรงค่อยเทียบชื่อ-นามสกุล)
const isExecApprover = (e) => {
  const code = String(e && e.emp_code || '').trim();
  const name = `${String(e && e.first_name || '').trim()} ${String(e && e.last_name || '').trim()}`.replace(/\s+/g, ' ').trim();
  return EXEC_APPROVERS.some(x => (x.code && x.code === code) || (x.name && x.name === name));
};
// รายชื่อผู้บริหารที่ถูกตั้งไว้ของแผนกนั้น -> [{code, name}] (ใช้ตอนอนุมัติจริง)
function execApproverChoices(department) {
  const cfg = (state.leaveApprovers && state.leaveApprovers[department]) || {};
  const arr = Array.isArray(cfg.EXECUTIVE) ? cfg.EXECUTIVE : (cfg.EXECUTIVE ? [cfg.EXECUTIVE] : []);
  const emps = state.employees || [];
  return arr.map(code => {
    const e = emps.find(x => x.emp_code === code);
    const name = e ? `${e.first_name || ''} ${e.last_name || ''}`.replace(/\s+/g, ' ').trim() : '';
    return { code, name: name || code };
  });
}
// HTML กล่องเลือกผู้บริหารผู้อนุมัติ — แสดงเฉพาะตอนอนุมัติระดับ EXECUTIVE และมีผู้บริหารที่ตั้งไว้
function execApproverPickerHTML(level, department) {
  if (level !== 'EXECUTIVE') return '';
  const list = execApproverChoices(department);
  if (!list.length) return '';
  const me = Auth.current && Auth.current.emp_code;
  const opts = list.map((x, i) => {
    const sel = (x.code === me) || (me == null && i === 0) ? 'selected' : '';
    return `<option value="${x.code}" ${sel}>${x.code} | ${x.name}</option>`;
  }).join('');
  return `<div class="field" style="margin-bottom:10px">
    <label class="form-label">เลือกผู้บริหารที่อนุมัติ <span class="req">*</span></label>
    <select class="input" id="apprExecPick">${opts}</select>
  </div>`;
}
// อ่านชื่อ/รหัสผู้บริหารที่เลือกในกล่องอนุมัติ (ถ้าไม่มีกล่อง = ใช้ผู้ใช้ที่ล็อกอินตามเดิม)
function pickedApprover() {
  const sel = $('#apprExecPick');
  if (sel && sel.value) {
    const e = (state.employees || []).find(x => x.emp_code === sel.value);
    const name = e ? `${e.first_name || ''} ${e.last_name || ''}`.replace(/\s+/g, ' ').trim() : sel.value;
    return { name: name || sel.value, code: sel.value };
  }
  return { name: Auth.current?.full_name || Auth.current?.username, code: Auth.current?.emp_code || null };
}

/* ---- หน้า ผู้อนุมัติลา: ปุ่มเปิด Modal + รายการ Summary Card รายแผนก ---- */
/* ---- Persistence (Patch 19): DEMO -> localStorage('nj_leave_approvers') | Live -> Supabase table 'leave_approvers' ---- */
function njLoadApproversLocal() {
  try {
    const raw = localStorage.getItem('nj_leave_approvers');
    if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object') { if (!state.leaveApprovers) state.leaveApprovers = {}; Object.assign(state.leaveApprovers, o); } }
  } catch (_) {}
}
async function njLoadApproversRemote() {
  try {
    const { data } = await sb.from('leave_approvers').select('department,config');
    if (Array.isArray(data)) { if (!state.leaveApprovers) state.leaveApprovers = {}; data.forEach(r => { if (r && r.department) state.leaveApprovers[r.department] = r.config || {}; }); }
  } catch (_) {}
}
function njApprLazyLoad() {
  if (state._apprLoaded) return;
  state._apprLoaded = true;
  try {
    if (typeof USE_DEMO !== 'undefined' && USE_DEMO) { njLoadApproversLocal(); }
    else if (typeof sb !== 'undefined' && sb) { njLoadApproversRemote().then(() => { if (typeof renderApproverSettings === 'function') renderApproverSettings(); }); }
  } catch (_) {}
}
function njPersistApprovers(dept) {
  try {
    if (typeof USE_DEMO !== 'undefined' && USE_DEMO) {
      localStorage.setItem('nj_leave_approvers', JSON.stringify(state.leaveApprovers || {}));
    } else if (typeof sb !== 'undefined' && sb) {
      sb.from('leave_approvers').upsert({ department: dept, config: state.leaveApprovers[dept], updated_at: new Date().toISOString() }).then(function (res) {
        if (res && res.error) toast('บันทึกขึ้นฐานข้อมูลไม่สำเร็จ: ' + res.error.message, 'err', 4500);
      });
    }
  } catch (_) {}
}
function renderApproverSettings() {
  if (!state.leaveApprovers) state.leaveApprovers = {};
  njApprLazyLoad();
  const allEmps = (state.employees || []);
  const savedDepts = Object.keys(state.leaveApprovers).filter(d => state.leaveApprovers[d] && state.leaveApprovers[d].saved_at);
  savedDepts.sort();
  const cards = savedDepts.length
    ? savedDepts.map(d => approverHeaderCard(d, state.leaveApprovers[d])).join('')
    : '<p class="muted" style="text-align:center;padding:26px">ยังไม่มีการตั้งค่าผู้อนุมัติ — กด “+ เปิดอนุมัติลา” เพื่อเริ่มต้น</p>';
  $('#setContent').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:14px">
      <p class="muted" style="margin:0">ตั้งค่าผู้อนุมัติแต่ละแผนก และสิทธิ์อนุมัติตามประเภทรายการ ผ่านหน้าต่างตั้งค่า</p>
      <button class="btn btn-primary btn-sm" onclick="window.openApproverModal()">+ เปิดอนุมัติลา</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">${cards}</div>`;
}

/* ---- Modal: ตั้งค่าผู้อนุมัติลา ---- */
window.openApproverModal = (deptArg) => {
  if (!state.leaveApprovers) state.leaveApprovers = {};
  const fromEmps = (state.employees || []).map(e => e.department_name).filter(Boolean);
  const departments = [...new Set([...EMP_DEPARTMENTS, ...fromEmps])].sort();
  const dept = deptArg || state.approverDept || departments[0] || '';
  state.approverDept = dept;
  const allEmps = (state.employees || []);
  const cfg = state.leaveApprovers[dept] || {};

  const dataListAll = `<datalist id="apprListAll">${allEmps.map(e => `<option value="${apprEmpOptLabel(e)}"></option>`).join('')}</datalist>`;
  const singleRow = (level, label, desc) => {
    const cur = cfg[level] || '';
    const curEmp = allEmps.find(e => e.emp_code === cur);
    const curText = curEmp ? apprEmpOptLabel(curEmp) : '';
    return `<div style="margin-bottom:12px">
      <label class="form-label">${label} <span class="muted" style="font-weight:400">— ${desc}</span></label>
      <input class="input" list="apprListAll" data-appr-single="${level}" value="${curText}"
        placeholder="ค้นหา รหัส / ชื่อ / นามสกุล / แผนก ... (เว้นว่าง = ใช้สิทธิ์ตามตำแหน่ง)" autocomplete="off"/>
    </div>`;
  };
  const exec = Array.isArray(cfg.EXECUTIVE) ? cfg.EXECUTIVE : (cfg.EXECUTIVE ? [cfg.EXECUTIVE] : []);
  // ผู้บริหารอนุมัติ: แสดง/ค้นหา/เลือกได้เฉพาะผู้บริหารที่กำหนดไว้ใน EXEC_APPROVERS เท่านั้น
  const execEmps = allEmps.filter(isExecApprover);
  const execList = execEmps.map(e => {
    const checked = exec.includes(e.emp_code) ? 'checked' : '';
    const search = `${e.emp_code} ${e.first_name} ${e.last_name} ${e.department_name || ''}`.toLowerCase();
    return `<label class="appr-exec-item" data-search="${search}" style="display:flex;align-items:center;gap:10px;padding:7px 9px;border-radius:8px;cursor:pointer">
      <input type="checkbox" data-appr-exec value="${e.emp_code}" ${checked}/><span>${apprEmpOptLabel(e)} | ผู้บริหาร</span></label>`;
  }).join('') || '<p class="muted" style="text-align:center;padding:14px;font-size:13px">ไม่พบผู้บริหารที่กำหนดไว้ในระบบ (ต้องมีพนักงานรหัส/ชื่อตรงกับรายชื่อผู้บริหาร)</p>';
  const mode = cfg.approval_mode === 'ALL' ? 'ALL' : 'ANY';

  // สิทธิ์อนุมัติตามประเภทรายการ — ฟิกให้ติ๊กครบทุกช่องเสมอ + ซ่อน UI (แก้ไม่ได้)
  const matrixCards = LEAVE_TYPE_DEFS.map(([k, label]) => {
    const checks = APPR_LEVELS.map(([lv, lbl, color]) => `
      <label style="display:flex;align-items:center;gap:7px;color:${color};font-weight:600;font-size:13px">
        <input type="checkbox" data-appr-type="${k}" data-appr-typelevel="${lv}" checked/> ${lbl}</label>`).join('');
    return `<div style="background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 12px">
      <div style="font-weight:700;margin-bottom:6px;font-size:13.5px">${label}</div>
      <div style="display:flex;flex-direction:column;gap:4px">${checks}</div></div>`;
  }).join('');

  const savedLine = cfg.saved_at ? `<p class="muted" style="margin:-2px 0 12px;font-size:12.5px">🕒 บันทึกล่าสุด: ${fmtSavedAt(cfg.saved_at)}</p>` : '';
  const body = `
    <div class="field"><label class="form-label">เลือกแผนก</label>
      <select class="input" id="am_dept" onchange="window.openApproverModal(this.value)">
        ${departments.map(d => `<option value="${d}" ${d === dept ? 'selected' : ''}>${d}</option>`).join('') || '<option>— ไม่มีข้อมูลแผนก —</option>'}
      </select>
    </div>
    ${savedLine}
    ${allEmps.length ? `
      ${singleRow('SUPERVISOR','หัวหน้างานอนุมัติ','เลือก 1 คน')}
      ${singleRow('MANAGER','ผู้จัดการอนุมัติ','เลือก 1 คน')}
      ${dataListAll}
      <div style="margin-bottom:12px">
        <label class="form-label">ผู้บริหารอนุมัติ <span class="muted" style="font-weight:400">— เลือกได้หลายคน</span></label>
        <input class="input" id="apprExecSearch" oninput="window.filterApprExec(this.value)" placeholder="ค้นหา รหัส / ชื่อ / นามสกุล / แผนก ..." autocomplete="off" style="margin-bottom:8px"/>
        <div id="apprExecList" style="max-height:160px;overflow:auto;background:var(--gray);border:1px solid var(--line);border-radius:10px;padding:6px">${execList}</div>
      </div>
      <div style="margin-bottom:14px">
        <label class="form-label">รูปแบบการอนุมัติผู้บริหาร</label>
        <label style="display:flex;align-items:center;gap:8px;margin:4px 0;cursor:pointer"><input type="radio" name="apprMode" value="ANY" ${mode === 'ANY' ? 'checked' : ''}/><span>อนุมัติ 1 คนผ่าน</span></label>
        <label style="display:flex;align-items:center;gap:8px;margin:4px 0;cursor:pointer"><input type="radio" name="apprMode" value="ALL" ${mode === 'ALL' ? 'checked' : ''}/><span>ต้องอนุมัติครบทุกคน</span></label>
      </div>
      <div style="display:none">
        <label class="form-label" style="color:var(--red)">🗂 สิทธิ์อนุมัติตามประเภทรายการ</label>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-top:6px">${matrixCards}</div>
      </div>
    ` : '<p class="muted" style="text-align:center;padding:24px">ยังไม่มีพนักงานในระบบ — Import ข้อมูลพนักงานก่อน</p>'}`;
  const foot = `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
    <button class="btn btn-primary" onclick="window.saveApproverModal()">บันทึก</button>`;
  window.openModal('ตั้งค่าผู้อนุมัติลา', body, foot);
};
// กรองรายชื่อผู้บริหารตามคำค้น
window.filterApprExec = (q) => {
  const kw = (q || '').trim().toLowerCase();
  $$('#apprExecList .appr-exec-item').forEach(it => {
    it.style.display = (!kw || (it.dataset.search || '').includes(kw)) ? '' : 'none';
  });
};
window.saveApproverModal = () => {
  const dept = ($('#am_dept') && $('#am_dept').value) || state.approverDept;
  if (!dept) return;
  if (!state.leaveApprovers[dept]) state.leaveApprovers[dept] = {};
  const allEmps = (state.employees || []);
  const toCode = (text) => {
    const t = (text || '').trim();
    if (!t) return '';
    const head = t.split('|')[0].trim().toUpperCase();
    if (allEmps.find(e => (e.emp_code || '').toUpperCase() === head)) return head;
    const low = t.toLowerCase();
    const byCode = allEmps.find(e => (e.emp_code || '').toLowerCase() === low);
    if (byCode) return byCode.emp_code;
    const byName = allEmps.find(e => `${e.first_name} ${e.last_name}`.toLowerCase() === low);
    if (byName) return byName.emp_code;
    const partial = allEmps.find(e => `${e.emp_code} ${e.first_name} ${e.last_name} ${e.department_name || ''}`.toLowerCase().includes(low));
    return partial ? partial.emp_code : '';
  };
  let invalid = false;
  $$('#modal [data-appr-single]').forEach(inp => {
    const level = inp.dataset.apprSingle, raw = inp.value.trim();
    if (!raw) { delete state.leaveApprovers[dept][level]; return; }
    const code = toCode(raw);
    if (code) state.leaveApprovers[dept][level] = code;
    else { invalid = true; delete state.leaveApprovers[dept][level]; }
  });
  const execCodes = $$('#apprExecList [data-appr-exec]:checked').map(c => c.value);
  if (execCodes.length) state.leaveApprovers[dept].EXECUTIVE = execCodes;
  else delete state.leaveApprovers[dept].EXECUTIVE;
  const modeEl = $('#modal input[name="apprMode"]:checked');
  state.leaveApprovers[dept].approval_mode = modeEl ? modeEl.value : 'ANY';
  // สิทธิ์อนุมัติตามประเภทรายการ -> ฟิกให้ทุกประเภท/ทุกระดับ = true เสมอ (ติ๊กครบทุกช่อง)
  const matrix = {};
  LEAVE_TYPE_DEFS.forEach(([k]) => { matrix[k] = { SUPERVISOR: true, MANAGER: true, EXECUTIVE: true }; });
  state.leaveApprovers[dept].typeMatrix = matrix;
  if (invalid) return toast('บางช่อง (หัวหน้างาน/ผู้จัดการ) ระบุไม่ตรงกับพนักงาน กรุณาเลือกจากรายการ', 'err', 4000);
  state.leaveApprovers[dept].saved_at = Date.now();
  njPersistApprovers(dept);
  toast('✅ บันทึกผู้อนุมัติสำเร็จ', 'ok');
  showApproverSummaryModal(dept);   // แสดง Summary Card ทันทีใน Modal เดิม
};
// แสดง Summary Card ภายใน Modal (หลังบันทึก)
function showApproverSummaryModal(dept) {
  const allEmps = (state.employees || []);
  const cfg = state.leaveApprovers[dept] || {};
  const foot = `<button class="btn btn-ghost" onclick="window.openApproverModal('${dept}')">แก้ไขอีกครั้ง</button>
    <button class="btn btn-primary" onclick="window.closeApproverModalDone()">เสร็จสิ้น</button>`;
  window.openModal('สรุปผู้อนุมัติ', approverSummaryHTML(dept, cfg, allEmps, false), foot);
}
window.closeApproverModalDone = () => { window.closeModal(); renderApproverSettings(); };

/* ---- Header-only card (หน้าหลัก: โชว์เฉพาะกรอบแดง + ปุ่มแก้ไข • รายละเอียดดูใน Modal) ---- */
function approverHeaderCard(dept, cfg) {
  return `
  <div class="appr-summary" style="border:1px solid var(--line);border-radius:14px;overflow:hidden">
    <div style="background:var(--red);color:#fff;padding:12px 16px;font-weight:700;display:flex;align-items:center;justify-content:space-between;gap:8px">
      <span>✅ ตั้งค่าผู้อนุมัติสำเร็จ — แผนก ${dept}</span>
      <button class="btn btn-ghost btn-sm" onclick="window.openApproverModal('${dept}')">✏️ แก้ไข</button>
    </div>
  </div>`;
}

/* ---- Summary Card (ใช้ทั้งใน Modal และหน้า ผู้อนุมัติลา) ---- */
function approverSummaryHTML(dept, cfg, allEmps, withEdit) {
  const none = '<span class="muted">— ใช้สิทธิ์ตามตำแหน่ง —</span>';
  const sup = cfg.SUPERVISOR ? apprEmpCodeName(allEmps, cfg.SUPERVISOR) : none;
  const mgr = cfg.MANAGER ? apprEmpCodeName(allEmps, cfg.MANAGER) : none;
  const exec = Array.isArray(cfg.EXECUTIVE) ? cfg.EXECUTIVE : (cfg.EXECUTIVE ? [cfg.EXECUTIVE] : []);
  const execHTML = exec.length ? exec.map(c => `<div>${apprEmpCodeName(allEmps, c)}</div>`).join('') : none;
  const modeLabel = cfg.approval_mode === 'ALL' ? 'ต้องอนุมัติครบทุกคน' : 'อนุมัติ 1 คนผ่าน';
  const block = (color, icon, title, inner) =>
    `<div style="border-left:4px solid ${color};padding-left:12px"><div style="color:${color};font-weight:700">${icon} ${title}</div><div>${inner}</div></div>`;
  // สรุปสิทธิ์ตามประเภทรายการ
  const tm = typeMatrixOf(cfg);
  const typeLines = LEAVE_TYPE_DEFS.map(([k, label]) => {
    const c = tm[k] || {};
    const lv = APPR_LEVELS.filter(([id]) => c[id]).map(([, lbl]) => lbl).join(', ') || '<span class="muted">— ไม่กำหนด —</span>';
    return `<div style="display:flex;gap:8px;font-size:13px"><b style="min-width:120px;font-weight:600">${label}</b><span>${lv}</span></div>`;
  }).join('');
  const editBtn = withEdit
    ? `<button class="btn btn-ghost btn-sm" onclick="window.openApproverModal('${dept}')">✏️ แก้ไข</button>` : '';
  return `
  <div class="appr-summary" style="border:1px solid var(--line);border-radius:14px;overflow:hidden">
    <div style="background:var(--red);color:#fff;padding:12px 16px;font-weight:700;display:flex;align-items:center;justify-content:space-between;gap:8px">
      <span>✅ ตั้งค่าผู้อนุมัติสำเร็จ — แผนก ${dept}</span>${editBtn}</div>
    <div style="padding:14px 16px;display:flex;flex-direction:column;gap:12px">
      ${block('#2563eb', '👤', 'หัวหน้างานอนุมัติ', sup)}
      ${block('#ea580c', '👨‍💼', 'ผู้จัดการอนุมัติ', mgr)}
      ${block('#16a34a', '🏢', 'ผู้บริหารอนุมัติ', execHTML)}
      ${block('var(--red)', '📋', 'รูปแบบการอนุมัติ', modeLabel)}
      ${block('#6b7280', '🗂', 'สิทธิ์อนุมัติตามประเภทรายการ', `<div style="display:flex;flex-direction:column;gap:4px;margin-top:4px">${typeLines}</div>`)}
      ${block('#6b7280', '🕒', 'วันที่บันทึก', fmtSavedAt(cfg.saved_at))}
    </div>
  </div>`;
}
// เปิดให้เรียกใช้ได้ภายหลังโดยไม่แก้ระบบเดิม
window.NJ = window.NJ || {};
window.NJ.leaveApproverConfig = (dept) => { return (state.leaveApprovers && state.leaveApprovers[dept]) || null; };

/* ---- HOLIDAYS (วันหยุด) — Auto วันหยุดราชการไทย + เพิ่ม/แก้ไข/ลบ -----------
 * เก็บใน localStorage('nj_holidays') แยกอิสระ • ไม่แตะ พนักงาน/เงินเดือน/ลงเวลา/GPS/สแกนหน้า/สิทธิ์
 * วันที่ตายตัวทุกปี = ใส่วันจริงแม่นยำ • วันจันทรคติ (มาฆบูชา/วิสาขบูชา) = เว้นวันที่ให้ผู้ดูแลระบุเอง (กันมั่ว)
 * ------------------------------------------------------------------------- */
const HOLIDAY_TYPES = { GOV: 'วันหยุดราชการ', COMPANY: 'วันหยุดบริษัท', SPECIAL: 'วันหยุดพิเศษ' };
// สร้างวันหยุดราชการไทยของปีที่กำหนด (เฉพาะรายการตามสเปก)
function seedThaiHolidays(year) {
  const fixed = [
    ['01-01', 'วันขึ้นปีใหม่'],
    ['04-06', 'วันจักรี'],
    ['04-13', 'วันสงกรานต์'],
    ['04-14', 'วันสงกรานต์'],
    ['04-15', 'วันสงกรานต์'],
    ['05-01', 'วันแรงงานแห่งชาติ'],
    ['05-04', 'วันฉัตรมงคล'],
    ['08-12', 'วันแม่แห่งชาติ'],
    ['10-23', 'วันปิยมหาราช'],
    ['12-05', 'วันพ่อแห่งชาติ'],
    ['12-10', 'วันรัฐธรรมนูญ'],
    ['12-31', 'วันสิ้นปี'],
  ].map(([md, name], i) => ({ id: 'hf' + year + i, name, date: `${year}-${md}`, type: 'GOV' }));
  // จันทรคติ — เปลี่ยนทุกปี: สร้างชื่อไว้ แต่เว้นวันที่ (ผู้ดูแลกำหนดเอง) เพื่อไม่ใส่วันที่ผิด
  const lunar = ['วันมาฆบูชา', 'วันวิสาขบูชา']
    .map((name, i) => ({ id: 'hl' + year + i, name, date: '', type: 'GOV', lunar: true }));
  return [...fixed, ...lunar];
}
function loadHolidays() {
  try { const s = localStorage.getItem('nj_holidays'); if (s) return JSON.parse(s); } catch (_) {}
  return null;
}
function saveHolidaysStore() {
  try { localStorage.setItem('nj_holidays', JSON.stringify(state.holidays || [])); } catch (_) {}
  if (window.NJ && NJ.cloudSaveSetting) NJ.cloudSaveSetting('holidays', state.holidays || []);
}
// โหลดครั้งแรก: ถ้าไม่มีที่บันทึกไว้ -> สร้างวันหยุดราชการไทยปีปัจจุบันอัตโนมัติ
function ensureHolidays() {
  if (!state.holidays) {
    const saved = loadHolidays();
    if (saved && Array.isArray(saved)) state.holidays = saved;
    else { state.holidays = seedThaiHolidays(new Date().getFullYear()); saveHolidaysStore(); }
  }
}
function renderHolidaySettings() {
  ensureHolidays();
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const thDate = (iso) => {
    if (!iso) return '<span class="muted">ยังไม่กำหนดวันที่ (จันทรคติ — โปรดแก้ไข)</span>';
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    return `${d} ${months[m - 1]} ${y + 543}`;
  };
  const typeBadge = (t) => {
    const map = { GOV: ['badge green', HOLIDAY_TYPES.GOV], COMPANY: ['badge blue', HOLIDAY_TYPES.COMPANY], SPECIAL: ['badge amber', HOLIDAY_TYPES.SPECIAL] };
    const [cls, label] = map[t] || map.GOV;
    return `<span class="${cls}">${label}</span>`;
  };
  const sorted = [...(state.holidays || [])].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  const yearBE = new Date().getFullYear() + 543;
  $('#setContent').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px">
      <p class="muted" style="margin:0">วันหยุดราชการไทยปี ${yearBE} ถูกสร้างอัตโนมัติ • ผู้ดูแลเพิ่ม / แก้ไข / ลบได้เอง</p>
      <button class="btn btn-primary btn-sm" onclick="window.holidayModal()">+ เพิ่มวันหยุด</button>
    </div>
    <div class="set-list">${sorted.length ? sorted.map(h => `
      <div class="set-item">
        <div class="set-ic" style="background:linear-gradient(135deg,#EF4444,#DC2626)">🗓</div>
        <div class="set-body"><b>${h.name}</b><div class="muted" style="font-size:12.5px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">${thDate(h.date)} ${typeBadge(h.type)}</div></div>
        <button class="set-edit" onclick="window.holidayModal('${h.id}')" title="แก้ไข">✏️</button>
        <button class="set-edit" onclick="window.deleteHoliday('${h.id}')" title="ลบ" style="color:var(--red)">🗑️</button>
      </div>`).join('') : '<p class="muted" style="text-align:center;padding:20px">ยังไม่มีวันหยุด</p>'}</div>`;
}
// Modal: เพิ่ม/แก้ไขวันหยุด (ชื่อวันหยุด / วันที่ / ประเภท / บันทึก)
window.holidayModal = (id) => {
  ensureHolidays();
  const h = id ? ((state.holidays || []).find(x => x.id === id) || {}) : {};
  const typeOpts = Object.keys(HOLIDAY_TYPES).map(k => `<option value="${k}" ${h.type === k ? 'selected' : ''}>${HOLIDAY_TYPES[k]}</option>`).join('');
  const safe = (h.name || '').replace(/"/g, '&quot;');
  const body = `
    <div class="field"><label>ชื่อวันหยุด</label><input class="input" id="hdName" value="${safe}" placeholder="เช่น วันหยุดบริษัท / วันหยุดพิเศษ" autocomplete="off"/></div>
    <div class="field"><label>วันที่</label><input class="input" id="hdDate" type="date" value="${h.date || ''}"/></div>
    <div class="field"><label>ประเภท</label><select class="input" id="hdType">${typeOpts}</select></div>`;
  const foot = `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
    <button class="btn btn-primary" onclick="window.saveHoliday(${id ? `'${id}'` : 'null'})">บันทึก</button>`;
  window.openModal(id ? 'แก้ไขวันหยุด' : 'เพิ่มวันหยุด', body, foot);
};
window.saveHoliday = (id) => {
  ensureHolidays();
  const name = ($('#hdName').value || '').trim();
  const date = ($('#hdDate').value || '').trim();
  const type = $('#hdType').value || 'GOV';
  if (!name) return toast('กรุณากรอกชื่อวันหยุด', 'err');
  if (id) {
    const h = (state.holidays || []).find(x => x.id === id);
    if (h) { h.name = name; h.date = date; h.type = type; delete h.lunar; }
  } else {
    state.holidays.push({ id: 'h' + Date.now(), name, date, type });
  }
  saveHolidaysStore();
  window.closeModal();
  renderHolidaySettings();
  toast('บันทึกวันหยุดเรียบร้อย', 'ok');
};
window.deleteHoliday = (id) => {
  ensureHolidays();
  const h = (state.holidays || []).find(x => x.id === id);
  window.openModal('ลบวันหยุด',
    `<p>ต้องการลบ "<b>${h ? h.name : ''}</b>" ใช่หรือไม่? (ไม่กระทบวันหยุดอื่น)</p>`,
    `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
     <button class="btn btn-primary" style="background:var(--red)" onclick="window.confirmDeleteHoliday('${id}')">ลบ</button>`);
};
window.confirmDeleteHoliday = (id) => {
  state.holidays = (state.holidays || []).filter(x => x.id !== id);
  saveHolidaysStore();
  window.closeModal();
  renderHolidaySettings();
  toast('ลบวันหยุดแล้ว', 'ok');
};
// เปิดให้ระบบอื่นเรียกใช้ได้ (อนาคต) โดยไม่แก้ระบบเดิม — ดึงรายการ/ตรวจว่าวันนั้นเป็นวันหยุด
window.NJ = window.NJ || {};
window.NJ.holidays = () => (state.holidays || []);
window.NJ.isHoliday = (iso) => (state.holidays || []).some(h => h.date && h.date === iso);

/* ---- USER MANAGEMENT ------------------------------------------------------ */
async function renderUsers() {
  // โหลดผู้ใช้จริงจาก app_users (salary) ครั้งแรก แล้ว cache ไว้ใน state
  if (!state.appUsers) {
    try { state.appUsers = await Data.appUsers(); }
    catch (e) { state.appUsers = NJ.DEMO.users || []; }
  }
  const kw = (state.usersKw || '').trim().toLowerCase();
  const users = (state.appUsers || []).filter(u => {
    if (!kw) return true;
    return `${u.full_name || ''} ${u.username || ''} ${u.email || ''} ${roleLabel(u.role)}`.toLowerCase().includes(kw);
  });
  const avGrads = ['linear-gradient(135deg,#1f2937,#111827)', 'linear-gradient(135deg,#22C55E,#16A34A)', 'linear-gradient(135deg,#9333EA,#7C3AED)', 'linear-gradient(135deg,#EF4444,#DC2626)', 'linear-gradient(135deg,#3B82F6,#2563EB)'];
  const accents = ['#DC2626', '#16A34A', '#7C3AED', '#2563EB', '#F59E0B'];
  const roleBadge = (role) => {
    const r = role === 'SUPER_ADMIN' || role === 'ADMIN' ? 'um-role-red'
      : (role === 'MANAGER' || role === 'HR' || role === 'ACCOUNT') ? 'um-role-blue' : 'um-role-purple';
    return `<span class="um-role ${r}">${roleLabel(role)}</span>`;
  };
  const PAGE = 9;   // จัดการสมาชิก: 9 คน/หน้า
  const totalPages = Math.max(1, Math.ceil(users.length / PAGE));
  if (!state.usersPage || state.usersPage > totalPages) state.usersPage = 1;
  const pg = state.usersPage;
  const startIdx = (pg - 1) * PAGE;
  const pageUsers = users.slice(startIdx, startIdx + PAGE);
  const isSuper = String(Auth.current?.role || '').toUpperCase() === 'SUPER_ADMIN';
  const rows = pageUsers.map((u, idx) => {
    const i = startIdx + idx;
    const pw = String(u.password ?? '');
    const pwCell = isSuper ? `
      <div class="um-pw">
        <span class="um-pw-val" data-pw="${encodeURIComponent(pw)}" data-shown="0">••••••••</span>
        <button class="um-act eye" title="ดู/ซ่อนรหัสผ่าน" onclick="window.umTogglePw(this)">👁</button>
      </div>` : '';
    return `
    <div class="um-row${isSuper ? ' has-pw' : ''}" style="--um-accent:${accents[i % accents.length]}">
      <div class="um-member">
        <div class="um-avatar" style="background:${avGrads[i % avGrads.length]}">${(u.full_name || u.username || '?').trim().charAt(0)}</div>
        <div><b>${u.full_name}</b></div>
      </div>
      <div class="um-email">${u.email}</div>
      ${pwCell}
      <div>${roleBadge(u.role)}</div>
      <div><span class="um-status">● ใช้งาน</span></div>
      <div class="um-acts">
        <button class="um-act edit" onclick="window.toast('แก้ไขสมาชิก')" title="แก้ไข">✏️</button>
        ${isSuper ? `<button class="um-act key" onclick="window.umChangePw('${u.id}','${(u.username||'').replace(/'/g,'')}' )" title="แก้ไขรหัสผ่าน">🔑</button>` : ''}
      </div>
    </div>`;
  }).join('');
  $('#view').innerHTML = `
    <div class="lv-banner mb" style="gap:14px;flex-wrap:wrap">
      <div class="lv-banner-ic">👥</div>
      <div style="flex:1;min-width:150px"><h2 style="margin:0;font-size:21px;font-weight:800">จัดการสมาชิก</h2>
        <p class="muted" style="margin:1px 0 0;font-size:12.5px">จัดการข้อมูลสมาชิกในระบบ</p></div>
      <input class="input" id="usersSearchBox" style="width:260px;height:40px" placeholder="🔍 ค้นหาชื่อ, รหัสพนักงาน, แผนก" value="${state.usersKw || ''}"/>
      <button class="btn btn-primary btn-sm" onclick="window.userForm()">+ เพิ่มสมาชิก</button>
    </div>
    <div class="um-head um-compact${isSuper ? ' has-pw' : ''}">
      <div>สมาชิก</div><div>อีเมล</div>${isSuper ? '<div>รหัสผ่าน</div>' : ''}<div>สิทธิ์</div><div>สถานะ</div><div>จัดการ</div>
    </div>
    <div class="um-list um-compact">${rows}</div>
    ${pager(pg, totalPages)}`;
  $('#view').classList.add('users-compact');
  $$('#view .pager [data-page]').forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.page;
    if (v === 'prev') state.usersPage = Math.max(1, pg - 1);
    else if (v === 'next') state.usersPage = Math.min(totalPages, pg + 1);
    else state.usersPage = Number(v);
    renderUsers();
  }));
  const usb = $('#usersSearchBox');
  if (usb) usb.addEventListener('input', e => {
    state.usersKw = e.target.value;
    state.usersPage = 1;
    renderUsers();
    const box = $('#usersSearchBox');
    if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); }
  });
}
window.userForm = () => openModal('เพิ่มสมาชิก', `
  <div class="form-grid">
    <div><label class="form-label">ชื่อผู้ใช้ (lowercase) <span class="req">*</span></label><input class="input" id="nu_user" placeholder="soontaree"/></div>
    <div><label class="form-label">อีเมล</label><input class="input" id="nu_email" placeholder="soontaree01@salary.app"/></div>
    <div><label class="form-label">ชื่อ-สกุล</label><input class="input" id="nu_name"/></div>
    <div><label class="form-label">สิทธิ์</label><select class="input" id="nu_role"><option>EMPLOYEE</option><option>HR</option><option>ACCOUNT</option><option>MANAGER</option><option>ADMIN</option><option>SUPER_ADMIN</option></select></div>
    <div><label class="form-label">รหัสผ่าน <span class="req">*</span></label><input class="input" type="password" id="nu_pass"/></div>
  </div>`,
  `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
   <button class="btn btn-primary" onclick="window.saveUser()">บันทึก</button>`);
window.saveUser = () => {
  const raw = $('#nu_user').value;
  const norm = Norm.username(raw);
  closeModal();
  toast(`บันทึกสมาชิก "${norm}" (username ถูกแปลงเป็นตัวเล็กอัตโนมัติ)`, 'ok', 3500);
};

// ── จัดการรหัสผ่านในหน้าจัดการสมาชิก (เฉพาะ SUPER_ADMIN) ──────────────────
// แสดง/ซ่อนรหัสผ่านในแถว
window.umTogglePw = (btn) => {
  const span = btn.parentElement.querySelector('.um-pw-val');
  if (!span) return;
  const shown = span.dataset.shown === '1';
  if (shown) { span.textContent = '••••••••'; span.dataset.shown = '0'; btn.textContent = '👁'; }
  else { span.textContent = decodeURIComponent(span.dataset.pw || ''); span.dataset.shown = '1'; btn.textContent = '🙈'; }
};
// เปลี่ยนรหัสผ่าน → บันทึกลง Supabase จริง
window.umChangePw = (userId, username) => {
  openModal('แก้ไขรหัสผ่าน — ' + username, `
    <div class="form-grid">
      <div><label class="form-label">รหัสผ่านใหม่ <span class="req">*</span></label>
        <input class="input" id="um_newpw" type="text" placeholder="พิมพ์รหัสผ่านใหม่" autocomplete="off"/></div>
    </div>
    <p class="muted" style="font-size:12px;margin-top:8px">⚠️ รหัสจะถูกบันทึกลงระบบทันที (เฉพาะระบบ Salary)</p>`,
    `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
     <button class="btn btn-primary" onclick="window.umSavePw('${userId}')">บันทึกรหัสผ่าน</button>`);
};
window.umSavePw = async (userId) => {
  const np = ($('#um_newpw')?.value || '').trim();
  if (!np) return toast('กรุณากรอกรหัสผ่านใหม่', 'err');
  const res = await Data.updatePassword(userId, np);
  if (res?.error) return toast('บันทึกไม่สำเร็จ: ' + res.error, 'err', 4000);
  // อัปเดต cache ในหน่วยความจำให้ตรงกับที่บันทึก
  if (state.appUsers) { const u = state.appUsers.find(x => String(x.id) === String(userId)); if (u) u.password = np; }
  closeModal();
  toast('เปลี่ยนรหัสผ่านเรียบร้อย', 'ok');
  renderUsers();
};
// แผนก + ตำแหน่งตามแผนก (cascade) สำหรับฟอร์มเพิ่มพนักงาน
const EMP_DEPARTMENTS = ['ACCOUNT','CUSTOMER SERVICE EXPORT','CUSTOMER SERVICE IMPORT','MAID','MANAGER','SHIPPING AIRPORT','SHIPPING BKK','SHIPPING LBK','SHIPPING LCB'];
const DEPARTMENT_POSITION_MAP = {
  'ACCOUNT': ['Accountant','Senior Accountant','Accounting Manager'],
  'CUSTOMER SERVICE EXPORT': ['CS Export','Senior CS Export','CS Export Supervisor'],
  'CUSTOMER SERVICE IMPORT': ['CS Import','Senior CS Import','CS Import Supervisor'],
  'SHIPPING AIRPORT': ['Shipping Airport Officer','Shipping Airport Supervisor'],
  'SHIPPING BKK': ['Shipping BKK Officer','Shipping BKK Supervisor'],
  'SHIPPING LBK': ['Shipping LBK Officer','Shipping LBK Supervisor'],
  'SHIPPING LCB': ['Shipping LCB Officer','Shipping LCB Supervisor'],
  'MANAGER': ['Manager','Assistant Manager','General Manager'],
  'MAID': ['Maid'],
};
// โหลดตำแหน่งของแผนก: รวม base map + ตำแหน่งจริงจาก state.employees (ไม่ซ้ำ ไม่ว่าง)
window.onEmpDeptChange = () => {
  const dept = $('#ef_dept')?.value || '';
  const posSel = $('#ef_pos');
  if (!posSel) return;
  if (!dept) {
    posSel.innerHTML = '<option value="">กรุณาเลือกแผนกก่อน</option>';
    posSel.disabled = true;
    return;
  }
  const basePositions = DEPARTMENT_POSITION_MAP[dept] || [];
  const realPositions = (state.employees || [])
    .filter(e => e.department_name === dept)
    .map(e => e.position_name)
    .filter(Boolean);
  const positions = [...new Set([...basePositions, ...realPositions])].filter(Boolean).sort();
  posSel.disabled = false;
  posSel.innerHTML = '<option value="">เลือกตำแหน่ง</option>' +
    positions.map(p => `<option value="${p}">${p}</option>`).join('');
};
window.empForm = (code) => {
  const ed = code ? (state.employees || []).find(e => e.emp_code === code) : null;
  const deptOpts = EMP_DEPARTMENTS.map(d => `<option value="${d}">${getDepartmentDisplayName(d)}</option>`).join('');
  const sec = (t) => `<div class="ef-sec">${t}</div>`;
  openModal(ed ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงาน', `
  <div class="form-grid ef-grid">
    ${sec('ข้อมูลทั่วไป')}
    <div><label class="form-label">รหัสพนักงาน <span class="req">*</span></label><input class="input" id="ef_code" placeholder="0001"/></div>
    <div><label class="form-label">คำนำหน้า</label><select class="input" id="ef_prefix"><option value="">-</option><option>นาย</option><option>นาง</option><option>นางสาว</option></select></div>
    <div><label class="form-label">ชื่อ <span class="req">*</span></label><input class="input" id="ef_fn"/></div>
    <div><label class="form-label">นามสกุล <span class="req">*</span></label><input class="input" id="ef_ln"/></div>
    <div><label class="form-label">ชื่อภาษาอังกฤษ</label><input class="input" id="ef_fnen"/></div>
    <div><label class="form-label">นามสกุลภาษาอังกฤษ</label><input class="input" id="ef_lnen"/></div>
    <div><label class="form-label">ชื่อเล่น</label><input class="input" id="ef_nick"/></div>

    ${sec('ข้อมูลส่วนตัว')}
    <div><label class="form-label">เลขบัตรประชาชน</label><input class="input" id="ef_idcard"/></div>
    <div><label class="form-label">วันเกิด</label><input type="date" class="input" id="ef_birth"/></div>
    <div><label class="form-label">เพศ</label><select class="input" id="ef_gender"><option value="">-</option><option>ชาย</option><option>หญิง</option></select></div>
    <div><label class="form-label">เบอร์โทรศัพท์</label><input class="input" id="ef_phone"/></div>
    <div><label class="form-label">อีเมลส่วนตัว</label><input class="input" id="ef_email"/></div>
    <div><label class="form-label">ที่อยู่</label><input class="input" id="ef_address"/></div>

    ${sec('ข้อมูลการทำงาน')}
    <div><label class="form-label">แผนก <span class="req">*</span></label><select class="input" id="ef_dept" onchange="window.onEmpDeptChange()"><option value="">-</option>${deptOpts}</select></div>
    <div><label class="form-label">ตำแหน่ง <span class="req">*</span></label><select class="input" id="ef_pos" disabled><option value="">กรุณาเลือกแผนกก่อน</option></select></div>
    <div><label class="form-label">สถานะพนักงาน <span class="req">*</span></label><select class="input" id="ef_status"><option value="ACTIVE">ทำงาน</option><option value="RESIGNED">ลาออก</option><option value="SUSPENDED">พักงาน</option></select></div>
    <div><label class="form-label">วันที่เริ่มงาน</label><input type="date" class="input" id="ef_start"/></div>
    <div><label class="form-label">วันที่ลาออก</label><input type="date" class="input" id="ef_resign"/></div>
    <div><label class="form-label">ระยะเวลาทดลองงาน (วัน)</label><input type="number" class="input" id="ef_prob"/></div>
    <div><label class="form-label">วันที่ผ่านทดลองงาน</label><input type="date" class="input" id="ef_probpass"/></div>

    ${sec('ข้อมูลเงินเดือน')}
    <div><label class="form-label">ประเภทเงินเดือน</label><select class="input" id="ef_saltype"><option value="MONTHLY">รายเดือน</option><option value="DAILY">รายวัน</option><option value="CONTRACT">เหมาจ่าย</option></select></div>
    <div><label class="form-label">ช่องทางการจ่าย</label><select class="input" id="ef_pay"><option value="BANK">โอนเข้าบัญชี</option><option value="CASH">เงินสด</option></select></div>
    <div><label class="form-label">ฐานเงินเดือน <span class="req">*</span></label><input type="number" class="input" id="ef_salary"/></div>
    <div><label class="form-label">ค่าตำแหน่ง</label><input type="number" class="input" id="ef_posallow"/></div>
    <div><label class="form-label">ค่าโทรศัพท์</label><input type="number" class="input" id="ef_phoneallow"/></div>
    <div><label class="form-label">ค่าเดินทาง</label><input type="number" class="input" id="ef_travel"/></div>
    <div><label class="form-label">ค่าน้ำมัน</label><input type="number" class="input" id="ef_fuel"/></div>

    ${sec('รายการรับ')}
    <div><label class="form-label">ค่าเบี้ยขยัน</label><input type="number" class="input" id="ef_dil"/></div>
    <div><label class="form-label">ค่ากะ</label><input type="number" class="input" id="ef_shift"/></div>

    ${sec('รายการหัก')}
    <div><label class="form-label">หักปกส.5%</label><input type="number" class="input" id="ef_sso" placeholder="เว้นว่าง = คำนวณอัตโนมัติ"/></div>
    <div><label class="form-label">หักกยศ.</label><input type="number" class="input" id="ef_loan"/></div>

    ${sec('ข้อมูลธนาคาร')}
    <div><label class="form-label">ธนาคาร</label><input class="input" id="ef_bank"/></div>
    <div><label class="form-label">เลขบัญชี</label><input class="input" id="ef_acc"/></div>
    <div><label class="form-label">ชื่อบัญชี</label><input class="input" id="ef_accname"/></div>
  </div>`,
  `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
   <button class="btn btn-primary" onclick="window.saveNewEmployee(${ed ? `'${code}'` : ''})">${ed ? 'บันทึกการแก้ไข' : 'บันทึก'}</button>`,
  'employee-modal');

  // โหมดแก้ไข: เติมค่าเดิมลงในฟอร์ม
  if (ed) {
    const setV = (id, v) => { const x = $('#' + id); if (x) x.value = (v == null ? '' : v); };
    setV('ef_code', ed.emp_code); const codeEl = $('#ef_code'); if (codeEl) codeEl.readOnly = true;
    setV('ef_prefix', ed.prefix); setV('ef_fn', ed.first_name); setV('ef_ln', ed.last_name);
    setV('ef_fnen', ed.first_name_en); setV('ef_lnen', ed.last_name_en); setV('ef_nick', ed.nickname);
    setV('ef_idcard', ed.national_id || ed.id_card); setV('ef_birth', ed.birth_date); setV('ef_gender', ed.gender);
    setV('ef_phone', ed.phone); setV('ef_email', ed.email); setV('ef_address', ed.address);
    setV('ef_dept', ed.department_name); window.onEmpDeptChange(); setV('ef_pos', ed.position_name);
    setV('ef_status', ed.status); setV('ef_start', ed.start_date); setV('ef_resign', ed.resign_date);
    setV('ef_prob', ed.probation_days); setV('ef_probpass', ed.probation_pass_date);
    setV('ef_saltype', ed.salary_type); setV('ef_pay', ed.payment_method);
    setV('ef_salary', ed.base_salary); setV('ef_posallow', ed.position_allow);
    setV('ef_phoneallow', ed.phone_allow); setV('ef_travel', ed.travel_allow); setV('ef_fuel', ed.fuel_allow);
    setV('ef_dil', ed.diligence_allow);
    const mx = (state.payrollMonthly || {})[ed.emp_code] || {};
    setV('ef_shift', mx['ค่ากะ']); setV('ef_sso', mx['หักปกส.5%']); setV('ef_loan', mx['หักกยศ.']);
    setV('ef_bank', ed.bank_name); setV('ef_acc', ed.bank_account); setV('ef_accname', ed.bank_account_name || ed.account_name);
  }
};

window.saveNewEmployee = async (editCode) => {
  const val = (id) => { const el = $('#' + id); return el ? el.value.trim() : ''; };
  const n = (id) => Number(val(id) || 0);
  const emp = {
    emp_code: val('ef_code'), prefix: val('ef_prefix'),
    first_name: val('ef_fn'), last_name: val('ef_ln'),
    first_name_en: val('ef_fnen'), last_name_en: val('ef_lnen'), nickname: val('ef_nick'),
    id_card: val('ef_idcard'), birth_date: val('ef_birth'), gender: val('ef_gender'),
    phone: val('ef_phone'), email: val('ef_email'), address: val('ef_address'),
    department_name: val('ef_dept'), position_name: val('ef_pos'), status: val('ef_status'),
    start_date: val('ef_start'), resign_date: val('ef_resign'),
    probation_days: n('ef_prob'), probation_pass_date: val('ef_probpass'),
    salary_type: val('ef_saltype'), payment_method: val('ef_pay'),
    base_salary: n('ef_salary'), position_allow: n('ef_posallow'),
    diligence_allow: n('ef_dil'), phone_allow: n('ef_phoneallow'),
    travel_allow: n('ef_travel'), fuel_allow: n('ef_fuel'),
    bank_name: val('ef_bank'), bank_account: val('ef_acc'), account_name: val('ef_accname'),
  };
  // รายการรับ/หักรายเดือน (employees ไม่มีคอลัมน์เหล่านี้ -> เก็บเข้าตัวคำนวณเงินเดือนรายเดือน)
  const monthlyExtra = {};
  const _shift = n('ef_shift'), _sso = n('ef_sso'), _loan = n('ef_loan');
  if (_shift) monthlyExtra['ค่ากะ'] = _shift;
  if (_sso) monthlyExtra['หักปกส.5%'] = _sso;
  if (_loan) monthlyExtra['หักกยศ.'] = _loan;
  // validation: แผนก/ตำแหน่ง ต้องเลือก (ไม่ว่าง ไม่ใช่ '-')
  if (!emp.department_name || emp.department_name === '-' || !emp.position_name || emp.position_name === '-') {
    return toast('กรุณาเลือกแผนกและตำแหน่ง', 'err', 3500);
  }
  // validation: บังคับกรอกช่องอื่นๆ
  if (!emp.emp_code || !emp.first_name || !emp.last_name || !emp.status || !emp.base_salary) {
    return toast('กรุณากรอกข้อมูลพนักงานให้ครบ', 'err', 3500);
  }
  if (editCode) emp.emp_code = editCode;
  emp.emp_code = emp.emp_code.padStart(4, '0');
  const res = await Data.saveEmployee(emp);
  if (!res.ok) return toast('บันทึกไม่สำเร็จ: ' + (res.error || ''), 'err', 4000);
  // เก็บรายการรับ/หักรายเดือนของพนักงานคนนี้ (ไม่กระทบ schema)
  if (Object.keys(monthlyExtra).length) {
    if (!state.payrollMonthly) state.payrollMonthly = {};
    state.payrollMonthly[emp.emp_code] = { ...(state.payrollMonthly[emp.emp_code] || {}), ...monthlyExtra };
  }
  closeModal();
  state.employees = await Data.employees();
  renderEmployees(state.employeeSearch || '');
  toast(editCode ? 'แก้ไขพนักงานสำเร็จ' : 'เพิ่มพนักงานสำเร็จ', 'ok');
};

// ลบพนักงาน — ยืนยันก่อน
window.empDelete = (code) => {
  const e = (state.employees || []).find(x => x.emp_code === code);
  const name = e ? `${e.first_name} ${e.last_name}`.trim() : code;
  openModal('ยืนยันการลบพนักงาน',
    `<p style="line-height:1.7">ต้องการลบพนักงาน <b>${name}</b> (${code}) ใช่หรือไม่?<br>
     <span class="muted">การลบไม่สามารถย้อนกลับได้</span></p>`,
    `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
     <button class="btn btn-primary" onclick="window.empDeleteConfirm('${code}')">ลบ</button>`);
};
window.empDeleteConfirm = async (code) => {
  const res = await Data.deleteEmployee(code);
  if (!res.ok) return toast('ลบไม่สำเร็จ: ' + (res.error || ''), 'err', 4000);
  if (state.payrollMonthly) delete state.payrollMonthly[code];
  closeModal();
  state.employees = await Data.employees();
  renderEmployees(state.employeeSearch || '');
  toast('ลบพนักงานสำเร็จ', 'ok');
};

/* ============================================================================
 * เบี้ยขยัน (diligence) — AUTO/MANUAL + แก้ไขในรายชื่อพนักงาน + Audit Log
 * ========================================================================== */
// นับพฤติกรรมในเดือน (best-effort จากข้อมูลที่โหลดไว้: state.leaves / state.attendance)
function diligenceCounts(emp) {
  let personalLeaveDays = 0, lateCount = 0, absentCount = 0;
  const id = emp.id, code = emp.emp_code;
  const mine = (r) => (r.employee_id != null && r.employee_id === id) || (r.emp_code && r.emp_code === code);
  (state.leaves || []).forEach(l => {
    if (!mine(l)) return;
    const t = String(l.leave_type || l.type || '').toUpperCase();
    if (t === 'PERSONAL') personalLeaveDays += Number(l.total_days || l.days || 0);
  });
  (state.attendance || []).forEach(a => {
    if (!mine(a)) return;
    const s = String(a.status || '').toUpperCase();
    if (s === 'LATE') lateCount++; else if (s === 'ABSENT') absentCount++;
  });
  return { personalLeaveDays, lateCount, absentCount };
}
// ค่าเบี้ยขยันที่ใช้จริง: MANUAL = ค่าที่กรอก / AUTO = คำนวณตามกฎ
function diligenceEffective(emp) {
  if (String(emp.diligence_mode || 'AUTO') === 'MANUAL') return Number(emp.diligence_allow || 0);
  return NJ.Data.computeDiligence(diligenceCounts(emp));
}

window.diligenceForm = (code) => {
  if (!Auth.canEditDiligence()) return toast('ไม่มีสิทธิ์แก้ไขเบี้ยขยัน (เฉพาะ Super Admin / Admin / HR)', 'err', 4000);
  const e = (state.employees || []).find(x => x.emp_code === code);
  if (!e) return;
  const mode = String(e.diligence_mode || 'AUTO');
  const auto = NJ.Data.computeDiligence(diligenceCounts(e));
  const curVal = mode === 'MANUAL' ? Number(e.diligence_allow || 0) : auto;
  openModal(`แก้ไขเบี้ยขยัน • ${e.first_name} ${e.last_name} (${e.emp_code})`, `
    <div class="form-row">
      <div><label class="form-label">โหมด</label>
        <select class="input" id="dg_mode">
          <option value="AUTO" ${mode === 'AUTO' ? 'selected' : ''}>AUTO (คำนวณอัตโนมัติ)</option>
          <option value="MANUAL" ${mode === 'MANUAL' ? 'selected' : ''}>MANUAL (กรอกเอง)</option>
        </select></div>
      <div><label class="form-label">ค่าเบี้ยขยัน (บาท)</label>
        <input type="number" class="input" id="dg_val" value="${curVal}"/></div>
    </div>
    <p class="muted" id="dg_hint" style="margin:8px 0 0;font-size:12px"></p>
    <div class="form-row mt"><div style="grid-column:1/-1">
      <label class="form-label">เหตุผลการแก้ไข</label>
      <input class="input" id="dg_reason" placeholder="เช่น ปรับตามผลการมาทำงาน"/>
    </div></div>`,
    `<button class="btn btn-ghost" onclick="window.closeModal()">ยกเลิก</button>
     <button class="btn btn-primary" onclick="window.saveDiligence('${code}')">บันทึก</button>`);

  const modeSel = $('#dg_mode'), valInp = $('#dg_val'), hint = $('#dg_hint');
  const sync = () => {
    if (modeSel.value === 'AUTO') {
      valInp.value = auto; valInp.readOnly = true; valInp.style.background = 'var(--gray)';
      const c = diligenceCounts(e);
      hint.textContent = `AUTO: ลากิจ ${c.personalLeaveDays} วัน • มาสาย ${c.lateCount} • ขาด ${c.absentCount} → เบี้ยขยัน ${auto} บาท (กรอกเองไม่ได้)`;
    } else {
      valInp.readOnly = false; valInp.style.background = '';
      hint.textContent = 'MANUAL: กรอกค่าที่ต้องการ (เช่น 0 / 300 / 350 / 400 / 500) — ระบบจะใช้ค่านี้แทนการคำนวณ';
    }
  };
  modeSel.addEventListener('change', sync);
  sync();
};

window.saveDiligence = async (code) => {
  if (!Auth.canEditDiligence()) return toast('ไม่มีสิทธิ์แก้ไขเบี้ยขยัน', 'err');
  const e = (state.employees || []).find(x => x.emp_code === code);
  if (!e) return;
  const mode = $('#dg_mode').value === 'MANUAL' ? 'MANUAL' : 'AUTO';
  const oldVal = Number(e.diligence_allow || 0);
  const oldMode = String(e.diligence_mode || 'AUTO');
  const newVal = mode === 'AUTO' ? NJ.Data.computeDiligence(diligenceCounts(e)) : (Number($('#dg_val').value) || 0);
  const reason = ($('#dg_reason') ? $('#dg_reason').value : '').trim();

  const res = await Data.updateDiligence(code, mode, newVal);
  if (!res.ok) return toast('บันทึกไม่สำเร็จ: ' + (res.error || ''), 'err', 4000);
  e.diligence_allow = newVal; e.diligence_mode = mode;     // อัปเดต state ทันที
  await Data.logAudit({
    action: 'UPDATE_DILIGENCE', entity: 'employees',
    detail: { emp_code: code, old_value: oldVal, new_value: newVal, old_mode: oldMode, new_mode: mode, reason },
  });
  closeModal();
  renderEmployees(state.employeeSearch || '');
  toast('บันทึกเบี้ยขยันเรียบร้อย', 'ok');
};

/* ============================================================================
 * EXCEL IMPORT/EXPORT (SheetJS)
 * ========================================================================== */
function readSheet(file) {
  return new Promise((resolve, reject) => {
    if (typeof XLSX === 'undefined') return reject(new Error('ไลบรารี Excel ยังไม่โหลด'));
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
        // normalize: ตัดช่องว่างหน้า-หลังชื่อคอลัมน์ (header ในไฟล์จริงมักมี space ห่อ)
        const clean = raw.map(row => {
          const o = {};
          for (const k in row) o[String(k).trim()] = row[k];
          return o;
        });
        resolve(clean);
      } catch (e) { reject(e); }
    };
    r.onerror = () => reject(new Error('อ่านไฟล์ไม่ได้'));
    r.readAsArrayBuffer(file);
  });
}

window.importEmployeesExcel = async (input) => {
  const f = input.files && input.files[0]; if (!f) return;
  try {
    const rows = await readSheet(f);
    const res = await Data.importEmployees(rows);
    input.value = '';
    if (!res.ok) return toast('นำเข้าไม่สำเร็จ: ' + (res.error || ''), 'err', 4000);
    // เก็บรายการรายเดือนจาก Excel (ค่ากะ/OT/กยศ.) เข้าตัวคำนวณเงินเดือน — ให้หน้าเงินเดือนดึงอัตโนมัติ
    const toNum = (v) => { const n = Number(String(v == null ? '' : v).replace(/,/g, '')); return isNaN(n) ? 0 : n; };
    rows.forEach(r => {
      const code = String(r['รหัสพนักงาน'] || r['emp_code'] || '').trim().padStart(4, '0');
      if (!code || code === '0000') return;
      const m = {};
      const shift = toNum(r['ค่ากะ']); if (shift) m['ค่ากะ'] = shift;
      const ot = toNum(r['ค่าล่วงเวลา']); if (ot) m['ค่าล่วงเวลา'] = ot;
      const loan = toNum(r['หักกยศ'] || r['หักกยศ.']); if (loan) m['หักกยศ.'] = loan;
      if (Object.keys(m).length) {
        if (!state.payrollMonthly) state.payrollMonthly = {};
        state.payrollMonthly[code] = { ...(state.payrollMonthly[code] || {}), ...m };
      }
    });
    state.employees = await Data.employees();
    renderEmployees('');
    toast(`นำเข้าข้อมูลพนักงาน ${res.count} รายการเรียบร้อย`, 'ok', 3500);
  } catch (e) { toast('อ่านไฟล์ไม่สำเร็จ: ' + e.message, 'err', 4000); input.value = ''; }
};
window.exportEmployees = async () => {
  const data = state.employees.map(e => ({
    'รหัสพนักงาน': e.emp_code, 'ชื่อ': e.first_name, 'นามสกุล': e.last_name,
    'แผนก': e.department_name, 'ตำแหน่ง': e.position_name,
    'ธนาคาร': e.bank_name, 'เลขบัญชี': e.bank_account,
    'ฐานเงินเดือน': Number(e.base_salary || 0), 'ค่าตำแหน่ง': Number(e.position_allow || 0),
    'ค่าน้ำมัน': Number(e.fuel_allow || 0), 'ค่าโทรศัพท์': Number(e.phone_allow || 0),
    'ค่าเบี้ยขยัน': Number(e.diligence_allow || 0),
  }));
  if (!data.length) return toast('ไม่มีข้อมูลพนักงานให้ส่งออก', 'err');
  const cols = Object.keys(data[0]);
  const centerCols = ['รหัสพนักงาน', 'แผนก'];
  const textLeftCols = ['ชื่อ', 'นามสกุล', 'ตำแหน่ง', 'ธนาคาร'];
  const codeCols = ['เลขบัญชี'];
  try {
    if (typeof ExcelJS !== 'undefined') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('รายชื่อพนักงาน');
      const ncol = cols.length;
      // แถวชื่อรายงาน (merge กลาง)
      ws.mergeCells(1, 1, 1, ncol);
      const titleCell = ws.getCell(1, 1);
      const now = new Date();
      const stamp = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      titleCell.value = `รายงานพนักงาน • NJ LOGISTIC HR SYSTEM • ส่งออกเมื่อ ${stamp}`;
      titleCell.font = { bold:true, size:13, color:{ argb:'FF8B5A2B' } };
      titleCell.alignment = { horizontal:'center', vertical:'middle' };
      ws.getRow(1).height = 28;
      // หัวตาราง (แถว 2)
      ws.addRow(cols);
      // ข้อมูล
      data.forEach(r => ws.addRow(cols.map(c => r[c] == null ? '' : r[c])));
      const border = { top:{style:'thin',color:{argb:'FF000000'}}, left:{style:'thin',color:{argb:'FF000000'}}, bottom:{style:'thin',color:{argb:'FF000000'}}, right:{style:'thin',color:{argb:'FF000000'}} };
      const head = ws.getRow(2); head.height = 25;
      head.eachCell(cell => {
        cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF8B5A2B' } };
        cell.font = { bold:true, color:{ argb:'FFFFFFFF' }, name:'Tahoma', size:11 };
        cell.alignment = { horizontal:'center', vertical:'middle' };
        cell.border = border;
      });
      for (let i = 0; i < data.length; i++) {
        const row = ws.getRow(i + 3); row.height = 20;
        cols.forEach((c, ci) => {
          const cell = row.getCell(ci + 1);
          cell.border = border; cell.font = { name:'Tahoma', size:10 };
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0.00';
            cell.alignment = { horizontal:'right', vertical:'middle' };
          } else {
            const h = centerCols.includes(c) || codeCols.includes(c) ? 'center' : 'left';
            cell.alignment = { horizontal:h, vertical:'middle' };
          }
        });
      }
      // auto width
      cols.forEach((c, ci) => {
        let maxLen = String(c).length;
        data.forEach(r => {
          const v = r[c];
          const s = typeof v === 'number' ? v.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 }) : String(v == null ? '' : v);
          if (s.length > maxLen) maxLen = s.length;
        });
        ws.getColumn(ci + 1).width = Math.min(35, Math.max(10, maxLen + 2));
      });
      ws.views = [{ state:'frozen', ySplit:2 }];                                   // freeze ชื่อ+หัวตาราง
      ws.autoFilter = { from:{ row:2, column:1 }, to:{ row:2, column:ncol } };     // auto filter ที่หัวตาราง
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'รายงานพนักงาน.xlsx';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
      toast('ส่งออก Excel เรียบร้อย', 'ok');
      return;
    }
    // fallback SheetJS
    if (typeof XLSX === 'undefined') return toast('ไลบรารี Excel ยังไม่พร้อม', 'err');
    const ws = XLSX.utils.json_to_sheet(data);
    const ref = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = ref.s.r + 1; R <= ref.e.r; R++) for (let C = ref.s.c; C <= ref.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r:R, c:C })]; if (cell && cell.t === 'n') cell.z = '#,##0.00';
    }
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'รายงานพนักงาน.xlsx');
    toast('ส่งออก Excel เรียบร้อย', 'ok');
  } catch (e) {
    toast('ส่งออก Excel ไม่สำเร็จ: ' + (e.message || e), 'err', 4000);
  }
};

/* ============================================================================
 * UTILITIES
 * ========================================================================== */
function pager(active, total) {
  let html = '<div class="pager"><button data-page="prev">‹</button>';
  for (let i = 1; i <= Math.min(total, 5); i++) html += `<button data-page="${i}" class="${i === active ? 'active' : ''}">${i}</button>`;
  if (total > 5) html += `<button>…</button><button data-page="${total}" class="${total === active ? 'active' : ''}">${total}</button>`;
  return html + '<button data-page="next">›</button></div>';
}
function todayTH() {
  const m = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const d = new Date();
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear() + 543}`;
}
function thDate(s) {
  if (!s) return '-';
  const m = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const parts = String(s).split('-');
  if (parts.length === 3 && Number(parts[0]) > 2500) return `${Number(parts[2])} ${m[Number(parts[1]) - 1]} ${parts[0]}`; // already BE
  const d = new Date(s); if (isNaN(d)) return s;
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear() + 543}`;
}
function bahtText(n) {
  // อ่านจำนวนเงินเป็นตัวอักษรไทย (อย่างย่อ)
  const t = ['','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
  const p = ['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];
  let baht = Math.floor(n), str = '';
  if (baht === 0) return 'ศูนย์บาทถ้วน';
  const s = String(baht).split('').reverse();
  s.forEach((d, i) => {
    d = +d; if (!d) return;
    let w = (d === 1 && i === 0 && s.length > 1) ? 'เอ็ด' : (d === 2 && i === 1) ? 'ยี่' : (d === 1 && i === 1) ? '' : t[d];
    str = w + p[i] + str;
  });
  return str + 'บาทถ้วน';
}

/* ---- modal / toast (global) ----------------------------------------------- */
window.openModal = (title, body, foot, extraClass) => {
  const m = $('#modal');
  m.className = 'modal' + (extraClass ? ' ' + extraClass : '');   // reset ทุกครั้ง กัน class ค้าง
  m.innerHTML = `<div class="modal-head"><h3>${title}</h3><button class="icon-btn" onclick="window.closeModal()">✕</button></div>
    <div class="modal-body">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}`;
  $('#modalBg').classList.add('show');
};
window.closeModal = () => $('#modalBg').classList.remove('show');
window.toast = (msg, type = '', dur = 2600) => {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast show ' + type;
  clearTimeout(window._toast); window._toast = setTimeout(() => t.classList.remove('show'), dur);
};
function doLogout() {
  try { localStorage.removeItem('nj_hr_remember_until'); sessionStorage.removeItem('nj_hr_session_s'); } catch (e) {}
  Auth.logout().then(() => location.reload());
}
window.NJ.app = { go };
