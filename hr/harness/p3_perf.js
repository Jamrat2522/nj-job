/* p3_perf.js — วัด Raw / Transfer / Decoded / Request Count / Parse-Compile ตามสถานการณ์จริง
   ใช้: node p3_perf.js <dir> <port> <label>
   เซิร์ฟเวอร์ทดสอบบีบ gzip -9 และตั้ง no-store เพื่อปิด Browser Cache */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const F = require('/home/claude/work/harness/fixtures.js');

function serve(root, port) {
  const T = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png' };
  return new Promise(r => {
    const s = http.createServer((rq, rs) => {
      let p = decodeURIComponent(rq.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); }
      const ext = path.extname(f), body = fs.readFileSync(f);
      const txt = ['.html', '.js', '.css'].indexOf(ext) >= 0;
      const h = { 'Content-Type': T[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' };
      if (txt && String(rq.headers['accept-encoding'] || '').indexOf('gzip') >= 0) {
        const gz = zlib.gzipSync(body, { level: 9 });
        h['Content-Encoding'] = 'gzip'; h['Content-Length'] = gz.length;
        rs.writeHead(200, h); return rs.end(gz);
      }
      h['Content-Length'] = body.length; rs.writeHead(200, h); rs.end(body);
    }).listen(port, () => r(s));
  });
}

(async () => {
  const dir = process.argv[2], port = Number(process.argv[3]), label = process.argv[4];
  const srv = await serve(dir, port);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ serviceWorkers: 'block' });
  await ctx.route('**/rest/v1/rpc/*', route => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(F.respond(fn, bd)) });
  });
  await ctx.route('**/storage/v1/**', r => r.fulfill({ status: 200, body: '{}' }));
  await ctx.route('**/functions/v1/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  const p = await ctx.newPage();
  const reqs = [];
  p.on('response', async r => {
    const u = new URL(r.url()); if (u.port !== String(port)) return;
    let enc = 0, dec = 0;
    try { enc = Number((await r.allHeaders())['content-length'] || 0); } catch (e) {}
    try { dec = (await r.body()).length; } catch (e) {}
    reqs.push({ f: u.pathname, enc, dec });
  });
  const rows = [];
  let last = { n: 0, js: 0, jsd: 0, all: 0, alld: 0 };
  function snap(tag, extra) {
    const js = reqs.filter(r => /\.js$/.test(r.f));
    const cur = {
      n: reqs.length,
      js: js.reduce((a, x) => a + x.enc, 0), jsd: js.reduce((a, x) => a + x.dec, 0),
      all: reqs.reduce((a, x) => a + x.enc, 0), alld: reqs.reduce((a, x) => a + x.dec, 0)
    };
    rows.push({ tag, ...cur, dn: cur.n - last.n, djs: cur.js - last.js, djsd: cur.jsd - last.jsd, extra: extra || '' });
    last = cur;
  }
  const w = ms => p.waitForTimeout(ms);
  const go = h => p.evaluate(x => { location.hash = x; }, h);

  await p.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' }); await w(2500);
  snap('1. หน้า Login (cold)');
  await p.evaluate(() => {
    document.getElementById('lg-user').value = 'admin';
    document.getElementById('lg-pass').value = 'Admin1234';
    document.getElementById('login-form').onsubmit({ preventDefault: function () {} });
  });
  await w(2500); snap('2. + Dashboard');
  await go('#/employees'); await w(3200); snap('3. + Employees List');
  await p.evaluate(() => { const x = document.getElementById('emp-add'); if (x) x.click(); }); await w(3200);
  await p.evaluate(() => { try { NJHR.ui.closeModal(); } catch (e) {} }); await w(400);
  snap('4. + กด Add (Employee Form)');
  await p.evaluate(() => { const x = document.querySelector('[data-emp-edit]'); if (x) x.click(); }); await w(2600);
  await p.evaluate(() => { try { NJHR.ui.closeModal(); } catch (e) {} }); await w(400);
  snap('5. + กด Edit');
  await p.evaluate(() => { const x = document.querySelector('[data-emp-docs]'); if (x) x.click(); }); await w(3200);
  await p.evaluate(() => { try { NJHR.ui.closeModal(); } catch (e) {} }); await w(400);
  snap('6. + เปิด Documents');
  await p.evaluate(() => { const x = document.getElementById('emp-import'); if (x) x.click(); }); await w(3200);
  await p.evaluate(() => { try { NJHR.ui.closeModal(); } catch (e) {} }); await w(400);
  snap('7. + กด Import');
  await p.evaluate(() => { const x = document.getElementById('emp-export'); if (x) x.click(); }); await w(3200);
  snap('8. + กด Export');
  await go('#/attendance'); await w(3000); snap('9. + Attendance Main');
  await p.evaluate(() => { const x = document.getElementById('att-fix'); if (x) x.click(); }); await w(3200);
  await p.evaluate(() => { try { NJHR.ui.closeModal(); } catch (e) {} }); await w(400);
  snap('10. + เปิด Correction');
  await go('#/reports'); await w(3200); snap('11. + Attendance Report');
  await go('#/leave'); await w(3000); snap('12. + Leave Main');
  await p.evaluate(() => { const x = document.getElementById('lv-new'); if (x) x.click(); }); await w(3200);
  await p.evaluate(() => { try { NJHR.ui.closeModal(); } catch (e) {} }); await w(400);
  snap('13. + เปิด Leave Form');
  await go('#/req-history'); await w(2800);
  await p.evaluate(() => { const x = document.querySelector('[data-rh]'); if (x) x.click(); }); await w(3200);
  await p.evaluate(() => { try { NJHR.ui.closeModal(); } catch (e) {} }); await w(400);
  snap('14. + เปิด Request Detail');
  await go('#/ot'); await w(3000); snap('15. + OT Main');
  await p.evaluate(() => { const x = document.getElementById('ot-new'); if (x) x.click(); }); await w(3200);
  await p.evaluate(() => { try { NJHR.ui.closeModal(); } catch (e) {} }); await w(400);
  snap('16. + เปิด OT Form');
  await go('#/users'); await w(3500); snap('17. + Feature ที่ยังอยู่ compat (#/users)');

  console.log('\n===== ' + label + ' =====');
  console.log('  ' + 'สถานการณ์'.padEnd(38) + 'req'.padStart(5) + '+req'.padStart(5) +
    'JS transfer'.padStart(13) + 'JS decoded'.padStart(12) + '+JS tr'.padStart(9) + '+JS dec'.padStart(9));
  rows.forEach(r => console.log('  ' + r.tag.padEnd(38) + String(r.n).padStart(5) + String(r.dn).padStart(5) +
    String(r.js).padStart(13) + String(r.jsd).padStart(12) + String(r.djs).padStart(9) + String(r.djsd).padStart(9)));
  console.log('\n  ไฟล์ทั้งหมดที่ถูกร้องขอ:');
  reqs.forEach(r => console.log('    ' + r.f.padEnd(38) + String(r.enc).padStart(9) + String(r.dec).padStart(10)));
  await b.close(); srv.close();
})();
