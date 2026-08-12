#!/usr/bin/env node
/* HR V2 Build — Deterministic · Multi-Chunk Runtime Split

   src/*.js      → runtime/core.js · views/dashboard.js · compat/app-legacy.js
   runtime-src/  → runtime/namespace.js
   src/css/*.css → styles.css / mobile.css  (clean-css level 1: ไม่เรียง selector ใหม่)
   ผลลัพธ์เพิ่ม  → asset-manifest.js (Build ID + URL + hash ที่เดียวของทั้งระบบ)
   sw.js · config.js · index.html → เขียน Build ID ให้อัตโนมัติจากแหล่งเดียว

   ข้อบังคับที่ตั้งไว้ในตัว build (ไม่เปลี่ยนจากเดิม):
     mangle    = false  → ห้ามเปลี่ยนชื่อ function/variable (มี string reference และ dynamic contract)
     compress  = false  → ห้าม tree-shaking / ห้ามตัดโค้ดจากการคาดเดา
     level 2   = false  → CSS ห้ามเรียงลำดับใหม่

   ใช้งาน: node build.js            สร้างไฟล์ deploy
           node build.js --check    ตรวจว่าไฟล์ deploy ตรงกับ src/ (ไม่เขียนทับ)
           node build.js --raw      สร้างแบบไม่ minify (ไว้ debug)
*/
const fs = require('fs'), path = require('path'), crypto = require('crypto'), vm = require('vm');
const { minify_sync } = require('terser');
const CleanCSS = require('clean-css');

const D = __dirname, SRC = path.join(D, 'src'), CSSSRC = path.join(SRC, 'css'), RTSRC = path.join(D, 'runtime-src');
const md5 = b => crypto.createHash('md5').update(b).digest('hex');
const RAW = process.argv.includes('--raw');
const CHECK = process.argv.includes('--check');
const fail = m => { console.error('BUILD FAILED — ' + m); process.exit(1); };

/* ---------- 1) นิยาม Chunk ----------
   ลำดับไฟล์ในแต่ละ chunk = ลำดับเลขนำหน้าเหมือนเดิม (deterministic)
   core รวม 01–06 ไว้ไฟล์เดียวโดยเจตนา — เหตุผลใน RUNTIME_SPLIT_REPORT.md §สถาปัตยกรรม */
