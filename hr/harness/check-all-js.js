#!/usr/bin/env node
/* check-all-js.js — ตรวจ Deploy Output ทั้งหมดแบบ recursive
   ไม่พึ่ง shell glob (ทำงานไม่เหมือนกันในแต่ละระบบ) — เดินไฟล์ด้วย fs เอง
   ใช้: node harness/check-all-js.js   (exit 1 เมื่อพบปัญหา) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let FAIL = 0;
const bad = m => { FAIL++; console.error('  FAIL  ' + m); };
const ok = m => console.log('  ok    ' + m);

/* ---------- 1) เดินไฟล์ recursive ---------- */
const SCAN = ['runtime', 'views', 'compat'];
const files = [];
(function walk(d) {
  if (!fs.existsSync(d)) return;
  fs.readdirSync(d).forEach(n => {
    const p = path.join(d, n);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.js$/.test(n)) files.push(path.relative(ROOT, p).split(path.sep).join('/'));
  });
})(path.join(ROOT, SCAN[0]));
SCAN.slice(1).forEach(d => (function walk(dd) {
  if (!fs.existsSync(dd)) return;
  fs.readdirSync(dd).forEach(n => {
    const p = path.join(dd, n);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.js$/.test(n)) files.push(path.relative(ROOT, p).split(path.sep).join('/'));
  });
})(path.join(ROOT, d)));
['asset-manifest.js', 'sw.js', 'config.js'].forEach(f => { if (fs.existsSync(path.join(ROOT, f))) files.push(f); });

/* ---------- 2) Syntax ทุกไฟล์ ---------- */
console.log('== Syntax (' + files.length + ' ไฟล์) ==');
let synFail = [];
files.forEach(f => {
  try { new vm.Script(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f }); }
  catch (e) { synFail.push(f + ': ' + e.message); }
});
if (synFail.length) synFail.forEach(x => bad('syntax ' + x));
else ok('ผ่านทุกไฟล์ ' + files.length + ' ไฟล์');

/* ---------- 3) Asset Manifest ---------- */
console.log('== Asset Manifest ==');
const mSrc = fs.readFileSync(path.join(ROOT, 'asset-manifest.js'), 'utf8');
const manifest = JSON.parse(mSrc.slice(mSrc.indexOf('{'), mSrc.lastIndexOf('}') + 1));
const mods = manifest.modules || {};
const urls = [manifest.runtime.namespace, manifest.runtime.core, manifest.styles.main, manifest.styles.mobile]
  .concat(Object.keys(mods).map(k => mods[k].url));

// 3.1 ชี้ไฟล์ที่ไม่มีจริง
let miss = urls.filter(u => !fs.existsSync(path.join(ROOT, u.split('?')[0])));
miss.length ? miss.forEach(u => bad('manifest ชี้ไฟล์ที่ไม่มีจริง: ' + u)) : ok('ทุก URL ใน manifest มีไฟล์จริง (' + urls.length + ')');

// 3.2 ไฟล์ใน Deploy ที่ไม่มีใน manifest
const declared = urls.map(u => u.split('?')[0]);
const orphan = files.filter(f => ['asset-manifest.js', 'sw.js', 'config.js'].indexOf(f) < 0 && declared.indexOf(f) < 0);
orphan.length ? orphan.forEach(f => bad('ไฟล์ใน Deploy ไม่มีใน manifest: ' + f)) : ok('ไม่มีไฟล์ .js ส่วนเกินใน Deploy');

