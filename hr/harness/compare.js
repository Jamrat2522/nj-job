/* Regression Harness — เปิด V1 และ V2 ด้วย fixture ชุดเดียวกัน แล้ว diff DOM ต่อ Route */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'); const fs = require('fs'); const path = require('path');
const F = require('./fixtures.js');

function serve(root, port) {
  const T = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.png':'image/png' };
  return new Promise(r => {
    const s = http.createServer((rq, rs) => {
      let p = decodeURIComponent(rq.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f)) { rs.writeHead(404); return rs.end(); }
      rs.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      rs.end(fs.readFileSync(f));
    }).listen(port, () => r(s));
  });
}

const NORM = [
  [/MOCK-TOKEN-[A-Z0-9-]+/g, '<TOKEN>'],
  [/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, '<DATE>'],
  [/\b\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?)?/g, '<DATE>'],
  [/\b\d{1,2}:\d{2}(:\d{2})?\s*(น\.)?/g, '<TIME>'],
  [/njhr-v2?-?v?\d+/g, '<CACHEVER>'],
  [/\?_=\d+/g, '?_=<TS>'],
  [/id="[a-z]+-[0-9a-z]{6,}"/g, 'id="<RID>"'],
  [/v2\.\d+\.\d+[-\w.]*/g, '<BUILD>']
];
const norm = s => NORM.reduce((a, [re, to]) => a.replace(re, to), s || '');

const ROUTES = ['#/dashboard','#/employees','#/hr-docs','#/attendance','#/requests','#/req-history',
 '#/leave','#/ot','#/payroll','#/salary-merge','#/epayslip','#/approval-settings','#/pay-items',
 '#/sso','#/approvals','#/reports','#/calendar','#/announcements','#/users','#/departments',
 '#/settings','#/geofence','#/shifts','#/audit','#/reportall','#/notifications','#/profile'];

async function snap(base, port, viewport) {
  const b = await chromium.launch({ executablePath:'/opt/google/chrome/chrome', args:['--no-sandbox'] });
  const ctx = await b.newContext({ viewport });
  const p = await ctx.newPage();
  // ดัก Supabase ทุก request แล้วตอบด้วย fixture ชุดเดียวกัน — ไม่ต้องแก้ config ของทั้งสองฝั่ง
  await ctx.route('**/rest/v1/rpc/*', route => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    route.fulfill({ status: 200, contentType: 'application/json',
                    headers: { 'access-control-allow-origin': '*' },
                    body: JSON.stringify(F.respond(fn, body)) });
  });
  await ctx.route('**/storage/v1/**', route => route.fulfill({ status: 200, body: '{}' }));
  const errors = [];
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  p.on('pageerror', e => errors.push('PAGEERROR: ' + e.message.slice(0, 160)));
  await p.goto(`http://127.0.0.1:${port}/index.html`);
  await p.waitForTimeout(700);
  await p.evaluate(() => localStorage.setItem('njhr_token', 'MOCK-TOKEN-FIXED'));
  await p.reload(); await p.waitForTimeout(1200);
  const out = { errors, routes: {} };
  for (const r of ROUTES) {
    await p.evaluate(h => { location.hash = h; }, r);
    await p.waitForTimeout(2600);
    out.routes[r] = {
      title: norm(await p.evaluate(() => { const e = document.querySelector('.topbar h2, .page-title, header h2'); return e ? e.textContent.trim() : ''; })),
      menu: norm(await p.evaluate(() => Array.from(document.querySelectorAll('#sidebar a, .nav-item, .menu-item')).map(a => a.textContent.trim()).join('|'))),
      ths: norm(await p.evaluate(() => Array.from(document.querySelectorAll('#main-view th, #view-host th')).map(t => t.textContent.trim()).join('|'))),
      rows: await p.evaluate(() => document.querySelectorAll('#main-view tbody tr, #view-host tbody tr').length),
      btns: norm(await p.evaluate(() => Array.from(document.querySelectorAll('#main-view button, #view-host button')).map(b => b.id + ':' + b.textContent.trim()).join('|'))),
      text: norm(await p.evaluate(() => (document.getElementById('main-view') || document.body).innerText.replace(/\s+/g, ' ').slice(0, 1500)))
    };
  }
  await b.close();
  return out;
}

(async () => {
  const [dirA, dirB] = process.argv.slice(2);
  const sA = await serve(dirA, 8821), sB = await serve(dirB, 8822);
  const A = await snap(dirA, 8821, { width: 1920, height: 1080 });
  const B = await snap(dirB, 8822, { width: 1920, height: 1080 });
  sA.close(); sB.close();
  let diffs = 0, checked = 0;
  for (const r of ROUTES) {
    for (const k of ['title','menu','ths','rows','btns','text']) {
      checked++;
      if (JSON.stringify(A.routes[r][k]) !== JSON.stringify(B.routes[r][k])) {
        diffs++;
        console.log(`DIFF ${r} [${k}]`);
        console.log('  A:', String(A.routes[r][k]).slice(0, 200));
        console.log('  B:', String(B.routes[r][k]).slice(0, 200));
      }
    }
  }
  console.log(`\nconsole errors A=${A.errors.length} B=${B.errors.length}`);
  if (A.errors.length) console.log('  A:', A.errors.slice(0,3).join(' ; '));
  if (B.errors.length) console.log('  B:', B.errors.slice(0,3).join(' ; '));
  console.log(`ตรวจ ${checked} จุด · ต่าง ${diffs} จุด · ${diffs === 0 ? 'REGRESSION PASS' : 'REGRESSION FAIL'}`);
  fs.writeFileSync('/home/claude/harness/last.json', JSON.stringify({ A, B }, null, 1));
})();