const CHUNKS = {
  core: { files: ['01-core-icons-utils.js', '02-store.js', '03-ui-toast-modal.js', '04-router-guards.js',
                  '05-layout-shell.js', '06-auth-supabase.js', '06-core-shared-boot.js'],
          out: 'runtime/core.js', deps: [] },
  /* dashboard ต้องใช้ lvType() แปลงรหัสประเภทการลาที่ RPC ส่งมาเป็นชื่อไทย
     (การ์ด "คำขอลาล่าสุด" อ่านจาก Supabase ไม่ใช่ db.leaveTypes ใน localStorage อีกต่อไป) */
  dashboard: { files: ['07-view-dashboard.js'], out: 'views/dashboard.js', deps: ['shared-leave-meta'] },

  /* ---- Shared Feature Runtime — ไม่อยู่ใน Core จึงไม่ทำให้หน้า Login/Dashboard ใหญ่ขึ้น ---- */
  'shared-emp-meta':   { files: ['20-shared-emp-meta.js'],   out: 'runtime/shared/emp-meta.js',      deps: [] },
  'shared-hr-meta':    { files: ['21-shared-hr-meta.js'],    out: 'runtime/shared/hr-meta.js',       deps: [] },
  'shared-report':     { files: ['22-shared-report.js'],     out: 'runtime/shared/report-export.js', deps: [] },
  'shared-requests':   { files: ['23-shared-requests.js'],   out: 'runtime/shared/requests.js',      deps: [] },
  'shared-leave-meta': { files: ['24-shared-leave-meta.js'], out: 'runtime/shared/leave-meta.js',    deps: [] },
  'shared-attachments':{ files: ['25-shared-attachments.js'],out: 'runtime/shared/attachments.js',   deps: [] },

  /* ---- Feature Chunk (หน้าหลัก) ---- */
  employees:          { files: ['30-view-employees.js'],         out: 'views/employees/list.js',
                        deps: ['shared-emp-meta', 'shared-hr-meta'] },
  attendance:         { files: ['33-view-attendance.js'],        out: 'views/attendance/main.js',
                        deps: ['shared-report', 'shared-requests'] },
  'requests-leave':   { files: ['34-view-requests-leave.js'],    out: 'views/leave/main.js',
                        deps: ['shared-requests', 'shared-hr-meta', 'shared-leave-meta'] },
  ot:                 { files: ['35-view-ot.js'],                out: 'views/ot/main.js',
                        deps: ['shared-requests'] },
  'attendance-report':{ files: ['36-view-attendance-report.js'], out: 'views/attendance/report.js',
                        deps: ['shared-report', 'shared-requests', 'shared-emp-meta', 'shared-leave-meta'] },
  /* เมนู REPORT ลางาน / REPORT OT — หน้าคอมพิวเตอร์
     แยกเป็น chunk ของตัวเอง ไม่ผูกกับ attendance-report เพื่อไม่ให้รายงานเดิมโตขึ้น */
  'report-menu':      { files: ['37-view-report-menu.js'],       out: 'views/reports/menu.js',
                        deps: ['shared-report', 'shared-leave-meta'] },

  /* ---- Action Module — โหลดเมื่อกดปุ่มจริงเท่านั้น ----
     exports = สิ่งที่ Module อื่นเรียกผ่าน NJHR.features.* (property access ตรวจด้วย word-boundary ไม่ได้) */
  'employees-form':      { files: ['40-view-employees-form.js'],        out: 'views/employees/form.js',
                           deps: ['employees', 'shared-emp-meta', 'shared-hr-meta'] },
  'employees-documents': { files: ['41-view-employees-documents.js'],   out: 'views/employees/documents.js',
                           deps: ['employees', 'shared-hr-meta'] },
  'employees-import':    { files: ['31-view-employees-import.js'],      out: 'views/employees/import.js',
                           deps: ['employees', 'shared-report', 'shared-emp-meta'], exports: ['empImportForm', 'empTemplate'] },
  'employees-export':    { files: ['32-view-employees-export.js'],      out: 'views/employees/export.js',
                           deps: ['employees', 'shared-report', 'shared-emp-meta'], exports: ['empExport'] },
  'attendance-correction': { files: ['42-view-attendance-correction.js'], out: 'views/attendance/correction.js',
                           deps: ['attendance'] },
  'leave-form':          { files: ['43-view-leave-form.js'],            out: 'views/leave/form.js',
                           deps: ['requests-leave', 'shared-leave-meta', 'shared-attachments', 'shared-requests'] },
  'request-detail':      { files: ['44-view-request-detail.js'],        out: 'views/leave/detail.js',
                           deps: ['requests-leave', 'shared-requests', 'shared-hr-meta', 'shared-leave-meta'] },
  'ot-form':             { files: ['45-view-ot-form.js'],               out: 'views/ot/form.js',
                           deps: ['ot', 'shared-requests', 'shared-attachments'] },

  /* โปรไฟล์ + เอกสารของฉัน — 2 หน้าที่พนักงานมือถือเปิดบ่อยที่สุด
     แยกออกจาก app-legacy.js เพื่อไม่ให้ต้องลากก้อนใหญ่ทั้งก้อนมาด้วย
     ใช้ Pattern เดียวกับ attendance / leave / ot / employees ที่แยกไว้แล้ว */
  'profile-docs': { files: ['14-view-profile-hrdocs.js'], out: 'views/profile/main.js',
                    deps: ['shared-emp-meta', 'shared-hr-meta', 'shared-report',
                           'shared-requests', 'shared-attachments'] },

  /* ปฏิทินองค์กร + การแจ้งเตือน — 2 หน้าที่พนักงานมือถือเปิดบ่อย
     แยกออกจาก app-legacy.js ด้วย Pattern เดียวกับ attendance / leave / ot / employees
     Badge แจ้งเตือนอยู่ใน runtime/core.js อยู่แล้ว จึงไม่ต้องโหลดโมดูลนี้เพื่อแสดง Badge */
  calendar:      { files: ['17-view-calendar.js'],      out: 'views/calendar/main.js',
                   deps: ['shared-report'] },
  notifications: { files: ['18-view-notifications.js'], out: 'views/notifications/main.js', deps: [] },

  compatibility: { files: ['11-view-approvals-payroll.js', '12-view-reports-settings.js',
                           '13-view-admin-users.js'],
                   out: 'compat/app-legacy.js',
                   deps: ['shared-emp-meta', 'shared-hr-meta', 'shared-report', 'shared-requests',
                          'shared-leave-meta', 'shared-attachments'] }
};
/* ---------- 2) ตรวจว่าไฟล์ src ทุกตัวถูกจัดเข้า chunk ครบ ---------- */
const onDisk = fs.readdirSync(SRC).filter(f => /^\d{2}-.*\.js$/.test(f)).sort();
const inChunks = Object.keys(CHUNKS).reduce((a, k) => a.concat(CHUNKS[k].files), []);
onDisk.forEach(f => { if (inChunks.indexOf(f) < 0) fail('ไฟล์ src/' + f + ' ไม่ได้อยู่ใน chunk ใดเลย'); });
inChunks.forEach(f => { if (onDisk.indexOf(f) < 0) fail('chunk อ้างไฟล์ที่ไม่มีจริง: src/' + f); });

