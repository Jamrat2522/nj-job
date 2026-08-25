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
/* ปลายทางของแต่ละหมวด — แหล่งเดียวกับที่ Tab ใช้ (ไม่เขียนเงื่อนไขสิทธิ์ซ้ำ) */
import { groupEntry, findGroup } from './group-tabs.js';
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
  /* Job Form — แผ่นฟอร์มมีบรรทัด (ชุดเดียวกับ CREDIT: เอกสาร + เส้น) */
  JOBFORM: SVG('currentColor', '<path d="M5 3h9l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1"/><path d="M8 11h8M8 14.5h8M8 18h5" fill="none" stroke="var(--sb-bg-1)" stroke-width="2"/>', true),
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
  /* ลูกศรหัวหมวดยุบ/ขยาย — .sb-caret หมุน 90deg เมื่อ .sb-group.open (CSS เดิม)
     ใช้ helper SVG() ตัวเดียวกับไอคอนอื่น -> ชุดเดียวกัน ขนาดเท่ากัน */
  CARET: `<span class="sb-caret">${SVG('currentColor', '<path d="M9 6l6 6-6 6"/>', false)}</span>`,
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

  /* ── DOCUMENT / ACCOUNTING = เมนูหลักตัวเดียว ────────────────────────────
     เดิมแตกเป็น 2 เมนูย่อย (Service / Advance) ต่อหมวด รวม 4 รายการ
     ตอนนี้เหลือหมวดละ 1 รายการ · เลือก SERVICE/ADVANCE ที่ Tab บนหัวหน้าแทน
     *** ไม่ได้ลบ route / logic / state ของโหมดใด ***
     route document/service · document/advance · accounting/service ·
     accounting/advance ยังอยู่ครบใน routes.js และ Tab เรียกใช้ตรง ๆ
     -> Bookmark หรือลิงก์เก่าไปโหมด advance ยังเข้าได้ปกติ ไม่กลายเป็น 404

     ปลายทางของเมนู = โหมดแรกที่ผู้ใช้มีสิทธิ์ (ปกติคือ SERVICE ตามข้อกำหนด
     "ค่าเริ่มต้นเมื่อเข้าครั้งแรก = SERVICE") ถ้าไม่มีสิทธิ์ SERVICE จึงตกไป ADVANCE
     ไม่มีสิทธิ์ทั้งคู่ -> ไม่แสดงเมนูนั้นเลย (เงื่อนไขสิทธิ์เดิมทุกประการ) */
  /* ── ลูกของ DOCUMENT / ACCOUNTING = SERVICE / ADVANCE ────────────────────
     Route เดิมจาก config/routes.js (ไม่สร้าง route ใหม่):
       document/service   · document/advance    perm = can('view', KEY, 'NJ')
       accounting/service · accounting/advance  perm = can('invoice', KEY, 'NJ')
     สร้างจาก CHARGE_TYPES ชุดเดียวกับที่ routes.js ใช้ -> key ตรงกันเสมอ
     *** สิทธิ์ยกมาจาก routes.js ตรง ๆ ไม่ตั้งเงื่อนไขใหม่ ***
     รูปแบบเดียวกับที่ FINANCE ส่งให้ groupBlock() */
  const chargeKids = (prefix, perm) => CHARGE_TYPES.map(c => [
    SIDEBAR_GROUPS.some(g => can(perm, c.key, g)) ? `${prefix}/${c.key.toLowerCase()}` : '',
    ICON[c.key] || '',
    c.key,
  ]);

  /* DOCUMENT > Job Form — ถอดออกจาก Sidebar แล้ว
     ความสามารถย้ายเข้าไปอยู่ในหน้าต่างเปิดงาน/แก้ไขงานของ DOCUMENT
     (ปุ่ม "🖨 Print Preview" ข้างปุ่มบันทึกงาน — jobs/job-form.js)
     *** Route #/job-form และ #/job-form/:id ยังอยู่ครบ *** (routes.js)
     เพื่อไม่ให้ Bookmark / ลิงก์เก่ากลายเป็น 404 และ Renderer เดิมยังถูก Reuse
     โดย openJobFormPreview() — ไม่ได้ลบ Template/Renderer ใด ๆ */
  /* เมนูหลัก = .sb-item ระดับบน (ไม่ใช่ .sb-sub) พร้อมไอคอนหมวดเดิม
     จึงไม่ต้องมี .sb-sec หัวข้อซ้ำชื่อเดียวกันอีก */
  /* topItem() (เมนูระดับบนที่ไม่มีลูก) ถูกถอดออกแล้ว — ทั้ง 6 หมวดเป็น Accordion หมด */

  /* ══ เมนู Sidebar ══════════════════════════════════════════════════════
     *** Navigation อย่างเดียว *** ไม่แตะ Route / State / Permission / Logic ใด
     ทุกรายการชี้ไป route เดิมที่มีอยู่แล้วใน config/routes.js

     Icon: ระบบใช้ inline SVG ชุดของตัวเอง (ICON ด้านบน สร้างด้วย helper SVG())
     *** ไม่มี Icon Library ภายนอก *** จึง Reuse ชุดเดิม ไม่วาด path ใหม่
     ทุกตัว viewBox 0 0 24 24 -> ขนาด/แนววางเท่ากันอยู่แล้ว

     ── หมวดที่ยุบ/ขยายได้ ──
     *** Reuse Accordion เดิมของ Source ทั้งหมด *** ไม่สร้างระบบใหม่:
       markup  : .sb-group > [data-toggle].sb-sec + .sb-children > .sb-item.sb-sub
       toggle  : handler เดิมที่ #app-shell — e.target.closest('[data-toggle]')
                 -> openOnlyGroup() (Single-open · V.171)
       CSS     : .sb-children{display:none} · .sb-group.open .sb-children{display:block}
                 .sb-caret หมุน 90deg เมื่อ open
       active  : setActiveNav สั่ง openOnlyGroup() ของหมวดที่มีเมนู Active
                 -> เข้าหน้าไหน หมวดนั้นกางเองอัตโนมัติ */

  /* เมนูย่อยในหมวด — .sb-item.sb-sub (เยื้องเข้าไป) ชุดเดียวกันทุกหมวด */
  const subItem = (nav, icon, label) =>
    `<button class="sb-item sb-sub" data-nav="${nav}"><span class="sb-ic">${icon}</span><span>${esc(label)}</span></button>`;

  /* หัวหมวดยุบ/ขยาย + ลูก — ไม่มีลูกเลย (ไม่มีสิทธิ์) -> ไม่แสดงทั้งหมวด */
  const groupBlock = (icon, label, children) => {
    const kids = children.filter(([nav]) => !!nav);
    if (!kids.length) return '';
    return `<div class="sb-group">
      <button class="sb-sec" data-toggle><span class="sb-ic">${icon}</span><span>${esc(label)}</span>${ICON.CARET}</button>
      <div class="sb-children">${
        kids.map(([nav, ic, lb]) => subItem(nav, ic, lb)).join('')}</div>
    </div>`;
  };

  /* ── เมนูหลักที่ไม่มีลูก (มี Tab อยู่ในหน้าตัวเองแล้ว) ──
     DOCUMENT/ACCOUNTING -> Tab [SERVICE][ADVANCE]
     FINANCE             -> Tab [CREDIT NOTE][RECEIPT]  *** ไม่มี ADVANCE/CLOSE JOB ***
                            (NAV_GROUPS ของ FINANCE มีแค่ 2 รายการนี้ — ตรวจแล้ว) */
  /* DOCUMENT / ACCOUNTING เป็นหัวหมวด Accordion เหมือน FINANCE
     *** ใช้ groupBlock() ตัวเดียวกัน *** ไม่มีเมนูระดับบนที่ไม่มีลูกอีกแล้ว
     -> ทั้ง 6 หมวดใช้ markup/class/พฤติกรรม/Single-open ชุดเดียวกันทั้งหมด */
  const topMenu = '';

  /* ── หมวดที่มีเมนูย่อย ──
     สิทธิ์ยกมาจาก routes.js ตรง ๆ ไม่ตั้งเงื่อนไขใหม่:
       finance/advance · finance/close-job : can('view')
       report · report/withholding         : ไม่มี perm -> ทุกคนเข้าได้
       settings/customers                  : isAdmin
       users                               : isAdmin() || can('manage_users')
       backup                              : ไม่มี perm */
  const groups =
    groupBlock(ICON.SEC_DOC, 'DOCUMENT', chargeKids('document', 'view')) +
    groupBlock(ICON.SEC_ACCT, 'ACCOUNTING', chargeKids('accounting', 'invoice')) +
    /* FINANCE — *** ใช้ groupBlock() ตัวเดียวกับ JOB CONTROL ***
       เดิมเป็น topItem() (เมนูเดี่ยว) แล้วให้เลือก CREDIT NOTE/RECEIPT
       ด้วย Tab ในพื้นที่ Content ซึ่งเป็นคนละรูปแบบกับหมวดอื่น
       ตอนนี้ใช้ markup/class/พฤติกรรมชุดเดียวกันทุกอย่าง:
         .sb-group > [data-toggle].sb-sec + .sb-children > .sb-item.sb-sub
       -> ความสูง/padding/font/icon/indent/active/hover มาจากกฎเดียวกัน
       สิทธิ์ยกมาจาก routes.js ตรง ๆ (เหมือนที่ NAV_GROUPS ใช้):
         finance/credit-note : can('invoice')   ·  finance/receipt : can('view') */
    groupBlock(ICON.SEC_FIN, 'FINANCE', [
      [can('invoice') ? 'finance/credit-note' : '', ICON.CREDIT, 'CREDIT NOTE'],
      [can('view') ? 'finance/receipt' : '', ICON.RECEIPT, 'RECEIPT'],
    ]) +
    groupBlock(ICON.CLOSEJOB, 'JOB CONTROL', [
      [can('view') ? 'finance/advance' : '', ICON.ADVPAY, 'ADVANCE'],
      [can('view') ? 'finance/close-job' : '', ICON.CLOSEJOB, 'CLOSE JOB'],
    ]) +
  /* ── V.219 ── หัวหมวดใช้ชื่อ 'REPORT' ตรง ๆ (เดิม 'REPORT & TAX')
     *** เปลี่ยนเฉพาะข้อความหัวหมวด *** route / ICON / ลูกเมนู ไม่ถูกแตะ */
    groupBlock(ICON.REPORT, 'REPORT', [
      ['report', ICON.REPORT, 'REPORT'],
      ['report/withholding', ICON.WHT, 'ใบหัก ณ ที่จ่าย'],
    ]) +
    groupBlock(ICON.SEC_SYS, 'SYSTEM', [
      [isAdmin() ? 'settings/customers' : '', ICON.CUSTOMER, 'ตั้งค่า'],
      [(isAdmin() || can('manage_users')) ? 'users' : '', ICON.USERS, 'ผู้ใช้งาน'],
      ['backup', ICON.BACKUP, 'Backup'],
    ]);

  const navItems = topMenu + groups;

  /* ออกจากระบบ — ต่อจาก Backup ในลำดับเดียวกัน ไม่เว้นช่องว่าง ไม่มีเส้นคั่น
     ยังเป็น Action แยก (ไม่มี data-nav · ไม่ใช่ route) — handler เดิม #sb-logout */
  const logoutItem =
    `<button class="sb-item sb-logout" id="sb-logout"><span class="sb-ic">${ICON.LOGOUT}</span><span>ออกจากระบบ</span></button>`;

  document.body.innerHTML = `<div class="app" id="app-shell">
    <aside class="sb" id="sb">
      <!-- ชื่อผู้ใช้ + Role ย้ายมาอยู่ใต้ชื่อระบบ (เดิมอยู่ท้าย Sidebar ที่ .sb-user)
           ค่ามาจาก AppState.profile ตัวเดิมทุกประการ (p.full_name / p.role)
           *** ไม่ hardcode ชื่อ/Role *** ผู้ใช้แต่ละคนเห็นของตัวเอง
           ไม่แตะ Login / Session / Role / Permission ใด ๆ -->
      <div class="sb-brand"><div class="logo">NJ</div>
        <div class="sb-brand-tx"><div class="nm">${APP_NAME}</div>
          <div class="sub">Accounting System</div>
          ${p.full_name ? `<div class="sb-me">${esc(p.full_name)}</div>` : ''}
          ${p.role ? `<div class="sb-me-rl">${esc((p.role || '').replace('_', ' '))}</div>` : ''}
        </div></div>
      <nav class="sb-nav">
        ${navItems}${logoutItem}
      </nav>
    </aside>
    <div class="app-main">
      <header class="tb">
        <button class="btn-icon tb-menu" id="tb-menu">☰</button>
        <span class="tb-title" id="tb-title"></span>
        <span class="tb-ver">v${APP_VERSION}</span><span class="sp"></span>
        <!-- ช่องปุ่มเฉพาะหน้า (Page Action Slot) — ว่างเปล่าโดยค่าเริ่มต้น
             หน้าใดต้องการปุ่มมุมขวาบนจึงเติมเนื้อหาเข้ามาเอง (charges/charge-page.js)
             router.js ล้างค่าให้ทุกครั้งที่เปลี่ยนหน้า -> ไม่มีปุ่มค้างข้ามหน้า
             ว่าง = ไม่มี element ลูก · .tb เป็น flex+gap จึงไม่กินพื้นที่ใด ๆ -->
        <div class="tb-act" id="tb-act"></div>
        <div class="tb-user"><div class="tb-ava">${esc((p.full_name || '?')[0])}</div>
          <div><div class="t-sm t-b">${esc(p.full_name || '')}</div>
            <div class="t-xs t-3">${esc((p.role || '').replace('_', ' '))}</div></div></div>
      </header>
      <main class="app-content" id="app-content"></main>
    </div></div>`;

  document.getElementById('app-shell').addEventListener('click', e => {
    const nv = e.target.closest('[data-nav]');
    if (nv) { location.hash = '#/' + nv.dataset.nav; document.getElementById('sb').classList.remove('open'); return; }
    /* หัวหมวดไม่มี data-nav -> ไม่เข้าเงื่อนไขข้างบน = *** ไม่เปลี่ยน Route ***
       ทำหน้าที่เปิด/ปิด Submenu อย่างเดียวตามข้อกำหนด */
    const tg = e.target.closest('[data-toggle]');
    if (tg) {
      const g = tg.closest('.sb-group');
      /* กดหมวดที่เปิดอยู่ซ้ำ -> ยุบ (openSection = null)
         กดหมวดอื่น -> หมวดเดิมปิดทันที แล้วเปิดหมวดใหม่ */
      openOnlyGroup(g.classList.contains('open') ? null : g);
    }
  });
  document.getElementById('tb-menu').onclick = () => document.getElementById('sb').classList.toggle('open');
  document.getElementById('sb-logout').onclick = async () => {
    const { doLogout } = await import('../system/logout.js');
    doLogout();
  };
}
/* ══ Single-open Accordion ═══════════════════════════════════════════════
   *** State กลางค่าเดียว *** = "หมวดไหนที่มีคลาส .open อยู่"
   ไม่มี Boolean แยกรายหมวด จึงไม่มีทางเปิดพร้อมกันได้ 2 หมวด
   DOM คือแหล่งความจริงเดียว -> ลูกศร (.sb-caret) Sync อัตโนมัติเสมอ
   เพราะ CSS ผูกกับ .sb-group.open ตัวเดียวกัน (กฎเดิม ไม่ได้แก้)

   g = null  -> ปิดทุกหมวด
   g = หมวด  -> ปิดหมวดอื่นทั้งหมด แล้วเปิดหมวดนั้น */
