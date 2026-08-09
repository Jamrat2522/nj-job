/* p2_gate.js — ทดสอบ Environment Safety Gate ครบ CFG-001 ถึง CFG-007
   เซิร์ฟเวอร์ทดสอบจะสลับเนื้อหา config.js ตามเคส โดยไม่แตะไฟล์จริงในโปรเจกต์
   ใช้: node p2_gate.js <ทางโปรเจกต์> <port> */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright/index.js');
const http = require('http'), fs = require('fs'), path = require('path');

const PROD = 'sytgqjglcnsabcszbngg';
function cfg(o) {
  o = o || {};
  const v = k => (k in o ? o[k] : undefined);
  return [
    "window.NJHR_ENV_NAME = " + JSON.stringify(v('env') !== undefined ? v('env') : 'production') + ";",
    "window.NJHR_BUILD_VERSION = 'njhr-v2-test';",
    "window.NJHR_SUPABASE_URL = " + JSON.stringify(v('url') !== undefined ? v('url') : 'https://' + PROD + '.supabase.co') + ";",
    "window.NJHR_SUPABASE_ANON_KEY = " + JSON.stringify(v('key') !== undefined ? v('key') : 'sb_publishable_TEST') + ";",
    "window.NJHR_API_BASE_URL = '';",
    "window.NJHR_FEATURE_FLAGS = {};",
    "window.NJHR_STAGING_PROJECT_ID = " + JSON.stringify(v('stg') !== undefined ? v('stg') : '__STAGING_PROJECT_ID__') + ";",
    "window.NJHR_PRODUCTION_PROJECT_ID = '" + PROD + "';",
    "window.NJHR_ALLOW_PRODUCTION = " + String(v('allow') !== undefined ? v('allow') : true) + ";",
    (v('fileOk') === false ? "/* จำลองไฟล์ถูกตัดกลางคัน — ไม่มีบรรทัด NJHR_CONFIG_FILE_OK */"
                           : "window.NJHR_CONFIG_FILE_OK = true;")
  ].join('\n');
}

const CASES = [
  { code: 'CFG-001', name: 'config.js โหลดไม่ครบ / ถูกตัดกลางคัน', cfg: { fileOk: false } },
  { code: 'CFG-002', name: 'ค่ายังเป็น __PLACEHOLDER__', cfg: { url: '__SUPABASE_URL__', key: '__KEY__' } },
  { code: 'CFG-002', name: 'ENV=staging แต่ยังไม่กรอก STAGING_PROJECT_ID', cfg: { env: 'staging', url: 'https://abcdefghijklmnop.supabase.co', allow: false } },
  { code: 'CFG-003', name: 'NJHR_ENV_NAME ไม่ใช่ staging/production', cfg: { env: 'dev' } },
  { code: 'CFG-004', name: 'URL ไม่ใช่รูปแบบ Supabase ที่อนุญาต', cfg: { url: 'https://evil.example.com' } },
  { code: 'CFG-004', name: 'URL เป็น Supabase แต่ Project ไม่อยู่ในรายการอนุญาต', cfg: { url: 'https://zzzznotallowed.supabase.co' } },
  { code: 'CFG-005', name: 'URL ชี้ Production แต่ ALLOW_PRODUCTION !== true', cfg: { allow: false } },
  { code: 'CFG-005', name: 'ENV=staging แต่ตั้ง ALLOW_PRODUCTION = true', cfg: { env: 'staging', url: 'https://abcdefghijklmnop.supabase.co', stg: 'abcdefghijklmnop', allow: true } },
  { code: 'CFG-006', name: 'ENV=staging แต่ URL ชี้ Production', cfg: { env: 'staging', stg: 'abcdefghijklmnop', allow: false } },
  { code: 'CFG-007', name: 'ENV=production แต่ URL ชี้ Staging', cfg: { env: 'production', url: 'https://abcdefghijklmnop.supabase.co', stg: 'abcdefghijklmnop' } },
  { code: null, name: 'ค่าถูกต้องครบ → Gate ผ่าน', cfg: {} }
];

let CUR = null;
function serve(root, port) {
  const T = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png' };
  return new Promise(r => {
    const s = http.createServer((rq, rs) => {
      let p = decodeURIComponent(rq.url.split('?')[0]); if (p === '/') p = '/index.html';
      if (p === '/config.js') {
        const b = Buffer.from(cfg(CUR), 'utf8');
        rs.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
        return rs.end(b);
      }
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); return rs.end(); }
      rs.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      rs.end(fs.readFileSync(f));
    }).listen(port, () => r(s));
  });
}