const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');
const body = {};
Object.keys(CHUNKS).forEach(k => { body[k] = CHUNKS[k].files.map(read).join(''); });

/* ---------- 3) หา symbol ระดับ closure (top-level) ของแต่ละ chunk ---------- */
function topLevel(src) {
  const out = { fn: [], vr: [] };
  let m, re = /^  function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
  while ((m = re.exec(src))) out.fn.push(m[1]);
  /* var หนึ่งคำสั่งอาจประกาศหลายตัว เช่น `var a = [], b = 0, c = false;`
     ต้องเก็บให้ครบทุกตัว ไม่ใช่แค่ตัวแรก มิฉะนั้น chunk อื่นจะอ้างถึงแล้วหาไม่เจอตอนรัน */
  re = /^  var\s+/gm;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length, d = 0, instr = null, expectName = true, buf = '';
    for (; i < src.length; i++) {
      const c = src[i];
      if (instr) { if (c === '\\') { i++; continue; } if (c === instr) instr = null; continue; }
      if (c === '\'' || c === '"' || c === '`') { instr = c; continue; }
      if ('([{'.indexOf(c) >= 0) { d++; continue; }
      if (')]}'.indexOf(c) >= 0) { d--; continue; }
      if (d > 0) continue;
      if (c === ';') { if (expectName && buf.trim()) out.vr.push(buf.trim()); break; }
      if (c === ',') {
        if (expectName && buf.trim()) out.vr.push(buf.trim());
        buf = ''; expectName = true; continue;
      }
      if (c === '=') {
        if (expectName && buf.trim()) out.vr.push(buf.trim());
        buf = ''; expectName = false; continue;
      }
      if (expectName) buf += c;
    }
  }
  out.vr = out.vr.filter(n => /^[A-Za-z_$][\w$]*$/.test(n));
  return out;
}
const decl = {};
Object.keys(CHUNKS).forEach(k => {
  const t = topLevel(body[k]);
  decl[k] = { fn: t.fn, vr: t.vr, all: t.fn.concat(t.vr) };
});

/* ตรวจชื่อซ้ำข้าม chunk (Duplicate Global ระดับ closure) */
{
  const seen = {};
  Object.keys(decl).forEach(k => decl[k].all.forEach(n => {
    if (seen[n] && seen[n] !== k) fail('สัญลักษณ์ `' + n + '` ประกาศซ้ำใน chunk ' + seen[n] + ' และ ' + k);
    seen[n] = k;
  }));
}

/* ---------- 5) Route → View → Module mapping (อ่านจาก ROUTES ตัวจริง) ---------- */
const routesSrc = read('04-router-guards.js');
const routeRe = /'(#\/[a-z-]+)':\s*\{[^}]*?view:\s*'([A-Za-z_$][\w$]*)'[^}]*?mod:\s*'([a-z-]+)'/g;
const routeMap = [];
let rm; while ((rm = routeRe.exec(routesSrc))) routeMap.push({ route: rm[1], view: rm[2], mod: rm[3] });
if (!routeMap.length) fail('อ่าน ROUTES ไม่ได้');
const provides = {};
routeMap.forEach(r => {
  if (!CHUNKS[r.mod]) fail('Route ' + r.route + ' ชี้ไป module `' + r.mod + '` ที่ไม่มีจริง');
  if (decl[r.mod].fn.indexOf(r.view) < 0)
    fail('Route ' + r.route + ' ต้องการ view `' + r.view + '` แต่ไม่พบใน chunk ' + r.mod);
  (provides[r.mod] = provides[r.mod] || []);
  if (provides[r.mod].indexOf(r.view) < 0) provides[r.mod].push(r.view);
});
/* view ที่ประกาศแต่ไม่มี route → รายงาน (ไม่ fail) · route ที่ไม่มี view → fail ไปแล้วข้างบน */
Object.keys(CHUNKS).forEach(k => {
  if (k === 'core') return;
  decl[k].fn.filter(n => /^view[A-Z]/.test(n)).forEach(n => {
    if ((provides[k] || []).indexOf(n) < 0) console.warn('  เตือน: ' + n + ' ใน ' + k + ' ไม่ถูกอ้างจาก ROUTES');
  });
});

