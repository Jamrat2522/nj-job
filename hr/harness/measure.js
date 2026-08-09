/* measure.js — วัดผลจริงด้วย Chromium + เซิร์ฟเวอร์ที่บีบ gzip เหมือน CDN
   ใช้: node measure.js <ทางโปรเจกต์> <port> <label> [scenario]
   scenario: login | dashboard | compat   (ค่าเริ่มต้น login)
   ปิด Browser Cache ทุกครั้ง (context ใหม่ + Cache-Control no-store จากเซิร์ฟเวอร์ทดสอบ) */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const F = require('./fixtures.js');

function serve(root, port) {
  const T = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
  return new Promise(r => {
    const s = http.createServer((rq, rs) => {
      let p = decodeURIComponent(rq.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); }
      const ext = path.extname(f), body = fs.readFileSync(f);
      const txt = ['.html', '.js', '.css', '.json'].indexOf(ext) >= 0;
      const ae = String(rq.headers['accept-encoding'] || '');
      const h = { 'Content-Type': T[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' };
      if (txt && ae.indexOf('gzip') >= 0) {
        const gz = zlib.gzipSync(body, { level: 9 });
        h['Content-Encoding'] = 'gzip'; h['Content-Length'] = gz.length;
        rs.writeHead(200, h); return rs.end(gz);
      }
      h['Content-Length'] = body.length;
      rs.writeHead(200, h); rs.end(body);
    }).listen(port, () => r(s));
  });
}

(async () => {
  const dir = process.argv[2], port = Number(process.argv[3]), label = process.argv[4];
  const scen = process.argv[5] || 'login';
  const s = await serve(dir, port);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const c = await b.newContext({ bypassCSP: true });
  await c.route('**/rest/v1/rpc/*', r => {
    const fn = r.request().url().split('/rpc/')[1].split('?')[0];
    let bd = {}; try { bd = JSON.parse(r.request().postData() || '{}'); } catch (e) {}
    r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(F.respond(fn, bd)) });
  });
  const p = await c.newPage();
  const reqs = [], errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + String(e.message).slice(0, 120)));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 120)); });
  p.on('response', async r => {
    const u = new URL(r.url());
    if (u.port !== String(port)) return;
    let enc = 0, dec = 0;
    try { const hh = await r.allHeaders(); enc = Number(hh['content-length'] || 0); } catch (e) {}
    try { dec = (await r.body()).length; } catch (e) {}
    reqs.push({ f: u.pathname.split('/').slice(-2).join('/'), enc: enc, dec: dec });
  });
  await p.addInitScript(() => {
    window.__LT = [];
    try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__LT.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  });

  await p.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
  await p.waitForTimeout(2500);

  async function snap(tag) {
    const m = await p.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0] || {};
      const fcp = (performance.getEntriesByType('paint').find(x => x.name === 'first-contentful-paint') || {}).startTime;
      let js = 0, ct = 0;
      performance.getEntriesByType('resource').forEach(r => { if (r.name.indexOf('.js') >= 0) { js++; } });
      return {
        dcl: Math.round(n.domContentLoadedEventEnd || 0),
        load: Math.round(n.loadEventEnd || 0),
        fcp: fcp == null ? null : Math.round(fcp),
        heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 10) / 10 : null,
        nodes: document.getElementsByTagName('*').length,
        lt: window.__LT.slice(),
        hash: location.hash,
        loggedIn: !!document.getElementById('sidebar')
      };
    });
    const jsr = reqs.filter(r => r.f.indexOf('.js') >= 0);
    console.log(`\n===== ${label} :: ${tag} =====`);
    console.log('  requests(all):', reqs.length, ' js:', jsr.length);
    console.log('  ' + 'file'.padEnd(30) + 'transfer'.padStart(10) + 'decoded'.padStart(10));
    reqs.forEach(r => console.log('  ' + r.f.padEnd(30) + String(r.enc).padStart(10) + String(r.dec).padStart(10)));
    console.log('  TOTAL'.padEnd(32) + String(reqs.reduce((a, x) => a + x.enc, 0)).padStart(10) + String(reqs.reduce((a, x) => a + x.dec, 0)).padStart(10));
    console.log('  JS ONLY'.padEnd(32) + String(jsr.reduce((a, x) => a + x.enc, 0)).padStart(10) + String(jsr.reduce((a, x) => a + x.dec, 0)).padStart(10));
    console.log('  DCL', m.dcl + 'ms  load', m.load + 'ms  FCP', m.fcp + 'ms  heap', m.heap + 'MB  nodes', m.nodes);
    console.log('  longtasks:', m.lt.length ? m.lt.join(',') + ' ms' : 'none');
    console.log('  hash:', m.hash, ' shell:', m.loggedIn);
    console.log('  errors:', errs.length ? errs.join(' | ') : 'ไม่มี');
  }
  await snap('LOGIN (cold, cache off)');

  if (scen !== 'login') {
    // login
    await p.evaluate(() => {
      const u = document.getElementById('lg-user');
      const w = document.getElementById('lg-pass');
      if (u) u.value = 'admin'; if (w) w.value = 'Admin1234';
      const f = document.getElementById('login-form');
      if (f && f.onsubmit) f.onsubmit({ preventDefault: function () {} });
    });
    await p.waitForTimeout(2500);
    await snap('AFTER LOGIN → DASHBOARD');
    if (scen === 'compat') {
      const t0 = Date.now();
      await p.evaluate(() => { location.hash = '#/employees'; });
      await p.waitForTimeout(2500);
      console.log('  เปลี่ยนไป #/employees ใช้เวลา ' + (Date.now() - t0) + ' ms (รวม wait)');
      await snap('AFTER OPEN #/employees (compat)');
      const t1 = Date.now();
      await p.evaluate(() => { location.hash = '#/dashboard'; });
      await p.waitForTimeout(600);
      await p.evaluate(() => { location.hash = '#/attendance'; });
      await p.waitForTimeout(1500);
      console.log('  เปิด compat route ที่ 2 (#/attendance) ใช้เวลา ' + (Date.now() - t1) + ' ms');
      await snap('AFTER SECOND compat route');
    }
  }
  await b.close(); s.close();
})();
