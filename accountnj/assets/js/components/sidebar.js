/* Shell: Sidebar (Navy) + Topbar — เมนูตาม FINAL LOCK เท่านั้น
   💼 SERVICE CHARGE (NJ/DSV/Maersk/Kuehne/Rhenus)
   💳 ADVANCE CHARGE (NJ/DSV/Maersk/Kuehne/Rhenus)
   🧾 ACCOUNTING (Report / Receipt / ใบหัก ณ ที่จ่าย)
   ⚙️ SYSTEM (Backup / ผู้ใช้งาน / ออกจากระบบ)
   ห้ามเพิ่มเมนูอื่นนอกรายการนี้ */
import { APP_VERSION, APP_NAME } from '../core/config.js';
import { AppState } from '../core/state.js';
import { CHARGE_TYPES } from '../config/charge-groups.js';
import { can, isAdmin } from '../core/permissions.js';
import { esc } from '../core/formatter.js';


/* บริษัทที่แสดงใน Sidebar — ตามคำสั่งผู้ใช้ให้เหลือเฉพาะ NJ
   หมายเหตุ: เป็นการกรอง "เมนู" เท่านั้น · Route / สิทธิ์ / ข้อมูลของบริษัทอื่นยังคงอยู่ครบ
   (เข้าถึงได้ทาง URL เดิม เช่น #/charges/SERVICE/DSV) — เพิ่มบริษัทกลับได้โดยแก้ที่บรรทัดนี้ */
const SIDEBAR_GROUPS = ['NJ'];

/* ชุดไอคอน Sidebar — SVG แบนตามภาพต้นแบบ (แทน emoji ที่หน้าตาต่างกันตามเครื่อง/OS)
   ใช้เฉพาะการแสดงผลในเมนูซ้าย · ไม่แตะ config CHARGE_TYPES / COMPANY_GROUPS */