/* ---------- 4) Scope Injection + ตรวจ Dependency ระหว่าง chunk ----------
   ไม่มีการเดา: อ่านจาก symbol จริงที่ chunk นั้นอ้างถึงจริงเท่านั้น
   core และ shared/feature chunk เปิดเผยผ่าน NJHR.compat.scope ตัวเดียวกัน
   ลำดับการโหลดถูกบังคับด้วย deps ใน Asset Manifest */
const ref = (src, n) => new RegExp('(?<![\\w$.])' + n.replace(/\$/g, '\\$') + '(?![\\w$])').test(src);
const NAMES = Object.keys(CHUNKS);

/* ตรวจ Circular Dependency ก่อนอย่างอื่น */
(function () {
  const seen = {}, stack = {};
  (function walk(k, path) {
    if (stack[k]) fail('Circular Dependency: ' + path.concat(k).join(' -> '));
    if (seen[k]) return;
    seen[k] = stack[k] = 1;
    (CHUNKS[k].deps || []).forEach(d => {
      if (!CHUNKS[d]) fail('chunk ' + k + ' ประกาศ deps `' + d + '` ที่ไม่มีจริง');
      walk(d, path.concat(k));
    });
    stack[k] = 0;
  });
  NAMES.forEach(k => { const w = (kk, p) => { if (stack[kk]) fail('Circular Dependency: ' + p.concat(kk).join(' -> ')); if (seen[kk]) return; seen[kk] = stack[kk] = 1; (CHUNKS[kk].deps || []).forEach(d => { if (!CHUNKS[d]) fail('chunk ' + kk + ' ประกาศ deps `' + d + '` ที่ไม่มีจริง'); w(d, p.concat(kk)); }); stack[kk] = 0; }; w(k, []); });
})();

/* deps แบบ transitive (core มองเห็นได้จากทุก chunk เสมอ) */
const allDeps = {};
NAMES.forEach(k => {
  const out = new Set(['core']);
  (function walk(x) { (CHUNKS[x].deps || []).forEach(d => { if (!out.has(d)) { out.add(d); walk(d); } }); })(k);
  out.delete(k);
  allDeps[k] = out;
});

/* สำเนาที่ตัดคอมเมนต์แล้ว ใช้ตรวจการอ้างอิงเพื่อไม่ให้ข้อความในคอมเมนต์ทำให้ตรวจผิด */
const ana = {};
NAMES.forEach(k => {
  const wrapped = k === 'core' ? body[k] + '})();' : '(function(){' + body[k] + '})();';
  const r = minify_sync(wrapped, { ecma: 5, mangle: false, compress: false, format: { comments: false, beautify: true } });
  if (r.error) fail('analysis ' + k + ': ' + r.error);
  ana[k] = r.code;
});

const owner = {};
NAMES.forEach(k => decl[k].all.forEach(n => { owner[n] = k; }));

