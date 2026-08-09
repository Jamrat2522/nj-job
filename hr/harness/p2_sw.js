/* p2_sw.js — Service Worker Cache Report (ตรวจของจริงใน Cache Storage)
   ใช้: node p2_sw.js <ทางโปรเจกต์> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');
const F = require('/home/claude/work/harness/fixtures.js');

function serve(root, port) {
  const T = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png' };
  return new Promise(r => {
    const s = http.createServer((rq, rs) => {
      let p = decodeURIComponent(rq.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); }
      rs.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      rs.end(fs.readFileSync(f));
    }).listen(port, () => r(s));
  });
}
let PASS = 0, FAIL = 0; const LINES = [];
function chk(n, ok, e) { ok ? PASS++ : FAIL++; LINES.push('| ' + n + ' | ' + (ok ? 'PASS' : '**FAIL**') + ' | ' + e + ' |'); console.log((ok ? 'PASS  ' : 'FAIL  ') + n.padEnd(56) + e); }

const dump = p => p.evaluate(async () => {
  const out = {};
  for (const k of await caches.keys()) {
    out[k] = (await (await caches.open(k)).keys()).map(r => new URL(r.url).pathname + new URL(r.url).search);
  }
  return out;
});

(async () => {
  const dir = process.argv[2], port = Number(process.argv[3]);
  const srv = await serve(dir, port);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'asset-manifest.js'), 'utf8').match(/\{[\s\S]*\}/)[0]);
  const swV = (fs.readFileSync(path.join(dir, 'sw.js'), 'utf8').match(/const V = '([^']+)'/) || [])[1];
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext();
  await ctx.route('**/rest/v1/rpc/*', route => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(F.respond(fn, bd)) });
  });
  await ctx.route('**/storage/v1/**', r => r.fulfill({ status: 200, body: '{}' }));
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
  await p.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(2500);

  chk('SW · Cache Version ตรงกับ Build ID ใน Manifest', swV === manifest.buildId, 'sw.js V=' + swV + ' · manifest.buildId=' + manifest.buildId);

  let c = await dump(p);
  const keys = Object.keys(c);
  chk('SW · มี cache เดียวชื่อตาม Build ID', keys.length === 1 && keys[0] === swV, 'cache=' + keys.join(','));
  const entries = c[keys[0]] || [];
  console.log('   Precache หลัง install: \n     ' + entries.join('\n     '));

  const has = re => entries.some(x => re.test(x));
  chk('SW · Precache index.html', has(/index\.html$/) || has(/^\/$/), entries.filter(x => /index|^\/$/.test(x)).join(','));
  chk('SW · Precache CSS หลัก 2 ไฟล์', has(/styles\.css/) && has(/mobile\.css/), entries.filter(x => /\.css/.test(x)).join(','));
  chk('SW · Precache โลโก้ที่ใช้จริง', has(/nj-logistic-logo\.png/), entries.filter(x => /\.png/.test(x)).join(',') || 'ไม่พบ');
  chk('SW · Precache Asset Manifest', has(/asset-manifest\.js/), entries.filter(x => /asset-manifest/.test(x)).join(','));
  chk('SW · Precache Runtime Namespace', has(/runtime\/namespace\.js/), entries.filter(x => /namespace/.test(x)).join(','));
  chk('SW · Precache Runtime Core', has(/runtime\/core\.js/), entries.filter(x => /core\.js/.test(x)).join(','));
  chk('SW · ไม่ Precache config.js', !has(/config\.js/), has(/config\.js/) ? 'พบใน cache' : 'ไม่มีใน cache');
  chk('SW · ไม่ Precache Dashboard Module', !has(/dashboard\.js/), has(/dashboard\.js/) ? 'พบ' : 'ไม่มีใน cache ตอน install');
  chk('SW · ไม่ Precache Compatibility Bundle', !has(/app-legacy\.js/), has(/app-legacy\.js/) ? 'พบ' : 'ไม่มีใน cache ตอน install');
  chk('SW · ไม่ Precache face.js / master-salary.js / report-template.js',
    !has(/face\.js|master-salary\.js|report-template\.js/), 'ไม่มีใน cache ตอน install');

  // login → dashboard
  await p.evaluate(() => {
    document.getElementById('lg-user').value = 'admin';
    document.getElementById('lg-pass').value = 'Admin1234';
    document.getElementById('login-form').onsubmit({ preventDefault: function () {} });
  });
  await p.waitForTimeout(2500);
  c = await dump(p); const e2 = c[keys[0]] || [];
  chk('SW · Dashboard Module ถูก cache หลังเปิด Dashboard ครั้งแรก', e2.some(x => /dashboard\.js/.test(x)), e2.filter(x => /dashboard/.test(x)).join(',') || 'ไม่พบ');
  chk('SW · Compatibility ยังไม่ถูก cache ตอนอยู่หน้า Dashboard', !e2.some(x => /app-legacy\.js/.test(x)), 'compat ใน cache = ' + e2.filter(x => /app-legacy/.test(x)).length);

  // P3: #/employees ไม่ใช่ compat แล้ว — ต้องได้ chunk ของ Employees และ "ต้องไม่มี" compat
  await p.evaluate(() => { location.hash = '#/employees'; });
  await p.waitForTimeout(3500);
  let cE = await dump(p); const eE = cE[keys[0]] || [];
  chk('SW · เปิด Employees ได้ chunk ของ Employees', eE.some(x => /employees\/list\.js/.test(x)),
    eE.filter(x => /employees|shared/.test(x)).join(',') || 'ไม่พบ');
  chk('SW · เปิด Employees ไม่ดาวน์โหลด Compatibility', !eE.some(x => /app-legacy\.js/.test(x)), 'compat ใน cache = ' + eE.filter(x => /app-legacy/.test(x)).length);
  chk('SW · เปิด Employees ไม่ดาวน์โหลด Leave / OT / Attendance Report',
    !eE.some(x => /leave\/index\.js|ot\/index\.js|attendance\/report\.js/.test(x)), 'ไม่พบใน cache');
  chk('SW · เปิด Employees ไม่ดาวน์โหลด Import / Export', !eE.some(x => /employees\/(import|export)\.js/.test(x)), 'ไม่พบใน cache');
  // เปิด Leave แล้วต้องไม่ดึง Employees Import
  await p.evaluate(() => { location.hash = '#/leave'; }); await p.waitForTimeout(2500);
  const eL = (await dump(p))[keys[0]] || [];
  chk('SW · เปิด Leave ไม่ดาวน์โหลด Employees Import', !eL.some(x => /employees\/import\.js/.test(x)), 'ไม่พบใน cache');
  await p.evaluate(() => { location.hash = '#/ot'; }); await p.waitForTimeout(2500);
  const eO = (await dump(p))[keys[0]] || [];
  chk('SW · เปิด OT ไม่ดาวน์โหลด Attendance Report', !eO.some(x => /attendance\/report\.js/.test(x)), 'ไม่พบใน cache');
  // route ที่ยังอยู่ compat จริง ๆ
  await p.evaluate(() => { location.hash = '#/users'; });
  await p.waitForTimeout(3500);
  c = await dump(p); const e3 = c[keys[0]] || [];
  chk('SW · Compatibility ถูก cache เมื่อเปิด Feature เดิมครั้งแรก (#/users)', e3.some(x => /app-legacy\.js/.test(x)), e3.filter(x => /app-legacy/.test(x)).join(',') || 'ไม่พบ');
  chk('SW · ไม่ cache request ของ Supabase / Signed URL / API', !e3.some(x => /rest\/v1|storage\/v1|rpc/.test(x)), 'รายการที่เป็น API ใน cache = 0');
  chk('SW · config.js ยังไม่ถูก cache หลังใช้งานจริง', !e3.some(x => /config\.js/.test(x)), 'config.js ใน cache = ' + e3.filter(x => /config\.js/.test(x)).length);
  console.log('   Cache หลังใช้งานจริง: \n     ' + e3.join('\n     '));
  LINES.push('| SW · รายการใน Cache หลังใช้งานจริง | PASS | `' + e3.join(' , ') + '` |');

  // จำลอง build ใหม่: ใส่ cache ของ build เก่าเข้าไป แล้ว re-register
  await p.evaluate(async () => { const c = await caches.open('njhr-v2-OLDBUILD'); await c.put('/old.js', new Response('x')); });
  await p.evaluate(async () => { const c = await caches.open('other-app-cache'); await c.put('/keep.js', new Response('x')); });
  await p.evaluate(async () => {
    const rs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(rs.map(r => r.unregister()));
  });
  await p.reload({ waitUntil: 'load' });
  await p.waitForTimeout(4000);
  c = await dump(p);
  const after = Object.keys(c);
  chk('SW · Activate ลบ cache ของ build เก่า', after.indexOf('njhr-v2-OLDBUILD') < 0, 'cache ที่เหลือ = ' + after.join(','));
  chk('SW · ไม่ลบ cache ของแอปอื่นบน origin เดียวกัน', after.indexOf('other-app-cache') >= 0, 'other-app-cache ยังอยู่ = ' + (after.indexOf('other-app-cache') >= 0));
  const cur = c[swV] || [];
  const known = [manifest.runtime.namespace, manifest.runtime.core, manifest.styles.main, manifest.styles.mobile]
    .concat(Object.keys(manifest.modules).map(k => manifest.modules[k].url)).map(u => u.split('?')[1]);
  const stale = cur.filter(x => /\?v=/.test(x) && !/asset-manifest/.test(x) && !known.some(h => x.indexOf(h) >= 0));
  chk('SW · ไม่มี Asset จาก build เก่าปะปนใน cache ปัจจุบัน', stale.length === 0,
    'รายการ ' + cur.length + ' ตัว · ไม่ตรง manifest ' + stale.length + (stale.length ? ' (' + stale.join(',') + ')' : ''));

  await b.close(); srv.close();
  fs.writeFileSync(path.join(__dirname, 'p2_sw_result.md'),
    '| Test Case | ผล | หลักฐาน |\n|---|---|---|\n' + LINES.join('\n') + '\n\n**PASS ' + PASS + ' · FAIL ' + FAIL + '**\n');
  console.log('\nPASS ' + PASS + ' · FAIL ' + FAIL);
  process.exit(FAIL ? 1 : 0);
})();
