/* ══════════════════════════════════════════════════════════════════
   VERSION GUARD + FORCE UPDATE + MAINTENANCE (server-controlled)
   ─ Authoritative source เดียว: njacc_settings ผ่าน RPC njacc_app_status()
   ─ เวลาเริ่ม/จบ Maintenance เก็บฝั่ง server — client หลายเครื่องไม่รีเซ็ต timer
   ─ ตรวจตอน: app start · route change · tab activation · network reconnect · poll 60s
   ─ พบ version ใหม่/maintenance → sign out ทันที + ล้าง session + บล็อคใช้งาน
     แสดง countdown จาก server time · ครบเวลา → reload (cache-bust) → login ใหม่
   ══════════════════════════════════════════════════════════════════ */
import { APP_VERSION, MAINT_MESSAGE } from './config.js';
import { rpc, sb } from './supabase-client.js';
import { resetState } from './state.js';

let _timer = null, _locked = false, _serverSkewMs = 0;

export function startVersionGuard() {
  checkNow('start');
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkNow('visible');
  });
  window.addEventListener('online', () => checkNow('online'));
  window.addEventListener('hashchange', () => checkNow('route'));
  clearInterval(_timer);
  _timer = setInterval(() => checkNow('poll'), 60000);
}

export async function checkNow(reason) {
  try {
    const st = await rpc('njacc_app_status');
    if (!st) return true;
    _serverSkewMs = new Date(st.server_time).getTime() - Date.now();
    const newer = st.deploy_version && st.deploy_version !== APP_VERSION;
    if (st.maintenance_active || newer) {
      await lockToMaintenance(st);
      return false;
    }
    return true;
  } catch (e) {
    /* network ล้ม — ไม่ block การใช้งานปกติ แต่จะเช็คซ้ำรอบถัดไป */
    console.warn('version check failed (' + reason + ')', e && e.message);
    return true;
  }
}

async function lockToMaintenance(st) {
  if (_locked) { renderCountdown(st); return; }
  _locked = true;
  try { await sb().auth.signOut(); } catch (e) { /* ignore */ }
  resetState();
  try { sessionStorage.clear(); } catch (e) {}
  document.body.innerHTML = `
    <div class="login-wrap"><div class="login-card" id="nj-maint">
      <div class="login-logo">NJ</div>
      <h2 class="login-t">กำลังอัปเดตระบบ</h2>
      <p class="login-s" id="nj-maint-msg"></p>
      <div class="login-maint"><span id="nj-maint-cd">--:--</span></div>
      <p class="t-xs t-3 center">ระบบจะเปิดให้เข้าสู่ระบบใหม่โดยอัตโนมัติ</p>
    </div></div>`;
  document.getElementById('nj-maint-msg').textContent = st.maintenance_message || MAINT_MESSAGE;
  renderCountdown(st);
  const iv = setInterval(async () => {
    renderCountdown(st);
    const end = st.maintenance_until ? new Date(st.maintenance_until).getTime() : 0;
    const nowSrv = Date.now() + _serverSkewMs;
    if (!end || nowSrv >= end) {
      /* recheck server: ถ้า maintenance จบจริง → reload ด้วย cache-bust */
      try {
        const st2 = await rpc('njacc_app_status');
        if (!st2.maintenance_active) {
          clearInterval(iv);
          location.replace(location.pathname + '?u=' + Date.now());
          return;
        }
        Object.assign(st, st2); /* server ต่อเวลา → ใช้เวลาใหม่ ไม่รีเซ็ตเอง */
      } catch (e) { /* retry รอบหน้า */ }
    }
  }, 5000);
}

function renderCountdown(st) {
  const el = document.getElementById('nj-maint-cd'); if (!el) return;
  const end = st.maintenance_until ? new Date(st.maintenance_until).getTime() : 0;
  const remMs = Math.max(0, end - (Date.now() + _serverSkewMs));
  const m = Math.floor(remMs / 60000), s = Math.floor((remMs % 60000) / 1000);
  el.textContent = 'เหลือเวลาประมาณ ' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + ' นาที';
}