const inject = {}, publish = {};
NAMES.forEach(k => {
  inject[k] = []; publish[k] = new Set();
  (CHUNKS[k].exports || []).forEach(n => {
    if (decl[k].all.indexOf(n) < 0) fail('chunk ' + k + ' ประกาศ exports `' + n + '` ที่ไม่มีอยู่จริงในไฟล์');
    publish[k].add(n);
  });
});
NAMES.forEach(k => {
  Object.keys(owner).forEach(n => {
    const o = owner[n];
    if (o === k) return;
    if (routeMap.some(r => r.view === n)) return;   // ชื่อ view ใน ROUTES เป็นสตริง ไม่ใช่การอ้างอิง
    if (!ref(ana[k], n)) return;
    if (!allDeps[k].has(o)) fail('chunk ' + k + ' อ้าง `' + n + '` ซึ่งอยู่ใน chunk ' + o + ' แต่ไม่ได้ประกาศเป็น deps');
    inject[k].push(n);
    publish[o].add(n);
  });
});
/* ห้าม chunk เขียนค่าทับ symbol ที่รับมาจาก chunk อื่น (จะไม่สะท้อนกลับ) */
NAMES.forEach(k => inject[k].forEach(n => {
  const re = new RegExp('(?<![\\w$.\\-])' + n.replace(/\$/g, '\\$') + '\\s*(=(?!=)|\\+\\+|--|\\+=|-=)', 'g');
  const decl2 = new RegExp('\\b(var|let|const)\\b[^;]*\\b' + n.replace(/\$/g, '\\$') + '\\s*=');
  const fnStarts = [];
  let fm, fre = /^  function\s+[A-Za-z_$][\w$]*\s*\(/gm;
  while ((fm = fre.exec(body[k]))) fnStarts.push(fm.index);
  let mm;
  while ((mm = re.exec(body[k]))) {
    const before = body[k].slice(0, mm.index);
    const lineStart = before.lastIndexOf('\n') + 1;
    const nl = body[k].indexOf('\n', mm.index);
    const line = body[k].slice(lineStart, nl < 0 ? body[k].length : nl);
    if (decl2.test(line)) continue;
    let a2 = 0, b2 = body[k].length;
    for (let i2 = 0; i2 < fnStarts.length; i2++) {
      if (fnStarts[i2] <= mm.index) { a2 = fnStarts[i2]; b2 = fnStarts[i2 + 1] === undefined ? body[k].length : fnStarts[i2 + 1]; }
    }
    if (new RegExp('\\bvar\\b[^;\n]*\\b' + n.replace(/\$/g, '\\$') + '\\b').test(body[k].slice(a2, b2))) continue;
    fail('chunk ' + k + ' เขียนค่าทับ symbol `' + n + '` ของ chunk ' + owner[n] +
         ' ที่บรรทัด ' + (before.split('\n').length) + ' — ต้องผ่าน NJHR.state adapter หรือย้ายเจ้าของ');
  }
}));

/* ---------- 7) ประกอบไฟล์ผลลัพธ์ ---------- */
const coreExtra =
  '\n  /* ---------- Public Contract (สร้างอัตโนมัติจาก symbol จริง) ---------- */\n' +
  '  NJHR.compat.scope = NJHR.compat.scope || {};\n' +
  '  Object.keys(ROUTES).forEach(function (h) {\n' +
  '    NJHR.router.moduleMap[h.replace("#/", "")] = ROUTES[h].mod ? [ROUTES[h].mod] : [];\n' +
  '  });\n' +
  '  NJHR.core.render = render; NJHR.core.nav = nav; NJHR.core.canAccess = canAccess;\n' +
  '  NJHR.auth.logout = doLogout; NJHR.auth.currentUser = currentUser;\n' +
  '  NJHR.ui.toast = toast; NJHR.ui.openModal = openModal; NJHR.ui.closeModal = closeModal;\n' +
  '  NJHR.layout.refreshMenuBadge = refreshMenuBadge;\n';

function pubLines(k) {
  const list = [...publish[k]].sort();
  if (!list.length) return '';
  return '  NJHR.compat.scope.' + '' + '' +
    (list.length ? '' : '') +
    list.map(n => 'NJHR.compat.scope.' + n + ' = ' + n + ';').join('\n  ').replace(/^/, '') + '\n';
}
function pubBlock(k) {
  const list = [...publish[k]].sort();
  if (!list.length) return '';
  return '  ' + list.map(n => 'NJHR.compat.scope.' + n + ' = ' + n + ';').join('\n  ') + '\n';
}

function wrapChunk(k) {
  if (k === 'core') {
    return body.core + coreExtra + pubBlock('core') + '})();\n';
  }
  const lines = inject[k].map(n => '  var ' + n + ' = S.' + n + ';').join('\n');
  const reg = (provides[k] || []).map(v => "  NJHR.views.register('" + v + "', " + v + ');').join('\n');
  return '(function () {\n  \'use strict\';\n' +
    '  var S = window.NJHR && NJHR.compat && NJHR.compat.scope;\n' +
    '  if (!S) throw new Error(\'RUNTIME_NOT_READY\');\n' +
    lines + '\n' + body[k] + '\n' + pubBlock(k) + reg + '\n})();\n';
}

function mini(code, label) {
  if (RAW) return code;
  const r = minify_sync(code, { ecma: 5, mangle: false, compress: false,
                                format: { comments: false, beautify: false, ascii_only: false } });
  if (r.error) fail(label + ': ' + r.error);
  return r.code + '\n';
}
function buildCSS(name) {
  const raw = fs.readFileSync(path.join(CSSSRC, name), 'utf8');
  if (RAW) return raw;
  const out = new CleanCSS({ level: { 1: { all: true, specialComments: 0 }, 2: false },
                             format: false, rebase: false }).minify(raw);
  if (out.errors.length) fail('CSS ' + name + ': ' + out.errors.join('\n'));
  return out.styles + '\n';
}

const outFiles = {};
outFiles['runtime/namespace.js'] = mini(fs.readFileSync(path.join(RTSRC, 'namespace.js'), 'utf8'), 'namespace');
Object.keys(CHUNKS).forEach(k => { outFiles[CHUNKS[k].out] = mini(wrapChunk(k), k); });
const css1 = buildCSS('styles.css'), css2 = buildCSS('mobile.css');
outFiles['styles.css'] = css1; outFiles['mobile.css'] = css2;

/* Syntax check ทุก output ก่อนเขียนลงดิสก์ */
Object.keys(outFiles).forEach(f => {
  if (!/\.js$/.test(f)) return;
  try { new vm.Script(outFiles[f], { filename: f }); }
  catch (e) { fail('syntax ' + f + ': ' + e.message); }
});

/* ---------- 8) Build ID + hash แยกต่อไฟล์ ---------- */
const hash = {};
Object.keys(outFiles).forEach(f => { hash[f] = md5(outFiles[f]).slice(0, 8); });
const stamp = md5(Object.keys(outFiles).sort().map(f => f + ':' + hash[f]).join('|')).slice(0, 8);
const q = f => f + '?v=' + hash[f];

const RUNTIME_KEYS = ['core'];
const modulesObj = {};
NAMES.forEach(k => {
  if (k === 'core') return;
  modulesObj[k] = { url: q(CHUNKS[k].out), deps: (CHUNKS[k].deps || []).slice(), provides: (provides[k] || []).slice() };
});
const manifest =
  '/* asset-manifest.js — สร้างอัตโนมัติจาก build.js ห้ามแก้ด้วยมือ\n' +
  '   URL ของ Asset ทุกตัวประกาศที่นี่ที่เดียว · ไม่มีข้อมูลลับ */\n' +
  'window.NJHR_ASSETS = ' + JSON.stringify({
    buildId: 'njhr-v2-' + stamp,
    runtime: { namespace: q('runtime/namespace.js'), core: q('runtime/core.js') },
    modules: modulesObj,
    styles: { main: q('styles.css'), mobile: q('mobile.css') }
  }, null, 2) + ';\n';
outFiles['asset-manifest.js'] = manifest;
hash['asset-manifest.js'] = md5(manifest).slice(0, 8);   // ต้องคำนวณหลังสร้าง manifest เสร็จ

/* ---------- 9) เขียน Build ID ลง sw.js / config.js / index.html ---------- */
const swPath = path.join(D, 'sw.js'), swSrc = fs.readFileSync(swPath, 'utf8');
const swOut = swSrc
  .replace(/const V = 'njhr-v2-[^']*';/, "const V = 'njhr-v2-" + stamp + "';")
  .replace(/const CORE = \[[\s\S]*?\];/,
    'const CORE = ' + JSON.stringify(['./', './index.html', './asset-manifest.js?v=' + hash['asset-manifest.js'],
      './' + q('runtime/namespace.js'), './' + q('runtime/core.js'),
      './' + q('styles.css'), './' + q('mobile.css'), './assets/nj-logistic-logo.png']) + ';')
  .replace(/const LAZY_PATHS = \[[^\]]*\];/,
    'const LAZY_PATHS = ' + JSON.stringify(
      NAMES.filter(k => k !== 'core').map(k => CHUNKS[k].out.split('/').pop())
        .concat(['face.js', 'face.css', 'master-salary.js', 'report-template.js'])
        .filter((v, i, a2) => a2.indexOf(v) === i)) + ';');

