/* TRANSPORT NJ — core: supabase, session, version/force-update, realtime, UI helpers, router */
(function () {
  'use strict';
  const C = self.TNJ_CONFIG;
  const fatal = (title, detail) => { const a = document.getElementById('app'); if (a) a.innerHTML = `<div class="screen"><div class="login-card c"><h2 style="color:var(--red)">❌ ${title}</h2><p class="muted">${detail}</p><button class="btn btn-p btn-block" onclick="location.reload()">ลองใหม่</button><div class="xs muted mt1">LOCAL VERSION: ${(C && C.APP_VERSION) || '-'}</div></div></div>`; };
  if (!C || !window.supabase || !window.L) { document.addEventListener('DOMContentLoaded', () => fatal('โหลดไลบรารีของระบบไม่สำเร็จ', 'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต (ต้องโหลด Supabase / Leaflet จาก CDN) แล้วกด ลองใหม่')); return; }
  const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  const T = window.TNJ = {
    C, sb, session: null, settings: { gps_interval_sec: 30, gps_stale_min: 5 }, server: { version: null, maintenance_active: false, offsetMs: 0 },
    pages: {}, _route: null, _rt: {}, _timers: {},
  };

  /* ---------- constants ---------- */
  T.STATUS = ['NEW', 'ASSIGNED', 'ACCEPTED', 'GOING_TO_PICKUP', 'ARRIVED_PICKUP', 'CONTAINER_PICKED_UP', 'GOING_TO_FACTORY', 'ARRIVED_FACTORY', 'LEAVING_FACTORY', 'GOING_TO_RETURN', 'ARRIVED_RETURN', 'CONTAINER_RETURNED', 'COMPLETED', 'PROBLEM', 'CANCELLED'];
  T.ST_TH = { NEW: 'รอสั่งงาน', ASSIGNED: 'รอรับงาน', ACCEPTED: 'รับงานแล้ว', GOING_TO_PICKUP: 'กำลังไปรับตู้', ARRIVED_PICKUP: 'ถึงท่ารับตู้', CONTAINER_PICKED_UP: 'รับตู้แล้ว', GOING_TO_FACTORY: 'กำลังไปโรงงาน', ARRIVED_FACTORY: 'ถึงโรงงานแล้ว', LEAVING_FACTORY: 'ออกจากโรงงาน', GOING_TO_RETURN: 'กำลังคืนตู้', ARRIVED_RETURN: 'ถึงลานคืนตู้', CONTAINER_RETURNED: 'คืนตู้แล้ว', COMPLETED: 'เสร็จแล้ว', PROBLEM: 'มีปัญหา', CANCELLED: 'ยกเลิก' };
  // driver action buttons: status → label/icon/class
  T.ST_BTN = { ACCEPTED: ['รับงาน', '✅', 'btn-g'], GOING_TO_PICKUP: ['ออกไปรับตู้', '🚚', 'btn-p'], ARRIVED_PICKUP: ['ถึงท่ารับตู้', '📍', 'btn-o'], CONTAINER_PICKED_UP: ['รับตู้แล้ว', '📦', 'btn-g'], GOING_TO_FACTORY: ['ออกจากท่า ไปโรงงาน', '➡️', 'btn-pu'], ARRIVED_FACTORY: ['ถึงโรงงาน', '🏭', 'btn-p'], LEAVING_FACTORY: ['ออกจากโรงงาน', '🚛', 'btn-navy'], GOING_TO_RETURN: ['ไปคืนตู้', '↩️', 'btn-t'], ARRIVED_RETURN: ['ถึงลานคืนตู้', '📍', 'btn-t'], CONTAINER_RETURNED: ['คืนตู้แล้ว', '✅', 'btn-g'], COMPLETED: ['ปิดงาน', '🏁', 'btn-r'] };
  T.ACTIVE = new Set(['ACCEPTED', 'GOING_TO_PICKUP', 'ARRIVED_PICKUP', 'CONTAINER_PICKED_UP', 'GOING_TO_FACTORY', 'ARRIVED_FACTORY', 'LEAVING_FACTORY', 'GOING_TO_RETURN', 'ARRIVED_RETURN', 'CONTAINER_RETURNED', 'PROBLEM']);
  T.PROBLEM_TYPES = ['รถเสีย', 'รถติด', 'ท่าล่าช้า', 'รับตู้ไม่ได้', 'โรงงานไม่รับสินค้า', 'คืนตู้ไม่ได้', 'เอกสารไม่ครบ', 'อุบัติเหตุ', 'อื่น ๆ'];
  T.FILE_TYPES = ['B/L', 'Booking', 'ใบรับตู้', 'EIR รับตู้', 'เอกสารโรงงาน', 'POD', 'EIR คืนตู้', 'ใบเสร็จ', 'รูปตู้', 'รูปซีล', 'รูปเลขไมล์', 'รูปปัญหา', 'อื่น ๆ'];
  T.OFFICE = new Set(['SUPER_ADMIN', 'ADMIN', 'TRANSPORT', 'VIEWER']);
  T.nextStatus = (s) => { const i = T.STATUS.indexOf(s); return (i >= 1 && i < 12) ? T.STATUS[i + 1] : null; };
  T.statusOrder = (s) => T.STATUS.indexOf(s) + 1;

  /* ---------- helpers ---------- */
  const $ = T.$ = (sel, root) => (root || document).querySelector(sel);
  T.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  T.h = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  T.nz = (v, d = '-') => (v == null || v === '' ? d : v);
  T.num = (v, dp = 0) => (v == null || v === '' || isNaN(Number(v))) ? '-' : Number(v).toLocaleString('th-TH', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  T.kml = (v) => (v == null || Number(v) <= 0) ? '-' : Number(v).toFixed(2);
  T.pad = (n) => String(n).padStart(2, '0');
  T.todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${T.pad(d.getMonth() + 1)}-${T.pad(d.getDate())}`; };
  T.fmtD = (v) => { if (!v) return '-'; const s = String(v).slice(0, 10); const [y, m, d] = s.split('-'); return (y && m && d) ? `${d}/${m}/${String(Number(y) + 543).slice(-2)}` : s; };
  T.fmtT = (v) => v ? String(v).slice(0, 5) : '-';
  T.fmtDT = (v) => { if (!v) return '-'; const d = new Date(v); if (isNaN(d)) return String(v); return `${T.pad(d.getDate())}/${T.pad(d.getMonth() + 1)}/${String(d.getFullYear() + 543).slice(-2)} ${T.pad(d.getHours())}:${T.pad(d.getMinutes())}`; };
  T.fmtTime = (v) => { if (!v) return '-'; const d = new Date(v); return `${T.pad(d.getHours())}:${T.pad(d.getMinutes())}`; };
  T.toISODateTimeLocal = (d) => { d = d || new Date(); return `${d.getFullYear()}-${T.pad(d.getMonth() + 1)}-${T.pad(d.getDate())}T${T.pad(d.getHours())}:${T.pad(d.getMinutes())}`; };
  T.ago = (iso) => { if (!iso) return 'ไม่มี GPS'; const m = Math.max(0, Math.floor((Date.now() + T.server.offsetMs - new Date(iso).getTime()) / 60000)); return m < 1 ? 'GPS น้อยกว่า 1 นาทีที่แล้ว' : m < 60 ? `GPS ล่าสุด ${m} นาทีที่แล้ว` : m < 1440 ? `GPS ล่าสุด ${Math.floor(m / 60)} ชม. ${m % 60} นาทีที่แล้ว` : `GPS ล่าสุด ${Math.floor(m / 1440)} วันที่แล้ว`; };
  T.gpsCell = (j) => { const stale = j.gps_stale !== false; return `<span class="${stale ? 'gps-stale' : 'gps-ok'}">${T.h(j.last_gps_at ? T.ago(j.last_gps_at) : 'ไม่มี GPS')}</span>`; };
  T.badge = (s, th) => `<span class="badge st-${T.h(s)}">${T.h(th || T.ST_TH[s] || s)}</span>`;
  T.size = (b) => b == null ? '-' : b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
  T.fileIcon = (m, n) => /pdf/.test(m || '') || /\.pdf$/i.test(n || '') ? '📄' : /image/.test(m || '') ? '🖼️' : /sheet|excel/.test(m || '') ? '📊' : /word/.test(m || '') ? '📝' : '📎';
  T.mapsUrl = (loc, text) => loc && loc.google_maps_url ? loc.google_maps_url : (loc && loc.latitude && loc.longitude) ? `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text || (loc && loc.name) || '')}`;
  T.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  T.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  T.isOffice = () => !!T.session && T.OFFICE.has(T.session.role);
  T.isAdmin = () => !!T.session && (T.session.role === 'SUPER_ADMIN' || T.session.role === 'ADMIN');
  T.canEdit = () => !!T.session && ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT'].includes(T.session.role);

  /* ---------- toast / loading / modal ---------- */
  T.toast = (msg, type = '', ms = 3200) => { let box = $('#toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); } const el = document.createElement('div'); el.className = 'toast ' + type; el.textContent = msg; box.appendChild(el); setTimeout(() => el.remove(), ms); };
  let loadN = 0;
  T.loading = (on) => { loadN = Math.max(0, loadN + (on ? 1 : -1)); let el = $('#loading'); if (loadN && !el) { el = document.createElement('div'); el.id = 'loading'; el.className = 'loading'; el.innerHTML = '<div class="spin"></div>'; document.body.appendChild(el); } if (!loadN && el) el.remove(); };
  T.modal = (opt) => {
    const ov = document.createElement('div'); ov.className = 'overlay' + (opt.sheet ? ' sheet' : '');
    ov.innerHTML = `<div class="modal ${opt.size || ''}" role="dialog"><div class="modal-h"><h3>${T.h(opt.title || '')}</h3><button class="x" data-x>×</button></div><div class="modal-b">${opt.body || ''}</div>${opt.foot != null ? `<div class="modal-f">${opt.foot}</div>` : ''}</div>`;
    document.body.appendChild(ov);
    const close = () => { ov.remove(); opt.onClose && opt.onClose(); };
    ov.addEventListener('click', (e) => { if (e.target === ov && !opt.noMask) close(); });
    ov.querySelector('[data-x]').onclick = close;
    T.$$('[data-close]', ov).forEach((b) => b.onclick = close);
    opt.onOpen && opt.onOpen(ov, close);
    return { el: ov, close };
  };
  T.confirm = (title, text, okLabel = 'ยืนยัน', cls = 'btn-p') => new Promise((res) => {
    const m = T.modal({ title, size: 's', body: `<div>${text}</div>`, foot: `<button class="btn" data-close>ยกเลิก</button><button class="btn ${cls}" data-ok>${T.h(okLabel)}</button>`, onClose: () => res(false) });
    m.el.querySelector('[data-ok]').onclick = () => { res(true); m.el.remove(); };
  });
  T.prompt = (title, label, placeholder = '') => new Promise((res) => {
    const m = T.modal({ title, size: 's', body: `<div class="field"><label>${T.h(label)}</label><textarea class="inp" data-v placeholder="${T.h(placeholder)}"></textarea></div>`, foot: `<button class="btn" data-close>ยกเลิก</button><button class="btn btn-p" data-ok>ตกลง</button>`, onClose: () => res(null) });
    m.el.querySelector('[data-ok]').onclick = () => { const v = m.el.querySelector('[data-v]').value.trim(); if (!v) return T.toast('กรุณากรอกข้อมูล', 'warn'); res(v); m.el.remove(); };
  });

  /* ---------- errors ---------- */
  T.parseErr = (e) => { const m = (e && (e.message || e.error)) || String(e); const code = (m.match(/TNJ_[A-Z_]+/) || [])[0]; let text = m; if (code === 'TNJ_VALIDATION') text = m.split('TNJ_VALIDATION:')[1] || m; else if (code === 'TNJ_FORBIDDEN') text = 'คุณไม่มีสิทธิ์ทำรายการนี้'; else if (code === 'TNJ_SESSION_INVALID') text = 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'; else if (code === 'TNJ_MAINTENANCE') text = 'ระบบกำลังอัปเดตเวอร์ชันใหม่'; else if (code === 'TNJ_VERSION_MISMATCH') text = 'เวอร์ชันแอปไม่ตรงกับเซิร์ฟเวอร์'; else if (/Failed to fetch|NetworkError|Load failed/i.test(m)) text = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต'; return { code, text: text.replace(/\s*\(SQLSTATE.*$/, '').trim() }; };
  T.err = (e) => { const p = T.parseErr(e); console.warn('TNJ error', e); if (p.code === 'TNJ_MAINTENANCE') { T.checkVersion(true); return p; } if (p.code === 'TNJ_SESSION_INVALID' || p.code === 'TNJ_VERSION_MISMATCH') { T.logout(true, 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'); return p; } if (!p.code && T.isNetErr(e)) T.connError(e); T.toast(p.text, 'err', 4500); return p; };

  /* ---------- RPC ---------- */
  T.rpc = async (fn, args = {}, opt = {}) => {
    if (!opt.silent) T.loading(true);
    try { const { data, error } = await sb.rpc(fn, args); if (error) throw error; return data; }
    finally { if (!opt.silent) T.loading(false); }
  };
  T.auth = (fn, args = {}, opt = {}) => T.rpc(fn, Object.assign({ p_token: T.session ? T.session.token : '' }, args), opt);

  /* ---------- session ---------- */
  T.saveSession = (s) => { T.session = s; try { if (s) localStorage.setItem(C.SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(C.SESSION_KEY); } catch (_) { } };
  T.loadSession = () => { try { const s = JSON.parse(localStorage.getItem(C.SESSION_KEY) || 'null'); if (s && s.token) T.session = s; else if (s) localStorage.removeItem(C.SESSION_KEY); } catch (_) { T.session = null; } return T.session; };
  T.login = async (username, password) => {
    const data = await T.rpc('tnj_login', { p_username: username, p_password: password, p_app_version: null, p_device: (C.APP_VERSION + ' | ' + navigator.userAgent).slice(0, 200) }); // version = info only (never a login gate)
    data.app_version = C.APP_VERSION; T.saveSession(data); return data;
  };
  T.logout = async (silent, msg) => {
    const tok = T.session && T.session.token; T.stopRealtime(); T.saveSession(null); T.session = null;
    if (tok) { try { await sb.rpc('tnj_logout', { p_token: tok }); } catch (_) { } }
    if (msg) T.toast(msg, 'warn', 5000);
    location.hash = '#/login'; T.render();
  };
  T.applySettings = (d) => { if (!d) return; if (d.gps_interval_sec) T.settings.gps_interval_sec = Number(d.gps_interval_sec); if (d.gps_stale_min) T.settings.gps_stale_min = Number(d.gps_stale_min); if (d.server_time) T.server.offsetMs = new Date(d.server_time).getTime() - Date.now(); };

  /* ---------- connection state (separate from version / session / maintenance) ---------- */
  T.isNetErr = (e) => /Failed to fetch|NetworkError|Load failed|ERR_INTERNET|ERR_NAME|fetch failed/i.test(String((e && (e.message || e.details)) || e));
  T.isNotInstalled = (e) => /PGRST202|Could not find the function|does not exist/i.test(String((e && ((e.code || '') + ' ' + (e.message || ''))) || e));
  T.connError = (e) => {
    const notInst = !T.isNetErr(e) && T.isNotInstalled(e);
    const title = notInst ? '⚠ ฐานข้อมูลยังไม่พร้อม: ยังไม่ได้ติดตั้ง SQL ของ TRANSPORT NJ (RUN-01 → RUN-03)' : '⚠ ไม่สามารถเชื่อมต่อฐานข้อมูลได้';
    let bar = $('#connBar'); if (!bar) { bar = document.createElement('div'); bar.id = 'connBar'; bar.className = 'connbar'; document.body.appendChild(bar); }
    bar.innerHTML = `<span class="grow">${T.h(title)}</span><button class="btn btn-sm" id="connRetry">ลองใหม่</button>`;
    $('#connRetry').onclick = async () => { const s = await T.checkVersion(true); if (s.online) { T.toast('เชื่อมต่อฐานข้อมูลได้แล้ว', 'ok'); T.render(); } else T.toast(title, 'err'); };
  };
  T.hideConnError = () => { const b = $('#connBar'); if (b) b.remove(); };

  /* ---------- version / force update / maintenance ---------- */
  let lastCheck = 0, checking = null;
  T.versionStatus = async () => { try { const { data, error } = await sb.rpc('tnj_version_status'); if (error) throw error; return data; } catch (e) { console.warn('version status failed', e); return null; } };
  T.checkVersion = async (force) => {
    if (checking) return checking;
    if (!force && Date.now() - lastCheck < 8000) return T.server;
    checking = (async () => {
      try {
        const { data, error } = await sb.rpc('tnj_version_status'); if (error) throw error;
        lastCheck = Date.now();
        T.server = Object.assign({}, data, { offsetMs: new Date(data.server_time).getTime() - Date.now(), online: true });
        T.hideConnError();
        if (data.maintenance_active) { T.showMaintenance(data); return T.server; }
        T.hideGate();
      } catch (e) { T.server.online = false; console.warn('version check failed', e); T.connError(e); }
      finally { checking = null; }
      return T.server;
    })();
    return checking;
  };
  T.clearAppCaches = async () => {
    try { if ('caches' in window) { const keys = await caches.keys(); await Promise.all(keys.filter((k) => k.startsWith('tnj-')).map((k) => caches.delete(k))); } } catch (_) { }
    try { if ('serviceWorker' in navigator) { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.filter((r) => (r.scope || '').includes('/transportnj')).map((r) => r.unregister())); } } catch (_) { }
  };
  T.handleMismatch = async (data) => {
    // server announced another version than this build. Step 1: wipe our caches & reload once (gets the new files if they were deployed).
    const key = 'tnj.reload.' + data.version;
    let tried = false; try { tried = sessionStorage.getItem(key) === '1'; } catch (_) { }
    T.saveSession(null); T.session = null; T.stopRealtime();
    if (!tried) { try { sessionStorage.setItem(key, '1'); } catch (_) { } await T.clearAppCaches(); location.replace(location.pathname + '?v=' + encodeURIComponent(data.version) + location.hash); return; }
    T.showMismatch(data);
  };
  T.showMaintenance = (data) => {
    T.saveSession(null); T.session = null; T.stopRealtime();
    const gate = T._gate('maint');
    const ends = data.maintenance_ends_at ? new Date(data.maintenance_ends_at).getTime() : null;
    const draw = () => {
      const now = Date.now() + T.server.offsetMs; const left = ends ? Math.max(0, ends - now) : 0;
      const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
      gate.innerHTML = `<div class="box"><div class="logo" style="justify-content:center;color:#fff"><span class="lg" style="background:#fff;color:var(--navy)">NJ</span><div><div class="t1">TRANSPORT NJ</div><div class="t2" style="color:#B9C6DA">CONTAINER LOGISTICS</div></div></div>
        <h2 style="margin-top:22px">${T.h(data.maintenance_message || 'ระบบกำลังอัปเดตเวอร์ชันใหม่ กรุณาเข้าสู่ระบบอีกครั้งหลังครบ 10 นาที')}</h2>
        <div class="big">${ends ? `${T.pad(mm)}:${T.pad(ss)}` : '--:--'}</div>
        <div class="muted" style="color:#B9C6DA">เวลาที่เหลือ (ตามเวลาเซิร์ฟเวอร์) · เวอร์ชันใหม่ ${T.h(data.version || '')}</div>
        <div class="muted small" style="color:#B9C6DA;margin-top:14px">ระบบจะตรวจสอบและเปิดให้ใช้งานอัตโนมัติ ไม่ต้องกดรีเฟรช</div></div>`;
    };
    draw(); clearInterval(T._timers.maint); T._timers.maint = setInterval(draw, 1000);
    clearInterval(T._timers.maintCheck); T._timers.maintCheck = setInterval(async () => {
      const d = await T.versionStatus(); if (!d) return;
      if (!d.maintenance_active) { clearInterval(T._timers.maint); clearInterval(T._timers.maintCheck); await T.clearAppCaches(); try { sessionStorage.removeItem('tnj.reload.' + d.version); } catch (_) { } location.replace(location.pathname + '?v=' + encodeURIComponent(d.version || Date.now()) + '#/login'); }
      else if (d.maintenance_ends_at !== data.maintenance_ends_at) { data = d; T.showMaintenance(d); }
    }, 15000);
  };
  T.showMismatch = (data) => {
    const gate = T._gate('maint');
    gate.innerHTML = `<div class="box"><div class="logo" style="justify-content:center;color:#fff"><span class="lg" style="background:#fff;color:var(--navy)">NJ</span><div><div class="t1">TRANSPORT NJ</div></div></div>
      <h2 style="margin-top:22px">TRANSPORT NJ เวอร์ชันไม่ตรง</h2>
      <p style="color:#fff;font-size:17px;line-height:1.7">LOCAL VERSION: <b>${T.h(C.APP_VERSION)}</b><br>SERVER VERSION: <b>${T.h(data.version)}</b></p>
      <p style="color:#FDE68A;font-weight:700">กรุณาใช้ LOCAL เวอร์ชันล่าสุด</p>
      <p class="small" style="color:#B9C6DA">ถ้าเพิ่งอัปโหลด Release ใหม่ ผู้ดูแลระบบสูงสุด (SUPER_ADMIN) เข้าสู่ระบบด้านล่างเพื่อประกาศเวอร์ชัน <b style="color:#fff">${T.h(C.APP_VERSION)}</b> — ระบบจะเข้าสู่โหมดปรับปรุง 10 นาทีและบังคับทุกเครื่องโหลดเวอร์ชันใหม่</p>
      <div class="login-card" style="margin:14px auto 0;text-align:left;padding:18px"><div class="field"><label>รหัสพนักงาน (SUPER_ADMIN)</label><input class="inp" id="mmUser" autocomplete="username"></div><div class="field"><label>รหัสผ่าน</label><input class="inp" id="mmPw" type="password" autocomplete="current-password"></div>
      <button class="btn btn-p btn-block" id="mmGo">ประกาศเวอร์ชัน ${T.h(C.APP_VERSION)}</button><div class="c mt1"><button class="btn btn-ghost btn-sm" id="mmReload">โหลดเวอร์ชันล่าสุดจากเซิร์ฟเวอร์</button></div></div></div>`;
    $('#mmReload').onclick = async () => { await T.clearAppCaches(); try { sessionStorage.removeItem('tnj.reload.' + data.version); } catch (_) { } location.replace(location.pathname + '?v=' + Date.now()); };
    $('#mmGo').onclick = async () => {
      try { T.loading(true); const s = await T.rpc('tnj_login', { p_username: $('#mmUser').value.trim(), p_password: $('#mmPw').value, p_app_version: C.APP_VERSION }, { silent: true });
        if (s.role !== 'SUPER_ADMIN') throw new Error('TNJ_FORBIDDEN');
        const r = await T.rpc('tnj_version_set', { p_token: s.token, p_version: C.APP_VERSION, p_maintenance_minutes: 10 }, { silent: true });
        T.toast('ประกาศเวอร์ชันแล้ว ระบบเข้าสู่โหมดปรับปรุง', 'ok'); T.showMaintenance(r);
      } catch (e) { T.toast(T.parseErr(e).text, 'err'); } finally { T.loading(false); }
    };
    clearInterval(T._timers.mmCheck); T._timers.mmCheck = setInterval(async () => { const d = await T.versionStatus(); if (d && (d.maintenance_active || d.version === C.APP_VERSION)) { clearInterval(T._timers.mmCheck); T.checkVersion(true); } }, 20000);
  };
  T._gate = (cls) => { let g = $('#gate'); if (!g) { g = document.createElement('div'); g.id = 'gate'; document.body.appendChild(g); } g.className = cls; g.classList.remove('hidden'); $('#app').classList.add('hidden'); return g; };
  T.hideGate = () => { const g = $('#gate'); if (g) { g.classList.add('hidden'); g.innerHTML = ''; } $('#app').classList.remove('hidden'); clearInterval(T._timers.maint); clearInterval(T._timers.maintCheck); clearInterval(T._timers.mmCheck); };

  /* ---------- realtime (broadcast ping only) ---------- */
  T.subscribe = (topic, handler) => {
    if (T._rt[topic]) { T._rt[topic].handlers.push(handler); return; }
    try {
      const ch = sb.channel(topic, { config: { broadcast: { self: true }, private: false } });
      const rec = { ch, handlers: [handler] };
      ch.on('broadcast', { event: '*' }, (msg) => rec.handlers.forEach((h) => { try { h(msg.payload || {}, msg.event); } catch (e) { console.warn(e); } }));
      ch.subscribe((st) => { rec.state = st; });
      T._rt[topic] = rec;
    } catch (e) { console.warn('realtime unavailable', e); }
  };
  T.unsubscribeAll = () => { Object.values(T._rt).forEach((r) => { try { sb.removeChannel(r.ch); } catch (_) { } }); T._rt = {}; };
  T.stopRealtime = () => { T.unsubscribeAll(); Object.keys(T._timers).forEach((k) => { if (k.startsWith('page.')) { clearInterval(T._timers[k]); delete T._timers[k]; } }); };
  T.every = (key, ms, fn) => { clearInterval(T._timers['page.' + key]); T._timers['page.' + key] = setInterval(() => { if (document.visibilityState === 'visible') fn(); }, ms); };

  /* ---------- geo ---------- */
  T.getPos = (timeout = 8000) => new Promise((res) => { if (!navigator.geolocation) return res(null); navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }), () => res(null), { enableHighAccuracy: true, timeout, maximumAge: 15000 }); });

  /* ---------- files (Edge Function) ---------- */
  T.files = {
    async upload(jobId, file, fileType, timelineId, note) {
      const fd = new FormData(); fd.append('file', file, file.name); fd.append('job_id', jobId); fd.append('file_type', fileType || 'อื่น ๆ'); if (timelineId) fd.append('timeline_id', timelineId); if (note) fd.append('note', note);
      const r = await fetch(C.FILES_FN + '/upload', { method: 'POST', headers: { 'x-tnj-token': T.session.token, apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY }, body: fd });
      const j = await r.json().catch(() => ({ error: 'HTTP ' + r.status })); if (!r.ok || j.error) throw new Error(j.error || ('HTTP ' + r.status)); return j;
    },
    async url(id, mode = 'preview') {
      const r = await fetch(`${C.FILES_FN}/url?id=${encodeURIComponent(id)}&mode=${mode}`, { headers: { 'x-tnj-token': T.session.token, apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY } });
      const j = await r.json().catch(() => ({ error: 'HTTP ' + r.status })); if (!r.ok || j.error) throw new Error(j.error || ('HTTP ' + r.status)); return j;
    },
    async del(id) {
      const r = await fetch(`${C.FILES_FN}/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'x-tnj-token': T.session.token, apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY } });
      const j = await r.json().catch(() => ({ error: 'HTTP ' + r.status })); if (!r.ok || j.error) throw new Error(j.error || ('HTTP ' + r.status)); return j;
    },
    // shrink camera photos before upload (≤1600px, JPEG)
    async shrink(file, max = 1600) {
      if (!/^image\/(jpeg|png)$/.test(file.type) || file.size < 400 * 1024) return file;
      try {
        const bmp = await createImageBitmap(file); const sc = Math.min(1, max / Math.max(bmp.width, bmp.height)); if (sc >= 1) return file;
        const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * sc); cv.height = Math.round(bmp.height * sc); cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
        const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.85)); return new File([blob], file.name.replace(/\.(png|jpeg)$/i, '.jpg'), { type: 'image/jpeg' });
      } catch (_) { return file; }
    },
    async preview(f, urlFn) {
      try { const r = await (urlFn || T.files.url)(f.id, 'preview'); const isImg = /image/.test(f.mime_type || ''); const isPdf = /pdf/.test(f.mime_type || '');
        if (!isImg && !isPdf) { window.open(r.url, '_blank'); return; }
        T.modal({ title: f.file_name, size: 'w', body: isImg ? `<div class="c"><img src="${r.url}" style="max-width:100%;max-height:75vh;border-radius:8px"></div>` : `<iframe class="prev" src="${r.url}"></iframe>`, foot: `<a class="btn" href="${r.url}" target="_blank" rel="noopener">เปิดแท็บใหม่</a><button class="btn btn-p" data-dl>ดาวน์โหลด</button>`, onOpen: (el) => { el.querySelector('[data-dl]').onclick = () => T.files.download(f, urlFn); } });
      } catch (e) { T.err(e); }
    },
    async download(f, urlFn) { try { const r = await (urlFn || T.files.url)(f.id, 'download'); const a = document.createElement('a'); a.href = r.url; a.download = f.file_name; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { T.err(e); } },
  };
  // 📁 เอกสารประจำรถ (ผูก Vehicle ID) — Edge Function เดิม route เพิ่ม · สิทธิ์ตัดสินที่ SQL (tnj_vfile_*)
  T.vfiles = {
    async upload(vehicleId, file, docType, expireDate, note, replaceId) {
      const fd = new FormData(); fd.append('file', file, file.name); fd.append('vehicle_id', vehicleId); fd.append('doc_type', docType); if (expireDate) fd.append('expire_date', expireDate); if (note) fd.append('note', note); if (replaceId) fd.append('replace_id', replaceId);
      const r = await fetch(C.FILES_FN + '/upload', { method: 'POST', headers: { 'x-tnj-token': T.session.token, apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY }, body: fd });
      const j = await r.json().catch(() => ({ error: 'HTTP ' + r.status })); if (!r.ok || j.error) throw new Error(j.error || ('HTTP ' + r.status)); return j;
    },
    async url(id, mode = 'preview') {
      const r = await fetch(`${C.FILES_FN}/url?vid=${encodeURIComponent(id)}&mode=${mode}`, { headers: { 'x-tnj-token': T.session.token, apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY } });
      const j = await r.json().catch(() => ({ error: 'HTTP ' + r.status })); if (!r.ok || j.error) throw new Error(j.error || ('HTTP ' + r.status)); return j;
    },
    async del(id) {
      const r = await fetch(`${C.FILES_FN}/vfile/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'x-tnj-token': T.session.token, apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY } });
      const j = await r.json().catch(() => ({ error: 'HTTP ' + r.status })); if (!r.ok || j.error) throw new Error(j.error || ('HTTP ' + r.status)); return j;
    },
    preview: (f) => T.files.preview(f, T.vfiles.url), download: (f) => T.files.download(f, T.vfiles.url),
    ICON: { 'ประกันรถ': '🛡️', 'พ.ร.บ.': '📄', 'กรมธรรม์': '📜', 'คู่มือรถ': '📘', 'คู่มืออุปกรณ์': '📗', 'เอกสารทะเบียนรถ': '🗂️', 'เอกสารตรวจสภาพ': '🔧', 'เอกสารอื่น ๆ': '📎' },
    ST: { OK: ['🟢', 'ใช้งานได้', 'ok'], NEAR: ['🟠', 'ใกล้หมดอายุ', 'near'], EXPIRED: ['🔴', 'หมดอายุ', 'exp'] },
    expHtml(f) { if (!f.expire_date) return ''; const [y, m, d] = String(f.expire_date).slice(0, 10).split('-'); const s = T.vfiles.ST[f.exp_status] || null; return `<div class="small">หมดอายุ: ${d}/${m}/${y}${s ? ` <span class="vd-st ${s[2]}">${s[0]} ${s[1]}</span>` : ''}</div>`; },
  };
  T.fileRow = (f, canDel) => `<div class="filebox" data-fid="${f.id}"><div class="fi">${T.fileIcon(f.mime_type, f.file_name)}</div><div class="grow"><div class="b ell">${T.h(f.file_name)}</div><div class="xs muted">${T.h(f.file_type)} · ${T.size(f.size_bytes)} · ${T.h(f.uploaded_by_name || '')} · ${T.fmtDT(f.uploaded_at)}</div></div><div class="flex"><button class="btn btn-sm" data-prev title="ดู">👁</button><button class="btn btn-sm" data-dl title="ดาวน์โหลด">⬇</button>${canDel ? '<button class="btn btn-sm btn-r" data-del title="ลบ">🗑</button>' : ''}</div></div>`;
  T.bindFileRows = (root, files, onDeleted) => {
    T.$$('.filebox', root).forEach((row) => { const f = files.find((x) => x.id === row.dataset.fid); if (!f) return;
      const p = row.querySelector('[data-prev]'); if (p) p.onclick = () => T.files.preview(f);
      const d = row.querySelector('[data-dl]'); if (d) d.onclick = () => T.files.download(f);
      const x = row.querySelector('[data-del]'); if (x) x.onclick = async () => { if (!(await T.confirm('ลบไฟล์', `ลบไฟล์ <b>${T.h(f.file_name)}</b> ?`, 'ลบ', 'btn-r'))) return; try { T.loading(true); await T.files.del(f.id); T.toast('ลบไฟล์แล้ว', 'ok'); onDeleted && onDeleted(); } catch (e) { T.err(e); } finally { T.loading(false); } };
    });
  };
  // upload sheet (shared by office + driver)
  T.uploadDialog = (jobId, opt = {}) => new Promise((resolve) => {
    const types = T.FILE_TYPES.map((t) => `<option ${t === (opt.defaultType || '') ? 'selected' : ''}>${T.h(t)}</option>`).join('');
    const m = T.modal({ title: opt.title || 'แนบไฟล์ / ถ่ายรูป', sheet: opt.sheet, size: 's', body: `
      <div class="field"><label>ประเภทเอกสาร</label><select class="inp inp-lg" id="upType">${types}</select></div>
      <div class="grid g2"><label class="btn btn-lg btn-navy"><span>📷 ถ่ายรูป</span><input type="file" accept="image/*" capture="environment" id="upCam" class="hidden" multiple></label><label class="btn btn-lg"><span>📁 เลือกไฟล์</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx,image/*,application/pdf" id="upFile" class="hidden" multiple></label></div>
      <div id="upList" class="mt1 small muted"></div><div class="field mt1"><label>หมายเหตุ (ถ้ามี)</label><input class="inp" id="upNote"></div>`,
      foot: `<button class="btn" data-close>ยกเลิก</button><button class="btn btn-p" id="upGo" disabled>อัปโหลด</button>`, onClose: () => resolve(null) });
    let picked = [];
    const show = () => { $('#upList', m.el).innerHTML = picked.map((f) => `• ${T.h(f.name)} (${T.size(f.size)})`).join('<br>') || 'ยังไม่ได้เลือกไฟล์'; $('#upGo', m.el).disabled = !picked.length; };
    const pick = (e) => { picked = picked.concat(Array.from(e.target.files || [])); show(); };
    $('#upCam', m.el).onchange = pick; $('#upFile', m.el).onchange = pick; show();
    $('#upGo', m.el).onclick = async () => {
      const type = $('#upType', m.el).value, note = $('#upNote', m.el).value.trim(); const done = [];
      try { T.loading(true); for (const f of picked) { const g = await T.files.shrink(f); done.push(await T.files.upload(jobId, g, type, opt.timelineId, note)); } T.toast(`อัปโหลด ${done.length} ไฟล์แล้ว`, 'ok'); m.el.remove(); resolve(done); }
      catch (e) { T.err(e); } finally { T.loading(false); }
    };
  });

  /* ---------- router ---------- */
  T.route = () => { const h = location.hash.replace(/^#\/?/, ''); const [path, qs] = h.split('?'); const seg = path.split('/').filter(Boolean); const q = {}; (qs || '').split('&').forEach((p) => { if (!p) return; const [k, v] = p.split('='); q[decodeURIComponent(k)] = decodeURIComponent(v || ''); }); return { path, seg, q }; };
  T.go = (h) => { if (location.hash === '#/' + h) T.render(); else location.hash = '#/' + h; };
  T.render = async () => {
    const r = T.route(); const app = $('#app');
    if (!T.session) { if (r.path !== 'login') { location.hash = '#/login'; return; } return T.pages.login(app); }
    const isDrv = T.session.role === 'DRIVER';
    if (r.path === 'login' || r.path === '') { location.hash = isDrv ? '#/d/jobs' : '#/jobs'; return; }
    if (isDrv && r.seg[0] !== 'd') { location.hash = '#/d/jobs'; return; }
    if (!isDrv && r.seg[0] === 'd') { location.hash = '#/jobs'; return; }
    T.stopRealtime();
    try { if (isDrv) await T.pages.driver(app, r); else await T.pages.office(app, r); } catch (e) { T.err(e); }
  };

  /* ---------- login page ---------- */
  T.pages.login = (app) => {
    app.innerHTML = `<div class="screen"><div class="login-card"><div class="logo c" style="justify-content:center;margin-bottom:18px"><span class="lg">NJ</span><div><div class="t1">TRANSPORT NJ</div><div class="t2">CONTAINER LOGISTICS</div></div></div>
      <form id="loginForm"><div class="field"><label>รหัสพนักงาน</label><input class="inp inp-lg" id="lgUser" autocomplete="username" autocapitalize="off" required></div>
      <div class="field"><label>รหัสผ่าน</label><input class="inp inp-lg" id="lgPw" type="password" autocomplete="current-password" required></div>
      <button class="btn btn-p btn-lg btn-block" type="submit">เข้าสู่ระบบ</button></form>
      <div class="c xs muted mt2">${location.protocol === 'file:' ? 'โหมด LOCAL (Open check) · ' : /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'โหมด LOCAL (localhost) · ' : ''}เวอร์ชัน ${T.h(C.APP_VERSION)}${T.server.version && T.server.version !== C.APP_VERSION ? ' · server ' + T.h(T.server.version) : ''}</div></div></div>`;
    $('#loginForm').onsubmit = async (e) => { e.preventDefault(); try { const s = await T.login($('#lgUser').value.trim(), $('#lgPw').value); T.toast(`ยินดีต้อนรับ ${s.full_name}`, 'ok'); location.hash = s.role === 'DRIVER' ? '#/d/jobs' : '#/jobs'; } catch (er) { const p = T.parseErr(er); if (p.code === 'TNJ_MAINTENANCE') T.checkVersion(true); else if (!p.code && (T.isNetErr(er) || T.isNotInstalled(er))) { T.connError(er); T.toast(T.isNetErr(er) ? 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' : 'ฐานข้อมูลยังไม่พร้อม', 'err'); } else T.toast(p.text, 'err'); } };
  };

  /* ---------- boot ---------- */
  T.boot = async () => {
    T.loadSession();
    await T.checkVersion(true);
    if (T.server.maintenance_active) return;
    if (T.session) { try { const d = await T.rpc('tnj_session_check', { p_token: T.session.token }, { silent: true }); T.applySettings(d); T.session = Object.assign({}, T.session, { role: d.role, driver_id: d.driver_id, full_name: d.full_name }); } catch (e) { const p = T.parseErr(e); if (p.code === 'TNJ_MAINTENANCE') { T.checkVersion(true); return; } if (p.code) { T.saveSession(null); T.session = null; if (p.code === 'TNJ_SESSION_INVALID' || p.code === 'TNJ_VERSION_MISMATCH') T.toast('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', 'warn', 5000); } else if (T.isNetErr(e) || T.isNotInstalled(e)) T.connError(e); } }
    window.addEventListener('hashchange', () => { T.checkVersion(); T.render(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') T.checkVersion(true); });
    window.addEventListener('focus', () => T.checkVersion());
    window.addEventListener('online', () => { T.checkVersion(true); T.toast('กลับมาออนไลน์แล้ว', 'ok'); });
    window.addEventListener('offline', () => T.toast('ออฟไลน์ — ข้อมูลจะถูกส่งเมื่อกลับมาออนไลน์', 'warn'));
    setInterval(() => T.checkVersion(), C.VERSION_CHECK_SEC * 1000);
    if ('serviceWorker' in navigator && location.protocol !== 'file:') { navigator.serviceWorker.register('sw.js').catch(() => { }); navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.type === 'TNJ_NEW_SW') T.checkVersion(true); }); }
    T.render();
  };
  document.addEventListener('DOMContentLoaded', T.boot);
})();
