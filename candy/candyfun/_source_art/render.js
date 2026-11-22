const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const srv = http.createServer((q, s) => { const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
const save = (f, d) => fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64'));
(async () => { await new Promise(r => srv.listen(8399, r)); fs.mkdirSync('out', { recursive: true });
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', String(e))); p.on('console', m => { if (m.type() === 'error') console.log('console', m.text()); });
  await p.goto('http://127.0.0.1:8399/render.html'); await p.waitForFunction(() => window.READY, null, { timeout: 60000 });
  const what = process.argv[2] || 'all';
  if (what === 'all' || what === 'items') for (const n of ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'rainbow', 'bomb', 'rocketH', 'box1', 'box2', 'box3', 'b_hammer', 'b_bomb', 'b_rainbow', 'b_shuffle', 'b_moves5', 'b_rocket', 'coin', 'star'])
    save('out/' + n + '.png', await p.evaluate(([n, s]) => window.renderItem(n, 512, /bomb$|rocketH|^b_|coin|star/.test(n) && n !== 'b_x'), [n]));
  if (what === 'all' || what === 'logo') save('out/logo.png', await p.evaluate(() => window.renderLogo(1800, 1200)));
  if (what === 'all' || what === 'bg') { save('out/bg-portrait.jpg', await p.evaluate(() => window.renderBg(2160, 3840, false))); save('out/bg-wide.jpg', await p.evaluate(() => window.renderBg(3840, 2160, true))); }
  if (what === 'char') { save('out/char-profile.png', await p.evaluate(() => window.renderChar('profile', 768, 768))); save('out/char-game.png', await p.evaluate(() => window.renderChar('game', 1080, 1440))); save('out/char-win.png', await p.evaluate(() => window.renderChar('win', 1080, 1440))); }
  await b.close(); srv.close(); console.log('rendered', fs.readdirSync('out').length, 'files');
})();
