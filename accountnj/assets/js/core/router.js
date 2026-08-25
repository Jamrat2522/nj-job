/* Hash router — ทุก page module ถูก bundle รวมใน app.bundle.js (เปิดจาก file:// ได้)
   cache-bust ทำที่ index.html (?v= ท้าย app.bundle.js) แทนการ bust ราย module */
import { AppState } from './state.js';
import { checkNow } from './version-guard.js';
import { renderShell, setActiveNav, setTitle, firstAllowedRoute } from '../components/sidebar.js';
import { handleErr } from './error-handler.js';
import { closeModal } from '../components/modal.js';
import { buildRoutes } from '../config/routes.js';
/* แถบ Tab ของหมวด — Navigation อย่างเดียว ไม่มี Business Logic */
import { mountGroupTabs } from '../components/group-tabs.js';

/* MODULE_LOADERS: dynamic import แบบ path คงที่ เพื่อให้ bundler รวมทุกหน้าลงไฟล์เดียว
   (แทน import(v(route.module)) ที่เป็น runtime string ซึ่ง browser ต้อง fetch ไฟล์แยก) */
const MODULE_LOADERS = {
  '../charges/charge-page.js': () => import('../charges/charge-page.js'),
  '../jobs/job-form.js': () => import('../jobs/job-form.js'),
  '../jobs/job-detail.js': () => import('../jobs/job-detail.js'),
  '../jobs/job-form-doc.js': () => import('../jobs/job-form-doc.js'),
  '../invoices/invoice-form.js': () => import('../invoices/invoice-form.js'),
  '../invoices/invoice-view.js': () => import('../invoices/invoice-view.js'),
  '../receipts/receipt-page.js': () => import('../receipts/receipt-page.js'),
  '../finance/credit-note.js': () => import('../finance/credit-note.js'),
  '../payments/payment-form.js': () => import('../payments/payment-form.js'),
  '../reports/report-home.js': () => import('../reports/report-home.js'),
  '../reports/report-page.js': () => import('../reports/report-page.js'),
  '../withholding/withholding-page.js': () => import('../withholding/withholding-page.js'),
  '../master/master-admin.js': () => import('../master/master-admin.js'),
  '../system/users.js': () => import('../system/users.js'),
  '../system/audit.js': () => import('../system/audit.js'),
  '../system/backup.js': () => import('../system/backup.js'),
};

let ROUTES = null;
export async function startRouter() {
  ROUTES = buildRoutes();
  window.addEventListener('hashchange', () => go());
  await go();
}
export function nav(hash) { if (location.hash === hash) go(); else location.hash = hash; }

async function go() {
  closeModal();          /* กัน Modal ค้างบังหน้าจอเมื่อเปลี่ยนหน้าระหว่างเปิด Modal อยู่ */
  const ok = await checkNow('route');
  if (!ok) return;
  const hash = location.hash.replace(/^#\/?/, '') || firstAllowedRoute();
  const [path, qs] = hash.split('?');
  const params = Object.fromEntries(new URLSearchParams(qs || ''));
  const route = matchRoute(path);
  if (!route) { nav('#/' + firstAllowedRoute()); return; }
  if (route.perm && !route.perm()) {
    document.getElementById('app-content').innerHTML =
      '<div class="card card-pad empty">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>';
    return;
  }
  AppState.route = { path, params, def: route };
  renderShell();
  /* ── ล้าง Page Action Slot + สถานะ Topbar ก่อน render หน้าใหม่ ──────────────
     Topbar เป็น Shell กลางที่ render ครั้งเดียวและถูกใช้ซ้ำทุกหน้า
     ถ้าไม่ล้าง ปุ่มของหน้าก่อนหน้าจะค้างอยู่เมื่อเปลี่ยนไปหน้าอื่น
     หน้าที่ต้องการปุ่ม/ซ่อนโปรไฟล์ จะตั้งค่าเองหลังจากนี้ (charges/charge-page.js)
     ไม่แตะ Auth / Session / Role / Permission ใด ๆ */
  const _shell = document.getElementById('app-shell');
  if (_shell) _shell.classList.remove('doc-hd');
  const _tbAct = document.getElementById('tb-act');
  if (_tbAct) _tbAct.innerHTML = '';
  setActiveNav(path);
  setTitle(route.title);
  const cnt = document.getElementById('app-content');
  cnt.innerHTML = '<div class="load-row"><div class="spin"></div><div class="mt-1">กำลังโหลด…</div></div>';
  try {
    const load = MODULE_LOADERS[route.module];
    if (!load) throw new Error('ไม่พบโมดูลหน้า: ' + route.module);
    const mod = await load();
    await mod.render(cnt, { ...route.args, ...params });
    /* ── แถบ Tab ของหมวด (FINANCE / JOB CONTROL / REPORT / SYSTEM) ──────────
       ใส่หลัง render เสมอ เพราะแต่ละหน้าเซ็ต cnt.innerHTML ของตัวเองทับ
       คืนค่าว่างเมื่อไม่ใช่หน้าในกลุ่ม -> หน้าอื่นไม่ถูกแตะเลย
       DOCUMENT/ACCOUNTING มี Tab ของตัวเองใน charge-page.js อยู่แล้ว ไม่ซ้ำกัน */
    mountGroupTabs(cnt, path);
  } catch (e) { handleErr(e, 'โหลดหน้าไม่สำเร็จ'); cnt.innerHTML = '<div class="card card-pad empty">โหลดหน้าไม่สำเร็จ</div>'; }
}
function matchRoute(path) {
  if (ROUTES[path]) return ROUTES[path];
  for (const k in ROUTES) {
    if (!k.includes(':')) continue;
    const kp = k.split('/'), pp = path.split('/');
    if (kp.length !== pp.length) continue;
    const args = {};
    let ok = true;
    kp.forEach((seg, i) => { if (seg.startsWith(':')) args[seg.slice(1)] = pp[i]; else if (seg !== pp[i]) ok = false; });
    if (ok) return { ...ROUTES[k], args: { ...ROUTES[k].args, ...args } };
  }
  return null;
}