// 3.3 ชื่อ Module ซ้ำ (JSON.parse ยุบคีย์ซ้ำอยู่แล้ว จึงนับจากข้อความดิบ)
const keyHits = {};
(mSrc.match(/^\s{4}"([a-z-]+)":\s*\{/gm) || []).forEach(l => {
  const k = l.match(/"([a-z-]+)"/)[1]; keyHits[k] = (keyHits[k] || 0) + 1;
});
const dupMod = Object.keys(keyHits).filter(k => keyHits[k] > 1);
dupMod.length ? dupMod.forEach(k => bad('Module ซ้ำใน manifest: ' + k)) : ok('ไม่มีชื่อ Module ซ้ำ (' + Object.keys(mods).length + ' module)');

// 3.4 View Registration ซ้ำ
const seenView = {}, dupView = [];
Object.keys(mods).forEach(k => (mods[k].provides || []).forEach(v => {
  if (seenView[v]) dupView.push(v + ' (' + seenView[v] + ' และ ' + k + ')');
  seenView[v] = k;
}));
dupView.length ? dupView.forEach(v => bad('View ลงทะเบียนซ้ำ: ' + v)) : ok('ไม่มี View ซ้ำ (' + Object.keys(seenView).length + ' view)');

// 3.5 deps ต้องมีจริง + ไม่วน
let depErr = [];
Object.keys(mods).forEach(k => (mods[k].deps || []).forEach(d => { if (!mods[d]) depErr.push(k + ' -> ' + d); }));
(function () {
  const seen = {}, stack = {};
  function walk(k, p) {
    if (stack[k]) { depErr.push('Circular: ' + p.concat(k).join(' -> ')); return; }
    if (seen[k]) return;
    seen[k] = stack[k] = 1;
    (mods[k] && mods[k].deps || []).forEach(d => { if (mods[d]) walk(d, p.concat(k)); });
    stack[k] = 0;
  }
  Object.keys(mods).forEach(k => walk(k, []));
})();
depErr.length ? depErr.forEach(x => bad('deps: ' + x)) : ok('deps ครบและไม่มี Circular Dependency');

/* ---------- 4) Build ID ต้องตรงกัน 3 จุด ---------- */
console.log('== Build ID ==');
const cfg = (fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8').match(/NJHR_BUILD_VERSION\s*=\s*'([^']+)'/) || [])[1];
const swV = (fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').match(/const V = '([^']+)'/) || [])[1];
if (cfg && swV && cfg === swV && cfg === manifest.buildId) ok('ตรงกันทั้ง 3 จุด: ' + cfg);
else bad('Build ID ไม่ตรงกัน — config.js=' + cfg + ' sw.js=' + swV + ' manifest=' + manifest.buildId);

/* ---------- 5) sw.js ต้องไม่ precache lazy module ---------- */
console.log('== Service Worker ==');
const swSrc = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const core = JSON.parse((swSrc.match(/const CORE = (\[[\s\S]*?\]);/) || [])[1]);
const lazyInCore = core.filter(u => /views\/|compat\/|runtime\/shared\//.test(u));
lazyInCore.length ? lazyInCore.forEach(u => bad('Lazy Module อยู่ใน CORE precache: ' + u)) : ok('CORE precache ' + core.length + ' รายการ ไม่มี Lazy Module');
core.filter(u => /\?v=/.test(u)).forEach(u => {
  if (!fs.existsSync(path.join(ROOT, u.replace('./', '').split('?')[0]))) bad('CORE ชี้ไฟล์ที่ไม่มีจริง: ' + u);
});

/* ---------- 6) MD5 ต้องเป็น hex ตัวเล็ก 32 ตัวพอดี ---------- */
console.log('== MD5 format ==');
let md5Files = ['ZIP_MD5.txt', 'DEPLOY_MD5.txt'].filter(f => fs.existsSync(path.join(ROOT, f)));
if (!md5Files.length) console.log('  ข้าม  ไม่พบ ZIP_MD5.txt / DEPLOY_MD5.txt');
md5Files.forEach(f => {
  const txt = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const cand = txt.match(/\b[0-9a-fA-F]{20,40}\b/g) || [];
  let n = 0;
  cand.forEach(c => {
    n++;
    if (!/^[0-9a-f]{32}$/.test(c)) bad(f + ': ค่า MD5 ไม่ถูกต้อง "' + c + '" (ยาว ' + c.length + ' ตัว · ต้องเป็น hex ตัวเล็ก 32 ตัวพอดี)');
  });
  if (n) ok(f + ': ตรวจ ' + n + ' ค่า');
});

console.log(FAIL ? '\nCHECK FAILED — พบปัญหา ' + FAIL + ' รายการ' : '\nCHECK PASSED');
process.exit(FAIL ? 1 : 0);
