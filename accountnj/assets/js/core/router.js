/* Hash router + lazy import ต่อ page (cache-bust ด้วย APP_VERSION) */
import { v } from './config.js';
import { AppState } from './state.js';
import { checkNow } from './version-guard.js';
import { renderShell, setActiveNav, setTitle, firstAllowedRoute } from '../components/sidebar.js';
import { handleErr } from './error-handler.js';

let ROUTES = null;
export async function startRouter() {
  const m = await import(v('../config/routes.js'));
  ROUTES = m.buildRoutes();
  window.addEventListener('hashchange', () => go());
  await go();
}
export function nav(hash) { if (location.hash === hash) go(); else location.hash = hash; }

async function go() {
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
  setActiveNav(path);
  setTitle(route.title);
  const cnt = document.getElementById('app-content');
  cnt.innerHTML = '<div class="load-row"><div class="spin"></div><div class="mt-1">กำลังโหลด…</div></div>';
  try {
    const mod = await import(v(route.module));
    await mod.render(cnt, { ...route.args, ...params });
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