function openOnlyGroup(g) {
  document.querySelectorAll('#sb .sb-group.open').forEach(x => {
    if (x !== g) x.classList.remove('open');
  });
  if (g) g.classList.add('open');
}

export function setActiveNav(path) {
  document.querySelectorAll('.sb-item.active').forEach(x => x.classList.remove('active'));
  const el = document.querySelector(`[data-nav="${path}"]`)
    || document.querySelector(`[data-nav^="${path}?"]`)      /* เมนูที่มี query เช่น masters?tab=customers */
    /* ทุก sub-route ของ SYSTEM > ตั้งค่า ต้อง Active ที่เมนู "ตั้งค่า" ตัวเดียว */
    || (path.startsWith('settings/') ? document.querySelector('[data-nav^="settings/"]') : null)
    /* ── ทุกเมนูย่อยมี data-nav ตรงตัวแล้ว ──
       document/service · document/advance · accounting/service · accounting/advance ·
       finance/credit-note · finance/receipt · finance/advance · finance/close-job ·
       report · report/withholding · settings/customers · users · backup
       -> แมตช์ที่เงื่อนไขแรกสุดเสมอ ไม่ต้องมี fallback ของหมวดอีก
       (fallback เดิมมีไว้ตอน DOCUMENT/ACCOUNTING/FINANCE ยังเป็นเมนูเดี่ยว
        ตอนนี้ทั้ง 6 หมวดเป็น Accordion หมดแล้ว จึงถอดออก — ถ้าปล่อยไว้
        มีโอกาสไฮไลต์ผิดตัวเมื่อ path ไม่ตรงกับลูกใด) */
    || (() => { const hit = findGroup(path);
          return hit ? document.querySelector(`[data-nav="${groupEntry(hit.group.key)}"]`) : null;
        })();
  if (el) {
    el.classList.add('active');
    /* เมนูย่อยที่ Active อยู่หมวดไหน -> เปิดหมวดนั้น "หมวดเดียว"
       (เดิมใช้ add('open') เฉย ๆ ทำให้หมวดที่ผู้ใช้เปิดค้างไว้ยังเปิดอยู่ = 2 หมวด)
       เมนูหลักที่ไม่มีหมวด (DOCUMENT/ACCOUNTING/FINANCE) -> ไม่ไปยุ่งกับหมวดที่เปิดอยู่
       เพราะไม่มีหมวดไหนต้องเปิด และ single-open ก็ยังไม่ถูกละเมิด */
    const g = el.closest('.sb-group');
    if (g) openOnlyGroup(g);
  }
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
