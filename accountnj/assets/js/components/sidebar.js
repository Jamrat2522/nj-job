/* Shell: Sidebar (Navy) + Topbar — เมนูตาม FINAL LOCK เท่านั้น
   💼 SERVICE CHARGE (NJ/DSV/Maersk/Kuehne/Rhenus)
   💳 ADVANCE CHARGE (NJ/DSV/Maersk/Kuehne/Rhenus)
   🧾 ACCOUNTING (Report / Receipt / ใบหัก ณ ที่จ่าย)
   ⚙️ SYSTEM (Backup / ผู้ใช้งาน / ออกจากระบบ)
   ห้ามเพิ่มเมนูอื่นนอกรายการนี้ */
import { APP_VERSION, APP_NAME } from '../core/config.js';
import { AppState } from '../core/state.js';
import { COMPANY_GROUPS, CHARGE_TYPES } from '../config/charge-groups.js';
import { can, isAdmin } from '../core/permissions.js';
import { esc } from '../core/formatter.js';

const CARET = '<svg class="sb-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="m9 6 6 6-6 6"/></svg>';

export function renderShell() {
  if (document.getElementById('app-shell')) return;
  const p = AppState.profile || {};

  const chargeMenus = CHARGE_TYPES.map(c => {
    const groups = COMPANY_GROUPS.filter(g => can('view', c.key, g.key));
    if (!groups.length) return '';
    return `<div class="sb-group" data-g="${c.key}">
      <button class="sb-item" data-toggle><span class="sb-ic">${c.icon}</span>
        <span>${esc(c.label)}</span>${CARET}</button>
      <div class="sb-children">${groups.map(g =>
        `<button class="sb-item sb-sub" data-nav="charges/${c.key}/${g.key}">
           <span class="sb-ic">${g.icon}</span><span>${esc(g.label)}</span></button>`).join('')}
      </div></div>`;
  }).join('');

  const acct = [
    `<button class="sb-item" data-nav="report"><span class="sb-ic">📊</span><span>Report</span></button>`,
    `<button class="sb-item" data-nav="receipts"><span class="sb-ic">🧾</span><span>Receipt</span></button>`,
    `<button class="sb-item" data-nav="withholding"><span class="sb-ic">📄</span><span>ใบหัก ณ ที่จ่าย</span></button>`,
  ].join('');

  const sys = [`<button class="sb-item" data-nav="backup"><span class="sb-ic">☁️</span><span>Backup</span></button>`];
  if (isAdmin() || can('manage_users'))
    sys.push(`<button class="sb-item" data-nav="users"><span class="sb-ic">👥</span><span>ผู้ใช้งาน</span></button>`);
  sys.push(`<button class="sb-item" id="sb-logout"><span class="sb-ic">🚪</span><span>ออกจากระบบ</span></button>`);

  document.body.innerHTML = `<div class="app" id="app-shell">
    <aside class="sb" id="sb">
      <div class="sb-brand"><div class="logo">NJ</div>
        <div><div class="nm">${APP_NAME}</div><div class="sub">Accounting System</div></div></div>
      <nav class="sb-nav">
        ${chargeMenus}
        <div class="sb-sec">🧾 ACCOUNTING</div>${acct}
        <div class="sb-sec">⚙️ SYSTEM</div>${sys.join('')}
      </nav>
      <div class="sb-user"><div class="nm">${esc(p.full_name || '')}</div>
        <div class="rl">${esc((p.role || '').replace('_', ' '))}</div></div>
    </aside>
    <div class="app-main">
      <header class="tb">
        <button class="btn-icon tb-menu" id="tb-menu">☰</button>
        <span class="tb-title" id="tb-title"></span>
        <span class="tb-ver">v${APP_VERSION}</span><span class="sp"></span>
        <div class="tb-user"><div class="tb-ava">${esc((p.full_name || '?')[0])}</div>
          <div><div class="t-sm t-b">${esc(p.full_name || '')}</div>
            <div class="t-xs t-3">${esc((p.role || '').replace('_', ' '))}</div></div></div>
      </header>
      <main class="app-content" id="app-content"></main>
    </div></div>`;

  document.getElementById('app-shell').addEventListener('click', e => {
    const nv = e.target.closest('[data-nav]');
    if (nv) { location.hash = '#/' + nv.dataset.nav; document.getElementById('sb').classList.remove('open'); return; }
    const tg = e.target.closest('[data-toggle]');
    if (tg) tg.closest('.sb-group').classList.toggle('open');
  });
  document.getElementById('tb-menu').onclick = () => document.getElementById('sb').classList.toggle('open');
  document.getElementById('sb-logout').onclick = async () => {
    const { doLogout } = await import('../system/logout.js?v=' + APP_VERSION);
    doLogout();
  };
}
export function setActiveNav(path) {
  document.querySelectorAll('.sb-item.active').forEach(x => x.classList.remove('active'));
  const el = document.querySelector(`[data-nav="${path}"]`);
  if (el) { el.classList.add('active'); el.closest('.sb-group')?.classList.add('open'); }
}
export function setTitle(t) {
  const el = document.getElementById('tb-title'); if (el) el.textContent = t || '';
  document.title = (t ? t + ' · ' : '') + 'BILLING NJ';
}
/* หน้าเริ่มต้น = หน้ารายการแรกที่ผู้ใช้มีสิทธิ์ (ไม่มีเมนู "ภาพรวมระบบ" แล้ว) */
export function firstAllowedRoute() {
  for (const c of CHARGE_TYPES) for (const g of COMPANY_GROUPS)
    if (can('view', c.key, g.key)) return `charges/${c.key}/${g.key}`;
  return 'report';
}