const cfgPath = path.join(D, 'config.js'), cfgSrc = fs.readFileSync(cfgPath, 'utf8');
const cfgOut = cfgSrc.replace(/window\.NJHR_BUILD_VERSION\s*=\s*'[^']*';/,
  "window.NJHR_BUILD_VERSION = 'njhr-v2-" + stamp + "';");

const idxPath = path.join(D, 'index.html'), idxSrc = fs.readFileSync(idxPath, 'utf8');
const idxOut = idxSrc
  .replace(/styles\.css\?v=(__BUILD__|[0-9a-zA-Z]+)/g, q('styles.css'))
  .replace(/mobile\.css\?v=(__BUILD__|[0-9a-zA-Z]+)/g, q('mobile.css'))
  .replace(/asset-manifest\.js\?v=(__BUILD__|[0-9a-zA-Z]+)/g, q('asset-manifest.js'))
  .replace(/mock-data\.js\?v=(__BUILD__|[0-9a-zA-Z]+)/g, 'mock-data.js?v=' + stamp);

if (CHECK) {
  let same = true, diff = [];
  Object.keys(outFiles).forEach(f => {
    const p = path.join(D, f);
    if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== outFiles[f]) { same = false; diff.push(f); }
  });
  if (swSrc !== swOut) { same = false; diff.push('sw.js'); }
  if (cfgSrc !== cfgOut) { same = false; diff.push('config.js'); }
  if (idxSrc !== idxOut) { same = false; diff.push('index.html'); }
  console.log(same ? 'ตรงกัน  ไฟล์ deploy = src/  (build ' + stamp + ')'
                   : 'ไม่ตรงกัน  ต้องรัน node build.js ใหม่ → ' + diff.join(', '));
  process.exit(same ? 0 : 1);
}