(async () => {
  const dir = process.argv[2], port = Number(process.argv[3]);
  const srv = await serve(dir, port);
  const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  let PASS = 0, FAIL = 0; const LINES = [];
  for (const c of CASES) {
    CUR = c.cfg;
    const ctx = await b.newContext({ serviceWorkers: 'block' });
    const p = await ctx.newPage();
    const js = [], sb = [];
    p.on('request', r => {
      const u = r.url();
      if (/\.js(\?|$)/.test(u) && u.indexOf('127.0.0.1') >= 0) js.push(u.split('/').slice(-1)[0].split('?')[0]);
      if (/supabase\.co|\/rest\/v1\//.test(u)) sb.push(u.slice(0, 60));
    });
    await p.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
    await p.evaluate(() => { try { localStorage.setItem('njhr_token', 'X'); localStorage.setItem('njhr_sb_user', 'X'); } catch (e) {} });
    await p.reload({ waitUntil: 'load' });
    await p.waitForTimeout(1600);
    const r = await p.evaluate(() => ({
      code: window.NJHR_CONFIG_ERROR, ok: window.NJHR_CONFIG_OK,
      txt: document.getElementById('app') ? document.getElementById('app').innerText.replace(/\s+/g, ' ').trim() : '',
      url: window.NJHR_SUPABASE_URL, key: window.NJHR_SUPABASE_ANON_KEY,
      tok: (function () { try { return localStorage.getItem('njhr_token'); } catch (e) { return 'ERR'; } })(),
      usr: (function () { try { return localStorage.getItem('njhr_sb_user'); } catch (e) { return 'ERR'; } })(),
      diag: typeof window.NJHR_DIAG, ns: !!window.NJHR, asset: !!window.NJHR_ASSETS
    }));
    const feature = js.filter(x => /app-legacy|dashboard\.js/.test(x));
    const runtime = js.filter(x => /namespace\.js|core\.js|asset-manifest\.js/.test(x));
    let ok, evid;
    if (c.code) {
      ok = r.code === c.code && r.ok === false &&
           r.txt.indexOf(c.code) >= 0 &&
           r.url === undefined && r.key === undefined &&
           r.tok === null && r.usr === null &&
           runtime.length === 0 && feature.length === 0 && sb.length === 0;
      evid = 'code=' + r.code + ' · ข้อความบนจอมีรหัส=' + (r.txt.indexOf(c.code) >= 0) +
             ' · URL/KEY ถูกล้าง=' + (r.url === undefined && r.key === undefined) +
             ' · localStorage ถูกล้าง=' + (r.tok === null && r.usr === null) +
             ' · โหลด runtime=' + runtime.length + ' · โหลด feature=' + feature.length + ' · เรียก supabase=' + sb.length;
    } else {
      /* เคสนี้ config ทดสอบตั้ง BUILD_VERSION ไม่ตรงกับ manifest โดยตั้งใจ
         Build ID Guard จึงต้องรีเฟรช "ครั้งเดียว" แล้วหยุด — ไม่วนไม่รู้จบ
         หน้าถูกโหลด 3 รอบ = goto + reload ของตัวทดสอบ + reload ของ Guard 1 ครั้ง */
      const uniq = Array.from(new Set(runtime));
      ok = r.ok === true && r.code === null && uniq.length === 3 && runtime.length === 9 &&
           feature.length === 0 && r.ns && r.asset;
      evid = 'CONFIG_OK=' + r.ok + ' · runtime ชนิดที่โหลด=' + uniq.join(',') +
             ' · โหลดหน้าทั้งหมด ' + (runtime.length / 3) + ' รอบ (Build ID Guard รีเฟรช 1 ครั้งแล้วหยุด) ' +
             '· feature=' + (feature.join(',') || 'ไม่มี') + ' · NJHR=' + r.ns + ' · NJHR_ASSETS=' + r.asset;
    }
    (ok ? PASS++ : FAIL++);
    const label = (c.code || 'GATE PASS') + ' · ' + c.name;
    LINES.push('| ' + label + ' | ' + (ok ? 'PASS' : '**FAIL**') + ' | ' + evid + ' |');
    console.log((ok ? 'PASS  ' : 'FAIL  ') + label.padEnd(58) + evid);
    await ctx.close();
  }
  // ปุ่มข้าม Gate ต้องไม่มี
  CUR = { allow: false };
  const ctx = await b.newContext({ serviceWorkers: 'block' });
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  const btns = await p.evaluate(() => document.querySelectorAll('#app button, #app a').length);
  const ok2 = btns === 0;
  (ok2 ? PASS++ : FAIL++);
  LINES.push('| GATE · ไม่มีปุ่มข้าม Gate บนหน้าจอ Error | ' + (ok2 ? 'PASS' : '**FAIL**') + ' | ปุ่ม/ลิงก์บนหน้า Error = ' + btns + ' |');
  console.log((ok2 ? 'PASS  ' : 'FAIL  ') + 'GATE · ไม่มีปุ่มข้าม Gate'.padEnd(58) + 'ปุ่ม/ลิงก์ = ' + btns);
  await ctx.close();
  await b.close(); srv.close();
  fs.writeFileSync(path.join(__dirname, 'p2_gate_result.md'),
    '| Test Case | ผล | หลักฐาน |\n|---|---|---|\n' + LINES.join('\n') + '\n\n**PASS ' + PASS + ' · FAIL ' + FAIL + '**\n');
  console.log('\nPASS ' + PASS + ' · FAIL ' + FAIL);
  process.exit(FAIL ? 1 : 0);
})();