const SVG = (c, body, fill) =>
  `<svg viewBox="0 0 24 24" fill="${fill ? c : 'none'}" stroke="${fill ? 'none' : c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ICON = {
  /* SERVICE CHARGE — กระเป๋าเอกสารสีแดง (ทึบ) */
  SERVICE: SVG('currentColor', '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" fill="none" stroke="#dc2626" stroke-width="2"/>', true),
  /* ADVANCE CHARGE — บัตร (ทึบ) */
  ADVANCE: SVG('currentColor', '<rect x="2" y="5" width="20" height="14" rx="2"/><rect x="2" y="9" width="20" height="2.5" fill="var(--sb-bg-1)"/>', true),
  /* บริษัท (NJ) — ตาราง 4 ช่อง สีน้ำเงิน */
  GROUP: SVG('currentColor', '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>', true),
  /* หัวข้อ ACCOUNTING — เอกสารสีส้ม */
  SEC_ACCT: SVG('currentColor', '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6" fill="var(--sb-bg-1)"/>', true),
  /* หัวข้อ DOCUMENT — โฟลเดอร์สีเหลือง */
  SEC_DOC: SVG('currentColor', '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', true),
  /* หัวข้อ FINANCE — เหรียญเงิน */
  SEC_FIN: SVG('currentColor', '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h5M9.5 14.5h5" fill="none" stroke="var(--sb-bg-1)" stroke-width="2"/>', true),
  /* Credit Note — กระดาษ + ดินสอ */
  CREDIT: SVG('currentColor', '<path d="M5 3h9l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1"/><path d="M8.5 12h7M8.5 16h4.5" fill="none" stroke="var(--sb-bg-1)" stroke-width="2"/>', true),
  /* หัวข้อ SYSTEM — เฟืองสีม่วง */
  SEC_SYS: SVG('currentColor', '<path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5m9.4 4.6-2-.3a7.6 7.6 0 0 0-.6-1.5l1.2-1.7-1.6-1.6-1.7 1.2a7.6 7.6 0 0 0-1.5-.6l-.3-2h-2.2l-.3 2c-.5.1-1 .3-1.5.6L9.2 8l-1.6 1.6 1.2 1.7c-.3.5-.5 1-.6 1.5l-2 .3v2.2l2 .3c.1.5.3 1 .6 1.5L7.6 18.8l1.6 1.6 1.7-1.2c.5.3 1 .5 1.5.6l.3 2h2.2l.3-2c.5-.1 1-.3 1.5-.6l1.7 1.2 1.6-1.6-1.2-1.7c.3-.5.5-1 .6-1.5l2-.3z"/>', true),
  /* Report — กราฟแท่ง */
  REPORT: SVG('currentColor', '<rect x="3" y="12" width="4.5" height="9" rx="1"/><rect x="9.75" y="7" width="4.5" height="14" rx="1"/><rect x="16.5" y="3" width="4.5" height="18" rx="1"/>', true),
  /* Receipt — คลิปบอร์ด/ใบเสร็จ */
  RECEIPT: SVG('currentColor', '<rect x="5" y="3" width="14" height="18" rx="2"/><rect x="8.5" y="7" width="7" height="1.8" fill="var(--sb-bg-1)"/><rect x="8.5" y="11" width="7" height="1.8" fill="var(--sb-bg-1)"/><rect x="8.5" y="15" width="4.5" height="1.8" fill="var(--sb-bg-1)"/>', true),
  /* ใบหัก ณ ที่จ่าย — เอกสาร */
  WHT: SVG('currentColor', '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6" fill="var(--sb-bg-1)"/>', true),
  /* Backup — เมฆอัปโหลด */
  BACKUP: SVG('currentColor', '<path d="M6.5 19a4.5 4.5 0 0 1-.4-9 6 6 0 0 1 11.6 1.2A4 4 0 0 1 17.5 19z"/><path d="M12 16.5V10m0 0-2.2 2.2M12 10l2.2 2.2" fill="none" stroke="var(--sb-bg-1)" stroke-width="2"/>', true),
  /* ตั้งค่าลูกค้า — บัตรประจำตัว/ลูกค้า */
  CUSTOMER: SVG('currentColor', '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><circle cx="8.5" cy="11" r="2.4" fill="var(--sb-bg-1)"/><path d="M4.6 16.6a4 4 0 0 1 7.8 0z" fill="var(--sb-bg-1)"/><rect x="14" y="9.5" width="5.5" height="1.8" fill="var(--sb-bg-1)"/><rect x="14" y="13" width="5.5" height="1.8" fill="var(--sb-bg-1)"/>', true),
  /* ตั้งค่ารายการบริการ — แท็ก/ป้ายรายการ */
  SERVICEITEM: SVG('currentColor', '<path d="M3 12.5V4.5A1.5 1.5 0 0 1 4.5 3h8l8.5 8.5-9 9z"/><circle cx="8" cy="8" r="1.7" fill="var(--sb-bg-1)"/>', true),
  /* FINANCE > Advance — กระเป๋าเงิน/สำรองจ่าย (คนละตัวกับ ICON.ADVANCE ของเมนู charge) */
  ADVPAY: SVG('currentColor', '<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5z"/><circle cx="16.5" cy="12" r="1.6" fill="var(--sb-bg-1)"/>', true),
  /* Close Job — กล่องปิดผนึก + เครื่องหมายถูก */
  CLOSEJOB: SVG('currentColor', '<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="M8.5 12l2.5 2.5 4.5-4.5" fill="none" stroke="var(--sb-bg-1)" stroke-width="2"/>', true),
  /* ผู้ใช้งาน — คน 2 คน */
  USERS: SVG('currentColor', '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0z"/><circle cx="17.5" cy="9" r="2.8"/><path d="M14.5 20a5.2 5.2 0 0 1 7-4.9V20z"/>', true),
  /* ออกจากระบบ — ลูกศรออกจากกล่อง */
  LOGOUT: SVG('currentColor', '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M15.5 8.5 19 12l-3.5 3.5M19 12h-9"/>', false),
};


export function renderShell() {
  if (document.getElementById('app-shell')) return;
  const p = AppState.profile || {};

  /* ── เมนูตามโครง DOCUMENT → ACCOUNTING → FINANCE → REPORT → SYSTEM ──
     DOCUMENT  = งานต้นทางทั้งหมด (งานที่ออก Invoice แล้วยังอยู่)
     ACCOUNTING = คิวรอออก Invoice (กรองที่ server · Job เดียวกัน ไม่มีข้อมูลซ้ำ) */
  const item = (nav, icon, label) =>
    `<button class="sb-item sb-sub" data-nav="${nav}"><span class="sb-ic">${icon}</span><span>${esc(label)}</span></button>`;

  const chargeItems = (prefix, perm) => CHARGE_TYPES
    .filter(c => SIDEBAR_GROUPS.some(g => can(perm, c.key, g)))
    .map(c => item(`${prefix}/${c.key.toLowerCase()}`, ICON[c.key] || '', c.key === 'SERVICE' ? 'Service' : 'Advance'))
    .join('');

  const docItems = chargeItems('document', 'view');
  const acctItems = chargeItems('accounting', 'invoice');

  /* Credit Note = ใบลดหนี้ (ใช้งานจริงแล้ว) · แสดงเฉพาะผู้มีสิทธิ์ออก Invoice — เงื่อนไขเดิม */
  /* FINANCE = ปลายทางของ Flow · เรียง Credit Note → Receipt → Advance → Close Job
     Receipt ใช้ route/component เดิม ไม่สร้างซ้ำ */
  const finItems =
    (can('invoice') ? item('finance/credit-note', ICON.CREDIT, 'Credit Note') : '') +
    item('finance/receipt', ICON.RECEIPT, 'Receipt') +
    item('finance/advance', ICON.ADVPAY, 'Advance') +
    item('finance/close-job', ICON.CLOSEJOB, 'Close Job');

  const repItems =
    item('report', ICON.REPORT, 'Report') +
    item('report/withholding', ICON.WHT, 'ใบหัก ณ ที่จ่าย');

  /* SYSTEM > ตั้งค่าลูกค้า = Customer Master กลาง (njacc_customers)
     ชี้ไป route เดิม 'masters' แท็บ customers — ไม่สร้างหน้า/ตาราง/RPC ใหม่
     สิทธิ์ตรงกับ route (perm: isAdmin) และตรงกับ guard ใน njacc_upsert_customer */
  /* SYSTEM > ตั้งค่า — เมนูเดียวสำหรับ Master Data ทั้งสองส่วน
     ในหน้ามีแท็บ "ตั้งค่าลูกค้า | ตั้งค่ารายการบริการ" (คนละ Master คนละ Save)
     ค่าเริ่มต้นเปิดแท็บลูกค้า */
  const sys = [];
  if (isAdmin())
    sys.push(`<button class="sb-item sb-sub" data-nav="settings/customers"><span class="sb-ic">${ICON.CUSTOMER}</span><span>ตั้งค่า</span></button>`);
  sys.push(`<button class="sb-item sb-sub" data-nav="backup"><span class="sb-ic">${ICON.BACKUP}</span><span>Backup</span></button>`);
  if (isAdmin() || can('manage_users'))
    sys.push(`<button class="sb-item sb-sub" data-nav="users"><span class="sb-ic">${ICON.USERS}</span><span>ผู้ใช้งาน</span></button>`);
  sys.push(`<button class="sb-item sb-sub" id="sb-logout"><span class="sb-ic">${ICON.LOGOUT}</span><span>ออกจากระบบ</span></button>`);

  document.body.innerHTML = `<div class="app" id="app-shell">
    <aside class="sb" id="sb">
      <div class="sb-brand"><div class="logo">NJ</div>
        <div><div class="nm">${APP_NAME}</div><div class="sub">Accounting System</div></div></div>
      <nav class="sb-nav">
        ${docItems ? `<div class="sb-sec">${ICON.SEC_DOC}<span>DOCUMENT</span></div>${docItems}` : ''}
        ${acctItems ? `<div class="sb-sec">${ICON.SEC_ACCT}<span>ACCOUNTING</span></div>${acctItems}` : ''}
        <div class="sb-sec">${ICON.SEC_FIN}<span>FINANCE</span></div>${finItems}
        <div class="sb-sec">${ICON.REPORT_SEC || ICON.REPORT}<span>REPORT</span></div>${repItems}
        <div class="sb-sec">${ICON.SEC_SYS}<span>SYSTEM</span></div>${sys.join('')}
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
    const { doLogout } = await import('../system/logout.js');
    doLogout();
  };
}
export function setActiveNav(path) {
  document.querySelectorAll('.sb-item.active').forEach(x => x.classList.remove('active'));
  const el = document.querySelector(`[data-nav="${path}"]`)
    || document.querySelector(`[data-nav^="${path}?"]`)      /* เมนูที่มี query เช่น masters?tab=customers */
    /* ทุก sub-route ของ SYSTEM > ตั้งค่า ต้อง Active ที่เมนู "ตั้งค่า" ตัวเดียว */
    || (path.startsWith('settings/') ? document.querySelector('[data-nav^="settings/"]') : null);
  if (el) { el.classList.add('active'); el.closest('.sb-group')?.classList.add('open'); }
}
export function setTitle(t) {
  const el = document.getElementById('tb-title'); if (el) el.textContent = t || '';
  document.title = (t ? t + ' · ' : '') + 'BILLING NJ';
}
/* หน้าเริ่มต้น = หน้ารายการแรกที่ผู้ใช้มีสิทธิ์ (ไม่มีเมนู "ภาพรวมระบบ" แล้ว) */
export function firstAllowedRoute() {
  for (const c of CHARGE_TYPES) for (const g of SIDEBAR_GROUPS)
    if (can('view', c.key, g)) return `document/${c.key.toLowerCase()}`;
  return 'report';
}