Object.keys(outFiles).forEach(f => {
  const p = path.join(D, f);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, outFiles[f]);
});
if (swOut !== swSrc) fs.writeFileSync(swPath, swOut);
if (cfgOut !== cfgSrc) fs.writeFileSync(cfgPath, cfgOut);
if (idxOut !== idxSrc) fs.writeFileSync(idxPath, idxOut);

/* ---------- 10) ตรวจว่า Asset ทุกตัวใน manifest มีอยู่จริง ---------- */
JSON.parse(manifest.slice(manifest.indexOf('{'), manifest.lastIndexOf('}') + 1));
[q('runtime/namespace.js'), q('styles.css'), q('mobile.css')]
  .concat(NAMES.map(k => q(CHUNKS[k].out))).forEach(u => {
  const f = path.join(D, u.split('?')[0]);
  if (!fs.existsSync(f)) fail('manifest ชี้ไฟล์ที่ไม่มีจริง: ' + u);
});

/* ---------- 11) Bundle Size Report ---------- */
const zlib = require('zlib');
const rows = [];
function row(f) {
  const b = fs.readFileSync(path.join(D, f));
  rows.push({ f: f, raw: b.length, gz: zlib.gzipSync(b, { level: 9 }).length });
}
['index.html', 'config.js', 'asset-manifest.js', 'runtime/namespace.js', 'runtime/core.js', 'styles.css', 'mobile.css']
  .concat(NAMES.filter(k => k !== 'core').map(k => CHUNKS[k].out))
  .concat(['sw.js']).forEach(row);
const report = ['# Bundle Size Report — build ' + stamp, '',
  '| ไฟล์ | raw | gzip -9 | hash |', '|---|---:|---:|---|'].concat(
  rows.map(r => '| `' + r.f + '` | ' + r.raw + ' | ' + r.gz + ' | `' + (hash[r.f] || '—') + '` |')).join('\n') + '\n';
fs.writeFileSync(path.join(D, 'BUNDLE_SIZE_REPORT.md'), report);

console.log('Build ' + stamp + (RAW ? '  (--raw ไม่ minify)' : ''));
rows.forEach(r => console.log('  ' + r.f.padEnd(24) + String(r.raw).padStart(9) + ' B   gzip ' + String(r.gz).padStart(8) + ' B'));
console.log('  chunk'.padEnd(22) + 'publish'.padStart(8) + 'inject'.padStart(8) + 'view'.padStart(6) + '  deps');
NAMES.forEach(k => console.log('  ' + k.padEnd(20) + String(publish[k].size).padStart(8) + String(inject[k].length).padStart(8) +
  String((provides[k] || []).length).padStart(6) + '  ' + ((CHUNKS[k].deps || []).join(',') || '-')));
console.log('  Route mapping: ' + routeMap.length + ' route · Module: ' + (NAMES.length - 1));
