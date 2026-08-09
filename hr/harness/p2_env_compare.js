/* p2_env_compare.js — เทียบ "ก่อนแยก" กับ "หลังแยก" ในสองเรื่องที่ต้องพิสูจน์ว่าไม่ถดถอย
     1) จำนวน Event Listener ระดับ window/document หลังใช้งานหนัก
     2) องค์ประกอบที่ล้นจอในแต่ละความกว้าง
   ใช้ DOM API ล้วน ไม่พึ่ง NJHR จึงรันได้ทั้งสองบิลด์
   ใช้: node p2_env_compare.js <dirBefore> <dirAfter> */
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
const VPS = [{ n: '360x740', width: 360, height: 740 }, { n: '740x360', width: 740, height: 360 },
             { n: '768x1024', width: 768, height: 1024 }, { n: '1440x900', width: 1440, height: 900 },
             { n: '1920x1080', width: 1920, height: 1080 }];

async function run(b, dir, port, vp) {
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, serviceWorkers: 'block' });
  await ctx.route('**/rest/v1/rpc/*', route => {
    const fn = route.request().url().split('/rpc/')[1].split('?')[0];
    let bd = {}; try { bd = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    route.fulfill({ status: 200, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(F.respond(fn, bd)) });
  });
  await ctx.route('**/storage/v1/**', r => r.fulfill({ status: 200, body: '{}' }));
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 90)));
  p.on('console', m => { if (m.type() === 'error' && m.text().indexOf('403') < 0) errs.push(m.text().slice(0, 90)); });
  await p.addInitScript(() => {
    window.__L = {};
    const add = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (t) {
      const who = this === window ? 'window' : this === document ? 'document' : this === document.body ? 'body' : null;
      if (who) { const k = who + ':' + t; window.__L[k] = (window.__L[k] || 0) + 1; }
      return add.apply(this, arguments);
    };
  });
  await p.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    document.getElementById('lg-user').value = 'admin';
    document.getElementById('lg-pass').value = 'Admin1234';
    document.getElementById('login-form').onsubmit({ preventDefault: function () {} });
  });
  await p.waitForTimeout(2200);
  // อุ่นเครื่อง: เปิดหน้าที่อยู่ในบันเดิลฟีเจอร์ให้ครบก่อน แล้วค่อยจับค่าฐาน
  for (const h of ['#/attendance', '#/epayslip', '#/profile', '#/dashboard']) {
    await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(1600);
  }
  const base = await p.evaluate(() => JSON.parse(JSON.stringify(window.__L)));
  // ใช้งานหนัก: วนเปิดหน้าซ้ำ + Back/Forward + Logout/Login
  for (let i = 0; i < 3; i++) {
    for (const h of ['#/dashboard', '#/attendance', '#/epayslip', '#/dashboard']) {
      await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(500);
    }
  }
  await p.goBack(); await p.waitForTimeout(600); await p.goForward(); await p.waitForTimeout(600);
  const after = await p.evaluate(() => JSON.parse(JSON.stringify(window.__L)));
  // วัดการล้นจอบน Dashboard
  await p.evaluate(() => { location.hash = '#/dashboard'; }); await p.waitForTimeout(1200);
  const over = await p.evaluate(() => {
    const W = document.documentElement.clientWidth, out = [];
    document.querySelectorAll('#main-view *, #sidebar *, .topbar *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > W + 2 || r.left < -2)) out.push(el.tagName + '.' + String(el.className || '').split(' ')[0]);
    });
    return { hScroll: document.documentElement.scrollWidth - W, n: out.length,
             sample: Array.from(new Set(out)).slice(0, 4).join(',') };
  });
  await ctx.close();
  return { base, after, over, errs };
}

(async () => {
  const [dirA, dirB] = process.argv.slice(2);
  const sA = await serve(dirA, 8871), sB = await serve(dirB, 8872);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const rows = [];
  for (const vp of VPS) {
    const A = await run(b, dirA, 8871, vp);
    const B = await run(b, dirB, 8872, vp);
    const growA = Object.keys(A.after).filter(k => A.after[k] > (A.base[k] || 0));
    const growB = Object.keys(B.after).filter(k => B.after[k] > (B.base[k] || 0));
    console.log('\n=== viewport ' + vp.n + ' ===');
    console.log('  ก่อนแยก  listener=' + JSON.stringify(A.after) + '  เพิ่มขึ้น=' + (growA.join(',') || 'ไม่มี'));
    console.log('  หลังแยก  listener=' + JSON.stringify(B.after) + '  เพิ่มขึ้น=' + (growB.join(',') || 'ไม่มี'));
    console.log('  ล้นจอ    ก่อน hScroll=' + A.over.hScroll + ' n=' + A.over.n + ' (' + A.over.sample + ')');
    console.log('           หลัง hScroll=' + B.over.hScroll + ' n=' + B.over.n + ' (' + B.over.sample + ')');
    console.log('  error    ก่อน=' + (A.errs.join('|') || 'ไม่มี') + '  หลัง=' + (B.errs.join('|') || 'ไม่มี'));
    rows.push({ vp: vp.n,
      lisA: JSON.stringify(A.after), lisB: JSON.stringify(B.after),
      growA: growA.length, growB: growB.length,
      ovA: A.over.n, ovB: B.over.n, hsA: A.over.hScroll, hsB: B.over.hScroll,
      errA: A.errs.length, errB: B.errs.length,
      same: JSON.stringify(A.after) === JSON.stringify(B.after) && A.over.n === B.over.n && A.over.hScroll === B.over.hScroll });
  }
  console.log('\n=== สรุป ===');
  rows.forEach(r => console.log('  ' + r.vp.padEnd(10) + (r.same ? 'เท่ากันทุกค่า' : 'ต่างกัน') +
    '  listener เพิ่ม ก่อน=' + r.growA + ' หลัง=' + r.growB + '  ล้นจอ ก่อน=' + r.ovA + ' หลัง=' + r.ovB));
  fs.writeFileSync('/home/claude/work/harness/p2_env_compare.json', JSON.stringify(rows, null, 1));
  await b.close(); sA.close(); sB.close();
})();
