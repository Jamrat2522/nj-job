/* HR V2 — test/module-graph.mjs
   จำลองการติดตั้งจริงใต้ /hr-v2/ ด้วย static server แล้วเดินกราฟ import ทั้งหมดผ่าน HTTP จริง
   ตรวจ: ทุก path resolve ได้ · ไม่มี absolute path ชี้ root · ไม่มี 404 · ไม่มีไฟล์ไหนตอบ HTML
   ⚠ นี่คือ sandbox — ไม่ใช่เซิร์ฟเวอร์จริงของบริษัท (ใช้ diag.html บนโฮสต์จริงเป็นเกณฑ์) */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));   // .../hr-v2
const MOUNT = '/hr-v2';
const MIME = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json' };
/* โหมดจำลองปัญหาโฮสต์ (ใช้ตรวจว่าตัวตรวจจับได้จริง):
   MODE=rewrite → เสิร์ฟ index.html แทนไฟล์ .js ทุกไฟล์ · MODE=mime → ส่ง .js เป็น text/html */
const MODE = process.env.MODE || '';

const server = http.createServer((req, res) => {
  const clean = decodeURIComponent(req.url.split('?')[0]);
  if (!clean.startsWith(MOUNT + '/')) { res.writeHead(404).end('not found'); return; }
  let rel = clean.slice(MOUNT.length + 1) || 'index.html';
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('404');
    return;
  }
  const ext = path.extname(file);
  if (MODE === 'rewrite' && ext === '.js') {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(fs.readFileSync(path.join(ROOT, 'index.html')));
    return;
  }
  res.writeHead(200, { 'content-type': MODE === 'mime' && ext === '.js' ? 'text/html' : (MIME[ext] || 'application/octet-stream') });
  res.end(fs.readFileSync(file));
});

await new Promise(r => server.listen(0, r));
const PORT = server.address().port;
const BASE = 'http://127.0.0.1:' + PORT + MOUNT + '/';
const BUILD = 'v2-preview-1';

const seen = new Map();          // url → { status, ct, ok }
const problems = [];
const SPEC_RE = /(?:^|[^\w$])import\s*(?:[\w{}*,\s]+\s+from\s*)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

async function walk(url, fromLabel) {
  const key = url.split('?')[0];
  if (seen.has(key)) return;
  let res, text;
  try { res = await fetch(url); text = await res.text(); }
  catch (e) { problems.push('FETCH FAIL ' + url + ' (จาก ' + fromLabel + '): ' + e.message); seen.set(key, {}); return; }
  const ct = res.headers.get('content-type') || '';
  seen.set(key, { status: res.status, ct });
  if (res.status !== 200) { problems.push('HTTP ' + res.status + ' ' + url + ' (อ้างจาก ' + fromLabel + ')'); return; }
  if (!/javascript/.test(ct)) { problems.push('MIME ผิด ' + url + ' → ' + ct); return; }
  if (/^\s*<(!doctype|html)/i.test(text)) { problems.push('ได้ HTML แทน JS: ' + url); return; }

  /* ตัวโหลดกลาง load('...') / ctx.load('...') — resolve เทียบ /hr-v2/app/ (import.meta.url ของ bootstrap) */
  for (const lm of text.matchAll(/(?:ctx\.)?load\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    const spec = lm[1];
    if (spec.startsWith('/')) { problems.push('ABSOLUTE PATH ใน load(): ' + spec + ' ที่ ' + url); continue; }
    await walk(new URL(spec + '?v=' + BUILD, BASE + 'app/').href, key + ' [load()]');
  }

  let m;
  SPEC_RE.lastIndex = 0;
  while ((m = SPEC_RE.exec(text))) {
    const spec = m[1] || m[2];
    if (!spec || /^https?:/.test(spec)) continue;
    if (spec.startsWith('/')) { problems.push('ABSOLUTE PATH ' + spec + ' ใน ' + url); continue; }
    await walk(new URL(spec.split('?')[0] + '?v=' + BUILD, url).href, key);
  }
}

/* จุดเริ่ม: index.html → bootstrap · บวกทุก module ในตาราง routes (โหลดแบบ dynamic ตอน runtime) */
const idx = await (await fetch(BASE)).text();
if (!/['"]\.\/app\/bootstrap\.js/.test(idx)) problems.push('index.html ไม่ได้อ้าง ./app/bootstrap.js ตามที่คาด');
if (/serviceWorker\.register/.test(idx)) problems.push('index.html ลงทะเบียน Service Worker (ต้องไม่มีใน V2)');
if (/<base\s/i.test(idx)) problems.push('index.html มี <base> — ต้องตรวจผลกับ hash router ก่อนใช้');

await walk(BASE + 'app/bootstrap.js?v=' + BUILD, 'index.html');

const routesSrc = fs.readFileSync(path.join(ROOT, 'app/routes.js'), 'utf8');
const modules = [...routesSrc.matchAll(/module:\s*'([^']+)'/g)].map(m => m[1]);
for (const mod of modules) await walk(BASE + 'modules/' + mod + '?v=' + BUILD, 'routes.js');

/* CSS ที่ index.html อ้าง */
for (const css of [...idx.matchAll(/href="(styles\/[^"]+)"/g)].map(m => m[1])) {
  const r = await fetch(BASE + css + '?v=' + BUILD);
  if (r.status !== 200) problems.push('CSS ' + css + ' → HTTP ' + r.status);
  else if (!/text\/css/.test(r.headers.get('content-type') || '')) problems.push('CSS MIME ผิด: ' + css);
}

server.close();

/* ไฟล์ .js ที่มีอยู่จริงแต่ไม่มีใครอ้างถึง — รายงานไว้กันไฟล์ตกค้าง/ตกหล่น */
const onDisk = [];
(function scan(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'test') scan(p); }
    else if (e.name.endsWith('.js')) onDisk.push('/hr-v2/' + path.relative(ROOT, p).split(path.sep).join('/'));
  }
})(ROOT);
const visited = new Set([...seen.keys()].map(u => new URL(u).pathname));
const orphans = onDisk.filter(f => !visited.has(f));
if (orphans.length) console.log('ไฟล์ที่ไม่มีการอ้างถึงในกราฟ: ' + orphans.join(', '));

const jsCount = [...seen.keys()].length;
console.log('เดินกราฟ import ผ่าน HTTP ที่ ' + MOUNT + '/ · โหลดสำเร็จ ' + jsCount + ' ไฟล์ · route modules ' + modules.length + ' ตัว');
if (problems.length) {
  console.log('\nพบปัญหา ' + problems.length + ' รายการ:');
  problems.forEach(p => console.log('  ✗ ' + p));
  process.exit(1);
}
console.log('ผล: ไม่มี absolute path · ไม่มี 404 · MIME ถูกต้องทุกไฟล์ (sandbox)');
